import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import type { FetchResult } from "@apollo/client";
import type { User, AuthState } from "@/types";
import { LOGIN, SIGNUP } from "@/graphql/mutations";
import { GET_ME } from "@/graphql/queries";
import { apolloClient, storage } from "@/graphql/client";

interface ActiveDevice {
  _id: string;
  deviceId: string;
  deviceName?: string;
  userAgent?: string;
  ip?: string;
  lastLoginAt: string;
}

interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  userAgent: string;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ deviceLimitReached?: boolean; activeDevices?: ActiveDevice[] }>;
  resolveDeviceConflict: (email: string, password: string, deviceIdToLogout: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
  deviceInfo: DeviceInfo;
}

// ─── Helper types matching our GQL schema ────────────────────────
interface LoginMutationData {
  login: {
    code: number;
    success: boolean;
    message: string;
    accessToken?: string;
    refreshToken?: string;
    user?: User;
    deviceLimitReached?: boolean;
    activeDevices?: ActiveDevice[];
  };
}

interface ResolveConflictMutationData {
  resolveDeviceConflict: {
    code: number;
    success: boolean;
    message: string;
    accessToken?: string;
    refreshToken?: string;
    user?: User;
  };
}

interface SignupMutationData {
  signup: {
    code: number;
    success: boolean;
    message: string;
    user: User;
  };
}

interface MeResponse {
  me: {
    code: number;
    success: boolean;
    message: string;
    user: User | null;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return "Browser";
}

function getDeviceInfo(): DeviceInfo {
  return {
    deviceId: storage.getDeviceId(),
    deviceName: getBrowserName(),
    userAgent: navigator.userAgent,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const deviceInfo = getDeviceInfo();

  const [state, setState] = useState<AuthState>(() => {
    const accessToken = storage.getAccessToken();
    const refreshTokenVal = storage.getRefreshToken();
    let user: User | null = null;
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        user = payload.user ?? null;
      } catch {
        /* ignore malformed token */
      }
    }
    return {
      user,
      isAuthenticated: !!accessToken,
      isLoading: false,
      accessToken,
      refreshToken: refreshTokenVal,
    };
  });

  const [loginMutation] = useMutation<LoginMutationData>(LOGIN);
  const [signupMutation] = useMutation<SignupMutationData>(SIGNUP);

  // Sync user profile from server on mount/refresh if we have a token
  const { data: meData } = useQuery<MeResponse>(GET_ME, {
    skip: !state.accessToken || !!state.user,
  });

  React.useEffect(() => {
    if (meData?.me?.success && meData?.me?.user) {
      setState((prev) => ({
        ...prev,
        user: meData.me.user,
        isAuthenticated: true,
      }));
    }
  }, [meData]);

  const login = useCallback(
    async (email: string, password: string) => {
      setState((s) => ({ ...s, isLoading: true }));
      try {
        let result: FetchResult<LoginMutationData>;
        try {
          result = await loginMutation({
            variables: {
              input: {
                email,
                password,
                deviceId: deviceInfo.deviceId,
                deviceName: deviceInfo.deviceName,
                userAgent: deviceInfo.userAgent,
                // ip: "",
              },
            },
          });
        } catch (networkErr: unknown) {
          // Network-level or GraphQL errors thrown by Apollo
          const errMsg = networkErr instanceof Error ? networkErr.message : "Login failed";
          throw new Error(errMsg);
        }

        const { data, errors } = result;

        if (errors?.length) {
          throw new Error(errors[0].message);
        }

        if (!data?.login) {
          throw new Error("Login failed — no response from server. Check your connection and CORS settings.");
        }

        const { accessToken, refreshToken, user, success, message, deviceLimitReached, activeDevices } = data.login;

        if (deviceLimitReached) {
          setState((s) => ({ ...s, isLoading: false, isAuthenticated: false }));
          return { deviceLimitReached: true, activeDevices: activeDevices ?? [] };
        }

        if (!success || !accessToken) {
          throw new Error(message || "Login failed - check credentials or device connection.");
        }

        storage.setAccessToken(accessToken);
        storage.setRefreshToken(refreshToken!);

        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          accessToken,
          refreshToken,
        });

        return {};
      } catch (err: unknown) {
        setState((s) => ({ ...s, isLoading: false }));
        throw err;
      }
    },
    [loginMutation, deviceInfo]
  );

  const [resolveConflictMutation] = useMutation<ResolveConflictMutationData>(
    gql`
      mutation ResolveDeviceConflict($input: ResolveDeviceConflictInput!) {
        resolveDeviceConflict(input: $input) {
          code
          success
          message
          accessToken
          refreshToken
          user {
            _id
            email
            name
            role
            avatar
          }
        }
      }
    `
  );

  const resolveDeviceConflict = useCallback(
    async (email: string, password: string, deviceIdToLogout: string) => {
      setState((s) => ({ ...s, isLoading: true }));
      try {
        const result = await resolveConflictMutation({
          variables: {
            input: {
              email,
              password,
              deviceIdToLogout,
              deviceId: deviceInfo.deviceId,
              deviceName: deviceInfo.deviceName,
              userAgent: deviceInfo.userAgent,
            },
          },
        });

        const data = result.data?.resolveDeviceConflict;
        if (!data?.success || !data?.accessToken) {
          throw new Error(data?.message || "Conflict resolution failed");
        }

        storage.setAccessToken(data.accessToken);
        storage.setRefreshToken(data.refreshToken!);

        setState({
          user: data.user!,
          isAuthenticated: true,
          isLoading: false,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken!,
        });
      } catch (err: unknown) {
        setState((s) => ({ ...s, isLoading: false }));
        throw err;
      }
    },
    [resolveConflictMutation, deviceInfo]
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      setState((s) => ({ ...s, isLoading: true }));
      try {
        let result: import("@apollo/client").FetchResult<SignupMutationData>;
        try {
          result = await signupMutation({
            variables: { input: { name, email, password } },
          });
        } catch (networkErr: unknown) {
          throw new Error(networkErr instanceof Error ? networkErr.message : "Signup failed");
        }
        const { data } = result;
        if (!data?.signup?.success) {
          throw new Error(data?.signup?.message ?? "Signup failed");
        }
      } finally {
        setState((s) => ({ ...s, isLoading: false }));
      }
    },
    [signupMutation]
  );

  const logout = useCallback(() => {
    storage.clearTokens();
    apolloClient.clearStore();
    setState({ user: null, isAuthenticated: false, isLoading: false, accessToken: null, refreshToken: null });
  }, []);

  const hasRole = useCallback(
    (roles: string[]) => {
      if (!state.user) return false;
      return roles.includes(state.user.role);
    },
    [state.user]
  );

  return (
    <AuthContext.Provider value={{ ...state, login, resolveDeviceConflict, signup, logout, hasRole, deviceInfo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

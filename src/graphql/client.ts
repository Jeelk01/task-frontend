import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  Observable,
  from,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { REFRESH_TOKEN } from "./mutations";

const STORAGE_KEYS = {
  ACCESS_TOKEN: "taskapp_access_token",
  REFRESH_TOKEN: "taskapp_refresh_token",
  DEVICE_ID: "taskapp_device_id",
};

export const storage = {
  getAccessToken: () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
  setAccessToken: (t: string) => localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, t),
  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  setRefreshToken: (t: string) => localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, t),
  clearTokens: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
  getDeviceId: () => {
    let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!id) {
      id = generateDeviceId();
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
    }
    return id;
  },
};

function generateDeviceId(): string {
  const nav = navigator;
  const raw = [
    nav.userAgent,
    nav.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
  ].join(":");
  // Simple hash for deterministic fingerprint
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `device_${Math.abs(hash).toString(16)}_${Date.now().toString(36)}`;
}

// ─── Auth link — injects Bearer token ─────────────────────────
const authLink = new ApolloLink((operation, forward) => {
  const token = storage.getAccessToken();
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }));
  return forward(operation);
});

// ─── Error / Refresh link ─────────────────────────────────────
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

const processPendingQueue = (token: string | null, error?: unknown) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  pendingQueue = [];
};

const forceLogout = (reason?: string) => {
  console.error(`[Auth] Forcing logout. Reason: ${reason || "Unspecified"}`);
  storage.clearTokens();
  localStorage.clear(); // Complete wipe
  const url = reason ? `/login?reason=${reason}` : "/login";
  window.location.replace(url);
};

const refreshLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {

    forward(operation).subscribe({
      next: async (result) => {

        const errors = result?.errors || [];

        const authError = errors.find((e: any) => {
          const code = e.extensions?.code || e.code;
          const msg = (e.message || "").toLowerCase();

          return (
            code === "UNAUTHENTICATED" ||
            (code === "NOT_FOUND" && msg.includes("device login not found")) ||
            msg.includes("expired") ||
            msg.includes("unauthenticated") ||
            msg.includes("invalid") ||
            msg.includes("revoked") ||
            msg.includes("signed in on another device")
          );
        });

        if (!authError) {
          observer.next(result);
          observer.complete();
          return;
        }

        const reason = authError.message;
        console.log(`Auth error detected: ${reason} → attempting refresh or forcing logout`);

        console.log("Token expired → refreshing");

        const refreshToken = storage.getRefreshToken();

        if (!refreshToken) {
          forceLogout("no_refresh");
          observer.error("No refresh token");
          return;
        }

        try {
          const { data } = await apolloClient.mutate<any>({
            mutation: REFRESH_TOKEN,
            variables: { input: { refreshToken } },
          });

          const newToken = data?.refreshToken?.accessToken;

          storage.setAccessToken(newToken);

          operation.setContext(({ headers = {} }) => ({
            headers: {
              ...headers,
              Authorization: `Bearer ${newToken}`,
            },
          }));

          forward(operation).subscribe(observer);

        } catch (e) {
          forceLogout(reason || "expired");
          observer.error(e);
        }
      },

      error: (err) => observer.error(err),
    });

  });
});

// ─── Logger link — Intercepts all responses ────────────────────
const loggerLink = new ApolloLink((operation, forward) => {
  const startTime = Date.now();
  console.log(`%c[GQL Request] ${operation.operationName}`, "color: #3b82f6; font-weight: bold", {
    variables: operation.variables,
  });

  return new Observable((observer) => {
    const subscription = forward(operation).subscribe({
      next: (response) => {
        const elapsed = Date.now() - startTime;
        console.log(`%c[GQL Response] ${operation.operationName} (${elapsed}ms)`, "color: #10b981; font-weight: bold", {
          data: response.data,
          errors: response.errors,
        });
        observer.next(response);
      },
      error: (err) => {
        const elapsed = Date.now() - startTime;
        console.error(`%c[GQL Error] ${operation.operationName} (${elapsed}ms)`, "color: #ef4444; font-weight: bold", err);
        observer.error(err);
      },
      complete: () => observer.complete(),
    });

    return () => subscription.unsubscribe();
  });
});

const getGqlUrl = () => {
  const envUrl = import.meta.env.VITE_GRAPHQL_URL;
  if (envUrl) return envUrl;

  const origin = window.location.origin;
  if (origin.includes('.devtunnels.ms')) {
    // Transform frontend dev tunnel (...-8080 or ...-5173) to backend dev tunnel (...-4000)
    return origin.replace(/-8080\./, '-4000\.').replace(/-5173\./, '-4000\.') + '/graphql';
  }

  return "http://localhost:4000/graphql";
};

const httpLink = new HttpLink({
  uri: getGqlUrl(),
});

export const apolloClient = new ApolloClient({
  link: from([loggerLink, refreshLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-and-network" },
    query: { fetchPolicy: "network-only" },
    mutate: {},
  },
});

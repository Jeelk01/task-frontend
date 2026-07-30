import { useQuery, useMutation } from "@apollo/client/react";
import type { DocumentNode, OperationVariables } from "@apollo/client";
import { toast } from "sonner";
import { storage } from "@/graphql/client";

/**
 * Checks if an Apollo Error represents an authentication failure
 */
export function isUnauthenticatedError(error: any): boolean {
  if (!error) return false;
  
  const graphQLErrors = error.graphQLErrors || [];
  const networkError = error.networkError;

  const isUnauth = graphQLErrors.some((e: any) => {
    const code = e.extensions?.code || e.code || "";
    const msg = (e.message || "").toLowerCase();
    return (
      code === "UNAUTHENTICATED" ||
      msg.includes("invalid or expired token") ||
      msg.includes("unauthenticated")
    );
  });

  const isNetworkUnauth = networkError?.statusCode === 401;

  return isUnauth || isNetworkUnauth;
}

/**
 * Standardized useQuery wrapper with error handling
 */
export function useAppQuery<TData = unknown, TVariables extends OperationVariables = OperationVariables>(
  query: DocumentNode,
  options?: Parameters<typeof useQuery<TData, TVariables>>[1]
) {
  const result = useQuery<TData, TVariables>(query, options);

  if (result.error && isUnauthenticatedError(result.error)) {
    // If it's unauth, and the app haven't redirected yet, we can force a redirect here too
    // This is a safety fallback in case the refresh link logic fails
    if (!window.location.pathname.includes("/login")) {
      console.warn("[Auth Fallback] Unauthenticated detected in useAppQuery, redirecting...");
      storage.clearTokens();
      window.location.replace("/login?reason=session_expired");
    }
  }

  if (result.error && !isUnauthenticatedError(result.error)) {
    toast.error(result.error.message);
  }

  return result;
}

/**
 * Standardized useMutation wrapper with success/error toasts
 */
export function useAppMutation<TData = unknown, TVariables extends OperationVariables = OperationVariables>(
  mutation: DocumentNode,
  options?: Parameters<typeof useMutation<TData, TVariables>>[1] & {
    successMessage?: string;
  }
) {
  const { successMessage, ...mutationOptions } = options ?? {};

  return useMutation<TData, TVariables>(mutation, {
    ...mutationOptions,
    onCompleted: (data: any) => {
      if (successMessage) toast.success(successMessage);
      (mutationOptions as any)?.onCompleted?.(data);
    },
    onError: (error: any) => {
      if (!isUnauthenticatedError(error)) {
        toast.error(error.message);
      }
      (mutationOptions as any)?.onError?.(error);
    },
  });
}

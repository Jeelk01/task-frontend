import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApolloProvider } from "@apollo/client/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { apolloClient } from "@/graphql/client";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { routes } from "@/config/routes";
import { ChatProvider } from "@/contexts/ChatContext";
import { MeetingProvider } from "@/contexts/MeetingContext";

const queryClient = new QueryClient();

const App = () => (
  <ApolloProvider client={apolloClient}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner richColors position="top-right" />
        <AuthProvider>
          <ChatProvider>
            <MeetingProvider>
              <BrowserRouter>
                <Routes>

                  {/* Public routes (no sidebar) */}
                  {routes
                    .filter((r) => r.isPublic)
                    .map((route) => (
                      <Route
                        key={route.path}
                        path={route.path}
                        element={<route.component />}
                      />
                    ))}

                  {/* Protected routes (inside sidebar layout) */}
                  <Route element={<AppLayout />}>
                    {routes
                      .filter((r) => !r.isPublic)
                      .map((route) => (
                        <Route
                          key={route.path}
                          path={route.path}
                          element={
                            <ProtectedRoute roles={route.roles}>
                              <route.component />
                            </ProtectedRoute>
                          }
                        />
                      ))}
                  </Route>
                </Routes>
              </BrowserRouter>
            </MeetingProvider>
          </ChatProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ApolloProvider>
);

export default App;

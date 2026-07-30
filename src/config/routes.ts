import type { ComponentType } from "react";

export interface RouteConfig {
  path: string;
  component: ComponentType;
  isPublic?: boolean;
  roles?: string[];
  title?: string;
}

// Auth pages (public)
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import NotFound from "@/pages/NotFound";

// App pages (protected)
import Dashboard from "@/pages/Dashboard";
import WorkspacesPage from "@/pages/WorkspacesPage";
import ProjectsPage from "@/pages/ProjectsPage";
import TasksPage from "@/pages/TasksPage";
import DevicesPage from "@/pages/DevicesPage";
import SettingsPage from "@/pages/SettingsPage";
import ShortcutsPage from "@/pages/ShortcutsPage";
import WorkspaceDetailPage from "@/pages/WorkspaceDetailPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import NotificationsPage from "@/pages/NotificationsPage";

// Admin pages
import MembershipsPage from "@/pages/admin/MembershipsPage";
import UsersAdminPage from "@/pages/admin/UsersAdminPage";

export const routes: RouteConfig[] = [
  // Public routes
  { path: "/", component: LandingPage, isPublic: true, title: "Welcome" },
  { path: "/features", component: LandingPage, isPublic: true, title: "Features" },
  { path: "/how-it-works", component: LandingPage, isPublic: true, title: "How it Works" },
  { path: "/pricing", component: LandingPage, isPublic: true, title: "Pricing" },
  { path: "/login", component: LoginPage, isPublic: true, title: "Login" },
  { path: "/signup", component: SignupPage, isPublic: true, title: "Sign Up" },
  { path: "/verify", component: VerifyEmailPage, isPublic: true, title: "Verify Email" },

  // Protected app routes
  { path: "/dashboard", component: Dashboard, title: "Dashboard" },
  { path: "/workspaces", component: WorkspacesPage, title: "Workspaces" },
  { path: "/projects", component: ProjectsPage, title: "Projects" },
  { path: "/tasks", component: TasksPage, title: "Tasks" },
  { path: "/devices", component: DevicesPage, title: "Devices" },
  { path: "/settings", component: SettingsPage, title: "Settings" },
  { path: "/shortcuts", component: ShortcutsPage, title: "Shortcuts" },
  { path: "/workspaces/:id", component: WorkspaceDetailPage, title: "Workspace Detail" },
  { path: "/projects/:id", component: ProjectDetailPage, title: "Project Detail" },
  { path: "/notifications", component: NotificationsPage, title: "Synchronization Center" },

  // Admin-only routes
  { path: "/admin/memberships", component: MembershipsPage, roles: ["ADMIN"], title: "Memberships" },
  { path: "/admin/users", component: UsersAdminPage, roles: ["ADMIN"], title: "Users" },
  { path: "/admin/subscriptions", component: Dashboard, roles: ["ADMIN"], title: "Subscriptions" }, // Dashboard stub

  // Fallback
  { path: "*", component: NotFound, isPublic: true },
];

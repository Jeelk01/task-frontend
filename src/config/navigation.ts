import type { UserRole } from "@/types";
import { LayoutDashboard, Users, Settings, FileText, BarChart3, Shield } from "lucide-react";
import type { ComponentType } from "react";

export interface NavItem {
  label: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
  roles?: UserRole[]; // If undefined, visible to all authenticated users
  children?: NavItem[];
}

export const navigationConfig: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Users",
    path: "/users",
    icon: Users,
    roles: ["admin", "manager"],
  },
  {
    label: "Reports",
    path: "/reports",
    icon: BarChart3,
    roles: ["admin", "manager", "editor"],
  },
  {
    label: "Documents",
    path: "/documents",
    icon: FileText,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
    roles: ["admin"],
  },
  {
    label: "Admin",
    path: "/admin",
    icon: Shield,
    roles: ["admin"],
  },
];

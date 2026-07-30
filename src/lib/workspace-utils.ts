import { Workspace } from "@/types";

export interface WorkspaceColorClasses {
  bg: string;
  text: string;
  border: string;
  hoverBg: string;
  hoverText: string;
  ring: string;
}

const DEFAULT_COLOR = "sage";

const COLOR_MAP: Record<string, WorkspaceColorClasses> = {
  sage: {
    bg: "bg-sage/10",
    text: "text-sage",
    border: "border-sage/20",
    hoverBg: "hover:bg-sage",
    hoverText: "group-hover:text-sage",
    ring: "ring-sage",
  },
  red: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
    hoverBg: "hover:bg-red-600",
    hoverText: "group-hover:text-red-600",
    ring: "ring-red-500",
  },
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
    hoverBg: "hover:bg-blue-600",
    hoverText: "group-hover:text-blue-600",
    ring: "ring-blue-500",
  },
  green: {
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-200",
    hoverBg: "hover:bg-green-600",
    hoverText: "group-hover:text-green-600",
    ring: "ring-green-500",
  },
  teal: {
    bg: "bg-teal-50",
    text: "text-teal-600",
    border: "border-teal-200",
    hoverBg: "hover:bg-teal-600",
    hoverText: "group-hover:text-teal-600",
    ring: "ring-teal-500",
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-200",
    hoverBg: "hover:bg-orange-600",
    hoverText: "group-hover:text-orange-600",
    ring: "ring-orange-500",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-200",
    hoverBg: "hover:bg-purple-600",
    hoverText: "group-hover:text-purple-600",
    ring: "ring-purple-500",
  },
  pink: {
    bg: "bg-pink-50",
    text: "text-pink-600",
    border: "border-pink-200",
    hoverBg: "hover:bg-pink-600",
    hoverText: "group-hover:text-pink-600",
    ring: "ring-pink-500",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
    hoverBg: "hover:bg-amber-600",
    hoverText: "group-hover:text-amber-600",
    ring: "ring-amber-500",
  },
  lime: {
    bg: "bg-lime-50",
    text: "text-lime-600",
    border: "border-lime-200",
    hoverBg: "hover:bg-lime-600",
    hoverText: "group-hover:text-lime-600",
    ring: "ring-lime-500",
  },
  cyan: {
    bg: "bg-cyan-50",
    text: "text-cyan-600",
    border: "border-cyan-200",
    hoverBg: "hover:bg-cyan-600",
    hoverText: "group-hover:text-cyan-600",
    ring: "ring-cyan-500",
  },
  rose: {
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-200",
    hoverBg: "hover:bg-rose-600",
    hoverText: "group-hover:text-rose-600",
    ring: "ring-rose-500",
  },
};

export function getWorkspaceColorClasses(workspace?: Workspace | null): WorkspaceColorClasses {
  const metaColor = workspace?.meta?.color as string | undefined;
  const color = metaColor && COLOR_MAP[metaColor] ? metaColor : DEFAULT_COLOR;
  return COLOR_MAP[color];
}

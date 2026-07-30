import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard = ({ children, className, hoverEffect = true, ...props }: GlassCardProps) => {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -4, boxShadow: "var(--shadow-lg)" } : undefined}
      className={cn(
        "glass rounded-2xl p-5 transition-shadow duration-300",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

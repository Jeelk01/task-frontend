import { motion } from "framer-motion";
import { ReactNode } from "react";
import { fadeInUp, smoothTransition } from "@/styles/animations";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const PageTransition = ({ children, className }: PageTransitionProps) => {
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={smoothTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

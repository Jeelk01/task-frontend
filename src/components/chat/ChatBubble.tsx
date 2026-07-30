import React from "react";
import { useChat } from "@/contexts/ChatContext";
import { MessageSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function ChatBubble() {
  const { isChatOpen, toggleChat, unreadCount, isConnected } = useChat();

  return (
    <div className="fixed bottom-6 right-6 z-[70] flex flex-col items-end gap-4 pointer-events-none">
      <AnimatePresence>
        {!isChatOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleChat}
            className={cn(
              "h-16 w-16 rounded-[2rem] shadow-2xl flex items-center justify-center transition-all pointer-events-auto relative group",
              isConnected ? "bg-bark text-white" : "bg-sand text-tan grayscale"
            )}
          >
            {/* Unread Badge */}
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 h-6 w-6 bg-sage text-white text-[10px] font-black rounded-full flex items-center justify-center border-4 border-white shadow-lg z-10"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Icon */}
            <div className="relative">
              <MessageSquare className="h-7 w-7 transition-transform group-hover:rotate-12" />
              {!isConnected && (
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>

            {/* Ripple Effect for New Message */}
            {unreadCount > 0 && (
              <span className="absolute inset-0 rounded-[2rem] bg-sage/20 animate-ping" />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

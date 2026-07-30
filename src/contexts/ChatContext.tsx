import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { storage } from '@/graphql/client';
import { toast } from 'sonner';
import { GET_CHAT_HISTORY, GET_WORKSPACE_FOR_CHAT } from '@/graphql/queries';
import { useAppQuery } from '@/hooks/useGraphQL';
import { getSocketUrl } from '@/lib/socket-utils';

interface Message {
  _id: string;
  workspaceId: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  content: string;
  isSystemMessage: boolean;
  createdAt: string;
}

interface ChatContextType {
  socket: Socket | null;
  messages: Message[]; // Live unread messages
  allMessages: Message[]; // Full merged history + live
  isConnected: boolean;
  joinWorkspace: (workspaceId: string) => void;
  sendMessage: (workspaceId: string, content: string) => void;
  sendTyping: (workspaceId: string, isTyping: boolean) => void;
  typingUsers: Record<string, boolean>;
  isChatOpen: boolean;
  setIsChatOpen: (isOpen: boolean) => void;
  toggleChat: () => void;
  unreadCount: number;
  loadingHistory: boolean;
  onlineUsers: Set<string>;
  loadMoreMessages: () => void;
  hasMoreMessages: boolean;
  workspaceRole: string | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, deviceInfo } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const currentWorkspaceIdRef = useRef<string | null>(null);

  useEffect(() => {
    currentWorkspaceIdRef.current = currentWorkspaceId;
  }, [currentWorkspaceId]);

  // Fetch history when workspace changes
  const { data: historyData, loading: loadingHistory, fetchMore } = useAppQuery<{ getChatHistory: { messages: Message[], totalPages: number } }>(
    GET_CHAT_HISTORY,
    {
      variables: { workspaceId: currentWorkspaceId, page: 1, limit: 50 },
      skip: !currentWorkspaceId,
      notifyOnNetworkStatusChange: true,
    }
  );
  
  // Fetch workspace role
  const { data: wsData } = useAppQuery<any>(
    GET_WORKSPACE_FOR_CHAT,
    {
      variables: { id: currentWorkspaceId },
      skip: !currentWorkspaceId || !user,
    }
  );
  
  const workspaceRole = useMemo(() => {
    if (!wsData?.findWorkspaceById || !user) return null;
    const member = wsData.findWorkspaceById.members?.find((m: any) => m._id === user._id);
    // Note: Depends on whether findWorkspaceById populates memberUsers or members array
    // Let's assume we use the role from the pagination or find workspace members query if needed.
    // Actually, let's use a simpler query for the role.
    return wsData.findWorkspaceById.myRole || null; // I should ensure findWorkspaceById returns myRole
  }, [wsData, user]);

  const loadMoreMessages = useCallback(() => {
    if (loadingHistory || !hasMoreMessages || !currentWorkspaceId) return;
    
    fetchMore({
      variables: {
        workspaceId: currentWorkspaceId,
        page: page + 1,
        limit: 50,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        setPage((p) => p + 1);
        if (page + 1 >= fetchMoreResult.getChatHistory.totalPages) {
          setHasMoreMessages(false);
        }
        return {
          getChatHistory: {
             ...fetchMoreResult.getChatHistory,
             messages: [...fetchMoreResult.getChatHistory.messages, ...prev.getChatHistory.messages]
          }
        };
      }
    });
  }, [page, hasMoreMessages, currentWorkspaceId, loadingHistory, fetchMore]);

  // Sync history
  useEffect(() => {
    if (historyData?.getChatHistory?.messages) {
      // historyData.messages is already the full merged list if fetchMore was used
      const history = [...historyData.getChatHistory.messages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      setAllMessages((prev) => {
        // Merge with any live messages that might have arrived
        const merged = [...history, ...prev];
        const unique = Array.from(new Map(merged.map(m => [m._id, m])).values());
        return unique.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
    }
  }, [historyData]);

  const toggleChat = useCallback(() => setIsChatOpen((prev) => !prev), []);

  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [isChatOpen]);

  useEffect(() => {
    if (!user) return;

    const token = storage.getAccessToken();
    const newSocket = io(getSocketUrl('chat'), {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Re-join workspace room on connect/reconnect using Ref to avoid stale closure
      if (currentWorkspaceIdRef.current) {
        newSocket.emit('joinWorkspace', { workspaceId: currentWorkspaceIdRef.current });
      }
    });
    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.on('newMessage', (message: Message) => {
      setMessages((prev) => [...prev, message]);
      setAllMessages((prev) => {
        if (prev.some(m => m._id === message._id)) return prev;
        return [...prev, message].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });

      setIsChatOpen((currentOpen) => {
        if (!currentOpen) setUnreadCount((prev) => prev + 1);
        return currentOpen;
      });
    });

    newSocket.on('userTyping', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      setTypingUsers((prev) => ({ ...prev, [userId]: isTyping }));
    });

    newSocket.on('onlineUsers', (userIds: string[]) => {
      setOnlineUsers(new Set(userIds));
    });

    newSocket.on('connect_error', async (err: any) => {
      console.warn('Chat socket connection error:', err.message);
      if (err.message.includes('auth') || err.message.includes('token')) {
        const newToken = storage.getAccessToken();
        if (newToken) {
          newSocket.auth = { token: `Bearer ${newToken}` };
          newSocket.connect();
        }
      }
    });

    // Real-Time Device Revocation Listeners
    newSocket.on('forceLogout', ({ deviceId }: { deviceId: string }) => {
      if (deviceInfo.deviceId === deviceId) {
        toast.error('Your session was remotely revoked by another device.');
        logout();
      }
    });

    newSocket.on('forceLogoutAllExcept', ({ userId, exceptDeviceId }: { userId: string, exceptDeviceId: string }) => {
      if (user?._id === userId && deviceInfo.deviceId !== exceptDeviceId) {
        toast.error('Your session was revoked globally.');
        logout();
      }
    });

    newSocket.on('forceLogoutAll', ({ userId }: { userId: string }) => {
      if (user?._id === userId) {
        toast.error('All sessions have been revoked.');
        logout();
      }
    });

    setSocket(newSocket);
    return () => { newSocket.close(); };
  }, [user]);

  const joinWorkspace = useCallback((workspaceId: string) => {
    if (workspaceId !== currentWorkspaceId) {
      if (socket) {
        socket.emit('joinWorkspace', { workspaceId });
      }
      setCurrentWorkspaceId(workspaceId);
      setMessages([]);
      setAllMessages([]);
      setPage(1);
      setHasMoreMessages(true);
      setOnlineUsers(new Set());
    }
  }, [socket, currentWorkspaceId]);

  const sendMessage = useCallback((workspaceId: string, content: string) => {
    if (socket) socket.emit('sendMessage', { workspaceId, content });
  }, [socket]);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sendTyping = useCallback((workspaceId: string, isTyping: boolean) => {
    if (!socket) return;
    if (isTyping) {
      if (typingTimeoutRef.current) return;
      socket.emit('typing', { workspaceId, isTyping: true });
      typingTimeoutRef.current = setTimeout(() => { typingTimeoutRef.current = null; }, 3000);
    } else {
      if (typingTimeoutRef.current) { clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = null; }
      socket.emit('typing', { workspaceId, isTyping: false });
    }
  }, [socket]);

  return (
    <ChatContext.Provider
      value={{
        socket,
        messages,
        allMessages,
        isConnected,
        joinWorkspace,
        sendMessage,
        sendTyping,
        typingUsers,
        isChatOpen,
        setIsChatOpen,
        toggleChat,
        unreadCount,
        loadingHistory,
        onlineUsers,
        loadMoreMessages,
        hasMoreMessages,
        workspaceRole,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

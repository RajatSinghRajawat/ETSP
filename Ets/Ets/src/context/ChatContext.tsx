import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { chatApi, type ChatMessage } from '../store/api/chatApi';
import { connectChatSocket, disconnectChatSocket } from '../lib/chatSocket';
import ChatPanel from '../components/common/ChatPanel';

export interface ComposeTarget {
  peerProfileId: string;
  peerName: string;
  jobId?: string;
  jobTitle?: string;
}

interface ChatContextValue {
  isAuthed: boolean;
  myRole: 'employer' | 'candidate' | null;
  open: boolean;
  view: 'list' | 'thread';
  activeConversationId: string | null;
  compose: ComposeTarget | null;
  openChatList: () => void;
  openConversation: (id: string) => void;
  startChatWith: (target: ComposeTarget) => void;
  showThread: (id: string) => void;
  backToList: () => void;
  closeChat: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

function readAuth() {
  try {
    const token = localStorage.getItem('ets-access-token');
    const raw = localStorage.getItem('user');
    const user = raw ? (JSON.parse(raw) as { role?: string }) : null;
    const role = user?.role === 'employer' || user?.role === 'candidate' ? user.role : null;
    return { token, role };
  } catch {
    return { token: null, role: null };
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const dispatch = useDispatch();

  const { token, role } = readAuth();
  const isAuthed = Boolean(token && role);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'list' | 'thread'>('list');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [compose, setCompose] = useState<ComposeTarget | null>(null);
  const joinedRef = useRef<string | null>(null);

  // Connect / disconnect the socket as auth state changes.
  useEffect(() => {
    if (!token || !role) {
      disconnectChatSocket();
      return;
    }

    const socket = connectChatSocket(token);

    const handleNewMessage = (message: ChatMessage) => {
      dispatch(
        chatApi.util.invalidateTags([
          { type: 'Messages', id: message.conversation },
          'Conversations',
          'Unread',
        ]),
      );
    };
    const handleConversationUpdate = () => {
      dispatch(chatApi.util.invalidateTags(['Conversations', 'Unread']));
    };

    socket.on('message:new', handleNewMessage);
    socket.on('conversation:updated', handleConversationUpdate);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('conversation:updated', handleConversationUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, role]);

  // Join / leave the active conversation room to receive realtime messages.
  useEffect(() => {
    const socket = connectChatSocketIfAuthed(token, role);
    if (!socket) return;

    if (activeConversationId && joinedRef.current !== activeConversationId) {
      if (joinedRef.current) socket.emit('conversation:leave', joinedRef.current);
      socket.emit('conversation:join', activeConversationId);
      joinedRef.current = activeConversationId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId, token, role]);

  const openChatList = useCallbackSafe(() => {
    setView('list');
    setCompose(null);
    setActiveConversationId(null);
    setOpen(true);
  });

  const showThread = useCallbackSafe((id: string) => {
    setCompose(null);
    setActiveConversationId(id);
    setView('thread');
    setOpen(true);
  });

  const openConversation = showThread;

  const startChatWith = useCallbackSafe((target: ComposeTarget) => {
    setActiveConversationId(null);
    setCompose(target);
    setView('thread');
    setOpen(true);
  });

  const backToList = useCallbackSafe(() => {
    setView('list');
    setActiveConversationId(null);
    setCompose(null);
  });

  const closeChat = useCallbackSafe(() => setOpen(false));

  const value = useMemo<ChatContextValue>(
    () => ({
      isAuthed,
      myRole: role,
      open,
      view,
      activeConversationId,
      compose,
      openChatList,
      openConversation,
      startChatWith,
      showThread,
      backToList,
      closeChat,
    }),
    [isAuthed, role, open, view, activeConversationId, compose, openChatList, openConversation, startChatWith, showThread, backToList, closeChat],
  );

  // Close the panel automatically when the user logs out.
  useEffect(() => {
    if (!isAuthed && open) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, location.pathname]);

  return (
    <ChatContext.Provider value={value}>
      {children}
      {isAuthed && <ChatPanel />}
    </ChatContext.Provider>
  );
}

function connectChatSocketIfAuthed(token: string | null, role: string | null) {
  if (!token || !role) return null;
  return connectChatSocket(token);
}

// Small helper to avoid re-creating callbacks (kept stable via useRef pattern).
function useCallbackSafe<T extends (...args: never[]) => void>(fn: T): T {
  const ref = useRef(fn);
  ref.current = fn;
  return useMemo(() => ((...args: Parameters<T>) => ref.current(...args)) as T, []);
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return ctx;
}

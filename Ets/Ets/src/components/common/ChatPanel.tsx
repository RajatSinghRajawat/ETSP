import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  Avatar,
  Badge,
  Box,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
  ChatBubbleOutlineOutlined as ChatBubbleOutline,
  Close,
  Send,
  WorkOutlined as WorkOutline,
} from '@mui/icons-material';
import { useChat } from '../../context/ChatContext';
import {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useMarkConversationReadMutation,
  useSendMessageMutation,
  useStartConversationMutation,
  type ConversationSummary,
} from '../../store/api/chatApi';

function formatTime(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const ChatPanel: React.FC = () => {
  const {
    myRole,
    open,
    view,
    activeConversationId,
    compose,
    showThread,
    backToList,
    closeChat,
  } = useChat();

  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  const { data: conversationsData, isLoading: loadingConversations } = useGetConversationsQuery(
    undefined,
    { skip: !open },
  );
  const conversations = conversationsData?.data.items ?? [];

  const { data: messagesData, isFetching: loadingMessages } = useGetMessagesQuery(
    activeConversationId ?? '',
    { skip: !activeConversationId },
  );
  const messages = messagesData?.data.messages ?? [];
  const activeConversation = messagesData?.data.conversation;

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [startConversation, { isLoading: isStarting }] = useStartConversationMutation();
  const [markRead] = useMarkConversationReadMutation();

  // Header context for the thread view (existing conversation or compose target).
  const threadHeader = useMemo(() => {
    if (compose) return { name: compose.peerName, jobTitle: compose.jobTitle ?? '' };
    if (activeConversation) return { name: activeConversation.peerName, jobTitle: activeConversation.jobTitle };
    return { name: 'Chat', jobTitle: '' };
  }, [compose, activeConversation]);

  // Mark a conversation read once it is opened.
  useEffect(() => {
    if (activeConversationId) {
      markRead(activeConversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  // Auto-scroll to the latest message.
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length, view, loadingMessages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || isSending || isStarting) return;

    try {
      if (activeConversationId) {
        await sendMessage({ conversationId: activeConversationId, text }).unwrap();
        setDraft('');
      } else if (compose) {
        const res = await startConversation({
          peerProfileId: compose.peerProfileId,
          jobId: compose.jobId,
          text,
        }).unwrap();
        setDraft('');
        showThread(res.data.conversationId);
      }
    } catch {
      // Errors surface via RTK; keep the draft so the user can retry.
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const showComposer = view === 'thread';

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={closeChat}
      slotProps={{ paper: { sx: { width: { xs: '100vw', sm: 400 }, display: 'flex', flexDirection: 'column' } } }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        {view === 'thread' ? (
          <>
            <IconButton size="small" onClick={backToList} sx={{ color: '#fff' }} aria-label="Back">
              <ArrowBack />
            </IconButton>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 38, height: 38, fontWeight: 700 }}>
              {threadHeader.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>{threadHeader.name}</Typography>
              {threadHeader.jobTitle && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <WorkOutline sx={{ fontSize: 13, opacity: 0.85 }} />
                  <Typography variant="caption" sx={{ opacity: 0.9 }} noWrap>{threadHeader.jobTitle}</Typography>
                </Stack>
              )}
            </Box>
          </>
        ) : (
          <>
            <ChatBubbleOutline />
            <Typography sx={{ fontWeight: 700, flex: 1 }}>Messages</Typography>
          </>
        )}
        <IconButton size="small" onClick={closeChat} sx={{ color: '#fff' }} aria-label="Close chat">
          <Close />
        </IconButton>
      </Box>

      {/* Body */}
      {view === 'list' ? (
        <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: '#f7fafc' }}>
          {loadingConversations && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={26} />
            </Box>
          )}
          {!loadingConversations && conversations.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8, px: 3, color: 'text.secondary' }}>
              <ChatBubbleOutline sx={{ fontSize: 44, color: 'rgba(10,182,162,0.4)', mb: 1 }} />
              <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>No conversations yet</Typography>
              <Typography variant="body2">
                {myRole === 'employer'
                  ? 'Start a chat from a candidate’s profile.'
                  : 'When an employer messages you, it will appear here.'}
              </Typography>
            </Box>
          )}
          {conversations.map((conversation) => (
            <ConversationRow
              key={conversation._id}
              conversation={conversation}
              onClick={() => showThread(conversation._id)}
            />
          ))}
        </Box>
      ) : (
        <Box ref={listRef} sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#f7fafc', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {loadingMessages && messages.length === 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {!loadingMessages && messages.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <Typography variant="body2">
                {compose ? `Send a message to start chatting with ${threadHeader.name}.` : 'No messages yet.'}
              </Typography>
            </Box>
          )}
          {messages.map((message) => {
            const isMine = message.senderRole === myRole;
            return (
              <Box
                key={message._id}
                sx={{
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  px: 1.6,
                  py: 1,
                  borderRadius: 2.5,
                  borderTopRightRadius: isMine ? 0.5 : 2.5,
                  borderTopLeftRadius: isMine ? 2.5 : 0.5,
                  bgcolor: isMine ? '#0c5283' : '#fff',
                  color: isMine ? '#fff' : 'text.primary',
                  border: isMine ? 'none' : '1px solid rgba(12,82,131,0.1)',
                  boxShadow: isMine ? '0 4px 12px -6px rgba(12,82,131,0.5)' : '0 2px 8px -4px rgba(0,0,0,0.1)',
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {message.text}
                </Typography>
                <Typography sx={{ fontSize: 10, opacity: 0.7, display: 'block', textAlign: 'right', mt: 0.3 }}>
                  {formatTime(message.createdAt)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Composer */}
      {showComposer && (
        <Box sx={{ p: 1.5, borderTop: '1px solid rgba(12,82,131,0.08)', bgcolor: 'background.paper' }}>
          <TextField
            fullWidth
            size="small"
            multiline
            maxRows={4}
            placeholder="Type a message…"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleSend}
                      disabled={!draft.trim() || isSending || isStarting}
                      aria-label="Send message"
                      sx={{
                        bgcolor: draft.trim() ? '#0ab6a2' : 'transparent',
                        color: draft.trim() ? '#fff' : 'inherit',
                        '&:hover': { bgcolor: draft.trim() ? '#089685' : 'rgba(0,0,0,0.04)' },
                      }}
                    >
                      {isSending || isStarting ? <CircularProgress size={16} color="inherit" /> : <Send fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, pr: 0.5 } }}
          />
        </Box>
      )}
    </Drawer>
  );
};

const ConversationRow: React.FC<{ conversation: ConversationSummary; onClick: () => void }> = ({
  conversation,
  onClick,
}) => (
  <Box>
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        gap: 1.5,
        px: 2,
        py: 1.5,
        cursor: 'pointer',
        transition: 'background 0.2s ease',
        '&:hover': { bgcolor: 'rgba(10,182,162,0.06)' },
      }}
    >
      <Badge
        color="error"
        badgeContent={conversation.unread}
        invisible={conversation.unread === 0}
        overlap="circular"
      >
        <Avatar sx={{ bgcolor: '#0c5283', fontWeight: 700 }}>
          {conversation.peerName.charAt(0).toUpperCase()}
        </Avatar>
      </Badge>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
          <Typography sx={{ fontWeight: conversation.unread ? 800 : 700, fontSize: 14 }} noWrap>
            {conversation.peerName}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            {formatTime(conversation.lastMessageAt)}
          </Typography>
        </Box>
        {conversation.jobTitle && (
          <Typography variant="caption" sx={{ color: '#0ab6a2', fontWeight: 600, display: 'block' }} noWrap>
            {conversation.jobTitle}
          </Typography>
        )}
        <Typography
          variant="body2"
          color={conversation.unread ? 'text.primary' : 'text.secondary'}
          sx={{ fontWeight: conversation.unread ? 600 : 400 }}
          noWrap
        >
          {conversation.lastMessageSender === conversation.peerRole ? '' : 'You: '}
          {conversation.lastMessage || 'No messages yet'}
        </Typography>
      </Box>
    </Box>
    <Divider />
  </Box>
);

export default ChatPanel;

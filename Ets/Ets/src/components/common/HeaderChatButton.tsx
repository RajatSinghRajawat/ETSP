import { Badge, IconButton, Tooltip } from '@mui/material';
import { ChatBubbleOutlineOutlined as ChatBubbleOutline } from '@mui/icons-material';
import { useChat } from '../../context/ChatContext';
import { useGetUnreadCountQuery } from '../../store/api/chatApi';

/** Header messaging icon with a live unread badge. Opens the chat panel. */
const HeaderChatButton: React.FC = () => {
  const { isAuthed, openChatList } = useChat();
  const { data } = useGetUnreadCountQuery(undefined, { skip: !isAuthed });

  if (!isAuthed) return null;

  const unread = data?.data.total ?? 0;

  return (
    <Tooltip title="Messages">
      <IconButton
        onClick={openChatList}
        size="small"
        aria-label="Open messages"
        sx={{
          color: 'text.primary',
          transition: 'color 0.3s ease',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' },
        }}
      >
        <Badge color="error" badgeContent={unread} invisible={unread === 0} max={99}>
          <ChatBubbleOutline />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default HeaderChatButton;

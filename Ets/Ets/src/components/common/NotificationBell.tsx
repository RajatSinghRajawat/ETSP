import { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  Popover,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CheckCircle,
  DoneAll,
  EventAvailable,
  HighlightOff,
  NotificationsNoneOutlined,
  Visibility,
  WorkOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  useGetNotificationUnreadCountQuery,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  type NotificationItem,
  type NotificationType,
} from '../../store/api/notificationApi';

const TYPE_STYLE: Record<NotificationType, { icon: React.ReactNode; color: string }> = {
  application_submitted: { icon: <WorkOutlined fontSize="small" />, color: '#0c5283' },
  application_viewed: { icon: <Visibility fontSize="small" />, color: '#6366f1' },
  application_reviewing: { icon: <WorkOutlined fontSize="small" />, color: '#d97706' },
  application_shortlisted: { icon: <CheckCircle fontSize="small" />, color: '#0ab6a2' },
  application_rejected: { icon: <HighlightOff fontSize="small" />, color: '#dc2626' },
  application_hired: { icon: <CheckCircle fontSize="small" />, color: '#10b981' },
  interview_scheduled: { icon: <EventAvailable fontSize="small" />, color: '#7c3aed' },
  general: { icon: <NotificationsNoneOutlined fontSize="small" />, color: '#64748b' },
};

/** "just now" / "5m ago" / "3d ago" — falls back to a date past a week. */
const formatRelativeTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/** Header bell with a live unread badge and the full notification feed. */
const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const { data: countData } = useGetNotificationUnreadCountQuery(undefined, { skip: !isLoggedIn });
  // The list is only fetched while the panel is open — the badge alone drives the closed state.
  const { data, isLoading, isFetching } = useGetNotificationsQuery(
    { page: 1, limit: 20 },
    { skip: !isLoggedIn || !open },
  );
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();

  if (!isLoggedIn) return null;

  const unread = countData?.data.unread ?? 0;
  const items = data?.data.items ?? [];

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleItemClick = async (notification: NotificationItem) => {
    handleClose();

    if (!notification.read) {
      try {
        await markRead(notification._id).unwrap();
      } catch {
        // A failed read-receipt should never block the navigation.
      }
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead().unwrap();
    } catch {
      // Nothing actionable for the user — the badge simply stays as it was.
    }
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleOpen}
          size="small"
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
          sx={{
            color: 'text.primary',
            transition: 'color 0.3s ease',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' },
          }}
        >
          <Badge color="error" badgeContent={unread} invisible={unread === 0} max={99}>
            <NotificationsNoneOutlined />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: 320, sm: 400 },
              maxWidth: 'calc(100vw - 24px)',
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 24px 48px -24px rgba(12,82,131,0.5)',
            },
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            px: 2,
            py: 1.5,
          }}
        >
          <Typography sx={{ fontWeight: 800 }}>
            Notifications
            {unread > 0 && (
              <Typography component="span" sx={{ ml: 1, fontWeight: 600, color: 'text.secondary', fontSize: '0.85rem' }}>
                {unread} new
              </Typography>
            )}
          </Typography>
          {unread > 0 && (
            <Button
              size="small"
              startIcon={<DoneAll fontSize="small" />}
              onClick={handleMarkAll}
              disabled={isMarkingAll}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />

        {(isLoading || isFetching) && items.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!isLoading && items.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 5, px: 3, color: 'text.secondary' }}>
            <NotificationsNoneOutlined sx={{ fontSize: 40, opacity: 0.35, mb: 1 }} />
            <Typography sx={{ fontWeight: 700 }}>No notifications yet</Typography>
            <Typography variant="body2">
              Application updates and interview invites will show up here.
            </Typography>
          </Box>
        )}

        {items.length > 0 && (
          <List sx={{ py: 0, maxHeight: 420, overflowY: 'auto' }}>
            {items.map((notification) => {
              const style = TYPE_STYLE[notification.type] ?? TYPE_STYLE.general;

              return (
                <ListItemButton
                  key={notification._id}
                  onClick={() => handleItemClick(notification)}
                  sx={{
                    alignItems: 'flex-start',
                    gap: 1.5,
                    px: 2,
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: notification.read ? 'transparent' : 'rgba(10,182,162,0.06)',
                  }}
                >
                  <Box
                    sx={{
                      mt: 0.25,
                      width: 34,
                      height: 34,
                      flexShrink: 0,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: style.color,
                      bgcolor: `${style.color}1f`,
                    }}
                  >
                    {style.icon}
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      sx={{
                        fontWeight: notification.read ? 600 : 800,
                        fontSize: '0.9rem',
                        wordBreak: 'break-word',
                      }}
                    >
                      {notification.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}
                    >
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {formatRelativeTime(notification.createdAt)}
                    </Typography>
                  </Box>
                  {!notification.read && (
                    <Box
                      sx={{
                        mt: 1,
                        width: 8,
                        height: 8,
                        flexShrink: 0,
                        borderRadius: '50%',
                        bgcolor: '#0ab6a2',
                      }}
                    />
                  )}
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Popover>
    </>
  );
};

export default NotificationBell;

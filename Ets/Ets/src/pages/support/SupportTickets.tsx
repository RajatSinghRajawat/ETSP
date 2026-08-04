import { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add,
  ArrowBack,
  ChatBubbleOutlineOutlined as ChatBubbleOutline,
  CheckCircleOutlined as CheckCircleOutline,
  SupportAgent,
} from '@mui/icons-material';
import Sidebar from '../../components/common/Sidebar';
import { PageHeader } from '../../components/common/PageHeader';
import {
  useCloseTicketMutation,
  useCreateTicketMutation,
  useGetMyTicketsQuery,
  useReplyToTicketMutation,
  type SupportTicket,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from '../../store/api/supportTicketApi';
import notify from '../../utils/toast';

const STATUS_META: Record<TicketStatus, { label: string; color: 'default' | 'info' | 'warning' | 'success' }> = {
  open: { label: 'Open', color: 'warning' },
  in_progress: { label: 'In progress', color: 'info' },
  resolved: { label: 'Resolved', color: 'success' },
  closed: { label: 'Closed', color: 'default' },
};

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: 'account', label: 'Account & profile' },
  { value: 'billing', label: 'Billing & plans' },
  { value: 'jobs', label: 'Jobs & postings' },
  { value: 'applications', label: 'Applications' },
  { value: 'technical', label: 'Technical problem' },
  { value: 'other', label: 'Something else' },
];

const PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
];

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

type SupportTicketsProps = {
  type: 'candidate' | 'employer';
  userName: string;
  userRole?: string;
};

/**
 * Support centre shared by the candidate and employer dashboards: raise a
 * ticket, follow the thread, reply, and close it once it is sorted.
 */
export default function SupportTickets({ type, userName, userRole }: SupportTicketsProps) {
  const { data, isLoading, isError, refetch } = useGetMyTicketsQuery();
  const [createTicket, { isLoading: isCreating }] = useCreateTicketMutation();
  const [replyToTicket, { isLoading: isReplying }] = useReplyToTicketMutation();
  const [closeTicket, { isLoading: isClosing }] = useCloseTicketMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [form, setForm] = useState<{
    subject: string;
    message: string;
    category: TicketCategory;
    priority: TicketPriority;
  }>({ subject: '', message: '', category: 'other', priority: 'normal' });

  const tickets = useMemo(() => data?.data.items ?? [], [data]);
  const activeTicket: SupportTicket | undefined = useMemo(
    () => tickets.find((t) => t._id === activeId),
    [tickets, activeId],
  );

  const resetForm = () =>
    setForm({ subject: '', message: '', category: 'other', priority: 'normal' });

  const handleCreate = async () => {
    if (form.subject.trim().length < 3) {
      notify.warning('Please enter a subject.');
      return;
    }
    if (form.message.trim().length < 10) {
      notify.warning('Please describe your issue in at least 10 characters.');
      return;
    }

    try {
      const res = await createTicket({
        subject: form.subject.trim(),
        message: form.message.trim(),
        category: form.category,
        priority: form.priority,
      }).unwrap();
      notify.success(
        `Ticket ${res.data.reference} raised. A confirmation email is on its way.`,
      );
      setDialogOpen(false);
      resetForm();
      setActiveId(res.data._id);
    } catch (err) {
      notify.apiError(err, 'Could not raise the ticket.');
    }
  };

  const handleReply = async () => {
    if (!activeTicket || replyText.trim().length < 2) {
      notify.warning('Please type a message.');
      return;
    }

    try {
      await replyToTicket({ id: activeTicket._id, message: replyText.trim() }).unwrap();
      setReplyText('');
      notify.success('Reply sent.');
    } catch (err) {
      notify.apiError(err, 'Could not send the reply.');
    }
  };

  const handleClose = async (ticket: SupportTicket) => {
    try {
      await closeTicket(ticket._id).unwrap();
      notify.success(`Ticket ${ticket.reference} closed.`);
    } catch (err) {
      notify.apiError(err, 'Could not close the ticket.');
    }
  };

  const cardSx = {
    borderRadius: 4,
    border: '1px solid',
    borderColor: 'rgba(12,82,131,0.10)',
    mb: 2,
  } as const;

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '100vh' }}>
      <Sidebar type={type} userName={userName} userRole={userRole} />

      <Box sx={{ flex: 1, minWidth: 0, p: { xs: 1.5, sm: 2, md: 4 }, bgcolor: '#f4f8fc' }}>
        <PageHeader
          title="Support"
          subtitle="Raise a ticket and our team will get back to you by email."
          action={
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setDialogOpen(true)}
              sx={{
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 700,
                width: { xs: '100%', sm: 'auto' },
                background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
              }}
            >
              Raise a ticket
            </Button>
          }
        />

        {isError && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 3 }}
            action={
              <Button color="inherit" size="small" onClick={() => refetch()}>
                Retry
              </Button>
            }
          >
            Unable to load your tickets.
          </Alert>
        )}

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* ---------------------------------------------------- thread view */}
        {activeTicket ? (
          <Card elevation={0} sx={cardSx}>
            <CardContent sx={{ p: { xs: 2, md: 3.5 } }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => {
                  setActiveId(null);
                  setReplyText('');
                }}
                sx={{ mb: 2, textTransform: 'none', fontWeight: 700 }}
              >
                All tickets
              </Button>

              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 1,
                  mb: 0.5,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800, wordBreak: 'break-word', flex: '1 1 200px' }}>
                  {activeTicket.subject}
                </Typography>
                <Chip
                  size="small"
                  label={STATUS_META[activeTicket.status].label}
                  color={STATUS_META[activeTicket.status].color}
                  sx={{ fontWeight: 700 }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {activeTicket.reference} · raised {formatDateTime(activeTicket.createdAt)}
              </Typography>

              <Divider sx={{ my: 2.5 }} />

              <Stack spacing={1.5} sx={{ mb: 3 }}>
                {activeTicket.messages.map((message) => {
                  const fromAdmin = message.authorRole === 'admin';
                  return (
                    <Box
                      key={message._id}
                      sx={{
                        alignSelf: fromAdmin ? 'flex-start' : 'flex-end',
                        maxWidth: { xs: '100%', sm: '85%' },
                        px: 2,
                        py: 1.25,
                        borderRadius: 2.5,
                        bgcolor: fromAdmin ? '#fff' : '#0c5283',
                        color: fromAdmin ? 'text.primary' : '#fff',
                        border: fromAdmin ? '1px solid rgba(12,82,131,0.12)' : 'none',
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, opacity: fromAdmin ? 0.7 : 0.85, display: 'block' }}
                      >
                        {fromAdmin ? message.authorName || 'Support team' : 'You'}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {message.body}
                      </Typography>
                      <Typography sx={{ fontSize: 10, opacity: 0.7, textAlign: 'right', mt: 0.4 }}>
                        {formatDateTime(message.createdAt)}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>

              {activeTicket.status === 'closed' ? (
                <Alert severity="info" sx={{ borderRadius: 2.5 }}>
                  This ticket is closed. Raise a new one if you still need help.
                </Alert>
              ) : (
                <>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Add a reply"
                    placeholder="Type your message…"
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    sx={{ mb: 1.5, bgcolor: '#fff' }}
                  />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    <Button
                      variant="contained"
                      startIcon={isReplying ? <CircularProgress size={16} color="inherit" /> : <ChatBubbleOutline />}
                      disabled={isReplying}
                      onClick={handleReply}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5 }}
                    >
                      {isReplying ? 'Sending…' : 'Send reply'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="inherit"
                      startIcon={<CheckCircleOutline />}
                      disabled={isClosing}
                      onClick={() => handleClose(activeTicket)}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5 }}
                    >
                      Close ticket
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          /* ------------------------------------------------------- list view */
          <>
            {!isLoading && tickets.length === 0 && (
              <Card elevation={0} sx={cardSx}>
                <CardContent sx={{ textAlign: 'center', py: 7, color: 'text.secondary' }}>
                  <SupportAgent sx={{ fontSize: 48, color: 'rgba(10,182,162,0.4)', mb: 1 }} />
                  <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: 'text.primary' }}>
                    No support tickets yet
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3 }}>
                    Stuck on something? Raise a ticket and we will reply by email.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setDialogOpen(true)}
                    sx={{
                      borderRadius: 2.5,
                      textTransform: 'none',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                    }}
                  >
                    Raise a ticket
                  </Button>
                </CardContent>
              </Card>
            )}

            {tickets.map((ticket) => (
              <Card
                key={ticket._id}
                elevation={0}
                sx={{
                  ...cardSx,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': { borderColor: '#0ab6a2', transform: 'translateY(-2px)' },
                }}
                onClick={() => setActiveId(ticket._id)}
              >
                <CardContent
                  sx={{
                    display: 'flex',
                    flexWrap: { xs: 'wrap', sm: 'nowrap' },
                    alignItems: 'center',
                    gap: 1.5,
                    p: { xs: 2, md: 2.5 },
                  }}
                >
                  <Badge color="error" variant="dot" invisible={!ticket.unreadForUser}>
                    <SupportAgent sx={{ color: '#0c5283' }} />
                  </Badge>
                  <Box sx={{ minWidth: 0, flex: '1 1 160px' }}>
                    <Typography sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
                      {ticket.subject}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {ticket.reference} · {ticket.messages.length} message
                      {ticket.messages.length === 1 ? '' : 's'} · updated{' '}
                      {formatDateTime(ticket.lastMessageAt)}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={STATUS_META[ticket.status].label}
                    color={STATUS_META[ticket.status].color}
                    sx={{ fontWeight: 700, flexShrink: 0, ml: { xs: 'auto', sm: 0 } }}
                  />
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </Box>

      {/* ------------------------------------------------------ new ticket */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Raise a support ticket</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField
              autoFocus
              fullWidth
              label="Subject"
              placeholder="Short summary of the problem"
              value={form.subject}
              onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
              slotProps={{ htmlInput: { maxLength: 200 } }}
            />
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  value={form.category}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, category: event.target.value as TicketCategory }))
                  }
                >
                  {CATEGORIES.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  label="Priority"
                  value={form.priority}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, priority: event.target.value as TicketPriority }))
                  }
                >
                  {PRIORITIES.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TextField
              fullWidth
              multiline
              minRows={5}
              label="Describe the issue"
              placeholder="What happened, and what were you trying to do?"
              value={form.message}
              onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
              helperText={`${form.message.length}/5000`}
              slotProps={{ htmlInput: { maxLength: 5000 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit" disabled={isCreating}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={isCreating}
            startIcon={isCreating ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5 }}
          >
            {isCreating ? 'Submitting…' : 'Submit ticket'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

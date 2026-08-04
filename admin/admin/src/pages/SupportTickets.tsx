import {
  Badge,
  Box,
  Button,
  Drawer,
  Field,
  Flex,
  HStack,
  IconButton,
  Input,
  NativeSelect,
  Portal,
  Spinner,
  Stack,
  Table,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import { FiEye, FiSend, FiTrash2 } from 'react-icons/fi';
import { ConfirmDelete } from '../components/ConfirmDelete';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { toaster } from '../components/Toaster';
import {
  useDeleteSupportTicket,
  useRespondToTicket,
  useSupportTicket,
  useSupportTickets,
} from '../hooks/useAdmin';
import { extractErrorMessage } from '../lib/api';
import type { SupportTicket, TicketPriority, TicketStatus } from '../types';

const STATUS_COLORS: Record<TicketStatus, string> = {
  open: 'orange',
  in_progress: 'blue',
  resolved: 'green',
  closed: 'gray',
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: 'gray',
  normal: 'blue',
  high: 'red',
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SupportTickets() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<TicketStatus | ''>('');
  const [priority, setPriority] = useState<TicketPriority | ''>('');
  const [search, setSearch] = useState('');

  const [openId, setOpenId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [nextStatus, setNextStatus] = useState<TicketStatus | ''>('');

  const queryParams = useMemo(
    () => ({
      page,
      limit: 20,
      status: status || undefined,
      priority: priority || undefined,
      search: search.trim() || undefined,
    }),
    [page, status, priority, search],
  );

  const { data, isLoading, isFetching } = useSupportTickets(queryParams);
  const { data: activeTicket, isLoading: isLoadingTicket } = useSupportTicket(openId);
  const respond = useRespondToTicket();
  const deleteTicket = useDeleteSupportTicket();

  const items = data?.items ?? [];
  const openCount = data?.openCount ?? 0;

  function openTicket(row: SupportTicket) {
    setOpenId(row._id);
    setReply('');
    setNextStatus('');
  }

  function closeDrawer() {
    setOpenId(null);
    setReply('');
    setNextStatus('');
  }

  function handleRespond() {
    if (!openId) return;

    const message = reply.trim();
    if (!message && !nextStatus) {
      toaster.create({ title: 'Write a reply or pick a new status', type: 'error' });
      return;
    }

    respond.mutate(
      { id: openId, message: message || undefined, status: nextStatus || undefined },
      {
        onSuccess: () => {
          toaster.create({
            title: 'Response sent',
            description: 'The user has been notified by email.',
            type: 'success',
          });
          setReply('');
          setNextStatus('');
        },
        onError: (err) =>
          toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
      },
    );
  }

  return (
    <Box>
      <PageHeader
        title="Support Tickets"
        description="Tickets raised by candidates and employers. Replying here emails the user automatically."
        actions={
          openCount > 0 ? (
            <Badge colorPalette="orange" variant="solid" px={2} py={1}>
              {openCount} open
            </Badge>
          ) : undefined
        }
      />

      <Flex gap={3} mb={4} wrap="wrap" align="end">
        <Field.Root maxW="200px">
          <Field.Label>Status</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value as TicketStatus | '');
              }}
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Field.Root>

        <Field.Root maxW="180px">
          <Field.Label>Priority</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={priority}
              onChange={(e) => {
                setPage(1);
                setPriority(e.target.value as TicketPriority | '');
              }}
            >
              <option value="">All priorities</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Field.Root>

        <Field.Root maxW="280px">
          <Field.Label>Search</Field.Label>
          <Input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Reference, subject or email…"
          />
        </Field.Root>
      </Flex>

      <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" overflowX="auto">
        {isLoading ? (
          <Flex py={12} justify="center">
            <Spinner />
          </Flex>
        ) : (
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Reference</Table.ColumnHeader>
                <Table.ColumnHeader>Subject</Table.ColumnHeader>
                <Table.ColumnHeader>From</Table.ColumnHeader>
                <Table.ColumnHeader>Priority</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Last update</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={7}>
                    <Text py={8} textAlign="center" color="gray.500">
                      No tickets found{isFetching ? '…' : ''}.
                    </Text>
                  </Table.Cell>
                </Table.Row>
              )}
              {items.map((row) => (
                <Table.Row key={row._id}>
                  <Table.Cell fontWeight="medium">{row.reference}</Table.Cell>
                  <Table.Cell maxW="280px">
                    <Text truncate>{row.subject}</Text>
                    <Text fontSize="xs" color="gray.500">
                      {row.messages.length} message{row.messages.length === 1 ? '' : 's'}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm">{row.userName || '—'}</Text>
                    <Text fontSize="xs" color="gray.500">
                      {row.userEmail}
                      {row.userRole ? ` · ${row.userRole}` : ''}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette={PRIORITY_COLORS[row.priority]} variant="subtle">
                      {row.priority}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette={STATUS_COLORS[row.status]} variant="subtle">
                      {STATUS_LABELS[row.status]}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="xs" color="gray.600">
                      {formatDateTime(row.lastMessageAt)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell textAlign="right">
                    <HStack gap={1} justify="flex-end">
                      <IconButton
                        aria-label="Open ticket"
                        size="sm"
                        variant="ghost"
                        onClick={() => openTicket(row)}
                      >
                        <FiEye />
                      </IconButton>
                      <IconButton
                        aria-label="Delete ticket"
                        size="sm"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() => setDeleteId(row._id)}
                      >
                        <FiTrash2 />
                      </IconButton>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Box>

      <Pagination pagination={data?.pagination} onPageChange={setPage} />

      {/* ------------------------------------------------------- thread drawer */}
      <Drawer.Root
        open={Boolean(openId)}
        onOpenChange={(e) => !e.open && closeDrawer()}
        size="lg"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content>
              <Drawer.Header borderBottomWidth="1px">
                <Stack gap={1}>
                  <Drawer.Title>{activeTicket?.subject ?? 'Ticket'}</Drawer.Title>
                  {activeTicket && (
                    <Text fontSize="xs" color="gray.500">
                      {activeTicket.reference} · {activeTicket.userName || activeTicket.userEmail} ·{' '}
                      {activeTicket.category} · raised {formatDateTime(activeTicket.createdAt)}
                    </Text>
                  )}
                </Stack>
              </Drawer.Header>

              <Drawer.Body>
                {isLoadingTicket && (
                  <Flex py={10} justify="center">
                    <Spinner />
                  </Flex>
                )}

                {activeTicket && (
                  <Stack gap={3}>
                    {activeTicket.messages.map((message) => {
                      const fromAdmin = message.authorRole === 'admin';
                      return (
                        <Box
                          key={message._id}
                          alignSelf={fromAdmin ? 'flex-end' : 'flex-start'}
                          maxW="88%"
                          px={3}
                          py={2}
                          borderRadius="lg"
                          bg={fromAdmin ? 'brand.500' : 'gray.100'}
                          color={fromAdmin ? 'white' : 'gray.800'}
                        >
                          <Text fontSize="xs" fontWeight="bold" opacity={0.8}>
                            {fromAdmin ? message.authorName || 'Support team' : message.authorName || 'User'}
                          </Text>
                          <Text fontSize="sm" whiteSpace="pre-wrap" wordBreak="break-word">
                            {message.body}
                          </Text>
                          <Text fontSize="10px" textAlign="right" opacity={0.7}>
                            {formatDateTime(message.createdAt)}
                          </Text>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Drawer.Body>

              <Drawer.Footer borderTopWidth="1px" display="block">
                <Stack gap={3} width="100%">
                  <Field.Root>
                    <Field.Label>Reply to the user</Field.Label>
                    <Textarea
                      rows={4}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type your response — this is emailed to the user."
                    />
                  </Field.Root>

                  <Flex gap={3} wrap="wrap" align="end">
                    <Field.Root maxW="220px">
                      <Field.Label>Set status</Field.Label>
                      <NativeSelect.Root>
                        <NativeSelect.Field
                          value={nextStatus}
                          onChange={(e) => setNextStatus(e.target.value as TicketStatus | '')}
                        >
                          <option value="">Keep current</option>
                          <option value="open">Open</option>
                          <option value="in_progress">In progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </NativeSelect.Field>
                      </NativeSelect.Root>
                    </Field.Root>

                    <Button
                      colorPalette="brand"
                      onClick={handleRespond}
                      loading={respond.isPending}
                    >
                      <FiSend /> Send & notify
                    </Button>
                    <Button variant="outline" onClick={closeDrawer}>
                      Close
                    </Button>
                  </Flex>
                </Stack>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      <ConfirmDelete
        open={Boolean(deleteId)}
        title="Delete ticket?"
        description="This permanently removes the ticket and its whole conversation."
        loading={deleteTicket.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          deleteTicket.mutate(deleteId, {
            onSuccess: () => {
              toaster.create({ title: 'Ticket deleted', type: 'success' });
              setDeleteId(null);
              if (openId === deleteId) closeDrawer();
            },
            onError: (err) =>
              toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
          });
        }}
      />
    </Box>
  );
}

import {
  Avatar,
  Box,
  Flex,
  HStack,
  IconButton,
  Input,
  Menu,
  NativeSelect,
  Portal,
  Spinner,
  Table,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import { FiMoreVertical, FiTrash2 } from 'react-icons/fi';
import { ConfirmDelete } from '../components/ConfirmDelete';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { toaster } from '../components/Toaster';
import {
  useApplications,
  useDeleteApplication,
  useUpdateApplication,
} from '../hooks/useAdmin';
import { extractErrorMessage } from '../lib/api';
import { formatDateTime } from '../lib/format';
import type { ApplicationRow, ApplicationStatus } from '../types';

const STATUSES: ApplicationStatus[] = ['new', 'reviewing', 'shortlisted', 'rejected', 'hired'];

export default function Applications() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ApplicationStatus | ''>('');
  const [deleteTarget, setDeleteTarget] = useState<ApplicationRow | null>(null);

  const { data, isLoading, error } = useApplications({
    page,
    limit: 10,
    search: search || undefined,
    status: status || '',
  });
  const updateApplication = useUpdateApplication();
  const deleteApplication = useDeleteApplication();

  function handleStatusChange(application: ApplicationRow, newStatus: ApplicationStatus) {
    updateApplication.mutate(
      { id: application._id, status: newStatus },
      {
        onSuccess: () => toaster.create({ title: 'Application updated', type: 'success' }),
        onError: (err) => toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
      },
    );
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteApplication.mutate(deleteTarget._id, {
      onSuccess: () => {
        toaster.create({ title: 'Application deleted', type: 'success' });
        setDeleteTarget(null);
      },
      onError: (err) => toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
    });
  }

  return (
    <Box>
      <PageHeader title="Applications" description="Job applications submitted by candidates." />

      <Flex gap={3} mb={4} direction={{ base: 'column', md: 'row' }}>
        <Input
          placeholder="Search by candidate email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          maxW={{ md: '320px' }}
          bg="white"
        />
        <NativeSelect.Root maxW={{ md: '180px' }}>
          <NativeSelect.Field
            value={status}
            onChange={(e) => { setStatus(e.target.value as ApplicationStatus | ''); setPage(1); }}
            bg="white"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Flex>

      <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" overflow="hidden">
        {isLoading ? (
          <Flex py={12} justify="center"><Spinner /></Flex>
        ) : error ? (
          <Box p={6}><Text color="red.600">{extractErrorMessage(error)}</Text></Box>
        ) : !data || data.items.length === 0 ? (
          <Box p={8} textAlign="center"><Text color="gray.500">No applications found.</Text></Box>
        ) : (
          <Table.Root size="sm" variant="line">
            <Table.Header>
              <Table.Row bg="gray.50">
                <Table.ColumnHeader>Candidate</Table.ColumnHeader>
                <Table.ColumnHeader>Job</Table.ColumnHeader>
                <Table.ColumnHeader>Employer</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Applied</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.items.map((app) => (
                <Table.Row key={app._id}>
                  <Table.Cell>
                    <HStack gap={3}>
                      <Avatar.Root size="sm">
                        <Avatar.Fallback>
                          {app.candidateProfile
                            ? `${app.candidateProfile.firstName?.[0] ?? ''}${app.candidateProfile.lastName?.[0] ?? ''}`
                            : (app.candidateEmail?.[0] ?? '?').toUpperCase()}
                        </Avatar.Fallback>
                        {app.candidateProfile?.photoUrl && (
                          <Avatar.Image src={app.candidateProfile.photoUrl} />
                        )}
                      </Avatar.Root>
                      <Box>
                        <Text fontWeight="semibold">
                          {app.candidateProfile
                            ? `${app.candidateProfile.firstName} ${app.candidateProfile.lastName}`
                            : app.candidateEmail}
                        </Text>
                        <Text fontSize="xs" color="gray.500">{app.candidateProfile?.currentJobTitle ?? app.candidateEmail}</Text>
                      </Box>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontWeight="semibold">{app.job?.title ?? '—'}</Text>
                    <Text fontSize="xs" color="gray.500">{app.job?.location}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text>{app.employerProfile?.companyName ?? app.job?.companyName ?? '—'}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap={2}>
                      <StatusBadge value={app.status} />
                      <NativeSelect.Root size="sm" maxW="140px">
                        <NativeSelect.Field
                          value={app.status}
                          onChange={(e) => handleStatusChange(app, e.target.value as ApplicationStatus)}
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell color="gray.500">{formatDateTime(app.createdAt)}</Table.Cell>
                  <Table.Cell textAlign="end">
                    <Menu.Root>
                      <Menu.Trigger asChild>
                        <IconButton aria-label="Actions" variant="ghost" size="sm">
                          <FiMoreVertical />
                        </IconButton>
                      </Menu.Trigger>
                      <Portal>
                        <Menu.Positioner>
                          <Menu.Content>
                            <Menu.Item value="delete" color="red.600" onClick={() => setDeleteTarget(app)}>
                              <FiTrash2 style={{ marginRight: 8 }} /> Delete
                            </Menu.Item>
                          </Menu.Content>
                        </Menu.Positioner>
                      </Portal>
                    </Menu.Root>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Box>

      <Pagination pagination={data?.pagination} onPageChange={setPage} />

      <ConfirmDelete
        open={Boolean(deleteTarget)}
        title="Delete application"
        description="Permanently delete this application?"
        loading={deleteApplication.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}

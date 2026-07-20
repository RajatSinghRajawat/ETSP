import {
  Box,
  Flex,
  HStack,
  IconButton,
  Input,
  Menu,
  NativeSelect,
  Portal,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Tag,
  Text,
  Wrap,
} from '@chakra-ui/react';
import { useState } from 'react';
import { FiEye, FiMoreVertical, FiTrash2 } from 'react-icons/fi';
import { ConfirmDelete } from '../components/ConfirmDelete';
import { Detail, DetailDrawer } from '../components/DetailDrawer';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { toaster } from '../components/Toaster';
import { useDeleteJob, useJob, useJobs, useUpdateJob } from '../hooks/useAdmin';
import { extractErrorMessage } from '../lib/api';
import { formatDate, formatDateTime } from '../lib/format';
import type { JobRow } from '../types';

const STATUSES: JobRow['status'][] = ['draft', 'active', 'closed'];

export default function Jobs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [location, setLocation] = useState('');
  const [viewId, setViewId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JobRow | null>(null);

  const { data, isLoading, error } = useJobs({
    page,
    limit: 10,
    search: search || undefined,
    status: status || undefined,
    location: location || undefined,
  });
  const job = useJob(viewId);
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();

  function handleStatusChange(j: JobRow, newStatus: JobRow['status']) {
    updateJob.mutate(
      { id: j._id, body: { status: newStatus } },
      {
        onSuccess: () => toaster.create({ title: 'Job updated', type: 'success' }),
        onError: (err) => toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
      },
    );
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteJob.mutate(deleteTarget._id, {
      onSuccess: () => {
        toaster.create({ title: 'Job deleted', type: 'success' });
        setDeleteTarget(null);
      },
      onError: (err) => toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
    });
  }

  return (
    <Box>
      <PageHeader title="Jobs" description="All job listings posted by employers." />

      <Flex gap={3} mb={4} direction={{ base: 'column', md: 'row' }}>
        <Input
          placeholder="Search title, company, skill…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          maxW={{ md: '320px' }}
          bg="white"
        />
        <NativeSelect.Root maxW={{ md: '180px' }}>
          <NativeSelect.Field
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            bg="white"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        <Input
          placeholder="Filter by location"
          value={location}
          onChange={(e) => { setLocation(e.target.value); setPage(1); }}
          maxW={{ md: '220px' }}
          bg="white"
        />
      </Flex>

      <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" overflow="hidden">
        {isLoading ? (
          <Flex py={12} justify="center"><Spinner /></Flex>
        ) : error ? (
          <Box p={6}><Text color="red.600">{extractErrorMessage(error)}</Text></Box>
        ) : !data || data.items.length === 0 ? (
          <Box p={8} textAlign="center"><Text color="gray.500">No jobs found.</Text></Box>
        ) : (
          <Table.Root size="sm" variant="line">
            <Table.Header>
              <Table.Row bg="gray.50">
                <Table.ColumnHeader>Title</Table.ColumnHeader>
                <Table.ColumnHeader>Company</Table.ColumnHeader>
                <Table.ColumnHeader>Location</Table.ColumnHeader>
                <Table.ColumnHeader>Type</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Posted</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.items.map((j) => (
                <Table.Row key={j._id}>
                  <Table.Cell fontWeight="semibold">{j.title}</Table.Cell>
                  <Table.Cell>{j.companyName}</Table.Cell>
                  <Table.Cell>{j.location}</Table.Cell>
                  <Table.Cell>{j.type}</Table.Cell>
                  <Table.Cell>
                    <NativeSelect.Root size="sm" maxW="130px">
                      <NativeSelect.Field
                        value={j.status}
                        onChange={(e) => handleStatusChange(j, e.target.value as JobRow['status'])}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Table.Cell>
                  <Table.Cell color="gray.500">{formatDate(j.createdAt)}</Table.Cell>
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
                            <Menu.Item value="view" onClick={() => setViewId(j._id)}>
                              <FiEye style={{ marginRight: 8 }} /> View details
                            </Menu.Item>
                            <Menu.Item value="delete" color="red.600" onClick={() => setDeleteTarget(j)}>
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

      <DetailDrawer
        open={Boolean(viewId)}
        title="Job details"
        loading={job.isLoading}
        onClose={() => setViewId(null)}
      >
        {job.data && (
          <Stack gap={5}>
            <Box>
              <Text fontSize="lg" fontWeight="bold">{job.data.title}</Text>
              <Text fontSize="sm" color="gray.500">{job.data.companyName}</Text>
              <HStack gap={2} mt={2}><StatusBadge value={job.data.status} /></HStack>
            </Box>
            <SimpleGrid columns={2} gap={4}>
              <Detail label="Type" value={job.data.type} />
              <Detail label="Location" value={job.data.location} />
              <Detail label="Salary" value={job.data.salary} />
              <Detail label="Experience" value={job.data.experience} />
              <Detail label="Education" value={job.data.education} />
              <Detail label="Posted" value={formatDateTime(job.data.createdAt)} />
              <Detail label="Posted by" value={job.data.employerEmail} />
              <Detail label="Updated" value={formatDateTime(job.data.updatedAt)} />
            </SimpleGrid>
            {job.data.description && <Detail label="Description" value={job.data.description} />}
            {job.data.benefits && <Detail label="Benefits" value={job.data.benefits} />}
            {job.data.skills && job.data.skills.length > 0 && (
              <Box>
                <Detail label="Skills" />
                <Wrap mt={1} gap={2}>
                  {job.data.skills.map((s) => (
                    <Tag.Root key={s} size="md" variant="subtle"><Tag.Label>{s}</Tag.Label></Tag.Root>
                  ))}
                </Wrap>
              </Box>
            )}
          </Stack>
        )}
      </DetailDrawer>

      <ConfirmDelete
        open={Boolean(deleteTarget)}
        title="Delete job"
        description={`Delete the job "${deleteTarget?.title ?? ''}"? Linked applications will also be removed.`}
        loading={deleteJob.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}

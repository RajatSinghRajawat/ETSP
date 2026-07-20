import {
  Avatar,
  Box,
  Button,
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
import { FiEye, FiFileText, FiMoreVertical, FiTrash2 } from 'react-icons/fi';
import { ConfirmDelete } from '../components/ConfirmDelete';
import { Detail, DetailDrawer } from '../components/DetailDrawer';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { ResumeModal } from '../components/ResumeModal';
import { StatusBadge } from '../components/StatusBadge';
import { toaster } from '../components/Toaster';
import { useCandidate, useCandidates, useDeleteCandidate } from '../hooks/useAdmin';
import { extractErrorMessage } from '../lib/api';
import { formatDate, formatDateTime } from '../lib/format';
import type { CandidateRow } from '../types';

export default function Candidates() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [location, setLocation] = useState('');
  const [viewId, setViewId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CandidateRow | null>(null);
  const [resumeCandidate, setResumeCandidate] = useState<CandidateRow | null>(null);

  const { data, isLoading, error } = useCandidates({
    page,
    limit: 10,
    search: search || undefined,
    status: status || undefined,
    location: location || undefined,
  });
  const candidate = useCandidate(viewId);
  const deleteCandidate = useDeleteCandidate();

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteCandidate.mutate(deleteTarget._id, {
      onSuccess: () => {
        toaster.create({ title: 'Candidate deleted', type: 'success' });
        setDeleteTarget(null);
      },
      onError: (err) => toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
    });
  }

  return (
    <Box>
      <PageHeader title="Candidates" description="Browse and manage candidate profiles." />

      <Flex gap={3} mb={4} direction={{ base: 'column', md: 'row' }}>
        <Input
          placeholder="Search name, email, skill…"
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
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
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
          <Box p={8} textAlign="center"><Text color="gray.500">No candidates found.</Text></Box>
        ) : (
          <Table.Root size="sm" variant="line">
            <Table.Header>
              <Table.Row bg="gray.50">
                <Table.ColumnHeader>Candidate</Table.ColumnHeader>
                <Table.ColumnHeader>Job title</Table.ColumnHeader>
                <Table.ColumnHeader>Location</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Created</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.items.map((c) => (
                <Table.Row key={c._id}>
                  <Table.Cell>
                    <HStack gap={3}>
                      <Avatar.Root size="sm">
                        <Avatar.Fallback>{`${c.firstName?.[0] ?? ''}${c.lastName?.[0] ?? ''}` || '?'}</Avatar.Fallback>
                        {c.photoUrl && <Avatar.Image src={c.photoUrl} />}
                      </Avatar.Root>
                      <Box>
                        <Text fontWeight="semibold">{c.firstName} {c.lastName}</Text>
                        <Text fontSize="xs" color="gray.500">{c.email}</Text>
                      </Box>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell>{c.currentJobTitle ?? '—'}</Table.Cell>
                  <Table.Cell>{c.currentLocation ?? '—'}</Table.Cell>
                  <Table.Cell><StatusBadge value={c.status} /></Table.Cell>
                  <Table.Cell color="gray.500">{formatDate(c.createdAt)}</Table.Cell>
                  <Table.Cell textAlign="end">
                    <HStack gap={1} justify="flex-end">
                      <Button
                        size="xs"
                        colorPalette="teal"
                        variant="subtle"
                        onClick={() => setResumeCandidate(c)}
                        flexShrink={0}
                      >
                        <FiFileText style={{ marginRight: 4 }} />
                        Build Resume
                      </Button>
                      <Menu.Root>
                        <Menu.Trigger asChild>
                          <IconButton aria-label="Actions" variant="ghost" size="sm">
                            <FiMoreVertical />
                          </IconButton>
                        </Menu.Trigger>
                        <Portal>
                          <Menu.Positioner>
                            <Menu.Content>
                              <Menu.Item value="view" onClick={() => setViewId(c._id)}>
                                <FiEye style={{ marginRight: 8 }} /> View details
                              </Menu.Item>
                              <Menu.Item value="resume" onClick={() => setResumeCandidate(c)}>
                                <FiFileText style={{ marginRight: 8 }} /> Build Resume
                              </Menu.Item>
                              <Menu.Item value="delete" color="red.600" onClick={() => setDeleteTarget(c)}>
                                <FiTrash2 style={{ marginRight: 8 }} /> Delete
                              </Menu.Item>
                            </Menu.Content>
                          </Menu.Positioner>
                        </Portal>
                      </Menu.Root>
                    </HStack>
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
        title="Candidate profile"
        loading={candidate.isLoading}
        onClose={() => setViewId(null)}
      >
        {candidate.data && (
          <Stack gap={5}>
            <HStack gap={4}>
              <Avatar.Root size="xl">
                <Avatar.Fallback>{`${candidate.data.firstName?.[0] ?? ''}${candidate.data.lastName?.[0] ?? ''}` || '?'}</Avatar.Fallback>
                {candidate.data.photoUrl && <Avatar.Image src={candidate.data.photoUrl} />}
              </Avatar.Root>
              <Box flex={1}>
                <Text fontWeight="bold" fontSize="lg">{candidate.data.firstName} {candidate.data.lastName}</Text>
                <Text fontSize="sm" color="gray.500">{candidate.data.currentJobTitle}</Text>
                <HStack gap={2} mt={1}>
                  <StatusBadge value={candidate.data.status} />
                  {candidate.data.aadhaarVerified && <StatusBadge value="active" />}
                </HStack>
              </Box>
            </HStack>

            <Button
              colorPalette="teal"
              variant="solid"
              size="sm"
              w="full"
              onClick={() => setResumeCandidate(candidate.data)}
            >
              <FiFileText style={{ marginRight: 8 }} />
              Build Resume with AI
            </Button>
            <SimpleGrid columns={2} gap={4}>
              <Detail label="Email" value={candidate.data.email} />
              <Detail label="Phone" value={candidate.data.phone} />
              <Detail label="Current location" value={candidate.data.currentLocation} />
              <Detail label="Organization" value={candidate.data.organizationName} />
              <Detail label="Education" value={candidate.data.educationLevel ?? candidate.data.degree} />
              <Detail label="Created" value={formatDateTime(candidate.data.createdAt)} />
            </SimpleGrid>
            {candidate.data.profileSummary && (
              <Detail label="Summary" value={candidate.data.profileSummary} />
            )}
            {candidate.data.skills && candidate.data.skills.length > 0 && (
              <Box>
                <Detail label="Skills" />
                <Wrap mt={1} gap={2}>
                  {candidate.data.skills.map((s) => (
                    <Tag.Root key={s} size="md" variant="subtle"><Tag.Label>{s}</Tag.Label></Tag.Root>
                  ))}
                </Wrap>
              </Box>
            )}
            {candidate.data.preferredLocations && candidate.data.preferredLocations.length > 0 && (
              <Box>
                <Detail label="Preferred locations" />
                <Wrap mt={1} gap={2}>
                  {candidate.data.preferredLocations.map((s) => (
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
        title="Delete candidate"
        description={`Delete ${deleteTarget?.firstName ?? ''} ${deleteTarget?.lastName ?? ''}'s profile? Their applications will also be removed.`}
        loading={deleteCandidate.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <ResumeModal
        open={Boolean(resumeCandidate)}
        candidate={resumeCandidate}
        onClose={() => setResumeCandidate(null)}
      />
    </Box>
  );
}

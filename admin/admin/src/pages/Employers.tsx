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
import { useRef, useState } from 'react';
import { FiEye, FiMoreVertical, FiTrash2, FiUpload } from 'react-icons/fi';
import { ConfirmDelete } from '../components/ConfirmDelete';
import { Detail, DetailDrawer } from '../components/DetailDrawer';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { toaster } from '../components/Toaster';
import {
  useDeleteEmployer,
  useDeleteImportedEmployer,
  useEmployer,
  useEmployers,
  useImportEmployers,
  useImportedEmployers,
} from '../hooks/useAdmin';
import { extractErrorMessage } from '../lib/api';
import { formatDate, formatDateTime } from '../lib/format';
import type { EmployerRow, ImportedEmployerRow } from '../types';

type EmployerView = 'registered' | 'imported';

export default function Employers() {
  const [view, setView] = useState<EmployerView>('registered');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [viewId, setViewId] = useState<string | null>(null);
  const [importedView, setImportedView] = useState<ImportedEmployerRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmployerRow | null>(null);
  const [deleteImportedTarget, setDeleteImportedTarget] = useState<ImportedEmployerRow | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data, isLoading, error } = useEmployers({
    page: view === 'registered' ? page : 1,
    limit: 10,
    search: view === 'registered' ? search || undefined : undefined,
    status: view === 'registered' ? status || undefined : undefined,
  });
  const imported = useImportedEmployers({
    page: view === 'imported' ? page : 1,
    limit: 10,
    search: view === 'imported' ? search || undefined : undefined,
    status: view === 'imported' ? status || undefined : undefined,
  });
  const employer = useEmployer(viewId);
  const deleteEmployer = useDeleteEmployer();
  const deleteImported = useDeleteImportedEmployer();
  const importEmployers = useImportEmployers();

  function switchView(nextView: EmployerView) {
    setView(nextView);
    setPage(1);
    setSearch('');
    setStatus('');
  }

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    importEmployers.mutate(file, {
      onSuccess: (summary) => {
        const parts = [
          `${summary.imported} new`,
          `${summary.updated} updated`,
          `${summary.skipped} skipped`,
        ];
        toaster.create({
          title: `Excel imported (${summary.totalRows} rows)`,
          description:
            parts.join(', ') +
            (summary.errors.length > 0
              ? `. Issues: ${summary.errors.slice(0, 3).map((e) => `row ${e.row} — ${e.reason}`).join('; ')}${summary.errors.length > 3 ? '…' : ''}`
              : ''),
          type: summary.skipped > 0 ? 'warning' : 'success',
          duration: 9000,
        });
        switchView('imported');
      },
      onError: (err) =>
        toaster.create({ title: 'Import failed', description: extractErrorMessage(err), type: 'error' }),
    });
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteEmployer.mutate(deleteTarget._id, {
      onSuccess: () => {
        toaster.create({ title: 'Employer deleted', type: 'success' });
        setDeleteTarget(null);
      },
      onError: (err) => toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
    });
  }

  function handleConfirmDeleteImported() {
    if (!deleteImportedTarget) return;
    deleteImported.mutate(deleteImportedTarget._id, {
      onSuccess: () => {
        toaster.create({ title: 'Imported employer deleted', type: 'success' });
        setDeleteImportedTarget(null);
      },
      onError: (err) => toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
    });
  }

  const importedContactName = (e: ImportedEmployerRow) =>
    [e.firstName, e.lastName].filter(Boolean).join(' ') || '—';

  return (
    <Box>
      <PageHeader
        title="Employers"
        description="Companies and recruiters on the platform."
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={handleFileSelected}
            />
            <Button
              colorPalette="teal"
              onClick={() => fileInputRef.current?.click()}
              loading={importEmployers.isPending}
            >
              <FiUpload style={{ marginRight: 8 }} /> Import Excel
            </Button>
          </>
        }
      />

      <HStack mb={4} gap={2}>
        <Button
          size="sm"
          variant={view === 'registered' ? 'solid' : 'outline'}
          onClick={() => switchView('registered')}
        >
          Registered
        </Button>
        <Button
          size="sm"
          variant={view === 'imported' ? 'solid' : 'outline'}
          onClick={() => switchView('imported')}
        >
          Imported (Excel)
        </Button>
      </HStack>

      <Flex gap={3} mb={4} direction={{ base: 'column', md: 'row' }}>
        <Input
          placeholder={view === 'registered' ? 'Search company, email…' : 'Search company, email, phone…'}
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
            {view === 'registered' ? (
              <>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
              </>
            ) : (
              <>
                <option value="imported">Imported</option>
                <option value="registered">Registered</option>
              </>
            )}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Flex>

      {view === 'registered' ? (
        <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" overflow="hidden">
          {isLoading ? (
            <Flex py={12} justify="center"><Spinner /></Flex>
          ) : error ? (
            <Box p={6}><Text color="red.600">{extractErrorMessage(error)}</Text></Box>
          ) : !data || data.items.length === 0 ? (
            <Box p={8} textAlign="center"><Text color="gray.500">No employers found.</Text></Box>
          ) : (
            <Table.Root size="sm" variant="line">
              <Table.Header>
                <Table.Row bg="gray.50">
                  <Table.ColumnHeader>Company</Table.ColumnHeader>
                  <Table.ColumnHeader>Industry</Table.ColumnHeader>
                  <Table.ColumnHeader>Headquarters</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader>Created</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.items.map((e) => (
                  <Table.Row key={e._id}>
                    <Table.Cell>
                      <HStack gap={3}>
                        <Avatar.Root size="sm">
                          <Avatar.Fallback>{e.companyName?.[0] ?? '?'}</Avatar.Fallback>
                          {e.logoUrl && <Avatar.Image src={e.logoUrl} />}
                        </Avatar.Root>
                        <Box>
                          <Text fontWeight="semibold">{e.companyName}</Text>
                          <Text fontSize="xs" color="gray.500">{e.email}</Text>
                        </Box>
                      </HStack>
                    </Table.Cell>
                    <Table.Cell>{e.organizationType ?? '—'}</Table.Cell>
                    <Table.Cell>{e.headquarters ?? '—'}</Table.Cell>
                    <Table.Cell><StatusBadge value={e.status} /></Table.Cell>
                    <Table.Cell color="gray.500">{formatDate(e.createdAt)}</Table.Cell>
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
                              <Menu.Item value="view" onClick={() => setViewId(e._id)}>
                                <FiEye style={{ marginRight: 8 }} /> View details
                              </Menu.Item>
                              <Menu.Item value="delete" color="red.600" onClick={() => setDeleteTarget(e)}>
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
      ) : (
        <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" overflow="hidden">
          {imported.isLoading ? (
            <Flex py={12} justify="center"><Spinner /></Flex>
          ) : imported.error ? (
            <Box p={6}><Text color="red.600">{extractErrorMessage(imported.error)}</Text></Box>
          ) : !imported.data || imported.data.items.length === 0 ? (
            <Box p={8} textAlign="center">
              <Text color="gray.500">No imported employers yet. Use “Import Excel” to upload the employer sheet.</Text>
            </Box>
          ) : (
            <Table.Root size="sm" variant="line">
              <Table.Header>
                <Table.Row bg="gray.50">
                  <Table.ColumnHeader>Company</Table.ColumnHeader>
                  <Table.ColumnHeader>Category</Table.ColumnHeader>
                  <Table.ColumnHeader>Contact person</Table.ColumnHeader>
                  <Table.ColumnHeader>Contact / WhatsApp</Table.ColumnHeader>
                  <Table.ColumnHeader>Location</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {imported.data.items.map((e) => (
                  <Table.Row key={e._id}>
                    <Table.Cell>
                      <Box>
                        <Text fontWeight="semibold">{e.companyName || '—'}</Text>
                        <Text fontSize="xs" color="gray.500">{e.email || '—'}</Text>
                      </Box>
                    </Table.Cell>
                    <Table.Cell>{e.category || '—'}</Table.Cell>
                    <Table.Cell>{importedContactName(e)}</Table.Cell>
                    <Table.Cell>
                      <Text>{e.contactNumber || '—'}</Text>
                      {e.whatsappNumber && e.whatsappNumber !== e.contactNumber && (
                        <Text fontSize="xs" color="gray.500">WA: {e.whatsappNumber}</Text>
                      )}
                    </Table.Cell>
                    <Table.Cell>{[e.cities?.[0], e.state].filter(Boolean).join(', ') || '—'}</Table.Cell>
                    <Table.Cell><StatusBadge value={e.status} /></Table.Cell>
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
                              <Menu.Item value="view" onClick={() => setImportedView(e)}>
                                <FiEye style={{ marginRight: 8 }} /> View details
                              </Menu.Item>
                              <Menu.Item value="delete" color="red.600" onClick={() => setDeleteImportedTarget(e)}>
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
      )}

      <Pagination
        pagination={view === 'registered' ? data?.pagination : imported.data?.pagination}
        onPageChange={setPage}
      />

      <DetailDrawer
        open={Boolean(viewId)}
        title="Employer profile"
        loading={employer.isLoading}
        onClose={() => setViewId(null)}
      >
        {employer.data && (
          <Stack gap={5}>
            <HStack gap={4}>
              <Avatar.Root size="xl">
                <Avatar.Fallback>{employer.data.companyName?.[0] ?? '?'}</Avatar.Fallback>
                {employer.data.logoUrl && <Avatar.Image src={employer.data.logoUrl} />}
              </Avatar.Root>
              <Box>
                <Text fontWeight="bold" fontSize="lg">{employer.data.companyName}</Text>
                <Text fontSize="sm" color="gray.500">{employer.data.organizationType}</Text>
                <HStack gap={2} mt={1}>
                  <StatusBadge value={employer.data.status} />
                  {employer.data.emailVerified && <Tag.Root size="sm" variant="subtle"><Tag.Label>Email verified</Tag.Label></Tag.Root>}
                  {employer.data.phoneVerified && <Tag.Root size="sm" variant="subtle"><Tag.Label>Phone verified</Tag.Label></Tag.Root>}
                </HStack>
              </Box>
            </HStack>
            <SimpleGrid columns={2} gap={4}>
              <Detail label="Email" value={employer.data.email} />
              <Detail label="Phone" value={employer.data.phoneNumber} />
              <Detail label="Headquarters" value={employer.data.headquarters} />
              <Detail label="Team size" value={employer.data.teamSize} />
              <Detail label="Workplace model" value={employer.data.workplaceModel} />
              <Detail label="Hiring urgency" value={employer.data.hiringUrgency} />
              <Detail label="Website" value={employer.data.website} />
              <Detail label="Created" value={formatDateTime(employer.data.createdAt)} />
            </SimpleGrid>
            {employer.data.overview && <Detail label="Overview" value={employer.data.overview} />}
            {employer.data.specialties && employer.data.specialties.length > 0 && (
              <Box>
                <Detail label="Specialties" />
                <Wrap mt={1} gap={2}>
                  {employer.data.specialties.map((s) => (
                    <Tag.Root key={s} size="md" variant="subtle"><Tag.Label>{s}</Tag.Label></Tag.Root>
                  ))}
                </Wrap>
              </Box>
            )}
            {employer.data.benefits && employer.data.benefits.length > 0 && (
              <Box>
                <Detail label="Benefits" />
                <Wrap mt={1} gap={2}>
                  {employer.data.benefits.map((s) => (
                    <Tag.Root key={s} size="md" variant="subtle"><Tag.Label>{s}</Tag.Label></Tag.Root>
                  ))}
                </Wrap>
              </Box>
            )}
            {employer.data.hiringRegions && employer.data.hiringRegions.length > 0 && (
              <Box>
                <Detail label="Hiring regions" />
                <Wrap mt={1} gap={2}>
                  {employer.data.hiringRegions.map((s) => (
                    <Tag.Root key={s} size="md" variant="subtle"><Tag.Label>{s}</Tag.Label></Tag.Root>
                  ))}
                </Wrap>
              </Box>
            )}
          </Stack>
        )}
      </DetailDrawer>

      <DetailDrawer
        open={Boolean(importedView)}
        title="Imported employer"
        loading={false}
        onClose={() => setImportedView(null)}
      >
        {importedView && (
          <Stack gap={5}>
            <Box>
              <Text fontWeight="bold" fontSize="lg">{importedView.companyName || '—'}</Text>
              <Text fontSize="sm" color="gray.500">{importedView.category || '—'}</Text>
              <HStack gap={2} mt={1}>
                <StatusBadge value={importedView.status} />
              </HStack>
            </Box>
            <SimpleGrid columns={2} gap={4}>
              <Detail label="Contact person" value={importedContactName(importedView)} />
              <Detail label="Designation" value={importedView.designation} />
              <Detail label="Contact number" value={importedView.contactNumber} />
              <Detail label="WhatsApp number" value={importedView.whatsappNumber} />
              <Detail label="Email" value={importedView.email} />
              <Detail label="Website" value={importedView.website} />
              <Detail label="State" value={importedView.state} />
              <Detail label="Pincode" value={importedView.pincode} />
              <Detail label="Staff size" value={importedView.staffSize} />
              <Detail label="Source file" value={importedView.sourceFileName} />
              <Detail label="Imported" value={formatDateTime(importedView.createdAt)} />
            </SimpleGrid>
            {importedView.address && <Detail label="Address" value={importedView.address} />}
            {importedView.aboutUs && <Detail label="About us" value={importedView.aboutUs} />}
            {importedView.cities && importedView.cities.length > 0 && (
              <Box>
                <Detail label="Cities" />
                <Wrap mt={1} gap={2}>
                  {importedView.cities.map((c) => (
                    <Tag.Root key={c} size="md" variant="subtle"><Tag.Label>{c}</Tag.Label></Tag.Root>
                  ))}
                </Wrap>
              </Box>
            )}
          </Stack>
        )}
      </DetailDrawer>

      <ConfirmDelete
        open={Boolean(deleteTarget)}
        title="Delete employer"
        description={`Delete ${deleteTarget?.companyName ?? 'this employer'}? Their jobs and applications will also be removed.`}
        loading={deleteEmployer.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmDelete
        open={Boolean(deleteImportedTarget)}
        title="Delete imported employer"
        description={`Delete ${deleteImportedTarget?.companyName ?? 'this imported employer'}? They will no longer be able to auto-fill their registration.`}
        loading={deleteImported.isPending}
        onCancel={() => setDeleteImportedTarget(null)}
        onConfirm={handleConfirmDeleteImported}
      />
    </Box>
  );
}

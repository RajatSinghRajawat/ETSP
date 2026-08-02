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
  Menu,
  NativeSelect,
  Portal,
  Spinner,
  Stack,
  Table,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import {
  FiCheck,
  FiEdit2,
  FiMoreVertical,
  FiPlus,
  FiSlash,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import { ConfirmDelete } from '../components/ConfirmDelete';
import { PageHeader } from '../components/PageHeader';
import { toaster } from '../components/Toaster';
import {
  useApproveLookup,
  useCreateLookup,
  useDeleteLookup,
  useDisableLookup,
  useLookupCategories,
  useLookups,
  useRejectLookup,
  useUpdateLookup,
} from '../hooks/useAdmin';
import { extractErrorMessage } from '../lib/api';
import type { LookupCategory, LookupOption, LookupStatus } from '../types';

const STATUS_COLORS: Record<LookupStatus, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
  disabled: 'gray',
};

interface FormState {
  name: string;
  value: string;
  description: string;
  order: string;
}

const emptyForm = (): FormState => ({
  name: '',
  value: '',
  description: '',
  order: '0',
});

export default function Lookups() {
  const { data: categoriesData } = useLookupCategories();
  const categories = categoriesData?.items ?? [];

  const [category, setCategory] = useState<LookupCategory | ''>('');
  const [status, setStatus] = useState<LookupStatus | ''>('');
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<LookupOption | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      category: category || undefined,
      status: status || undefined,
      search: search.trim() || undefined,
      limit: 200,
    }),
    [category, status, search],
  );

  const { data, isLoading, isFetching } = useLookups(queryParams);
  const createLookup = useCreateLookup();
  const updateLookup = useUpdateLookup();
  const deleteLookup = useDeleteLookup();
  const approveLookup = useApproveLookup();
  const rejectLookup = useRejectLookup();
  const disableLookup = useDisableLookup();

  const items = data?.items ?? [];
  const pendingCount = data?.pendingCount ?? 0;

  function openCreate() {
    if (!category) {
      toaster.create({ title: 'Pick a category first', type: 'warning' });
      return;
    }
    setEditing(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  }

  function openEdit(row: LookupOption) {
    setEditing(row);
    setForm({
      name: row.name,
      value: row.value,
      description: row.description ?? '',
      order: String(row.order ?? 0),
    });
    setDrawerOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toaster.create({ title: 'Name is required', type: 'error' });
      return;
    }

    if (editing) {
      updateLookup.mutate(
        {
          id: editing._id,
          name: form.name.trim(),
          value: form.value.trim() || undefined,
          description: form.description.trim(),
          order: Number(form.order) || 0,
        },
        {
          onSuccess: () => {
            toaster.create({ title: 'Option updated', type: 'success' });
            setDrawerOpen(false);
          },
          onError: (err) =>
            toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
        },
      );
      return;
    }

    createLookup.mutate(
      {
        category: category as LookupCategory,
        name: form.name.trim(),
        value: form.value.trim() || undefined,
        description: form.description.trim(),
        order: Number(form.order) || 0,
      },
      {
        onSuccess: () => {
          toaster.create({ title: 'Option created and published', type: 'success' });
          setDrawerOpen(false);
        },
        onError: (err) =>
          toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
      },
    );
  }

  function runAction(
    label: string,
    mutate: (onDone?: () => void) => void,
  ) {
    mutate(() => toaster.create({ title: label, type: 'success' }));
  }

  return (
    <Box>
      <PageHeader
        title="Lookups"
        description="Manage every website select-box option. Approve user proposals before they go live, or disable / delete any value."
        actions={
          <HStack gap={2}>
            {pendingCount > 0 && (
              <Badge colorPalette="orange" variant="solid" px={2} py={1}>
                {pendingCount} pending
              </Badge>
            )}
            <Button colorPalette="brand" onClick={openCreate}>
              <FiPlus /> Add option
            </Button>
          </HStack>
        }
      />

      <Flex gap={3} mb={4} wrap="wrap" align="end">
        <Field.Root maxW="240px">
          <Field.Label>Category</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={category}
              onChange={(e) => setCategory(e.target.value as LookupCategory | '')}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Field.Root>

        <Field.Root maxW="180px">
          <Field.Label>Status</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={status}
              onChange={(e) => setStatus(e.target.value as LookupStatus | '')}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="disabled">Disabled</option>
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Field.Root>

        <Field.Root maxW="260px">
          <Field.Label>Search</Field.Label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or value…"
          />
        </Field.Root>

        {status !== 'pending' && pendingCount > 0 && (
          <Button size="sm" variant="outline" colorPalette="orange" onClick={() => setStatus('pending')}>
            Show {pendingCount} pending
          </Button>
        )}
      </Flex>

      <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" overflow="hidden">
        {isLoading ? (
          <Flex py={12} justify="center">
            <Spinner />
          </Flex>
        ) : (
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader>Value</Table.ColumnHeader>
                <Table.ColumnHeader>Category</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Order</Table.ColumnHeader>
                <Table.ColumnHeader>Proposed by</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={7}>
                    <Text py={8} textAlign="center" color="gray.500">
                      No options found{isFetching ? '…' : ''}.
                    </Text>
                  </Table.Cell>
                </Table.Row>
              )}
              {items.map((row) => (
                <Table.Row key={row._id}>
                  <Table.Cell fontWeight="medium">{row.name}</Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm" color="gray.600">
                      {row.value}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm">
                      {categories.find((c) => c.key === row.category)?.label ?? row.category}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette={STATUS_COLORS[row.status]} variant="subtle">
                      {row.status}
                    </Badge>
                    {!row.isActive && row.status === 'approved' && (
                      <Badge ml={1} colorPalette="gray" variant="outline">
                        inactive
                      </Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell>{row.order}</Table.Cell>
                  <Table.Cell>
                    <Text fontSize="xs" color="gray.500">
                      {row.proposedByEmail || '—'}
                    </Text>
                  </Table.Cell>
                  <Table.Cell textAlign="right">
                    <Menu.Root>
                      <Menu.Trigger asChild>
                        <IconButton aria-label="Actions" size="sm" variant="ghost">
                          <FiMoreVertical />
                        </IconButton>
                      </Menu.Trigger>
                      <Portal>
                        <Menu.Positioner>
                          <Menu.Content>
                            <Menu.Item value="edit" onClick={() => openEdit(row)}>
                              <FiEdit2 /> Edit
                            </Menu.Item>
                            {row.status === 'pending' && (
                              <>
                                <Menu.Item
                                  value="approve"
                                  onClick={() =>
                                    runAction('Approved & published', (done) =>
                                      approveLookup.mutate(row._id, {
                                        onSuccess: done,
                                        onError: (err) =>
                                          toaster.create({
                                            title: 'Failed',
                                            description: extractErrorMessage(err),
                                            type: 'error',
                                          }),
                                      }),
                                    )
                                  }
                                >
                                  <FiCheck /> Approve
                                </Menu.Item>
                                <Menu.Item
                                  value="reject"
                                  onClick={() =>
                                    runAction('Rejected', (done) =>
                                      rejectLookup.mutate(
                                        { id: row._id },
                                        {
                                          onSuccess: done,
                                          onError: (err) =>
                                            toaster.create({
                                              title: 'Failed',
                                              description: extractErrorMessage(err),
                                              type: 'error',
                                            }),
                                        },
                                      ),
                                    )
                                  }
                                >
                                  <FiX /> Reject
                                </Menu.Item>
                              </>
                            )}
                            {row.status === 'approved' && row.isActive && (
                              <Menu.Item
                                value="disable"
                                onClick={() =>
                                  runAction('Disabled', (done) =>
                                    disableLookup.mutate(row._id, {
                                      onSuccess: done,
                                      onError: (err) =>
                                        toaster.create({
                                          title: 'Failed',
                                          description: extractErrorMessage(err),
                                          type: 'error',
                                        }),
                                    }),
                                  )
                                }
                              >
                                <FiSlash /> Disable
                              </Menu.Item>
                            )}
                            {(row.status === 'disabled' || !row.isActive) && row.status !== 'pending' && (
                              <Menu.Item
                                value="enable"
                                onClick={() =>
                                  runAction('Enabled', (done) =>
                                    approveLookup.mutate(row._id, {
                                      onSuccess: done,
                                      onError: (err) =>
                                        toaster.create({
                                          title: 'Failed',
                                          description: extractErrorMessage(err),
                                          type: 'error',
                                        }),
                                    }),
                                  )
                                }
                              >
                                <FiCheck /> Re-enable
                              </Menu.Item>
                            )}
                            <Menu.Item value="delete" color="fg.error" onClick={() => setDeleteId(row._id)}>
                              <FiTrash2 /> Delete
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

      <Drawer.Root open={drawerOpen} onOpenChange={(d) => setDrawerOpen(d.open)} size="md">
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content>
              <Drawer.Header>
                <Drawer.Title>{editing ? 'Edit option' : 'Add option'}</Drawer.Title>
                <Drawer.CloseTrigger />
              </Drawer.Header>
              <Drawer.Body>
                <Stack gap={4}>
                  {!editing && (
                    <Text fontSize="sm" color="gray.500">
                      Category: <strong>{categories.find((c) => c.key === category)?.label ?? category}</strong>
                    </Text>
                  )}
                  <Field.Root required>
                    <Field.Label>Display name</Field.Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Full-time"
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Value (optional)</Field.Label>
                    <Input
                      value={form.value}
                      onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                      placeholder="Auto-generated from name if blank"
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Description</Field.Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      rows={2}
                    />
                  </Field.Root>
                  <Field.Root maxW="120px">
                    <Field.Label>Sort order</Field.Label>
                    <Input
                      type="number"
                      value={form.order}
                      onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                    />
                  </Field.Root>
                </Stack>
              </Drawer.Body>
              <Drawer.Footer>
                <Button variant="outline" onClick={() => setDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button
                  colorPalette="brand"
                  onClick={handleSave}
                  loading={createLookup.isPending || updateLookup.isPending}
                >
                  {editing ? 'Save changes' : 'Create & publish'}
                </Button>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      <ConfirmDelete
        open={Boolean(deleteId)}
        title="Delete this option?"
        description="It will disappear from every website select box. Existing jobs/profiles that already stored this value as text will keep their text."
        loading={deleteLookup.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          deleteLookup.mutate(deleteId, {
            onSuccess: () => {
              toaster.create({ title: 'Deleted', type: 'success' });
              setDeleteId(null);
            },
            onError: (err) =>
              toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
          });
        }}
      />
    </Box>
  );
}

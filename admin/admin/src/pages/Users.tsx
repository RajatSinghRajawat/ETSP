import {
  Box,
  Flex,
  HStack,
  IconButton,
  Input,
  Menu,
  NativeSelect,
  Portal,
  Spinner,
  Switch,
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
import { useDeleteUser, useUpdateUser, useUsers } from '../hooks/useAdmin';
import { extractErrorMessage } from '../lib/api';
import { formatDateTime } from '../lib/format';
import type { Role, UserRow } from '../types';

const ROLES: Role[] = ['admin', 'employer', 'candidate'];

export default function Users() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [active, setActive] = useState<'' | 'true' | 'false'>('');
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  const { data, isLoading, isFetching, error } = useUsers({
    page,
    limit: 10,
    search: search || undefined,
    role: (role || undefined) as Role | undefined,
    isActive: (active || undefined) as 'true' | 'false' | undefined,
  });

  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  function handleRoleChange(user: UserRow, newRole: Role) {
    updateUser.mutate(
      { id: user._id, body: { role: newRole } },
      {
        onSuccess: () => toaster.create({ title: 'Role updated', type: 'success' }),
        onError: (err) => toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
      },
    );
  }

  function handleActiveChange(user: UserRow, isActive: boolean) {
    updateUser.mutate(
      { id: user._id, body: { isActive } },
      {
        onSuccess: () => toaster.create({ title: isActive ? 'User activated' : 'User deactivated', type: 'success' }),
        onError: (err) => toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
      },
    );
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget._id, {
      onSuccess: () => {
        toaster.create({ title: 'User deleted', type: 'success' });
        setDeleteTarget(null);
      },
      onError: (err) => toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
    });
  }

  return (
    <Box>
      <PageHeader title="Users" description="Platform user accounts and access control." />

      <Flex
        gap={3}
        mb={4}
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'stretch', md: 'center' }}
      >
        <Input
          placeholder="Search by email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          maxW={{ md: '320px' }}
          bg="white"
        />
        <NativeSelect.Root maxW={{ md: '180px' }}>
          <NativeSelect.Field
            value={role}
            onChange={(e) => { setRole(e.target.value as Role | ''); setPage(1); }}
            bg="white"
          >
            <option value="">All roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        <NativeSelect.Root maxW={{ md: '180px' }}>
          <NativeSelect.Field
            value={active}
            onChange={(e) => { setActive(e.target.value as '' | 'true' | 'false'); setPage(1); }}
            bg="white"
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
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
          <Box p={8} textAlign="center"><Text color="gray.500">No users found.</Text></Box>
        ) : (
          <Table.Root size="sm" variant="line">
            <Table.Header>
              <Table.Row bg="gray.50">
                <Table.ColumnHeader>Email</Table.ColumnHeader>
                <Table.ColumnHeader>Role</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Active</Table.ColumnHeader>
                <Table.ColumnHeader>Last login</Table.ColumnHeader>
                <Table.ColumnHeader>Created</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.items.map((user) => (
                <Table.Row key={user._id}>
                  <Table.Cell fontWeight="semibold">{user.email}</Table.Cell>
                  <Table.Cell>
                    <NativeSelect.Root size="sm" maxW="140px">
                      <NativeSelect.Field
                        value={user.role}
                        onChange={(e) => handleRoleChange(user, e.target.value as Role)}
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Table.Cell>
                  <Table.Cell>
                    <StatusBadge value={user.isActive ? 'active' : 'inactive'} />
                  </Table.Cell>
                  <Table.Cell>
                    <Switch.Root
                      checked={user.isActive}
                      onCheckedChange={(d) => handleActiveChange(user, d.checked)}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                  </Table.Cell>
                  <Table.Cell color="gray.500">{formatDateTime(user.lastLoginAt)}</Table.Cell>
                  <Table.Cell color="gray.500">{formatDateTime(user.createdAt)}</Table.Cell>
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
                            <Menu.Item value="delete" color="red.600" onClick={() => setDeleteTarget(user)}>
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
      {isFetching && !isLoading && (
        <HStack mt={2} gap={2}><Spinner size="xs" /><Text fontSize="xs" color="gray.500">Refreshing…</Text></HStack>
      )}

      <ConfirmDelete
        open={Boolean(deleteTarget)}
        title="Delete user"
        description={`Are you sure you want to delete ${deleteTarget?.email ?? 'this user'}?`}
        loading={deleteUser.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}

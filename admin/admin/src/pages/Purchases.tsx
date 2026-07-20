import {
  Box,
  Flex,
  HStack,
  Input,
  NativeSelect,
  Spinner,
  Table,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { usePurchases } from '../hooks/useAdmin';
import { extractErrorMessage } from '../lib/api';
import { formatDateTime } from '../lib/format';
import type { PurchaseStatus, PurchaseType } from '../types';

const TYPE_LABELS: Record<PurchaseType, string> = {
  pay_per_job: 'Pay Per Job',
  unlock_credits_20: '+20 credits',
  cv_unlock_1: '1 CV',
  cv_unlock_3: '3 CVs',
  urgent_tag: 'Urgent tag',
  resume_builder: 'Resume builder',
};

const TYPES = Object.keys(TYPE_LABELS) as PurchaseType[];
const STATUSES: PurchaseStatus[] = ['pending', 'paid', 'expired', 'failed'];

export default function Purchases() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<PurchaseType | ''>('');
  const [status, setStatus] = useState<PurchaseStatus | ''>('');

  const { data, isLoading, isFetching, error } = usePurchases({
    page,
    limit: 20,
    search: search || undefined,
    type,
    status,
  });

  return (
    <Box>
      <PageHeader
        title="Purchases"
        description="One-time purchases — Pay Per Job, credit add-ons, CV unlocks, urgent tags and resume builder."
      />

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
        <NativeSelect.Root maxW={{ md: '200px' }}>
          <NativeSelect.Field
            value={type}
            onChange={(e) => { setType(e.target.value as PurchaseType | ''); setPage(1); }}
            bg="white"
          >
            <option value="">All types</option>
            {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        <NativeSelect.Root maxW={{ md: '180px' }}>
          <NativeSelect.Field
            value={status}
            onChange={(e) => { setStatus(e.target.value as PurchaseStatus | ''); setPage(1); }}
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
          <Box p={8} textAlign="center"><Text color="gray.500">No purchases found.</Text></Box>
        ) : (
          <Table.Root size="sm" variant="line">
            <Table.Header>
              <Table.Row bg="gray.50">
                <Table.ColumnHeader>Email</Table.ColumnHeader>
                <Table.ColumnHeader>Role</Table.ColumnHeader>
                <Table.ColumnHeader>Type</Table.ColumnHeader>
                <Table.ColumnHeader>Amount ₹</Table.ColumnHeader>
                <Table.ColumnHeader>Job</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Date</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.items.map((purchase) => (
                <Table.Row key={purchase._id}>
                  <Table.Cell fontWeight="semibold">{purchase.userEmail}</Table.Cell>
                  <Table.Cell><StatusBadge value={purchase.role} /></Table.Cell>
                  <Table.Cell>{TYPE_LABELS[purchase.type] ?? purchase.type}</Table.Cell>
                  <Table.Cell fontWeight="semibold">
                    ₹{purchase.amountInr.toLocaleString('en-IN')}
                  </Table.Cell>
                  <Table.Cell color="gray.600">{purchase.job?.title ?? '—'}</Table.Cell>
                  <Table.Cell><StatusBadge value={purchase.status} /></Table.Cell>
                  <Table.Cell color="gray.500">{formatDateTime(purchase.createdAt)}</Table.Cell>
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
    </Box>
  );
}

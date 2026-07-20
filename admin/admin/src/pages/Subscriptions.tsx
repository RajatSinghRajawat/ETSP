import {
  Badge,
  Box,
  Button,
  Dialog,
  Field,
  Flex,
  HStack,
  Input,
  NativeSelect,
  Portal,
  Spinner,
  Stack,
  Table,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import { FiGift } from 'react-icons/fi';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { toaster } from '../components/Toaster';
import { useAdminSubscriptions, useGrantSubscription, usePlans } from '../hooks/useAdmin';
import { extractErrorMessage } from '../lib/api';
import { formatDateTime } from '../lib/format';
import type { PlanAudience, SubscriptionStatus } from '../types';

const STATUSES: SubscriptionStatus[] = ['active', 'past_due', 'canceled', 'incomplete'];

export default function Subscriptions() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SubscriptionStatus | ''>('');
  const [audience, setAudience] = useState<PlanAudience | ''>('');

  const [grantOpen, setGrantOpen] = useState(false);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantPlanId, setGrantPlanId] = useState('');
  const [grantDays, setGrantDays] = useState('30');

  const { data, isLoading, isFetching, error } = useAdminSubscriptions({
    page,
    limit: 20,
    search: search || undefined,
    status,
    audience,
  });

  const { data: plans } = usePlans();
  const grantablePlans = (plans ?? []).filter((p) => !p.isFree && p.interval !== 'one_time');
  const grantSubscription = useGrantSubscription();

  function openGrant() {
    setGrantEmail('');
    setGrantPlanId('');
    setGrantDays('30');
    setGrantOpen(true);
  }

  function handleGrant() {
    const userEmail = grantEmail.trim();
    if (!userEmail) {
      toaster.create({ title: 'User email is required', type: 'error' });
      return;
    }
    if (!grantPlanId) {
      toaster.create({ title: 'Select a plan to grant', type: 'error' });
      return;
    }
    const days = Number(grantDays);
    if (!Number.isInteger(days) || days <= 0) {
      toaster.create({ title: 'Enter a valid number of days', type: 'error' });
      return;
    }
    grantSubscription.mutate(
      { userEmail, planId: grantPlanId, days },
      {
        onSuccess: () => {
          toaster.create({ title: 'Subscription granted', description: `${userEmail} — ${days} days`, type: 'success' });
          setGrantOpen(false);
        },
        onError: (err) =>
          toaster.create({ title: 'Failed to grant subscription', description: extractErrorMessage(err), type: 'error' }),
      },
    );
  }

  return (
    <Box>
      <PageHeader
        title="Subscriptions"
        description="Who is subscribed to which plan, billing status and renewal dates."
        actions={
          <Button colorPalette="brand" onClick={openGrant}>
            <FiGift style={{ marginRight: 6 }} /> Grant subscription
          </Button>
        }
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
        <NativeSelect.Root maxW={{ md: '180px' }}>
          <NativeSelect.Field
            value={status}
            onChange={(e) => { setStatus(e.target.value as SubscriptionStatus | ''); setPage(1); }}
            bg="white"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        <NativeSelect.Root maxW={{ md: '180px' }}>
          <NativeSelect.Field
            value={audience}
            onChange={(e) => { setAudience(e.target.value as PlanAudience | ''); setPage(1); }}
            bg="white"
          >
            <option value="">All roles</option>
            <option value="employer">Employer</option>
            <option value="candidate">Candidate</option>
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
          <Box p={8} textAlign="center"><Text color="gray.500">No subscriptions found.</Text></Box>
        ) : (
          <Table.Root size="sm" variant="line">
            <Table.Header>
              <Table.Row bg="gray.50">
                <Table.ColumnHeader>User</Table.ColumnHeader>
                <Table.ColumnHeader>Role</Table.ColumnHeader>
                <Table.ColumnHeader>Plan</Table.ColumnHeader>
                <Table.ColumnHeader>Billing</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Renews / ends</Table.ColumnHeader>
                <Table.ColumnHeader>Started</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.items.map((subscription) => (
                <Table.Row key={subscription._id}>
                  <Table.Cell fontWeight="semibold">{subscription.userEmail}</Table.Cell>
                  <Table.Cell><StatusBadge value={subscription.audienceRole} /></Table.Cell>
                  <Table.Cell>
                    {subscription.plan
                      ? `${subscription.plan.name} (₹${subscription.plan.priceInr.toLocaleString('en-IN')}/mo)`
                      : '—'}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette={subscription.billingInterval === 'year' ? 'purple' : 'blue'} variant="subtle">
                      {subscription.billingInterval === 'year' ? 'Yearly' : 'Monthly'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap={2}>
                      <StatusBadge value={subscription.status} />
                      {subscription.cancelAtPeriodEnd && subscription.status !== 'canceled' && (
                        <Badge colorPalette="orange" variant="subtle">Cancels at period end</Badge>
                      )}
                    </HStack>
                  </Table.Cell>
                  <Table.Cell color="gray.600">{formatDateTime(subscription.currentPeriodEnd ?? undefined)}</Table.Cell>
                  <Table.Cell color="gray.500">{formatDateTime(subscription.createdAt)}</Table.Cell>
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

      <Dialog.Root open={grantOpen} onOpenChange={(d) => { if (!d.open) setGrantOpen(false); }} placement="center">
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="md">
              <Dialog.Header>
                <Dialog.Title>Grant subscription</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Stack gap={4}>
                  <Text fontSize="sm" color="gray.600">
                    Creates an active subscription for the user without Stripe billing — e.g. for offline payments or complimentary access.
                  </Text>
                  <Field.Root>
                    <Field.Label>User email</Field.Label>
                    <Input
                      type="email"
                      value={grantEmail}
                      onChange={(e) => setGrantEmail(e.target.value)}
                      placeholder="user@example.com"
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Plan</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field value={grantPlanId} onChange={(e) => setGrantPlanId(e.target.value)}>
                        <option value="">Select a plan…</option>
                        {grantablePlans.map((plan) => (
                          <option key={plan._id} value={plan._id}>
                            {plan.name} — {plan.audience} (₹{plan.priceInr.toLocaleString('en-IN')}/mo)
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                    <Field.HelperText>Paid recurring plans only.</Field.HelperText>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Duration (days)</Field.Label>
                    <Input
                      type="number"
                      min={1}
                      value={grantDays}
                      onChange={(e) => setGrantDays(e.target.value)}
                      maxW="140px"
                    />
                  </Field.Root>
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <HStack gap={3}>
                  <Button variant="ghost" onClick={() => setGrantOpen(false)} disabled={grantSubscription.isPending}>
                    Cancel
                  </Button>
                  <Button colorPalette="brand" onClick={handleGrant} loading={grantSubscription.isPending}>
                    Grant
                  </Button>
                </HStack>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
}

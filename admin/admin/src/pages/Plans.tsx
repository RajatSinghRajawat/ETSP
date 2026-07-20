import {
  Badge,
  Box,
  Button,
  Checkbox,
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
  Switch,
  Table,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useState } from 'react';
import { FiEdit2, FiMoreVertical, FiPlus, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { ConfirmDelete } from '../components/ConfirmDelete';
import { PageHeader } from '../components/PageHeader';
import { toaster } from '../components/Toaster';
import {
  useCreatePlan,
  useDeletePlan,
  usePlans,
  useSyncPlan,
  useUpdatePlan,
} from '../hooks/useAdmin';
import { extractErrorMessage } from '../lib/api';
import type { Plan, PlanAudience, PlanFeatures, PlanInterval } from '../types';

interface PlanForm {
  name: string;
  description: string;
  audience: PlanAudience;
  isFree: boolean;
  priceInr: string;
  interval: PlanInterval;
  annualPriceInr: string;
  sortOrder: string;
  isActive: boolean;
  // shared
  aiEnabled: boolean;
  // employer — numbers
  maxActiveJobs: string;
  maxActiveJobsUnlimited: boolean;
  jobValidityDays: string;
  jobNeverExpires: boolean;
  featuredJobs: string;
  unlockCreditsPerJob: string;
  visibleExcelProfilesPerJob: string;
  allExcelVisible: boolean;
  // employer — switches
  searchFiltersEnabled: boolean;
  chatEnabled: boolean;
  screeningQuestionsEnabled: boolean;
  dedicatedAccountManager: boolean;
  creditAddonsEnabled: boolean;
  perCvUnlockEnabled: boolean;
  autoReplyEnabled: boolean;
  // candidate — numbers
  maxApplications: string;
  maxApplicationsUnlimited: boolean;
  directMessageEmployersPerMonth: string;
  // candidate — switches
  verifiedBadgeEnabled: boolean;
  featuredProfileEnabled: boolean;
  searchBoostEnabled: boolean;
  jobAlertsEnabled: boolean;
  autoApplyEnabled: boolean;
  profileBoostEnabled: boolean;
  visibilityToggleEnabled: boolean;
  followEmployersEnabled: boolean;
  resumeBuilderIncluded: boolean;
}

const emptyForm = (audience: PlanAudience): PlanForm => ({
  name: '',
  description: '',
  audience,
  isFree: false,
  priceInr: '',
  interval: 'month',
  annualPriceInr: '',
  sortOrder: '0',
  isActive: true,
  aiEnabled: false,
  maxActiveJobs: '',
  maxActiveJobsUnlimited: false,
  jobValidityDays: '',
  jobNeverExpires: false,
  featuredJobs: '0',
  unlockCreditsPerJob: '0',
  visibleExcelProfilesPerJob: '',
  allExcelVisible: false,
  searchFiltersEnabled: false,
  chatEnabled: false,
  screeningQuestionsEnabled: false,
  dedicatedAccountManager: false,
  creditAddonsEnabled: false,
  perCvUnlockEnabled: false,
  autoReplyEnabled: false,
  maxApplications: '',
  maxApplicationsUnlimited: false,
  directMessageEmployersPerMonth: '0',
  verifiedBadgeEnabled: false,
  featuredProfileEnabled: false,
  searchBoostEnabled: false,
  jobAlertsEnabled: false,
  autoApplyEnabled: false,
  profileBoostEnabled: false,
  visibilityToggleEnabled: false,
  followEmployersEnabled: false,
  resumeBuilderIncluded: false,
});

const formFromPlan = (plan: Plan): PlanForm => {
  const f = plan.features;
  return {
    name: plan.name,
    description: plan.description ?? '',
    audience: plan.audience,
    isFree: plan.isFree,
    priceInr: String(plan.priceInr),
    interval: plan.interval ?? 'month',
    annualPriceInr: plan.annualPriceInr === null || plan.annualPriceInr === undefined ? '' : String(plan.annualPriceInr),
    sortOrder: String(plan.sortOrder ?? 0),
    isActive: plan.isActive,
    aiEnabled: Boolean(f.aiEnabled),
    maxActiveJobs: f.maxActiveJobs === null || f.maxActiveJobs === undefined ? '' : String(f.maxActiveJobs),
    maxActiveJobsUnlimited: f.maxActiveJobs === null,
    jobValidityDays: f.jobValidityDays === null || f.jobValidityDays === undefined ? '' : String(f.jobValidityDays),
    jobNeverExpires: f.jobValidityDays === null,
    featuredJobs: String(f.featuredJobs ?? 0),
    unlockCreditsPerJob: String(f.unlockCreditsPerJob ?? 0),
    visibleExcelProfilesPerJob:
      f.visibleExcelProfilesPerJob === null || f.visibleExcelProfilesPerJob === undefined
        ? ''
        : String(f.visibleExcelProfilesPerJob),
    allExcelVisible: f.visibleExcelProfilesPerJob === null,
    searchFiltersEnabled: Boolean(f.searchFiltersEnabled),
    chatEnabled: Boolean(f.chatEnabled),
    screeningQuestionsEnabled: Boolean(f.screeningQuestionsEnabled),
    dedicatedAccountManager: Boolean(f.dedicatedAccountManager),
    creditAddonsEnabled: Boolean(f.creditAddonsEnabled),
    perCvUnlockEnabled: Boolean(f.perCvUnlockEnabled),
    autoReplyEnabled: Boolean(f.autoReplyEnabled),
    maxApplications: f.maxApplications === null || f.maxApplications === undefined ? '' : String(f.maxApplications),
    maxApplicationsUnlimited: f.maxApplications === null,
    directMessageEmployersPerMonth: String(f.directMessageEmployersPerMonth ?? 0),
    verifiedBadgeEnabled: Boolean(f.verifiedBadgeEnabled),
    featuredProfileEnabled: Boolean(f.featuredProfileEnabled),
    searchBoostEnabled: Boolean(f.searchBoostEnabled),
    jobAlertsEnabled: Boolean(f.jobAlertsEnabled),
    autoApplyEnabled: Boolean(f.autoApplyEnabled),
    profileBoostEnabled: Boolean(f.profileBoostEnabled),
    visibilityToggleEnabled: Boolean(f.visibilityToggleEnabled),
    followEmployersEnabled: Boolean(f.followEmployersEnabled),
    resumeBuilderIncluded: Boolean(f.resumeBuilderIncluded),
  };
};

const EMPLOYER_BOOLEAN_KEYS: Array<keyof PlanFeatures> = [
  'aiEnabled',
  'searchFiltersEnabled',
  'chatEnabled',
  'screeningQuestionsEnabled',
  'dedicatedAccountManager',
  'creditAddonsEnabled',
  'perCvUnlockEnabled',
  'autoReplyEnabled',
];

const CANDIDATE_BOOLEAN_KEYS: Array<keyof PlanFeatures> = [
  'aiEnabled',
  'verifiedBadgeEnabled',
  'featuredProfileEnabled',
  'searchBoostEnabled',
  'jobAlertsEnabled',
  'autoApplyEnabled',
  'profileBoostEnabled',
  'visibilityToggleEnabled',
  'followEmployersEnabled',
  'resumeBuilderIncluded',
];

function enabledFeatureCount(plan: Plan) {
  const keys = plan.audience === 'employer' ? EMPLOYER_BOOLEAN_KEYS : CANDIDATE_BOOLEAN_KEYS;
  return keys.filter((key) => Boolean(plan.features[key])).length;
}

function formatLimit(value: number | null | undefined) {
  return value === null || value === undefined ? 'Unlimited' : String(value);
}

function formatPrice(plan: Plan) {
  if (plan.isFree) return '₹0';
  const base = `₹${plan.priceInr.toLocaleString('en-IN')}`;
  if (plan.interval === 'one_time') return `${base} one-time`;
  const annual =
    plan.annualPriceInr !== null && plan.annualPriceInr !== undefined
      ? ` (+₹${plan.annualPriceInr.toLocaleString('en-IN')}/yr)`
      : '';
  return `${base}/mo${annual}`;
}

function FeatureSwitch({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Flex justify="space-between" align="center" gap={3}>
      <Box>
        <Text fontSize="sm" fontWeight="medium">{label}</Text>
        {hint && <Text fontSize="xs" color="gray.500">{hint}</Text>}
      </Box>
      <Switch.Root checked={checked} onCheckedChange={(d) => onChange(d.checked)}>
        <Switch.HiddenInput />
        <Switch.Control><Switch.Thumb /></Switch.Control>
      </Switch.Root>
    </Flex>
  );
}

function NullableNumberField({
  label,
  value,
  onValueChange,
  isNull,
  onNullChange,
  nullLabel,
  placeholder,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  isNull: boolean;
  onNullChange: (isNull: boolean) => void;
  nullLabel: string;
  placeholder?: string;
}) {
  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <HStack gap={3} flexWrap="wrap">
        <Input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          disabled={isNull}
          placeholder={placeholder}
          maxW="140px"
        />
        <Checkbox.Root checked={isNull} onCheckedChange={(d) => onNullChange(Boolean(d.checked))}>
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>{nullLabel}</Checkbox.Label>
        </Checkbox.Root>
      </HStack>
    </Field.Root>
  );
}

function NumberField({
  label,
  value,
  onValueChange,
  helper,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  helper?: string;
}) {
  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        maxW="140px"
      />
      {helper && <Field.HelperText>{helper}</Field.HelperText>}
    </Field.Root>
  );
}

export default function Plans() {
  const [audience, setAudience] = useState<PlanAudience>('employer');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm('employer'));
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);

  const { data: plans, isLoading, error } = usePlans({ audience });
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const syncPlan = useSyncPlan();

  const saving = createPlan.isPending || updatePlan.isPending;

  function openCreate() {
    setEditing(null);
    setForm(emptyForm(audience));
    setDrawerOpen(true);
  }

  function openEdit(plan: Plan) {
    setEditing(plan);
    setForm(formFromPlan(plan));
    setDrawerOpen(true);
  }

  function set<K extends keyof PlanForm>(key: K, value: PlanForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function parseCount(raw: string, label: string): number | undefined {
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0) {
      toaster.create({ title: `Enter a valid number for "${label}"`, type: 'error' });
      return undefined;
    }
    return n;
  }

  function handleSave() {
    if (!form.name.trim()) {
      toaster.create({ title: 'Plan name is required', type: 'error' });
      return;
    }

    const price = form.isFree ? 0 : Number(form.priceInr);
    if (!form.isFree && (!Number.isFinite(price) || price <= 0)) {
      toaster.create({ title: 'Enter a valid price (₹) for paid plans', type: 'error' });
      return;
    }

    const interval: PlanInterval = form.isFree ? 'month' : form.interval;

    let annualPriceInr: number | null = null;
    if (!form.isFree && interval === 'month' && form.annualPriceInr.trim() !== '') {
      const annual = Number(form.annualPriceInr);
      if (!Number.isFinite(annual) || annual <= 0) {
        toaster.create({ title: 'Enter a valid annual price (₹) or leave it empty', type: 'error' });
        return;
      }
      annualPriceInr = annual;
    }

    let features: Partial<PlanFeatures>;
    if (form.audience === 'employer') {
      const maxActiveJobs = form.maxActiveJobsUnlimited ? null : parseCount(form.maxActiveJobs, 'Max active jobs');
      if (maxActiveJobs === undefined) return;
      const jobValidityDays = form.jobNeverExpires ? null : parseCount(form.jobValidityDays, 'Job validity (days)');
      if (jobValidityDays === undefined) return;
      const featuredJobs = parseCount(form.featuredJobs, 'Featured jobs');
      if (featuredJobs === undefined) return;
      const unlockCreditsPerJob = parseCount(form.unlockCreditsPerJob, 'Unlock credits per job');
      if (unlockCreditsPerJob === undefined) return;
      const visibleExcelProfilesPerJob = form.allExcelVisible
        ? null
        : parseCount(form.visibleExcelProfilesPerJob, 'Visible EXCEL profiles per job');
      if (visibleExcelProfilesPerJob === undefined) return;

      features = {
        aiEnabled: form.aiEnabled,
        maxActiveJobs,
        jobValidityDays,
        featuredJobs,
        unlockCreditsPerJob,
        visibleExcelProfilesPerJob,
        searchFiltersEnabled: form.searchFiltersEnabled,
        chatEnabled: form.chatEnabled,
        screeningQuestionsEnabled: form.screeningQuestionsEnabled,
        dedicatedAccountManager: form.dedicatedAccountManager,
        creditAddonsEnabled: form.creditAddonsEnabled,
        perCvUnlockEnabled: form.perCvUnlockEnabled,
        autoReplyEnabled: form.autoReplyEnabled,
      };
    } else {
      const maxApplications = form.maxApplicationsUnlimited ? null : parseCount(form.maxApplications, 'Max applications');
      if (maxApplications === undefined) return;
      const directMessageEmployersPerMonth = parseCount(
        form.directMessageEmployersPerMonth,
        'Direct messages to employers per month',
      );
      if (directMessageEmployersPerMonth === undefined) return;

      features = {
        aiEnabled: form.aiEnabled,
        maxApplications,
        directMessageEmployersPerMonth,
        verifiedBadgeEnabled: form.verifiedBadgeEnabled,
        featuredProfileEnabled: form.featuredProfileEnabled,
        searchBoostEnabled: form.searchBoostEnabled,
        jobAlertsEnabled: form.jobAlertsEnabled,
        autoApplyEnabled: form.autoApplyEnabled,
        profileBoostEnabled: form.profileBoostEnabled,
        visibilityToggleEnabled: form.visibilityToggleEnabled,
        followEmployersEnabled: form.followEmployersEnabled,
        resumeBuilderIncluded: form.resumeBuilderIncluded,
      };
    }

    const shared = {
      name: form.name.trim(),
      description: form.description.trim(),
      priceInr: price,
      interval,
      annualPriceInr,
      isFree: form.isFree,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder) || 0,
      features,
    };

    const onError = (err: unknown) =>
      toaster.create({ title: 'Failed to save plan', description: extractErrorMessage(err), type: 'error' });

    if (editing) {
      updatePlan.mutate(
        { id: editing._id, body: shared },
        {
          onSuccess: () => {
            toaster.create({ title: 'Plan updated', type: 'success' });
            setDrawerOpen(false);
          },
          onError,
        },
      );
    } else {
      createPlan.mutate(
        { ...shared, audience: form.audience },
        {
          onSuccess: (plan) => {
            toaster.create({
              title: 'Plan created',
              description:
                plan.isFree || plan.interval === 'one_time' || plan.stripeSynced
                  ? undefined
                  : 'Stripe is not configured yet — sync this plan after adding your Stripe keys.',
              type: 'success',
            });
            setDrawerOpen(false);
          },
          onError,
        },
      );
    }
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deletePlan.mutate(deleteTarget._id, {
      onSuccess: () => {
        toaster.create({ title: 'Plan deactivated', type: 'success' });
        setDeleteTarget(null);
      },
      onError: (err) => {
        toaster.create({ title: 'Cannot delete plan', description: extractErrorMessage(err), type: 'error' });
        setDeleteTarget(null);
      },
    });
  }

  function handleSync(plan: Plan) {
    syncPlan.mutate(plan._id, {
      onSuccess: () => toaster.create({ title: 'Plan synced with Stripe', type: 'success' }),
      onError: (err) => toaster.create({ title: 'Stripe sync failed', description: extractErrorMessage(err), type: 'error' }),
    });
  }

  function handleActiveToggle(plan: Plan, isActive: boolean) {
    updatePlan.mutate(
      { id: plan._id, body: { isActive } },
      {
        onSuccess: () => toaster.create({ title: isActive ? 'Plan activated' : 'Plan deactivated', type: 'success' }),
        onError: (err) => toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
      },
    );
  }

  return (
    <Box>
      <PageHeader
        title="Plans"
        description="Subscription plans for employers and candidates — features, limits and pricing."
        actions={
          <Button colorPalette="brand" onClick={openCreate}>
            <FiPlus style={{ marginRight: 6 }} /> New plan
          </Button>
        }
      />

      <HStack gap={2} mb={4}>
        {(['employer', 'candidate'] as PlanAudience[]).map((aud) => (
          <Button
            key={aud}
            size="sm"
            variant={audience === aud ? 'solid' : 'outline'}
            colorPalette="brand"
            onClick={() => setAudience(aud)}
          >
            {aud === 'employer' ? 'Employer plans' : 'Candidate plans'}
          </Button>
        ))}
      </HStack>

      <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" overflow="hidden">
        {isLoading ? (
          <Flex py={12} justify="center"><Spinner /></Flex>
        ) : error ? (
          <Box p={6}><Text color="red.600">{extractErrorMessage(error)}</Text></Box>
        ) : !plans || plans.length === 0 ? (
          <Box p={8} textAlign="center">
            <Text color="gray.500">
              No {audience} plans yet. Create a Free plan first — users without a subscription fall back to it.
            </Text>
          </Box>
        ) : (
          <Table.Root size="sm" variant="line">
            <Table.Header>
              <Table.Row bg="gray.50">
                <Table.ColumnHeader>Plan</Table.ColumnHeader>
                <Table.ColumnHeader>Price</Table.ColumnHeader>
                <Table.ColumnHeader>Features</Table.ColumnHeader>
                <Table.ColumnHeader>Subscribers</Table.ColumnHeader>
                <Table.ColumnHeader>Stripe</Table.ColumnHeader>
                <Table.ColumnHeader>Active</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {plans.map((plan) => (
                <Table.Row key={plan._id}>
                  <Table.Cell>
                    <HStack gap={2} flexWrap="wrap">
                      <Text fontWeight="semibold">{plan.name}</Text>
                      {plan.isFree && <Badge colorPalette="green">Free</Badge>}
                      {plan.interval === 'one_time' && <Badge colorPalette="purple">Per use</Badge>}
                      {plan.planKey && (
                        <Badge colorPalette="gray" variant="outline" fontFamily="mono">{plan.planKey}</Badge>
                      )}
                    </HStack>
                    {plan.description && (
                      <Text fontSize="xs" color="gray.500" mt={0.5}>{plan.description}</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell fontWeight="semibold" whiteSpace="nowrap">
                    {formatPrice(plan)}
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap={1} flexWrap="wrap">
                      <Badge colorPalette="teal">
                        {enabledFeatureCount(plan)}/{(plan.audience === 'employer' ? EMPLOYER_BOOLEAN_KEYS : CANDIDATE_BOOLEAN_KEYS).length} features on
                      </Badge>
                      <Badge colorPalette="gray" variant="subtle">
                        {plan.audience === 'employer'
                          ? `Jobs: ${formatLimit(plan.features.maxActiveJobs)}`
                          : `Apps: ${formatLimit(plan.features.maxApplications)}`}
                      </Badge>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell>{plan.subscriberCount}</Table.Cell>
                  <Table.Cell>
                    {plan.isFree || plan.interval === 'one_time' ? (
                      <Text fontSize="xs" color="gray.400">n/a</Text>
                    ) : (
                      <Badge colorPalette={plan.stripeSynced ? 'green' : 'orange'}>
                        {plan.stripeSynced ? 'Synced' : 'Not synced'}
                      </Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Switch.Root
                      checked={plan.isActive}
                      onCheckedChange={(d) => handleActiveToggle(plan, d.checked)}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                  </Table.Cell>
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
                            <Menu.Item value="edit" onClick={() => openEdit(plan)}>
                              <FiEdit2 style={{ marginRight: 8 }} /> Edit
                            </Menu.Item>
                            {!plan.isFree && plan.interval !== 'one_time' && !plan.stripeSynced && (
                              <Menu.Item value="sync" onClick={() => handleSync(plan)}>
                                <FiRefreshCw style={{ marginRight: 8 }} /> Sync with Stripe
                              </Menu.Item>
                            )}
                            {!plan.isFree && (
                              <Menu.Item value="delete" color="red.600" onClick={() => setDeleteTarget(plan)}>
                                <FiTrash2 style={{ marginRight: 8 }} /> Deactivate
                              </Menu.Item>
                            )}
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

      <Drawer.Root open={drawerOpen} onOpenChange={(d) => { if (!d.open) setDrawerOpen(false); }} placement="end" size="md">
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content>
              <Drawer.Header>
                <Stack gap={1}>
                  <Text fontWeight="bold" fontSize="lg">
                    {editing ? `Edit plan — ${editing.name}` : 'Create plan'}
                  </Text>
                  {editing?.planKey && (
                    <HStack gap={2}>
                      <Badge colorPalette="gray" variant="outline" fontFamily="mono">{editing.planKey}</Badge>
                      <Text fontSize="xs" color="gray.500">System plan key (read-only)</Text>
                    </HStack>
                  )}
                </Stack>
              </Drawer.Header>
              <Drawer.Body>
                <Stack gap={4}>
                  {!editing && (
                    <Field.Root>
                      <Field.Label>Audience</Field.Label>
                      <NativeSelect.Root>
                        <NativeSelect.Field
                          value={form.audience}
                          onChange={(e) => set('audience', e.target.value as PlanAudience)}
                        >
                          <option value="employer">Employer</option>
                          <option value="candidate">Candidate</option>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                      <Field.HelperText>Cannot be changed after creation.</Field.HelperText>
                    </Field.Root>
                  )}

                  <Field.Root>
                    <Field.Label>Plan name</Field.Label>
                    <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Premium Employer" />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Description</Field.Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => set('description', e.target.value)}
                      placeholder="Short description shown on the pricing page"
                      rows={2}
                    />
                  </Field.Root>

                  <Checkbox.Root
                    checked={form.isFree}
                    onCheckedChange={(d) => {
                      const isFree = Boolean(d.checked);
                      setForm((prev) => ({
                        ...prev,
                        isFree,
                        priceInr: isFree ? '0' : prev.priceInr,
                        interval: isFree ? 'month' : prev.interval,
                        annualPriceInr: isFree ? '' : prev.annualPriceInr,
                      }));
                    }}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>
                      Free plan (₹0 — automatic fallback for users without a subscription)
                    </Checkbox.Label>
                  </Checkbox.Root>

                  <Field.Root>
                    <Field.Label>Billing interval</Field.Label>
                    <NativeSelect.Root disabled={form.isFree}>
                      <NativeSelect.Field
                        value={form.interval}
                        onChange={(e) => set('interval', e.target.value as PlanInterval)}
                      >
                        <option value="month">Monthly</option>
                        <option value="one_time">One-time per use</option>
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                    <Field.HelperText>
                      One-time plans (e.g. Pay Per Job) are charged per use via the purchase flow, not as a recurring subscription.
                    </Field.HelperText>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>{form.interval === 'one_time' ? 'Price (₹ per use)' : 'Price (₹ per month)'}</Field.Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.isFree ? '0' : form.priceInr}
                      onChange={(e) => set('priceInr', e.target.value)}
                      disabled={form.isFree}
                      placeholder="999"
                    />
                  </Field.Root>

                  {!form.isFree && form.interval === 'month' && (
                    <Field.Root>
                      <Field.Label>Annual price ₹ (optional)</Field.Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.annualPriceInr}
                        onChange={(e) => set('annualPriceInr', e.target.value)}
                        placeholder="e.g. 9999"
                      />
                      <Field.HelperText>Leave empty to offer monthly billing only.</Field.HelperText>
                    </Field.Root>
                  )}

                  {form.audience === 'employer' ? (
                    <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={4}>
                      <Text fontWeight="bold" fontSize="sm" mb={3}>Employer features</Text>
                      <Stack gap={3}>
                        <NullableNumberField
                          label="Max active jobs (concurrent)"
                          value={form.maxActiveJobs}
                          onValueChange={(v) => set('maxActiveJobs', v)}
                          isNull={form.maxActiveJobsUnlimited}
                          onNullChange={(v) => set('maxActiveJobsUnlimited', v)}
                          nullLabel="Unlimited"
                          placeholder="e.g. 1"
                        />
                        <NullableNumberField
                          label="Job validity (days)"
                          value={form.jobValidityDays}
                          onValueChange={(v) => set('jobValidityDays', v)}
                          isNull={form.jobNeverExpires}
                          onNullChange={(v) => set('jobNeverExpires', v)}
                          nullLabel="Never expires"
                          placeholder="e.g. 30"
                        />
                        <NumberField
                          label="Featured jobs (concurrent)"
                          value={form.featuredJobs}
                          onValueChange={(v) => set('featuredJobs', v)}
                        />
                        <NumberField
                          label="Unlock credits per job"
                          value={form.unlockCreditsPerJob}
                          onValueChange={(v) => set('unlockCreditsPerJob', v)}
                          helper="CV unlock credits granted per posted job."
                        />
                        <NullableNumberField
                          label="Visible EXCEL profiles per job"
                          value={form.visibleExcelProfilesPerJob}
                          onValueChange={(v) => set('visibleExcelProfilesPerJob', v)}
                          isNull={form.allExcelVisible}
                          onNullChange={(v) => set('allExcelVisible', v)}
                          nullLabel="All EXCEL visible"
                          placeholder="e.g. 5"
                        />

                        <FeatureSwitch
                          label="Search filters"
                          hint="Location, experience & salary filters in the candidate directory"
                          checked={form.searchFiltersEnabled}
                          onChange={(v) => set('searchFiltersEnabled', v)}
                        />
                        <FeatureSwitch
                          label="Chat"
                          hint="Employer can start conversations with candidates"
                          checked={form.chatEnabled}
                          onChange={(v) => set('chatEnabled', v)}
                        />
                        <FeatureSwitch
                          label="Screening questions"
                          hint="Attach screening questions to job posts"
                          checked={form.screeningQuestionsEnabled}
                          onChange={(v) => set('screeningQuestionsEnabled', v)}
                        />
                        <FeatureSwitch
                          label="AI features"
                          hint="AI tools for employers"
                          checked={form.aiEnabled}
                          onChange={(v) => set('aiEnabled', v)}
                        />
                        <FeatureSwitch
                          label="Dedicated account manager"
                          hint="Display only"
                          checked={form.dedicatedAccountManager}
                          onChange={(v) => set('dedicatedAccountManager', v)}
                        />
                        <FeatureSwitch
                          label="Credit add-ons"
                          hint="May buy ₹199 → +20 unlock credits"
                          checked={form.creditAddonsEnabled}
                          onChange={(v) => set('creditAddonsEnabled', v)}
                        />
                        <FeatureSwitch
                          label="Per-CV unlock"
                          hint="₹25 / ₹75 one-off CV unlocks"
                          checked={form.perCvUnlockEnabled}
                          onChange={(v) => set('perCvUnlockEnabled', v)}
                        />
                        <FeatureSwitch
                          label="Auto job reply (AI)"
                          hint="Automatically acknowledge new applicants in chat"
                          checked={form.autoReplyEnabled}
                          onChange={(v) => set('autoReplyEnabled', v)}
                        />
                      </Stack>
                    </Box>
                  ) : (
                    <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={4}>
                      <Text fontWeight="bold" fontSize="sm" mb={3}>Candidate features</Text>
                      <Stack gap={3}>
                        <NullableNumberField
                          label="Max applications"
                          value={form.maxApplications}
                          onValueChange={(v) => set('maxApplications', v)}
                          isNull={form.maxApplicationsUnlimited}
                          onNullChange={(v) => set('maxApplicationsUnlimited', v)}
                          nullLabel="Unlimited"
                          placeholder="e.g. 10"
                        />
                        <NumberField
                          label="Direct messages to employers per month"
                          value={form.directMessageEmployersPerMonth}
                          onValueChange={(v) => set('directMessageEmployersPerMonth', v)}
                        />

                        <FeatureSwitch
                          label="Verified badge"
                          hint="Shown once email & phone are verified"
                          checked={form.verifiedBadgeEnabled}
                          onChange={(v) => set('verifiedBadgeEnabled', v)}
                        />
                        <FeatureSwitch
                          label="Featured profile"
                          checked={form.featuredProfileEnabled}
                          onChange={(v) => set('featuredProfileEnabled', v)}
                        />
                        <FeatureSwitch
                          label="Search boost"
                          hint="Rank higher in employer candidate search"
                          checked={form.searchBoostEnabled}
                          onChange={(v) => set('searchBoostEnabled', v)}
                        />
                        <FeatureSwitch
                          label="Job alerts"
                          checked={form.jobAlertsEnabled}
                          onChange={(v) => set('jobAlertsEnabled', v)}
                        />
                        <FeatureSwitch
                          label="AI auto apply"
                          hint="Auto-apply to matching jobs with AI cover letters"
                          checked={form.autoApplyEnabled}
                          onChange={(v) => set('autoApplyEnabled', v)}
                        />
                        <FeatureSwitch
                          label="Profile boost"
                          checked={form.profileBoostEnabled}
                          onChange={(v) => set('profileBoostEnabled', v)}
                        />
                        <FeatureSwitch
                          label="Visibility toggle"
                          hint="Candidate can hide their profile from employers"
                          checked={form.visibilityToggleEnabled}
                          onChange={(v) => set('visibilityToggleEnabled', v)}
                        />
                        <FeatureSwitch
                          label="Follow employers"
                          checked={form.followEmployersEnabled}
                          onChange={(v) => set('followEmployersEnabled', v)}
                        />
                        <FeatureSwitch
                          label="Resume builder included"
                          hint="Build resumes without buying credits"
                          checked={form.resumeBuilderIncluded}
                          onChange={(v) => set('resumeBuilderIncluded', v)}
                        />
                        <FeatureSwitch
                          label="AI features"
                          hint="AI job search, profile refine & resume builder"
                          checked={form.aiEnabled}
                          onChange={(v) => set('aiEnabled', v)}
                        />
                      </Stack>
                    </Box>
                  )}

                  <Field.Root>
                    <Field.Label>Sort order</Field.Label>
                    <Input
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) => set('sortOrder', e.target.value)}
                      maxW="140px"
                    />
                    <Field.HelperText>Lower numbers appear first on the pricing page.</Field.HelperText>
                  </Field.Root>

                  <Flex justify="space-between" align="center">
                    <Text fontSize="sm" fontWeight="medium">Active (visible on pricing page)</Text>
                    <Switch.Root checked={form.isActive} onCheckedChange={(d) => set('isActive', d.checked)}>
                      <Switch.HiddenInput />
                      <Switch.Control><Switch.Thumb /></Switch.Control>
                    </Switch.Root>
                  </Flex>
                </Stack>
              </Drawer.Body>
              <Drawer.Footer>
                <HStack gap={3}>
                  <Button variant="ghost" onClick={() => setDrawerOpen(false)} disabled={saving}>Cancel</Button>
                  <Button colorPalette="brand" onClick={handleSave} loading={saving}>
                    {editing ? 'Save changes' : 'Create plan'}
                  </Button>
                </HStack>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      <ConfirmDelete
        open={Boolean(deleteTarget)}
        title="Deactivate plan"
        description={`"${deleteTarget?.name ?? ''}" will be hidden from the pricing page and can no longer be purchased. Plans with active subscribers cannot be removed.`}
        loading={deletePlan.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}

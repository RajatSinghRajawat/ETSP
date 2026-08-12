import {
  Badge,
  Box,
  Button,
  Code,
  Field,
  Flex,
  HStack,
  Input,
  Spinner,
  Stack,
  Switch,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { toaster } from '../components/Toaster';
import {
  useEmailSettings,
  useMsg91Settings,
  useStripeSettings,
  useUpdateEmailSettings,
  useUpdateMsg91Settings,
  useUpdateStripeSettings,
} from '../hooks/useAdmin';
import { extractErrorMessage } from '../lib/api';

function SectionCard({
  title,
  description,
  badge,
  toggle,
  children,
}: {
  title: string;
  description: string;
  badge?: React.ReactNode;
  toggle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={6}>
      <Flex justify="space-between" align="flex-start" mb={1} gap={3} wrap="wrap">
        <HStack gap={2}>
          <Text fontWeight="bold" fontSize="lg">{title}</Text>
          {badge}
        </HStack>
        {toggle}
      </Flex>
      <Text fontSize="sm" color="gray.500" mb={4}>{description}</Text>
      {children}
    </Box>
  );
}

function ServiceToggle({
  enabled,
  onChange,
  loading,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  loading?: boolean;
}) {
  return (
    <HStack gap={2}>
      <Text fontSize="sm" color={enabled ? 'green.600' : 'gray.500'} fontWeight="semibold">
        {enabled ? 'Service ON' : 'Service OFF'}
      </Text>
      <Switch.Root checked={enabled} disabled={loading} onCheckedChange={(d) => onChange(d.checked)}>
        <Switch.HiddenInput />
        <Switch.Control><Switch.Thumb /></Switch.Control>
      </Switch.Root>
    </HStack>
  );
}

/* ------------------------------ Stripe ------------------------------ */

function StripeSection() {
  const { data: settings, isLoading } = useStripeSettings();
  const updateSettings = useUpdateStripeSettings();
  const [secretKey, setSecretKey] = useState('');
  const [publishableKey, setPublishableKey] = useState('');

  function handleToggle(enabled: boolean) {
    updateSettings.mutate(
      { subscriptionsEnabled: enabled },
      {
        onSuccess: () =>
          toaster.create({
            title: enabled
              ? 'Subscriptions turned ON — pricing and plan limits are active'
              : 'Subscriptions turned OFF — website is free (all features unlocked)',
            type: 'success',
          }),
        onError: (err) =>
          toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
      },
    );
  }

  function handleSave() {
    const body: Record<string, string> = {};
    if (secretKey.trim()) body.secretKey = secretKey.trim();
    if (publishableKey.trim()) body.publishableKey = publishableKey.trim();

    if (Object.keys(body).length === 0) {
      toaster.create({ title: 'Enter at least one key to update', type: 'error' });
      return;
    }

    updateSettings.mutate(body, {
      onSuccess: () => {
        toaster.create({ title: 'Stripe settings saved', type: 'success' });
        setSecretKey('');
        setPublishableKey('');
      },
      onError: (err) =>
        toaster.create({ title: 'Failed to save', description: extractErrorMessage(err), type: 'error' }),
    });
  }

  if (isLoading) return <Flex py={8} justify="center"><Spinner /></Flex>;

  const subscriptionsOn = settings?.subscriptionsEnabled !== false;

  return (
    <SectionCard
      title="Stripe (Payments)"
      description="Turn subscriptions OFF to make the whole website free — every user gets all features with no plan limits or Stripe checkout. Keys stay saved so you can turn payments back on later."
      badge={
        <HStack gap={2}>
          <Badge colorPalette={subscriptionsOn ? 'green' : 'red'} variant="subtle">
            {subscriptionsOn ? 'Subscriptions ON' : 'Free mode'}
          </Badge>
          <Badge colorPalette={settings?.configured ? 'green' : 'orange'} variant="subtle">
            {settings?.configured ? 'Keys configured' : 'Keys not set'}
          </Badge>
        </HStack>
      }
      toggle={
        <ServiceToggle
          enabled={subscriptionsOn}
          onChange={handleToggle}
          loading={updateSettings.isPending}
        />
      }
    >
      <Stack gap={4}>
        {!subscriptionsOn && (
          <Text fontSize="sm" color="green.700" bg="green.50" px={3} py={2} borderRadius="md">
            Free mode is active. Employers and candidates can use all features without paying. Pricing and upgrade prompts are hidden on the website.
          </Text>
        )}
        {settings?.keysNeedReentry && (
          <Text fontSize="sm" color="orange.800" bg="orange.50" px={3} py={2} borderRadius="md">
            Saved Stripe keys cannot be decrypted (SETTINGS_ENCRYPTION_KEY may have changed). Re-enter and save the secret + publishable keys below. The free-mode toggle still works.
          </Text>
        )}
        <HStack gap={6} fontSize="sm" color="gray.600" flexWrap="wrap">
          <HStack><Text>Secret key:</Text><Code fontSize="xs">{settings?.secretKeyMasked || 'not set'}</Code></HStack>
          <HStack><Text>Publishable key:</Text><Code fontSize="xs" maxW="280px" truncate>{settings?.publishableKey || 'not set'}</Code></HStack>
        </HStack>
        <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
          <Field.Root>
            <Field.Label>Secret key</Field.Label>
            <Input type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} placeholder="sk_test_… or sk_live_…" autoComplete="off" />
          </Field.Root>
          <Field.Root>
            <Field.Label>Publishable key</Field.Label>
            <Input value={publishableKey} onChange={(e) => setPublishableKey(e.target.value)} placeholder="pk_test_… or pk_live_…" autoComplete="off" />
          </Field.Root>
        </Flex>
        <Box>
          <Button colorPalette="brand" onClick={handleSave} loading={updateSettings.isPending}>
            Save Stripe settings
          </Button>
        </Box>
      </Stack>
    </SectionCard>
  );
}

/* ---------------------------- Email (SMTP) ---------------------------- */

function EmailSection() {
  const { data: settings, isLoading } = useEmailSettings();
  const updateSettings = useUpdateEmailSettings();
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [from, setFrom] = useState('');

  function handleToggle(enabled: boolean) {
    updateSettings.mutate(
      { enabled },
      {
        onSuccess: () =>
          toaster.create({ title: enabled ? 'Email service turned ON' : 'Email service turned OFF', type: 'success' }),
        onError: (err) =>
          toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
      },
    );
  }

  function handleSave() {
    const body: Record<string, string | number> = {};
    if (host.trim()) body.host = host.trim();
    if (port.trim()) body.port = Number(port);
    if (user.trim()) body.user = user.trim();
    if (pass) body.pass = pass;
    if (from.trim()) body.from = from.trim();

    if (Object.keys(body).length === 0) {
      toaster.create({ title: 'Enter at least one field to update', type: 'error' });
      return;
    }

    updateSettings.mutate(body, {
      onSuccess: (res) => {
        const warning = res.message.includes('failed');
        toaster.create({
          title: warning ? 'Saved with warning' : 'Email settings saved',
          description: warning ? res.message : undefined,
          type: warning ? 'warning' : 'success',
        });
        setHost(''); setPort(''); setUser(''); setPass(''); setFrom('');
      },
      onError: (err) =>
        toaster.create({ title: 'Failed to save', description: extractErrorMessage(err), type: 'error' }),
    });
  }

  if (isLoading) return <Flex py={8} justify="center"><Spinner /></Flex>;

  return (
    <SectionCard
      title="Email (SMTP)"
      description="Login OTP and platform emails are sent through this SMTP account. The connection is tested when you save. Leave a field blank to keep its current value."
      badge={
        <Badge colorPalette={settings?.enabled ? 'green' : 'red'} variant="subtle">
          {settings?.enabled ? 'ON' : 'OFF'}
        </Badge>
      }
      toggle={
        <ServiceToggle
          enabled={Boolean(settings?.enabled)}
          onChange={handleToggle}
          loading={updateSettings.isPending}
        />
      }
    >
      <Stack gap={4}>
        <HStack gap={6} fontSize="sm" color="gray.600" flexWrap="wrap">
          <HStack><Text>Host:</Text><Code fontSize="xs">{settings?.host || 'not set'}</Code></HStack>
          <HStack><Text>Port:</Text><Code fontSize="xs">{settings?.port ?? '—'}</Code></HStack>
          <HStack><Text>User:</Text><Code fontSize="xs">{settings?.user || 'not set'}</Code></HStack>
          <HStack><Text>Password:</Text><Code fontSize="xs">{settings?.passMasked || 'not set'}</Code></HStack>
          <HStack><Text>From:</Text><Code fontSize="xs">{settings?.from || 'not set'}</Code></HStack>
        </HStack>
        <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
          <Field.Root>
            <Field.Label>SMTP host</Field.Label>
            <Input value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.gmail.com" />
          </Field.Root>
          <Field.Root maxW={{ md: '140px' }}>
            <Field.Label>Port</Field.Label>
            <Input type="number" value={port} onChange={(e) => setPort(e.target.value)} placeholder="587" />
          </Field.Root>
        </Flex>
        <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
          <Field.Root>
            <Field.Label>SMTP user</Field.Label>
            <Input value={user} onChange={(e) => setUser(e.target.value)} placeholder="you@example.com" autoComplete="off" />
          </Field.Root>
          <Field.Root>
            <Field.Label>SMTP password</Field.Label>
            <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="app password" autoComplete="off" />
          </Field.Root>
        </Flex>
        <Field.Root>
          <Field.Label>From address</Field.Label>
          <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder='VetsLinked <no-reply@example.com>' />
        </Field.Root>
        <Box>
          <Button colorPalette="brand" onClick={handleSave} loading={updateSettings.isPending}>
            Save email settings
          </Button>
        </Box>
      </Stack>
    </SectionCard>
  );
}

/* ---------------------------- SMS (MSG91) ---------------------------- */

function Msg91Section() {
  const { data: settings, isLoading } = useMsg91Settings();
  const updateSettings = useUpdateMsg91Settings();
  const [authKey, setAuthKey] = useState('');
  const [senderId, setSenderId] = useState('');
  const [templateId, setTemplateId] = useState('');

  function handleToggle(enabled: boolean) {
    updateSettings.mutate(
      { enabled },
      {
        onSuccess: (res) =>
          toaster.create({
            title: enabled ? 'SMS service turned ON' : 'SMS service turned OFF',
            description: enabled && !res.data.configured ? 'Auth key aur template ID add karna baaki hai.' : undefined,
            type: 'success',
          }),
        onError: (err) =>
          toaster.create({ title: 'Failed', description: extractErrorMessage(err), type: 'error' }),
      },
    );
  }

  function handleSave() {
    const body: Record<string, string> = {};
    if (authKey.trim()) body.authKey = authKey.trim();
    if (senderId.trim()) body.senderId = senderId.trim();
    if (templateId.trim()) body.templateId = templateId.trim();

    if (Object.keys(body).length === 0) {
      toaster.create({ title: 'Enter at least one field to update', type: 'error' });
      return;
    }

    updateSettings.mutate(body, {
      onSuccess: () => {
        toaster.create({ title: 'MSG91 settings saved', type: 'success' });
        setAuthKey(''); setSenderId(''); setTemplateId('');
      },
      onError: (err) =>
        toaster.create({ title: 'Failed to save', description: extractErrorMessage(err), type: 'error' }),
    });
  }

  if (isLoading) return <Flex py={8} justify="center"><Spinner /></Flex>;

  return (
    <SectionCard
      title="SMS (MSG91)"
      description="Login OTPs are sent by SMS (to the user's registered phone) when this service is on — this is also what mobile-number login depends on. Use a DLT-approved MSG91 template whose variable is ##number##. The auth key is stored encrypted."
      badge={
        <HStack gap={1}>
          <Badge colorPalette={settings?.enabled ? 'green' : 'red'} variant="subtle">
            {settings?.enabled ? 'ON' : 'OFF'}
          </Badge>
          <Badge colorPalette={settings?.configured ? 'green' : 'orange'} variant="subtle">
            {settings?.configured ? 'Configured' : 'Not configured'}
          </Badge>
        </HStack>
      }
      toggle={
        <ServiceToggle
          enabled={Boolean(settings?.enabled)}
          onChange={handleToggle}
          loading={updateSettings.isPending}
        />
      }
    >
      <Stack gap={4}>
        <HStack gap={6} fontSize="sm" color="gray.600" flexWrap="wrap">
          <HStack><Text>Auth key:</Text><Code fontSize="xs">{settings?.authKeyMasked || 'not set'}</Code></HStack>
          <HStack><Text>Sender ID:</Text><Code fontSize="xs">{settings?.senderId || 'not set'}</Code></HStack>
          <HStack><Text>Template ID:</Text><Code fontSize="xs">{settings?.templateId || 'not set'}</Code></HStack>
        </HStack>
        <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
          <Field.Root>
            <Field.Label>Auth key</Field.Label>
            <Input type="password" value={authKey} onChange={(e) => setAuthKey(e.target.value)} placeholder="MSG91 auth key" autoComplete="off" />
          </Field.Root>
          <Field.Root maxW={{ md: '180px' }}>
            <Field.Label>Sender ID</Field.Label>
            <Input value={senderId} onChange={(e) => setSenderId(e.target.value)} placeholder="e.g. VETSLK" />
          </Field.Root>
          <Field.Root>
            <Field.Label>OTP template ID</Field.Label>
            <Input value={templateId} onChange={(e) => setTemplateId(e.target.value)} placeholder="DLT template / flow ID" />
          </Field.Root>
        </Flex>
        <Box>
          <Button colorPalette="brand" onClick={handleSave} loading={updateSettings.isPending}>
            Save MSG91 settings
          </Button>
        </Box>
      </Stack>
    </SectionCard>
  );
}

export default function Settings() {
  return (
    <Box maxW="860px">
      <PageHeader
        title="Settings"
        description="Payment, email and SMS integrations — configure keys and turn services on or off. All secrets are encrypted before they are stored."
      />
      <Stack gap={6}>
        <StripeSection />
        <EmailSection />
        <Msg91Section />
      </Stack>
    </Box>
  );
}

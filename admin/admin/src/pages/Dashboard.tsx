import {
  Box,
  Flex,
  Grid,
  HStack,
  Heading,
  SimpleGrid,
  Spinner,
  Stack,
  Stat,
  Table,
  Text,
} from '@chakra-ui/react';
import {
  FiBriefcase,
  FiClipboard,
  FiGrid,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';
import type { ReactNode } from 'react';
import { AnalyticsSection } from '../components/AnalyticsSection';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { useStats } from '../hooks/useAdmin';
import { extractErrorMessage } from '../lib/api';
import { formatDateTime } from '../lib/format';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: ReactNode;
  accent: string;
}

function StatCard({ label, value, hint, icon, accent }: StatCardProps) {
  return (
    <Box
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      p={5}
      shadow="sm"
    >
      <Flex justify="space-between" align="flex-start">
        <Stack gap={1}>
          <Text fontSize="xs" fontWeight="bold" color="gray.500" letterSpacing="wider" textTransform="uppercase">
            {label}
          </Text>
          <Stat.Root>
            <Stat.ValueText fontSize="3xl" color="gray.800">
              {value}
            </Stat.ValueText>
          </Stat.Root>
          {hint && <Text fontSize="xs" color="gray.500">{hint}</Text>}
        </Stack>
        <Box
          w="44px"
          h="44px"
          borderRadius="xl"
          bg={accent}
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="lg"
        >
          {icon}
        </Box>
      </Flex>
    </Box>
  );
}

export default function Dashboard() {
  const { data, isLoading, error } = useStats();

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        description="A snapshot of the platform's users, jobs, and applications."
      />

      {isLoading && (
        <Flex py={12} justify="center"><Spinner /></Flex>
      )}

      {error && !isLoading && (
        <Box bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="lg" p={4}>
          <Text color="red.700" fontWeight="semibold">Failed to load stats</Text>
          <Text color="red.600" fontSize="sm">{extractErrorMessage(error)}</Text>
        </Box>
      )}

      {data && (
        <Stack gap={6}>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} gap={4}>
            <StatCard
              label="Users"
              value={data.users.total}
              hint={`${data.users.active} active`}
              icon={<FiUsers />}
              accent="brand.600"
            />
            <StatCard
              label="Candidates"
              value={data.candidates.total}
              hint={`${data.users.candidate} accounts`}
              icon={<FiUserCheck />}
              accent="accent.600"
            />
            <StatCard
              label="Employers"
              value={data.employers.total}
              hint={`${data.users.employer} accounts`}
              icon={<FiBriefcase />}
              accent="orange.500"
            />
            <StatCard
              label="Jobs"
              value={data.jobs.total}
              hint={`${data.jobs.active} active · ${data.jobs.closed} closed`}
              icon={<FiGrid />}
              accent="purple.500"
            />
            <StatCard
              label="Applications"
              value={data.applications.total}
              hint={`${data.applications.pending} pending · ${data.applications.hired} hired`}
              icon={<FiClipboard />}
              accent="teal.500"
            />
          </SimpleGrid>

          <AnalyticsSection />

          <Grid templateColumns={{ base: '1fr', xl: '1fr 1fr' }} gap={6}>
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={5}>
              <HStack justify="space-between" mb={4}>
                <Heading size="sm" color="gray.800">Recent jobs</Heading>
              </HStack>
              {data.recent.jobs.length === 0 ? (
                <Text color="gray.500" fontSize="sm">No jobs yet.</Text>
              ) : (
                <Table.Root size="sm" variant="line">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Title</Table.ColumnHeader>
                      <Table.ColumnHeader>Company</Table.ColumnHeader>
                      <Table.ColumnHeader>Status</Table.ColumnHeader>
                      <Table.ColumnHeader>Created</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {data.recent.jobs.map((job) => (
                      <Table.Row key={job._id}>
                        <Table.Cell fontWeight="semibold">{job.title}</Table.Cell>
                        <Table.Cell>{job.companyName}</Table.Cell>
                        <Table.Cell><StatusBadge value={job.status} /></Table.Cell>
                        <Table.Cell color="gray.500">{formatDateTime(job.createdAt)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              )}
            </Box>

            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={5}>
              <HStack justify="space-between" mb={4}>
                <Heading size="sm" color="gray.800">Recent applications</Heading>
              </HStack>
              {data.recent.applications.length === 0 ? (
                <Text color="gray.500" fontSize="sm">No applications yet.</Text>
              ) : (
                <Table.Root size="sm" variant="line">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Candidate</Table.ColumnHeader>
                      <Table.ColumnHeader>Job</Table.ColumnHeader>
                      <Table.ColumnHeader>Status</Table.ColumnHeader>
                      <Table.ColumnHeader>Applied</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {data.recent.applications.map((app) => (
                      <Table.Row key={app._id}>
                        <Table.Cell fontWeight="semibold">
                          {app.candidateProfile
                            ? `${app.candidateProfile.firstName} ${app.candidateProfile.lastName}`
                            : app.candidateEmail}
                        </Table.Cell>
                        <Table.Cell>{app.job?.title ?? '—'}</Table.Cell>
                        <Table.Cell><StatusBadge value={app.status} /></Table.Cell>
                        <Table.Cell color="gray.500">{formatDateTime(app.createdAt)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              )}
            </Box>
          </Grid>
        </Stack>
      )}
    </Box>
  );
}

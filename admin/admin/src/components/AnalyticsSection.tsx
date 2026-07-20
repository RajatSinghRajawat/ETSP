import {
  Box,
  Flex,
  Heading,
  HStack,
  NativeSelect,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import { FiBriefcase, FiClipboard, FiGrid, FiUserCheck } from 'react-icons/fi';
import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAnalytics } from '../hooks/useAdmin';
import { extractErrorMessage } from '../lib/api';
import type { CityCount, DashboardAnalytics } from '../types';

const COLOR = {
  jobs: '#8b5cf6',
  candidates: '#1a7dd1',
  employers: '#f97316',
  applications: '#0ab6a2',
};

function shortDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function truncate(value: string, max = 24): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

// Aligns the three independent date series into one row per calendar date.
function mergeDateSeries(analytics: DashboardAnalytics) {
  const map = new Map<string, { date: string; jobs: number; candidates: number; employers: number }>();
  const ensure = (date: string) => {
    let row = map.get(date);
    if (!row) {
      row = { date, jobs: 0, candidates: 0, employers: 0 };
      map.set(date, row);
    }
    return row;
  };
  for (const r of analytics.jobsByDate) ensure(r.date).jobs = r.count;
  for (const r of analytics.candidatesByDate) ensure(r.date).candidates = r.count;
  for (const r of analytics.employersByDate) ensure(r.date).employers = r.count;
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={5}>
      <Box mb={4}>
        <Heading size="sm" color="gray.800">{title}</Heading>
        {subtitle && <Text fontSize="xs" color="gray.500" mt={0.5}>{subtitle}</Text>}
      </Box>
      {children}
    </Box>
  );
}

function EmptyChart({ height = 280 }: { height?: number }) {
  return (
    <Flex h={`${height}px`} align="center" justify="center">
      <Text color="gray.400" fontSize="sm">No data for this selection.</Text>
    </Flex>
  );
}

interface TopCityCardProps {
  label: string;
  top: CityCount | null;
  icon: ReactNode;
  accent: string;
}

function TopCityCard({ label, top, icon, accent }: TopCityCardProps) {
  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={4}>
      <HStack gap={3} align="flex-start">
        <Box
          w="38px"
          h="38px"
          borderRadius="lg"
          bg={accent}
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="md"
          flexShrink={0}
        >
          {icon}
        </Box>
        <Stack gap={0.5}>
          <Text fontSize="xs" fontWeight="bold" color="gray.500" letterSpacing="wide" textTransform="uppercase">
            {label}
          </Text>
          <Text fontSize="lg" fontWeight="bold" color="gray.800" lineHeight="short">
            {top ? top.city : '—'}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {top ? `${top.count} total` : 'No data yet'}
          </Text>
        </Stack>
      </HStack>
    </Box>
  );
}

// Horizontal bar chart — data must be sorted descending so the largest sits on top.
function CityBarChart({ data, color }: { data: CityCount[]; color: string }) {
  const top = data.slice(0, 8);
  if (top.length === 0) return <EmptyChart height={240} />;
  return (
    <Box h={`${Math.max(200, top.length * 34)}px`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={top} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef0f3" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="city"
            width={110}
            tick={{ fontSize: 12 }}
            tickFormatter={(v: string) => truncate(v, 16)}
          />
          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Bar dataKey="count" name="Count" fill={color} radius={[0, 4, 4, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function AnalyticsSection() {
  const [city, setCity] = useState('');
  const { data, isLoading, error } = useAnalytics({ city: city || undefined });

  return (
    <Stack gap={5}>
      <Flex
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        direction={{ base: 'column', md: 'row' }}
        gap={3}
      >
        <Box>
          <Heading size="md" color="gray.800">Analytics</Heading>
          <Text fontSize="sm" color="gray.500">
            Daily activity, applications per job, and city-wise breakdown.
          </Text>
        </Box>
        <HStack gap={2}>
          <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">Filter by city</Text>
          <NativeSelect.Root maxW="220px" size="sm">
            <NativeSelect.Field
              value={city}
              onChange={(e) => setCity(e.target.value)}
              bg="white"
            >
              <option value="">All cities</option>
              {(data?.cities ?? []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </HStack>
      </Flex>

      {error && (
        <Box bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="lg" p={4}>
          <Text color="red.700" fontWeight="semibold">Failed to load analytics</Text>
          <Text color="red.600" fontSize="sm">{extractErrorMessage(error)}</Text>
        </Box>
      )}

      {isLoading && !data && (
        <Flex py={12} justify="center"><Spinner /></Flex>
      )}

      {data && (
        <Stack gap={5}>
          <ChartCard
            title="Daily activity"
            subtitle={
              city
                ? `Jobs uploaded, candidates and employers registered in ${city}, by date.`
                : 'Jobs uploaded, candidates and employers registered, by date.'
            }
          >
            {mergeDateSeries(data).length === 0 ? (
              <EmptyChart />
            ) : (
              <Box h="320px">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mergeDateSeries(data)} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
                    <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 12 }} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip labelFormatter={(label) => shortDate(String(label))} />
                    <Legend />
                    <Line type="monotone" dataKey="jobs" name="Jobs uploaded" stroke={COLOR.jobs} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="candidates" name="Candidates registered" stroke={COLOR.candidates} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="employers" name="Employers registered" stroke={COLOR.employers} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </ChartCard>

          <ChartCard
            title="Top jobs by applications"
            subtitle="Jobs ranked by how many candidates applied — the most-applied job is on top."
          >
            {data.applicationsByJob.length === 0 ? (
              <EmptyChart />
            ) : (
              <Box h={`${Math.max(240, data.applicationsByJob.length * 40)}px`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.applicationsByJob}
                    layout="vertical"
                    margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef0f3" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="title"
                      width={170}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v: string) => truncate(v, 26)}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                      formatter={(value) => [value, 'Applications']}
                    />
                    <Bar dataKey="count" name="Applications" fill={COLOR.applications} radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </ChartCard>

          <Box>
            <Heading size="sm" color="gray.800" mb={3}>City breakdown</Heading>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4} mb={4}>
              <TopCityCard label="Top city · Jobs" top={data.topCities.jobs} icon={<FiGrid />} accent="purple.500" />
              <TopCityCard label="Top city · Candidates" top={data.topCities.candidates} icon={<FiUserCheck />} accent="brand.600" />
              <TopCityCard label="Top city · Employers" top={data.topCities.employers} icon={<FiBriefcase />} accent="orange.500" />
              <TopCityCard label="Top city · Applications" top={data.topCities.applications} icon={<FiClipboard />} accent="accent.600" />
            </SimpleGrid>
            <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4}>
              <ChartCard title="Jobs uploaded by city">
                <CityBarChart data={data.cityStats.jobs} color={COLOR.jobs} />
              </ChartCard>
              <ChartCard title="Candidates registered by city">
                <CityBarChart data={data.cityStats.candidates} color={COLOR.candidates} />
              </ChartCard>
              <ChartCard title="Employers registered by city">
                <CityBarChart data={data.cityStats.employers} color={COLOR.employers} />
              </ChartCard>
              <ChartCard title="Applications by city">
                <CityBarChart data={data.cityStats.applications} color={COLOR.applications} />
              </ChartCard>
            </SimpleGrid>
          </Box>
        </Stack>
      )}
    </Stack>
  );
}

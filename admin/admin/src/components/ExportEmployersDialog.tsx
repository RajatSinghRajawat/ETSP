import {
  Button,
  Dialog,
  Field,
  HStack,
  NativeSelect,
  Portal,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import { useEmployers, useImportedEmployers } from '../hooks/useAdmin';
import type { EmployerFilterOptions } from '../types';

export interface EmployerExportFilters {
  search: string;
  status: string;
  industry: string;
  headquarters: string;
}

interface ExportEmployersDialogProps {
  view: 'registered' | 'imported';
  /** Page filters the dialog opens with, so a filtered screen exports as-is by default. */
  initial: EmployerExportFilters;
  options?: EmployerFilterOptions;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (filters: EmployerExportFilters) => void;
}

/**
 * Mounted only while open, so the count query below runs for an admin who is
 * actually about to download and its state starts fresh from the page filters.
 */
export function ExportEmployersDialog({
  view,
  initial,
  options,
  loading,
  onCancel,
  onConfirm,
}: ExportEmployersDialogProps) {
  const isRegistered = view === 'registered';
  const [status, setStatus] = useState(initial.status);
  const [industry, setIndustry] = useState(isRegistered ? initial.industry : '');
  const [headquarters, setHeadquarters] = useState(isRegistered ? initial.headquarters : '');

  const filters: EmployerExportFilters = {
    search: initial.search,
    status,
    industry: isRegistered ? industry : '',
    headquarters: isRegistered ? headquarters : '',
  };

  // Same filters the export will use, asking for a single row — we only read the total.
  const registeredCount = useEmployers(
    {
      page: 1,
      limit: 1,
      search: filters.search || undefined,
      status: filters.status || undefined,
      industry: filters.industry || undefined,
      headquarters: filters.headquarters || undefined,
    },
    { enabled: isRegistered },
  );
  const importedCount = useImportedEmployers(
    {
      page: 1,
      limit: 1,
      search: filters.search || undefined,
      status: filters.status || undefined,
    },
    { enabled: !isRegistered },
  );

  const countQuery = isRegistered ? registeredCount : importedCount;
  const total = countQuery.data?.pagination.total;

  return (
    <Dialog.Root open onOpenChange={(d) => { if (!d.open) onCancel(); }} placement="center">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="lg">
            <Dialog.Header>
              <Dialog.Title>
                Download {isRegistered ? 'registered' : 'imported'} employers
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Stack gap={4}>
                <Text color="gray.600" fontSize="sm">
                  Pick what goes into the sheet. Every matching employer is exported, not just
                  the page on screen.
                </Text>

                <Field.Root>
                  <Field.Label>Status</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      bg="white"
                    >
                      <option value="">All statuses</option>
                      {isRegistered ? (
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
                </Field.Root>

                {/* Industry and headquarters live only on registered profiles. */}
                {isRegistered && (
                  <>
                    <Field.Root>
                      <Field.Label>Industry</Field.Label>
                      <NativeSelect.Root>
                        <NativeSelect.Field
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          bg="white"
                        >
                          <option value="">All industries</option>
                          {options?.industries.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Headquarters</Field.Label>
                      <NativeSelect.Root>
                        <NativeSelect.Field
                          value={headquarters}
                          onChange={(e) => setHeadquarters(e.target.value)}
                          bg="white"
                        >
                          <option value="">All headquarters</option>
                          {options?.headquarters.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field.Root>
                  </>
                )}

                {filters.search && (
                  <Text fontSize="xs" color="gray.500">
                    The page search “{filters.search}” also applies. Clear it on the page to
                    export without it.
                  </Text>
                )}

                <HStack
                  gap={2}
                  bg="gray.50"
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="md"
                  px={3}
                  py={2}
                >
                  {countQuery.isFetching ? (
                    <>
                      <Spinner size="xs" />
                      <Text fontSize="sm" color="gray.600">Counting matching employers…</Text>
                    </>
                  ) : total === 0 ? (
                    <Text fontSize="sm" color="red.600">
                      No employers match these filters — nothing to download.
                    </Text>
                  ) : (
                    <Text fontSize="sm" color="gray.700">
                      <b>{total ?? '—'}</b> {total === 1 ? 'employer' : 'employers'} will be exported.
                    </Text>
                  )}
                </HStack>
              </Stack>
            </Dialog.Body>

            <Dialog.Footer>
              <HStack gap={3}>
                <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
                <Button
                  colorPalette="blue"
                  onClick={() => onConfirm(filters)}
                  loading={loading}
                  disabled={total === 0}
                >
                  <FiDownload style={{ marginRight: 8 }} /> Download Excel
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

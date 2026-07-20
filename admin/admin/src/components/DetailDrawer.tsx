import { Box, Drawer, Heading, Portal, Spinner, Stack, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface DetailDrawerProps {
  open: boolean;
  title: string;
  loading?: boolean;
  onClose: () => void;
  children?: ReactNode;
}

export function DetailDrawer({ open, title, loading, onClose, children }: DetailDrawerProps) {
  return (
    <Drawer.Root open={open} onOpenChange={(d) => { if (!d.open) onClose(); }} placement="end" size="md">
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <Heading size="md">{title}</Heading>
            </Drawer.Header>
            <Drawer.Body>
              {loading ? (
                <Box py={12} textAlign="center"><Spinner /></Box>
              ) : (
                <Stack gap={4}>{children}</Stack>
              )}
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}

export function Detail({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <Box>
      <Text fontSize="xs" color="gray.500" fontWeight="bold" letterSpacing="wider" textTransform="uppercase">
        {label}
      </Text>
      <Box mt={1} fontSize="sm" color="gray.800">{value ?? '—'}</Box>
    </Box>
  );
}

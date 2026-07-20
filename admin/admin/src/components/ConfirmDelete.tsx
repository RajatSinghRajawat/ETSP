import {
  Button,
  Dialog,
  HStack,
  Portal,
  Stack,
  Text,
} from '@chakra-ui/react';

interface ConfirmDeleteProps {
  open: boolean;
  title: string;
  description: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDelete({
  open,
  title,
  description,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDeleteProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(d) => { if (!d.open) onCancel(); }} role="alertdialog" placement="center">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="md">
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={2}>
                <Text color="gray.600" fontSize="sm">{description}</Text>
                <Text color="red.600" fontSize="xs" fontWeight="semibold">This action cannot be undone.</Text>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <HStack gap={3}>
                <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
                <Button colorPalette="red" onClick={onConfirm} loading={loading}>Delete</Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

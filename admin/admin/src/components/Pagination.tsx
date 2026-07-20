import { Button, Flex, HStack, Text } from '@chakra-ui/react';
import type { Pagination as PaginationModel } from '../types';

interface PaginationProps {
  pagination?: PaginationModel;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  if (!pagination || pagination.total === 0) return null;
  const { page, totalPages, total, limit } = pagination;
  const start = (page - 1) * limit + 1;
  const end = Math.min(start + limit - 1, total);

  return (
    <Flex mt={4} align="center" justify="space-between" gap={3} flexWrap="wrap">
      <Text fontSize="sm" color="gray.500">
        Showing <b>{start}</b>–<b>{end}</b> of <b>{total}</b>
      </Text>
      <HStack gap={2}>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <Text fontSize="sm" color="gray.600">
          Page {page} / {totalPages}
        </Text>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </HStack>
    </Flex>
  );
}

import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Flex
      mb={6}
      direction={{ base: 'column', md: 'row' }}
      align={{ base: 'flex-start', md: 'center' }}
      justify="space-between"
      gap={4}
    >
      <Box>
        <Heading size="lg" color="gray.800">
          {title}
        </Heading>
        {description && (
          <Text color="gray.500" mt={1} fontSize="sm">
            {description}
          </Text>
        )}
      </Box>
      {actions && <Flex gap={3}>{actions}</Flex>}
    </Flex>
  );
}

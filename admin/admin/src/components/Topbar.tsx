import { Box, Button, Flex, HStack, IconButton, Menu, Portal, Text } from '@chakra-ui/react';
import { FiChevronDown, FiLogOut, FiMenu, FiUser } from 'react-icons/fi';
import { useAuth } from '../lib/auth';

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, signOut } = useAuth();
  const initials = (user?.email ?? 'A').slice(0, 1).toUpperCase();

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      height="64px"
      px={{ base: 4, md: 6 }}
      bg="white"
      borderBottomWidth="1px"
      borderColor="gray.200"
      position="sticky"
      top={0}
      zIndex={5}
    >
      <HStack gap={3}>
        <IconButton
          aria-label="Open menu"
          variant="ghost"
          onClick={onMenuClick}
          display={{ base: 'inline-flex', lg: 'none' }}
        >
          <FiMenu />
        </IconButton>
        <Box>
          <Text fontSize="xs" fontWeight="bold" color="gray.500" letterSpacing="wider" textTransform="uppercase">
            Welcome back
          </Text>
          <Text fontSize="md" fontWeight="bold" color="gray.800">
            {user?.email ?? 'Admin'}
          </Text>
        </Box>
      </HStack>

      <Menu.Root>
        <Menu.Trigger asChild>
          <Button variant="ghost" size="sm" px={2}>
            <HStack gap={3}>
              <Box
                w="36px"
                h="36px"
                borderRadius="full"
                bgGradient="linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)"
                color="white"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontWeight="bold"
                fontSize="sm"
              >
                {initials}
              </Box>
              <Box textAlign="left" display={{ base: 'none', sm: 'block' }}>
                <Text fontSize="sm" fontWeight="bold" color="gray.800" lineHeight="1.1">
                  Administrator
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {user?.role ?? 'admin'}
                </Text>
              </Box>
              <Box color="gray.400">
                <FiChevronDown />
              </Box>
            </HStack>
          </Button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content minWidth="220px" shadow="lg" borderColor="gray.200">
              <Menu.ItemGroup>
                <Menu.ItemGroupLabel>Account</Menu.ItemGroupLabel>
                <Menu.Item value="profile" cursor="default">
                  <FiUser style={{ marginRight: 10 }} />
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold">{user?.email}</Text>
                    <Text fontSize="xs" color="gray.500">Logged in as {user?.role}</Text>
                  </Box>
                </Menu.Item>
              </Menu.ItemGroup>
              <Menu.Separator />
              <Menu.Item value="logout" color="red.600" onClick={signOut}>
                <FiLogOut style={{ marginRight: 10 }} />
                Sign out
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </Flex>
  );
}

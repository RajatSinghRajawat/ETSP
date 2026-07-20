import { Box, Flex, HStack, Heading, Stack, Text } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import {
  FiBriefcase,
  FiClipboard,
  FiCreditCard,
  FiGrid,
  FiHome,
  FiLayers,
  FiSettings,
  FiShoppingCart,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';
import type { ReactNode } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <FiHome />, end: true },
  { to: '/users', label: 'Users', icon: <FiUsers /> },
  { to: '/candidates', label: 'Candidates', icon: <FiUserCheck /> },
  { to: '/employers', label: 'Employers', icon: <FiBriefcase /> },
  { to: '/jobs', label: 'Jobs', icon: <FiGrid /> },
  { to: '/applications', label: 'Applications', icon: <FiClipboard /> },
  { to: '/plans', label: 'Plans', icon: <FiLayers /> },
  { to: '/subscriptions', label: 'Subscriptions', icon: <FiCreditCard /> },
  { to: '/purchases', label: 'Purchases', icon: <FiShoppingCart /> },
  { to: '/settings', label: 'Settings', icon: <FiSettings /> },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Flex
      direction="column"
      height="100%"
      width={{ base: 'full', lg: '260px' }}
      minWidth={{ lg: '260px' }}
      bg="white"
      borderRightWidth="1px"
      borderColor="gray.200"
      px={4}
      py={6}
    >
      <HStack gap={3} px={2} mb={8}>
        <Box
          w="40px"
          h="40px"
          borderRadius="xl"
          bgGradient="linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)"
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontWeight="black"
          fontSize="lg"
          shadow="md"
        >
          E
        </Box>
        <Box>
          <Heading size="sm" color="gray.800" lineHeight="1">
            ETS Admin
          </Heading>
          <Text fontSize="xs" color="gray.500" mt={0.5}>
            Control Center
          </Text>
        </Box>
      </HStack>

      <Stack as="nav" gap={1} flex="1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            style={{ textDecoration: 'none' }}
          >
            {({ isActive }) => (
              <HStack
                gap={3}
                px={3}
                py={2.5}
                borderRadius="lg"
                fontSize="sm"
                fontWeight={isActive ? '700' : '500'}
                color={isActive ? 'white' : 'gray.700'}
                bg={isActive ? 'brand.600' : 'transparent'}
                _hover={isActive ? {} : { bg: 'gray.100', color: 'brand.700' }}
                transition="background 0.15s, color 0.15s"
              >
                <Box fontSize="lg" display="flex" alignItems="center">
                  {item.icon}
                </Box>
                <Text>{item.label}</Text>
              </HStack>
            )}
          </NavLink>
        ))}
      </Stack>

      <Box
        mt={6}
        p={4}
        borderRadius="xl"
        bgGradient="linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)"
        color="white"
      >
        <Text fontSize="xs" fontWeight="bold" letterSpacing="wider" opacity={0.85}>
          ETS PLATFORM
        </Text>
        <Text fontSize="sm" fontWeight="semibold" mt={1} lineHeight="1.4">
          Manage everything from one place — securely.
        </Text>
      </Box>
    </Flex>
  );
}

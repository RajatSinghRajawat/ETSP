import { Box, Drawer, Flex, Portal } from '@chakra-ui/react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ChatBot } from './ChatBot';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <Flex height="100vh" bg="gray.50">
      <Box display={{ base: 'none', lg: 'block' }}>
        <Sidebar />
      </Box>

      <Drawer.Root open={open} onOpenChange={(d) => setOpen(d.open)} placement="start">
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content maxW="280px">
              <Sidebar onNavigate={() => setOpen(false)} />
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      <Flex direction="column" flex="1" minWidth={0}>
        <Topbar onMenuClick={() => setOpen(true)} />
        <Box as="main" flex="1" overflowY="auto" px={{ base: 4, md: 8 }} py={{ base: 5, md: 8 }}>
          <Outlet />
        </Box>
      </Flex>

      <ChatBot />
    </Flex>
  );
}

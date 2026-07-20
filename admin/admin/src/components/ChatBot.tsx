import {
  Box,
  Flex,
  HStack,
  IconButton,
  Input,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { FiCpu, FiMessageSquare, FiSend, FiX } from 'react-icons/fi';
import { useAskAssistant } from '../hooks/useAdmin';
import { extractErrorMessage } from '../lib/api';
import type { ChatMessage } from '../types';

const GRADIENT = 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)';

const SUGGESTIONS = [
  'How many jobs were uploaded today?',
  'Which city has the most jobs uploaded?',
  'Which candidate applied to the most jobs?',
  'Which city has the most employers and candidates?',
  'Which company posts the most jobs?',
];

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <Flex justify={isUser ? 'flex-end' : 'flex-start'}>
      <Box
        maxW="85%"
        bg={isUser ? 'brand.600' : 'gray.100'}
        color={isUser ? 'white' : 'gray.800'}
        px={3.5}
        py={2.5}
        borderRadius="xl"
        borderBottomRightRadius={isUser ? 'sm' : 'xl'}
        borderBottomLeftRadius={isUser ? 'xl' : 'sm'}
        fontSize="sm"
        lineHeight="1.55"
        whiteSpace="pre-wrap"
        wordBreak="break-word"
        shadow="xs"
      >
        {message.content}
      </Box>
    </Flex>
  );
}

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const ask = useAskAssistant();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, ask.isPending, open]);

  function send(question: string) {
    const q = question.trim();
    if (!q || ask.isPending) return;
    const history = messages.slice(-8);
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setInput('');
    ask.mutate(
      { question: q, history },
      {
        onSuccess: (data) =>
          setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]),
        onError: (err) =>
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `⚠️ ${extractErrorMessage(err)}` },
          ]),
      },
    );
  }

  return (
    <Box position="fixed" bottom={{ base: 4, md: 6 }} right={{ base: 4, md: 6 }} zIndex={1400}>
      {open && (
        <Flex
          direction="column"
          position="absolute"
          bottom="72px"
          right={0}
          w={{ base: 'calc(100vw - 32px)', sm: '384px' }}
          h={{ base: '70vh', sm: '544px' }}
          bg="white"
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="2xl"
          shadow="2xl"
          overflow="hidden"
        >
          {/* Header */}
          <Flex
            align="center"
            justify="space-between"
            px={4}
            py={3}
            bgGradient={GRADIENT}
            color="white"
          >
            <HStack gap={2.5}>
              <Flex
                w="34px"
                h="34px"
                borderRadius="lg"
                bg="whiteAlpha.300"
                align="center"
                justify="center"
                fontSize="lg"
              >
                <FiCpu />
              </Flex>
              <Box>
                <Text fontWeight="bold" fontSize="sm" lineHeight="1.2">AI Assistant</Text>
                <Text fontSize="xs" color="whiteAlpha.800">Ask anything about your data</Text>
              </Box>
            </HStack>
            <IconButton
              aria-label="Close assistant"
              size="sm"
              variant="ghost"
              color="white"
              _hover={{ bg: 'whiteAlpha.300' }}
              onClick={() => setOpen(false)}
            >
              <FiX />
            </IconButton>
          </Flex>

          {/* Messages */}
          <Stack flex="1" overflowY="auto" px={4} py={4} gap={3} bg="gray.50">
            {messages.length === 0 && (
              <Stack gap={3}>
                <MessageBubble
                  message={{
                    role: 'assistant',
                    content:
                      'Hi! I am your data assistant. Ask me anything about jobs, candidates, employers, applications, or cities.',
                  }}
                />
                <Text fontSize="xs" fontWeight="semibold" color="gray.500" pt={1}>
                  Try asking
                </Text>
                <Stack gap={2}>
                  {SUGGESTIONS.map((s) => (
                    <Box
                      key={s}
                      as="button"
                      onClick={() => send(s)}
                      textAlign="left"
                      fontSize="xs"
                      color="gray.700"
                      bg="white"
                      borderWidth="1px"
                      borderColor="gray.200"
                      borderRadius="lg"
                      px={3}
                      py={2}
                      _hover={{ borderColor: 'brand.400', bg: 'brand.50' }}
                    >
                      {s}
                    </Box>
                  ))}
                </Stack>
              </Stack>
            )}

            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}

            {ask.isPending && (
              <Flex justify="flex-start">
                <HStack
                  bg="gray.100"
                  color="gray.500"
                  px={3.5}
                  py={2.5}
                  borderRadius="xl"
                  borderBottomLeftRadius="sm"
                  fontSize="sm"
                  gap={2}
                >
                  <Spinner size="xs" />
                  <Text>Thinking…</Text>
                </HStack>
              </Flex>
            )}
            <div ref={endRef} />
          </Stack>

          {/* Input */}
          <HStack
            p={3}
            gap={2}
            borderTopWidth="1px"
            borderColor="gray.200"
            bg="white"
          >
            <Input
              autoFocus
              placeholder="Type your question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              size="sm"
              borderRadius="lg"
            />
            <IconButton
              aria-label="Send message"
              size="sm"
              borderRadius="lg"
              bgGradient={GRADIENT}
              color="white"
              _hover={{ opacity: 0.9 }}
              disabled={!input.trim() || ask.isPending}
              onClick={() => send(input)}
            >
              <FiSend />
            </IconButton>
          </HStack>
        </Flex>
      )}

      {/* Floating toggle button */}
      <IconButton
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
        onClick={() => setOpen((v) => !v)}
        w="56px"
        h="56px"
        borderRadius="full"
        bgGradient={GRADIENT}
        color="white"
        shadow="lg"
        fontSize="22px"
        _hover={{ transform: 'scale(1.05)' }}
        transition="transform 0.15s ease"
      >
        {open ? <FiX /> : <FiMessageSquare />}
      </IconButton>
    </Box>
  );
}

import {
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  Portal,
  Spinner,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { FiCode, FiDownload, FiEye, FiRefreshCw, FiSave, FiX } from 'react-icons/fi';
import { useBuildResume, useGetResume, useSaveResume } from '../hooks/useAdmin';
import { extractErrorMessage } from '../lib/api';
import type { CandidateRow } from '../types';
import { toaster } from './Toaster';

interface Props {
  open: boolean;
  candidate: CandidateRow | null;
  onClose: () => void;
}

export function ResumeModal({ open, candidate, onClose }: Props) {
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  const [htmlDraft, setHtmlDraft] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const savedResume = useGetResume(candidate?._id ?? null);
  const buildResume = useBuildResume();
  const saveResume = useSaveResume();

  const currentHtml = savedResume.data?.htmlContent ?? '';

  useEffect(() => {
    if (currentHtml) setHtmlDraft(currentHtml);
  }, [currentHtml]);

  useEffect(() => {
    if (mode === 'preview' && iframeRef.current && htmlDraft) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlDraft);
        doc.close();
      }
    }
  }, [mode, htmlDraft]);

  function handleBuild() {
    if (!candidate) return;
    buildResume.mutate(candidate._id, {
      onSuccess: (data) => {
        setHtmlDraft(data.htmlContent);
        setMode('preview');
        toaster.create({ title: 'Resume generated successfully!', type: 'success' });
      },
      onError: (err) => toaster.create({ title: 'Generation failed', description: extractErrorMessage(err), type: 'error' }),
    });
  }

  function handleSave() {
    if (!candidate) return;
    saveResume.mutate(
      { candidateId: candidate._id, htmlContent: htmlDraft },
      {
        onSuccess: () => {
          setMode('preview');
          toaster.create({ title: 'Resume saved!', type: 'success' });
        },
        onError: (err) => toaster.create({ title: 'Save failed', description: extractErrorMessage(err), type: 'error' }),
      },
    );
  }

  function handleDownload() {
    const blob = new Blob([htmlDraft], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${candidate?.firstName ?? 'resume'}_${candidate?.lastName ?? ''}_resume.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasResume = Boolean(htmlDraft);
  const isGenerating = buildResume.isPending;
  const isSaving = saveResume.isPending;

  return (
    <Dialog.Root open={open} size="full" onOpenChange={(e) => { if (!e.open) onClose(); }}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="100vw"
            maxH="100vh"
            h="100vh"
            borderRadius="0"
            display="flex"
            flexDirection="column"
            bg="gray.50"
          >
            {/* Header Bar */}
            <Flex
              align="center"
              justify="space-between"
              px={5}
              py={3}
              bg="white"
              borderBottomWidth="1px"
              borderColor="gray.200"
              flexShrink={0}
            >
              <HStack gap={3}>
                <Box
                  w={2}
                  h={6}
                  bg="teal.500"
                  borderRadius="full"
                />
                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="gray.800">
                    AI Resume Builder
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {candidate?.firstName} {candidate?.lastName} — Veterinary Professional
                  </Text>
                </Box>
              </HStack>

              <HStack gap={2}>
                {hasResume && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setMode(mode === 'preview' ? 'edit' : 'preview')}
                      colorPalette={mode === 'edit' ? 'teal' : 'gray'}
                    >
                      {mode === 'preview' ? <><FiCode style={{ marginRight: 6 }} /> Edit HTML</> : <><FiEye style={{ marginRight: 6 }} /> Preview</>}
                    </Button>
                    {mode === 'edit' && (
                      <Button size="sm" colorPalette="teal" onClick={handleSave} loading={isSaving}>
                        <FiSave style={{ marginRight: 6 }} /> Save Changes
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={handleDownload}>
                      <FiDownload style={{ marginRight: 6 }} /> Download
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  colorPalette="teal"
                  onClick={handleBuild}
                  loading={isGenerating}
                  loadingText="Generating…"
                >
                  <FiRefreshCw style={{ marginRight: 6 }} />
                  {hasResume ? 'Regenerate' : 'Build Resume'}
                </Button>
                <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close">
                  <FiX />
                </Button>
              </HStack>
            </Flex>

            {/* Body */}
            <Box flex={1} overflow="hidden" position="relative">
              {/* Loading state while fetching existing resume */}
              {savedResume.isLoading && (
                <Flex h="100%" align="center" justify="center" direction="column" gap={3}>
                  <Spinner size="xl" color="teal.500" />
                  <Text color="gray.500" fontSize="sm">Loading resume…</Text>
                </Flex>
              )}

              {/* Generating state */}
              {isGenerating && (
                <Flex
                  h="100%"
                  align="center"
                  justify="center"
                  direction="column"
                  gap={4}
                  bg="white"
                >
                  <Box
                    w={16}
                    h={16}
                    borderRadius="full"
                    bg="teal.50"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Spinner size="lg" color="teal.500" />
                  </Box>
                  <Box textAlign="center">
                    <Text fontWeight="semibold" color="gray.700">AI is crafting your resume…</Text>
                    <Text fontSize="sm" color="gray.400" mt={1}>
                      Tailoring content for veterinary professionals
                    </Text>
                  </Box>
                </Flex>
              )}

              {/* Empty state */}
              {!savedResume.isLoading && !isGenerating && !hasResume && (
                <Flex h="100%" align="center" justify="center" direction="column" gap={5}>
                  <Box
                    w={20}
                    h={20}
                    borderRadius="2xl"
                    bg="teal.50"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="3xl"
                  >
                    📄
                  </Box>
                  <Box textAlign="center" maxW="380px">
                    <Text fontWeight="bold" fontSize="lg" color="gray.700" mb={2}>
                      No resume yet
                    </Text>
                    <Text fontSize="sm" color="gray.500" lineHeight="tall">
                      Click <strong>Build Resume</strong> to generate a professional veterinary resume
                      from this candidate's profile using AI.
                    </Text>
                  </Box>
                  <Button colorPalette="teal" onClick={handleBuild} size="lg">
                    Build Resume with AI
                  </Button>
                </Flex>
              )}

              {/* Preview mode */}
              {!isGenerating && hasResume && mode === 'preview' && (
                <Box h="100%" bg="gray.100" overflow="auto" p={6}>
                  <Box
                    maxW="794px"
                    mx="auto"
                    boxShadow="xl"
                    borderRadius="md"
                    overflow="hidden"
                  >
                    <iframe
                      ref={iframeRef}
                      title="Resume Preview"
                      style={{
                        width: '100%',
                        minHeight: '1100px',
                        border: 'none',
                        display: 'block',
                      }}
                      sandbox="allow-same-origin"
                    />
                  </Box>
                </Box>
              )}

              {/* Edit mode */}
              {!isGenerating && hasResume && mode === 'edit' && (
                <Box h="100%" display="flex" flexDirection="column" p={4} gap={3}>
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                      Edit raw HTML — changes will be reflected in preview after saving
                    </Text>
                    <Button size="xs" colorPalette="teal" onClick={handleSave} loading={isSaving}>
                      <FiSave style={{ marginRight: 4 }} /> Save
                    </Button>
                  </HStack>
                  <Textarea
                    value={htmlDraft}
                    onChange={(e) => setHtmlDraft(e.target.value)}
                    fontFamily="mono"
                    fontSize="xs"
                    flex={1}
                    h="full"
                    resize="none"
                    bg="white"
                    borderColor="gray.200"
                    spellCheck={false}
                    style={{ minHeight: 'calc(100vh - 180px)' }}
                  />
                </Box>
              )}
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

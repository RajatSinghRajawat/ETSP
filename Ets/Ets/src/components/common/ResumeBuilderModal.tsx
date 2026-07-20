import { useEffect, useRef, useState } from 'react';
import { downloadResumeHtmlAsPdf } from '../../utils/resumePdf';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Close,
  Code,
  Download,
  Preview,
  AutoFixHigh,
  Save,
} from '@mui/icons-material';
import {
  useBuildMyResumeMutation,
  useGetMyResumeQuery,
  useSaveMyResumeMutation,
} from '../../store/api/resumeApi';
import { useGetMyUsageQuery } from '../../store/api/subscriptionApi';
import { usePurchaseCheckoutMutation } from '../../store/api/purchaseApi';

interface Props {
  open: boolean;
  onClose: () => void;
  candidateName?: string;
}

export default function ResumeBuilderModal({ open, onClose, candidateName = 'Candidate' }: Props) {
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  const [htmlDraft, setHtmlDraft] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { data: savedResume, isLoading: isFetching } = useGetMyResumeQuery(undefined, { skip: !open });
  const [buildResume, { isLoading: isGenerating }] = useBuildMyResumeMutation();
  const [saveResume, { isLoading: isSaving }] = useSaveMyResumeMutation();
  const { data: usageData, refetch: refetchUsage } = useGetMyUsageQuery(undefined, { skip: !open });
  const [purchaseCheckout, { isLoading: isBuyingCredit }] = usePurchaseCheckoutMutation();

  // Resume builder access: included with EXCEL, else paid per resume (₹25).
  const resumeIncluded = Boolean(usageData?.data.effectiveFeatures?.resumeBuilderIncluded);
  const resumeCredits = usageData?.data.usage.resumeCredits?.available ?? 0;
  const needsPurchase = Boolean(usageData) && !resumeIncluded && resumeCredits === 0;

  const savedHtml = savedResume?.data?.htmlContent ?? '';

  useEffect(() => {
    if (savedHtml) setHtmlDraft(savedHtml);
  }, [savedHtml]);

  // Broadcast open/close state to the chat widget so it can offer resume-specific options.
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('resume-builder:state', {
        detail: { open, candidateName },
      }),
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent('resume-builder:state', { detail: { open: false } }),
      );
    };
  }, [open, candidateName]);

  // Receive AI-refined HTML from the chat widget and apply it to the preview.
  useEffect(() => {
    const handleApply = (event: Event) => {
      const detail = (event as CustomEvent<{ htmlContent?: string }>).detail;
      if (!detail?.htmlContent) return;
      setHtmlDraft(detail.htmlContent);
      setMode('preview');
      setSaveSuccess(false);
    };
    window.addEventListener('resume-builder:apply', handleApply);
    return () => window.removeEventListener('resume-builder:apply', handleApply);
  }, []);

  useEffect(() => {
    if (mode === 'preview' && iframeRef.current && htmlDraft) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlDraft);
        doc.close();
      }
    }
  }, [mode, htmlDraft, open]);

  async function handleBuild() {
    // Free candidates without a credit buy one first (₹25, one-time checkout).
    if (needsPurchase) {
      try {
        const res = await purchaseCheckout({ type: 'resume_builder' }).unwrap();
        window.location.href = res.data.url;
      } catch {
        // Errors surface via the global interceptor/upgrade dialog.
      }
      return;
    }
    setSaveSuccess(false);
    try {
      const result = await buildResume().unwrap();
      setHtmlDraft(result.data.htmlContent);
      setMode('preview');
      refetchUsage();
    } catch {
      // Gated/failed requests already surface via the global upgrade dialog
      // or the API error interceptor (402 NO_RESUME_CREDITS included).
    }
  }

  async function handleSave() {
    try {
      await saveResume(htmlDraft).unwrap();
      setSaveSuccess(true);
      setMode('preview');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // Handled by the global interceptor/upgrade dialog.
    }
  }

  async function handleDownload() {
    if (!htmlDraft || isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadResumeHtmlAsPdf(htmlDraft, candidateName);
    } catch {
      // The util already opens a print fallback on failure.
    } finally {
      setIsDownloading(false);
    }
  }

  const hasResume = Boolean(htmlDraft);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      disableEnforceFocus
      disableRestoreFocus
      PaperProps={{ sx: { bgcolor: '#f5f5f0' } }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          py: 1.5,
          px: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 4, height: 32, bgcolor: '#0ab6a2', borderRadius: 1 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              AI Resume Builder
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {candidateName} — Veterinary Professional
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {hasResume && (
            <>
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(_e, v) => { if (v) setMode(v); }}
                size="small"
              >
                <ToggleButton value="preview">
                  <Preview fontSize="small" sx={{ mr: 0.5 }} /> Preview
                </ToggleButton>
                <ToggleButton value="edit">
                  <Code fontSize="small" sx={{ mr: 0.5 }} /> Edit HTML
                </ToggleButton>
              </ToggleButtonGroup>

              {mode === 'edit' && (
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={isSaving ? <CircularProgress size={14} color="inherit" /> : <Save />}
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  Save
                </Button>
              )}

              <Tooltip title="Download as PDF">
                <span>
                  <IconButton size="small" onClick={handleDownload} disabled={isDownloading}>
                    {isDownloading
                      ? <CircularProgress size={18} />
                      : <Download />}
                  </IconButton>
                </span>
              </Tooltip>
            </>
          )}

          {!resumeIncluded && resumeCredits > 0 && (
            <Tooltip title="Each build uses one ₹25 resume credit">
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0ab6a2' }}>
                {resumeCredits} credit{resumeCredits === 1 ? '' : 's'}
              </Typography>
            </Tooltip>
          )}
          <Button
            variant="contained"
            size="small"
            sx={{ bgcolor: '#0ab6a2', '&:hover': { bgcolor: '#089e8c' } }}
            startIcon={
              isGenerating || isBuyingCredit ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <AutoFixHigh />
              )
            }
            onClick={handleBuild}
            disabled={isGenerating || isBuyingCredit}
          >
            {isGenerating
              ? 'Generating…'
              : isBuyingCredit
                ? 'Redirecting…'
                : needsPurchase
                  ? 'Build Resume — ₹25'
                  : hasResume
                    ? 'Regenerate'
                    : 'Build Resume'}
          </Button>

          <IconButton size="small" onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {saveSuccess && (
          <Alert severity="success" sx={{ borderRadius: 0 }}>
            Resume saved successfully!
          </Alert>
        )}

        {/* Fetching saved resume */}
        {isFetching && (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stack alignItems="center" spacing={2}>
              <CircularProgress sx={{ color: '#0ab6a2' }} />
              <Typography variant="body2" color="text.secondary">Loading your resume…</Typography>
            </Stack>
          </Box>
        )}

        {/* Generating */}
        {isGenerating && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.paper',
            }}
          >
            <Stack alignItems="center" spacing={3}>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  bgcolor: '#e8f9f7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CircularProgress sx={{ color: '#0ab6a2' }} size={36} />
              </Box>
              <Box textAlign="center">
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Crafting your resume…
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  AI is tailoring content for veterinary professionals
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        {/* Empty state */}
        {!isFetching && !isGenerating && !hasResume && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.paper',
            }}
          >
            <Stack alignItems="center" spacing={3} sx={{ maxWidth: 400, textAlign: 'center', p: 4 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 4,
                  bgcolor: '#e8f9f7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 40,
                }}
              >
                📄
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  No resume yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click <strong>Build Resume</strong> to generate a professional veterinary
                  resume from your profile using AI. It takes about 10–15 seconds.
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                sx={{ bgcolor: '#0ab6a2', '&:hover': { bgcolor: '#089e8c' } }}
                startIcon={<AutoFixHigh />}
                onClick={handleBuild}
              >
                Build Resume with AI
              </Button>
            </Stack>
          </Box>
        )}

        {/* Preview */}
        {!isGenerating && hasResume && mode === 'preview' && (
          <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#e8e8e3', p: { xs: 1, md: 4 } }}>
            <Box
              sx={{
                maxWidth: 794,
                mx: 'auto',
                boxShadow: 6,
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <iframe
                ref={iframeRef}
                title="Resume Preview"
                style={{ width: '100%', minHeight: 1100, border: 'none', display: 'block' }}
                sandbox="allow-same-origin"
              />
            </Box>
          </Box>
        )}

        {/* Edit HTML */}
        {!isGenerating && hasResume && mode === 'edit' && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, gap: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Edit raw HTML — changes saved when you click Save
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={isSaving ? <CircularProgress size={12} /> : <Save />}
                onClick={handleSave}
                disabled={isSaving}
              >
                Save Changes
              </Button>
            </Box>
            <TextField
              multiline
              fullWidth
              value={htmlDraft}
              onChange={(e) => setHtmlDraft(e.target.value)}
              inputProps={{ style: { fontFamily: 'monospace', fontSize: 12 } }}
              sx={{ flex: 1, '& .MuiInputBase-root': { height: '100%', alignItems: 'flex-start' } }}
              minRows={30}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

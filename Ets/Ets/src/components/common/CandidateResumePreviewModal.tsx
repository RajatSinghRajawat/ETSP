import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  IconButton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { Close, Download, PictureAsPdf } from '@mui/icons-material';
import { downloadResumeHtmlAsPdf } from '../../utils/resumePdf';

interface CandidateResumePreviewModalProps {
  open: boolean;
  onClose: () => void;
  candidateName: string;
  htmlContent: string;
  isLoading?: boolean;
  loadError?: string;
}

const CandidateResumePreviewModal: React.FC<CandidateResumePreviewModalProps> = ({
  open,
  onClose,
  candidateName,
  htmlContent,
  isLoading = false,
  loadError,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (!open || !iframeRef.current || !htmlContent) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(htmlContent);
    doc.close();
  }, [open, htmlContent]);

  const handleDownload = async () => {
    if (!htmlContent || isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadResumeHtmlAsPdf(htmlContent, candidateName);
      setToast({ open: true, message: 'Resume downloaded as PDF', severity: 'success' });
    } catch (error) {
      const message =
        (error as { message?: string })?.message ??
        'Could not generate the PDF. Please try again.';
      setToast({ open: true, message, severity: 'error' });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      disableEnforceFocus
      disableRestoreFocus
      PaperProps={{ sx: { bgcolor: '#f5f5f0' } }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          px: { xs: 2, md: 3 },
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
            }}
          >
            <PictureAsPdf />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }} noWrap>
              Resume Preview
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {candidateName} — preview before downloading
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="contained"
            startIcon={isDownloading ? <CircularProgress size={16} color="inherit" /> : <Download />}
            onClick={handleDownload}
            disabled={isDownloading || isLoading || !htmlContent}
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 2.5,
              px: 2.5,
              py: 1,
              background: 'linear-gradient(135deg, #0ab6a2 0%, #0c5283 100%)',
              boxShadow: '0 10px 22px -8px rgba(10,182,162,0.5)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0ab6a2 0%, #0c5283 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 14px 28px -8px rgba(10,182,162,0.6)',
              },
              '&.Mui-disabled': {
                background: 'rgba(12,82,131,0.4)',
                color: '#fff',
                opacity: 0.7,
              },
            }}
          >
            {isDownloading ? 'Generating PDF…' : 'Download PDF'}
          </Button>
          <IconButton onClick={onClose} aria-label="Close preview">
            <Close />
          </IconButton>
        </Stack>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          py: { xs: 2, md: 4 },
          px: { xs: 1, md: 3 },
          bgcolor: '#e9ebee',
        }}
      >
        {isLoading && (
          <Stack alignItems="center" spacing={2} sx={{ mt: 6 }}>
            <CircularProgress />
            <Typography color="text.secondary">Loading resume…</Typography>
          </Stack>
        )}

        {!isLoading && loadError && (
          <Alert severity="error" sx={{ alignSelf: 'flex-start', maxWidth: 600 }}>
            {loadError}
          </Alert>
        )}

        {!isLoading && !loadError && htmlContent && (
          <Box
            sx={{
              width: 'min(820px, 100%)',
              boxShadow: '0 18px 40px -18px rgba(12,82,131,0.35)',
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: '#fff',
            }}
          >
            <Box
              component="iframe"
              ref={iframeRef}
              title="Candidate resume preview"
              sx={{
                width: '100%',
                height: 'calc(100vh - 160px)',
                border: 'none',
                display: 'block',
              }}
            />
          </Box>
        )}
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          sx={{ borderRadius: 2.5, fontWeight: 600 }}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default CandidateResumePreviewModal;

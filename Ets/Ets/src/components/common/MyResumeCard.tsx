import { useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import {
  AutoFixHigh,
  CheckCircle,
  Delete,
  Description,
  OpenInNew,
  UploadFile,
} from '@mui/icons-material';
import ResumeBuilderModal from './ResumeBuilderModal';
import {
  useDeleteMyUploadedResumeMutation,
  useGetMyResumeQuery,
  useSetMyResumeSourceMutation,
  useUploadMyResumeMutation,
} from '../../store/api/resumeApi';

const ACCEPTED_TYPES = '.pdf,.doc,.docx';
const MAX_BYTES = 5 * 1024 * 1024;

const ACCEPTED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string; errors?: Record<string, string[]> } }).data;
    const validationMessages = data?.errors ? Object.values(data.errors).flat().filter(Boolean) : [];
    return validationMessages[0] ?? data?.message ?? fallback;
  }
  return fallback;
};

const formatSize = (bytes: number) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * The candidate's two routes to a resume: let the AI build one from their
 * profile, or upload their own file. Both can exist; `source` picks the one
 * employers see.
 */
const MyResumeCard: React.FC<{ candidateName?: string }> = ({ candidateName = 'Candidate' }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // A 404 here just means "no resume yet" — the card renders its empty state.
  const { data, isLoading } = useGetMyResumeQuery();
  const [uploadResume, { isLoading: isUploading }] = useUploadMyResumeMutation();
  const [deleteUpload, { isLoading: isDeleting }] = useDeleteMyUploadedResumeMutation();
  const [setSource, { isLoading: isSwitching }] = useSetMyResumeSourceMutation();

  const resume = data?.data;
  const uploaded = resume?.uploadedFile?.url ? resume.uploadedFile : null;
  const hasAiResume = Boolean(resume?.htmlContent);
  const activeSource = resume?.source ?? 'ai';

  const handlePickFile = () => {
    setError('');
    setMessage('');
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!ACCEPTED_MIME.has(file.type)) {
      setError('Only PDF, DOC and DOCX resumes are allowed.');
      return;
    }

    if (file.size > MAX_BYTES) {
      setError('Resume must be 5MB or smaller.');
      return;
    }

    try {
      await uploadResume(file).unwrap();
      setMessage('Resume uploaded. Employers will now see this file.');
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, 'Could not upload the resume.'));
    }
  };

  const handleRemoveUpload = async () => {
    setError('');
    setMessage('');

    try {
      await deleteUpload().unwrap();
      setMessage('Uploaded resume removed.');
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, 'Could not remove the uploaded resume.'));
    }
  };

  const handleSwitchSource = async (source: 'ai' | 'upload') => {
    setError('');
    setMessage('');

    try {
      await setSource(source).unwrap();
      setMessage(
        source === 'ai'
          ? 'Employers will now see your AI-built resume.'
          : 'Employers will now see your uploaded file.',
      );
    } catch (switchError) {
      setError(getApiErrorMessage(switchError, 'Could not switch the resume.'));
    }
  };

  return (
    <>
      <Card
        elevation={0}
        sx={{
          borderRadius: '14px',
          border: '1px solid',
          borderColor: 'rgba(12,82,131,0.10)',
          boxShadow: '0 8px 30px -18px rgba(12,82,131,0.35)',
        }}
      >
        <CardContent sx={{ p: { xs: 1.75, md: 2 }, '&:last-child': { pb: { xs: 1.75, md: 2 } } }}>
          {/* One compact row: the resume is a supporting action on the
              dashboard, not the main event — the applications list is. */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(12,82,131,0.08)',
                color: '#0c5283',
              }}
            >
              <Description sx={{ fontSize: 22 }} />
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.98rem', lineHeight: 1.3 }}>My Resume</Typography>
              {!isLoading && !hasAiResume && !uploaded ? (
                <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 600 }}>
                  No resume yet — employers see one on every application.
                </Typography>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Build one with AI from your profile, or upload your own file.
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<AutoFixHigh sx={{ fontSize: 18 }} />}
                onClick={() => setBuilderOpen(true)}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                  boxShadow: 'none',
                }}
              >
                Build with AI
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={isUploading ? <CircularProgress size={14} color="inherit" /> : <UploadFile sx={{ fontSize: 18 }} />}
                disabled={isUploading}
                onClick={handlePickFile}
                sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
              >
                {isUploading ? 'Uploading…' : 'Upload'}
              </Button>
            </Stack>
          </Box>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
            hidden
          />

          {error && <Alert severity="error" sx={{ borderRadius: 2.5, mt: 1.5 }}>{error}</Alert>}
          {message && (
            <Alert severity="success" sx={{ borderRadius: 2.5, mt: 1.5 }} onClose={() => setMessage('')}>
              {message}
            </Alert>
          )}

          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {!isLoading && (hasAiResume || uploaded) && (
            <Stack spacing={1} sx={{ mt: 1.5 }}>
              {hasAiResume && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    flexWrap: 'wrap',
                    px: 1.5, py: 1,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: activeSource === 'ai' ? '#0ab6a2' : 'rgba(12,82,131,0.12)',
                    bgcolor: activeSource === 'ai' ? 'rgba(10,182,162,0.05)' : 'transparent',
                  }}
                >
                  <AutoFixHigh sx={{ color: '#0c5283' }} />
                  <Box sx={{ minWidth: 0, flex: '1 1 160px' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>AI-built resume</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Generated from your profile — you can edit and re-style it.
                    </Typography>
                  </Box>
                  {activeSource === 'ai' ? (
                    <Chip
                      size="small"
                      icon={<CheckCircle sx={{ fontSize: 16 }} />}
                      label="Shown to employers"
                      color="success"
                      sx={{ fontWeight: 700 }}
                    />
                  ) : (
                    <Button
                      size="small"
                      disabled={isSwitching}
                      onClick={() => handleSwitchSource('ai')}
                      sx={{ fontWeight: 700, textTransform: 'none' }}
                    >
                      Show this one
                    </Button>
                  )}
                  <Button
                    size="small"
                    startIcon={<OpenInNew fontSize="small" />}
                    onClick={() => setBuilderOpen(true)}
                    sx={{ fontWeight: 700, textTransform: 'none' }}
                  >
                    Open
                  </Button>
                </Box>
              )}

              {uploaded && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    flexWrap: 'wrap',
                    px: 1.5, py: 1,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: activeSource === 'upload' ? '#0ab6a2' : 'rgba(12,82,131,0.12)',
                    bgcolor: activeSource === 'upload' ? 'rgba(10,182,162,0.05)' : 'transparent',
                  }}
                >
                  <Description sx={{ color: '#0c5283' }} />
                  <Box sx={{ minWidth: 0, flex: '1 1 160px' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', wordBreak: 'break-word' }}>
                      {uploaded.originalName || uploaded.fileName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Uploaded by you{uploaded.size ? ` · ${formatSize(uploaded.size)}` : ''}
                    </Typography>
                  </Box>
                  {activeSource === 'upload' ? (
                    <Chip
                      size="small"
                      icon={<CheckCircle sx={{ fontSize: 16 }} />}
                      label="Shown to employers"
                      color="success"
                      sx={{ fontWeight: 700 }}
                    />
                  ) : (
                    <Button
                      size="small"
                      disabled={isSwitching}
                      onClick={() => handleSwitchSource('upload')}
                      sx={{ fontWeight: 700, textTransform: 'none' }}
                    >
                      Show this one
                    </Button>
                  )}
                  <Button
                    size="small"
                    startIcon={<OpenInNew fontSize="small" />}
                    component="a"
                    href={uploaded.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ fontWeight: 700, textTransform: 'none' }}
                  >
                    Open
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Delete fontSize="small" />}
                    disabled={isDeleting}
                    onClick={handleRemoveUpload}
                    sx={{ fontWeight: 700, textTransform: 'none' }}
                  >
                    Remove
                  </Button>
                </Box>
              )}
            </Stack>
          )}
        </CardContent>
      </Card>

      <ResumeBuilderModal
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        candidateName={candidateName}
      />
    </>
  );
};

export default MyResumeCard;

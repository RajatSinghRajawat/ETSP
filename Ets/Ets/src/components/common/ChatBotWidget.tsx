import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Fab,
  IconButton,
  InputAdornment,
  Slide,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Zoom,
} from '@mui/material';
import {
  AutoAwesome,
  CheckCircle,
  Close,
  LockOutlined,
  Send,
  SmartToyOutlined,
} from '@mui/icons-material';
import {
  useRefineCandidateProfileMutation,
  useSearchJobsWithAiMutation,
  type AiJobMatch,
  type RefinedCandidateProfile,
} from '../../store/api/aiAssistantApi';
import { useRefineMyResumeMutation } from '../../store/api/resumeApi';
import { openUpgradePrompt, useAiEntitlement } from '../../hooks/useAiEntitlement';

type Sender = 'bot' | 'user';

type BotMode =
  | 'idle'
  | 'awaiting-consent'
  | 'asking'
  | 'refining'
  | 'ready'
  | 'inserted'
  | 'resume-menu'
  | 'resume-design-input'
  | 'resume-data-input'
  | 'resume-regenerate-menu'
  | 'resume-applying'
  | 'resume-applied'
  | 'job-search-ready'
  | 'job-search-running'
  | 'job-search-results';

type ResumeIntent = 'design' | 'data' | 'regenerate';

interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  time: string;
  jobs?: AiJobMatch[];
}

interface ProfileQuestion {
  key: string;
  prompt: string;
}

const PROFILE_QUESTIONS: ProfileQuestion[] = [
  { key: 'firstName', prompt: 'What is your first name?' },
  { key: 'lastName', prompt: 'And your last name?' },
  { key: 'phone', prompt: 'What is the best phone number to reach you on?' },
  { key: 'gender', prompt: 'How do you identify (Male / Female / Non-binary / Prefer not to say)?' },
  { key: 'addressBlock', prompt: 'What is your full address (house, street, city, pincode)?' },
  { key: 'currentLocation', prompt: 'Which city are you currently based in?' },
  { key: 'preferredLocations', prompt: 'Which 1-3 cities would you prefer to work in? (comma separated)' },
  { key: 'currentJobTitle', prompt: 'What is your current job title?' },
  { key: 'organizationName', prompt: 'Which organization are you currently with?' },
  { key: 'employmentType', prompt: 'Employment type (Full-time / Part-time / Contract / Freelance / Internship / Temporary)?' },
  { key: 'currentSalary', prompt: 'What is your current salary (with currency if you like)?' },
  { key: 'salaryFormat', prompt: 'Is that per annum, per month, per week, per day, or per hour?' },
  { key: 'skills', prompt: 'List 4-8 of your top skills (comma separated).' },
  { key: 'experienceBlock', prompt: 'Tell me briefly about your most recent role: job title, organization, start date, end date (or "present"), and what you did.' },
  { key: 'educationLevel', prompt: 'Highest education level (10th / 12th / Diploma / Bachelor / Master / Doctorate)?' },
  { key: 'degree', prompt: 'What is your degree name (e.g. B.V.Sc, MCA, MBBS)?' },
  { key: 'specialization', prompt: 'What was your specialization?' },
  { key: 'educationCity', prompt: 'Which city did you study in?' },
  { key: 'grade', prompt: 'What was your grade or percentage?' },
  { key: 'professionalLicenses', prompt: 'Any professional licenses or registrations? (Type "none" if not applicable.)' },
  { key: 'profileSummary', prompt: 'In a few words, what makes you a strong candidate? Don\'t worry about grammar — I will fix it.' },
];

const SKIP_TOKENS = new Set(['skip', 'no', 'none', 'na', 'n/a', '-']);

const formatTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const buildBotReply = (text: string, isEmployer: boolean): string => {
  const lower = text.toLowerCase();

  if (isEmployer) {
    if (lower.includes('post') || lower.includes('vacancy') || lower.includes('job')) {
      return 'You can post a new job from your Employer Dashboard → "Post a Job". Add the role, location, salary and required skills to start receiving applications.';
    }
    if (lower.includes('application') || lower.includes('applicant') || lower.includes('candidate') || lower.includes('hire')) {
      return 'Open "Applications" in your dashboard to review applicants, shortlist them, and update each application\'s status.';
    }
    if (lower.includes('profile') || lower.includes('company')) {
      return 'Update your company profile from Employer Dashboard → "Company Profile" — a complete, verified profile attracts more candidates.';
    }
    if (lower.includes('employee') || lower.includes('team')) {
      return 'Manage your team members under "Employees" in the employer dashboard.';
    }
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return 'Hi there! I am VetBot. Ask me about posting jobs, managing applications or your company profile.';
    }
    return "Got it — try one of the quick suggestions below to post jobs or manage your applications.";
  }

  if (lower.includes('profile')) {
    return 'You can build your candidate profile from the "My Profile" page. Add your experience, skills and verifications to stand out.';
  }
  if (lower.includes('job') || lower.includes('vet') || lower.includes('career')) {
    return 'Head over to "Find Jobs" — you can filter by location, skill and employment type.';
  }
  if (lower.includes('employer') || lower.includes('hire')) {
    return 'Employers can post jobs and review applications from their dashboard.';
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return 'Hi there! I am VetBot. Ask me about jobs, profiles or applications on VetsLinked.';
  }
  return "Got it — I'll connect you with the right resource. Meanwhile, try one of the quick suggestions below.";
};

const CANDIDATE_QUICK_REPLIES = [
  'How do I create a profile?',
  'Find vet jobs near me',
  'How do I apply to a job?',
];

const EMPLOYER_QUICK_REPLIES = [
  'How do I post a job?',
  'How do I review applications?',
  'How do I edit my company profile?',
];

const getCurrentUserRole = (): string | null => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return (JSON.parse(raw) as { role?: string }).role ?? null;
  } catch {
    return null;
  }
};

const REGENERATE_SUGGESTIONS = [
  'Modern minimal one-column layout',
  'Creative two-column with sidebar',
  'Classic ATS-friendly design',
  'Bold colorful header style',
  'Compact one-page summary',
];

const JOB_SEARCH_PROMPTS = [
  'Part-time vet job in Mumbai',
  'Full-time surgery role with 2+ years exp',
  'Remote / hybrid veterinary positions',
  'Entry-level vet tech roles in Bangalore',
];

const ChatBotWidget: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isCandidateProfilePage = location.pathname === '/candidate/profile';
  const isFindJobPage = location.pathname === '/find-job';
  const isEmployer = useMemo(
    () => getCurrentUserRole() === 'employer' || location.pathname.startsWith('/employer'),
    [location.pathname],
  );
  const quickReplies = isEmployer ? EMPLOYER_QUICK_REPLIES : CANDIDATE_QUICK_REPLIES;

  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(1);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [botMode, setBotMode] = useState<BotMode>('idle');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [refinedProfile, setRefinedProfile] = useState<RefinedCandidateProfile | null>(null);

  const [refineProfile, { isLoading: isRefining }] = useRefineCandidateProfileMutation();
  const [refineResume, { isLoading: isRefiningResume }] = useRefineMyResumeMutation();
  const [searchJobs, { isLoading: isSearchingJobs }] = useSearchJobsWithAiMutation();
  const { isLoggedIn, isChecking, aiAllowed, planName } = useAiEntitlement();

  // Whole-chat gate: without a plan that includes AI, VetBot stays locked —
  // no scripted replies either, only the upgrade/sign-in prompt.
  const aiLocked = !isChecking && (!isLoggedIn || !aiAllowed);

  const [resumeBuilderOpen, setResumeBuilderOpen] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushBotMessage = (text: string, delay = 600) => {
    setIsTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, sender: 'bot', text, time: formatTime() },
      ]);
      setIsTyping(false);
    }, delay);
  };

  const pushUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, sender: 'user', text, time: formatTime() },
    ]);
  };

  const initConversation = () => {
    setQuestionIndex(0);
    setAnswers({});
    setRefinedProfile(null);

    if (resumeBuilderOpen) {
      setMessages([
        {
          id: 'm-welcome',
          sender: 'bot',
          text: "I see your resume builder is open. What would you like me to do? I can polish the design, add new information, or regenerate a fresh layout.",
          time: formatTime(),
        },
      ]);
      setBotMode('resume-menu');
      return;
    }

    if (isFindJobPage) {
      setMessages([
        {
          id: 'm-welcome',
          sender: 'bot',
          text: "Tell me what kind of vet job you're looking for — role, location, experience level, schedule. I'll match it against every active posting and show you the best fits.",
          time: formatTime(),
        },
      ]);
      setBotMode('job-search-ready');
      return;
    }

    if (isCandidateProfilePage) {
      setMessages([
        {
          id: 'm-welcome',
          sender: 'bot',
          text: "Hi! I'm VetBot. Would you like me to help you complete and polish your candidate profile? I'll ask a few quick questions, fix spelling and grammar, and fill the form for you.",
          time: formatTime(),
        },
      ]);
      setBotMode('awaiting-consent');
    } else {
      setMessages([
        {
          id: 'm-welcome',
          sender: 'bot',
          text: "Hi! I'm VetBot. How can I help you today?",
          time: formatTime(),
        },
      ]);
      setBotMode('idle');
    }
  };

  useEffect(() => {
    initConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCandidateProfilePage, isFindJobPage, resumeBuilderOpen]);

  useEffect(() => {
    const handleResumeState = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      setResumeBuilderOpen(Boolean(detail?.open));
    };
    window.addEventListener('resume-builder:state', handleResumeState);
    return () => window.removeEventListener('resume-builder:state', handleResumeState);
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, open, isTyping]);

  useEffect(() => () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }, []);

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) setUnread(0);
      return next;
    });
  };

  const askQuestion = (index: number) => {
    const question = PROFILE_QUESTIONS[index];
    if (!question) return;
    const counter = `(${index + 1}/${PROFILE_QUESTIONS.length}) `;
    pushBotMessage(`${counter}${question.prompt}`);
  };

  const finishQuestionnaire = async (collected: Record<string, string>) => {
    if (!ensureAiAccess()) {
      setBotMode('idle');
      return;
    }
    setBotMode('refining');
    pushBotMessage("Thanks! Polishing your answers with AI now…", 300);

    try {
      const result = await refineProfile(collected).unwrap();
      setRefinedProfile(result.data);
      setBotMode('ready');
      pushBotMessage(
        "All set! I've cleaned up the spelling, grammar and structure. Click \"Insert into form\" below to fill the profile fields.",
        1000,
      );
    } catch (error) {
      const apiError = error as { data?: { message?: string }; status?: number };
      const message =
        apiError?.data?.message ??
        'Sorry, I could not refine the profile right now. Please try again in a moment.';
      pushBotMessage(message, 800);
      setBotMode('asking');
      setQuestionIndex(PROFILE_QUESTIONS.length - 1);
    }
  };

  /**
   * Every AI flow starts here: verify the user's plan includes AI before any
   * questions are asked or requests are made. The backend enforces the same
   * rule on every endpoint — this only gives a friendly, early prompt.
   */
  const ensureAiAccess = (): boolean => {
    if (!isLoggedIn) {
      pushBotMessage('Please sign in first — AI features are available with plans that include AI.', 400);
      return false;
    }
    if (isChecking) {
      pushBotMessage('One moment — checking your plan…', 300);
      return false;
    }
    if (!aiAllowed) {
      pushBotMessage(
        planName
          ? `Your current plan "${planName}" does not include AI features. Upgrade your plan to unlock AI profile help, the resume builder and AI job search.`
          : 'AI features are not included in your current plan. Upgrade to unlock them.',
        400,
      );
      openUpgradePrompt();
      return false;
    }
    return true;
  };

  const handleConsentReply = (reply: 'yes' | 'no') => {
    pushUserMessage(reply === 'yes' ? 'Yes, please' : 'No, thanks');
    if (reply === 'yes') {
      if (!ensureAiAccess()) {
        setBotMode('idle');
        return;
      }
      setBotMode('asking');
      setTimeout(() => askQuestion(0), 700);
    } else {
      setBotMode('idle');
      pushBotMessage("No problem. I'm here if you change your mind — just open the chat again.", 600);
    }
  };

  const handleInsert = () => {
    if (!refinedProfile) return;
    window.dispatchEvent(
      new CustomEvent('candidate-profile:ai-fill', { detail: refinedProfile }),
    );
    pushUserMessage('Insert into form');
    pushBotMessage("Done! Your profile fields have been filled. Review them and click Submit when you're happy.", 600);
    setBotMode('inserted');
  };

  const handleRestart = () => {
    initConversation();
  };

  const callResumeRefine = async (mode: ResumeIntent, instructions: string) => {
    if (!ensureAiAccess()) {
      setBotMode('resume-menu');
      return;
    }
    setBotMode('resume-applying');
    pushBotMessage(
      mode === 'regenerate'
        ? 'On it — regenerating a fresh resume for you…'
        : 'Working on it — applying your changes to the resume…',
      300,
    );
    try {
      const result = await refineResume({ mode, instructions }).unwrap();
      window.dispatchEvent(
        new CustomEvent('resume-builder:apply', {
          detail: { htmlContent: result.data.htmlContent },
        }),
      );
      pushBotMessage(
        "Done! I've updated the resume preview. Take a look — click Save in the builder to keep it.",
        800,
      );
      setBotMode('resume-applied');
    } catch (error) {
      const apiError = error as { data?: { message?: string } };
      const message =
        apiError?.data?.message ??
        'Sorry, I could not update the resume right now. Please try again.';
      pushBotMessage(message, 600);
      setBotMode('resume-menu');
    }
  };

  const handleResumeIntent = (intent: ResumeIntent) => {
    if (!ensureAiAccess()) {
      return;
    }
    if (intent === 'design') {
      pushUserMessage('Fix the design');
      setBotMode('resume-design-input');
      pushBotMessage(
        'Great — tell me what you would like to change about the design. For example: "use a softer colour palette", "make the sidebar narrower", "switch to a serif font for headings".',
        500,
      );
      return;
    }
    if (intent === 'data') {
      pushUserMessage('Add more data');
      setBotMode('resume-data-input');
      pushBotMessage(
        'Sure — share the new information you want me to add (achievements, projects, certifications, dates, etc.). I will weave it into the resume.',
        500,
      );
      return;
    }
    pushUserMessage('Regenerate');
    setBotMode('resume-regenerate-menu');
    pushBotMessage(
      'Pick a direction below, or type your own (e.g. "modern minimalist with warm tones").',
      500,
    );
  };

  const handleRegenerateChoice = (suggestion: string) => {
    pushUserMessage(suggestion);
    callResumeRefine('regenerate', suggestion);
  };

  const runJobSearch = async (rawQuery: string) => {
    if (!ensureAiAccess()) {
      setBotMode('job-search-ready');
      return;
    }
    setBotMode('job-search-running');
    pushBotMessage('Searching across all active jobs with AI…', 300);

    try {
      const response = await searchJobs({ query: rawQuery }).unwrap();
      const { jobs, summary } = response.data;

      const finalSummary =
        summary?.trim() ||
        (jobs.length > 0
          ? `Here are the top matches I found.`
          : `I couldn't find any matching jobs. Try widening the location or removing some filters.`);

      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}-jobs`,
          sender: 'bot',
          text: finalSummary,
          time: formatTime(),
          jobs,
        },
      ]);
      setBotMode('job-search-results');
    } catch (error) {
      const apiError = error as { data?: { message?: string }; status?: number };
      const message =
        apiError?.status === 401
          ? 'Please sign in to use AI job search — it is included in plans with AI features.'
          : apiError?.data?.message ?? 'Sorry, the search failed. Please try again in a moment.';
      pushBotMessage(message, 500);
      setBotMode('job-search-ready');
    }
  };

  const handleJobOpen = (jobId: string) => {
    setOpen(false);
    navigate(`/jobs/${jobId}`);
  };

  const handleJobSearchSuggestion = (text: string) => {
    pushUserMessage(text);
    runJobSearch(text);
  };

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (aiLocked) {
      openUpgradePrompt();
      return;
    }

    pushUserMessage(trimmed);
    setDraft('');

    if (botMode === 'job-search-ready' || botMode === 'job-search-results') {
      runJobSearch(trimmed);
      return;
    }

    if (botMode === 'resume-design-input') {
      callResumeRefine('design', trimmed);
      return;
    }

    if (botMode === 'resume-data-input') {
      callResumeRefine('data', trimmed);
      return;
    }

    if (botMode === 'resume-regenerate-menu') {
      callResumeRefine('regenerate', trimmed);
      return;
    }

    if (botMode === 'asking') {
      const currentQuestion = PROFILE_QUESTIONS[questionIndex];
      if (!currentQuestion) return;

      const isSkipped = SKIP_TOKENS.has(trimmed.toLowerCase());
      const stored = isSkipped ? '' : trimmed;

      const updatedAnswers = { ...answers, [currentQuestion.key]: stored };
      setAnswers(updatedAnswers);

      const nextIndex = questionIndex + 1;
      if (nextIndex < PROFILE_QUESTIONS.length) {
        setQuestionIndex(nextIndex);
        setTimeout(() => askQuestion(nextIndex), 500);
      } else {
        finishQuestionnaire(updatedAnswers);
      }
      return;
    }

    if (botMode === 'awaiting-consent') {
      const lower = trimmed.toLowerCase();
      if (['yes', 'y', 'ok', 'sure', 'okay'].includes(lower)) {
        if (!ensureAiAccess()) {
          setBotMode('idle');
          return;
        }
        setBotMode('asking');
        setTimeout(() => askQuestion(0), 600);
      } else if (['no', 'n', 'nope', 'not now'].includes(lower)) {
        setBotMode('idle');
        pushBotMessage("No problem. I'm here whenever you need help.", 500);
      } else {
        pushBotMessage('Please reply with Yes or No so I know how to help.', 400);
      }
      return;
    }

    pushBotMessage(buildBotReply(trimmed, isEmployer), 700);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage(draft);
    }
  };

  const panelWidth = useMemo(() => ({ xs: 'calc(100vw - 32px)', sm: 380 }), []);

  const composerDisabled =
    botMode === 'refining' ||
    botMode === 'inserted' ||
    botMode === 'resume-applying' ||
    botMode === 'resume-menu' ||
    botMode === 'resume-applied' ||
    botMode === 'job-search-running' ||
    isRefining ||
    isRefiningResume ||
    isSearchingJobs;
  const showInsertButton = botMode === 'ready' && refinedProfile;
  const showQuickReplies =
    botMode === 'idle' &&
    messages.length <= 2 &&
    !isCandidateProfilePage &&
    !isFindJobPage &&
    !resumeBuilderOpen;
  const showConsentButtons = botMode === 'awaiting-consent';
  const showResumeMenu = botMode === 'resume-menu' || botMode === 'resume-applied';
  const showRegenerateSuggestions = botMode === 'resume-regenerate-menu';
  const showJobSearchSuggestions =
    isFindJobPage && (botMode === 'job-search-ready' || botMode === 'job-search-results') && messages.length <= 2;

  return (
    <>
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Box
          role="dialog"
          aria-label="VetBot chat"
          sx={{
            position: 'fixed',
            right: { xs: 16, md: 24 },
            bottom: { xs: 92, md: 104 },
            width: panelWidth,
            maxHeight: { xs: 'calc(100vh - 120px)', md: 580 },
            height: { xs: 'calc(100vh - 140px)', md: 580 },
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 4,
            overflow: 'hidden',
            bgcolor: 'background.paper',
            boxShadow: '0 24px 60px -20px rgba(12,82,131,0.45)',
            border: '1px solid rgba(12,82,131,0.08)',
            zIndex: (theme) => theme.zIndex.tooltip + 1,
          }}
        >
          <Box
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'rgba(255,255,255,0.18)',
                width: 44,
                height: 44,
                backdropFilter: 'blur(10px)',
              }}
            >
              <SmartToyOutlined />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>VetBot</Typography>
              <Stack direction="row" spacing={0.8} alignItems="center">
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#7CFFB2',
                    boxShadow: '0 0 0 3px rgba(124,255,178,0.25)',
                  }}
                />
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {aiLocked
                    ? 'Locked · AI plan required'
                    : botMode === 'asking'
                      ? `Question ${Math.min(questionIndex + 1, PROFILE_QUESTIONS.length)} of ${PROFILE_QUESTIONS.length}`
                      : resumeBuilderOpen
                        ? 'Resume assistant · powered by AI'
                        : isFindJobPage
                          ? 'Job search · powered by RAG'
                          : 'Online · powered by AI'}
                </Typography>
              </Stack>
            </Box>
            {botMode === 'inserted' && (
              <Tooltip title="Start over">
                <IconButton
                  size="small"
                  onClick={handleRestart}
                  aria-label="Restart chat"
                  sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
                >
                  <AutoAwesome />
                </IconButton>
              </Tooltip>
            )}
            <IconButton
              size="small"
              onClick={handleToggle}
              aria-label="Close chat"
              sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
            >
              <Close />
            </IconButton>
          </Box>

          {isChecking ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={28} />
            </Box>
          ) : aiLocked ? (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                px: 3,
                textAlign: 'center',
                bgcolor: (theme) =>
                  theme.palette.mode === 'light' ? '#f7fafc' : 'rgba(15,23,42,0.6)',
              }}
            >
              <Avatar sx={{ width: 60, height: 60, bgcolor: 'rgba(12,82,131,0.1)' }}>
                <LockOutlined sx={{ color: '#0c5283', fontSize: 30 }} />
              </Avatar>
              <Typography sx={{ fontWeight: 800 }}>VetBot AI is locked</Typography>
              <Typography variant="body2" color="text.secondary">
                {!isLoggedIn
                  ? 'Sign in with a plan that includes AI features to chat with VetBot.'
                  : planName
                    ? `Your current plan "${planName}" does not include AI features. Upgrade to chat with VetBot, polish your profile, build resumes and search jobs with AI.`
                    : 'AI chat is available on plans that include AI features. Upgrade to unlock it.'}
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  setOpen(false);
                  navigate(!isLoggedIn ? '/login' : '/pricing');
                }}
                sx={{
                  mt: 0.5,
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 3,
                  background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                }}
              >
                {!isLoggedIn ? 'Sign In' : 'View Plans'}
              </Button>
            </Box>
          ) : (
            <>
          <Box
            ref={listRef}
            sx={{
              flex: 1,
              overflowY: 'auto',
              px: 2,
              py: 2.5,
              bgcolor: (theme) =>
                theme.palette.mode === 'light' ? '#f7fafc' : 'rgba(15,23,42,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            {messages.map((message) => (
              <Bubble
                key={message.id}
                message={message}
                onJobOpen={handleJobOpen}
              />
            ))}
            {(isTyping ||
              botMode === 'refining' ||
              botMode === 'resume-applying' ||
              botMode === 'job-search-running') && <TypingIndicator />}
          </Box>

          {showJobSearchSuggestions && (
            <Box sx={{ px: 2, pb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5, fontWeight: 600 }}>
                Try one of these:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.6, overflowX: 'auto', pb: 0.5 }}>
                {JOB_SEARCH_PROMPTS.map((prompt) => (
                  <Box
                    key={prompt}
                    onClick={() => handleJobSearchSuggestion(prompt)}
                    sx={{
                      flexShrink: 0,
                      px: 1.5,
                      py: 0.8,
                      borderRadius: 10,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: '#0c5283',
                      bgcolor: 'rgba(10,182,162,0.10)',
                      border: '1px solid rgba(10,182,162,0.25)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(10,182,162,0.18)',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    {prompt}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {showResumeMenu && (
            <Box sx={{ px: 2, pb: 1.2 }}>
              <Stack spacing={1}>
                <ResumeOption
                  label="Fix the design"
                  caption="Tweak colours, layout, fonts or spacing"
                  onClick={() => handleResumeIntent('design')}
                  primary
                />
                <ResumeOption
                  label="Add more data"
                  caption="Insert new achievements, projects or details"
                  onClick={() => handleResumeIntent('data')}
                />
                <ResumeOption
                  label="Regenerate"
                  caption="Generate a fresh look from scratch"
                  onClick={() => handleResumeIntent('regenerate')}
                />
              </Stack>
            </Box>
          )}

          {showRegenerateSuggestions && (
            <Box sx={{ px: 2, pb: 1.2 }}>
              <Stack spacing={0.8}>
                {REGENERATE_SUGGESTIONS.map((suggestion) => (
                  <Box
                    key={suggestion}
                    onClick={() => handleRegenerateChoice(suggestion)}
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderRadius: 2,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: '#0c5283',
                      bgcolor: 'rgba(10,182,162,0.08)',
                      border: '1px solid rgba(10,182,162,0.22)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(10,182,162,0.16)',
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    {suggestion}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {showConsentButtons && (
            <Box sx={{ px: 2, pb: 1.2 }}>
              <Stack direction="row" spacing={1}>
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  onClick={() => handleConsentReply('yes')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                  }}
                >
                  Yes, please
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => handleConsentReply('no')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2,
                    borderColor: 'rgba(12,82,131,0.4)',
                    color: '#0c5283',
                  }}
                >
                  No, thanks
                </Button>
              </Stack>
            </Box>
          )}

          {showInsertButton && (
            <Box sx={{ px: 2, pb: 1.2 }}>
              <Button
                fullWidth
                variant="contained"
                size="medium"
                onClick={handleInsert}
                startIcon={<CheckCircle />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  py: 1.1,
                  background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                  boxShadow: '0 10px 24px -8px rgba(10,182,162,0.5)',
                }}
              >
                Insert into form
              </Button>
            </Box>
          )}

          {showQuickReplies && (
            <Box sx={{ px: 2, pb: 1 }}>
              <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
                {quickReplies.map((reply) => (
                  <Box
                    key={reply}
                    onClick={() => sendMessage(reply)}
                    sx={{
                      flexShrink: 0,
                      px: 1.5,
                      py: 0.8,
                      borderRadius: 10,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: '#0c5283',
                      bgcolor: 'rgba(10,182,162,0.10)',
                      border: '1px solid rgba(10,182,162,0.25)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(10,182,162,0.18)',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    {reply}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          <Box
            sx={{
              p: 1.5,
              borderTop: '1px solid rgba(12,82,131,0.08)',
              bgcolor: 'background.paper',
            }}
          >
            <TextField
              fullWidth
              size="small"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                botMode === 'refining'
                  ? 'AI is polishing your profile…'
                  : botMode === 'inserted'
                    ? 'Profile inserted. Restart to start over.'
                    : botMode === 'resume-applying'
                      ? 'AI is updating your resume…'
                      : botMode === 'resume-menu' || botMode === 'resume-applied'
                        ? 'Choose an option above'
                        : botMode === 'resume-design-input'
                          ? 'Describe the design changes…'
                          : botMode === 'resume-data-input'
                            ? 'Share the new info to add…'
                            : botMode === 'job-search-running'
                              ? 'AI is searching jobs…'
                              : botMode === 'job-search-ready' || botMode === 'job-search-results'
                                ? 'Describe the job you want…'
                                : 'Type your message…'
              }
              disabled={composerDisabled}
              multiline
              maxRows={3}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => sendMessage(draft)}
                        disabled={!draft.trim() || composerDisabled}
                        aria-label="Send message"
                        sx={{
                          bgcolor: draft.trim() ? '#0ab6a2' : 'transparent',
                          color: draft.trim() ? '#fff' : 'inherit',
                          '&:hover': { bgcolor: draft.trim() ? '#089685' : 'rgba(0,0,0,0.04)' },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {isRefining ? <CircularProgress size={16} color="inherit" /> : <Send fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  pr: 0.5,
                  '& fieldset': { borderColor: 'rgba(12,82,131,0.18)' },
                  '&:hover fieldset': { borderColor: 'rgba(12,82,131,0.35)' },
                  '&.Mui-focused fieldset': { borderColor: '#0ab6a2' },
                },
              }}
            />
            <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mt: 0.8, pl: 0.5 }}>
              <AutoAwesome sx={{ fontSize: 12, color: '#0ab6a2' }} />
              <Typography variant="caption" color="text.secondary">
                Powered by VetsLinked AI
              </Typography>
            </Stack>
          </Box>
            </>
          )}
        </Box>
      </Slide>

      <Zoom in>
        <Tooltip title={open ? 'Close chat' : 'Chat with VetBot'} placement="left">
          <Badge
            badgeContent={unread}
            color="error"
            overlap="circular"
            invisible={open || unread === 0}
            sx={{
              position: 'fixed',
              right: { xs: 16, md: 24 },
              bottom: { xs: 24, md: 28 },
              zIndex: (theme) => theme.zIndex.tooltip + 2,
            }}
          >
            <Fab
              aria-label={open ? 'Close chat' : 'Open chat'}
              onClick={handleToggle}
              sx={{
                width: 60,
                height: 60,
                background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                color: '#fff',
                boxShadow: '0 14px 30px -8px rgba(12,82,131,0.55)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                  transform: 'scale(1.06)',
                  boxShadow: '0 18px 36px -8px rgba(12,82,131,0.65)',
                },
              }}
            >
              {open ? <Close /> : <SmartToyOutlined />}
            </Fab>
          </Badge>
        </Tooltip>
      </Zoom>
    </>
  );
};

interface ResumeOptionProps {
  label: string;
  caption: string;
  onClick: () => void;
  primary?: boolean;
}

const ResumeOption: React.FC<ResumeOptionProps> = ({ label, caption, onClick, primary }) => (
  <Box
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') onClick();
    }}
    sx={{
      px: 1.8,
      py: 1.2,
      borderRadius: 2.5,
      cursor: 'pointer',
      bgcolor: primary ? 'rgba(10,182,162,0.12)' : 'rgba(12,82,131,0.05)',
      border: '1px solid',
      borderColor: primary ? 'rgba(10,182,162,0.45)' : 'rgba(12,82,131,0.18)',
      transition: 'all 0.2s ease',
      '&:hover': {
        bgcolor: primary ? 'rgba(10,182,162,0.22)' : 'rgba(12,82,131,0.1)',
        transform: 'translateY(-1px)',
        boxShadow: '0 8px 18px -8px rgba(12,82,131,0.25)',
      },
    }}
  >
    <Typography sx={{ fontWeight: 700, color: '#0c5283', fontSize: 14 }}>{label}</Typography>
    <Typography variant="caption" color="text.secondary">
      {caption}
    </Typography>
  </Box>
);

interface BubbleProps {
  message: ChatMessage;
  onJobOpen?: (jobId: string) => void;
}

const Bubble: React.FC<BubbleProps> = ({ message, onJobOpen }) => {
  const isUser = message.sender === 'user';
  const hasJobs = !isUser && message.jobs && message.jobs.length > 0;

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: hasJobs ? '95%' : '85%',
        width: hasJobs ? '95%' : 'auto',
      }}
    >
      {!isUser && (
        <Avatar
          sx={{
            width: 28,
            height: 28,
            mt: 0.4,
            bgcolor: '#0c5283',
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          <SmartToyOutlined sx={{ fontSize: 16 }} />
        </Avatar>
      )}
      <Box sx={{ flex: hasJobs ? 1 : undefined, minWidth: 0 }}>
        <Box
          sx={{
            px: 1.8,
            py: 1.2,
            borderRadius: 2.5,
            borderTopLeftRadius: !isUser ? 0.5 : undefined,
            borderTopRightRadius: isUser ? 0.5 : undefined,
            bgcolor: isUser ? '#0c5283' : (theme) =>
              theme.palette.mode === 'light' ? '#fff' : 'rgba(255,255,255,0.06)',
            color: isUser ? '#fff' : 'text.primary',
            boxShadow: isUser
              ? '0 6px 16px -6px rgba(12,82,131,0.4)'
              : '0 2px 8px -2px rgba(0,0,0,0.08)',
            border: isUser ? 'none' : '1px solid rgba(12,82,131,0.08)',
            fontSize: 14,
            lineHeight: 1.45,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {message.text}
        </Box>
        {hasJobs && message.jobs && (
          <Stack spacing={1} sx={{ mt: 1 }}>
            {message.jobs.map((job) => (
              <JobMatchCard key={job._id} job={job} onOpen={onJobOpen} />
            ))}
          </Stack>
        )}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            mt: 0.4,
            textAlign: isUser ? 'right' : 'left',
            fontSize: 10.5,
          }}
        >
          {message.time}
        </Typography>
      </Box>
    </Stack>
  );
};

interface JobMatchCardProps {
  job: AiJobMatch;
  onOpen?: (jobId: string) => void;
}

const JobMatchCard: React.FC<JobMatchCardProps> = ({ job, onOpen }) => {
  const matchPercent = typeof job.score === 'number' ? Math.round(Math.max(0, Math.min(1, job.score)) * 100) : null;

  return (
    <Box
      onClick={() => onOpen?.(job._id)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onOpen?.(job._id);
      }}
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: '#fff',
        border: '1px solid rgba(12,82,131,0.12)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: '#0ab6a2',
          transform: 'translateY(-1px)',
          boxShadow: '0 8px 18px -8px rgba(10,182,162,0.4)',
        },
      }}
    >
      <Stack direction="row" alignItems="flex-start" spacing={1.2}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 13.5,
              color: '#0c5283',
              lineHeight: 1.3,
              mb: 0.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {job.title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', fontWeight: 600 }}
          >
            {job.companyName}
          </Typography>
          <Stack direction="row" spacing={0.6} sx={{ mt: 0.6, flexWrap: 'wrap' }}>
            <JobChip>{job.location}</JobChip>
            {job.type && <JobChip>{job.type}</JobChip>}
            {job.salary && <JobChip variant="accent">{job.salary}</JobChip>}
          </Stack>
        </Box>
        {matchPercent !== null && (
          <Box
            sx={{
              flexShrink: 0,
              minWidth: 50,
              textAlign: 'center',
              px: 1,
              py: 0.5,
              borderRadius: 1.5,
              background: 'linear-gradient(135deg, #0ab6a2 0%, #0c5283 100%)',
              color: '#fff',
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1 }}>{matchPercent}%</Typography>
            <Typography sx={{ fontSize: 9, opacity: 0.85, fontWeight: 600, letterSpacing: 0.5 }}>
              MATCH
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

const JobChip: React.FC<{ children: React.ReactNode; variant?: 'default' | 'accent' }> = ({
  children,
  variant = 'default',
}) => (
  <Box
    sx={{
      display: 'inline-block',
      px: 0.9,
      py: 0.2,
      mt: 0.3,
      borderRadius: 1,
      fontSize: 11,
      fontWeight: 600,
      bgcolor: variant === 'accent' ? 'rgba(10,182,162,0.12)' : 'rgba(12,82,131,0.08)',
      color: variant === 'accent' ? '#0ab6a2' : '#0c5283',
      maxWidth: 140,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </Box>
);

const TypingIndicator: React.FC = () => (
  <Stack direction="row" spacing={1} sx={{ alignSelf: 'flex-start' }}>
    <Avatar sx={{ width: 28, height: 28, bgcolor: '#0c5283', mt: 0.4 }}>
      <SmartToyOutlined sx={{ fontSize: 16 }} />
    </Avatar>
    <Box
      sx={{
        px: 2,
        py: 1.3,
        borderRadius: 2.5,
        borderTopLeftRadius: 0.5,
        bgcolor: (theme) =>
          theme.palette.mode === 'light' ? '#fff' : 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(12,82,131,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 0.6,
      }}
    >
      {[0, 1, 2].map((index) => (
        <Box
          key={index}
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: '#0ab6a2',
            opacity: 0.4,
            animation: 'vetbot-typing 1.2s infinite ease-in-out',
            animationDelay: `${index * 0.15}s`,
            '@keyframes vetbot-typing': {
              '0%, 60%, 100%': { transform: 'translateY(0)', opacity: 0.4 },
              '30%': { transform: 'translateY(-4px)', opacity: 1 },
            },
          }}
        />
      ))}
    </Box>
  </Stack>
);

export default ChatBotWidget;

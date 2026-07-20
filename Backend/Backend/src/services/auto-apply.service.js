import OpenAI from 'openai';
import { env } from '../config/env.js';
import { CandidateProfile } from '../models/candidate-profile.model.js';
import { Job } from '../models/job.model.js';
import { JobApplication } from '../models/job-application.model.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';
import { sendEmployerApplicationAck } from './auto-reply.service.js';
import {
  countApplicationsInPeriod,
  getEntitlements,
  getEntitlementsByEmail,
} from './entitlement.service.js';

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

// Bounds per run so a sweep stays fast and can't drain a whole unlimited
// plan in one shot — the next run (or the next posted job) continues.
const MAX_APPLICATIONS_PER_RUN = 10;
const MAX_CANDIDATES_PER_NEW_JOB = 50;
const COVER_LETTER_MAX_LENGTH = 2000;

const normalize = (value) => String(value ?? '').toLowerCase().trim();

/** Split a location string like "Jaipur, Rajasthan" into comparable tokens. */
function locationTokens(value) {
  return normalize(value)
    .split(/[,/|-]/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

/**
 * A job matches when at least one candidate skill appears in the job's
 * skills/title AND the job location overlaps the candidate's current or
 * preferred locations.
 */
export function jobMatchesCandidate(candidate, job) {
  const candidateSkills = (candidate.skills ?? []).map(normalize).filter(Boolean);
  const jobSkills = (job.skills ?? []).map(normalize).filter(Boolean);
  const jobTitle = normalize(job.title);

  const skillMatch = candidateSkills.some(
    (skill) =>
      jobSkills.some((jobSkill) => jobSkill.includes(skill) || skill.includes(jobSkill)) ||
      jobTitle.includes(skill),
  );

  if (!skillMatch) {
    return false;
  }

  const candidateLocations = [
    candidate.currentLocation,
    candidate.city,
    ...(candidate.preferredLocations ?? []),
  ].flatMap(locationTokens);

  if (candidateLocations.length === 0) {
    return false;
  }

  const jobLocations = locationTokens(job.location);

  return jobLocations.some((jobToken) =>
    candidateLocations.some(
      (candidateToken) => jobToken.includes(candidateToken) || candidateToken.includes(jobToken),
    ),
  );
}

const fallbackCoverLetter = (candidate, job) =>
  `Dear Hiring Team at ${job.companyName || 'your organization'},\n\n` +
  `I am ${candidate.firstName} ${candidate.lastName}, currently working as ${candidate.currentJobTitle}. ` +
  `I would like to apply for the ${job.title} position in ${job.location}. ` +
  `My key skills include ${(candidate.skills ?? []).slice(0, 6).join(', ')}, which closely match this role. ` +
  `I would welcome the opportunity to discuss how I can contribute to your team.\n\n` +
  `Best regards,\n${candidate.firstName} ${candidate.lastName}`;

export async function generateCoverLetter(candidate, job) {
  const fallback = fallbackCoverLetter(candidate, job);

  if (!openai) {
    return fallback;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content:
            `Write a short, professional cover letter (120-170 words, plain text, no placeholders, no subject line) for a veterinary job application.\n` +
            `Candidate: ${candidate.firstName} ${candidate.lastName}, current role: ${candidate.currentJobTitle} at ${candidate.organizationName}. ` +
            `Skills: ${(candidate.skills ?? []).join(', ')}. Location: ${candidate.currentLocation}. ` +
            `Summary: ${String(candidate.profileSummary ?? '').slice(0, 400)}\n` +
            `Job: ${job.title} at ${job.companyName}, location ${job.location}. ` +
            `Requirements: ${(job.skills ?? []).join(', ')}. ${String(job.description ?? '').slice(0, 400)}\n` +
            `Highlight the overlap between the candidate's skills and the job requirements. Sign off with the candidate's name.`,
        },
      ],
      max_tokens: 350,
      temperature: 0.6,
    });

    const text = completion.choices?.[0]?.message?.content?.trim();
    return text ? text.slice(0, COVER_LETTER_MAX_LENGTH) : fallback;
  } catch (error) {
    logger.warn('Cover letter generation failed, using template', { message: error.message });
    return fallback;
  }
}

/** Remaining applications the candidate may submit in the current period. */
async function getRemainingQuota(entitlements, candidateProfileId) {
  const limit = entitlements.features.maxApplications;

  if (limit === null || limit === undefined) {
    return Infinity;
  }

  const used = await countApplicationsInPeriod(candidateProfileId, entitlements.periodStart);
  return Math.max(0, limit - used);
}

async function applyToJob(candidate, job) {
  const coverLetter = await generateCoverLetter(candidate, job);

  try {
    await JobApplication.create({
      job: job._id,
      employerProfile: job.employerProfile,
      candidateProfile: candidate._id,
      candidateEmail: candidate.email,
      coverLetter,
      isAutoApplied: true,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return false; // already applied — not an error
    }
    throw error;
  }

  sendEmployerApplicationAck({ job, candidateProfileId: candidate._id });
  return true;
}

/**
 * Apply the candidate to every active job matching their skills and
 * locations, newest first, bounded by plan quota and MAX_APPLICATIONS_PER_RUN.
 * Returns a summary of what happened.
 */
export async function runAutoApplyForCandidate(candidate, entitlements) {
  const remaining = await getRemainingQuota(entitlements, candidate._id);

  if (remaining <= 0) {
    return { applied: 0, matched: 0, quotaExhausted: true, jobs: [] };
  }

  const [appliedRows, activeJobs] = await Promise.all([
    JobApplication.find({ candidateProfile: candidate._id }).select('job').lean(),
    Job.find({
      status: 'active',
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    })
      .select('_id title companyName location skills description employerProfile employerEmail')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean(),
  ]);

  const appliedJobIds = new Set(appliedRows.map((row) => String(row.job)));
  const matches = activeJobs.filter(
    (job) => !appliedJobIds.has(String(job._id)) && jobMatchesCandidate(candidate, job),
  );

  const budget = Math.min(matches.length, remaining, MAX_APPLICATIONS_PER_RUN);
  const appliedJobs = [];

  for (const job of matches.slice(0, budget)) {
    try {
      const created = await applyToJob(candidate, job);
      if (created) {
        appliedJobs.push({ _id: String(job._id), title: job.title, companyName: job.companyName, location: job.location });
      }
    } catch (error) {
      logger.warn('Auto-apply to job failed', { jobId: String(job._id), message: error.message });
    }
  }

  return {
    applied: appliedJobs.length,
    matched: matches.length,
    quotaExhausted: remaining <= appliedJobs.length && remaining !== Infinity,
    jobs: appliedJobs,
  };
}

/**
 * Fire-and-forget hook for newly posted jobs: auto-apply every opted-in,
 * entitled candidate whose skills/location match the job.
 */
export function autoApplyNewJobInBackground(job) {
  setImmediate(async () => {
    try {
      if (!job || job.status !== 'active') return;

      const candidates = await CandidateProfile.find({
        autoApplyEnabled: true,
        status: 'submitted',
        skills: { $exists: true, $ne: [] },
      })
        .limit(MAX_CANDIDATES_PER_NEW_JOB)
        .lean();

      for (const candidate of candidates) {
        try {
          if (!jobMatchesCandidate(candidate, job)) continue;

          const entitlements = await getEntitlementsByEmail(candidate.email, 'candidate');
          if (!entitlements?.features?.autoApplyEnabled) continue;

          const remaining = await getRemainingQuota(entitlements, candidate._id);
          if (remaining <= 0) continue;

          await applyToJob(candidate, job);
        } catch (error) {
          logger.warn('Auto-apply for candidate failed on new job', {
            candidate: candidate.email,
            message: error.message,
          });
        }
      }
    } catch (error) {
      logger.warn('New-job auto-apply sweep failed', { message: error.message });
    }
  });
}

async function getCandidateProfileOr404(user) {
  if (user.role !== 'candidate') {
    throw new AppError('Auto apply is available to candidate accounts only', 403);
  }

  const candidate = await CandidateProfile.findOne({ email: user.email });

  if (!candidate) {
    throw new AppError('Candidate profile not found for this account', 404);
  }

  return candidate;
}

export async function getAutoApplyStatus(user) {
  const [candidate, entitlements] = await Promise.all([
    getCandidateProfileOr404(user),
    getEntitlements(user),
  ]);

  return {
    enabled: Boolean(candidate.autoApplyEnabled),
    allowedByPlan: Boolean(entitlements.features.autoApplyEnabled),
    planName: entitlements.planName,
  };
}

/**
 * Toggle auto apply. Enabling requires a plan with the auto-reply/auto-apply
 * feature and immediately runs a sweep over existing matching jobs.
 */
export async function setAutoApply(user, enabled) {
  const candidate = await getCandidateProfileOr404(user);

  if (!enabled) {
    candidate.autoApplyEnabled = false;
    await candidate.save();
    return { enabled: false, applied: 0, matched: 0, jobs: [] };
  }

  const entitlements = await getEntitlements(user);

  if (!entitlements.features.autoApplyEnabled) {
    throw new AppError(
      'AI auto job apply is not included in your current plan. Upgrade to unlock it.',
      403,
      undefined,
      'FEATURE_NOT_IN_PLAN',
    );
  }

  candidate.autoApplyEnabled = true;
  await candidate.save();

  const result = await runAutoApplyForCandidate(candidate, entitlements);

  return { enabled: true, ...result };
}

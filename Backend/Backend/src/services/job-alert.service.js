import { CandidateProfile } from '../models/candidate-profile.model.js';
import { EmployerFollow } from '../models/employer-follow.model.js';
import { JobAlertLog } from '../models/job-alert-log.model.js';
import { logger } from '../utils/logger.js';
import { jobMatchesCandidate } from './auto-apply.service.js';
import { emailService } from './email.service.js';
import { getEntitlementsByEmail } from './entitlement.service.js';

const MAX_ALERTS_PER_JOB = 100;

function jobAlertHtml(job, heading) {
  const jobUrl = `${process.env.FRONTEND_BASE_URL || 'http://localhost:5173'}/jobs/${job._id}`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
        <h2 style="margin: 0; color: #333;">${heading}</h2>
      </div>
      <div style="padding: 20px;">
        <h3 style="margin: 0 0 8px; color: #1565c0;">${job.title}</h3>
        <p style="margin: 0 0 4px; color: #555;">${job.companyName} — ${job.location}</p>
        <p style="margin: 0 0 16px; color: #777;">${job.type}${job.salary ? ` · ${job.salary}` : ''}</p>
        <a href="${jobUrl}" style="display: inline-block; background: #1565c0; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">View job</a>
      </div>
    </div>
  `;
}

/** Send one deduped alert email. Returns false when already sent. */
async function sendOnce(job, candidate, kind, heading, subject) {
  try {
    await JobAlertLog.create({ job: job._id, candidateProfile: candidate._id, kind });
  } catch (error) {
    if (error?.code === 11000) {
      return false;
    }
    throw error;
  }

  return emailService.sendEmail({
    to: candidate.email,
    subject,
    html: jobAlertHtml(job, heading),
    text: `${heading}: ${job.title} at ${job.companyName} (${job.location}).`,
  });
}

/**
 * Fire-and-forget hook for newly posted jobs:
 *  (a) job-alert emails to EXCEL candidates who opted in and match the job,
 *  (b) new-job updates to candidates following this employer.
 * Both are plan features, re-checked per candidate; deduped via JobAlertLog.
 */
export function notifyCandidatesOfJobInBackground(job) {
  setImmediate(async () => {
    try {
      if (!job || job.status !== 'active') {
        return;
      }

      // (a) matching-job alerts
      const alertCandidates = await CandidateProfile.find({
        jobAlertsEnabled: true,
        status: 'submitted',
        subscriptionTier: 'excel',
      })
        .select('_id email firstName skills currentLocation city preferredLocations')
        .limit(MAX_ALERTS_PER_JOB)
        .lean();

      for (const candidate of alertCandidates) {
        try {
          if (!jobMatchesCandidate(candidate, job)) {
            continue;
          }

          const entitlements = await getEntitlementsByEmail(candidate.email, 'candidate');

          if (!entitlements?.features?.jobAlertsEnabled) {
            continue;
          }

          await sendOnce(
            job,
            candidate,
            'alert',
            'New job matching your profile',
            `New matching job: ${job.title} at ${job.companyName}`,
          );
        } catch (error) {
          logger.warn('Job alert email failed', { candidate: candidate.email, message: error.message });
        }
      }

      // (b) followed-employer updates
      const follows = await EmployerFollow.find({ employerProfile: job.employerProfile })
        .select('candidateProfile candidateEmail')
        .limit(MAX_ALERTS_PER_JOB)
        .lean();

      for (const follow of follows) {
        try {
          const entitlements = await getEntitlementsByEmail(follow.candidateEmail, 'candidate');

          if (!entitlements?.features?.followEmployersEnabled) {
            continue;
          }

          await sendOnce(
            job,
            { _id: follow.candidateProfile, email: follow.candidateEmail },
            'follow',
            `${job.companyName} posted a new job`,
            `${job.companyName} posted: ${job.title}`,
          );
        } catch (error) {
          logger.warn('Follow update email failed', {
            candidate: follow.candidateEmail,
            message: error.message,
          });
        }
      }
    } catch (error) {
      logger.warn('New-job notification sweep failed', { message: error.message });
    }
  });
}

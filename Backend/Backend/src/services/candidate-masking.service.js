import { JobApplication } from '../models/job-application.model.js';
import { ProfileUnlock } from '../models/profile-unlock.model.js';

/**
 * Server-side masking of candidate identity/contact data for employers.
 * Visibility rules (from the subscription spec):
 *  - A profile the employer has unlocked is always fully visible.
 *  - EXCEL (paid) candidates are visible to paid-context employers; free
 *    employers see only the first N EXCEL applicants per job (N = plan's
 *    visibleExcelProfilesPerJob, by application date), everything else
 *    arrives masked.
 *  - Free-plan candidate applicants stay locked until unlocked with a credit.
 */

const MASKED_FIELDS = ['email', 'phone', 'address', 'pincode', 'photoUrl', 'aadhaarVerified'];

export function isExcelActive(candidate) {
  return (
    candidate?.subscriptionTier === 'excel' &&
    (!candidate.subscriptionExpiresAt || new Date(candidate.subscriptionExpiresAt) > new Date())
  );
}

/** Set of candidateProfile ids (strings) this employer has unlocked. */
export async function getUnlockedCandidateIds(employerProfileId, candidateIds = null) {
  const filter = { employerProfile: employerProfileId };

  if (Array.isArray(candidateIds)) {
    if (candidateIds.length === 0) {
      return new Set();
    }
    filter.candidateProfile = { $in: candidateIds };
  }

  const unlocks = await ProfileUnlock.find(filter).select('candidateProfile').lean();

  return new Set(unlocks.map((unlock) => String(unlock.candidateProfile)));
}

/**
 * Strip identity/contact data from a candidate profile object. Keeps the
 * professional signal (title, skills, education, location) so the employer
 * can decide whether to spend an unlock credit.
 */
export function maskCandidate(candidate) {
  if (!candidate) {
    return candidate;
  }

  const masked = { ...candidate };

  masked.firstName = candidate.firstName ? `${candidate.firstName.charAt(0)}•••` : 'Candidate';
  masked.lastName = '';

  for (const field of MASKED_FIELDS) {
    if (field in masked) {
      masked[field] = field === 'aadhaarVerified' ? false : '';
    }
  }

  if (Array.isArray(masked.experiences)) {
    masked.experiences = masked.experiences.map((experience) => ({
      ...experience,
      organizationName: '',
    }));
  }

  if ('organizationName' in masked) {
    masked.organizationName = '';
  }

  masked.locked = true;

  return masked;
}

/**
 * Can this employer see the candidate's full profile outside of a specific
 * job's applicant list (search results, detail pages, resume, chat)?
 */
export function canEmployerViewCandidate({ effectiveFeatures, candidate, unlockedSet }) {
  if (unlockedSet?.has(String(candidate._id))) {
    return true;
  }

  // EXCEL candidates are visible to every plan that shows all EXCEL profiles
  // (paid plans + pay-per-job context set visibleExcelProfilesPerJob to null).
  if (isExcelActive(candidate) && effectiveFeatures?.visibleExcelProfilesPerJob === null) {
    return true;
  }

  return false;
}

/**
 * The application ids occupying the free EXCEL slots for the given jobs —
 * the first `slots` applications per job (by application date) whose
 * candidate has an active EXCEL membership. Computed over ALL applications
 * of each job so pagination cannot shift which profiles are open.
 */
async function getExcelSlotApplicationIds(jobIds, slots) {
  if (!jobIds.length || !slots) {
    return new Set();
  }

  const rows = await JobApplication.find({ job: { $in: jobIds } })
    .select('job candidateProfile createdAt')
    .populate('candidateProfile', 'subscriptionTier subscriptionExpiresAt')
    .sort({ createdAt: 1 })
    .lean();

  const usedByJob = new Map();
  const winners = new Set();

  for (const row of rows) {
    if (!isExcelActive(row.candidateProfile)) {
      continue;
    }

    const jobKey = String(row.job);
    const used = usedByJob.get(jobKey) ?? 0;

    if (used < slots) {
      usedByJob.set(jobKey, used + 1);
      winners.add(String(row._id));
    }
  }

  return winners;
}

/**
 * Mask a page of employer-facing applications according to the employer's
 * effective features. Applications whose candidate is not visible get a
 * masked profile, no cover letter, and no screening answers.
 */
export async function maskApplicationsForEmployer({ effectiveFeatures, employerProfileId, applications }) {
  if (!applications.length) {
    return applications;
  }

  const candidateIds = applications
    .map((application) => application.candidateProfile?._id)
    .filter(Boolean);

  const unlockedSet = await getUnlockedCandidateIds(employerProfileId, candidateIds);

  const freeExcelSlots = effectiveFeatures?.visibleExcelProfilesPerJob;
  let slotWinners = new Set();

  if (freeExcelSlots !== null && freeExcelSlots !== undefined) {
    const jobIds = [...new Set(applications.map((application) => String(application.job?._id ?? application.job)))];
    slotWinners = await getExcelSlotApplicationIds(jobIds, freeExcelSlots);
  }

  return applications.map((application) => {
    const candidate = application.candidateProfile;

    if (!candidate || typeof candidate !== 'object' || !candidate._id) {
      return application;
    }

    const unlocked = unlockedSet.has(String(candidate._id));
    const excelVisible =
      isExcelActive(candidate) &&
      (freeExcelSlots === null || freeExcelSlots === undefined
        ? true
        : slotWinners.has(String(application._id)));

    if (unlocked || excelVisible) {
      return application;
    }

    return {
      ...application,
      candidateProfile: maskCandidate(candidate),
      coverLetter: '',
      screeningAnswers: [],
    };
  });
}

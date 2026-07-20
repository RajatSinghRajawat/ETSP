import { CandidateProfile } from '../../src/models/candidate-profile.model.js';
import { EmployerProfile } from '../../src/models/employer-profile.model.js';
import { Plan } from '../../src/models/plan.model.js';
import { Subscription } from '../../src/models/subscription.model.js';
import { User } from '../../src/models/user.model.js';

/** The five catalog plans, mirroring scripts/seed-plans.js values. */
export const PLAN_DEFS = {
  employer_free: {
    planKey: 'employer_free',
    name: 'Free',
    audience: 'employer',
    priceInr: 0,
    interval: 'month',
    isFree: true,
    sortOrder: 0,
    features: {
      aiEnabled: false,
      maxActiveJobs: 2,
      jobValidityDays: 3,
      featuredJobs: 0,
      searchFiltersEnabled: false,
      chatEnabled: false,
      screeningQuestionsEnabled: false,
      unlockCreditsPerJob: 0,
      visibleExcelProfilesPerJob: 5,
      dedicatedAccountManager: false,
      creditAddonsEnabled: false,
      perCvUnlockEnabled: true,
      autoReplyEnabled: false,
    },
  },
  employer_pay_per_job: {
    planKey: 'employer_pay_per_job',
    name: 'Pay Per Job',
    audience: 'employer',
    priceInr: 499,
    interval: 'one_time',
    isFree: false,
    sortOrder: 1,
    features: {
      aiEnabled: false,
      maxActiveJobs: 0,
      jobValidityDays: 14,
      featuredJobs: 0,
      searchFiltersEnabled: true,
      chatEnabled: true,
      screeningQuestionsEnabled: true,
      unlockCreditsPerJob: 15,
      visibleExcelProfilesPerJob: null,
      dedicatedAccountManager: false,
      creditAddonsEnabled: true,
      perCvUnlockEnabled: false,
      autoReplyEnabled: false,
    },
  },
  employer_premium: {
    planKey: 'employer_premium',
    name: 'Premium',
    audience: 'employer',
    priceInr: 999,
    annualPriceInr: 9999,
    interval: 'month',
    isFree: false,
    sortOrder: 2,
    features: {
      aiEnabled: true,
      maxActiveJobs: 3,
      jobValidityDays: 30,
      featuredJobs: 1,
      searchFiltersEnabled: true,
      chatEnabled: true,
      screeningQuestionsEnabled: true,
      unlockCreditsPerJob: 50,
      visibleExcelProfilesPerJob: null,
      dedicatedAccountManager: true,
      creditAddonsEnabled: true,
      perCvUnlockEnabled: false,
      autoReplyEnabled: true,
    },
  },
  candidate_free: {
    planKey: 'candidate_free',
    name: 'Free',
    audience: 'candidate',
    priceInr: 0,
    interval: 'month',
    isFree: true,
    sortOrder: 0,
    features: {
      aiEnabled: false,
      maxApplications: null,
      verifiedBadgeEnabled: false,
      featuredProfileEnabled: false,
      searchBoostEnabled: false,
      jobAlertsEnabled: false,
      autoApplyEnabled: false,
      profileBoostEnabled: false,
      directMessageEmployersPerMonth: 0,
      visibilityToggleEnabled: false,
      followEmployersEnabled: false,
      resumeBuilderIncluded: false,
    },
  },
  candidate_excel: {
    planKey: 'candidate_excel',
    name: 'EXCEL',
    audience: 'candidate',
    priceInr: 199,
    interval: 'month',
    isFree: false,
    sortOrder: 1,
    features: {
      aiEnabled: true,
      maxApplications: null,
      verifiedBadgeEnabled: true,
      featuredProfileEnabled: true,
      searchBoostEnabled: true,
      jobAlertsEnabled: true,
      autoApplyEnabled: true,
      profileBoostEnabled: true,
      directMessageEmployersPerMonth: 3,
      visibilityToggleEnabled: true,
      followEmployersEnabled: true,
      resumeBuilderIncluded: true,
    },
  },
};

export async function seedPlans() {
  const plans = {};

  for (const definition of Object.values(PLAN_DEFS)) {
    plans[definition.planKey] = await Plan.create(definition);
  }

  return plans;
}

let userCounter = 0;

// Counter + random suffix so identifiers stay unique even if this module is
// instantiated twice (static + dynamic import under Jest VM modules).
function uniqueSuffix() {
  userCounter += 1;
  return `${userCounter}${Math.floor(Math.random() * 900000) + 100000}`;
}

export async function createEmployer(email = null) {
  const suffix = uniqueSuffix();
  const resolvedEmail = email ?? `employer${suffix}@fixture.test`;

  const user = await User.create({ email: resolvedEmail, role: 'employer', isActive: true });
  const profile = await EmployerProfile.create({
    companyName: `Fixture Clinic ${suffix}`,
    firstName: 'Fix',
    lastName: 'Ture',
    phoneNumber: `9${suffix.slice(-9).padStart(9, '0')}`,
    email: resolvedEmail,
    organizationType: 'Clinic',
    teamSize: '1-10',
    headquarters: 'Jaipur',
    overview: 'Fixture employer used by integration tests.',
  });

  return {
    user,
    profile,
    authUser: { id: String(user._id), email: resolvedEmail, role: 'employer' },
  };
}

export async function createCandidate(email = null, overrides = {}) {
  const suffix = uniqueSuffix();
  const resolvedEmail = email ?? `candidate${suffix}@fixture.test`;

  const user = await User.create({ email: resolvedEmail, role: 'candidate', isActive: true });
  const profile = await CandidateProfile.create({
    firstName: `Cand${suffix}`,
    lastName: 'Fixture',
    email: resolvedEmail,
    phone: `8${suffix.slice(-9).padStart(9, '0')}`,
    currentLocation: 'Jaipur',
    degree: 'B.V.Sc',
    educationLevel: 'Graduate',
    currentJobTitle: 'Veterinary Doctor',
    organizationName: 'Fixture Org',
    ...overrides,
  });

  return {
    user,
    profile,
    authUser: { id: String(user._id), email: resolvedEmail, role: 'candidate' },
  };
}

/** Give a user an active local subscription to a plan (no Stripe). */
export async function activateSubscription(user, plan, { days = 30 } = {}) {
  const now = new Date();

  return Subscription.create({
    user: user._id,
    userEmail: user.email,
    plan: plan._id,
    audienceRole: plan.audience,
    status: 'active',
    billingInterval: 'month',
    currentPeriodStart: now,
    currentPeriodEnd: new Date(now.getTime() + days * 24 * 60 * 60 * 1000),
  });
}

export const jobFields = (employerProfile, overrides = {}) => ({
  employerProfile: employerProfile._id,
  employerEmail: employerProfile.email,
  companyName: employerProfile.companyName,
  title: 'Fixture Job',
  type: 'Full Time',
  location: 'Jaipur',
  description: 'Fixture job for integration tests.',
  skills: ['surgery'],
  experience: '1-3 years',
  education: 'B.V.Sc',
  status: 'active',
  ...overrides,
});

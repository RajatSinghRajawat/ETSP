/* eslint-disable no-console */
/**
 * End-to-end walkthrough of the subscription spec against a RUNNING server.
 *
 * Usage:
 *   MONGO_URI=mongodb://localhost:27017/ets_e2e npm run seed:plans
 *   MONGO_URI=mongodb://localhost:27017/ets_e2e PAYMENT_TEST_MODE=true PORT=5098 npm start &
 *   MONGO_URI=mongodb://localhost:27017/ets_e2e API=http://localhost:5098/api/v1 node scripts/e2e-subscriptions.js
 *
 * Exercises every tier and gate one by one (free employer limits, pay-per-job,
 * premium, add-ons, unlock credits, masking, EXCEL candidate features, quotas,
 * expiry sweep) and prints a pass/fail report. Uses PAYMENT_TEST_MODE checkout.
 */
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { CandidateProfile } from '../src/models/candidate-profile.model.js';
import { EmployerProfile } from '../src/models/employer-profile.model.js';
import { Job } from '../src/models/job.model.js';
import { Plan } from '../src/models/plan.model.js';
import { User } from '../src/models/user.model.js';
import { runSweeps } from '../src/jobs/sweeps.js';

const API = process.env.API || 'http://localhost:5098/api/v1';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ets_e2e';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, extra = '') {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    failures.push(name + (extra ? ` — ${extra}` : ''));
    console.log(`  ✗ ${name}${extra ? ` — ${extra}` : ''}`);
  }
}

function tokenFor(user) {
  return jwt.sign({ id: String(user._id), email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: '1h',
  });
}

async function api(method, path, { token, body } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      // Content-Type only when a body is present — Fastify rejects empty
      // JSON-typed bodies.
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  let json = null;
  try {
    json = await response.json();
  } catch {
    /* non-JSON */
  }

  return { status: response.status, body: json };
}

const sessionIdFromUrl = (url) => new URL(url).searchParams.get('session_id');

async function ensureUser(email, role) {
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ email, role, isActive: true });
  } else if (user.role !== role) {
    user.role = role;
    await user.save();
  }
  return user;
}

async function ensureEmployerProfile(email, companyName, phone) {
  let profile = await EmployerProfile.findOne({ email });
  if (!profile) {
    profile = await EmployerProfile.create({
      companyName,
      firstName: 'Test',
      lastName: 'Employer',
      phoneNumber: phone,
      email,
      organizationType: 'Clinic',
      teamSize: '1-10',
      headquarters: 'Jaipur',
      overview: 'E2E test employer organization used by the subscription walkthrough.',
    });
  }
  return profile;
}

async function ensureCandidateProfile(email, firstName, phone) {
  let profile = await CandidateProfile.findOne({ email });
  if (!profile) {
    profile = await CandidateProfile.create({
      firstName,
      lastName: 'Candidate',
      email,
      phone,
      currentLocation: 'Jaipur',
      city: 'Jaipur',
      degree: 'B.V.Sc',
      educationLevel: 'Graduate',
      currentJobTitle: 'Veterinary Doctor',
      organizationName: 'Test Clinic',
      skills: ['surgery', 'vaccination'],
    });
  }
  return profile;
}

const jobPayload = (title, extra = {}) => ({
  title,
  type: 'Full Time',
  location: 'Jaipur',
  salary: '30000',
  description: 'E2E test job for the subscription walkthrough.',
  skills: ['surgery'],
  experience: '1-3 years',
  education: 'B.V.Sc',
  status: 'active',
  ...extra,
});

const daysFromNow = (date) => (new Date(date) - Date.now()) / (24 * 60 * 60 * 1000);

async function main() {
  await mongoose.connect(MONGO_URI);

  const health = await api('GET', '/health');
  if (health.status !== 200) {
    console.error(`Server not reachable at ${API} — start it first.`);
    process.exit(1);
  }

  // ---------- fixtures ----------
  console.log('\n== Fixtures ==');
  const emp1User = await ensureUser('employer@test.com', 'employer');
  const emp2User = await ensureUser('e2e-emp2@test.local', 'employer');
  const cand1User = await ensureUser('candidate@test.com', 'candidate');
  const cand2User = await ensureUser('e2e-cand-free@test.local', 'candidate');
  const cand3User = await ensureUser('e2e-cand-free2@test.local', 'candidate');
  const adminUser = await ensureUser('admin@test.com', 'admin');

  const emp1 = await ensureEmployerProfile('employer@test.com', 'E2E Free Clinic', '9000000001');
  const emp2 = await ensureEmployerProfile('e2e-emp2@test.local', 'E2E Premium Hospital', '9000000002');
  const emp3 = await ensureEmployerProfile('e2e-emp3@test.local', 'E2E Third Vet', '9000000003');
  const emp4 = await ensureEmployerProfile('e2e-emp4@test.local', 'E2E Fourth Vet', '9000000004');

  const cand1 = await ensureCandidateProfile('candidate@test.com', 'Excel', '9100000001');
  const cand2 = await ensureCandidateProfile('e2e-cand-free@test.local', 'FreeOne', '9100000002');
  const cand3 = await ensureCandidateProfile('e2e-cand-free2@test.local', 'FreeTwo', '9100000003');

  // Email OTP login normally sets this; mark it so the verified badge can pass.
  await CandidateProfile.updateOne({ _id: cand1._id }, { $set: { emailVerified: true } });

  const emp1Token = tokenFor(emp1User);
  const emp2Token = tokenFor(emp2User);
  const cand1Token = tokenFor(cand1User);
  const cand2Token = tokenFor(cand2User);
  const cand3Token = tokenFor(cand3User);
  const adminToken = tokenFor(adminUser);

  const plans = await Plan.find({ planKey: { $ne: null } }).lean();
  const planByKey = Object.fromEntries(plans.map((plan) => [plan.planKey, plan]));
  check('5 catalog plans seeded', plans.length === 5, `got ${plans.length}`);

  // Start clean for repeat runs.
  await Job.deleteMany({ employerProfile: { $in: [emp1._id, emp2._id] } });

  // ---------- FREE employer ----------
  console.log('\n== FREE employer (2 active jobs, 3-day validity, gated features) ==');
  let usage = await api('GET', '/subscriptions/usage', { token: emp1Token });
  check('usage: Free plan', usage.body?.data?.plan?.planKey === 'employer_free');
  check('usage: activeJobs limit 2', usage.body?.data?.usage?.activeJobs?.limit === 2);

  const job1 = await api('POST', '/jobs', { token: emp1Token, body: jobPayload('E2E Free Job 1') });
  check('job 1 posted', job1.status === 201 || job1.status === 200);
  check(
    'job 1 expires in ~3 days',
    job1.body?.data?.expiresAt && Math.abs(daysFromNow(job1.body.data.expiresAt) - 3) < 0.2,
    String(job1.body?.data?.expiresAt),
  );
  check('job 1 postedVia free', job1.body?.data?.postedVia === 'free');

  // Gated-feature checks while still under the concurrent limit, so the
  // feature gate (not the quota) is what blocks.
  const screeningBlocked = await api('POST', '/jobs', {
    token: emp1Token,
    body: jobPayload('E2E Screening Job', { screeningQuestions: [{ question: 'Why you?' }] }),
  });
  check('screening questions blocked on free', screeningBlocked.status === 403 && screeningBlocked.body?.code === 'FEATURE_NOT_IN_PLAN', `status ${screeningBlocked.status} code ${screeningBlocked.body?.code}`);

  const featuredBlocked = await api('POST', '/jobs', {
    token: emp1Token,
    body: jobPayload('E2E Featured Job', { isFeatured: true }),
  });
  check('featured job blocked on free', featuredBlocked.status === 403 && featuredBlocked.body?.code === 'FEATURE_NOT_IN_PLAN', `status ${featuredBlocked.status} code ${featuredBlocked.body?.code}`);

  const job2 = await api('POST', '/jobs', { token: emp1Token, body: jobPayload('E2E Free Job 2') });
  check('job 2 posted', job2.status === 201 || job2.status === 200);

  const job3Blocked = await api('POST', '/jobs', { token: emp1Token, body: jobPayload('E2E Free Job 3') });
  check('job 3 blocked (PLAN_LIMIT_REACHED)', job3Blocked.status === 403 && job3Blocked.body?.code === 'PLAN_LIMIT_REACHED');
  check('job 3 block reports canUseCredit=false', job3Blocked.body?.errors?.canUseCredit === false);

  const filtersBlocked = await api('GET', '/candidate-profiles?location=Jaipur', { token: emp1Token });
  check('search filters blocked on free', filtersBlocked.status === 403 && filtersBlocked.body?.code === 'FEATURE_NOT_IN_PLAN');

  const chatBlocked = await api('POST', '/chat/conversations', {
    token: emp1Token,
    body: { peerProfileId: String(cand2._id), text: 'Hello!' },
  });
  check('employer chat blocked on free', chatBlocked.status === 403 && chatBlocked.body?.code === 'FEATURE_NOT_IN_PLAN', `status ${chatBlocked.status}`);

  // ---------- EXCEL membership via test-mode checkout ----------
  console.log('\n== Candidate EXCEL subscription (test-mode Stripe bypass) ==');
  const freeDm = await api('POST', '/chat/conversations', {
    token: cand1Token,
    body: { peerProfileId: String(emp1._id), text: 'Hi from free candidate' },
  });
  check('free candidate DM blocked', freeDm.status === 403 && freeDm.body?.code === 'FEATURE_NOT_IN_PLAN', `status ${freeDm.status}`);

  const followBlocked = await api('POST', `/employer-profiles/${emp2._id}/follow`, { token: cand1Token });
  check('free candidate follow blocked', followBlocked.status === 403 && followBlocked.body?.code === 'FEATURE_NOT_IN_PLAN');

  const hideBlocked = await api('PATCH', '/candidate-profiles/me', { token: cand1Token, body: { profileVisible: false } });
  check('free candidate cannot hide profile', hideBlocked.status === 403 && hideBlocked.body?.code === 'FEATURE_NOT_IN_PLAN');

  const alertsBlocked = await api('PATCH', '/candidate-profiles/me', { token: cand1Token, body: { jobAlertsEnabled: true } });
  check('free candidate cannot enable job alerts', alertsBlocked.status === 403 && alertsBlocked.body?.code === 'FEATURE_NOT_IN_PLAN');

  const resumeBlocked = await api('POST', '/candidate-profiles/me/resume', { token: cand1Token });
  check('free candidate resume build needs ₹25 credit', resumeBlocked.status === 402 && resumeBlocked.body?.code === 'NO_RESUME_CREDITS');

  const resumePurchase = await api('POST', '/purchases/checkout', { token: cand1Token, body: { type: 'resume_builder' } });
  check('resume_builder checkout created', resumePurchase.status === 201 && resumePurchase.body?.data?.url);
  const resumeConfirm = await api('POST', '/purchases/confirm', {
    token: cand1Token,
    body: { sessionId: sessionIdFromUrl(resumePurchase.body.data.url) },
  });
  check('resume_builder purchase paid', resumeConfirm.body?.data?.status === 'paid');
  usage = await api('GET', '/subscriptions/usage', { token: cand1Token });
  check('resume credit balance 1', usage.body?.data?.usage?.resumeCredits?.available === 1);

  const resumeAfterCredit = await api('POST', '/candidate-profiles/me/resume', { token: cand1Token });
  check(
    'resume build passes credit gate (fails only at AI, if at all)',
    resumeAfterCredit.body?.code !== 'NO_RESUME_CREDITS',
    `status ${resumeAfterCredit.status} code ${resumeAfterCredit.body?.code}`,
  );

  const excelCheckout = await api('POST', '/subscriptions/checkout', {
    token: cand1Token,
    body: { planId: String(planByKey.candidate_excel._id) },
  });
  check('EXCEL checkout created', excelCheckout.status === 201 && excelCheckout.body?.data?.url);
  const excelConfirm = await api('POST', '/subscriptions/confirm', {
    token: cand1Token,
    body: { sessionId: sessionIdFromUrl(excelCheckout.body.data.url) },
  });
  check('EXCEL subscription active', excelConfirm.body?.data?.plan?.planKey === 'candidate_excel' && excelConfirm.body?.data?.status === 'active');

  const cand1AfterExcel = await CandidateProfile.findById(cand1._id).lean();
  check('candidate tier denormalized to excel', cand1AfterExcel.subscriptionTier === 'excel');
  check('candidate searchBoost 100', cand1AfterExcel.searchBoost === 100);

  const phoneOtp = await api('POST', '/candidate-profiles/me/verify-phone', { token: cand1Token });
  check('phone OTP issued (dev mode)', phoneOtp.status === 200, JSON.stringify(phoneOtp.body));
  const phoneConfirm = await api('POST', '/candidate-profiles/me/verify-phone/confirm', {
    token: cand1Token,
    body: { otp: '123456' },
  });
  check('phone verified', phoneConfirm.body?.data?.phoneVerified === true);

  // ---------- masking on the free employer ----------
  console.log('\n== Applicant masking (free employer sees EXCEL, others locked) ==');
  const apply1 = await api('POST', '/applications', {
    token: cand1Token,
    body: { jobId: String(job1.body.data._id), coverLetter: 'EXCEL member application' },
  });
  check('EXCEL candidate applied', apply1.status === 201 || apply1.status === 200, `status ${apply1.status}`);
  const apply2 = await api('POST', '/applications', {
    token: cand2Token,
    body: { jobId: String(job1.body.data._id), coverLetter: 'Free candidate application' },
  });
  check('free candidate applied', apply2.status === 201 || apply2.status === 200);
  const apply3 = await api('POST', '/applications', {
    token: cand3Token,
    body: { jobId: String(job1.body.data._id), coverLetter: 'Second free candidate' },
  });
  check('second free candidate applied', apply3.status === 201 || apply3.status === 200);

  let employerApps = await api('GET', `/applications/employer?job=${job1.body.data._id}`, { token: emp1Token });
  let appItems = employerApps.body?.data?.items ?? [];
  const excelApp = appItems.find((item) => String(item.candidateProfile?._id) === String(cand1._id));
  const freeApp = appItems.find((item) => String(item.candidateProfile?._id) === String(cand2._id));
  check('EXCEL applicant fully visible to free employer', excelApp && !excelApp.candidateProfile.locked && excelApp.candidateProfile.email === 'candidate@test.com');
  check('free applicant masked (locked, no email/phone)', freeApp?.candidateProfile?.locked === true && !freeApp.candidateProfile.email && !freeApp.candidateProfile.phone);
  check('masked applicant cover letter hidden', freeApp?.coverLetter === '');
  check('masked applicant name is initial only', /•••/.test(freeApp?.candidateProfile?.firstName ?? ''));

  // ---------- Pay Per Job ----------
  console.log('\n== Pay Per Job (₹499 one-time → job credit) ==');
  const directOneTime = await api('POST', '/subscriptions/checkout', {
    token: emp1Token,
    body: { planId: String(planByKey.employer_pay_per_job._id) },
  });
  check('one-time plan rejected from subscription flow', directOneTime.status === 400 && directOneTime.body?.code === 'USE_PURCHASE_FLOW');

  const noCredit = await api('POST', '/jobs', {
    token: emp1Token,
    body: jobPayload('E2E PPJ no credit', { useJobCredit: true }),
  });
  check('posting with credit fails without credits (NO_JOB_CREDIT)', noCredit.status === 402 && noCredit.body?.code === 'NO_JOB_CREDIT');

  const ppjPurchase = await api('POST', '/purchases/checkout', { token: emp1Token, body: { type: 'pay_per_job' } });
  check('pay_per_job checkout created', ppjPurchase.status === 201);
  const ppjConfirm = await api('POST', '/purchases/confirm', {
    token: emp1Token,
    body: { sessionId: sessionIdFromUrl(ppjPurchase.body.data.url) },
  });
  check('pay_per_job purchase paid ₹499', ppjConfirm.body?.data?.status === 'paid' && ppjConfirm.body?.data?.amountInr === 499);

  usage = await api('GET', '/subscriptions/usage', { token: emp1Token });
  check('job credit available', usage.body?.data?.usage?.jobCredits?.available === 1);

  const ppjJob = await api('POST', '/jobs', {
    token: emp1Token,
    body: jobPayload('E2E PPJ Job', { useJobCredit: true, screeningQuestions: [{ question: 'Years of surgery experience?' }] }),
  });
  check('PPJ job posted with screening questions', (ppjJob.status === 201 || ppjJob.status === 200) && ppjJob.body?.data?.postedVia === 'pay_per_job');
  check('PPJ job expires in ~14 days', Math.abs(daysFromNow(ppjJob.body?.data?.expiresAt) - 14) < 0.2, String(ppjJob.body?.data?.expiresAt));
  check('PPJ job has 15 unlock credits', ppjJob.body?.data?.unlockCreditsTotal === 15);

  usage = await api('GET', '/subscriptions/usage', { token: emp1Token });
  check('job credit consumed', usage.body?.data?.usage?.jobCredits?.available === 0);
  check('PPJ context unlocks filters', usage.body?.data?.effectiveFeatures?.searchFiltersEnabled === true);
  check('PPJ context unlocks chat', usage.body?.data?.effectiveFeatures?.chatEnabled === true);

  const filtersNow = await api('GET', '/candidate-profiles?location=Jaipur', { token: emp1Token });
  check('search filters now allowed', filtersNow.status === 200);

  const searchItems = filtersNow.body?.data?.items ?? [];
  const excelInSearch = searchItems.find((item) => String(item._id) === String(cand1._id));
  check('EXCEL member first in search (boost)', searchItems.length > 0 && String(searchItems[0]._id) === String(cand1._id));
  check('EXCEL member shows verified badge', excelInSearch?.verifiedBadge === true);

  // ---------- unlock credits ----------
  console.log('\n== Profile unlock credits (job pool → account balance → 402) ==');
  const cand2Apply = await api('POST', '/applications', {
    token: cand2Token,
    body: { jobId: String(ppjJob.body.data._id), coverLetter: 'x', screeningAnswers: [{ question: 'Years of surgery experience?', answer: '4 years' }] },
  });
  check('application with screening answers accepted', cand2Apply.status === 201 || cand2Apply.status === 200, `status ${cand2Apply.status}`);

  const noAnswers = await api('POST', '/applications', {
    token: cand3Token,
    body: { jobId: String(ppjJob.body.data._id), coverLetter: 'x' },
  });
  check('application without screening answers rejected', noAnswers.status === 400);

  const unlock1 = await api('POST', `/candidate-profiles/${cand2._id}/unlock`, {
    token: emp1Token,
    body: { jobId: String(ppjJob.body.data._id) },
  });
  check('unlock from job pool works', unlock1.status === 200 && unlock1.body?.data?.candidate?.email === 'e2e-cand-free@test.local');
  const poolMeter = unlock1.body?.data?.meters?.perJob?.find((entry) => entry.job === String(ppjJob.body.data._id));
  check('job pool meter 1/15 used', poolMeter?.used === 1 && poolMeter?.total === 15);

  const unlockAgain = await api('POST', `/candidate-profiles/${cand2._id}/unlock`, { token: emp1Token, body: {} });
  check('re-unlock is free/idempotent', unlockAgain.status === 200 && unlockAgain.body?.data?.alreadyUnlocked === true);

  const cvPack = await api('POST', '/purchases/checkout', { token: emp1Token, body: { type: 'cv_unlock_3' } });
  const cvConfirm = await api('POST', '/purchases/confirm', {
    token: emp1Token,
    body: { sessionId: sessionIdFromUrl(cvPack.body.data.url) },
  });
  check('3-CV pack (₹75) paid', cvConfirm.body?.data?.status === 'paid' && cvConfirm.body?.data?.amountInr === 75);
  usage = await api('GET', '/subscriptions/usage', { token: emp1Token });
  check('account balance +3 credits', usage.body?.data?.usage?.unlockCredits?.accountBalance === 3);

  const unlock2 = await api('POST', `/candidate-profiles/${cand3._id}/unlock`, { token: emp1Token, body: {} });
  check('unlock from account balance works', unlock2.status === 200);
  usage = await api('GET', '/subscriptions/usage', { token: emp1Token });
  check('account balance decremented to 2', usage.body?.data?.usage?.unlockCredits?.accountBalance === 2);

  const addon20 = await api('POST', '/purchases/checkout', { token: emp1Token, body: { type: 'unlock_credits_20' } });
  const addon20Confirm = await api('POST', '/purchases/confirm', {
    token: emp1Token,
    body: { sessionId: sessionIdFromUrl(addon20.body.data.url) },
  });
  check('+20 credits add-on (₹199) paid', addon20Confirm.body?.data?.status === 'paid' && addon20Confirm.body?.data?.amountInr === 199);
  usage = await api('GET', '/subscriptions/usage', { token: emp1Token });
  check('account balance now 22', usage.body?.data?.usage?.unlockCredits?.accountBalance === 22);

  // ---------- urgent tag ----------
  console.log('\n== Urgent Hiring tag (₹199 per job) ==');
  const urgent = await api('POST', '/purchases/checkout', {
    token: emp1Token,
    body: { type: 'urgent_tag', jobId: String(job1.body.data._id) },
  });
  const urgentConfirm = await api('POST', '/purchases/confirm', {
    token: emp1Token,
    body: { sessionId: sessionIdFromUrl(urgent.body.data.url) },
  });
  check('urgent tag paid', urgentConfirm.body?.data?.status === 'paid');
  const job1AfterUrgent = await Job.findById(job1.body.data._id).lean();
  check('job flagged urgent', job1AfterUrgent.isUrgent === true);
  const urgentTwice = await api('POST', '/purchases/checkout', {
    token: emp1Token,
    body: { type: 'urgent_tag', jobId: String(job1.body.data._id) },
  });
  check('urgent tag cannot be bought twice', urgentTwice.status === 400);

  // ---------- employer chat with unlocked/locked candidates ----------
  console.log('\n== Employer chat gating ==');
  const chatUnlocked = await api('POST', '/chat/conversations', {
    token: emp1Token,
    body: { peerProfileId: String(cand2._id), text: 'You are unlocked — hello!' },
  });
  check('chat with unlocked candidate works', chatUnlocked.status === 200 || chatUnlocked.status === 201, `status ${chatUnlocked.status}`);

  const lockedCandidate = await ensureCandidateProfile('e2e-cand-locked@test.local', 'Locked', '9100000004');
  const chatLocked = await api('POST', '/chat/conversations', {
    token: emp1Token,
    body: { peerProfileId: String(lockedCandidate._id), text: 'Should fail' },
  });
  check('chat with locked candidate blocked (PROFILE_LOCKED)', chatLocked.status === 403 && chatLocked.body?.code === 'PROFILE_LOCKED');

  // ---------- EXCEL candidate quotas & features ----------
  console.log('\n== EXCEL candidate: 3 DMs/month, follow, visibility, alerts ==');
  const dm1 = await api('POST', '/chat/conversations', { token: cand1Token, body: { peerProfileId: String(emp1._id), text: 'DM 1' } });
  check('DM 1 allowed', dm1.status === 200 || dm1.status === 201, `status ${dm1.status}`);
  const dm2 = await api('POST', '/chat/conversations', { token: cand1Token, body: { peerProfileId: String(emp2._id), text: 'DM 2' } });
  check('DM 2 allowed', dm2.status === 200 || dm2.status === 201);
  const dm3 = await api('POST', '/chat/conversations', { token: cand1Token, body: { peerProfileId: String(emp3._id), text: 'DM 3' } });
  check('DM 3 allowed', dm3.status === 200 || dm3.status === 201);
  const dm4 = await api('POST', '/chat/conversations', { token: cand1Token, body: { peerProfileId: String(emp4._id), text: 'DM 4' } });
  check('DM 4 blocked (3 employers/month)', dm4.status === 403 && dm4.body?.code === 'PLAN_LIMIT_REACHED', `status ${dm4.status}`);
  const dmRepeat = await api('POST', '/chat/conversations', { token: cand1Token, body: { peerProfileId: String(emp1._id), text: 'Repeat DM' } });
  check('repeat DM to same employer stays free', dmRepeat.status === 200 || dmRepeat.status === 201);

  usage = await api('GET', '/subscriptions/usage', { token: cand1Token });
  check('directMessages meter 3/3', usage.body?.data?.usage?.directMessages?.used === 3 && usage.body?.data?.usage?.directMessages?.limit === 3);

  const follow = await api('POST', `/employer-profiles/${emp2._id}/follow`, { token: cand1Token });
  check('EXCEL follow works', follow.status === 201);
  const follows = await api('GET', '/candidate-profiles/me/follows', { token: cand1Token });
  check('follow list has 1 employer', (follows.body?.data?.items ?? []).length === 1);
  const unfollow = await api('DELETE', `/employer-profiles/${emp2._id}/follow`, { token: cand1Token });
  check('unfollow works', unfollow.status === 200);

  const hide = await api('PATCH', '/candidate-profiles/me', { token: cand1Token, body: { profileVisible: false } });
  check('EXCEL can hide profile', hide.status === 200 && hide.body?.data?.profileVisible === false);
  const hiddenSearch = await api('GET', '/candidate-profiles?search=Excel', { token: emp1Token });
  check(
    'hidden profile excluded from employer search',
    !(hiddenSearch.body?.data?.items ?? []).some((item) => String(item._id) === String(cand1._id)),
  );
  await api('PATCH', '/candidate-profiles/me', { token: cand1Token, body: { profileVisible: true } });

  const alertsOn = await api('PATCH', '/candidate-profiles/me', { token: cand1Token, body: { jobAlertsEnabled: true } });
  check('EXCEL can enable job alerts', alertsOn.status === 200 && alertsOn.body?.data?.jobAlertsEnabled === true);

  const autoApplyStatus = await api('GET', '/applications/auto-apply', { token: cand1Token });
  check('auto-apply allowed by EXCEL plan', autoApplyStatus.body?.data?.allowedByPlan === true);

  const myProfile = await api('GET', '/candidate-profiles/me', { token: cand1Token });
  check('verified badge on own profile', myProfile.body?.data?.verifiedBadge === true);

  // ---------- Premium employer via admin grant ----------
  console.log('\n== Premium employer (admin grant, 3 jobs, 30d, featured, 50 credits) ==');
  const grant = await api('POST', '/admin/subscriptions/grant', {
    token: adminToken,
    body: { userEmail: 'e2e-emp2@test.local', planId: String(planByKey.employer_premium._id), days: 30 },
  });
  check('admin grant works', grant.status === 201, JSON.stringify(grant.body).slice(0, 120));

  usage = await api('GET', '/subscriptions/usage', { token: emp2Token });
  check('premium activeJobs limit 3', usage.body?.data?.usage?.activeJobs?.limit === 3);
  check('premium AI enabled', usage.body?.data?.effectiveFeatures?.aiEnabled === true);
  check('premium featured limit 1', usage.body?.data?.usage?.featuredJobs?.limit === 1);

  const premiumJob = await api('POST', '/jobs', {
    token: emp2Token,
    body: jobPayload('E2E Premium Featured', { isFeatured: true, screeningQuestions: [{ question: 'Notice period?' }] }),
  });
  check('premium featured job with screening posted', premiumJob.status === 201 || premiumJob.status === 200, `status ${premiumJob.status}`);
  check('premium job 50 unlock credits', premiumJob.body?.data?.unlockCreditsTotal === 50);
  check('premium job ~30 day validity', Math.abs(daysFromNow(premiumJob.body?.data?.expiresAt) - 30) < 0.2);
  check('premium job postedVia premium', premiumJob.body?.data?.postedVia === 'premium');

  const secondFeatured = await api('POST', '/jobs', {
    token: emp2Token,
    body: jobPayload('E2E Premium Featured 2', { isFeatured: true }),
  });
  check('2nd featured job blocked', secondFeatured.status === 403 && secondFeatured.body?.code === 'PLAN_LIMIT_REACHED');

  const publicJobs = await api('GET', '/jobs?limit=20');
  const publicItems = publicJobs.body?.data?.items ?? [];
  check('featured job sorted first in public list', publicItems.length > 0 && publicItems[0].isFeatured === true, publicItems[0]?.title);
  check('urgent flag visible on public job', publicItems.some((item) => item.isUrgent));

  // ---------- expiry sweep ----------
  console.log('\n== Job expiry sweep ==');
  await Job.updateOne({ _id: job1.body.data._id }, { $set: { expiresAt: new Date(Date.now() - 60_000) } });
  await runSweeps();
  const expiredJob = await Job.findById(job1.body.data._id).lean();
  check('sweep flips overdue job to expired', expiredJob.status === 'expired');
  const expiredPublic = await api('GET', `/jobs/${job1.body.data._id}`);
  check('expired job hidden from public', expiredPublic.status === 404);
  usage = await api('GET', '/subscriptions/usage', { token: emp1Token });
  check('expired job frees a concurrent slot', usage.body?.data?.usage?.activeJobs?.used === 1, `used ${usage.body?.data?.usage?.activeJobs?.used}`);

  // ---------- admin surfaces ----------
  console.log('\n== Admin surfaces ==');
  const adminPurchases = await api('GET', '/admin/purchases', { token: adminToken });
  check('admin purchases list has entries', (adminPurchases.body?.data?.items ?? []).length >= 5);
  const adminSubs = await api('GET', '/admin/subscriptions', { token: adminToken });
  check('admin subscriptions include billingInterval', (adminSubs.body?.data?.items ?? []).every((item) => item.billingInterval));
  const adminPlans = await api('GET', '/admin/plans', { token: adminToken });
  const premiumAdmin = (adminPlans.body?.data?.items ?? adminPlans.body?.data ?? []).find?.((plan) => plan.planKey === 'employer_premium');
  check('admin plans expose annual price 9999', premiumAdmin?.annualPriceInr === 9999, JSON.stringify(premiumAdmin?.annualPriceInr));

  // ---------- report ----------
  console.log(`\n========================================`);
  console.log(`E2E RESULT: ${passed} passed, ${failed} failed`);
  if (failures.length) {
    console.log('Failures:');
    for (const failure of failures) console.log(`  - ${failure}`);
  }
  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import OpenAI from 'openai';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';
import { User } from '../models/user.model.js';
import { CandidateProfile } from '../models/candidate-profile.model.js';
import { EmployerProfile } from '../models/employer-profile.model.js';
import { Job } from '../models/job.model.js';
import { JobApplication } from '../models/job-application.model.js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const MAX_QUESTION_LENGTH = 500;
const MAX_HISTORY = 8;
const TOP_N = 10;

const SYSTEM_PROMPT = `You are the analytics assistant for the ETS recruitment platform's admin dashboard.
You answer the administrator's questions about platform data: jobs, candidates, employers, applications and cities.

Rules:
- Answer ONLY from the JSON data snapshot provided in the conversation. Never invent or estimate numbers.
- If the snapshot does not contain the answer, say so plainly and suggest where the admin can look on the dashboard.
- Be concise and direct: short sentences, bullet points, exact numbers.
- When listing rankings (top cities, top companies, top candidates, etc.), include the count next to each item.
- Always reply in clear, professional English, regardless of the language the question was asked in. Keep numbers as digits.
- Output plain readable text only — no JSON, no code blocks — unless the admin explicitly asks for it.
- "Today" means the current calendar day; the snapshot already provides today's figures.`;

// Normalizes a free-text location ("Mumbai, Maharashtra") down to its city ("Mumbai").
function cityFirstToken(fieldPath) {
  return {
    $trim: {
      input: { $arrayElemAt: [{ $split: [{ $ifNull: [fieldPath, ''] }, ','] }, 0] },
    },
  };
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n) {
  const d = startOfToday();
  d.setDate(d.getDate() - n);
  return d;
}

async function topCitiesBy(Model, field) {
  const rows = await Model.aggregate([
    { $group: { _id: cityFirstToken(`$${field}`), count: { $sum: 1 } } },
    { $match: { _id: { $nin: [null, ''] } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: TOP_N },
  ]);
  return rows.map((row) => ({ city: row._id, count: row.count }));
}

// Collects a structured, aggregated picture of the whole platform for the LLM to reason over.
export async function buildDataSnapshot() {
  const today = startOfToday();
  const weekAgo = daysAgo(7);

  // Applications carry no location of their own, so join through to their job.
  const joinJob = [
    { $lookup: { from: 'jobs', localField: 'job', foreignField: '_id', as: 'jobDoc' } },
    { $unwind: '$jobDoc' },
  ];

  const [
    totalUsers,
    activeUsers,
    totalCandidates,
    totalEmployers,
    totalJobs,
    activeJobs,
    closedJobs,
    draftJobs,
    totalApplications,
    jobsToday,
    candidatesToday,
    employersToday,
    applicationsToday,
    jobsWeek,
    candidatesWeek,
    employersWeek,
    applicationsWeek,
    appStatusRows,
    citiesByJobs,
    citiesByCandidates,
    citiesByEmployers,
    citiesByApplications,
    topCompaniesRaw,
    topCandidatesRaw,
    topJobsRaw,
    jobsByDateRaw,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isActive: true }),
    CandidateProfile.countDocuments({}),
    EmployerProfile.countDocuments({}),
    Job.countDocuments({}),
    Job.countDocuments({ status: 'active' }),
    Job.countDocuments({ status: 'closed' }),
    Job.countDocuments({ status: 'draft' }),
    JobApplication.countDocuments({}),
    Job.countDocuments({ createdAt: { $gte: today } }),
    CandidateProfile.countDocuments({ createdAt: { $gte: today } }),
    EmployerProfile.countDocuments({ createdAt: { $gte: today } }),
    JobApplication.countDocuments({ createdAt: { $gte: today } }),
    Job.countDocuments({ createdAt: { $gte: weekAgo } }),
    CandidateProfile.countDocuments({ createdAt: { $gte: weekAgo } }),
    EmployerProfile.countDocuments({ createdAt: { $gte: weekAgo } }),
    JobApplication.countDocuments({ createdAt: { $gte: weekAgo } }),
    JobApplication.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    topCitiesBy(Job, 'location'),
    topCitiesBy(CandidateProfile, 'city'),
    topCitiesBy(EmployerProfile, 'headquarters'),
    JobApplication.aggregate([
      ...joinJob,
      { $group: { _id: cityFirstToken('$jobDoc.location'), count: { $sum: 1 } } },
      { $match: { _id: { $nin: [null, ''] } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: TOP_N },
    ]),
    Job.aggregate([
      { $group: { _id: '$companyName', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: TOP_N },
    ]),
    JobApplication.aggregate([
      { $group: { _id: '$candidateProfile', count: { $sum: 1 }, email: { $first: '$candidateEmail' } } },
      { $sort: { count: -1 } },
      { $limit: TOP_N },
      { $lookup: { from: 'candidateprofiles', localField: '_id', foreignField: '_id', as: 'candidate' } },
      { $unwind: { path: '$candidate', preserveNullAndEmptyArrays: true } },
    ]),
    JobApplication.aggregate([
      ...joinJob,
      {
        $group: {
          _id: '$jobDoc._id',
          title: { $first: '$jobDoc.title' },
          company: { $first: '$jobDoc.companyName' },
          location: { $first: '$jobDoc.location' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: TOP_N },
    ]),
    Job.aggregate([
      { $match: { createdAt: { $gte: daysAgo(29) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const applicationStatus = { new: 0, reviewing: 0, shortlisted: 0, rejected: 0, hired: 0 };
  for (const row of appStatusRows) {
    if (row._id in applicationStatus) applicationStatus[row._id] = row.count;
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      users: totalUsers,
      activeUsers,
      candidates: totalCandidates,
      employers: totalEmployers,
      jobs: totalJobs,
      activeJobs,
      closedJobs,
      draftJobs,
      applications: totalApplications,
    },
    today: {
      jobsUploaded: jobsToday,
      candidatesRegistered: candidatesToday,
      employersRegistered: employersToday,
      applications: applicationsToday,
    },
    last7Days: {
      jobsUploaded: jobsWeek,
      candidatesRegistered: candidatesWeek,
      employersRegistered: employersWeek,
      applications: applicationsWeek,
    },
    applicationStatus,
    jobsUploadedByDateLast30Days: jobsByDateRaw.map((row) => ({ date: row._id, count: row.count })),
    topCitiesByJobsUploaded: citiesByJobs,
    topCitiesByCandidates: citiesByCandidates,
    topCitiesByEmployers: citiesByEmployers,
    topCitiesByApplications: citiesByApplications.map((row) => ({ city: row._id, count: row.count })),
    topCompaniesByJobsPosted: topCompaniesRaw.map((row) => ({ company: row._id, jobsPosted: row.count })),
    topCandidatesByApplications: topCandidatesRaw.map((row) => ({
      name: row.candidate ? `${row.candidate.firstName} ${row.candidate.lastName}`.trim() : (row.email || 'Unknown'),
      email: row.email || row.candidate?.email || '',
      applications: row.count,
    })),
    topJobsByApplications: topJobsRaw.map((row) => ({
      title: row.title,
      company: row.company,
      location: row.location,
      applications: row.count,
    })),
  };
}

function readHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));
}

export async function askAdminAssistant(body = {}) {
  if (!env.OPENAI_API_KEY) {
    throw new AppError('AI assistant is not configured. Please set OPENAI_API_KEY.', 503);
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) {
    throw new AppError('Please type a question for the assistant.', 400);
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    throw new AppError(`Question is too long (max ${MAX_QUESTION_LENGTH} characters).`, 400);
  }

  const history = readHistory(body.history);
  const snapshot = await buildDataSnapshot();

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'system', content: `Current platform data snapshot (JSON):\n${JSON.stringify(snapshot)}` },
        ...history,
        { role: 'user', content: question },
      ],
      temperature: 0.2,
      max_tokens: 600,
    });
  } catch (error) {
    logger.error('OpenAI askAdminAssistant failed', error);
    throw new AppError('AI assistant could not answer right now. Please try again.', 502);
  }

  const answer = completion.choices?.[0]?.message?.content?.trim() ?? '';
  if (!answer) {
    throw new AppError('AI assistant returned an empty response', 502);
  }

  return { answer, generatedAt: snapshot.generatedAt };
}

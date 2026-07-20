import { User } from '../models/user.model.js';
import { CandidateProfile } from '../models/candidate-profile.model.js';
import { EmployerProfile } from '../models/employer-profile.model.js';
import { Job } from '../models/job.model.js';
import { JobApplication } from '../models/job-application.model.js';
import { AppError } from '../utils/app-error.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toPositiveNumber(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

function readPaging(query) {
  const page = toPositiveNumber(query.page, DEFAULT_PAGE);
  const limit = Math.min(toPositiveNumber(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
}

function paginated(items, total, page, limit) {
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  };
}

function assertObjectId(id) {
  if (!String(id).match(/^[0-9a-fA-F]{24}$/)) {
    throw new AppError('Invalid identifier', 400);
  }
}

export async function getDashboardStats() {
  const [
    totalUsers,
    activeUsers,
    candidateUsers,
    employerUsers,
    adminUsers,
    totalCandidateProfiles,
    totalEmployerProfiles,
    totalJobs,
    activeJobs,
    closedJobs,
    totalApplications,
    pendingApplications,
    hiredApplications,
    recentJobs,
    recentApplications,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'candidate' }),
    User.countDocuments({ role: 'employer' }),
    User.countDocuments({ role: 'admin' }),
    CandidateProfile.countDocuments({}),
    EmployerProfile.countDocuments({}),
    Job.countDocuments({}),
    Job.countDocuments({ status: 'active' }),
    Job.countDocuments({ status: 'closed' }),
    JobApplication.countDocuments({}),
    JobApplication.countDocuments({ status: { $in: ['new', 'reviewing'] } }),
    JobApplication.countDocuments({ status: 'hired' }),
    Job.find({}).sort({ createdAt: -1 }).limit(5).select('title companyName status createdAt location').lean(),
    JobApplication.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('job', 'title companyName')
      .populate('candidateProfile', 'firstName lastName')
      .lean(),
  ]);

  return {
    users: { total: totalUsers, active: activeUsers, candidate: candidateUsers, employer: employerUsers, admin: adminUsers },
    candidates: { total: totalCandidateProfiles },
    employers: { total: totalEmployerProfiles },
    jobs: { total: totalJobs, active: activeJobs, closed: closedJobs },
    applications: { total: totalApplications, pending: pendingApplications, hired: hiredApplications },
    recent: { jobs: recentJobs, applications: recentApplications },
  };
}

export async function listUsers(query = {}) {
  const { page, limit, skip } = readPaging(query);
  const filters = {};
  if (query.role) filters.role = String(query.role).trim();
  if (query.isActive === 'true') filters.isActive = true;
  if (query.isActive === 'false') filters.isActive = false;
  if (query.search) filters.email = new RegExp(escapeRegex(String(query.search).trim()), 'i');

  const [items, total] = await Promise.all([
    User.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filters),
  ]);
  return paginated(items, total, page, limit);
}

export async function updateUser(id, input) {
  assertObjectId(id);
  const update = {};
  if (input.role !== undefined) update.role = input.role;
  if (input.isActive !== undefined) update.isActive = Boolean(input.isActive);

  const user = await User.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean();
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function deleteUser(id) {
  assertObjectId(id);
  const user = await User.findByIdAndDelete(id).lean();
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function listCandidates(query = {}) {
  const { page, limit, skip } = readPaging(query);
  const filters = {};
  const andFilters = [];

  if (query.status) filters.status = String(query.status).trim();
  if (query.search) {
    const keyword = new RegExp(escapeRegex(String(query.search).trim()), 'i');
    andFilters.push({
      $or: [
        { firstName: keyword },
        { lastName: keyword },
        { email: keyword },
        { phone: keyword },
        { currentJobTitle: keyword },
        { organizationName: keyword },
        { skills: keyword },
      ],
    });
  }
  if (query.location) {
    const location = new RegExp(escapeRegex(String(query.location).trim()), 'i');
    andFilters.push({ $or: [{ currentLocation: location }, { preferredLocations: location }] });
  }
  if (andFilters.length > 0) filters.$and = andFilters;

  const [items, total] = await Promise.all([
    CandidateProfile.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    CandidateProfile.countDocuments(filters),
  ]);
  return paginated(items, total, page, limit);
}

export async function getCandidate(id) {
  assertObjectId(id);
  const profile = await CandidateProfile.findById(id).lean();
  if (!profile) throw new AppError('Candidate profile not found', 404);
  return profile;
}

export async function deleteCandidate(id) {
  assertObjectId(id);
  const profile = await CandidateProfile.findByIdAndDelete(id).lean();
  if (!profile) throw new AppError('Candidate profile not found', 404);
  await JobApplication.deleteMany({ candidateProfile: profile._id });
  return profile;
}

export async function listEmployers(query = {}) {
  const { page, limit, skip } = readPaging(query);
  const filters = {};
  if (query.status) filters.status = String(query.status).trim();
  if (query.search) {
    const keyword = new RegExp(escapeRegex(String(query.search).trim()), 'i');
    filters.$or = [
      { companyName: keyword },
      { email: keyword },
      { phoneNumber: keyword },
      { headquarters: keyword },
      { organizationType: keyword },
    ];
  }

  const [items, total] = await Promise.all([
    EmployerProfile.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    EmployerProfile.countDocuments(filters),
  ]);
  return paginated(items, total, page, limit);
}

export async function getEmployer(id) {
  assertObjectId(id);
  const profile = await EmployerProfile.findById(id).lean();
  if (!profile) throw new AppError('Employer profile not found', 404);
  return profile;
}

export async function deleteEmployer(id) {
  assertObjectId(id);
  const profile = await EmployerProfile.findByIdAndDelete(id).lean();
  if (!profile) throw new AppError('Employer profile not found', 404);
  await Job.deleteMany({ employerProfile: profile._id });
  await JobApplication.deleteMany({ employerProfile: profile._id });
  return profile;
}

export async function listJobs(query = {}) {
  const { page, limit, skip } = readPaging(query);
  const filters = {};
  if (query.status) filters.status = String(query.status).trim();
  if (query.search) {
    const keyword = new RegExp(escapeRegex(String(query.search).trim()), 'i');
    filters.$or = [
      { title: keyword },
      { companyName: keyword },
      { location: keyword },
      { skills: keyword },
    ];
  }
  if (query.location) filters.location = new RegExp(escapeRegex(String(query.location).trim()), 'i');

  const [items, total] = await Promise.all([
    Job.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Job.countDocuments(filters),
  ]);
  return paginated(items, total, page, limit);
}

export async function getJob(id) {
  assertObjectId(id);
  const job = await Job.findById(id).lean();
  if (!job) throw new AppError('Job not found', 404);
  return job;
}

export async function updateJob(id, input) {
  assertObjectId(id);
  const allowed = ['status', 'title', 'location', 'salary', 'type', 'experience'];
  const update = {};
  for (const key of allowed) {
    if (input[key] !== undefined) update[key] = input[key];
  }
  const job = await Job.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean();
  if (!job) throw new AppError('Job not found', 404);
  return job;
}

export async function deleteJob(id) {
  assertObjectId(id);
  const job = await Job.findByIdAndDelete(id).lean();
  if (!job) throw new AppError('Job not found', 404);
  await JobApplication.deleteMany({ job: job._id });
  return job;
}

export async function listApplications(query = {}) {
  const { page, limit, skip } = readPaging(query);
  const filters = {};
  if (query.status) filters.status = String(query.status).trim();
  if (query.job && String(query.job).match(/^[0-9a-fA-F]{24}$/)) filters.job = query.job;
  if (query.candidate && String(query.candidate).match(/^[0-9a-fA-F]{24}$/)) filters.candidateProfile = query.candidate;
  if (query.employer && String(query.employer).match(/^[0-9a-fA-F]{24}$/)) filters.employerProfile = query.employer;
  if (query.search) filters.candidateEmail = new RegExp(escapeRegex(String(query.search).trim()), 'i');

  const [items, total] = await Promise.all([
    JobApplication.find(filters)
      .populate('job', 'title companyName location type status')
      .populate('candidateProfile', 'firstName lastName email phone currentJobTitle photoUrl')
      .populate('employerProfile', 'companyName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    JobApplication.countDocuments(filters),
  ]);
  return paginated(items, total, page, limit);
}

export async function updateApplication(id, input) {
  assertObjectId(id);
  const update = {};
  if (input.status !== undefined) update.status = input.status;
  const application = await JobApplication.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true })
    .populate('job', 'title companyName')
    .populate('candidateProfile', 'firstName lastName email')
    .lean();
  if (!application) throw new AppError('Application not found', 404);
  return application;
}

export async function deleteApplication(id) {
  assertObjectId(id);
  const application = await JobApplication.findByIdAndDelete(id).lean();
  if (!application) throw new AppError('Application not found', 404);
  return application;
}

const TOP_JOBS_LIMIT = 12;

// Normalizes a free-text location ("Mumbai, Maharashtra") down to its city ("Mumbai").
function cityFirstToken(fieldPath) {
  return {
    $trim: {
      input: { $arrayElemAt: [{ $split: [{ $ifNull: [fieldPath, ''] }, ','] }, 0] },
    },
  };
}

// Counts documents grouped by their createdAt calendar date (YYYY-MM-DD).
async function countByDate(Model, match) {
  const rows = await Model.aggregate([
    ...(match ? [{ $match: match }] : []),
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((row) => ({ date: row._id, count: row.count }));
}

// Counts documents grouped by the city extracted from a location-like field.
async function countByCity(Model, field) {
  const rows = await Model.aggregate([
    { $group: { _id: cityFirstToken(`$${field}`), count: { $sum: 1 } } },
    { $match: { _id: { $nin: [null, ''] } } },
    { $sort: { count: -1, _id: 1 } },
  ]);
  return rows.map((row) => ({ city: row._id, count: row.count }));
}

export async function getAnalytics(query = {}) {
  const city = query.city ? String(query.city).trim() : '';
  const cityRegex = city ? new RegExp(`^${escapeRegex(city)}`, 'i') : null;

  const jobMatch = cityRegex ? { location: cityRegex } : null;
  const candidateMatch = cityRegex ? { city: cityRegex } : null;
  const employerMatch = cityRegex ? { headquarters: cityRegex } : null;

  // Applications hold no location of their own, so join through to the job.
  const joinJob = [
    { $lookup: { from: 'jobs', localField: 'job', foreignField: '_id', as: 'jobDoc' } },
    { $unwind: '$jobDoc' },
  ];

  const [
    jobsByDate,
    candidatesByDate,
    employersByDate,
    applicationsByJob,
    jobsByCity,
    candidatesByCity,
    employersByCity,
    applicationsByCityRaw,
  ] = await Promise.all([
    countByDate(Job, jobMatch),
    countByDate(CandidateProfile, candidateMatch),
    countByDate(EmployerProfile, employerMatch),
    JobApplication.aggregate([
      ...joinJob,
      ...(cityRegex ? [{ $match: { 'jobDoc.location': cityRegex } }] : []),
      {
        $group: {
          _id: '$jobDoc._id',
          title: { $first: '$jobDoc.title' },
          companyName: { $first: '$jobDoc.companyName' },
          location: { $first: '$jobDoc.location' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: TOP_JOBS_LIMIT },
    ]),
    countByCity(Job, 'location'),
    countByCity(CandidateProfile, 'city'),
    countByCity(EmployerProfile, 'headquarters'),
    JobApplication.aggregate([
      ...joinJob,
      { $group: { _id: cityFirstToken('$jobDoc.location'), count: { $sum: 1 } } },
      { $match: { _id: { $nin: [null, ''] } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
  ]);

  const applicationsByCity = applicationsByCityRaw.map((row) => ({ city: row._id, count: row.count }));

  const cities = [
    ...new Set([
      ...jobsByCity.map((row) => row.city),
      ...candidatesByCity.map((row) => row.city),
      ...employersByCity.map((row) => row.city),
    ]),
  ]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const cityStats = {
    jobs: jobsByCity,
    candidates: candidatesByCity,
    employers: employersByCity,
    applications: applicationsByCity,
  };

  return {
    filters: { city: city || null },
    cities,
    jobsByDate,
    candidatesByDate,
    employersByDate,
    applicationsByJob: applicationsByJob.map((row) => ({
      jobId: String(row._id),
      title: row.title,
      companyName: row.companyName,
      location: row.location,
      count: row.count,
    })),
    cityStats,
    topCities: {
      jobs: cityStats.jobs[0] ?? null,
      candidates: cityStats.candidates[0] ?? null,
      employers: cityStats.employers[0] ?? null,
      applications: cityStats.applications[0] ?? null,
    },
  };
}

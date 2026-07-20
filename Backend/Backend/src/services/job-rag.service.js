import crypto from 'crypto';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { env } from '../config/env.js';
import { Job } from '../models/job.model.js';
import { JobEmbedding } from '../models/job-embedding.model.js';
import { CandidateProfile } from '../models/candidate-profile.model.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHAT_MODEL = 'gpt-4o-mini';
const TOP_K = 6;
const CANDIDATE_FETCH_LIMIT = 200;

let embedderCache;
let chatCache;
let summaryChainCache;
let queryParserChainCache;

function getEmbedder() {
  if (!env.OPENAI_API_KEY) {
    throw new AppError('AI search is not configured. Please set OPENAI_API_KEY.', 503);
  }
  if (!embedderCache) {
    embedderCache = new OpenAIEmbeddings({
      apiKey: env.OPENAI_API_KEY,
      model: EMBEDDING_MODEL,
    });
  }
  return embedderCache;
}

function getChat(options = {}) {
  if (!env.OPENAI_API_KEY) {
    throw new AppError('AI search is not configured. Please set OPENAI_API_KEY.', 503);
  }
  if (!chatCache) {
    chatCache = new ChatOpenAI({
      apiKey: env.OPENAI_API_KEY,
      model: CHAT_MODEL,
      temperature: 0.3,
      maxTokens: 800,
      ...options,
    });
  }
  return chatCache;
}

function jobToText(job) {
  const skills = Array.isArray(job.skills) ? job.skills.join(', ') : '';
  return [
    `Title: ${job.title || ''}`,
    `Company: ${job.companyName || ''}`,
    `Location: ${job.location || ''}`,
    `Type: ${job.type || ''}`,
    `Experience: ${job.experience || ''}`,
    `Education: ${job.education || ''}`,
    `Salary: ${job.salary || ''}`,
    `Skills: ${skills}`,
    `Description: ${job.description || ''}`,
    `Benefits: ${job.benefits || ''}`,
  ]
    .filter((line) => line.split(': ')[1])
    .join('\n');
}

function hashText(text) {
  return crypto.createHash('sha1').update(text).digest('hex');
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export async function indexJob(jobId) {
  const job = await Job.findById(jobId).lean();
  if (!job) return null;

  const sourceText = jobToText(job);
  const sourceHash = hashText(sourceText);

  const existing = await JobEmbedding.findOne({ jobId: job._id }).select('sourceHash').lean();
  if (existing && existing.sourceHash === sourceHash) {
    return existing;
  }

  const embedder = getEmbedder();
  const [vector] = await embedder.embedDocuments([sourceText]);

  return JobEmbedding.findOneAndUpdate(
    { jobId: job._id },
    {
      jobId: job._id,
      sourceText,
      sourceHash,
      vector,
      status: job.status,
      location: job.location,
      type: job.type,
      skills: Array.isArray(job.skills) ? job.skills : [],
    },
    { upsert: true, new: true },
  ).lean();
}

// Fire-and-forget wrapper so request handlers don't block on embedding calls.
export function indexJobInBackground(jobId) {
  Promise.resolve()
    .then(() => indexJob(jobId))
    .catch((error) => logger.warn('indexJob failed', { jobId: String(jobId), error: error.message }));
}

export async function reindexAllJobs() {
  if (!env.OPENAI_API_KEY) {
    throw new AppError('AI search is not configured. Please set OPENAI_API_KEY.', 503);
  }

  const jobs = await Job.find({ status: 'active' }).lean();
  let indexed = 0;
  let skipped = 0;

  for (const job of jobs) {
    try {
      const result = await indexJob(job._id);
      if (result) indexed += 1;
      else skipped += 1;
    } catch (error) {
      logger.warn('reindex job failed', { jobId: String(job._id), error: error.message });
      skipped += 1;
    }
  }

  return { total: jobs.length, indexed, skipped };
}

async function ensureEmbeddingsExist() {
  const count = await JobEmbedding.countDocuments({ status: 'active' });
  if (count > 0) return;
  await reindexAllJobs();
}

function buildQueryParserChain() {
  if (queryParserChainCache) return queryParserChainCache;
  const prompt = PromptTemplate.fromTemplate(`You are a job-search query understander for a veterinary jobs platform.
Extract structured filters from the candidate's natural language request.

Respond ONLY with minified JSON in this exact shape:
{{"location":"","jobType":"","experienceLevel":"","skills":[],"keyword":""}}

Rules:
- location: city name only (e.g. "Mumbai"). Empty if not mentioned.
- jobType: one of "Full-time", "Part-time", "Contract", "Internship", "Freelance", "Temporary", or empty.
- experienceLevel: short phrase like "entry level", "3+ years", or empty.
- skills: 0-5 skill keywords from the request.
- keyword: a single short phrase summarising the role (e.g. "surgery vet").

Candidate request: {query}`);

  queryParserChainCache = RunnableSequence.from([
    prompt,
    getChat({ temperature: 0 }),
    new StringOutputParser(),
  ]);

  return queryParserChainCache;
}

function buildSummaryChain() {
  if (summaryChainCache) return summaryChainCache;
  const prompt = PromptTemplate.fromTemplate(`You are VetBot, a friendly assistant on a veterinary jobs platform.
The candidate asked: "{query}"

Here are the top matching jobs (most relevant first):
{jobsContext}

{candidateContext}

Write a short, warm response (2-4 sentences) that:
- Acknowledges what they asked for.
- Highlights why the top 1-2 matches fit them.
- Suggests one next action (apply, view details, refine the search).
- Never mention companies that are not in the list above.
- If the list is empty, apologise briefly and suggest broadening the search.`);

  summaryChainCache = RunnableSequence.from([
    prompt,
    getChat(),
    new StringOutputParser(),
  ]);

  return summaryChainCache;
}

function parseQueryFilters(raw) {
  if (!raw) return {};
  try {
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
    const parsed = JSON.parse(cleaned);
    return {
      location: typeof parsed.location === 'string' ? parsed.location.trim() : '',
      jobType: typeof parsed.jobType === 'string' ? parsed.jobType.trim() : '',
      experienceLevel: typeof parsed.experienceLevel === 'string' ? parsed.experienceLevel.trim() : '',
      skills: Array.isArray(parsed.skills) ? parsed.skills.map(String).slice(0, 5) : [],
      keyword: typeof parsed.keyword === 'string' ? parsed.keyword.trim() : '',
    };
  } catch (error) {
    logger.warn('Failed to parse query filters', { raw, error: error.message });
    return {};
  }
}

function applyMetadataFilters(matches, filters) {
  return matches.filter((match) => {
    if (filters.jobType && match.type) {
      if (match.type.toLowerCase() !== filters.jobType.toLowerCase()) {
        return false;
      }
    }
    if (filters.location && match.location) {
      if (!match.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
    }
    return true;
  });
}

export async function searchJobsBySemantics({ query, candidateEmail } = {}) {
  if (!query || !query.trim()) {
    throw new AppError('Search query is required', 400);
  }

  const cleanQuery = query.trim();

  if (!env.OPENAI_API_KEY) {
    throw new AppError('AI search is not configured. Please set OPENAI_API_KEY.', 503);
  }

  await ensureEmbeddingsExist();

  const embedder = getEmbedder();
  const queryParser = buildQueryParserChain();
  const summaryChain = buildSummaryChain();

  const [queryVector, rawFilters] = await Promise.all([
    embedder.embedQuery(cleanQuery),
    queryParser.invoke({ query: cleanQuery }),
  ]);

  const filters = parseQueryFilters(rawFilters);

  // Pull a tractable candidate set with light metadata filters first; rerank in-memory.
  const candidateQuery = { status: 'active' };
  if (filters.location) {
    candidateQuery.location = new RegExp(filters.location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }
  if (filters.jobType) {
    candidateQuery.type = new RegExp(`^${filters.jobType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  }

  let candidates = await JobEmbedding.find(candidateQuery)
    .limit(CANDIDATE_FETCH_LIMIT)
    .lean();

  // If strict metadata filters returned nothing, fall back to vector-only search.
  if (candidates.length === 0) {
    candidates = await JobEmbedding.find({ status: 'active' })
      .limit(CANDIDATE_FETCH_LIMIT)
      .lean();
  }

  const scored = candidates
    .map((embedding) => ({
      jobId: embedding.jobId,
      score: cosineSimilarity(queryVector, embedding.vector),
      type: embedding.type,
      location: embedding.location,
    }))
    .sort((a, b) => b.score - a.score);

  const reranked = applyMetadataFilters(scored, filters);
  const finalMatches = (reranked.length > 0 ? reranked : scored).slice(0, TOP_K);

  if (finalMatches.length === 0) {
    return {
      jobs: [],
      filters,
      summary: "I couldn't find any active jobs matching that yet. Try broadening the location or removing some filters.",
    };
  }

  const jobs = await Job.find({ _id: { $in: finalMatches.map((m) => m.jobId) } }).lean();
  const jobsById = new Map(jobs.map((job) => [String(job._id), job]));
  const orderedJobs = finalMatches
    .map((match) => jobsById.get(String(match.jobId)))
    .filter(Boolean)
    .map((job, index) => ({ ...job, score: finalMatches[index]?.score ?? 0 }));

  const jobsContext = orderedJobs
    .map(
      (job, index) =>
        `${index + 1}. ${job.title} at ${job.companyName} (${job.location}, ${job.type})${job.salary ? ` — ${job.salary}` : ''}\n   Skills: ${(job.skills || []).join(', ') || 'n/a'}`,
    )
    .join('\n');

  let candidateContext = '';
  if (candidateEmail) {
    const candidate = await CandidateProfile.findOne({ email: candidateEmail })
      .select('firstName currentJobTitle skills currentLocation preferredLocations')
      .lean();
    if (candidate) {
      candidateContext = `Candidate context — Name: ${candidate.firstName || 'candidate'}, Current role: ${candidate.currentJobTitle || 'n/a'}, Skills: ${(candidate.skills || []).join(', ') || 'n/a'}, Based in: ${candidate.currentLocation || 'n/a'}.`;
    }
  }

  const summary = await summaryChain.invoke({
    query: cleanQuery,
    jobsContext,
    candidateContext,
  });

  return {
    jobs: orderedJobs,
    filters,
    summary: summary.trim(),
  };
}

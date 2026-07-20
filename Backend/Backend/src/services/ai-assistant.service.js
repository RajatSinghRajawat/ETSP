import OpenAI from 'openai';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an expert resume editor and veterinary career assistant for the "VetsLinked" platform.
A candidate will provide raw, unstructured answers (often with spelling mistakes, grammar errors, mixed languages, or shorthand).
Your job is to transform those answers into a clean, professional candidate profile in JSON.

Rules:
- Always respond in clear, professional English (US/India neutral).
- Fix spelling, capitalization, punctuation, and grammar in EVERY text field.
- Expand abbreviations sensibly (e.g. "vet" -> "Veterinary", "yr" -> "year").
- Title-case names, cities, organizations, and job titles. Lowercase emails.
- If a field is missing, return an empty string (or empty array) rather than fabricating.
- For "profileSummary", write 2-3 sentences in the third person highlighting the candidate's strengths.
- "skills" must be an array of 4-8 short, properly capitalized skill names. Do not duplicate.
- "preferredLocations" must be an array of 1-3 properly capitalized city names.
- "experiences" must be an array. If experience data is provided, return at least one entry with proper dates in YYYY-MM-DD format when possible; otherwise return an empty array.
- "educationLevel" must be one of: "10th", "12th", "diploma", "bachelor", "master", "doctorate".
- "salaryFormat" must be one of: "per annum", "per month", "per week", "per day", "per hour".
- "gender" must be one of: "Male", "Female", "Non-binary", "Prefer not to say", "Other", or "".
- "employmentType" must be one of: "Full-time", "Part-time", "Contract", "Freelance", "Internship", "Temporary", or "".
- Output ONLY valid minified JSON matching the schema. No prose, no markdown, no code fences.

Output schema:
{
  "firstName": string,
  "lastName": string,
  "phone": string,
  "address": string,
  "city": string,
  "pincode": string,
  "currentLocation": string,
  "gender": string,
  "preferredLocations": string[],
  "profileSummary": string,
  "degree": string,
  "educationLevel": string,
  "specialization": string,
  "courseType": string,
  "courseStartDate": string,
  "courseEndDate": string,
  "grade": string,
  "educationCountry": string,
  "educationCity": string,
  "additionalDetails": string,
  "professionalLicenses": string,
  "currentJobTitle": string,
  "employmentType": string,
  "organizationName": string,
  "currentSalary": string,
  "salaryFormat": string,
  "skills": string[],
  "experiences": [
    {
      "jobTitle": string,
      "employmentType": string,
      "organizationName": string,
      "joiningDate": string,
      "endDate": string,
      "roleDescription": string
    }
  ]
}`;

const ALLOWED_KEYS = new Set([
  'firstName',
  'lastName',
  'phone',
  'address',
  'city',
  'pincode',
  'currentLocation',
  'gender',
  'preferredLocations',
  'profileSummary',
  'degree',
  'educationLevel',
  'specialization',
  'courseType',
  'courseStartDate',
  'courseEndDate',
  'grade',
  'educationCountry',
  'educationCity',
  'additionalDetails',
  'professionalLicenses',
  'currentJobTitle',
  'employmentType',
  'organizationName',
  'currentSalary',
  'salaryFormat',
  'skills',
  'experiences',
]);

function buildUserPrompt(answers) {
  const lines = Object.entries(answers || {})
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => `- ${key}: ${String(value).trim()}`);

  if (lines.length === 0) {
    throw new AppError('No answers provided to refine', 400);
  }

  return `Here are the candidate's raw answers. Refine them into the JSON profile.\n${lines.join('\n')}`;
}

function sanitizeRefinedProfile(raw) {
  const cleaned = {};

  for (const key of Object.keys(raw)) {
    if (!ALLOWED_KEYS.has(key)) {
      continue;
    }
    cleaned[key] = raw[key];
  }

  if (!Array.isArray(cleaned.skills)) cleaned.skills = [];
  if (!Array.isArray(cleaned.preferredLocations)) cleaned.preferredLocations = [];
  if (!Array.isArray(cleaned.experiences)) cleaned.experiences = [];

  return cleaned;
}

export async function refineCandidateProfile(answers) {
  if (!env.OPENAI_API_KEY) {
    throw new AppError('AI assistant is not configured. Please set OPENAI_API_KEY.', 503);
  }

  const userPrompt = buildUserPrompt(answers);

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 1800,
    });
  } catch (error) {
    logger.error('OpenAI refineCandidateProfile failed', error);
    throw new AppError('AI assistant could not refine the profile. Please try again.', 502);
  }

  const content = completion.choices?.[0]?.message?.content?.trim() ?? '';
  if (!content) {
    throw new AppError('AI assistant returned an empty response', 502);
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    logger.error('AI refine response was not valid JSON', { content, error });
    throw new AppError('AI assistant returned malformed data', 502);
  }

  return sanitizeRefinedProfile(parsed);
}

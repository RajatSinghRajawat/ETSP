import OpenAI from 'openai';
import { env } from '../config/env.js';
import { CandidateProfile } from '../models/candidate-profile.model.js';
import { Resume } from '../models/resume.model.js';
import { AppError } from '../utils/app-error.js';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

function buildPrompt(candidate) {
  const exp = (candidate.experiences ?? [])
    .map((e) =>
      `  - ${e.jobTitle || 'Veterinary Professional'} at ${e.organizationName || 'Clinic'} (${e.joiningDate || ''}–${e.endDate || 'Present'}): ${e.roleDescription || ''}`,
    )
    .join('\n');

  return `Candidate profile for resume generation:

Name: ${candidate.firstName} ${candidate.lastName}
Email: ${candidate.email}
Phone: ${candidate.phone}
Location: ${candidate.currentLocation}
Gender: ${candidate.gender || 'Not specified'}

CURRENT ROLE
Job Title: ${candidate.currentJobTitle}
Organization: ${candidate.organizationName}
Employment Type: ${candidate.employmentType || 'Full-time'}
Current Salary: ${candidate.currentSalary || 'Not specified'}

PROFESSIONAL SUMMARY
${candidate.profileSummary || 'A dedicated veterinary professional committed to animal health and welfare.'}

WORK EXPERIENCE
${exp || '  No previous experience listed.'}

EDUCATION
Degree: ${candidate.degree}
Level: ${candidate.educationLevel}
Specialization: ${candidate.specialization || 'Veterinary Science'}
Course Type: ${candidate.courseType || 'Regular'}
Duration: ${candidate.courseStartDate || ''} – ${candidate.courseEndDate || ''}
Grade/CGPA: ${candidate.grade || 'Not specified'}
Institution City: ${candidate.educationCity || ''}
Country: ${candidate.educationCountry || 'India'}

SKILLS
${(candidate.skills ?? []).join(', ') || 'Clinical examination, Animal care, Diagnosis'}

CERTIFICATIONS
${(candidate.certifications ?? []).join(', ') || candidate.professionalLicenses || 'None listed'}

PROFESSIONAL LICENSES
${candidate.professionalLicenses || 'None listed'}

ADDITIONAL DETAILS
${candidate.additionalDetails || ''}

PREFERRED LOCATIONS
${(candidate.preferredLocations ?? []).join(', ')}`;
}

const SYSTEM_PROMPT = `You are an elite professional resume writer with 15+ years of experience specializing in veterinary healthcare careers. Your task is to generate a stunning, complete, print-ready HTML resume that:

1. Looks like it was hand-crafted by a professional human designer — not auto-generated
2. Is tailored specifically for veterinary professionals (vets, vet technicians, animal care specialists)
3. Uses a beautiful, modern design with a professional color palette (deep teal #0D7377, dark navy #14213D, warm white #F5F5F0, and accent gold #E9C46A)
4. Has excellent typography using Google Fonts (Playfair Display for name/headings, Inter for body)
5. Includes a sidebar layout with key info on the left and detailed content on the right
6. Feels warm, professional, and trustworthy — appropriate for medical/healthcare industry

IMPORTANT RULES:
- Return ONLY the complete HTML document (<!DOCTYPE html> to </html>), no explanations, no markdown
- Embed ALL CSS inside a <style> tag in the <head>
- Include Google Fonts via <link> tag
- Make the resume A4-width (794px) centered on the page
- Every section header should use a subtle underline or decorative element
- The candidate's name should be prominent and elegant
- Fill in any missing details professionally (e.g., write a polished summary if none provided)
- Enhance the job descriptions to sound professional and impactful using veterinary industry language
- Format dates consistently
- The resume must be directly printable (no extra UI chrome)
- Add subtle background pattern or texture to the sidebar for visual interest`;

const REFINE_MODE_PROMPTS = {
  design:
    'Apply ONLY design / layout / typography changes. Do NOT invent new content. Keep all existing data, sections and wording intact.',
  data:
    'Incorporate the new information the candidate has shared. Keep the existing visual design exactly as it is unless the new content forces a layout tweak.',
  regenerate:
    'Produce a fresh, distinctly different design from the previous version while keeping every fact accurate. Modernise the look following the candidate suggestion.',
};

function buildRefineSystemPrompt(mode) {
  const directive = REFINE_MODE_PROMPTS[mode] ?? REFINE_MODE_PROMPTS.design;
  return `${SYSTEM_PROMPT}

REFINEMENT MODE: ${mode.toUpperCase()}
${directive}

CRITICAL OUTPUT RULES:
- Return ONLY the complete HTML document (<!DOCTYPE html> to </html>).
- Do NOT wrap in markdown code fences.
- Do NOT include any commentary, explanation or chat-style text.
- All CSS must remain embedded in <style> inside <head>.`;
}

export async function refineResumeByEmail(email, { mode = 'design', instructions = '' } = {}) {
  const candidate = await CandidateProfile.findOne({ email }).lean();
  if (!candidate) throw new AppError('Candidate profile not found', 404);

  const candidateId = String(candidate._id);
  const existingResume = await Resume.findOne({ candidateId }).lean();
  if (!existingResume) {
    throw new AppError('No resume to refine yet. Generate one first.', 404);
  }

  if (!env.OPENAI_API_KEY) {
    throw new AppError('AI assistant is not configured. Please set OPENAI_API_KEY.', 503);
  }

  const safeMode = REFINE_MODE_PROMPTS[mode] ? mode : 'design';
  const trimmedInstructions = String(instructions || '').trim();

  if (safeMode !== 'regenerate' && !trimmedInstructions) {
    throw new AppError('Please describe what you would like to change.', 400);
  }

  const userPrompt = `EXISTING RESUME HTML (refine this):
\`\`\`html
${existingResume.htmlContent}
\`\`\`

CANDIDATE PROFILE (use only if relevant to the request):
${buildPrompt(candidate)}

CANDIDATE REQUEST (${safeMode}):
${trimmedInstructions || 'Generate a fresh, different design while keeping all the facts accurate.'}`;

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: buildRefineSystemPrompt(safeMode) },
        { role: 'user', content: userPrompt },
      ],
      temperature: safeMode === 'regenerate' ? 0.85 : 0.5,
      max_tokens: 4000,
    });
  } catch {
    throw new AppError('AI could not refine the resume right now. Please try again.', 502);
  }

  let html = completion.choices?.[0]?.message?.content?.trim() ?? '';
  html = html.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/i, '').trim();

  if (!html.toLowerCase().includes('<html')) {
    throw new AppError('AI returned an invalid resume. Please try again.', 502);
  }

  const updated = await Resume.findOneAndUpdate(
    { candidateId },
    { htmlContent: html },
    { upsert: true, new: true },
  );

  return {
    _id: updated._id,
    candidateId,
    htmlContent: html,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

export async function generateResumeByEmail(email) {
  const candidate = await CandidateProfile.findOne({ email }).lean();
  if (!candidate) throw new AppError('Candidate profile not found', 404);
  return generateResume(String(candidate._id));
}

export async function getResumeByEmail(email) {
  const candidate = await CandidateProfile.findOne({ email }).lean();
  if (!candidate) throw new AppError('Candidate profile not found', 404);
  return getResume(String(candidate._id));
}

export async function updateResumeByEmail(email, htmlContent) {
  const candidate = await CandidateProfile.findOne({ email }).lean();
  if (!candidate) throw new AppError('Candidate profile not found', 404);
  return updateResume(String(candidate._id), htmlContent);
}

export async function generateResume(candidateId) {
  const candidate = await CandidateProfile.findById(candidateId).lean();
  if (!candidate) throw new AppError('Candidate not found', 404);

  const userPrompt = buildPrompt(candidate);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  let html = completion.choices[0]?.message?.content ?? '';

  // Strip markdown code fences if model wrapped it
  html = html.replace(/^```html\s*/i, '').replace(/\s*```$/i, '').trim();

  const resume = await Resume.findOneAndUpdate(
    { candidateId },
    { htmlContent: html },
    { upsert: true, new: true },
  );

  return { _id: resume._id, candidateId, htmlContent: html, createdAt: resume.createdAt, updatedAt: resume.updatedAt };
}

export async function getResume(candidateId) {
  const resume = await Resume.findOne({ candidateId }).lean();
  if (!resume) throw new AppError('Resume not found. Please generate it first.', 404);
  return resume;
}

export async function updateResume(candidateId, htmlContent) {
  const resume = await Resume.findOneAndUpdate(
    { candidateId },
    { htmlContent },
    { upsert: true, new: true },
  );
  return resume;
}

// Returns the resume for the given candidate, generating it on demand if one
// doesn't exist yet. Used by employers/admins who can't trigger a build the
// way a candidate can.
export async function getOrBuildResume(candidateId) {
  if (!/^[0-9a-fA-F]{24}$/.test(String(candidateId))) {
    throw new AppError('Invalid candidate id', 400);
  }

  const candidate = await CandidateProfile.findById(candidateId).lean();
  if (!candidate) throw new AppError('Candidate not found', 404);

  const existing = await Resume.findOne({ candidateId }).lean();
  if (existing && existing.htmlContent) {
    return existing;
  }

  return generateResume(String(candidate._id));
}

import { z } from 'zod';

export const jobApplicationSchema = z.object({
  jobId: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, 'Valid job id is required'),
  coverLetter: z.string().trim().max(2000).default(''),
  // Answers to the job's screening questions — matched against the job's
  // question list in the service.
  screeningAnswers: z
    .array(
      z.object({
        question: z.string().trim().min(1).max(300),
        answer: z.string().trim().min(1).max(1000),
      }),
    )
    .max(5)
    .default([]),
});

export const applicationStatusUpdateSchema = z.object({
  status: z.enum(['new', 'reviewing', 'shortlisted', 'rejected', 'hired']),
});

export const autoApplySchema = z.object({
  enabled: z.boolean(),
});

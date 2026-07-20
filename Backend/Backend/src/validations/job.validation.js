import { z } from 'zod';

export const jobSchema = z.object({
  title: z.string().trim().min(1, 'Job title is required').max(140),
  type: z.string().trim().min(1, 'Job type is required').max(40),
  location: z.string().trim().min(1, 'Location is required').max(120),
  salary: z.string().trim().default(''),
  description: z.string().trim().min(1, 'Job description is required').max(5000),
  skills: z.array(z.string().trim().min(1)).max(12).default([]),
  experience: z.string().trim().min(1, 'Experience is required').max(40),
  education: z.string().trim().min(1, 'Education is required').max(120),
  benefits: z.string().trim().default(''),
  status: z.enum(['draft', 'active', 'closed']).default('active'),
  // Premium feature — gated in the service against the plan's featured limit.
  isFeatured: z.boolean().default(false),
  // Paid-plan feature — gated in the service.
  screeningQuestions: z
    .array(z.object({ question: z.string().trim().min(1).max(300) }))
    .max(5)
    .default([]),
  // Post using a purchased Pay Per Job credit instead of the base plan slot.
  useJobCredit: z.boolean().default(false),
});

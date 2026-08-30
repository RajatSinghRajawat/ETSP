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

export const applicationStatusUpdateSchema = z
  .object({
    status: z.enum(['new', 'reviewing', 'shortlisted', 'rejected', 'hired']),
    // Note the employer sends along with the decision — the rejection reason,
    // or the message that accompanies an interview invite.
    message: z.string().trim().max(1000).default(''),
    // Interview slot, only meaningful when the employer accepts.
    interviewAt: z
      .string()
      .trim()
      .datetime({ offset: true })
      .or(z.string().trim().regex(/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?)?$/))
      .nullable()
      .optional(),
    interviewMode: z.enum(['in_person', 'video', 'phone', '']).default(''),
    interviewLocation: z.string().trim().max(300).default(''),
  })
  .superRefine((value, ctx) => {
    if (value.status === 'rejected' && !value.message) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['message'],
        message: 'Please add a message explaining the rejection',
      });
    }

    if (value.interviewAt && Number.isNaN(new Date(value.interviewAt).getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['interviewAt'],
        message: 'Interview date is not a valid date',
      });
    }
  });

export const autoApplySchema = z.object({
  enabled: z.boolean(),
});

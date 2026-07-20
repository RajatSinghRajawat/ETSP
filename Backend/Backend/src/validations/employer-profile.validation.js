import { z } from 'zod';

const textField = z.string().trim().default('');
const limitedTextArray = (limit) => z.array(z.string().trim().min(1)).max(limit).default([]);
const optionalDigits = z.string().trim().regex(/^\d*$/, 'Only numbers are allowed').default('');
const optionalUrl = z
  .string()
  .trim()
  .refine((value) => !value || /^https?:\/\/.+/i.test(value), 'Valid website URL is required')
  .default('');

export const employerProfileSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required').max(120),
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\d{8,20}$/, 'Phone number must contain 8 to 20 digits'),
  email: z.string().trim().email('Valid email is required').toLowerCase(),
  website: optionalUrl,
  organizationType: z.string().trim().min(1, 'Organization type is required').max(80),
  foundedYear: optionalDigits,
  teamSize: z.string().trim().min(1, 'Team size is required').max(40),
  headquarters: z.string().trim().min(1, 'Headquarters is required').max(120),
  activeJobs: optionalDigits,
  workplaceModel: z.string().trim().default('On-site'),
  hiringUrgency: z.string().trim().default('Standard'),
  logoUrl: textField,
  overview: z.string().trim().min(1, 'Company overview is required').max(2000),
  specialties: limitedTextArray(6),
  benefits: limitedTextArray(8),
  hiringRegions: limitedTextArray(5),
  phoneVerified: z.boolean().default(false),
  emailVerified: z.boolean().default(false),
  status: z.enum(['draft', 'submitted']).default('submitted'),
});

export const employerProfileUpdateSchema = employerProfileSchema
  .omit({
    email: true,
    phoneNumber: true,
  })
  .partial();

import { z } from 'zod';

const textField = z.string().trim().default('');

const candidateExperienceSchema = z.object({
  jobTitle: textField,
  employmentType: textField,
  organizationName: textField,
  joiningDate: textField,
  endDate: textField,
  roleDescription: textField,
});

export const candidateProfileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  email: z.string().trim().email('Valid email is required').toLowerCase(),
  phone: z.string().trim().min(8, 'Phone number is required').max(20),
  address: textField,
  city: textField,
  pincode: textField,
  currentLocation: z.string().trim().min(1, 'Current location is required'),
  gender: textField,
  aadhaarVerified: z.boolean().default(false),
  preferredLocations: z.array(z.string().trim().min(1)).max(3).default([]),
  profileSummary: textField,
  photoUrl: textField,
  degree: z.string().trim().min(1, 'Degree is required'),
  educationLevel: z.string().trim().min(1, 'Education level is required'),
  specialization: textField,
  courseType: textField,
  courseStartDate: textField,
  courseEndDate: textField,
  grade: textField,
  educationCountry: z.string().trim().default('India'),
  educationCity: textField,
  additionalDetails: textField,
  certifications: z.array(z.string().trim().min(1)).default([]),
  professionalLicenses: textField,
  currentJobTitle: z.string().trim().min(1, 'Current job title is required'),
  employmentType: textField,
  organizationName: z.string().trim().min(1, 'Organization name is required'),
  currentSalary: textField,
  salaryFormat: z.string().trim().default('per annum'),
  skills: z.array(z.string().trim().min(1)).max(5).default([]),
  experiences: z.array(candidateExperienceSchema).default([]),
  status: z.enum(['draft', 'submitted']).default('submitted'),
});

export const candidateProfileUpdateSchema = candidateProfileSchema
  .omit({
    email: true,
    phone: true,
  })
  .extend({
    // EXCEL-only toggles — plan-gated in the service.
    profileVisible: z.boolean(),
    jobAlertsEnabled: z.boolean(),
  })
  .partial();

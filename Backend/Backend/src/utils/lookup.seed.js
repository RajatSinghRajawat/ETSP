import { JobType } from '../models/job-type.model.js';
import { Skill } from '../models/skill.model.js';
import { Education } from '../models/education.model.js';
import { SalaryUnit } from '../models/salary-unit.model.js';
import { LookupOption } from '../models/lookup-option.model.js';
import { logger } from './logger.js';

const DEFAULTS = {
  job_type: [
    { name: 'Full-time', value: 'Full-time' },
    { name: 'Part-time', value: 'Part-time' },
    { name: 'Contract', value: 'Contract' },
    { name: 'Internship', value: 'Internship' },
    { name: 'Temporary', value: 'Temporary' },
  ],
  skill: [
    { name: 'Surgery', value: 'Surgery' },
    { name: 'Emergency Care', value: 'Emergency Care' },
    { name: 'Diagnostics', value: 'Diagnostics' },
    { name: 'Vaccination', value: 'Vaccination' },
    { name: 'Nutrition', value: 'Nutrition' },
    { name: 'Pet Care', value: 'Pet Care' },
    { name: 'Large Animals', value: 'Large Animals' },
    { name: 'Avian', value: 'Avian' },
    { name: 'Dermatology', value: 'Dermatology' },
    { name: 'Dentistry', value: 'Dentistry' },
    { name: 'Clinical Consultation', value: 'Clinical Consultation' },
    { name: 'Soft Tissue Surgery', value: 'Soft Tissue Surgery' },
    { name: 'Diagnostic Imaging (X-Ray/USG)', value: 'Diagnostic Imaging (X-Ray/USG)' },
    { name: 'Animal Handling & Restraint', value: 'Animal Handling & Restraint' },
    { name: 'Client Communication', value: 'Client Communication' },
  ],
  education: [
    { name: 'BVSc (Bachelor of Veterinary Science)', value: 'BVSc' },
    { name: 'MVSc (Master of Veterinary Science)', value: 'MVSc' },
    { name: 'PhD in Veterinary Science', value: 'PhD' },
    { name: 'B.V.Sc & A.H (Bachelor of Veterinary Science)', value: 'BVSc-AH' },
    { name: 'Diploma in Animal Husbandry / Paravet', value: 'Diploma-Paravet' },
    { name: 'Certificate Course in Pet Grooming / Training', value: 'Cert-Grooming' },
    { name: 'Any Graduate / Bachelor Degree', value: 'Graduate' },
    { name: '10th / 12th Pass', value: '10-12' },
  ],
  salary_unit: [
    { name: 'per annum', value: 'per annum' },
    { name: 'per month', value: 'per month' },
    { name: 'per week', value: 'per week' },
    { name: 'per day', value: 'per day' },
    { name: 'per hour', value: 'per hour' },
  ],
  employment_type: [
    { name: 'Full-time', value: 'Full-time' },
    { name: 'Part-time', value: 'Part-time' },
    { name: 'Contract', value: 'Contract' },
    { name: 'Internship', value: 'Internship' },
    { name: 'Freelance', value: 'Freelance' },
    { name: 'Temporary', value: 'Temporary' },
  ],
  gender: [
    { name: 'Male', value: 'Male' },
    { name: 'Female', value: 'Female' },
    { name: 'Non-binary', value: 'Non-binary' },
    { name: 'Prefer not to say', value: 'Prefer not to say' },
    { name: 'Other', value: 'Other' },
  ],
  experience_band: [
    { name: 'Fresher / 0-1 years', value: '0-1' },
    { name: '0-2 years', value: '0-2' },
    { name: '1-2 years', value: '1-2' },
    { name: '2-5 years', value: '2-5' },
    { name: '3-5 years', value: '3-5' },
    { name: '5-10 years', value: '5-10' },
    { name: '10+ years', value: '10+' },
  ],
  job_title: [
    { name: 'Veterinarian', value: 'Veterinarian' },
    { name: 'Veterinary Assistant', value: 'Veterinary Assistant' },
    { name: 'Veterinary Surgeon', value: 'Veterinary Surgeon' },
    { name: 'Ward Boy', value: 'Ward Boy' },
    { name: 'Pet Trainer', value: 'Pet Trainer' },
    { name: 'Pet Groomer', value: 'Pet Groomer' },
    { name: 'Receptionist', value: 'Receptionist' },
    { name: 'Floor Manager', value: 'Floor Manager' },
    { name: 'Sales Manager', value: 'Sales Manager' },
    { name: 'Inventory Incharge', value: 'Inventory Incharge' },
    { name: 'Animal Caretaker', value: 'Animal Caretaker' },
    { name: 'Lab Technician / Paravet', value: 'Lab Technician / Paravet' },
  ],
  organization_type: [
    { name: 'Clinic', value: 'Clinic' },
    { name: 'Hospital', value: 'Hospital' },
    { name: 'NGO / Animal Shelter', value: 'NGO / Animal Shelter' },
    { name: 'Research & Academia', value: 'Research & Academia' },
    { name: 'Petcare Services', value: 'Petcare Services' },
    { name: 'Pharma & Healthcare', value: 'Pharma & Healthcare' },
    { name: 'Pet Boarding / Resort', value: 'Pet Boarding / Resort' },
    { name: 'Feed & Nutrition Company', value: 'Feed & Nutrition Company' },
    { name: 'Pet Store', value: 'Pet Store' },
    { name: 'Organization', value: 'Organization' },
  ],
  team_size: [
    { name: '1-5 employees', value: '1-5' },
    { name: '6-10 employees', value: '6-10' },
    { name: '11-20 employees', value: '11-20' },
    { name: '21-50 employees', value: '21-50' },
    { name: '50+ employees', value: '50+' },
    { name: '6-20 Employees', value: '6-20 Employees' },
    { name: '51-200 Employees', value: '51-200 Employees' },
    { name: '200+ Employees', value: '200+ Employees' },
  ],
  workplace_model: [
    { name: 'On-site', value: 'On-site' },
    { name: 'Hybrid', value: 'Hybrid' },
    { name: 'Remote', value: 'Remote' },
    { name: 'Field-based', value: 'Field-based' },
  ],
  hiring_priority: [
    { name: 'Standard', value: 'Standard' },
    { name: 'Urgent Hiring', value: 'Urgent Hiring' },
    { name: 'Paid Promotion', value: 'Paid Promotion' },
    { name: 'Bulk Hiring', value: 'Bulk Hiring' },
  ],
  course_type: [
    { name: 'Full Time', value: 'Full Time' },
    { name: 'Part Time', value: 'Part Time' },
    { name: 'Correspondence / Distance Learning', value: 'Correspondence' },
  ],
  benefit: [
    { name: 'Health Insurance', value: 'Health Insurance' },
    { name: 'Paid Leave', value: 'Paid Leave' },
    { name: 'Paid Leaves', value: 'Paid Leaves' },
    { name: 'Flexible Hours', value: 'Flexible Hours' },
    { name: 'Flexible Work Hours', value: 'Flexible Work Hours' },
    { name: 'Accommodation', value: 'Accommodation' },
    { name: 'Performance Bonus', value: 'Performance Bonus' },
    { name: 'PF & ESI', value: 'PF & ESI' },
    { name: 'PF & Gratuity', value: 'PF & Gratuity' },
    { name: 'Overtime Pay', value: 'Overtime Pay' },
    { name: 'Transport Allowance', value: 'Transport Allowance' },
    { name: 'Relocation Support', value: 'Relocation Support' },
    { name: 'Training & CME Stipend', value: 'Training & CME Stipend' },
  ],
  specialty: [
    { name: 'Small Animal Surgery', value: 'Small Animal Surgery' },
    { name: 'Emergency Care', value: 'Emergency Care' },
    { name: 'Diagnostics', value: 'Diagnostics' },
    { name: 'Large Animals', value: 'Large Animals' },
    { name: 'Avian Medicine', value: 'Avian Medicine' },
    { name: 'Nutrition', value: 'Nutrition' },
    { name: 'Preventive Care', value: 'Preventive Care' },
    { name: 'Client Counselling', value: 'Client Counselling' },
  ],
};

const LEGACY_MODELS = [
  { Model: JobType, category: 'job_type' },
  { Model: Skill, category: 'skill' },
  { Model: Education, category: 'education' },
  { Model: SalaryUnit, category: 'salary_unit' },
];

async function seedCategory(category, defaults) {
  const count = await LookupOption.countDocuments({ category });
  if (count > 0) return 0;

  const docs = defaults.map((item, index) => ({
    category,
    name: item.name,
    value: item.value,
    description: '',
    order: index + 1,
    status: 'approved',
    isActive: true,
  }));

  try {
    await LookupOption.insertMany(docs, { ordered: false });
  } catch (error) {
    // Ignore duplicate-key races on concurrent boots.
    if (error?.code !== 11000 && !error?.writeErrors) throw error;
  }

  logger.info(`Seeded ${docs.length} lookup options for ${category}`);
  return docs.length;
}

/** One-time import of rows still sitting in the old per-collection models. */
async function migrateLegacyCollections() {
  for (const { Model, category } of LEGACY_MODELS) {
    const existing = await LookupOption.countDocuments({ category });
    if (existing > 0) continue;

    let legacy = [];
    try {
      legacy = await Model.find({}).sort({ order: 1, name: 1 }).lean();
    } catch {
      continue;
    }
    if (!legacy.length) continue;

    const docs = legacy.map((row, index) => ({
      category,
      name: row.name,
      value: row.value || row.name,
      description: row.description || '',
      order: row.order ?? index + 1,
      status: 'approved',
      isActive: row.isActive !== false,
    }));

    try {
      await LookupOption.insertMany(docs, { ordered: false });
      logger.info(`Migrated ${docs.length} legacy ${category} rows into LookupOption`);
    } catch (error) {
      if (error?.code !== 11000 && !error?.writeErrors) {
        logger.warn(`Legacy migrate skipped for ${category}`, { message: error.message });
      }
    }
  }
}

export async function seedLookups() {
  try {
    await migrateLegacyCollections();

    for (const [category, defaults] of Object.entries(DEFAULTS)) {
      await seedCategory(category, defaults);
    }
  } catch (error) {
    logger.error('Failed to seed lookup options', {
      message: error.message,
    });
  }
}

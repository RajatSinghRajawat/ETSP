import { JobType } from '../models/job-type.model.js';
import { Skill } from '../models/skill.model.js';
import { Education } from '../models/education.model.js';
import { SalaryUnit } from '../models/salary-unit.model.js';
import { logger } from './logger.js';

const JOB_TYPES = [
  { name: 'Full-time', value: 'Full-time' },
  { name: 'Part-time', value: 'Part-time' },
  { name: 'Contract', value: 'Contract' },
  { name: 'Internship', value: 'Internship' },
];

const SKILLS = [
  { name: 'Surgery', value: 'Surgery' },
  { name: 'Emergency Care', value: 'Emergency Care' },
  { name: 'Diagnostics', value: 'Diagnostics' },
  { name: 'Vaccination', value: 'Vaccination' },
  { name: 'Nutrition', value: 'Nutrition' },
  { name: 'Pet Care', value: 'Pet Care' },
  { name: 'Large Animals', value: 'Large Animals' },
  { name: 'Avian', value: 'Avian' },
];

const EDUCATIONS = [
  { name: 'BVSc (Bachelor of Veterinary Science)', value: 'BVSc' },
  { name: 'MVSc (Master of Veterinary Science)', value: 'MVSc' },
  { name: 'PhD in Veterinary Science', value: 'PhD' },
];

const SALARY_UNITS = [
  { name: 'per annum', value: 'per annum' },
  { name: 'per month', value: 'per month' },
  { name: 'per day', value: 'per day' },
  { name: 'per hour', value: 'per hour' },
];

async function seedCollection(Model, label, defaults) {
  const count = await Model.estimatedDocumentCount();
  if (count > 0) {
    return 0;
  }
  const docs = defaults.map((item, index) => ({
    ...item,
    order: index + 1,
    isActive: true,
  }));
  await Model.insertMany(docs, { ordered: false });
  logger.info(`Seeded ${docs.length} ${label}`);
  return docs.length;
}

export async function seedLookups() {
  try {
    await Promise.all([
      seedCollection(JobType, 'job types', JOB_TYPES),
      seedCollection(Skill, 'skills', SKILLS),
      seedCollection(Education, 'educations', EDUCATIONS),
      seedCollection(SalaryUnit, 'salary units', SALARY_UNITS),
    ]);
  } catch (error) {
    logger.error('Failed to seed lookup collections', {
      message: error.message,
    });
  }
}

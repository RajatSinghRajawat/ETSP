/**
 * Unified catalog for every website select/dropdown option.
 * Admin manages these; users may propose new values (pending until approved).
 */

export const LOOKUP_CATEGORIES = [
  'job_type',
  'skill',
  'education',
  'salary_unit',
  'employment_type',
  'gender',
  'experience_band',
  'job_title',
  'organization_type',
  'team_size',
  'workplace_model',
  'hiring_priority',
  'course_type',
  'benefit',
  'specialty',
];

export const LOOKUP_CATEGORY_LABELS = {
  job_type: 'Job types',
  skill: 'Skills',
  education: 'Education levels',
  salary_unit: 'Salary units',
  employment_type: 'Employment types',
  gender: 'Gender',
  experience_band: 'Experience bands',
  job_title: 'Job titles',
  organization_type: 'Organization types',
  team_size: 'Team sizes',
  workplace_model: 'Workplace models',
  hiring_priority: 'Hiring priorities',
  course_type: 'Course types',
  benefit: 'Benefits',
  specialty: 'Specialties',
};

/** Map legacy REST paths → category. */
export const LEGACY_LOOKUP_PATH_TO_CATEGORY = {
  'job-types': 'job_type',
  skills: 'skill',
  educations: 'education',
  'salary-units': 'salary_unit',
};

export const LOOKUP_STATUSES = ['pending', 'approved', 'rejected', 'disabled'];

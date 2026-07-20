export interface EmployerDirectoryProfile {
  id: string;
  name: string;
  location: string;
  type: string;
  jobs: number;
  employees: string;
  logo: string;
  rating: number;
  verified: boolean;
  founded: string;
  responseTime: string;
  overview: string;
  specialties: string[];
  benefits: string[];
  hiringFocus: string[];
}

export const employerDirectory: EmployerDirectoryProfile[] = [
  {
    id: 'petlife-hospital',
    name: 'PetLife Hospital',
    location: 'Mumbai, Maharashtra',
    type: 'Hospital',
    jobs: 5,
    employees: '50-100',
    logo: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=100&h=100&fit=crop',
    rating: 4.8,
    verified: true,
    founded: '2014',
    responseTime: 'Usually replies within 24 hours',
    overview: 'PetLife Hospital runs a multi-specialty veterinary network focused on surgery, diagnostics and emergency care for companion animals across West India.',
    specialties: ['Small Animal Surgery', 'Emergency Care', 'Diagnostics', 'Preventive Care'],
    benefits: ['Health cover', 'Relocation support', 'Paid CME', 'Night shift allowance'],
    hiringFocus: ['Veterinary Surgeons', 'Emergency Vets', 'Pet Care Specialists'],
  },
  {
    id: 'animal-care-clinic',
    name: 'Animal Care Clinic',
    location: 'Bangalore, Karnataka',
    type: 'Clinic',
    jobs: 3,
    employees: '10-50',
    logo: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=100&h=100&fit=crop',
    rating: 4.6,
    verified: true,
    founded: '2018',
    responseTime: 'Replies in 1-2 business days',
    overview: 'A fast-growing companion care clinic hiring clinicians who can blend consultation quality with empathetic client communication.',
    specialties: ['Companion Care', 'Vaccination', 'Dermatology', 'Dentistry'],
    benefits: ['Flexible shifts', 'Annual bonus', 'Learning stipend', 'Weekend rotation pay'],
    hiringFocus: ['Senior Veterinarians', 'Clinical Assistants'],
  },
  {
    id: 'agrivet-solutions',
    name: 'AgriVet Solutions',
    location: 'Pune, Maharashtra',
    type: 'Organization',
    jobs: 8,
    employees: '100-200',
    logo: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=100&h=100&fit=crop',
    rating: 4.9,
    verified: true,
    founded: '2012',
    responseTime: 'Usually replies within 12 hours',
    overview: 'AgriVet Solutions works with livestock producers and rural health programs, combining field operations, advisory services and training.',
    specialties: ['Large Animals', 'Nutrition', 'Field Health Programs', 'Preventive Advisory'],
    benefits: ['Travel allowance', 'Field incentives', 'Insurance', 'Training budget'],
    hiringFocus: ['Animal Nutritionists', 'Field Veterinarians', 'Program Managers'],
  },
  {
    id: 'healthypaws-pet-care',
    name: 'HealthyPaws Pet Care',
    location: 'Delhi NCR',
    type: 'Pet Store',
    jobs: 2,
    employees: '20-50',
    logo: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=100&h=100&fit=crop',
    rating: 4.7,
    verified: true,
    founded: '2019',
    responseTime: 'Replies within 48 hours',
    overview: 'A premium pet wellness brand hiring customer-facing specialists for pet care, nutrition counselling and in-store clinical support.',
    specialties: ['Pet Retail', 'Nutrition Counselling', 'Wellness Services'],
    benefits: ['Sales incentive', 'Product allowance', 'Paid leave'],
    hiringFocus: ['Pet Care Specialists', 'Store Veterinarians'],
  },
  {
    id: '247-animal-hospital',
    name: '24/7 Animal Hospital',
    location: 'Hyderabad, Telangana',
    type: 'Hospital',
    jobs: 6,
    employees: '100-500',
    logo: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=100&h=100&fit=crop',
    rating: 4.5,
    verified: true,
    founded: '2010',
    responseTime: 'Priority responses for urgent hiring roles',
    overview: 'A round-the-clock referral hospital with ICU, trauma and emergency facilities for high-volume case management.',
    specialties: ['Critical Care', 'Trauma', 'Emergency Surgery', 'ICU Support'],
    benefits: ['Urgent hire bonus', 'Shift meals', 'On-call allowance'],
    hiringFocus: ['Emergency Vets', 'ICU Nurses', 'Night Duty Clinicians'],
  },
  {
    id: 'birdcare-center',
    name: 'BirdCare Center',
    location: 'Chennai, Tamil Nadu',
    type: 'Specialty',
    jobs: 2,
    employees: '10-20',
    logo: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=100&h=100&fit=crop',
    rating: 4.8,
    verified: true,
    founded: '2016',
    responseTime: 'Replies in 24-48 hours',
    overview: 'A specialty avian and exotic animal center focused on diagnostics, rehabilitation and preventive care for birds and small exotics.',
    specialties: ['Avian Medicine', 'Exotics', 'Diagnostics', 'Rehabilitation'],
    benefits: ['Specialty training', 'Mentorship', 'Conference sponsorship'],
    hiringFocus: ['Avian Specialists', 'Exotics Clinicians'],
  },
];

export interface CandidateExperience {
  jobTitle: string;
  employmentType: string;
  organizationName: string;
  joiningDate: string;
  endDate: string;
  roleDescription: string;
}

export interface CandidateProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  currentLocation: string;
  gender: string;
  aadhaarVerified: boolean;
  preferredLocations: string[];
  profileSummary: string;
  photoUrl: string;
  degree: string;
  educationLevel: string;
  specialization: string;
  courseType: string;
  courseStartDate: string;
  courseEndDate: string;
  grade: string;
  educationCountry: string;
  educationCity: string;
  additionalDetails: string;
  certifications: string[];
  professionalLicenses: string;
  currentJobTitle: string;
  employmentType: string;
  organizationName: string;
  currentSalary: string;
  salaryFormat: string;
  skills: string[];
  experiences: CandidateExperience[];
}

export const defaultCandidateProfile: CandidateProfileForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  pincode: '',
  currentLocation: '',
  gender: '',
  aadhaarVerified: false,
  preferredLocations: [],
  profileSummary: '',
  photoUrl: '',
  degree: '',
  educationLevel: '',
  specialization: '',
  courseType: '',
  courseStartDate: '',
  courseEndDate: '',
  grade: '',
  educationCountry: 'India',
  educationCity: '',
  additionalDetails: '',
  certifications: [],
  professionalLicenses: '',
  currentJobTitle: '',
  employmentType: '',
  organizationName: '',
  currentSalary: '',
  salaryFormat: 'per annum',
  skills: [],
  experiences: [
    {
      jobTitle: '',
      employmentType: '',
      organizationName: '',
      joiningDate: '',
      endDate: '',
      roleDescription: '',
    },
  ],
};

export interface EmployerProfileForm {
  companyName: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  website: string;
  organizationType: string;
  foundedYear: string;
  teamSize: string;
  headquarters: string;
  activeJobs: string;
  workplaceModel: string;
  hiringUrgency: string;
  logoUrl: string;
  overview: string;
  specialties: string[];
  benefits: string[];
  hiringRegions: string[];
  phoneVerified: boolean;
  emailVerified: boolean;
}

export const defaultEmployerProfile: EmployerProfileForm = {
  companyName: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  email: '',
  website: '',
  organizationType: '',
  foundedYear: '',
  teamSize: '',
  headquarters: '',
  activeJobs: '',
  workplaceModel: 'On-site',
  hiringUrgency: 'Standard',
  logoUrl: '',
  overview: '',
  specialties: [],
  benefits: [],
  hiringRegions: [],
  phoneVerified: false,
  emailVerified: false,
};

export const candidateSkillSuggestions = [
  'Surgery',
  'Emergency Care',
  'Diagnostics',
  'Vaccination',
  'Nutrition',
  'Pet Care',
  'Large Animals',
  'Avian Medicine',
  'Dermatology',
  'Dentistry',
];

export const candidateLocationSuggestions = [
  'Mumbai',
  'Bangalore',
  'Delhi NCR',
  'Hyderabad',
  'Pune',
  'Chennai',
];

export const employerSpecialtyOptions = [
  'Small Animal Surgery',
  'Emergency Care',
  'Diagnostics',
  'Large Animals',
  'Avian Medicine',
  'Nutrition',
  'Preventive Care',
  'Client Counselling',
];

export const employerBenefitOptions = [
  'Relocation Support',
  'Health Insurance',
  'Accommodation',
  'Joining Bonus',
  'Weekend Allowance',
  'Learning Budget',
  'Flexible Shifts',
  'Performance Bonus',
];

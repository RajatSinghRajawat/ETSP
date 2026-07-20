import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { EmployerProfile } from '../src/models/employer-profile.model.js';
import { Job } from '../src/models/job.model.js';
import { User } from '../src/models/user.model.js';
import { logger } from '../src/utils/logger.js';

const EMPLOYERS = [
  {
    email: 'hr@pawcareanimalhosp.com',
    companyName: 'PawCare Animal Hospital',
    firstName: 'Rajesh',
    lastName: 'Mehta',
    phoneNumber: '9811001001',
    organizationType: 'Private Hospital',
    teamSize: '51-200',
    headquarters: 'Mumbai, Maharashtra',
    workplaceModel: 'On-site',
    hiringUrgency: 'Urgent',
    overview:
      'PawCare Animal Hospital is one of Mumbai\'s premier multi-specialty veterinary hospitals. We provide comprehensive care including emergency services, surgery, diagnostics, and rehabilitation for companion animals, exotic species, and livestock.',
    specialties: ['Small Animal Surgery', 'Emergency & Critical Care', 'Exotic Animal Medicine', 'Diagnostic Imaging'],
    benefits: ['Health Insurance', 'PF & ESI', 'Annual Bonus', 'CPD Allowance', 'Paid Leave'],
    hiringRegions: ['Mumbai', 'Thane', 'Navi Mumbai'],
    status: 'submitted',
  },
  {
    email: 'careers@greenleafvet.in',
    companyName: 'Greenleaf Veterinary Clinic',
    firstName: 'Sunita',
    lastName: 'Rao',
    phoneNumber: '9822002002',
    organizationType: 'Private Clinic',
    teamSize: '11-50',
    headquarters: 'Bengaluru, Karnataka',
    workplaceModel: 'On-site',
    hiringUrgency: 'Standard',
    overview:
      'Greenleaf Veterinary Clinic is a trusted neighbourhood veterinary practice in Bengaluru with 12 years of service. We specialise in preventive care, dermatology, and dental health for companion animals.',
    specialties: ['Preventive Care', 'Dermatology', 'Dental Health', 'Nutrition Counselling'],
    benefits: ['Health Insurance', 'Performance Bonus', 'Flexible Hours', 'Training Budget'],
    hiringRegions: ['Bengaluru', 'Mysuru'],
    status: 'submitted',
  },
  {
    email: 'jobs@indiavetresearch.org',
    companyName: 'India Veterinary Research Institute',
    firstName: 'Dr. Anand',
    lastName: 'Sharma',
    phoneNumber: '9833003003',
    organizationType: 'Research Institution',
    teamSize: '201-500',
    headquarters: 'Bareilly, Uttar Pradesh',
    workplaceModel: 'On-site',
    hiringUrgency: 'Standard',
    overview:
      'India Veterinary Research Institute (IVRI) is a national institute under ICAR dedicated to animal disease research, vaccine development, and veterinary education. We conduct cutting-edge research on zoonotic diseases, livestock productivity, and animal welfare.',
    specialties: ['Animal Disease Research', 'Vaccine Development', 'Livestock Pathology', 'Zoonotic Diseases'],
    benefits: ['Government Pay Scale', 'Housing Allowance', 'Medical Benefits', 'Pension', 'Research Grants'],
    hiringRegions: ['Bareilly', 'Delhi NCR', 'Lucknow'],
    status: 'submitted',
  },
  {
    email: 'recruit@nandinidarifarm.co.in',
    companyName: 'Nandini Dairy & Livestock Farm',
    firstName: 'Vikram',
    lastName: 'Patil',
    phoneNumber: '9844004004',
    organizationType: 'Agribusiness',
    teamSize: '51-200',
    headquarters: 'Pune, Maharashtra',
    workplaceModel: 'On-site',
    hiringUrgency: 'Urgent',
    overview:
      'Nandini Dairy & Livestock Farm operates one of Maharashtra\'s largest integrated dairy operations with 4,000+ cattle and a dedicated in-house veterinary team. We focus on animal health management, breeding, and sustainable livestock production.',
    specialties: ['Bovine Medicine', 'Reproduction & AI', 'Herd Health Management', 'Milk Quality Assurance'],
    benefits: ['Accommodation', 'Food & Transport', 'PF', 'Annual Increment', 'Bonus'],
    hiringRegions: ['Pune', 'Nashik', 'Aurangabad'],
    status: 'submitted',
  },
  {
    email: 'hr@wildlifevetfoundation.in',
    companyName: 'Wildlife Veterinary Foundation of India',
    firstName: 'Priya',
    lastName: 'Nair',
    phoneNumber: '9855005005',
    organizationType: 'NGO / Non-Profit',
    teamSize: '11-50',
    headquarters: 'Chennai, Tamil Nadu',
    workplaceModel: 'Hybrid',
    hiringUrgency: 'Standard',
    overview:
      'Wildlife Veterinary Foundation of India works with forest departments, zoos, and conservation organisations to provide medical care to wild animals across India. Our team has treated tigers, elephants, sloth bears, and marine species.',
    specialties: ['Wildlife Medicine', 'Zoo Animal Health', 'Rescue & Rehabilitation', 'Conservation Medicine'],
    benefits: ['Travel Allowance', 'Field Allowance', 'Health Insurance', 'Research Opportunities'],
    hiringRegions: ['Chennai', 'Coimbatore', 'Ooty', 'Bandipur'],
    status: 'submitted',
  },
];

const JOB_DATA = [
  {
    employerIdx: 0,
    title: 'Senior Veterinary Surgeon – Small Animals',
    type: 'Full-time',
    location: 'Mumbai, Maharashtra',
    salary: '₹80,000 – ₹1,20,000 per month',
    experience: '5–8 years',
    education: 'BVSc & AH / MVSc (Surgery)',
    skills: ['Soft Tissue Surgery', 'Orthopaedics', 'Anaesthesiology', 'Post-operative Care', 'Laparoscopy'],
    description: `We are looking for an experienced Senior Veterinary Surgeon to join our busy surgical unit at PawCare Animal Hospital, Mumbai.

**Responsibilities:**
- Perform complex soft tissue and orthopaedic surgeries on dogs, cats, and exotic species
- Conduct pre-operative assessments and anaesthesia planning
- Supervise junior surgeons and interns during procedures
- Maintain detailed surgical records and post-operative care plans
- Collaborate with the internal medicine and radiology teams for multi-disciplinary case management

**Who you are:**
- MVSc or Diplomate qualification in Veterinary Surgery preferred
- Proficient in laparoscopic and minimally invasive procedures
- Strong communication skills for client counselling
- Comfortable managing emergency surgical cases after hours`,
    benefits: 'Health Insurance, PF & ESI, Annual Bonus, CPD Allowance, 24 days paid leave',
    status: 'active',
  },
  {
    employerIdx: 0,
    title: 'Emergency & Critical Care Veterinarian',
    type: 'Full-time',
    location: 'Mumbai, Maharashtra',
    salary: '₹60,000 – ₹90,000 per month',
    experience: '2–5 years',
    education: 'BVSc & AH',
    skills: ['Emergency Triage', 'ICU Management', 'Fluid Therapy', 'Mechanical Ventilation', 'CPR'],
    description: `PawCare Animal Hospital is hiring a dedicated Emergency & Critical Care Veterinarian for our 24/7 emergency unit.

**Responsibilities:**
- Triage, diagnose, and stabilise critically ill and injured animals
- Manage ICU cases including ventilated patients and post-surgical recovery
- Administer fluid therapy, blood transfusions, and pain management protocols
- Communicate clearly with pet owners during stressful situations
- Maintain accurate ICU records and handover notes

**Requirements:**
- 2+ years in emergency or ICU veterinary practice
- Calm under pressure with strong decision-making skills
- Willingness to work rotating shifts including nights and weekends
- Experience with point-of-care ultrasound (POCUS) is a plus`,
    benefits: 'Night Shift Allowance, Health Insurance, PF & ESI, Annual Bonus',
    status: 'active',
  },
  {
    employerIdx: 1,
    title: 'Companion Animal Veterinarian – OPD',
    type: 'Full-time',
    location: 'Bengaluru, Karnataka',
    salary: '₹45,000 – ₹65,000 per month',
    experience: '1–3 years',
    education: 'BVSc & AH',
    skills: ['Clinical Examination', 'Vaccination', 'Deworming', 'Dietary Counselling', 'Client Communication'],
    description: `Greenleaf Veterinary Clinic is seeking a compassionate and skilled Companion Animal Veterinarian for our busy Bengaluru OPD.

**Responsibilities:**
- Conduct wellness exams, vaccinations, and routine preventive care
- Diagnose and treat common medical conditions in dogs and cats
- Advise clients on nutrition, behaviour, and parasite control
- Perform minor procedures such as wound care and dental prophylaxis
- Maintain electronic health records using our PMS software

**Ideal Candidate:**
- Friendly bedside manner with both animals and clients
- Ability to handle a high-volume OPD efficiently
- Interest in dermatology or dentistry is a bonus
- Kannada or Tamil language skills preferred but not mandatory`,
    benefits: 'Performance Bonus, Flexible Hours, Training Budget, Health Insurance',
    status: 'active',
  },
  {
    employerIdx: 1,
    title: 'Veterinary Technician – Diagnostics & Lab',
    type: 'Full-time',
    location: 'Bengaluru, Karnataka',
    salary: '₹22,000 – ₹32,000 per month',
    experience: '1–2 years',
    education: 'Diploma / BSc Veterinary Lab Technology',
    skills: ['Haematology', 'Biochemistry', 'Urinalysis', 'Cytology', 'Sample Collection'],
    description: `We are hiring a skilled Veterinary Technician to manage in-house diagnostics at Greenleaf Veterinary Clinic.

**Responsibilities:**
- Collect blood, urine, and tissue samples from patients
- Run and interpret CBC, biochemistry panels, and urinalysis
- Prepare cytology and skin scraping slides for veterinarian review
- Maintain and calibrate laboratory equipment
- Ensure sample handling, labelling, and biosafety protocols are followed

**Requirements:**
- Proficiency with common diagnostic analysers (Mindray, IDEXX, or similar)
- Attention to detail and accuracy in reporting
- Good knowledge of reference ranges across common companion animal species
- Ability to work independently as well as part of a team`,
    benefits: 'Performance Bonus, Training Budget, Health Insurance',
    status: 'active',
  },
  {
    employerIdx: 2,
    title: 'Research Scientist – Veterinary Virology',
    type: 'Full-time',
    location: 'Bareilly, Uttar Pradesh',
    salary: '₹55,000 – ₹80,000 per month (ICAR Pay Scale)',
    experience: '3–6 years',
    education: 'MVSc / PhD in Veterinary Virology or Microbiology',
    skills: ['Cell Culture', 'PCR & RT-PCR', 'ELISA', 'Virus Isolation', 'Biosafety Level 2/3'],
    description: `India Veterinary Research Institute (IVRI) invites applications for a Research Scientist position in our Virology Division.

**Responsibilities:**
- Design and conduct research on emerging viral diseases affecting livestock and companion animals
- Develop and validate diagnostic assays (ELISA, PCR, NGS) for disease surveillance
- Collaborate with national and international research partners on zoonotic disease projects
- Publish findings in peer-reviewed journals and present at conferences
- Mentor postgraduate students and junior researchers

**Qualifications:**
- PhD in Veterinary Virology, Microbiology, or related discipline preferred
- Hands-on experience with BSL-2 or BSL-3 laboratory practices
- Strong publication record in indexed journals
- Familiarity with ICMR/ICAR grant writing processes`,
    benefits: 'Government Pay Scale, Housing Allowance, Medical Benefits, Pension, Research Grants',
    status: 'active',
  },
  {
    employerIdx: 2,
    title: 'Veterinary Epidemiologist – Livestock Disease Surveillance',
    type: 'Full-time',
    location: 'Bareilly, Uttar Pradesh',
    salary: '₹50,000 – ₹75,000 per month',
    experience: '3–5 years',
    education: 'MVSc / MPH (Veterinary Epidemiology)',
    skills: ['GIS Mapping', 'Disease Modelling', 'Outbreak Investigation', 'SPSS / R', 'Field Surveillance'],
    description: `IVRI is looking for a Veterinary Epidemiologist to strengthen its national livestock disease surveillance programme.

**Responsibilities:**
- Plan and execute field-based surveillance studies for FMD, Brucellosis, PPR, and other priority diseases
- Analyse epidemiological data using statistical and GIS tools
- Prepare surveillance reports for government bodies and international organisations (OIE/FAO)
- Coordinate with state animal husbandry departments and district veterinary officers
- Develop risk maps and early warning systems for disease outbreaks

**Requirements:**
- Proficiency in R, SPSS, or STATA for data analysis
- Experience with ArcGIS or QGIS for spatial epidemiology
- Excellent report writing and presentation skills
- Willingness to undertake extensive field travel across India`,
    benefits: 'Government Pay Scale, Travel Allowance, Medical Benefits, Pension',
    status: 'active',
  },
  {
    employerIdx: 3,
    title: 'Livestock Farm Veterinarian – Dairy Herd Health',
    type: 'Full-time',
    location: 'Pune, Maharashtra',
    salary: '₹40,000 – ₹60,000 per month + Accommodation',
    experience: '2–4 years',
    education: 'BVSc & AH',
    skills: ['Bovine Reproduction', 'Artificial Insemination', 'Herd Health Planning', 'Mastitis Management', 'Record Keeping'],
    description: `Nandini Dairy & Livestock Farm is hiring a full-time Livestock Veterinarian to oversee the health of our 4,000+ cattle herd near Pune.

**Responsibilities:**
- Implement and monitor herd health programmes including vaccination, deworming, and nutrition management
- Perform artificial insemination, pregnancy diagnosis, and reproductive treatments
- Investigate and manage outbreaks of mastitis, lameness, and metabolic disorders
- Maintain detailed treatment records and health performance KPIs
- Liaise with nutritionists and farm managers for integrated production management

**Requirements:**
- Solid understanding of bovine reproductive physiology
- Experience with TMR (total mixed ration) and body condition scoring
- Comfortable working in a farm environment, including early mornings and weekends
- Valid two-wheeler or four-wheeler driving licence`,
    benefits: 'Accommodation, Food & Transport, PF, Annual Increment, Performance Bonus',
    status: 'active',
  },
  {
    employerIdx: 3,
    title: 'Veterinary Assistant – Livestock & Poultry',
    type: 'Full-time',
    location: 'Nashik, Maharashtra',
    salary: '₹18,000 – ₹25,000 per month',
    experience: '0–1 year (Freshers Welcome)',
    education: 'BVSc & AH / Diploma in Animal Husbandry',
    skills: ['Animal Handling', 'Vaccination', 'Basic Wound Care', 'Record Keeping', 'Biosecurity'],
    description: `We are offering an excellent opportunity for fresh veterinary graduates or diploma holders to join our livestock and poultry division at Nandini Farms, Nashik.

**Responsibilities:**
- Assist senior veterinarians in routine health checks and treatment procedures
- Administer vaccines, dewormers, and medications under supervision
- Maintain daily health logs and mortality records
- Ensure biosecurity protocols are strictly followed across poultry sheds and cattle barns
- Support feed management and growth monitoring activities

**Why Join Us:**
This is a hands-on learning role ideal for those who want to build a strong foundation in production animal medicine. You will receive structured mentorship from our senior veterinary team.`,
    benefits: 'Accommodation, Food & Transport, PF, Structured Training Programme',
    status: 'active',
  },
  {
    employerIdx: 4,
    title: 'Wildlife Veterinarian – Rescue & Rehabilitation',
    type: 'Full-time',
    location: 'Chennai, Tamil Nadu',
    salary: '₹35,000 – ₹55,000 per month',
    experience: '2–4 years',
    education: 'BVSc & AH (MVSc in Wildlife preferred)',
    skills: ['Wildlife Capture & Immobilisation', 'Chemical Restraint', 'Zoo Animal Medicine', 'Rehabilitation Protocols', 'Field Veterinary Work'],
    description: `Wildlife Veterinary Foundation of India is seeking a passionate Wildlife Veterinarian to join our rescue and rehabilitation team across Tamil Nadu and Karnataka.

**Responsibilities:**
- Provide emergency veterinary care to rescued wild animals including tigers, leopards, elephants, deer, and reptiles
- Administer chemical immobilisation and anaesthesia for capture, treatment, and translocation operations
- Design rehabilitation programmes in collaboration with forest officials and zoo keepers
- Conduct health assessments prior to soft-release of rehabilitated animals
- Prepare detailed clinical reports for forest department and MoEFCC compliance

**Requirements:**
- Training in wildlife capture techniques and chemical restraint drugs (M99, ketamine, etc.)
- Physical fitness and willingness to work in remote field conditions
- Experience working with forest departments or rescue centres is highly valued
- Ability to work flexible hours during rescue operations`,
    benefits: 'Travel Allowance, Field Allowance, Health Insurance, Research Opportunities',
    status: 'active',
  },
  {
    employerIdx: 4,
    title: 'Veterinary Education Coordinator – Conservation Outreach',
    type: 'Part-time',
    location: 'Chennai, Tamil Nadu (Hybrid)',
    salary: '₹20,000 – ₹30,000 per month',
    experience: '1–3 years',
    education: 'BVSc & AH / BSc Wildlife Sciences',
    skills: ['Public Education', 'Content Creation', 'Community Outreach', 'Social Media', 'Report Writing'],
    description: `Wildlife Veterinary Foundation of India is looking for a Veterinary Education Coordinator to lead our community conservation outreach initiatives.

**Responsibilities:**
- Design and deliver educational workshops on wildlife conservation and human-animal conflict for village communities, schools, and forest personnel
- Create engaging content (articles, videos, infographics) on wildlife health and conservation for social media and our newsletter
- Coordinate with field veterinarians to document and share rescue case studies
- Assist with grant report writing and donor communications
- Build relationships with local NGOs, universities, and government bodies

**Requirements:**
- Excellent communication and public speaking skills in Tamil and English (Hindi a plus)
- Experience in science communication, journalism, or education is preferred
- Passion for wildlife conservation and animal welfare
- Proficiency with Canva, Adobe tools, or similar for content creation`,
    benefits: 'Travel Allowance, Health Insurance, Flexible Working Hours',
    status: 'active',
  },
];

async function upsertEmployer(data) {
  let employer = await EmployerProfile.findOne({ email: data.email }).lean();
  if (employer) {
    logger.info(`Employer already exists: ${data.companyName}`);
    return employer;
  }
  await User.updateOne(
    { email: data.email },
    { $setOnInsert: { email: data.email, role: 'employer', isActive: true } },
    { upsert: true },
  );
  employer = await EmployerProfile.create(data);
  logger.info(`Created employer: ${data.companyName}`);
  return employer;
}

async function run() {
  await connectDatabase();
  let created = 0;
  let skipped = 0;

  try {
    // Upsert all employers first
    const employers = [];
    for (const empData of EMPLOYERS) {
      const emp = await upsertEmployer(empData);
      employers.push(emp);
    }

    // Seed jobs
    for (const jobData of JOB_DATA) {
      const employer = employers[jobData.employerIdx];
      const exists = await Job.findOne({
        employerEmail: employer.email,
        title: jobData.title,
      }).lean();

      if (exists) {
        logger.info(`Skipping existing job: ${jobData.title}`);
        skipped += 1;
        continue;
      }

      const { employerIdx, ...rest } = jobData;
      void employerIdx;

      await Job.create({
        ...rest,
        employerProfile: employer._id,
        employerEmail: employer.email,
        companyName: employer.companyName,
      });

      logger.info(`Created job: ${jobData.title} @ ${employer.companyName}`);
      created += 1;
    }

    logger.info(`\nDone. Jobs created: ${created}, Skipped: ${skipped}`);
  } catch (error) {
    logger.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

run();

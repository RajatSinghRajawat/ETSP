import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "nav_title": "VetJobs",
      "home": "Home",
      "find_job": "Find Job",
      "jobs": "Jobs",
      "employers": "Employers",
      "candidates": "Candidates",
      "post_job_nav": "Post Job",
      "about": "About",
      "contact": "Contact",
      "login": "Login",
      "signup": "Sign Up",
      "language": "Language",
      "theme_mode": "Theme Mode",
      
      "hero_title": "Find the Best Veterinary Jobs Near You",
      "hero_subtitle": "Connect with top animal hospitals, clinics, and pet care organizations",
      "search_placeholder": "Veterinary Doctor, Pet Surgeon...",
      "location_placeholder": "City, State...",
      "search": "Search",
      "popular_tags": "Popular Tags",
      
      "slide1_title": "Caring for Every Life",
      "slide1_subtitle": "Connect with the best animal hospitals and clinics across the country.",
      "slide2_title": "Advanced Vet Care",
      "slide2_subtitle": "Find specialized roles in surgery, diagnostics, and emergency care.",
      "slide3_title": "Join Top Clinics",
      "slide3_subtitle": "Grow your veterinary career with world-class pet care organizations.",
      "get_started": "Get Started",
      "learn_more": "Learn More",
      
      "quick_vet": "I am a Veterinary Doctor",
      "quick_employer": "I am an Employer / Clinic",
      "find_jobs": "Find Jobs",
      "post_job": "Post a Job",
      
      "featured_jobs": "Featured Veterinary Jobs",
      "featured_jobs_subtitle": "Hand-picked opportunities for animal care professionals",
      "apply_now": "Apply Now",
      "view_all": "View All Jobs",
      
      "doctors_gallery": "Meet Our Professional Doctors",
      "doctors_gallery_subtitle": "Top-rated veterinary specialists registered on our platform",
      
      "featured_candidates": "Featured Veterinary Professionals",
      "featured_candidates_subtitle": "Top talent ready to join your clinic or hospital",
      "experience": "Experience",
      "years": "years",
      "skills": "Skills",
      "unlock_profile": "Unlock Profile",
      
      "why_title": "Why Choose Us",
      "why_subtitle": "The #1 platform for veterinary recruitment",
      "why_verified": "Verified Employers",
      "why_verified_desc": "Trustworthy animal care organizations only",
      "why_easy": "Easy Job Application",
      "why_easy_desc": "Apply to multiple clinics with one profile",
      "why_specialized": "Specialized Jobs",
      "why_specialized_desc": "Roles focused purely on veterinary medicine",
      "why_chat": "Direct Chat",
      "why_chat_desc": "Talk directly with clinic hiring managers",
      
      "stat_jobs": "Veterinary Jobs",
      "stat_clinics": "Clinics & Hospitals",
      "stat_doctors": "Doctors Registered",
      
      "cta_title": "Start Your Veterinary Career Today",
      "cta_subtitle": "Join thousands of veterinary professionals and employers",
      
      "footer_desc": "Connecting animal care professionals with the best opportunities globally.",
      "company": "Company",
      "support": "Support",
      "social": "Social Links",
      "all_rights": "All rights reserved.",
      
      "job_profiles_title": "Job Profiles",
      "job_profiles_subtitle": "Explore specialized roles across veterinary hospitals, clinics, and pet care centers",
      "job_veterinarian": "Veterinarian",
      "job_vet_assistant": "Veterinary Assistant",
      "job_ward_boy": "Ward Boy",
      "job_pet_trainer": "Pet Trainer",
      "job_pet_groomer": "Pet Groomer",
      "job_receptionist": "Receptionist",
      "job_floor_manager": "Floor Manager",
      "job_sales_manager": "Sales Manager",
      "job_inventory_incharge": "Inventory Incharge",
      "explore_jobs": "Explore Jobs",
      "verified_employers_badge": "Verified Employers | Free for Candidates | Jobs Across India",
      "i_am_candidate": "I am a Candidate",
      "i_am_employer": "I am an Employer",
      "hero_headline_updated": "Connect with top clinics, companies and specialized veterinary opportunities across India",
      "verified_candidates": "Verified Candidates",
      "help_center": "Help & FAQs",
      "help_center_title": "Help Center & FAQ",
      "help_center_subtitle": "Find quick answers for candidates and employers",
      
      "login_title": "Login to your account",
      "login_subtitle": "Welcome back! Please enter your details.",
      "phone_login": "Login with Phone",
      "email_login": "Login with Email",
      "dont_have_account": "Don't have an account?",
      "sign_up": "Sign Up",
      "email_placeholder": "Enter your email address",
      "phone_placeholder": "Enter your phone number",
      "otp_placeholder": "Enter 6-digit OTP",
      "back_to_login": "Back to Login",
      "send_otp": "Send OTP",
      "verify_otp": "Verify OTP"
    }
  },
  hi: {
    translation: {
      "nav_title": "VetsLinked",
      "home": "होम",
      "find_job": "जॉब खोजें",
      "jobs": "जॉब्स",
      "employers": "एम्प्लॉयर्स",
      "candidates": "कैंडिडेट्स",
      "post_job_nav": "जॉब पोस्ट करें",
      "about": "हमारे बारे में",
      "contact": "संपर्क",
      "login": "लॉगिन",
      "signup": "साइन अप",
      "language": "भाषा",
      "theme_mode": "थीम मोड",
      
      "hero_title": "भारत भर में सर्वश्रेष्ठ वेटरनरी जॉब्स और प्रतिभाएं खोजें",
      "hero_subtitle": "शीर्ष वेटरनरी संस्थानों, पेट केयर कंपनियों और पशु अस्पतालों से जुड़ें",
      "search_placeholder": "वेटरनरी डॉक्टर, पेट ग्रूमर, लैब तकनीशियन...",
      "location_placeholder": "शहर, राज्य...",
      "search": "खोजें",
      "popular_tags": "लोकप्रिय टैग्स",
      
      "slide1_title": "हर जीवन की देखभाल",
      "slide1_subtitle": "देश भर के सर्वश्रेष्ठ पशु अस्पतालों और संस्थानों से जुड़ें।",
      "slide2_title": "उन्नत वेटरनरी देखभाल",
      "slide2_subtitle": "सर्जरी, डायग्नोस्टिक्स और इमरजेंसी देखभाल में विशेषज्ञ भूमिकाएं खोजें।",
      "slide3_title": "शीर्ष संस्थानों से जुड़ें",
      "slide3_subtitle": "विश्व स्तरीय पेट केयर संस्थानों के साथ अपना करियर बढ़ाएं।",
      "get_started": "शुरू करें",
      "learn_more": "और जानें",
      
      "quick_vet": "मैं एक कैंडिडेट हूँ",
      "quick_employer": "मैं एक एम्प्लॉयर हूँ",
      "find_jobs": "जॉब्स खोजें",
      "post_job": "मुफ्त जॉब पोस्ट करें",
      
      "featured_jobs": "फीचर्ड वेटरनरी जॉब्स",
      "featured_jobs_subtitle": "पशु देखभाल पेशेवरों के लिए चुनिंदा अवसर",
      "apply_now": "अभी आवेदन करें",
      "view_all": "सभी जॉब्स देखें",
      
      "doctors_gallery": "हमारे सत्यापित कैंडिडेट्स से मिलें",
      "doctors_gallery_subtitle": "हमारे प्लेटफॉर्म पर पंजीकृत सत्यापित वेटरनरी विशेषज्ञ",
      
      "featured_candidates": "सत्यापित कैंडिडेट्स",
      "featured_candidates_subtitle": "आपके संस्थान या अस्पताल के लिए योग्य प्रतिभाएँ",
      "experience": "अनुभव",
      "years": "साल",
      "skills": "कौशल",
      "unlock_profile": "प्रोफ़ाइल देखें",
      
      "why_title": "VetsLinked क्यों चुनें",
      "why_subtitle": "वेटरनरी भर्ती का नंबर 1 विश्वसनीय प्लेटफॉर्म",
      "why_verified": "वेरिफाइड एम्प्लॉयर्स",
      "why_verified_desc": "केवल प्रामाणिक पशु देखभाल संस्थान",
      "why_easy": "आसान आवेदन प्रक्रिया",
      "why_easy_desc": "एक प्रोफ़ाइल से कई संस्थाओं में आवेदन करें",
      "why_specialized": "विशेषज्ञ भूमिकाएँ",
      "why_specialized_desc": "पूरी तरह से वेटरनरी क्षेत्र पर केंद्रित",
      "why_chat": "डायरेक्ट बातचीत",
      "why_chat_desc": "हायरिंग मैनेजरों से सीधे चैट करें",

      "job_profiles_title": "जॉब प्रोफाइल",
      "job_profiles_subtitle": "पशु अस्पतालों, क्लीनिकों और पेट केयर सेंटरों में विशेषज्ञ भूमिकाएं खोजें",
      "job_veterinarian": "वेटरनरी डॉक्टर",
      "job_vet_assistant": "वेटरनरी असिस्टेंट",
      "job_ward_boy": "वार्ड बॉय",
      "job_pet_trainer": "पेट ट्रेनर",
      "job_pet_groomer": "पेट ग्रूमर",
      "job_receptionist": "रिसेप्शनिस्ट",
      "job_floor_manager": "फ्लोर मैनेजर",
      "job_sales_manager": "सेल्स मैनेजर",
      "job_inventory_incharge": "इन्वेंट्री प्रभारी",
      "explore_jobs": "जॉब्स देखें",
      
      "stat_jobs": "वेटरनरी जॉब्स",
      "stat_clinics": "क्लीनिक और अस्पताल",
      "stat_doctors": "पंजीकृत डॉक्टर",
      
      "cta_title": "आज ही अपना वेटरनरी करियर शुरू करें",
      "cta_subtitle": "हजारों वेटरनरी प्रोफेशनल्स और एम्प्लॉयर्स से जुड़ें",
      
      "footer_desc": "पशु देखभाल पेशेवरों को वैश्विक स्तर पर सर्वोत्तम अवसरों से जोड़ना।",
      "company": "कंपनी",
      "support": "सहायता",
      "social": "सोशल लिंक्स",
      "all_rights": "सर्वाधिकार सुरक्षित।",
      
      "login_title": "लॉगिन करें",
      "login_subtitle": "वापसी पर स्वागत है! कृपया अपना विवरण दर्ज करें।",
      "phone_login": "फ़ोन से लॉगिन करें",
      "email_login": "ईमेल से लॉगिन करें",
      "dont_have_account": "क्या आपका अकाउंट नहीं है?",
      "sign_up": "साइन अप",
      "email_placeholder": "अपना ईमेल पता दर्ज करें",
      "phone_placeholder": "अपना फ़ोन नंबर दर्ज करें",
      "otp_placeholder": "6 अंकों का OTP दर्ज करें",
      "back_to_login": "लॉगिन पर वापस जाएं",
      "send_otp": "OTP भेजें",
      "verify_otp": "OTP सत्यापित करें"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['queryString', 'cookie', 'localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie'],
    }
  });

export default i18n;

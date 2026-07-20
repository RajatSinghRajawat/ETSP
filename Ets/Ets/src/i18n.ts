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
      
      "login_title": "Login to your account",
      "login_subtitle": "Welcome back! Please enter your details.",
      "phone_login": "Login with Phone",
      "email_login": "Login with Email",
      "dont_have_account": "Don't have an account?",
      "sign_up": "Sign Up"
    }
  },
  hi: {
    translation: {
      "nav_title": "VetJobs",
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
      
      "hero_title": "अपने पास बेहतरीन वेटरनरी जॉब्स खोजें",
      "hero_subtitle": "टॉप पशु अस्पतालों, क्लीनिकों और पेट केयर संस्थानों से जुड़ें",
      "search_placeholder": "वेटरनरी डॉक्टर, पेट सर्जन...",
      "location_placeholder": "शहर, राज्य...",
      "search": "खोजें",
      "popular_tags": "लोकप्रिय टैग्स",
      
      "slide1_title": "हर जीवन की देखभाल",
      "slide1_subtitle": "देश भर के सर्वश्रेष्ठ पशु अस्पतालों और क्लीनिकों से जुड़ें।",
      "slide2_title": "उन्नत वेटरनरी देखभाल",
      "slide2_subtitle": "सर्जरी, डायग्नोस्टिक्स और इमरजेंसी देखभाल में विशेषज्ञ भूमिकाएं खोजें।",
      "slide3_title": "टॉप क्लीनिकों से जुड़ें",
      "slide3_subtitle": "विश्व स्तरीय पेट केयर संस्थानों के साथ अपना वेटरनरी करियर बढ़ाएं।",
      "get_started": "शुरू करें",
      "learn_more": "और जानें",
      
      "quick_vet": "मैं एक वेटरनरी डॉक्टर हूँ",
      "quick_employer": "मैं एक एम्प्लॉयर / क्लीनिक हूँ",
      "find_jobs": "जॉब्स खोजें",
      "post_job": "जॉब पोस्ट करें",
      
      "featured_jobs": "फीचर्ड वेटरनरी जॉब्स",
      "featured_jobs_subtitle": "पशु देखभाल पेशेवरों के लिए चुनिंदा अवसर",
      "apply_now": "अभी आवेदन करें",
      "view_all": "सभी जॉब्स देखें",
      
      "doctors_gallery": "हमारे पेशेवर डॉक्टरों से मिलें",
      "doctors_gallery_subtitle": "हमारे प्लेटफॉर्म पर पंजीकृत टॉप-रेटेड वेटरनरी विशेषज्ञ",
      
      "featured_candidates": "फीचर्ड वेटरनरी प्रोफेशनल्स",
      "featured_candidates_subtitle": "आपके क्लीनिक या अस्पताल के लिए टॉप टैलेंट",
      "experience": "अनुभव",
      "years": "साल",
      "skills": "कौशल",
      "unlock_profile": "प्रोफ़ाइल अनलॉक करें",
      
      "why_title": "हमें क्यों चुनें",
      "why_subtitle": "वेटरनरी भर्ती के लिए नंबर 1 प्लेटफॉर्म",
      "why_verified": "वेरिफाइड एम्प्लॉयर्स",
      "why_verified_desc": "केवल भरोसेमंद पशु देखभाल संस्थान",
      "why_easy": "आसान जॉब आवेदन",
      "why_easy_desc": "एक प्रोफ़ाइल से कई क्लीनिकों में आवेदन करें",
      "why_specialized": "विशेष वेटरनरी जॉब्स",
      "why_specialized_desc": "पूरी तरह से वेटरनरी मेडिसिन पर केंद्रित भूमिकाएं",
      "why_chat": "डायरेक्ट चैट",
      "why_chat_desc": "क्लीनिक हायरिंग मैनेजर्स से सीधे बात करें",
      
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
      "sign_up": "साइन अप"
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

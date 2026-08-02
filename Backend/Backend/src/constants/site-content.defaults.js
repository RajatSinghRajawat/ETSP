/**
 * English + Hindi defaults for CMS site content.
 * Shared (non-translated) fields live under `social` at the root.
 */

export const DEFAULT_SOCIAL = {
  facebook: '',
  twitter: '',
  linkedin: '',
  instagram: '',
};

export const DEFAULT_LOCALE_EN = {
  contact: {
    email: 'support@vetjobs.com',
    phone: '+91 123 456 7890',
    address: 'Mumbai, Maharashtra, India',
    workingHours: 'Mon - Sat, 9:00 AM - 6:00 PM',
    heroTitle: 'Contact Us',
    heroSubtitle: "We'd love to hear from you. Get in touch with us.",
    formTitle: 'Send us a message',
    formSubmitLabel: 'Send Message',
  },
  about: {
    heroOverline: 'ABOUT US',
    heroTitle: 'About VetJobs',
    heroSubtitle: "India's most trusted veterinary recruitment platform",
    primaryCtaLabel: 'Find Jobs',
    primaryCtaPath: '/jobs',
    secondaryCtaLabel: 'Contact Us',
    secondaryCtaPath: '/contact',
    missionTitle: 'Our Mission',
    missionBody: [
      'To create a seamless connection between veterinary professionals and animal healthcare organizations across India. We believe that every pet deserves the best care, and that starts with connecting them with qualified and passionate professionals.',
      'Through our innovative platform, we are building a community where veterinary talent meets opportunity, ultimately enhancing the quality of animal healthcare nationwide.',
    ],
    missionImageUrl:
      'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=600',
    storyTitle: 'Our Story',
    storyBody:
      'We started with a simple goal: make it easier for veterinary professionals to find work they love, and for clinics to find people they can trust.',
    stats: [
      { value: '10,000+', label: 'Active Professionals' },
      { value: '5,000+', label: 'Jobs Posted' },
      { value: '2,000+', label: 'Partner Clinics' },
      { value: '98%', label: 'Satisfaction Rate' },
    ],
    valuesTitle: 'What We Stand For',
    valuesSubtitle: 'Our core values guide everything we do at VetJobs',
    values: [
      {
        id: 'trust',
        title: 'Trust & Verification',
        description:
          'Every professional and employer goes through our rigorous verification process to ensure authenticity.',
        iconKey: 'Verified',
      },
      {
        id: 'speed',
        title: 'Fast & Efficient',
        description:
          'Our streamlined process helps you find or hire the right veterinary professional in minimal time.',
        iconKey: 'Speed',
      },
      {
        id: 'pet-centric',
        title: 'Pet-Centric',
        description:
          'We are dedicated to improving animal healthcare by connecting pet owners with the best care providers.',
        iconKey: 'Pets',
      },
      {
        id: 'support',
        title: '24/7 Support',
        description:
          'Our dedicated support team is always available to help you with any queries or concerns.',
        iconKey: 'Support',
      },
    ],
    journeyTitle: 'Our Journey',
    journeySubtitle: 'Key milestones in our mission to transform veterinary hiring',
    milestones: [
      {
        year: '2020',
        title: 'VetJobs Founded',
        description: 'Started with a mission to transform veterinary hiring',
      },
      {
        year: '2021',
        title: '10,000 Users',
        description: 'Reached our first major milestone of 10,000 users',
      },
      {
        year: '2022',
        title: 'Pan-India Launch',
        description: 'Expanded operations across all major Indian cities',
      },
      {
        year: '2023',
        title: 'Mobile App Launch',
        description: 'Released our mobile app for easier access',
      },
      {
        year: '2024',
        title: 'AI Matching',
        description: 'Introduced AI-powered job matching technology',
      },
    ],
    teamTitle: 'Meet Our Team',
    teamSubtitle:
      'The passionate individuals behind VetJobs who are committed to transforming veterinary hiring',
    team: [
      {
        name: 'Dr. Rahul Sharma',
        role: 'Founder & CEO',
        image:
          'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200',
        experience: '15+ years',
      },
      {
        name: 'Dr. Priya Mehta',
        role: 'Chief Veterinary Officer',
        image:
          'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200',
        experience: '12+ years',
      },
      {
        name: 'Vikram Singh',
        role: 'Head of Technology',
        image:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
        experience: '10+ years',
      },
      {
        name: 'Anita Desai',
        role: 'Operations Lead',
        image:
          'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
        experience: '8+ years',
      },
    ],
    ctaTitle: 'Ready to Join the VetJobs Family?',
    ctaSubtitle:
      "Whether you're a veterinary professional looking for your dream job or an employer seeking top talent, we're here to help.",
    ctaPrimaryLabel: 'Get Started',
    ctaPrimaryPath: '/signup',
    ctaSecondaryLabel: 'Learn More',
    ctaSecondaryPath: '/contact',
  },
  hero: {
    badge: "India's #1 Veterinary Job Portal",
    headlinePrefix: 'Empowering Your',
    headlineAccent: 'Veterinary',
    headlineSuffix: 'Career',
    subtitle:
      'Connect with top clinics, companies and specialized veterinary opportunities across India',
    searchKeywordPlaceholder: 'Job title, skill, or keyword',
    searchLocationPlaceholder: 'Location',
    searchButtonLabel: 'Search',
    trustLine: 'Verified Employers | Free for Candidates | Jobs Across India',
    hiringPrompt: 'Are you hiring?',
    hiringCtaLabel: 'Post a Job',
    hiringCtaPath: '/employer/post-job',
    floatingBadge1Title: 'Verified Candidates',
    floatingBadge1Subtitle: 'Identity checked',
    floatingBadge2Title: '100% Free',
    floatingBadge2Subtitle: 'For job seekers',
  },
  jobProfiles: {
    title: 'Job Profiles',
    subtitle: 'Explore specialized roles across clinics, hospitals and pet-care businesses.',
    exploreLabel: 'Explore Jobs',
    items: [
      {
        id: 'veterinarian',
        title: 'Veterinarian',
        description: 'Diagnosis, surgery, and comprehensive clinical pet care.',
        searchQuery: 'Veterinarian',
        color: '#0c5283',
        bgColor: 'rgba(12, 82, 131, 0.08)',
        iconKey: 'MedicalServices',
      },
      {
        id: 'veterinary-assistant',
        title: 'Veterinary Assistant',
        description: 'Assist doctors in clinical care, treatment, and diagnostics.',
        searchQuery: 'Veterinary Assistant',
        color: '#0ab6a2',
        bgColor: 'rgba(10, 182, 162, 0.08)',
        iconKey: 'Healing',
      },
      {
        id: 'ward-boy',
        title: 'Ward Boy',
        description: 'Inpatient ward management, animal handling, and sanitation.',
        searchQuery: 'Ward Boy',
        color: '#7c3aed',
        bgColor: 'rgba(124, 58, 237, 0.08)',
        iconKey: 'Hotel',
      },
      {
        id: 'pet-trainer',
        title: 'Pet Trainer',
        description: 'Behavioral training, discipline, and agility instruction.',
        searchQuery: 'Pet Trainer',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.08)',
        iconKey: 'Pets',
      },
      {
        id: 'pet-groomer',
        title: 'Pet Groomer',
        description: 'Professional bathing, styling, coat care, and hygiene.',
        searchQuery: 'Pet Groomer',
        color: '#ec4899',
        bgColor: 'rgba(236, 72, 153, 0.08)',
        iconKey: 'ContentCut',
      },
      {
        id: 'receptionist',
        title: 'Receptionist',
        description: 'Front desk management, appointment scheduling, and client handling.',
        searchQuery: 'Receptionist',
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.08)',
        iconKey: 'SupportAgent',
      },
      {
        id: 'floor-manager',
        title: 'Floor Manager',
        description: 'Supervising clinic operations, staff coordination, and service flow.',
        searchQuery: 'Floor Manager',
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.08)',
        iconKey: 'BusinessCenter',
      },
      {
        id: 'sales-manager',
        title: 'Sales Manager',
        description: 'Business development, client growth, and pharma/vet product sales.',
        searchQuery: 'Sales Manager',
        color: '#8b5cf6',
        bgColor: 'rgba(139, 92, 246, 0.08)',
        iconKey: 'TrendingUp',
      },
      {
        id: 'inventory-incharge',
        title: 'Inventory Incharge',
        description: 'Managing medicines, surgical supplies, and pet product stocks.',
        searchQuery: 'Inventory Incharge',
        color: '#0284c7',
        bgColor: 'rgba(2, 132, 199, 0.08)',
        iconKey: 'Inventory',
      },
    ],
  },
  privacy: {
    heroTitle: 'Privacy Policy',
    heroSubtitle: 'How we collect, use and protect the information you share with us.',
    lastUpdated: '1 August 2026',
    intro:
      'This policy explains what happens to your information when you use our platform, whether you are a veterinary professional looking for work or an organisation hiring one.',
    sections: [
      {
        id: 'collect',
        title: 'Information We Collect',
        body: [
          'Account details you provide when registering — name, email, phone and company information for employers.',
          'Profile content such as education, experience, skills and photos.',
          'Usage information from browsing, saving and applying to jobs.',
          'Technical data such as browser type, device and IP address for security.',
        ],
      },
      {
        id: 'use',
        title: 'How We Use Your Information',
        body: [
          'To create and maintain your account.',
          'To show candidate profiles to employers and publish employer job posts.',
          'To send login OTPs, job alerts and account notifications you opted into.',
          'To improve matching and keep the platform free of fraud.',
        ],
      },
      {
        id: 'share',
        title: 'What We Share',
        body: [
          'Candidate profiles are visible to verified employers; contact details unlock when permitted.',
          'Employer details and jobs are shown publicly once approved.',
          'Trusted providers (email, SMS, payments) receive only what they need.',
          'We do not sell your personal information to advertisers.',
        ],
      },
      {
        id: 'cookies',
        title: 'Cookies & Local Storage',
        body: [
          'We use cookies and browser storage to keep you signed in and remember preferences.',
          'You can clear or block these in your browser; essential cookies are required for login.',
        ],
      },
      {
        id: 'rights',
        title: 'Your Rights',
        body: [
          'You can view and update your information from your profile.',
          'You may request a copy, correction, or deletion of your account.',
          'You can turn off job alerts without losing platform access.',
        ],
      },
    ],
    contactCardTitle: 'Questions About Your Data?',
    contactCardBody: 'Write to us from the Contact page and our team will respond.',
  },
  terms: {
    heroTitle: 'Terms of Service',
    heroSubtitle: 'The rules that apply when you use our platform.',
    lastUpdated: '1 August 2026',
    intro: 'By creating an account or using this platform you agree to these terms.',
    sections: [
      {
        id: 'accounts',
        title: 'Accounts',
        body: [
          'Provide accurate registration details and keep your login secure.',
          'You are responsible for activity under your account.',
          'We may suspend accounts that violate these terms or the law.',
        ],
      },
      {
        id: 'listings',
        title: 'Jobs & Profiles',
        body: [
          'Employers must post genuine roles with accurate details.',
          'Candidates must share truthful profile information.',
          'We may approve, reject or remove listings to keep the platform safe.',
        ],
      },
      {
        id: 'payments',
        title: 'Payments & Plans',
        body: [
          'Paid plans and add-ons are charged as described at checkout.',
          'Features depend on your active plan and admin billing settings.',
        ],
      },
      {
        id: 'liability',
        title: 'Liability',
        body: [
          'We provide a marketplace and do not guarantee hiring outcomes.',
          'To the extent allowed by law we are not liable for indirect losses.',
        ],
      },
    ],
    contactCardTitle: 'Questions About These Terms?',
    contactCardBody: 'Contact us from the Contact page for clarification.',
  },
  cookies: {
    heroTitle: 'Cookie Policy',
    heroSubtitle: 'How we use cookies and similar technologies on this site.',
    lastUpdated: '1 August 2026',
    intro: 'This policy explains the cookies and browser storage we use.',
    sections: [
      {
        id: 'essential',
        title: 'Essential Cookies',
        body: [
          'Required to keep you signed in and load core pages.',
          'The site cannot function correctly if these are blocked.',
        ],
      },
      {
        id: 'preferences',
        title: 'Preference Storage',
        body: ['We remember language, theme and similar choices in your browser.'],
      },
      {
        id: 'analytics',
        title: 'Analytics',
        body: [
          'We may use aggregated analytics to improve the site. We do not sell your data to advertisers.',
        ],
      },
      {
        id: 'manage',
        title: 'Managing Cookies',
        body: [
          'You can clear or block cookies from your browser settings.',
          'Blocking essential cookies may prevent login.',
        ],
      },
    ],
    contactCardTitle: 'Cookie Questions?',
    contactCardBody: 'Reach out via the Contact page for more detail.',
  },
};

/** Seed Hindi copy so the site works in HI before the admin runs AI translate. */
export const DEFAULT_LOCALE_HI = {
  contact: {
    email: 'support@vetjobs.com',
    phone: '+91 123 456 7890',
    address: 'मुंबई, महाराष्ट्र, भारत',
    workingHours: 'सोम - शनि, सुबह 9:00 - शाम 6:00',
    heroTitle: 'संपर्क करें',
    heroSubtitle: 'हम आपसे सुनना चाहेंगे। हमसे संपर्क करें।',
    formTitle: 'हमें संदेश भेजें',
    formSubmitLabel: 'संदेश भेजें',
  },
  about: {
    heroOverline: 'हमारे बारे में',
    heroTitle: 'वेटजॉब्स के बारे में',
    heroSubtitle: 'भारत का विश्वसनीय पशु चिकित्सा भर्ती प्लेटफ़ॉर्म',
    primaryCtaLabel: 'नौकरियाँ खोजें',
    primaryCtaPath: '/jobs',
    secondaryCtaLabel: 'संपर्क करें',
    secondaryCtaPath: '/contact',
    missionTitle: 'हमारा मिशन',
    missionBody: [
      'भारत भर में पशु चिकित्सा पेशेवरों और पशु स्वास्थ्य संगठनों के बीच सहज जुड़ाव बनाना। हम मानते हैं कि हर पालतू को सबसे अच्छी देखभाल मिलनी चाहिए — और इसकी शुरुआत योग्य व जुनूनी पेशेवरों से जुड़ने से होती है।',
      'हमारे प्लेटफ़ॉर्म के ज़रिए हम एक ऐसा समुदाय बना रहे हैं जहाँ प्रतिभा अवसर से मिलती है, और पूरे देश में पशु स्वास्थ्य की गुणवत्ता बेहतर होती है।',
    ],
    missionImageUrl:
      'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=600',
    storyTitle: 'हमारी कहानी',
    storyBody:
      'हमने एक साधारण लक्ष्य से शुरुआत की: पशु चिकित्सा पेशेवरों के लिए सही काम और क्लीनिकों के लिए भरोसेमंद लोग ढूँढना आसान बनाना।',
    stats: [
      { value: '10,000+', label: 'सक्रिय पेशेवर' },
      { value: '5,000+', label: 'नौकरियाँ पोस्ट' },
      { value: '2,000+', label: 'पार्टनर क्लीनिक' },
      { value: '98%', label: 'संतुष्टि दर' },
    ],
    valuesTitle: 'हम किन मूल्यों पर खड़े हैं',
    valuesSubtitle: 'ये मूल मूल्य वेटजॉब्स में हमारे हर काम का मार्गदर्शन करते हैं',
    values: [
      {
        id: 'trust',
        title: 'विश्वास और सत्यापन',
        description:
          'हर पेशेवर और नियोक्ता हमारी कठोर सत्यापन प्रक्रिया से गुज़रता है ताकि प्रामाणिकता सुनिश्चित रहे।',
        iconKey: 'Verified',
      },
      {
        id: 'speed',
        title: 'तेज़ और कुशल',
        description:
          'हमारी सरल प्रक्रिया सही पशु चिकित्सा पेशेवर ढूँढने या हायर करने में कम समय लेती है।',
        iconKey: 'Speed',
      },
      {
        id: 'pet-centric',
        title: 'पालतू-केंद्रित',
        description:
          'हम पालतू मालिकों को बेहतर देखभाल देने वालों से जोड़कर पशु स्वास्थ्य सुधारने के लिए समर्पित हैं।',
        iconKey: 'Pets',
      },
      {
        id: 'support',
        title: '24/7 सहायता',
        description: 'हमारी सहायता टीम आपके प्रश्नों और चिंताओं में हमेशा उपलब्ध है।',
        iconKey: 'Support',
      },
    ],
    journeyTitle: 'हमारी यात्रा',
    journeySubtitle: 'पशु चिकित्सा हायरिंग बदलने के हमारे मिशन के मुख्य पड़ाव',
    milestones: [
      {
        year: '2020',
        title: 'वेटजॉब्स की स्थापना',
        description: 'पशु चिकित्सा हायरिंग बदलने के मिशन से शुरुआत',
      },
      {
        year: '2021',
        title: '10,000 उपयोगकर्ता',
        description: '10,000 उपयोगकर्ताओं का पहला बड़ा मील का पत्थर',
      },
      {
        year: '2022',
        title: 'पैन-इंडिया लॉन्च',
        description: 'भारत के प्रमुख शहरों में विस्तार',
      },
      {
        year: '2023',
        title: 'मोबाइल ऐप लॉन्च',
        description: 'आसान पहुँच के लिए मोबाइल ऐप जारी किया',
      },
      {
        year: '2024',
        title: 'AI मैचिंग',
        description: 'AI-powered जॉब मैचिंग तकनीक शुरू की',
      },
    ],
    teamTitle: 'हमारी टीम से मिलें',
    teamSubtitle: 'वेटजॉब्स के पीछे वे लोग जो पशु चिकित्सा हायरिंग बदलने के लिए समर्पित हैं',
    team: [
      {
        name: 'डॉ. राहुल शर्मा',
        role: 'संस्थापक और सीईओ',
        image:
          'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200',
        experience: '15+ वर्ष',
      },
      {
        name: 'डॉ. प्रिया मेहता',
        role: 'चीफ वेटरनरी ऑफिसर',
        image:
          'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200',
        experience: '12+ वर्ष',
      },
      {
        name: 'विक्रम सिंह',
        role: 'हेड ऑफ टेक्नोलॉजी',
        image:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
        experience: '10+ वर्ष',
      },
      {
        name: 'अनीता देसाई',
        role: 'ऑपरेशन्स लीड',
        image:
          'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
        experience: '8+ वर्ष',
      },
    ],
    ctaTitle: 'वेटजॉब्स परिवार से जुड़ने के लिए तैयार?',
    ctaSubtitle:
      'चाहे आप सपनों की नौकरी ढूँढ रहे पेशेवर हों या टैलेंट हायर करने वाले नियोक्ता — हम मदद के लिए यहाँ हैं।',
    ctaPrimaryLabel: 'शुरू करें',
    ctaPrimaryPath: '/signup',
    ctaSecondaryLabel: 'और जानें',
    ctaSecondaryPath: '/contact',
  },
  hero: {
    badge: 'भारत का #1 पशु चिकित्सा जॉब पोर्टल',
    headlinePrefix: 'अपने',
    headlineAccent: 'पशु चिकित्सा',
    headlineSuffix: 'करियर को आगे बढ़ाएँ',
    subtitle:
      'भारत भर में शीर्ष क्लीनिकों, कंपनियों और विशेष पशु चिकित्सा अवसरों से जुड़ें',
    searchKeywordPlaceholder: 'जॉब टाइटल, स्किल या कीवर्ड',
    searchLocationPlaceholder: 'स्थान',
    searchButtonLabel: 'खोजें',
    trustLine: 'सत्यापित नियोक्ता | उम्मीदवारों के लिए मुफ़्त | पूरे भारत में नौकरियाँ',
    hiringPrompt: 'क्या आप हायर कर रहे हैं?',
    hiringCtaLabel: 'जॉब पोस्ट करें',
    hiringCtaPath: '/employer/post-job',
    floatingBadge1Title: 'सत्यापित उम्मीदवार',
    floatingBadge1Subtitle: 'पहचान जाँची गई',
    floatingBadge2Title: '100% मुफ़्त',
    floatingBadge2Subtitle: 'नौकरी खोजने वालों के लिए',
  },
  jobProfiles: {
    title: 'जॉब प्रोफ़ाइल',
    subtitle: 'क्लीनिक, अस्पताल और पेट-केयर व्यवसायों में विशेष भूमिकाएँ देखें।',
    exploreLabel: 'नौकरियाँ देखें',
    items: [
      {
        id: 'veterinarian',
        title: 'पशु चिकित्सक',
        description: 'निदान, सर्जरी और व्यापक क्लिनिकल पेट केयर।',
        searchQuery: 'Veterinarian',
        color: '#0c5283',
        bgColor: 'rgba(12, 82, 131, 0.08)',
        iconKey: 'MedicalServices',
      },
      {
        id: 'veterinary-assistant',
        title: 'पशु चिकित्सा सहायक',
        description: 'क्लिनिकल केयर, उपचार और डायग्नोस्टिक्स में डॉक्टरों की सहायता।',
        searchQuery: 'Veterinary Assistant',
        color: '#0ab6a2',
        bgColor: 'rgba(10, 182, 162, 0.08)',
        iconKey: 'Healing',
      },
      {
        id: 'ward-boy',
        title: 'वार्ड बॉय',
        description: 'वार्ड प्रबंधन, पशु हैंडलिंग और सफ़ाई।',
        searchQuery: 'Ward Boy',
        color: '#7c3aed',
        bgColor: 'rgba(124, 58, 237, 0.08)',
        iconKey: 'Hotel',
      },
      {
        id: 'pet-trainer',
        title: 'पेट ट्रेनर',
        description: 'व्यवहार प्रशिक्षण, अनुशासन और एजिलिटी।',
        searchQuery: 'Pet Trainer',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.08)',
        iconKey: 'Pets',
      },
      {
        id: 'pet-groomer',
        title: 'पेट ग्रूमर',
        description: 'नहाना, स्टाइलिंग, कोट केयर और स्वच्छता।',
        searchQuery: 'Pet Groomer',
        color: '#ec4899',
        bgColor: 'rgba(236, 72, 153, 0.08)',
        iconKey: 'ContentCut',
      },
      {
        id: 'receptionist',
        title: 'रिसेप्शनिस्ट',
        description: 'फ्रंट डेस्क, अपॉइंटमेंट और क्लाइंट हैंडलिंग।',
        searchQuery: 'Receptionist',
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.08)',
        iconKey: 'SupportAgent',
      },
      {
        id: 'floor-manager',
        title: 'फ़्लोर मैनेजर',
        description: 'क्लीनिक संचालन, स्टाफ़ समन्वय और सेवा प्रवाह।',
        searchQuery: 'Floor Manager',
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.08)',
        iconKey: 'BusinessCenter',
      },
      {
        id: 'sales-manager',
        title: 'सेल्स मैनेजर',
        description: 'बिज़नेस डेवलपमेंट, क्लाइंट ग्रोथ और प्रोडक्ट सेल्स।',
        searchQuery: 'Sales Manager',
        color: '#8b5cf6',
        bgColor: 'rgba(139, 92, 246, 0.08)',
        iconKey: 'TrendingUp',
      },
      {
        id: 'inventory-incharge',
        title: 'इन्वेंटरी इंचार्ज',
        description: 'दवाइयाँ, सर्जिकल सप्लाई और पेट प्रोडक्ट स्टॉक।',
        searchQuery: 'Inventory Incharge',
        color: '#0284c7',
        bgColor: 'rgba(2, 132, 199, 0.08)',
        iconKey: 'Inventory',
      },
    ],
  },
  privacy: {
    heroTitle: 'गोपनीयता नीति',
    heroSubtitle: 'हम आपकी जानकारी कैसे एकत्र, उपयोग और सुरक्षित रखते हैं।',
    lastUpdated: '1 अगस्त 2026',
    intro:
      'यह नीति बताती है कि जब आप हमारे प्लेटफ़ॉर्म का उपयोग करते हैं तो आपकी जानकारी का क्या होता है।',
    sections: [
      {
        id: 'collect',
        title: 'हम कौन सी जानकारी एकत्र करते हैं',
        body: [
          'रजिस्ट्रेशन पर दिया गया नाम, ईमेल, फ़ोन और नियोक्ता के लिए कंपनी विवरण।',
          'प्रोफ़ाइल सामग्री जैसे शिक्षा, अनुभव, कौशल और फ़ोटो।',
          'ब्राउज़िंग, सेव और जॉब अप्लाई से जुड़ी उपयोग जानकारी।',
          'सुरक्षा के लिए ब्राउज़र, डिवाइस और IP जैसी तकनीकी जानकारी।',
        ],
      },
      {
        id: 'use',
        title: 'हम जानकारी का उपयोग कैसे करते हैं',
        body: [
          'आपका खाता बनाने और बनाए रखने के लिए।',
          'उम्मीदवार प्रोफ़ाइल नियोक्ताओं को दिखाने और जॉब पोस्ट प्रकाशित करने के लिए।',
          'लॉगिन OTP, जॉब अलर्ट और सूचनाएँ भेजने के लिए।',
          'मैचिंग सुधारने और धोखाधड़ी रोकने के लिए।',
        ],
      },
      {
        id: 'share',
        title: 'हम क्या साझा करते हैं',
        body: [
          'उम्मीदवार प्रोफ़ाइल सत्यापित नियोक्ताओं को दिखती हैं; संपर्क विवरण अनुमति पर खुलते हैं।',
          'नियोक्ता विवरण और नौकरियाँ स्वीकृति के बाद सार्वजनिक होती हैं।',
          'ईमेल, SMS और भुगतान प्रदाताओं को केवल आवश्यक जानकारी मिलती है।',
          'हम आपकी व्यक्तिगत जानकारी विज्ञापनदाताओं को नहीं बेचते।',
        ],
      },
      {
        id: 'cookies',
        title: 'कुकीज़ और लोकल स्टोरेज',
        body: [
          'साइन-इन और प्राथमिकताएँ याद रखने के लिए कुकीज़ का उपयोग होता है।',
          'आप ब्राउज़र से इन्हें साफ़ कर सकते हैं; लॉगिन के लिए आवश्यक कुकीज़ चाहिए।',
        ],
      },
      {
        id: 'rights',
        title: 'आपके अधिकार',
        body: [
          'आप अपनी प्रोफ़ाइल से जानकारी देख और अपडेट कर सकते हैं।',
          'आप डेटा की प्रति, सुधार या खाता हटाने का अनुरोध कर सकते हैं।',
          'आप प्लेटफ़ॉर्म एक्सेस खोए बिना जॉब अलर्ट बंद कर सकते हैं।',
        ],
      },
    ],
    contactCardTitle: 'अपने डेटा के बारे में प्रश्न?',
    contactCardBody: 'संपर्क पृष्ठ से हमें लिखें — हमारी टीम जवाब देगी।',
  },
  terms: {
    heroTitle: 'सेवा की शर्तें',
    heroSubtitle: 'प्लेटफ़ॉर्म उपयोग पर लागू नियम।',
    lastUpdated: '1 अगस्त 2026',
    intro: 'खाता बनाकर या इस प्लेटफ़ॉर्म का उपयोग करके आप इन शर्तों से सहमत होते हैं।',
    sections: [
      {
        id: 'accounts',
        title: 'खाते',
        body: [
          'सही रजिस्ट्रेशन विवरण दें और लॉगिन सुरक्षित रखें।',
          'आपके खाते की गतिविधि की ज़िम्मेदारी आपकी है।',
          'नियम या कानून तोड़ने पर खाता निलंबित हो सकता है।',
        ],
      },
      {
        id: 'listings',
        title: 'नौकरियाँ और प्रोफ़ाइल',
        body: [
          'नियोक्ता वास्तविक और सही जॉब विवरण पोस्ट करें।',
          'उम्मीदवार सही प्रोफ़ाइल जानकारी दें।',
          'सुरक्षा के लिए हम लिस्टिंग स्वीकार/अस्वीकार/हटा सकते हैं।',
        ],
      },
      {
        id: 'payments',
        title: 'भुगतान और प्लान',
        body: [
          'पेड प्लान और ऐड-ऑन चेकआउट के अनुसार चार्ज होते हैं।',
          'फ़ीचर आपके प्लान और एडमिन बिलिंग सेटिंग पर निर्भर करते हैं।',
        ],
      },
      {
        id: 'liability',
        title: 'दायित्व',
        body: [
          'हम एक मार्केटप्लेस हैं; हायरिंग परिणाम की गारंटी नहीं देते।',
          'कानून की सीमा में अप्रत्यक्ष नुकसान के लिए हम उत्तरदायी नहीं।',
        ],
      },
    ],
    contactCardTitle: 'इन शर्तों के बारे में प्रश्न?',
    contactCardBody: 'स्पष्टीकरण के लिए संपर्क पृष्ठ से हमें लिखें।',
  },
  cookies: {
    heroTitle: 'कुकी नीति',
    heroSubtitle: 'इस साइट पर कुकीज़ और समान तकनीकों का उपयोग।',
    lastUpdated: '1 अगस्त 2026',
    intro: 'यह नीति बताती है कि हम कुकीज़ और ब्राउज़र स्टोरेज कैसे उपयोग करते हैं।',
    sections: [
      {
        id: 'essential',
        title: 'आवश्यक कुकीज़',
        body: [
          'साइन-इन और मुख्य पेज लोड करने के लिए आवश्यक।',
          'इन्हें ब्लॉक करने पर साइट सही काम नहीं करेगी।',
        ],
      },
      {
        id: 'preferences',
        title: 'वरीयता स्टोरेज',
        body: ['हम भाषा, थीम जैसी पसंद ब्राउज़र में याद रखते हैं।'],
      },
      {
        id: 'analytics',
        title: 'एनालिटिक्स',
        body: [
          'साइट सुधार के लिए समेकित एनालिटिक्स हो सकती है। हम डेटा विज्ञापनदाताओं को नहीं बेचते।',
        ],
      },
      {
        id: 'manage',
        title: 'कुकीज़ प्रबंधित करना',
        body: [
          'आप ब्राउज़र सेटिंग से कुकीज़ साफ़ या ब्लॉक कर सकते हैं।',
          'आवश्यक कुकीज़ ब्लॉक करने पर लॉगिन रुक सकता है।',
        ],
      },
    ],
    contactCardTitle: 'कुकी से जुड़े प्रश्न?',
    contactCardBody: 'अधिक जानकारी के लिए संपर्क पृष्ठ पर लिखें।',
  },
};

export const LOCALE_SECTION_KEYS = [
  'contact',
  'about',
  'hero',
  'jobProfiles',
  'privacy',
  'terms',
  'cookies',
];

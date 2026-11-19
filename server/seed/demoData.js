const DEMO_PASSWORD = 'Password123!';

const demoProfile = {
  name: 'Alex Morgan',
  email: 'demo@cofoundr.ai',
  category: 'Developer',
  location: 'San Francisco, USA',
  bio: 'Full-stack engineer turned product builder. I love turning messy ideas into working software and have shipped two side projects end to end. Looking for a commercial partner who enjoys talking to customers as much as I enjoy shipping.',
  skills: {
    technical: ['React.js', 'Node.js', 'MongoDB', 'Python', 'JavaScript'],
    business: ['Product Management'],
  },
  interests: ['AI', 'SaaS', 'FinTech'],
  preferences: ['Looking for a co-founder', 'Looking for a business teammate'],
  availability: 'Full-time',
  experienceLevel: 'Advanced',
  startupGoals: {
    startupType: 'AI-powered SaaS tools for early-stage founders',
    problems:
      'Early-stage founders waste weeks validating ideas and assembling the wrong team instead of talking to customers and shipping.',
    cofounderQualities:
      'Commercially minded, comfortable with ambiguity, strong customer empathy, and willing to have direct conversations about equity and expectations.',
    longTermVision:
      'Build the operating system for first-time founders, from idea validation through the first ten hires.',
  },
  workingPreferences: { workStyle: 'Remote', riskTolerance: 'Balanced' },
  socialLinks: {
    linkedin: 'https://linkedin.com/in/alexmorgan-demo',
    github: 'https://github.com/alexmorgan-demo',
    portfolio: 'https://alexmorgan.dev',
  },
};

const founders = [
  {
    name: 'Sofia Martinez',
    email: 'sofia@cofoundr.ai',
    category: 'Marketing Professional',
    location: 'Madrid, Spain',
    bio: 'Growth marketer who has taken two B2B products from zero to 10k users. I care about positioning, customer research, and building a brand people actually remember. Looking for a technical partner to build with.',
    skills: {
      technical: ['UI/UX'],
      business: ['Marketing', 'SEO', 'Content Writing', 'Sales'],
    },
    interests: ['E-commerce', 'AI', 'FinTech'],
    preferences: ['Looking for a technical teammate'],
    availability: 'Part-time',
    experienceLevel: 'Intermediate',
    startupGoals: {
      startupType: 'Consumer FinTech and commerce platform',
      problems:
        'Independent sellers lack affordable marketing and payments tools, so they lose customers to larger brands.',
      cofounderQualities:
        'A co-founder who can ship product fast, values customer research, and communicates openly about priorities.',
      longTermVision:
        'Help a million small sellers grow with simple financial and marketing tools.',
    },
    workingPreferences: { workStyle: 'Remote', riskTolerance: 'Balanced' },
    socialLinks: { linkedin: 'https://linkedin.com/in/sofia-martinez', portfolio: 'https://sofiamartinez.co' },
  },
  {
    name: 'Daniel Kim',
    email: 'daniel@cofoundr.ai',
    category: 'Designer',
    location: 'Seoul, South Korea',
    bio: 'Product designer focused on healthcare and accessibility. I prototype in code when needed and believe the best products are designed with real users, not for them.',
    skills: { technical: ['UI/UX', 'JavaScript'], business: ['Product Management'] },
    interests: ['HealthTech', 'AI', 'SaaS'],
    preferences: ['Looking for a co-founder', 'Looking for a technical teammate'],
    availability: 'Flexible',
    experienceLevel: 'Advanced',
    startupGoals: {
      startupType: 'HealthTech product for preventive care',
      problems:
        'People cannot easily understand or act on their own health data between appointments.',
      cofounderQualities:
        'A technical partner who cares deeply about accessibility, privacy, and clinical evidence.',
      longTermVision: 'Make preventive healthcare feel simple, trustworthy, and human.',
    },
    workingPreferences: { workStyle: 'Hybrid', riskTolerance: 'Balanced' },
    socialLinks: { linkedin: 'https://linkedin.com/in/danielkim-design', portfolio: 'https://danielkim.design' },
  },
  {
    name: 'Priya Sharma',
    email: 'priya@cofoundr.ai',
    category: 'Entrepreneur',
    location: 'Mumbai, India',
    bio: 'Second-time founder with a finance background. I have run operations, raised a small pre-seed round, and sold to enterprise customers. I am looking for a technical partner who wants to own the product.',
    skills: {
      technical: [],
      business: ['Business Development', 'Sales', 'Finance', 'Product Management'],
    },
    interests: ['FinTech', 'Social Impact', 'SaaS'],
    preferences: ['Looking for a technical teammate', 'Looking for a co-founder'],
    availability: 'Full-time',
    experienceLevel: 'Expert',
    startupGoals: {
      startupType: 'FinTech platform for underserved communities',
      problems:
        'Access to fair credit and financial planning is limited for millions of people without formal credit histories.',
      cofounderQualities:
        'A technical co-founder with fintech or security experience who enjoys working closely with regulators and customers.',
      longTermVision:
        'Build trusted financial infrastructure for the next billion users.',
    },
    workingPreferences: { workStyle: 'Hybrid', riskTolerance: 'Bold' },
    socialLinks: { linkedin: 'https://linkedin.com/in/priyasharma-fintech' },
  },
  {
    name: 'Lucas Oliveira',
    email: 'lucas@cofoundr.ai',
    category: 'Developer',
    location: 'São Paulo, Brazil',
    bio: 'Machine learning engineer with a research background in medical imaging. I have built models that made it to clinical pilots and now want to turn that work into a product.',
    skills: { technical: ['Python', 'AI/ML', 'Data Science'], business: [] },
    interests: ['AI', 'Robotics', 'HealthTech'],
    preferences: ['Looking for a business teammate'],
    availability: 'Full-time',
    experienceLevel: 'Intermediate',
    startupGoals: {
      startupType: 'AI platform for diagnostics and research',
      problems:
        'Healthcare data is siloed and slow to analyze, delaying diagnoses and wasting clinician time.',
      cofounderQualities:
        'A business partner who can navigate healthcare partnerships and translate clinical needs into product decisions.',
      longTermVision: 'Bring reliable AI assistance to every clinic, starting with underserved regions.',
    },
    workingPreferences: { workStyle: 'Remote', riskTolerance: 'Conservative' },
    socialLinks: { github: 'https://github.com/lucasoliveira-ml' },
  },
  {
    name: 'Amara Okafor',
    email: 'amara@cofoundr.ai',
    category: 'Student',
    location: 'Lagos, Nigeria',
    bio: 'Computer science student building my first startup. I write code, run a campus tech community, and am learning growth by doing. I am looking for a co-founder who can complement my technical side.',
    skills: { technical: ['Python', 'JavaScript'], business: ['Content Writing', 'Marketing'] },
    interests: ['EdTech', 'Social Impact', 'AI'],
    preferences: ['Looking for a co-founder', 'Looking for a project collaborator'],
    availability: 'Weekends',
    experienceLevel: 'Beginner',
    startupGoals: {
      startupType: 'EdTech learning platform for students',
      problems: 'Students lack personalized career guidance and access to real-world mentors.',
      cofounderQualities:
        'Someone who is patient, mission-driven, and willing to test ideas with students every week.',
      longTermVision: 'Make world-class mentorship accessible to every student.',
    },
    workingPreferences: { workStyle: 'Remote', riskTolerance: 'Balanced' },
    socialLinks: { github: 'https://github.com/amaraokafor' },
  },
  {
    name: 'Noah Williams',
    email: 'noah@cofoundr.ai',
    category: 'Business Professional',
    location: 'New York, USA',
    bio: 'Former investment analyst and finance operator. I have built forecasting models for companies from seed to Series C and want to productize the workflows I know inside out.',
    skills: { technical: [], business: ['Finance', 'Business Development', 'Sales'] },
    interests: ['FinTech', 'SaaS', 'E-commerce'],
    preferences: ['Looking for a technical teammate'],
    availability: 'Full-time',
    experienceLevel: 'Expert',
    startupGoals: {
      startupType: 'SaaS for financial operations',
      problems:
        'Finance teams waste hundreds of hours reconciling fragmented data across spreadsheets and tools.',
      cofounderQualities:
        'A product-minded engineer who enjoys complex workflows and can ship reliably.',
      longTermVision:
        'Become the default finance operating system for mid-market companies.',
    },
    workingPreferences: { workStyle: 'Hybrid', riskTolerance: 'Bold' },
    socialLinks: { linkedin: 'https://linkedin.com/in/noahwilliams-finance' },
  },
  {
    name: 'Emma Johansson',
    email: 'emma@cofoundr.ai',
    category: 'Developer',
    location: 'Stockholm, Sweden',
    bio: 'Backend developer and indie game modder. I like systems that scale and communities that create their own content. Looking for collaborators for a creator-focused gaming project.',
    skills: { technical: ['Java', 'JavaScript', 'MongoDB', 'Node.js'], business: [] },
    interests: ['Gaming', 'SaaS', 'AI'],
    preferences: ['Looking for a project collaborator', 'Looking for a business teammate'],
    availability: 'Part-time',
    experienceLevel: 'Advanced',
    startupGoals: {
      startupType: 'Gaming and creator economy platform',
      problems:
        'Indie game studios struggle to find players, funding, and sustainable monetization.',
      cofounderQualities:
        'A business partner who understands creator communities and can build partnerships without losing the product soul.',
      longTermVision: 'Build the home for independent game creators.',
    },
    workingPreferences: { workStyle: 'Remote', riskTolerance: 'Balanced' },
    socialLinks: { github: 'https://github.com/emmajohansson-dev' },
  },
  {
    name: 'Rohan Patel',
    email: 'rohan@cofoundr.ai',
    category: 'Developer',
    location: 'Toronto, Canada',
    bio: 'Frontend engineer with a design habit. I have built dashboards for education companies and care about making complex tools feel calm. I want to work with someone close to the customer.',
    skills: { technical: ['React.js', 'JavaScript', 'UI/UX'], business: ['Marketing'] },
    interests: ['SaaS', 'EdTech', 'AI'],
    preferences: ['Looking for a business teammate', 'Looking for a co-founder'],
    availability: 'Flexible',
    experienceLevel: 'Intermediate',
    startupGoals: {
      startupType: 'SaaS tools for education teams',
      problems: 'Teachers spend too much time on admin instead of students.',
      cofounderQualities:
        'A business partner who can get schools to say yes and give us honest feedback.',
      longTermVision: 'Give every teacher an extra hour back each day.',
    },
    workingPreferences: { workStyle: 'Hybrid', riskTolerance: 'Balanced' },
    socialLinks: { github: 'https://github.com/rohanpatel-dev', portfolio: 'https://rohanpatel.dev' },
  },
  {
    name: 'Mei Chen',
    email: 'mei@cofoundr.ai',
    category: 'Marketing Professional',
    location: 'Singapore',
    bio: 'Brand and growth lead for consumer startups across Southeast Asia. I have launched products in five markets and love the messy early stage. Seeking a technical co-founder for a commerce idea.',
    skills: {
      technical: ['UI/UX'],
      business: ['Marketing', 'SEO', 'Business Development', 'Content Writing'],
    },
    interests: ['E-commerce', 'FinTech', 'Social Impact'],
    preferences: ['Looking for a co-founder'],
    availability: 'Full-time',
    experienceLevel: 'Advanced',
    startupGoals: {
      startupType: 'E-commerce growth platform for small brands',
      problems:
        'Small brands cannot afford the marketing and analytics tools that large retailers use.',
      cofounderQualities:
        'A technical co-founder who can build fast, experiment, and respect brand and design.',
      longTermVision: 'Help emerging brands compete globally.',
    },
    workingPreferences: { workStyle: 'Remote', riskTolerance: 'Conservative' },
    socialLinks: { linkedin: 'https://linkedin.com/in/meichen-growth' },
  },
  {
    name: 'Diego Alvarez',
    email: 'diego@cofoundr.ai',
    category: 'Entrepreneur',
    location: 'Mexico City, Mexico',
    bio: 'I ran a clinic operations company for six years before deciding to build software for the people I used to serve. Strong on sales and operations, looking for a product and engineering partner.',
    skills: { technical: [], business: ['Sales', 'Marketing', 'Product Management'] },
    interests: ['HealthTech', 'EdTech', 'SaaS'],
    preferences: ['Looking for a technical teammate'],
    availability: 'Part-time',
    experienceLevel: 'Intermediate',
    startupGoals: {
      startupType: 'HealthTech and EdTech platform for clinics',
      problems: 'Clinics and training programs are disconnected, so knowledge and patient context get lost.',
      cofounderQualities:
        'A technical partner who can turn messy operational requirements into a simple product.',
      longTermVision: 'Connect learning and care in one platform across Latin America.',
    },
    workingPreferences: { workStyle: 'Hybrid', riskTolerance: 'Balanced' },
    socialLinks: { linkedin: 'https://linkedin.com/in/diegoalvarez-health' },
  },
  {
    name: 'Zara Ahmed',
    email: 'zara@cofoundr.ai',
    category: 'Designer',
    location: 'Dubai, UAE',
    bio: 'Design lead for mission-driven products. I have shipped accessible interfaces for health and education nonprofits and want to build a company where design is a first-class advantage.',
    skills: { technical: ['UI/UX'], business: ['Content Writing', 'Marketing'] },
    interests: ['Social Impact', 'HealthTech', 'SaaS'],
    preferences: ['Looking for a co-founder', 'Looking for a technical teammate'],
    availability: 'Flexible',
    experienceLevel: 'Advanced',
    startupGoals: {
      startupType: 'Design-led SaaS for social impact teams',
      problems: 'Mission-driven teams have great ideas but poor digital products and limited budgets.',
      cofounderQualities:
        'A technical partner who values design, accessibility, and sustainable business models.',
      longTermVision: 'Prove that social impact products can be beautifully designed and financially sustainable.',
    },
    workingPreferences: { workStyle: 'Remote', riskTolerance: 'Balanced' },
    socialLinks: { portfolio: 'https://zaraahmed.design', linkedin: 'https://linkedin.com/in/zaraahmed-design' },
  },
];

const startups = [
  {
    founderEmail: 'demo@cofoundr.ai',
    title: 'Nexa',
    description:
      'Nexa is an AI copilot for first-time founders. It turns a rough idea into a structured validation plan, identifies the highest-risk assumptions, and suggests the right people to talk to next.',
    problem:
      'First-time founders spend months building the wrong thing because they lack a repeatable process for validating ideas and assembling a team.',
    solution:
      'A guided workspace that combines AI research, customer interview tracking, and team gap analysis in one place.',
    industry: 'AI',
    requiredSkills: ['Marketing', 'SEO', 'Finance', 'React.js'],
    requiredRoles: ['Marketer', 'Business / Sales'],
    projectStage: 'MVP',
    teamSize: 2,
  },
  {
    founderEmail: 'daniel@cofoundr.ai',
    title: 'MediSync',
    description:
      'MediSync helps small clinics turn scattered patient data into a clear preventive care plan. Clinicians get a simple timeline and patients get plain-language next steps.',
    problem:
      'Preventive care is buried in disconnected records, so both clinicians and patients miss the moments that matter.',
    solution:
      'A privacy-first platform that connects records, highlights risk factors, and creates patient-friendly care plans.',
    industry: 'HealthTech',
    requiredSkills: ['AI/ML', 'Python', 'UI/UX', 'Data Science'],
    requiredRoles: ['Developer', 'Data / AI', 'Designer'],
    projectStage: 'Prototype',
    teamSize: 3,
  },
  {
    founderEmail: 'priya@cofoundr.ai',
    title: 'GreenLedger',
    description:
      'GreenLedger is a financial planning platform for community lenders and first-time borrowers. It makes credit decisions more transparent and helps people build a healthy financial identity.',
    problem:
      'Millions of people are excluded from fair credit because traditional scoring ignores their real financial behavior.',
    solution:
      'A consent-based financial profile and lending dashboard that helps community lenders serve underserved customers responsibly.',
    industry: 'FinTech',
    requiredSkills: ['Finance', 'Business Development', 'Python', 'MongoDB'],
    requiredRoles: ['Business / Sales', 'Developer', 'Data / AI'],
    projectStage: 'Idea',
    teamSize: 2,
  },
  {
    founderEmail: 'amara@cofoundr.ai',
    title: 'SkillBridge',
    description:
      'SkillBridge connects university students with alumni mentors through short, structured projects. Students get real experience, mentors get fresh talent, and universities get better outcomes.',
    problem:
      'Students graduate without practical experience, while alumni want to help but do not know where to start.',
    solution:
      'A lightweight project marketplace with guided milestones, feedback templates, and a mentor matching engine.',
    industry: 'EdTech',
    requiredSkills: ['Marketing', 'Content Writing', 'React.js', 'Node.js'],
    requiredRoles: ['Marketer', 'Developer'],
    projectStage: 'Prototype',
    teamSize: 2,
  },
];

module.exports = { DEMO_PASSWORD, demoProfile, founders, startups };

type AlumniSector =
  | "AI / ML"
  | "Payments"
  | "Deep Tech"
  | "Creator Economy"
  | "Finance"
  | "Enterprise";

export interface AlumniMember {
  name: string;
  nickname: string;
  company: string;
  description: string;
  sector: AlumniSector;
  fundingAmount?: string;
  fundingType?: string;
  role?: string;
  featured?: boolean;
  featuredQuote?: string;
  featuredProof?: string;
  backedBy?: string;
  storyType?: string;
  mentorStack?: boolean;
  mentorRole?: string;
  mentorDescription?: string;
}

export interface EventFormat {
  name: string;
  frequency: string;
  description: string;
  media: string;
  poster?: string;
}

export interface ProgramPartner {
  name: string;
}

export const filterPills = [
  { label: "All", predicate: (_m: AlumniMember) => true },
  { label: "AI / ML", predicate: (m: AlumniMember) => m.sector === "AI / ML" },
  { label: "Payments", predicate: (m: AlumniMember) => m.sector === "Payments" },
  { label: "Deep Tech", predicate: (m: AlumniMember) => m.sector === "Deep Tech" },
  { label: "Creator Economy", predicate: (m: AlumniMember) => m.sector === "Creator Economy" },
  { label: "Enterprise", predicate: (m: AlumniMember) => m.sector === "Enterprise" },
  { label: "Finance", predicate: (m: AlumniMember) => m.sector === "Finance" },
  { label: "Fund Managers", predicate: (m: AlumniMember) => m.mentorStack === true },
  { label: "Funded", predicate: (m: AlumniMember) => !!m.fundingAmount },
];

interface AlumniPageData {
  stats: { raised: string; eventsHosted: string; buildersHosted: string };
  curated: AlumniMember[];
  events: EventFormat[];
  partners: ProgramPartner[];
  cta: {
    title: string;
    subtitle: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
}

const MEDIA = process.env.MEDIA_BASE_URL;

const alumniPageData: AlumniPageData = {
  stats: {
    raised: "$5M+",
    eventsHosted: "450+",
    buildersHosted: "2,700+",
  },
  curated: [
    {
      name: "Shubham Kukreti",
      nickname: "shubham",
      company: "Prava",
      description: "Payments infrastructure for AI agents. Met co-founder at Zo House.",
      sector: "Payments",
      fundingType: "WTFund",
      backedBy: "WTFund Cohort 3",
      storyType: "Company formation",
      featured: true,
      featuredQuote: "I met my co-founder at Zo House. Three months later, we were in WTFund.",
      featuredProof: "Co-founder match",
    },
    {
      name: "Tejas Arun",
      nickname: "tejas",
      company: "Endl",
      description: "Cross-border payments infrastructure for businesses.",
      sector: "Payments",
      fundingAmount: "$1.5M Pre-seed",
      fundingType: "Pre-seed",
      role: "CTO",
      featured: true,
      featuredQuote: "Endl simplifies multi-currency movement. The density at Zo House accelerated everything.",
      featuredProof: "Largest disclosed raise",
      backedBy: "Iterative",
      storyType: "Capital raised",
    },
    {
      name: "Dibyo Majumder",
      nickname: "dibyo",
      company: "TURF Network",
      description: "Intent-driven data orchestration for AI agents. HBS alum, 3x founder.",
      sector: "AI / ML",
      fundingAmount: "$1M+ (Instaraise)",
      fundingType: "Seed",
      role: "Founder",
      featured: true,
      featuredQuote: "Building serious AI infrastructure requires the right environment. Zo House is that environment.",
      featuredProof: "Serial founder credibility",
      storyType: "Capital raised",
    },
    {
      name: "Kush Ratna Gupta",
      nickname: "kush",
      company: "Komet / Kometverse",
      description: "Deal-intelligence layer for autonomous CRM.",
      sector: "Enterprise",
      fundingAmount: "$1M",
      fundingType: "Seed",
      role: "Founder",
      storyType: "Capital raised",
    },
    {
      name: "Roshan Vadassery",
      nickname: "roshan",
      company: "Permissionless",
      description: "Open public infrastructure. Raised $250K in community backing in 48 hours.",
      sector: "Deep Tech",
      fundingAmount: "$250K",
      fundingType: "Community",
      role: "Founder",
      storyType: "Capital raised",
    },
    {
      name: "Fiona Bao",
      nickname: "fiona",
      company: "GENPULSE / Lushair",
      description: "Forbes-listed founder. $8M post-money pre-seed milestone.",
      sector: "Enterprise",
      fundingAmount: "$300K Seed",
      fundingType: "Seed",
      role: "Founder",
      storyType: "Capital raised",
    },
    {
      name: "Akash Chaudhary",
      nickname: "akash",
      company: "Fancall",
      description: "Creator-fan 1:1 video call platform. 1,000+ creators. Bootstrapped.",
      sector: "Creator Economy",
      role: "Founder",
      storyType: "Bootstrapped",
    },
    {
      name: "Saumya Saxena",
      nickname: "saumya",
      company: "Purple Pay",
      description: "Payments platform. Polygon-backed, ETHIndia 2022 winner.",
      sector: "Payments",
      backedBy: "Polygon",
      storyType: "Capital raised",
    },
    {
      name: "Anoushk Kharangate",
      nickname: "anoushk",
      company: "Tinydancer",
      description: "Light client infrastructure for Solana.",
      sector: "Deep Tech",
      backedBy: "Solana Foundation, Cubik, DoraHacks",
      storyType: "Capital raised",
    },
    {
      name: "Venkat Kunisetty",
      nickname: "venkat",
      company: "STRKFarm",
      description: "DeFi yield optimization. $7M+ TVL.",
      sector: "Finance",
      role: "Founder",
      storyType: "Capital raised",
    },
    {
      name: "Mrigank Bhargava",
      nickname: "mrigank",
      company: "Eddy Finance",
      description: "$105M+ trading volume. Cross-chain DeFi.",
      sector: "Finance",
      role: "Co-founder",
      storyType: "Capital raised",
    },
    {
      name: "Rishabh Keshan",
      nickname: "rishabh",
      company: "Fuel Labs",
      description: "Modular execution layer. $81.5M raised.",
      sector: "Deep Tech",
      role: "Member",
    },
    {
      name: "Gathin",
      nickname: "gathin",
      company: "0G Labs",
      description: "Modular AI blockchain. $75M raised.",
      sector: "AI / ML",
      role: "Member",
    },
    {
      name: "Sukriti Taneja",
      nickname: "sukriti",
      company: "Initia",
      description: "Interwoven rollup network. $21.5M raised.",
      sector: "Deep Tech",
      role: "Member",
    },
    {
      name: "Aadith Narayanan",
      nickname: "aadith",
      company: "Router Protocol",
      description: "Cross-chain infrastructure. $4.59M raised.",
      sector: "Deep Tech",
      role: "Member",
    },
    {
      name: "Mohit Sorout",
      nickname: "mohit",
      company: "Bitazu Capital",
      description: "Founding Partner. Crypto fund manager with deep market infrastructure experience.",
      sector: "Finance",
      mentorStack: true,
      mentorRole: "Bitazu Capital",
      mentorDescription: "Founding Partner. Crypto fund manager with deep market infrastructure experience.",
    },
    {
      name: "Ali Azar",
      nickname: "ali",
      company: "Magnus Hathaway",
      description: "Founder & CIO. Institutional fund management across traditional and emerging markets.",
      sector: "Finance",
      mentorStack: true,
      mentorRole: "Magnus Hathaway",
      mentorDescription: "Founder & CIO. Institutional fund management across traditional and emerging markets.",
    },
    {
      name: "Abhay Tandon",
      nickname: "abhay",
      company: "3to1 Capital",
      description: "Co-founder & GP. Active deal flow, early-stage portfolio across sectors.",
      sector: "Finance",
      mentorStack: true,
      mentorRole: "3to1 Capital",
      mentorDescription: "Co-founder & GP. Active deal flow, early-stage portfolio across sectors.",
    },
    {
      name: "Ajeet Khurana",
      nickname: "ajeet",
      company: "Reflexical",
      description: "Founder. Angel investor — backed Tablesprint ($1M round).",
      sector: "Finance",
      mentorStack: true,
      mentorRole: "Reflexical",
      mentorDescription: "Founder. Angel investor — backed Tablesprint ($1M round). Deep startup ecosystem operator.",
    },
  ],
  events: [
    {
      name: "Founder Dinners",
      frequency: "Monthly · Rooftop",
      description: "Curated 20-person dinners. No pitching, no networking theater. Real conversation between operators.",
      media: `${MEDIA}/gallery/media/videos/36d8c488-738b-42db-91cb-d72c8fd66f94_20241206054520.mp4`,
    },
    {
      name: "AI Build Sprints",
      frequency: "Partner-led · 2-4 weeks",
      description: "Intensive build programs with AI Grants India. Ship or go home.",
      media: `${MEDIA}/gallery/media/videos/36d8c488-738b-42db-91cb-d72c8fd66f94_20241206054520.mp4`,
    },
    {
      name: "The Residency",
      frequency: "Cohort · 8-12 weeks",
      description: "Structured founder residency. 2 cohorts completed. Demo day graduates building companies.",
      media: `${MEDIA}/gallery/media/videos/36d8c488-738b-42db-91cb-d72c8fd66f94_20241206054520.mp4`,
    },
    {
      name: "Demo Days",
      frequency: "End of program",
      description: "Founders present to investors, partners, and the community. Warm intros happen that night.",
      media: `${MEDIA}/gallery/media/videos/36d8c488-738b-42db-91cb-d72c8fd66f94_20241206054520.mp4`,
    },
    {
      name: "Garage BLR",
      frequency: "Stellar × RiseIn · Apr 2026",
      description: "Builder residency by Stellar Development Foundation. Next generation of on-chain infrastructure builders.",
      media: `${MEDIA}/gallery/media/videos/36d8c488-738b-42db-91cb-d72c8fd66f94_20241206054520.mp4`,
    },
  ],
  partners: [
    { name: "The Residency" },
    { name: "AI Grants India" },
    { name: "Stellar" },
    { name: "RiseIn" },
  ],
  cta: {
    title: "Join the Movement",
    subtitle: "This is where India's next wave of builders lives, ships, and finds each other. The house is always on. The network keeps compounding. Your seat is open.",
    primaryCta: { label: "Explore Zo House →", href: "/house" },
    secondaryCta: { label: "Enter Dashboard", href: "/dashboard" },
  },
};

export default alumniPageData;

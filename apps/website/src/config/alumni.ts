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
  /** Citizenship avatar URL (same as dashboard passport pfp) */
  pfp?: string;
  /** Real photo of the founder (uploaded to CDN) */
  photo?: string;
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
  { label: "Mentor Stack", predicate: (m: AlumniMember) => m.mentorStack === true },
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
      pfp: "https://proxy.cdn.zo.xyz/citizenship/images/2ae9540b-b671-4d40-8519-49416f201f38.svg",
      photo: "https://proxy.cdn.zo.xyz/gallery/media/images/7c56bd50-c4a4-452c-97b8-d7bbae0313ea_20260405101157.png",
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
      pfp: "https://proxy.cdn.zo.xyz/citizenship/images/bc7118f4-ecd4-4f74-afd4-48394d8576a1.svg",
      photo: "https://proxy.cdn.zo.xyz/gallery/media/images/16efd133-7210-47cc-9215-d06d5e681272_20260405101200.png",
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
      pfp: "https://proxy.cdn.zo.xyz/citizenship/images/734f5e3e-d6c6-4a26-a781-151ad1312959_g1373KC.svg",
      photo: "https://proxy.cdn.zo.xyz/gallery/media/images/c1a7b13e-adfd-4db2-9b21-a1d79cacd1bf_20260405101201.png",
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
      pfp: "https://proxy.cdn.zo.xyz/citizenship/images/01c5a350-d4d2-4558-b81b-c370d684981f.svg",
      photo: "https://proxy.cdn.zo.xyz/gallery/media/images/c0c15d54-65d6-4d09-a6f5-ae543d825542_20260405101201.png",
      company: "Komet / Kometverse",
      description: "Deal-intelligence layer for autonomous CRM.",
      sector: "Enterprise",
      fundingAmount: "$1M",
      fundingType: "Seed",
      role: "Founder",
      storyType: "Capital raised",
      featured: true,
      featuredQuote: "The deal-intelligence layer for autonomous CRM started at Zo House. IIT Madras alumnus, now scaling from San Francisco.",
      featuredProof: "IIT Madras to SF",
    },
    {
      name: "Roshan Vadassery",
      nickname: "roshan",
      pfp: "https://proxy.cdn.zo.xyz/citizenship/images/2d1c3a67-7b10-47bb-8c45-8a5741503ef0.svg",
      photo: "https://proxy.cdn.zo.xyz/gallery/media/images/bde18556-8fc3-4cf9-b793-d3d4192cfeee_20260405101202.png",
      company: "Permissionless",
      description: "Open public infrastructure. Raised $250K in community backing in 48 hours.",
      sector: "Deep Tech",
      fundingAmount: "$250K",
      fundingType: "Community",
      role: "Founder",
      storyType: "Capital raised",
      featured: true,
      featuredQuote: "Raised $250K in community backing in 48 hours. Open public infrastructure, built from Zo House.",
      featuredProof: "Community-backed raise",
      mentorStack: true,
      mentorRole: "Permissionless",
      mentorDescription: "Founder. Raised $250K community-backed in 48 hours. Building open public infrastructure from the Zo House network.",
    },
    {
      name: "Fiona Bao",
      nickname: "fiona",
      pfp: "https://proxy.cdn.zo.xyz/citizenship/images/4c9f3100-61e7-4cbc-ba8f-52c550cb9ea2.svg",
      photo: "https://proxy.cdn.zo.xyz/gallery/media/images/949d721b-ad1d-420f-9f43-bfc030b8ccd8_20260405101203.png",
      company: "GENPULSE / Lushair",
      description: "Forbes-listed founder. $8M post-money pre-seed milestone.",
      sector: "Enterprise",
      fundingAmount: "$300K Seed",
      fundingType: "Seed",
      role: "Founder",
      storyType: "Capital raised",
      featured: true,
      featuredQuote: "Forbes-listed founder. Closed at $8M post-money valuation. Became a creative mentor for artists inside the community.",
      featuredProof: "$8M post-money valuation",
    },
    {
      name: "Akash Chaudhary",
      nickname: "akash",
      pfp: "https://proxy.cdn.zo.xyz/citizenship/images/5c584cef-621c-4c41-b93e-3e3675a57b43.svg",
      photo: "https://proxy.cdn.zo.xyz/gallery/media/images/ea13d805-42fd-4c9c-bf47-1abfb4ae343e_20260405101204.png",
      company: "Fancall",
      description: "Creator-fan 1:1 video call platform. 1,000+ creators. Bootstrapped.",
      sector: "Creator Economy",
      role: "Founder",
      storyType: "Bootstrapped",
      featured: true,
      featuredQuote: "1,000+ creators on the platform. The talent, knowledge exchange, and the environment keeps pushing me to ship.",
      featuredProof: "Bootstrapped to 1K creators",
    },
    {
      name: "Saumya Saxena",
      nickname: "saumya",
      pfp: "https://proxy.cdn.zo.xyz/citizenship/images/a0428364-9178-4279-b2ed-8f414932cfa7.svg",
      company: "Purple Pay",
      description: "Payments platform. Polygon-backed, ETHIndia 2022 winner.",
      sector: "Payments",
      backedBy: "Polygon",
      storyType: "Capital raised",
    },
    {
      name: "Anoushk Kharangate",
      nickname: "anoushk",
      pfp: "https://proxy.cdn.zo.xyz/citizenship/images/138ca966-6ade-44fa-98d7-674d77a45f94.svg",
      company: "Tinydancer",
      description: "Light client infrastructure for Solana.",
      sector: "Deep Tech",
      backedBy: "Solana Foundation, Cubik, DoraHacks",
      storyType: "Capital raised",
    },
    {
      name: "Venkat Kunisetty",
      nickname: "venkat",
      pfp: "https://proxy.cdn.zo.xyz/citizenship/images/bc1c9536-8df9-4358-9c36-edb348530508.svg",
      company: "STRKFarm",
      description: "DeFi yield optimization. $7M+ TVL.",
      sector: "Finance",
      role: "Founder",
      storyType: "Capital raised",
    },
    {
      name: "Mrigank Bhargava",
      nickname: "mrigank",
      pfp: "https://proxy.cdn.zo.xyz/citizenship/images/7f9de2ca-824c-469f-a5d6-0443c620ce43.svg",
      company: "Eddy Finance",
      description: "$105M+ trading volume. Cross-chain DeFi.",
      sector: "Finance",
      role: "Co-founder",
      storyType: "Capital raised",
    },
    {
      name: "Rishabh Keshan",
      nickname: "rishabh",
      pfp: "https://proxy.cdn.zo.xyz/citizenship/images/fc4e303d-9e26-49d8-be9d-870d6fff496f.svg",
      company: "Fuel Labs",
      description: "Modular execution layer. $81.5M raised.",
      sector: "Deep Tech",
      role: "Member",
    },
    {
      name: "Gathin",
      nickname: "gathin",
      pfp: "https://proxy.cdn.zo.xyz/citizenship/images/518432cc-cf8e-43f8-880c-72138dc83660.svg",
      company: "0G Labs",
      description: "Modular AI blockchain. $75M raised.",
      sector: "AI / ML",
      role: "Member",
    },
    {
      name: "Sukriti Taneja",
      nickname: "sukriti",
      pfp: "https://proxy.cdn.zo.xyz/citizenship/images/94d0fb6e-4a6c-4646-8882-40633e190463_xEbQ6t1.svg",
      company: "Initia",
      description: "Interwoven rollup network. $21.5M raised.",
      sector: "Deep Tech",
      role: "Member",
    },
    {
      name: "Aadith Narayanan",
      nickname: "aadith",
      pfp: "https://proxy.cdn.zo.xyz/citizenship/images/51154477-4d35-4a34-b810-5939a437991d.svg",
      company: "Router Protocol",
      description: "Cross-chain infrastructure. $4.59M raised.",
      sector: "Deep Tech",
      role: "Member",
    },
    {
      name: "Mohit Sorout",
      nickname: "mohit",
      pfp: "https://proxy.cdn.zo.xyz/citizenship/images/ce280622-9e84-41d4-b028-229fd843a167.svg",
      company: "Bitazu Capital",
      description: "Founding Partner. Featured in AP worldwide press. Predicted BTC $20K run 3 months early.",
      sector: "Finance",
      mentorStack: true,
      mentorRole: "Bitazu Capital · Founding Partner",
      mentorDescription: "Algorithmic crypto fund. Featured in Associated Press worldwide. Called the BTC move from $24K to $73K.",
    },
    {
      name: "Ali Azar",
      nickname: "ali",
      company: "Magnus Hathaway",
      description: "250K+ audience. SEBI registered analyst. Top 10 South India advisory. Chartered Accountant.",
      sector: "Finance",
      mentorStack: true,
      mentorRole: "Magnus Hathaway · Founder & CIO",
      mentorDescription: "250K+ audience across platforms. SEBI registered. Top 10 Most Promising Investment Advisory, South India. Stayed at BLRxZo.",
    },
    {
      name: "Abhay Tandon",
      nickname: "abhay",
      pfp: "https://proxy.cdn.zo.xyz/citizenship/images/3c16f360-e842-4b63-b1fe-7e02c9ebaa78.svg",
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
      pfp: "https://proxy.cdn.zo.xyz/citizenship/images/9e509c21-196b-4b7b-8bae-2097c126d683.svg",
      company: "Reflexical",
      description: "Ex-CEO ZebPay (India's largest crypto exchange, 3M+ users). Sold company to Intel. 28+ investments.",
      sector: "Finance",
      mentorStack: true,
      mentorRole: "Ex-CEO ZebPay · 28+ Investments",
      mentorDescription: "Ran India's largest crypto exchange. Sold a company to Intel. CEO of IIT Bombay incubator. 2 TEDx talks. Author translated into 17 languages.",
    },
    {
      name: "Dharamveer Singh Chouhan",
      nickname: "dharamveer",
      pfp: "https://proxy.cdn.zo.xyz/citizenship/images/dvcoolster.svg",
      company: "Zostel / Zo World",
      description: "Co-founder & Chairman, Zostel. IIT BHU + IIM Calcutta. Built a 5,000 Cr industry. Tiger Global backed.",
      sector: "Enterprise",
      mentorStack: true,
      mentorRole: "Co-founder & Chairman, Zostel",
      mentorDescription: "Built India's largest hostel chain (108+ properties). IIT BHU + IIM Calcutta. Tiger Global backed. Created the Zo World ecosystem.",
    },
    {
      name: "Lisa Ray",
      nickname: "lisaray",
      company: "TheUpsideSpace",
      description: "Actress (Oscar-nominated Water), author, cancer survivor. Co-founded TheUpsideSpace — NFT art platform.",
      sector: "Creator Economy",
      mentorStack: true,
      mentorRole: "Actress · Author · Founder, TheUpsideSpace",
      mentorDescription: "India's first supermodel. Starred in Oscar-nominated Water. Beat multiple myeloma. Co-founded TheUpsideSpace (NFT art marketplace for South Asian artists).",
    },
    {
      name: "Kartikey Sharma",
      nickname: "kartikey",
      company: "PaperPlane",
      description: "Two-time cancer survivor. Muralist for Netflix, JW Marriott, Hyundai. India's largest mural (24K sqft).",
      sector: "Creator Economy",
      mentorStack: true,
      mentorRole: "Founder, PaperPlane · India's Top Muralist",
      mentorDescription: "Two-time cancer survivor turned India's top muralist. Netflix, JW Marriott, Hyundai, CRED, Reliance. ET 35 under 35. TEDx speaker. Painted India's largest mural.",
    },
    {
      name: "Kratex",
      nickname: "kratex",
      company: "M-House Music",
      description: "Creator of M-House genre. First Marathi track on Spinnin' Records. 20M+ streams. KSHMR remix.",
      sector: "Creator Economy",
      mentorStack: true,
      mentorRole: "DJ/Producer · Creator of M-House",
      mentorDescription: "Globalising Marathi music. First Marathi song on Spinnin' Records (20M+ streams). KSHMR remix. Collab with Asha Bhosle. Vogue India, Rolling Stone India. 300K+ following.",
    },
    {
      name: "Shabbir YK",
      nickname: "shabbiryk",
      company: "Virtuals.io",
      description: "Kauffman Fellow. Research & Investments at Virtuals. Ex-CoinSwitch Ventures. 40+ projects backed.",
      sector: "Finance",
      mentorStack: true,
      mentorRole: "Kauffman Fellow · Virtuals.io",
      mentorDescription: "Kauffman Fellow. Ex-CoinSwitch Ventures ($10M fund). Al-Thani Family Office, NVIDIA, Square. 40+ projects backed. Blockchain faculty at Symbiosis.",
    },
  ],
  events: [
    {
      name: "Founder Dinners",
      frequency: "Monthly · Rooftop",
      description: "Curated 20-person dinners. No pitching, no networking theater. Real conversation between operators.",
      media: `${MEDIA}/gallery/media/videos/95daf79a-483c-4f8a-a080-2d41db4517b9_20241211105242.mp4`,
    },
    {
      name: "AI Build Sprints",
      frequency: "Partner-led · 2-4 weeks",
      description: "Intensive build programs with AI Grants India. Ship or go home.",
      media: `${MEDIA}/gallery/media/videos/979b549e-8020-453b-89d3-8b3448e4bf7c_20241211105218.mp4`,
    },
    {
      name: "The Residency",
      frequency: "Cohort · 8-12 weeks",
      description: "Structured founder residency. 2 cohorts completed. Demo day graduates building companies.",
      media: `${MEDIA}/gallery/media/videos/d8fac0d8-6c08-4ad0-91c2-d70b1c201f1a_20241211105303.mp4`,
    },
    {
      name: "Demo Days",
      frequency: "End of program",
      description: "Founders present to investors, partners, and the community. Warm intros happen that night.",
      media: `${MEDIA}/gallery/media/videos/9286b29b-afc2-4c20-b5c9-5561a4f30916_20241211105150.mp4`,
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

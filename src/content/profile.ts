export const profile = {
  name: 'Ali Ahmed',
  githubUsername: 'aliahm08',
  githubUrl: 'https://b2w-ai-com.vercel.app/',
  headline: 'Founder and CEO at B2W-ai | Senior Data Analyst at WSP | Columbia M.Arch 2023',
  intro:
    'Product manager adding value across go-to-market, business development, and product design teams using frontend development and full-stack engineering.',
  summary:
    'Ali has managed AI, machine learning, and data analytics projects adding nearly $100M in value across VC-backed startups, federal contracts, and enterprise software.',
  location: 'Washington, District of Columbia',
  email: 'aliahm1208@gmail.com',
  linkedinUrl: 'https://www.linkedin.com/in/aliahmed-co',
  linkedInVanity: 'aliahmed-co',
  substackUrl: 'https://aliahmed312.substack.com',
  wspUrl: 'https://www.wsp.com/en-us',
  linkedInFallback:
    'Resume details and profile links are available on the resume page.',
  siteUrl: '',
  keywords: [
    'Ali Ahmed',
    'software engineer',
    'product manager',
    'AI product manager',
    'full-stack engineer',
    'React developer',
    'TypeScript engineer',
    'startup product lead',
    'Washington DC software engineer',
    'Washington DC product manager',
  ],
  specialties: [
    'Full-stack product development',
    'AI product strategy',
    'React and TypeScript applications',
    'Workflow automation',
    'Data-driven operations software',
  ],
  interviewPrompts: [
    'What is Ali working on right now?',
    'Which repos look most active?',
    'What should I ask Ali in an interview?',
  ],
  resume: {
    summary:
      'Building the future of AI systems for architecture, construction, and engineering by developing agents that work off price-build models.',
    contactMethods: [
      {
        label: 'Email',
        href: 'mailto:aliahm1208@gmail.com',
        value: 'aliahm1208@gmail.com',
      },
      {
        label: 'LinkedIn',
        href: 'https://www.linkedin.com/in/aliahmed-co',
        value: 'linkedin.com/in/aliahmed-co',
      },
    ],
    experience: [
      {
        title: 'Senior Data Analyst',
        company: 'WSP',
        period: 'August 2022 - Present',
        location: 'Washington DC-Baltimore Area',
        bullets: [
          'Architected high-throughput data infrastructure and real-time systems to modernize transit intelligence.',
          'Led the technical roadmap for a Go and Kinesis ingestion pipeline processing 50k+ events per second.',
          'Improved data freshness by 80% through an event-driven architecture and tighter cross-functional delivery.',
        ],
      },
      {
        title: 'Design Manager',
        company: 'LaunchGood',
        period: '2021 - 2022',
        bullets: [
          'Managed design systems to create unity between UX and customer engagement design processes.',
          'Met with design teams weekly to ensure consistency in Notion documentation with Figma embeds.',
          'Oversaw KPI development for brand performance using 1,500 copywriting A/B tests with Notion AI and Python.',
        ],
      },
      {
        title: 'Head of Design',
        company: 'huupe',
        period: '2019 - 2022',
        location: 'New York, New York, United States',
        bullets: [],
      },
      {
        title: 'Architectural Designer',
        company: 'Norman Foster Foundation',
        period: '2019 - 2020',
        location: 'Madrid, Community of Madrid, Spain',
        bullets: [
          'Collaborated with Lord Norman Foster and MIT Media Lab on diagnosing slum dwelling worldwide for a sustainable alternative.',
          'Selected as one of ten global designers for the initiative.',
        ],
      },
      {
        title: 'Space Suit Engineer',
        company: 'NASA',
        period: '2018 - 2019',
        location: 'Houston, Texas, United States',
        bullets: [
          'Focused on materials testing.',
          'Trained computer vision models for object recognition integrated into space suit helmet heads-up displays.',
          'Prototyped soft goods hardware for self-egress implemented in a Mars suit cockpit.',
        ],
      },
      {
        title: 'AR Exhibits Engineer',
        company: 'Autodesk',
        period: '2017',
        location: 'San Francisco, California, United States',
        bullets: [],
      },
      {
        title: 'Design Engineer',
        company: 'Bragi',
        period: '2016 - 2017',
        location: 'Munich, Bavaria, Germany',
        bullets: [],
      },
      {
        title: 'Applied Innovation Engineer',
        company: 'Autodesk',
        period: '2016',
        location: 'San Francisco, California, United States',
        bullets: [
          'Presented software functionality within a $4M software development effort directly to CEO Carl Bass.',
          'Tested design environments for a 15% UX optimization through robotics, 3D-print generation, and FEA animation.',
        ],
      },
    ],
    skills: [
      'Go-to-market strategy',
      'User experience (UX)',
      'Design direction',
      'Frontend development',
      'Full-stack engineering',
      'AI and ML systems',
      'Data analytics',
      'Product design',
      'Business development',
    ],
    certifications: [
      'Sketchbook Pro',
      'Fortus FDM, Objet 3D Printing',
      'Fusion 360',
      'CNC, Laser Cutter, Metal & Wood',
      'Shop Trained',
      'AutoCAD',
    ],
    honors: [
      'Featured on Engineering.com',
      'GW University & Alumni Scholarship Award',
      'Booz Allen Hamilton University Scholar',
      'GW New Venture Competition Semi-Finalist',
      "Dean's List",
    ],
    education: [
      "Master's degree, Columbia University in the City of New York",
      'Bachelor of Science - BS, Mechanical Engineering, The George Washington University',
      'High School Diploma, American School of Doha',
      'High School, American Community School of Abu Dhabi',
    ],
    pivots: {
      title: 'My Many Pivots',
      pastWork: [
        'NASA',
        'Autodesk',
        'Norman Foster Foundation',
        'Autodesk',
        'huupe',
        'LaunchGood',
      ],
      writing: [
        {
          label: 'Medium article',
          title: 'Strategizing the Future of Computer Aided Design by (re)moving the Computer',
          href: 'https://medium.com/%40aliahmed/strategizing-the-future-of-computer-aided-design-by-re-moving-the-computer-e295accfe460',
          detail: 'Medium, Sep 22, 2024',
        },
        {
          label: 'Columbia publication',
          title: 'Bilal’s Adhan in Urban Magazine: Dialogues',
          href: 'https://www.arch.columbia.edu/books/reader/597-urban-magazine-fall-2020',
          detail: 'Columbia GSAPP, Fall 2020',
        },
      ],
      academicBackground: [
        'Columbia University, M.Arch',
        'The George Washington University, BS Mechanical Engineering',
      ],
    },
  },
} as const;

export type GitHubRepo = {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
};

export type GitHubUser = {
  login: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  updated_at?: string;
};

export function buildHeuristicSummary(repos: GitHubRepo[]) {
  const activeRepos = repos.filter((repo) => !repo.fork).slice(0, 3);

  if (!activeRepos.length) {
    return 'No public non-fork repositories were found, so there is not enough GitHub activity here to infer current focus.';
  }

  const repoList = activeRepos
    .map((repo) => repo.name.replace(/[-_]/g, ' '))
    .join(', ');

  const languages = Array.from(
    new Set(activeRepos.map((repo) => repo.language).filter(Boolean)),
  ) as string[];

  const languageSummary = languages.length
    ? `The visible work is mostly in ${languages.join(', ')}.`
    : 'The visible work spans a mix of repositories without a clear dominant language.';

  return `Based on the most recently updated repositories, Ali appears to be actively working on ${repoList}. ${languageSummary}`;
}

export function buildProfileContext(args: {
  githubUser?: GitHubUser | null;
  repos: GitHubRepo[];
  repoSummary: string;
}) {
  const repoLines = args.repos
    .slice(0, 6)
    .map(
      (repo) =>
        `${repo.name} | updated ${repo.updated_at} | language: ${repo.language ?? 'n/a'} | description: ${repo.description ?? 'n/a'}`,
    )
    .join('\n');

  return [
    `Name: ${profile.name}`,
    `Headline: ${profile.headline}`,
    `Intro: ${profile.intro}`,
    `Summary: ${profile.summary}`,
    `Location: ${profile.location}`,
    `Email: ${profile.email}`,
    `LinkedIn URL: ${profile.linkedinUrl}`,
    `Specialties: ${profile.specialties.join(', ')}`,
    `Keywords: ${profile.keywords.join(', ')}`,
    `GitHub user: ${args.githubUser?.login ?? profile.githubUsername}`,
    `GitHub bio: ${args.githubUser?.bio ?? 'n/a'}`,
    `GitHub summary: ${args.repoSummary}`,
    `Recent repositories:\n${repoLines || 'No repositories loaded.'}`,
  ].join('\n\n');
}

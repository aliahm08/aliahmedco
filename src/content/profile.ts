export const profile = {
  name: 'Ali Ahmed',
  githubUsername: 'aliahm08',
  headline: 'Software engineer and product manager building practical AI products.',
  intro:
    'Ali Ahmed is a New York-based software engineer and product manager focused on AI products, workflow automation, data systems, and shipping useful software quickly.',
  summary:
    'This site is a fast overview of Ali Ahmed’s work across software engineering, product strategy, prototyping, and AI-enabled operations tools.',
  location: 'New York, NY',
  email: 'aliahm1208@gmail.com',
  linkedinUrl: '',
  linkedInFallback:
    'LinkedIn is not published on this build yet. Use email or GitHub for direct contact and current work history.',
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
    'New York software engineer',
    'New York product manager',
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
      'Product-minded software engineer and operator focused on AI-enabled products, internal tools, and workflow systems that reduce manual work and clarify decisions.',
    experience: [
      {
        title: 'Product Manager and Software Engineer',
        company: 'Independent and startup product work',
        period: 'Recent',
        bullets: [
          'Built AI-assisted workflows, internal tools, and full-stack product prototypes.',
          'Owned product direction, rapid iteration, and hands-on implementation across frontend, backend, and automation layers.',
          'Worked across ambiguous early-stage problems where speed, clarity, and operating leverage mattered.',
        ],
      },
      {
        title: 'Product and Operations Systems Builder',
        company: 'Cross-functional roles',
        period: 'Prior',
        bullets: [
          'Designed processes and tooling to improve execution quality, visibility, and reporting.',
          'Translated operational pain points into software that teams could actually adopt.',
        ],
      },
    ],
    skills: [
      'Product strategy',
      'React',
      'TypeScript',
      'Node.js',
      'AI integrations',
      'Workflow automation',
      'Prototyping',
      'Systems thinking',
    ],
    education: [
      'Background available on request; resume page is intentionally concise and focused on current capability.',
    ],
  },
  writings: [
    {
      title: 'Building software that reduces coordination overhead',
      description:
        'A short note on why the best internal tools remove follow-up work instead of adding more dashboards.',
      status: 'Draft',
    },
    {
      title: 'Using AI as an execution layer, not a feature checklist',
      description:
        'Thoughts on where AI tools create real leverage in product and operations workflows.',
      status: 'Outline',
    },
    {
      title: 'Fast prototypes as a decision-making tool',
      description:
        'Why shipping a narrow working prototype often beats weeks of abstract planning.',
      status: 'In progress',
    },
  ],
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
    `LinkedIn fallback note: ${profile.linkedInFallback}`,
    `Specialties: ${profile.specialties.join(', ')}`,
    `Keywords: ${profile.keywords.join(', ')}`,
    `GitHub user: ${args.githubUser?.login ?? profile.githubUsername}`,
    `GitHub bio: ${args.githubUser?.bio ?? 'n/a'}`,
    `GitHub summary: ${args.repoSummary}`,
    `Recent repositories:\n${repoLines || 'No repositories loaded.'}`,
  ].join('\n\n');
}

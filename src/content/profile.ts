export const profile = {
  name: 'Ali Ahmed',
  githubUsername: 'aliahm08',
  headline: 'Barebones site. Current work. Fast read.',
  intro:
    'This site is meant to answer one question quickly: what is Ali working on right now?',
  location: 'New York, NY',
  email: 'ali@example.com',
  linkedinUrl: 'https://www.linkedin.com/in/replace-with-your-profile',
  linkedInFallback:
    'Add your real LinkedIn profile URL here. If you want live LinkedIn profile fields, that requires authenticated LinkedIn API access or a separate profile export.',
  interviewPrompts: [
    'What is Ali working on right now?',
    'Which repos look most active?',
    'What should I ask Ali in an interview?',
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
    `Location: ${profile.location}`,
    `Email: ${profile.email}`,
    `LinkedIn URL: ${profile.linkedinUrl}`,
    `LinkedIn fallback note: ${profile.linkedInFallback}`,
    `GitHub user: ${args.githubUser?.login ?? profile.githubUsername}`,
    `GitHub bio: ${args.githubUser?.bio ?? 'n/a'}`,
    `GitHub summary: ${args.repoSummary}`,
    `Recent repositories:\n${repoLines || 'No repositories loaded.'}`,
  ].join('\n\n');
}

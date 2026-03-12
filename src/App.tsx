import {useEffect, useState} from 'react';
import InterviewAli from './components/InterviewAli';
import {
  buildHeuristicSummary,
  GitHubRepo,
  GitHubUser,
  profile,
} from './content/profile';

export default function App() {
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadGitHub() {
      try {
        setLoading(true);
        setError('');

        const [userResponse, reposResponse] = await Promise.all([
          fetch(`https://api.github.com/users/${profile.githubUsername}`),
          fetch(
            `https://api.github.com/users/${profile.githubUsername}/repos?sort=updated&per_page=6`,
          ),
        ]);

        if (!userResponse.ok || !reposResponse.ok) {
          throw new Error('GitHub request failed.');
        }

        const [userData, repoData] = await Promise.all([
          userResponse.json() as Promise<GitHubUser>,
          reposResponse.json() as Promise<GitHubRepo[]>,
        ]);

        if (!active) {
          return;
        }

        setGithubUser(userData);
        setRepos(repoData);
      } catch (loadError) {
        console.error(loadError);
        if (!active) {
          return;
        }
        setError('GitHub data could not be loaded right now.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadGitHub();

    return () => {
      active = false;
    };
  }, []);

  const repoSummary = buildHeuristicSummary(repos);
  const activeRepos = repos.filter((repo) => !repo.fork).slice(0, 4);

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="wordmark" href="#top">
          {profile.name}
        </a>
        <nav className="topnav" aria-label="Primary">
          <a href="#now">Now</a>
          <a href="#repos">Repos</a>
          <a href="#linkedin">LinkedIn</a>
          <a href="#interview">Interview Ali</a>
          <a href={`mailto:${profile.email}`}>Contact</a>
        </nav>
      </header>

      <main className="page" id="top">
        <section className="hero">
          <p className="eyebrow">Ali Ahmed</p>
          <h1>{profile.headline}</h1>
          <p className="lede">{profile.intro}</p>
          <div className="meta-row">
            <span>{profile.location}</span>
            <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href={`mailto:${profile.email}`}>Email</a>
          </div>
        </section>

        <section id="now" className="panel">
          <p className="eyebrow">Now</p>
          <p className="statement">
            {loading ? 'Loading current GitHub activity…' : repoSummary}
          </p>
          <div className="micro-grid">
            <div>
              <p className="micro-label">GitHub</p>
              <p className="micro-copy">
                {githubUser
                  ? `${githubUser.public_repos} public repos, ${githubUser.followers} followers.`
                  : 'GitHub profile not loaded yet.'}
              </p>
            </div>
            <div>
              <p className="micro-label">LinkedIn</p>
              <p className="micro-copy">
                Live LinkedIn profile sync is not enabled in this site yet.
              </p>
            </div>
          </div>
          {error ? <p className="status-line">{error}</p> : null}
        </section>

        <section id="repos" className="panel">
          <p className="eyebrow">Recent Repos</p>
          <div className="repo-list">
            {activeRepos.map((repo) => (
              <article key={repo.id} className="repo-row">
                <div className="repo-topline">
                  <a href={repo.html_url} target="_blank" rel="noreferrer">
                    {repo.name}
                  </a>
                  <span>{new Date(repo.updated_at).toLocaleDateString()}</span>
                </div>
                <p className="repo-copy">
                  {repo.description || 'No description provided.'}
                </p>
                <p className="repo-meta">
                  {repo.language || 'No language listed'}
                  {repo.homepage ? ' · has live link' : ''}
                  {repo.stargazers_count ? ` · ${repo.stargazers_count} stars` : ''}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="linkedin" className="panel">
          <p className="eyebrow">LinkedIn</p>
          <p className="statement">
            {profile.linkedInFallback}
          </p>
          <p className="micro-copy">
            Profile: <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">{profile.linkedinUrl}</a>
          </p>
        </section>

        <InterviewAli githubUser={githubUser} repos={repos} repoSummary={repoSummary} />

        <section className="footer-panel">
          <p>
            Update [src/content/profile.ts] with your real email and LinkedIn URL. GitHub data is
            live from the public API.
          </p>
        </section>
      </main>
    </div>
  );
}

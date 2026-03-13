import {ReactNode, useEffect, useState} from 'react';
import InterviewAli from './components/InterviewAli';
import {
  buildHeuristicSummary,
  GitHubRepo,
  GitHubUser,
  profile,
} from './content/profile';

type Route = '/' | '/now' | '/repos' | '/linkedin' | '/interview';

const navLinks: Array<{href: Route; label: string}> = [
  {href: '/now', label: 'Now'},
  {href: '/repos', label: 'Repos'},
  {href: '/linkedin', label: 'LinkedIn'},
  {href: '/interview', label: 'Interview Ali'},
];

function normalizeRoute(pathname: string): Route {
  if (pathname === '/now' || pathname === '/repos' || pathname === '/linkedin' || pathname === '/interview') {
    return pathname;
  }

  return '/';
}

function formatUpdatedDate(value?: string) {
  if (!value) {
    return 'No recent update';
  }

  return new Date(value).toLocaleDateString();
}

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
}

function upsertLink(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector(selector) as HTMLLinkElement | null;

  if (!element) {
    element = document.createElement('link');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
}

function getAbsoluteUrl(pathname: string) {
  if (profile.siteUrl) {
    return new URL(pathname, profile.siteUrl).toString();
  }

  return new URL(pathname, window.location.origin).toString();
}

function useSeo(route: Route) {
  useEffect(() => {
    const pageTitleByRoute: Record<Route, string> = {
      '/': `${profile.name} | Software Engineer and Product Manager`,
      '/now': `Now | ${profile.name}`,
      '/repos': `Repositories | ${profile.name}`,
      '/linkedin': `Profile Links | ${profile.name}`,
      '/interview': `Interview Ali | ${profile.name}`,
    };

    const pageDescriptionByRoute: Record<Route, string> = {
      '/': `${profile.name} is a software engineer and product manager in ${profile.location} building AI products, full-stack applications, and operational tools.`,
      '/now': `Current work and recent engineering focus for ${profile.name}, including GitHub activity and product priorities.`,
      '/repos': `Recent repositories, technical focus areas, and public code from ${profile.name}.`,
      '/linkedin': `Professional profile links and contact context for ${profile.name}.`,
      '/interview': `Interview context and AI-assisted Q&A about ${profile.name}'s software engineering and product management work.`,
    };

    const title = pageTitleByRoute[route];
    const description = pageDescriptionByRoute[route];
    const absoluteUrl = getAbsoluteUrl(route === '/' ? '/' : route);

    document.title = title;
    document.documentElement.lang = 'en';

    upsertMeta('meta[name="description"]', {name: 'description', content: description});
    upsertMeta('meta[name="keywords"]', {
      name: 'keywords',
      content: profile.keywords.join(', '),
    });
    upsertMeta('meta[name="robots"]', {name: 'robots', content: 'index, follow'});
    upsertMeta('meta[property="og:title"]', {property: 'og:title', content: title});
    upsertMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: description,
    });
    upsertMeta('meta[property="og:type"]', {property: 'og:type', content: 'website'});
    upsertMeta('meta[property="og:url"]', {property: 'og:url', content: absoluteUrl});
    upsertMeta('meta[name="twitter:card"]', {name: 'twitter:card', content: 'summary_large_image'});
    upsertMeta('meta[name="twitter:title"]', {name: 'twitter:title', content: title});
    upsertMeta('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: description,
    });
    upsertLink('link[rel="canonical"]', {rel: 'canonical', href: absoluteUrl});

    let script = document.getElementById('person-jsonld') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'person-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: profile.name,
      jobTitle: 'Software Engineer and Product Manager',
      description: profile.intro,
      email: `mailto:${profile.email}`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: profile.location,
      },
      knowsAbout: profile.specialties,
      sameAs: [
        `https://github.com/${profile.githubUsername}`,
        profile.linkedinUrl || null,
      ].filter(Boolean),
      url: absoluteUrl,
    });
  }, [route]);
}

function SmartLink(props: {
  href: Route;
  children: ReactNode;
  className?: string;
  onNavigate?: () => void;
}) {
  const {href, children, className, onNavigate} = props;

  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        event.preventDefault();
        window.history.pushState({}, '', href);
        window.dispatchEvent(new PopStateEvent('popstate'));
        onNavigate?.();
      }}
    >
      {children}
    </a>
  );
}

function HomePage(props: {repoSummary: string; githubUser: GitHubUser | null; loading: boolean}) {
  const {repoSummary, githubUser, loading} = props;

  return (
    <>
      <section className="hero">
        <p className="eyebrow">Ali Ahmed</p>
        <h1>{profile.headline}</h1>
        <p className="lede">{profile.intro}</p>
        <div className="meta-row">
          <span>{profile.location}</span>
          <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noreferrer">
            GitHub
          </a>
          {profile.linkedinUrl ? (
            <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          ) : null}
          <a href={`mailto:${profile.email}`}>Email</a>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Overview</p>
        <div className="section-heading">
          <h2>Software engineering, product thinking, and execution</h2>
        </div>
        <p className="lede">{profile.summary}</p>
        <p className="statement">
          {loading ? 'Loading current GitHub activity…' : repoSummary}
        </p>
        <div className="micro-grid page-grid">
          <article className="page-card">
            <p className="micro-label">Now</p>
            <p className="micro-copy">
              Live GitHub summary and a quick status snapshot.
            </p>
            <SmartLink href="/now" className="inline-link">Open page</SmartLink>
          </article>
          <article className="page-card">
            <p className="micro-label">Repos</p>
            <p className="micro-copy">
              Recent non-fork repositories and update dates.
            </p>
            <SmartLink href="/repos" className="inline-link">Open page</SmartLink>
          </article>
          <article className="page-card">
            <p className="micro-label">Professional Profile</p>
            <p className="micro-copy">
              Contact details and profile context.
            </p>
            <SmartLink href="/linkedin" className="inline-link">Open page</SmartLink>
          </article>
          <article className="page-card">
            <p className="micro-label">Interview Ali</p>
            <p className="micro-copy">
              AI Q&A grounded in the profile template and repo activity.
            </p>
            <SmartLink href="/interview" className="inline-link">Open page</SmartLink>
          </article>
        </div>
        <p className="status-line">
          {githubUser
            ? `${githubUser.public_repos} public repos, ${githubUser.followers} followers on GitHub.`
            : 'GitHub profile not loaded yet.'}
        </p>
      </section>

      <section className="panel">
        <p className="eyebrow">Focus Areas</p>
        <div className="micro-grid">
          {profile.specialties.map((specialty) => (
            <div key={specialty}>
              <p className="micro-copy">{specialty}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function NowPage(props: {
  loading: boolean;
  repoSummary: string;
  githubUser: GitHubUser | null;
  error: string;
}) {
  const {loading, repoSummary, githubUser, error} = props;

  return (
    <section className="panel panel-first">
      <p className="eyebrow">Now</p>
      <p className="statement">{loading ? 'Loading current GitHub activity…' : repoSummary}</p>
      <div className="micro-grid">
        <div>
          <p className="micro-label">GitHub</p>
          <p className="micro-copy">
            {githubUser
              ? `${githubUser.public_repos} public repos, ${githubUser.followers} followers, updated ${formatUpdatedDate(githubUser.updated_at)}.`
              : 'GitHub profile not loaded yet.'}
          </p>
        </div>
        <div>
          <p className="micro-label">Product Direction</p>
          <p className="micro-copy">
            Current focus is on turning technical work into clear product outcomes, fast prototypes, and operational leverage.
          </p>
        </div>
      </div>
      {error ? <p className="status-line">{error}</p> : null}
    </section>
  );
}

function ReposPage(props: {repos: GitHubRepo[]; error: string; loading: boolean}) {
  const {repos, error, loading} = props;
  const activeRepos = repos.filter((repo) => !repo.fork).slice(0, 4);

  return (
    <section className="panel panel-first">
      <p className="eyebrow">Recent Repos</p>
      {loading ? <p className="statement">Loading repository activity…</p> : null}
      <div className="repo-list">
        {activeRepos.map((repo) => (
          <article key={repo.id} className="repo-row">
            <div className="repo-topline">
              <a href={repo.html_url} target="_blank" rel="noreferrer">
                {repo.name}
              </a>
              <span>{formatUpdatedDate(repo.updated_at)}</span>
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
      {!loading && !activeRepos.length ? (
        <p className="status-line">No public non-fork repositories were found.</p>
      ) : null}
      {error ? <p className="status-line">{error}</p> : null}
    </section>
  );
}

function LinkedInPage() {
  return (
    <section className="panel panel-first">
      <p className="eyebrow">Professional Profile</p>
      <p className="statement">{profile.linkedInFallback}</p>
      {profile.linkedinUrl ? (
        <p className="micro-copy">
          Profile: <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">{profile.linkedinUrl}</a>
        </p>
      ) : (
        <p className="micro-copy">
          Contact: <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </p>
      )}
    </section>
  );
}

function NotFoundPage() {
  return (
    <section className="panel panel-first">
      <p className="eyebrow">Page Not Found</p>
      <p className="statement">That page does not exist in this site.</p>
      <SmartLink href="/" className="inline-link">Back to home</SmartLink>
    </section>
  );
}

export default function App() {
  const [route, setRoute] = useState<Route>(normalizeRoute(window.location.pathname));
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function handlePopState() {
      setRoute(normalizeRoute(window.location.pathname));
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
  useSeo(route);

  let page = <NotFoundPage />;
  if (route === '/') {
    page = <HomePage repoSummary={repoSummary} githubUser={githubUser} loading={loading} />;
  } else if (route === '/now') {
    page = <NowPage loading={loading} repoSummary={repoSummary} githubUser={githubUser} error={error} />;
  } else if (route === '/repos') {
    page = <ReposPage repos={repos} error={error} loading={loading} />;
  } else if (route === '/linkedin') {
    page = <LinkedInPage />;
  } else if (route === '/interview') {
    page = (
      <InterviewAli githubUser={githubUser} repos={repos} repoSummary={repoSummary} standalone />
    );
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <SmartLink href="/" className="wordmark">{profile.name}</SmartLink>
        <nav className="topnav" aria-label="Primary">
          {navLinks.map((link) => (
            <span key={link.href}>
              <SmartLink
                href={link.href}
                className={route === link.href ? 'is-active' : undefined}
              >
                {link.label}
              </SmartLink>
            </span>
          ))}
          <a href={`mailto:${profile.email}`}>Contact</a>
        </nav>
      </header>

      <main className="page">{page}</main>
    </div>
  );
}

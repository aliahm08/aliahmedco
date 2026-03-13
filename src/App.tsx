import {ReactNode, useEffect, useState} from 'react';
import {
  GitHubRepo,
  profile,
} from './content/profile';
import {substackPosts} from './content/substackPosts';

type Route = '/' | '/projects' | '/resume' | '/writing';

function normalizeRoute(pathname: string): Route {
  const normalizedPathname =
    pathname !== '/' ? pathname.replace(/\/+$/, '') : pathname;

  if (normalizedPathname === '/now') {
    return '/';
  }

  if (normalizedPathname === '/repos' || normalizedPathname === '/projects') {
    return '/projects';
  }

  if (normalizedPathname === '/linkedin' || normalizedPathname === '/resume') {
    return '/resume';
  }

  if (normalizedPathname === '/writing') {
    return normalizedPathname;
  }

  return '/';
}

function formatUpdatedDate(value?: string) {
  if (!value) {
    return 'No recent update';
  }

  return new Date(value).toLocaleDateString();
}

function formatLongDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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
      '/projects': `Projects | ${profile.name}`,
      '/resume': `Resume | ${profile.name}`,
      '/writing': `Writing | ${profile.name}`,
    };

    const pageDescriptionByRoute: Record<Route, string> = {
      '/': `${profile.name} is a software engineer and product manager in ${profile.location} building AI products, full-stack applications, and operational tools.`,
      '/projects': `Recent projects, technical focus areas, and public code from ${profile.name}.`,
      '/resume': `Resume, experience, education, and profile links for ${profile.name}.`,
      '/writing': `Substack articles and published notes from ${profile.name}.`,
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
  }, [route]);
}

function SmartLink(props: {
  href: Route;
  children: ReactNode;
  className?: string;
}) {
  const {href, children, className} = props;

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
      }}
    >
      {children}
    </a>
  );
}

function NativeSocialButton(props: {
  href: string;
  label: string;
  title: string;
  detail: string;
}) {
  const {href, label, title, detail} = props;

  return (
    <a href={href} target="_blank" rel="noreferrer" className="native-social-button">
      <span className="native-social-label">{label}</span>
      <strong className="native-social-title">{title}</strong>
      <span className="native-social-detail">{detail}</span>
    </a>
  );
}

function getPastWorkBatchSize() {
  if (typeof window === 'undefined') {
    return 4;
  }

  if (window.innerWidth < 640) {
    return 2;
  }

  if (window.innerWidth < 960) {
    return 3;
  }

  return 4;
}

function HomePage() {
  const latestPublication = substackPosts[0];
  const [isPastWorkExpanded, setIsPastWorkExpanded] = useState(false);
  const [visiblePastWorkCount, setVisiblePastWorkCount] = useState(0);
  const pivotPrelude = profile.resume.pivotEntries.filter((item) => item.type !== 'Past Work');
  const pivotPastWork = profile.resume.pivotEntries.filter((item) => item.type === 'Past Work');

  useEffect(() => {
    if (!isPastWorkExpanded) {
      setVisiblePastWorkCount(0);
      return;
    }

    setVisiblePastWorkCount(getPastWorkBatchSize());
  }, [isPastWorkExpanded]);

  useEffect(() => {
    if (!isPastWorkExpanded) {
      return;
    }

    function handleResize() {
      setVisiblePastWorkCount((current) => Math.max(current, getPastWorkBatchSize()));
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isPastWorkExpanded]);

  useEffect(() => {
    if (!isPastWorkExpanded || visiblePastWorkCount >= pivotPastWork.length) {
      return;
    }

    const sentinel = document.getElementById('past-work-sentinel');
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) {
          return;
        }

        setVisiblePastWorkCount((current) =>
          Math.min(current + getPastWorkBatchSize(), pivotPastWork.length),
        );
      },
      {rootMargin: '0px 0px 18% 0px'},
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isPastWorkExpanded, pivotPastWork.length, visiblePastWorkCount]);

  return (
    <>
      <section className="panel panel-first">
        <p className="eyebrow">SOFTWARE ENGINEER, AI FOUNDER, PRODUCT</p>
        <div className="stack-list now-list home-fade-list">
          <div className="stack-item">
            <p className="micro-copy">
              <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="entity-link">
                B2W-ai
              </a>
              , Founder & CEO, AI Consultancy specializing in SMBs.
            </p>
          </div>
          <div className="stack-item">
            <p className="micro-copy">
              <a href={profile.wspUrl} target="_blank" rel="noreferrer" className="entity-link">
                WSP
              </a>
              {' '}Senior Data Analyst, ML Internal Tools for AEC.
            </p>
          </div>
          <div className="stack-item">
            <p className="micro-copy">
              <a href={latestPublication.url} target="_blank" rel="noreferrer" className="entity-link">
                Rebuilding Washington D.C.'s MetroBus Fleet Overhaul Program with AI
              </a>
            </p>
          </div>
          <div className="stack-item">
            <p className="micro-copy">
              Email: <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </p>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Connect With Ali</p>
        <div className="stack-list now-list home-fade-list">
          <div className="stack-item">
            <p className="micro-copy">
              GitHub:{' '}
              <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="entity-link">
                @{profile.githubUsername}
              </a>
            </p>
          </div>
          <div className="stack-item">
            <p className="micro-copy">
              LinkedIn:{' '}
              <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="entity-link">
                Ali Ahmed
              </a>
            </p>
          </div>
          <div className="stack-item">
            <p className="micro-copy">
              Substack:{' '}
              <a href={profile.substackUrl} target="_blank" rel="noreferrer" className="entity-link">
                @aliahmed312
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className="panel">
        <button
          type="button"
          className="inline-link-button"
          aria-expanded={isPastWorkExpanded}
          onClick={() => setIsPastWorkExpanded((current) => !current)}
        >
          {isPastWorkExpanded ? 'Hide Past Work' : 'Expand Past Work'}
        </button>
        {isPastWorkExpanded ? (
          <div className="disclosure-panel">
            <div className="stack-list now-list">
              {pivotPrelude.map((item, index) => (
                <div
                  key={`${item.type}-${item.organization}-${item.title}`}
                  className="stack-item home-fade-item"
                  style={{animationDelay: `${80 + index * 70}ms`}}
                >
                  <p className="micro-copy">
                    <strong>{item.organization}</strong>
                  </p>
                  <p className="micro-copy pivot-title-line">
                    {'href' in item && item.href ? (
                      <a href={item.href} target="_blank" rel="noreferrer" className="entity-link">
                        {item.title}
                      </a>
                    ) : (
                      item.title
                    )}
                  </p>
                  {'detail' in item && item.detail ? <p className="micro-copy">{item.detail}</p> : null}
                </div>
              ))}
              {pivotPastWork.slice(0, visiblePastWorkCount).map((item, index) => (
                <div
                  key={`${item.type}-${item.organization}-${item.title}`}
                  className="stack-item home-fade-item past-work-item"
                  style={{animationDelay: `${180 + index * 70}ms`}}
                >
                  <p className="micro-copy"><strong>{item.organization}</strong></p>
                  <p className="micro-copy pivot-title-line">{item.title}</p>
                  {'detail' in item && item.detail ? <p className="micro-copy">{item.detail}</p> : null}
                </div>
              ))}
            </div>
            {visiblePastWorkCount < pivotPastWork.length ? (
              <div id="past-work-sentinel" className="scroll-reveal-cue">
                <p className="micro-copy">Scroll to reveal more.</p>
              </div>
            ) : null}
            <SmartLink href="/resume" className="inline-link">View full resume</SmartLink>
          </div>
        ) : null}
      </section>
    </>
  );
}

function ProjectsPage(props: {repos: GitHubRepo[]; error: string; loading: boolean}) {
  const {repos, error, loading} = props;
  const activeRepos = repos.filter((repo) => !repo.fork).slice(0, 4);

  return (
    <section className="panel panel-first">
      <p className="eyebrow">Projects</p>
      <div className="embed-card">
        <p className="micro-label">Follow</p>
        <NativeSocialButton
          href={profile.githubUrl}
          label="GitHub"
          title={`Follow @${profile.githubUsername}`}
          detail="Open public code, activity, and repositories."
        />
      </div>
      {loading ? <p className="statement">Loading project activity…</p> : null}
      <div className="repo-list">
        {activeRepos.map((repo) => (
          <article key={repo.id} className="repo-row">
            <div className="repo-topline">
              <a href={repo.html_url} target="_blank" rel="noreferrer">
                {repo.name}
              </a>
              <span>{formatUpdatedDate(repo.updated_at)}</span>
            </div>
            <p className="repo-copy">{repo.description || 'No description provided.'}</p>
            <p className="repo-meta">
              {repo.language || 'No language listed'}
              {repo.homepage ? ' · has live link' : ''}
              {repo.stargazers_count ? ` · ${repo.stargazers_count} stars` : ''}
            </p>
          </article>
        ))}
      </div>
      {!loading && !activeRepos.length ? (
        <p className="status-line">No public non-fork projects were found.</p>
      ) : null}
      {error ? <p className="status-line">{error}</p> : null}
    </section>
  );
}

function ResumePage() {
  return (
    <>
      <section className="panel panel-first">
        <div className="section-heading">
          <h2>{profile.resume.summary}</h2>
        </div>
        <p className="statement">{profile.resume.profileSummary}</p>
        <div className="stack-list now-list">
          {profile.resume.contactMethods.map((method) => (
            <div key={method.label} className="stack-item">
              <p className="micro-copy">
                <strong>{method.label}</strong>
                {' '}·{' '}
                <a href={method.href} target="_blank" rel="noreferrer" className="entity-link">
                  {method.value}
                </a>
              </p>
            </div>
          ))}
          <div className="stack-item">
            <p className="micro-copy"><strong>Location</strong> · {profile.location}</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="stack-list">
          <div className="stack-item">
            <p className="micro-copy"><strong>Focus</strong> · {profile.resume.focusAreas.join(', ')}.</p>
          </div>
          <div className="stack-item">
            <p className="micro-copy">
              <strong>Tools</strong>
              {' '}· {profile.resume.technicalSkills.map((group) => `${group.label}: ${group.items.join(', ')}`).join(' · ')}
            </p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="stack-list">
          {profile.resume.experience.map((item) => (
            <article key={`${item.company}-${item.title}-${item.period}`} className="stack-item">
              <div className="repo-topline">
                <div>
                  <p className="summary-title">{item.company}</p>
                  <p className="summary-detail">{item.title}</p>
                </div>
                <div className="resume-meta">
                  <span>{item.period}</span>
                  {'location' in item && item.location ? <span>{item.location}</span> : null}
                </div>
              </div>
              {item.bullets.length ? (
                <ul className="bullet-list">
                  {item.bullets.map((bullet) => (
                    <li key={bullet} className="micro-copy">{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="stack-list">
          {profile.resume.pivotEntries.map((item) => (
            <div key={`${item.type}-${item.organization}-${item.title}`} className="stack-item">
              <p className="micro-copy">
                <strong>{item.type}</strong>
                {' '}· <strong>{item.organization}</strong>
                {' '}·{' '}
                {'href' in item && item.href ? (
                  <a href={item.href} target="_blank" rel="noreferrer" className="entity-link">
                    {item.title}
                  </a>
                ) : (
                  item.title
                )}
                {' '}· {item.period}
              </p>
              {'detail' in item && item.detail ? <p className="micro-copy">{item.detail}</p> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="stack-list">
          {profile.resume.education.map((entry) => (
            <div key={entry} className="stack-item">
              <p className="micro-copy">{entry}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="stack-list">
          <div className="stack-item">
            <p className="micro-copy"><strong>Certifications</strong> · {profile.resume.certifications.join(', ')}</p>
          </div>
          <div className="stack-item">
            <p className="micro-copy"><strong>Honors</strong> · {profile.resume.honors.join(', ')}</p>
          </div>
        </div>
      </section>
    </>
  );
}

function WritingPage() {
  return (
    <section className="panel panel-first">
      <p className="eyebrow">Writing</p>
      <div className="section-heading">
        <h2>Published writing and case-study notes from Substack.</h2>
      </div>
      <div className="embed-card">
        <p className="micro-label">Follow</p>
        <NativeSocialButton
          href={profile.substackUrl}
          label="Substack"
          title="Follow on Substack"
          detail="Essays, case studies, and field notes."
        />
      </div>
      <div className="repo-topline">
        <p className="micro-copy">Pulled from the public feed for `@aliahmed312`.</p>
        <a href={profile.substackUrl} target="_blank" rel="noreferrer">
          Visit Substack
        </a>
      </div>
      <div className="stack-list">
        {substackPosts.map((post) => (
          <article key={post.url} className="resume-block">
            <div className="repo-topline">
              <a href={post.url} target="_blank" rel="noreferrer" className="summary-title">
                {post.title}
              </a>
              <div className="resume-meta">
                <span>{formatLongDate(post.publishedAt)}</span>
              </div>
            </div>
            <p className="repo-copy">{post.description}</p>
          </article>
        ))}
      </div>
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

        const reposResponse = await fetch(
          `https://api.github.com/users/${profile.githubUsername}/repos?sort=updated&per_page=6`,
        );

        if (!reposResponse.ok) {
          throw new Error('GitHub request failed.');
        }

        const repoData = (await reposResponse.json()) as GitHubRepo[];

        if (!active) {
          return;
        }

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

  useSeo(route);

  let page = <NotFoundPage />;
  if (route === '/') {
    page = <HomePage />;
  } else if (route === '/projects') {
    page = <ProjectsPage repos={repos} error={error} loading={loading} />;
  } else if (route === '/resume') {
    page = <ResumePage />;
  } else if (route === '/writing') {
    page = <WritingPage />;
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <SmartLink href="/" className="wordmark">{profile.name}</SmartLink>
      </header>

      <main className="page">{page}</main>
    </div>
  );
}

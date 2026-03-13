import {FormEvent, ReactNode, useEffect, useState} from 'react';
import {
  GitHubRepo,
  profile,
} from './content/profile';
import {substackPosts} from './content/substackPosts';

type Route = '/' | '/projects' | '/resume' | '/writing';

const navLinks: Array<{href: Route; label: string}> = [
  {href: '/projects', label: 'Projects'},
  {href: '/resume', label: 'Resume'},
  {href: '/writing', label: 'Writing'},
];

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

function HomePage() {
  const latestPublication = substackPosts[0];

  return (
    <section className="panel panel-first">
      <p className="eyebrow">NOW</p>
      <div className="stack-list now-list">
        <div className="stack-item">
          <p className="micro-copy">
            <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="entity-link">
              B2W-ai
            </a>
            , building AI systems for architecture, construction, and engineering.
          </p>
        </div>
        <div className="stack-item">
          <p className="micro-copy">
            <a href={profile.wspUrl} target="_blank" rel="noreferrer" className="entity-link">
              WSP
            </a>
            {' '}architected transit data systems and improved data freshness by 80%.
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
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const emailSubject = encodeURIComponent(subject.trim() || `Hello ${profile.name}`);
    const emailBody = encodeURIComponent(
      [`Name: ${name.trim() || 'Not provided'}`, '', body.trim()].join('\n'),
    );
    window.location.href = `mailto:${profile.email}?subject=${emailSubject}&body=${emailBody}`;
  }

  return (
    <section className="panel panel-first">
      <p className="eyebrow">Resume</p>
      <div className="resume-hero">
        <div className="section-heading">
          <h2>{profile.resume.summary}</h2>
        </div>
        <p className="statement">{profile.summary}</p>
        <div className="resume-hero-actions">
          <NativeSocialButton
            href={profile.linkedinUrl}
            label="LinkedIn"
            title="Connect on LinkedIn"
            detail="Professional history, recommendations, and network."
          />
          <a href={`mailto:${profile.email}`} className="secondary-cta">
            Email {profile.email}
          </a>
        </div>
      </div>

      <div className="resume-grid resume-grid-intro">
        <section className="resume-block">
          <p className="micro-label">Profile</p>
          <div className="stack-list">
            <div className="stack-item">
              <strong>Location</strong>
              <p className="micro-copy">{profile.location}</p>
            </div>
            {profile.resume.contactMethods.map((method) => (
              <div key={method.label} className="stack-item">
                <strong>{method.label}</strong>
                <p className="micro-copy">
                  <a href={method.href} target="_blank" rel="noreferrer" className="entity-link">
                    {method.value}
                  </a>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="resume-block">
          <p className="micro-label">Capabilities</p>
          <div className="tag-row">
            {profile.resume.skills.map((skill) => (
              <span key={skill} className="tag">{skill}</span>
            ))}
          </div>
        </section>

        <section className="resume-block resume-block-form">
          <p className="micro-label">Start a Conversation</p>
          <form className="contact-form" onSubmit={handleContactSubmit}>
            <label className="field">
              <span className="micro-label">Name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
              />
            </label>
            <label className="field">
              <span className="micro-label">Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="What is this about?"
              />
            </label>
            <label className="field">
              <span className="micro-label">Body</span>
              <textarea
                rows={6}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Write your message"
              />
            </label>
            <div className="chat-actions">
              <p className="chat-note">This opens your email client with the message prefilled.</p>
              <button className="send-button" type="submit">Send email</button>
            </div>
          </form>
        </section>
      </div>

      <section className="panel">
        <p className="micro-label">Education</p>
        <div className="resume-grid">
          {profile.resume.education.map((entry) => (
            <div key={entry} className="resume-block">
              <p className="micro-copy">{entry}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="micro-label">Experience</p>
        <div className="stack-list">
          {profile.resume.experience.map((item) => (
            <article key={`${item.company}-${item.title}`} className="resume-block">
              <div className="repo-topline">
                <div>
                  <p className="summary-title">{item.title}</p>
                  <p className="summary-detail">{item.company}</p>
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

      <div className="resume-grid">
        <section className="resume-block">
          <p className="micro-label">Certifications</p>
          <div className="tag-row">
            {profile.resume.certifications.map((item) => (
              <span key={item} className="tag">{item}</span>
            ))}
          </div>
        </section>
      </div>

      <section className="resume-block">
        <p className="micro-label">Honors</p>
        <div className="tag-row">
          {profile.resume.honors.map((honor) => (
            <span key={honor} className="tag">{honor}</span>
          ))}
        </div>
      </section>
    </section>
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
        <nav className="topnav" aria-label="Primary">
          {navLinks.map((link) => (
            <span key={link.href}>
              <SmartLink href={link.href} className={route === link.href ? 'is-active' : undefined}>
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

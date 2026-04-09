import {ReactNode, useEffect, useState} from 'react';
import {
  GitHubRepo,
  profile,
} from './content/profile';
import {substackPosts} from './content/substackPosts';
import CoffeeShopFinancingModelPage from './components/CoffeeShopFinancingModelPage';

type Route =
  | '/'
  | '/projects'
  | '/resume'
  | '/writing'
  | '/work'
  | '/work/coffeeshop-financing/model';

const workIntroItems = {
  company: 'Ali Ahmed Co',
  role: 'Founder',
  project: 'Portfolio portrait',
  summary:
    'Selected work across AI systems, internal tooling, design direction, and founder-led product development, presented in the same restrained structure as the homepage. This view keeps the public framing minimal and focuses on how product thinking, frontend execution, and visual direction are brought together across B2W-ai, WSP, LaunchGood, huupe, NASA, and Autodesk.',
} as const;

const workPortraitSrc = new URL('../IMRJE9561.JPG', import.meta.url).toString();
const workOgImageSrc = '/og-image.svg';

function createPortfolioDemo(args: {
  eyebrow: string;
  title: string;
  detail: string;
  metrics: Array<{label: string; value: string}>;
}) {
  const metrics = args.metrics
    .map(
      (metric) => `
        <div class="metric">
          <span>${metric.label}</span>
          <strong>${metric.value}</strong>
        </div>
      `,
    )
    .join('');

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        :root {
          color-scheme: dark;
          font-family: "Public Sans", system-ui, sans-serif;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          min-height: 100vh;
          padding: 18px;
          background:
            radial-gradient(circle at top left, rgba(246, 240, 230, 0.08), transparent 36%),
            linear-gradient(150deg, #171411, #211c17 70%, #13110f);
          color: #f1e8de;
        }
        .shell {
          display: grid;
          gap: 14px;
          min-height: 100vh;
        }
        .eyebrow {
          margin: 0;
          color: #c7b29a;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-size: 11px;
        }
        .hero {
          display: grid;
          gap: 14px;
          padding: 18px;
          border-radius: 20px;
          border: 1px solid rgba(241, 232, 222, 0.12);
          background: rgba(255, 255, 255, 0.04);
        }
        h1 {
          margin: 0;
          font: 500 34px/1.02 "Newsreader", Georgia, serif;
          letter-spacing: -0.03em;
        }
        p {
          margin: 0;
          line-height: 1.6;
          color: rgba(241, 232, 222, 0.72);
          font-size: 14px;
        }
        .metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }
        .metric {
          padding: 14px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.04);
        }
        .metric span {
          display: block;
          margin-bottom: 6px;
          color: rgba(241, 232, 222, 0.58);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 10px;
        }
        .metric strong {
          font-size: 22px;
          font-weight: 600;
        }
        @media (max-width: 560px) {
          .metrics {
            grid-template-columns: 1fr;
          }
          h1 {
            font-size: 28px;
          }
        }
      </style>
    </head>
    <body>
      <div class="shell">
        <p class="eyebrow">${args.eyebrow}</p>
        <section class="hero">
          <h1>${args.title}</h1>
          <p>${args.detail}</p>
        </section>
        <section class="metrics">
          ${metrics}
        </section>
      </div>
    </body>
  </html>`;
}

const workExpandedMedia = [
  {
    id: 'portrait',
    label: 'Image',
    title: 'Founder portrait',
    description: 'The primary image anchoring the public-facing portfolio view.',
    type: 'image' as const,
    src: workPortraitSrc,
    alt: 'Ali Ahmed portrait.',
  },
  {
    id: 'ops-demo',
    label: 'Embedded demo',
    title: 'Operations review concept',
    description: 'A compact operating view for AI-assisted review, triage, and internal decision support.',
    type: 'demo' as const,
    demoHtml: createPortfolioDemo({
      eyebrow: 'WSP internal tooling',
      title: 'Signals first, clutter second.',
      detail: 'Interfaces built to reduce review drag and move teams toward legible operational decisions.',
      metrics: [
        {label: 'Flagged items', value: '14'},
        {label: 'Confidence', value: '86%'},
        {label: 'Review time', value: '-42%'},
      ],
    }),
  },
  {
    id: 'client-demo',
    label: 'Embedded demo',
    title: 'Client-facing prototype',
    description: 'A buyer-facing concept for explaining workflow design, automation, and near-term value.',
    type: 'demo' as const,
    demoHtml: createPortfolioDemo({
      eyebrow: 'B2W-ai concept',
      title: 'Explain the system before scaling it.',
      detail: 'Early-stage prototypes are used to make service logic, operating flow, and value proposition legible fast.',
      metrics: [
        {label: 'Stage', value: 'Pilot'},
        {label: 'Workflow', value: '4 steps'},
        {label: 'Time to value', value: '2 weeks'},
      ],
    }),
  },
] as const;

const workMainCarouselImages = [
  {
    id: 'portrait-primary',
    src: workPortraitSrc,
    alt: 'Ali Ahmed portrait, primary crop.',
    objectPosition: 'center 22%',
  },
  {
    id: 'portrait-detail',
    src: workPortraitSrc,
    alt: 'Ali Ahmed portrait, alternate crop.',
    objectPosition: 'center 38%',
  },
  {
    id: 'brand-study',
    src: workOgImageSrc,
    alt: 'Ali Ahmed Co brand image.',
    objectPosition: 'center center',
  },
] as const;

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

  if (normalizedPathname === '/portfolio' || normalizedPathname === '/work') {
    return '/work';
  }

  if (normalizedPathname === '/work/coffeeshop-financing/model') {
    return '/work/coffeeshop-financing/model';
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

function upsertJsonLd(id: string, value: unknown) {
  let element = document.getElementById(id) as HTMLScriptElement | null;

  if (!element) {
    element = document.createElement('script');
    element.type = 'application/ld+json';
    element.id = id;
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(value);
}

function useSeo(route: Route) {
  useEffect(() => {
    const pageTitleByRoute: Record<Route, string> = {
      '/': `${profile.name} | Software Engineer and Product Manager`,
      '/projects': `Projects | ${profile.name}`,
      '/resume': `Resume | ${profile.name}`,
      '/writing': `Writing | ${profile.name}`,
      '/work': `Work | ${profile.name}`,
      '/work/coffeeshop-financing/model': `Coffee Shop Financing Model | ${profile.name}`,
    };

    const pageDescriptionByRoute: Record<Route, string> = {
      '/': `${profile.name} is a software engineer, product manager, and founder in ${profile.location} building AI products, full-stack applications, and operational tools.`,
      '/projects': `Recent projects, technical focus areas, and public code from ${profile.name}.`,
      '/resume': `Resume, experience, education, and profile links for ${profile.name}.`,
      '/writing': `Substack articles and published notes from ${profile.name}.`,
      '/work': `Selected portfolio work, operating principles, and embedded product demos from ${profile.name}.`,
      '/work/coffeeshop-financing/model': `Interactive coffee shop financing dashboard with investor payback, operating assumptions, scenario controls, and downloadable report.`,
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

    if (route === '/') {
      upsertJsonLd('person-json-ld', {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: profile.name,
        jobTitle: 'Software Engineer, Product Manager, and Founder',
        description: description,
        url: absoluteUrl,
        image: getAbsoluteUrl('/favicon.svg'),
        sameAs: [profile.githubUrl, profile.linkedinUrl, profile.substackUrl, profile.b2wUrl].filter(Boolean),
        alumniOf: [
          {
            '@type': 'CollegeOrUniversity',
            name: 'Columbia University',
          },
          {
            '@type': 'CollegeOrUniversity',
            name: 'The George Washington University',
          },
        ],
        knowsAbout: [
          'software engineering',
          'product management',
          'front end development',
          'back end development',
          'full stack engineering',
          'AI products',
          'workflow automation',
          'computer vision',
          'machine learning',
        ],
        worksFor: [
          {
            '@type': 'Organization',
            name: 'B2W-ai',
          },
          {
            '@type': 'Organization',
            name: 'WSP',
          },
        ],
      });
    }
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
  type PivotEntry = (typeof profile.resume.pivotEntries)[number];
  function isPastWork(item: PivotEntry): item is Extract<PivotEntry, {type: 'Past Work'}> {
    return item.type === 'Past Work';
  }

  function isPreludeEntry(
    item: PivotEntry,
  ): item is Exclude<PivotEntry, {type: 'Past Work'}> {
    return item.type !== 'Past Work';
  }

  const pivotEntries = profile.resume.pivotEntries;
  const pivotPrelude = pivotEntries.filter(isPreludeEntry) as unknown as PivotEntry[];
  const pivotPastWork = pivotEntries.filter(isPastWork) as unknown as PivotEntry[];

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
              <a href={profile.b2wUrl} target="_blank" rel="noreferrer" className="entity-link">
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
                    {item.type === 'Academic' ? (
                      <>
                        <strong>{item.organization}</strong>
                        {', '}
                        {item.title}
                      </>
                    ) : item.type === 'Article' || item.type === 'Publication' ? (
                      <>
                        {'href' in item && item.href ? (
                          <a href={item.href} target="_blank" rel="noreferrer" className="entity-link">
                            {item.title}
                          </a>
                        ) : (
                          item.title
                        )}
                      </>
                    ) : (
                      <>
                        <strong>{item.organization}</strong>
                        {', '}
                        {item.title}
                      </>
                    )}
                  </p>
                </div>
              ))}
              {pivotPastWork.slice(0, visiblePastWorkCount).map((item, index) => (
                <div
                  key={`${item.type}-${item.organization}-${item.title}`}
                  className="stack-item home-fade-item past-work-item"
                  style={{animationDelay: `${180 + index * 70}ms`}}
                >
                  <p className="micro-copy">
                    <strong>{item.organization}</strong>
                    {', '}
                    {item.title}
                  </p>
                </div>
              ))}
            </div>
            {visiblePastWorkCount < pivotPastWork.length ? (
              <div id="past-work-sentinel" className="scroll-reveal-cue">
                <p className="micro-copy">Scroll to reveal more.</p>
              </div>
            ) : null}
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
        <p className="statement">
          Ali works across revenue, product, partnerships, and technical execution, with a toolkit that spans frontend software, analytics, automation, and AI systems.
        </p>
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
        <p className="statement">
          Selected experience across transit infrastructure, startup hardware, design systems, and applied R&D.
        </p>
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
        <p className="statement">
          The throughline is range: architecture, hardware, software, publishing, and a willingness to move toward unfamiliar but high-leverage problems.
        </p>
        <div className="stack-list">
          {profile.resume.pivotEntries.map((item) => (
            <div key={`${item.type}-${item.organization}-${item.title}`} className="stack-item">
              <p className="micro-copy">
                <strong>{item.organization}</strong>
                {' '}·{' '}
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
        </div>
      </section>

      <section className="panel">
        <p className="statement">
          Formal training began in engineering and expanded into architecture.
        </p>
        <div className="stack-list">
          {profile.resume.education.map((entry) => (
            <div key={entry} className="stack-item">
              <p className="micro-copy">{entry}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="statement">
          Additional signals include hands-on fabrication credentials and academic and professional recognition.
        </p>
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

function WorkPage() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <section className="panel panel-first">
        <p className="eyebrow">
          {workIntroItems.company}, {workIntroItems.role}, {workIntroItems.project}
        </p>
        <div className="stack-list now-list home-fade-list">
          <div className="stack-item">
            <p className="micro-copy">
              {workIntroItems.summary}
            </p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="work-main-carousel home-fade-item" style={{animationDelay: '120ms'}}>
          {workMainCarouselImages.map((image) => (
            <article key={image.id} className="resume-block work-image-panel">
              <img
                src={image.src}
                alt={image.alt}
                className="work-media-image"
                style={{objectPosition: image.objectPosition}}
              />
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <button
          type="button"
          className="inline-link-button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((current) => !current)}
        >
          {isExpanded ? 'Hide more details' : 'Expand more details'}
        </button>
        {isExpanded ? (
          <div className="disclosure-panel work-details-scroll">
            <div className="work-details-stack" aria-label="Expanded project gallery">
              {workExpandedMedia.map((item, index) => (
                <article
                  key={item.id}
                  className="resume-block work-slide home-fade-item"
                  style={{animationDelay: `${80 + index * 70}ms`}}
                >
                  <p className="micro-label">{item.label}</p>
                  <p className="summary-title">{item.title}</p>
                  <p className="repo-copy">{item.description}</p>
                  <div className="work-media-frame">
                    {item.type === 'image' ? (
                      <img src={item.src} alt={item.alt} className="work-media-image" />
                    ) : (
                      <iframe
                        title={item.title}
                        srcDoc={item.demoHtml}
                        loading="lazy"
                        className="work-media-embed"
                      />
                    )}
                  </div>
                </article>
              ))}
              <article className="resume-block home-fade-item" style={{animationDelay: '260ms'}}>
                <p className="micro-label">Case Study</p>
                <p className="summary-title">Ali Ahmed Co, Founder, Portfolio portrait</p>
                <p className="repo-copy">
                  This portfolio view is designed as a restrained public wrapper around a broader body of work in AI systems,
                  internal tools, and product direction. The goal is not to expose client internals, but to show how a project
                  is framed visually, how interface language stays minimal, and how the same operating logic can extend from a
                  static image to embedded product concepts and case-study storytelling.
                </p>
              </article>
            </div>
          </div>
        ) : null}
      </section>
    </>
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
  const [slowLoadAnimationsDisabled, setSlowLoadAnimationsDisabled] = useState(false);

  useEffect(() => {
    function handlePopState() {
      setRoute(normalizeRoute(window.location.pathname));
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    function disableAnimations() {
      if (cancelled) {
        return;
      }

      setSlowLoadAnimationsDisabled(true);
      document.documentElement.classList.add('slow-load-animations');
    }

    function handleLoad() {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    }

    if (document.readyState === 'complete') {
      return;
    }

    window.addEventListener('load', handleLoad, {once: true});
    timeoutId = window.setTimeout(disableAnimations, 1800);

    return () => {
      cancelled = true;
      window.removeEventListener('load', handleLoad);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      document.documentElement.classList.remove('slow-load-animations');
    };
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

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('theme-work', route === '/work' || route === '/work/coffeeshop-financing/model');

    return () => {
      root.classList.remove('theme-work');
    };
  }, [route]);

  useSeo(route);

  if (route === '/work/coffeeshop-financing/model') {
    return <CoffeeShopFinancingModelPage />;
  }

  let page = <NotFoundPage />;
  if (route === '/') {
    page = <HomePage />;
  } else if (route === '/projects') {
    page = <ProjectsPage repos={repos} error={error} loading={loading} />;
  } else if (route === '/resume') {
    page = <ResumePage />;
  } else if (route === '/writing') {
    page = <WritingPage />;
  } else if (route === '/work') {
    page = <WorkPage />;
  }

  const utilityLink = route === '/work'
    ? {href: '/' as Route, label: 'Profile'}
    : {href: '/work' as Route, label: 'Portfolio'};

  return (
    <div className={`site-shell ${slowLoadAnimationsDisabled ? 'slow-load-animations' : ''} ${route === '/work' ? 'site-shell--work' : ''}`}>
      <header className="topbar">
        <SmartLink href="/" className="wordmark">{profile.name}</SmartLink>
        <nav className="topnav" aria-label="Primary">
          <SmartLink href={utilityLink.href} className={`topnav-link ${route === utilityLink.href ? 'is-active' : ''}`}>
            {utilityLink.label}
          </SmartLink>
        </nav>
      </header>

      <main className="page">{page}</main>
    </div>
  );
}

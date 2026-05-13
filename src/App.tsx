import {CSSProperties, PointerEvent, ReactNode, startTransition, useEffect, useState} from 'react';
import {useSeo} from './components/Seo';
import {substackPosts} from './content/substackPosts';
import {profile} from './content/profile';
import {AppRoute, navItems, routeMeta, site} from './content/site';
import {
  loadProjectIndex,
  loadProjectDetail,
  ProjectIndexItem,
  ProjectDetail,
  uniqueValues,
} from './lib/projects';

type ViewMode = 'index' | 'grid' | 'groups';

type FilterState = {
  productType: string;
  role: string;
  scale: string;
};

const allLabel = 'All';
const organicStackOffsets = [
  {x: -14, y: 4, hoverX: -18, hoverY: 2, rotation: -2.1, hoverRotation: -1.3},
  {x: 11, y: 17, hoverX: 15, hoverY: 19, rotation: 1.4, hoverRotation: 0.7},
  {x: -4, y: 31, hoverX: -7, hoverY: 34, rotation: -0.6, hoverRotation: -0.2},
  {x: 18, y: 42, hoverX: 21, hoverY: 45, rotation: 2.3, hoverRotation: 1.4},
  {x: -19, y: 50, hoverX: -23, hoverY: 52, rotation: -1.1, hoverRotation: -0.5},
  {x: 4, y: 61, hoverX: 7, hoverY: 64, rotation: 0.9, hoverRotation: 0.4},
  {x: -9, y: 70, hoverX: -11, hoverY: 73, rotation: -2.7, hoverRotation: -1.6},
];
const routeDefaultView: Record<AppRoute, ViewMode> = {
  '/': 'index',
  '/portfolio': 'index',
  '/projects': 'grid',
  '/work': 'groups',
  '/resume': 'index',
  '/writing': 'index',
};

function normalizeRoute(pathname: string): AppRoute | null {
  const normalizedPathname = pathname !== '/' ? pathname.replace(/\/+$/, '') : pathname;

  if (normalizedPathname === '/projects') {
    return '/work';
  }

  if (
    normalizedPathname === '/' ||
    normalizedPathname === '/portfolio' ||
    normalizedPathname === '/work' ||
    normalizedPathname === '/resume' ||
    normalizedPathname === '/writing'
  ) {
    return normalizedPathname;
  }

  return null;
}

function navigateTo(route: AppRoute) {
  window.history.pushState({}, '', route);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function SmartLink(props: {href: AppRoute; className?: string; children: ReactNode; key?: string}) {
  const {href, className, children} = props;

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
        navigateTo(href);
      }}
    >
      {children}
    </a>
  );
}

function getGeneratedImageStyle(project: ProjectIndexItem, imageIndex: number) {
  const aspectRatios = ['4 / 5', '16 / 10', '1 / 1', '5 / 3'];
  const blurSizes = ['38%', '46%', '32%', '52%'];
  const rotation = imageIndex % 2 === 0 ? -1.5 - imageIndex * 0.4 : 1.2 + imageIndex * 0.3;

  return {
    '--project-accent': project.accent,
    '--project-aspect': aspectRatios[imageIndex % aspectRatios.length],
    '--project-blur': blurSizes[imageIndex % blurSizes.length],
    '--project-rotation': `${rotation}deg`,
    '--project-hover-rotation': `${rotation * 0.72}deg`,
    '--project-x': `${(imageIndex - 1.5) * 9}px`,
    '--project-y': `${imageIndex * 8}px`,
    '--project-hover-x': `${(imageIndex - 1.5) * 12}px`,
    '--project-hover-y': `${imageIndex * 10}px`,
  } as CSSProperties;
}

function GeneratedProjectImage(props: {
  project: ProjectIndexItem;
  imageIndex: number;
  className?: string;
  style?: CSSProperties;
  key?: string;
}) {
  return (
    <div
      className={`generated-project-image ${props.className ?? ''}`}
      style={{...getGeneratedImageStyle(props.project, props.imageIndex), ...props.style}}
      role="img"
      aria-label={`${props.project.title} abstract preview ${props.imageIndex + 1}`}
    />
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

function formatLongDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function ViewToggle(props: {
  current: ViewMode;
  onChange: (view: ViewMode) => void;
}) {
  const options: ViewMode[] = ['index', 'grid', 'groups'];

  return (
    <div className="toggle-row" role="tablist" aria-label="Project layouts">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`toggle-pill ${props.current === option ? 'is-active' : ''}`}
          onClick={() => props.onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function FilterSelect(props: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="filter-control">
      <span>{props.label}</span>
      <select value={props.value} onChange={(event) => props.onChange(event.target.value)}>
        {[allLabel, ...props.options].map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProjectCard(props: {
  item: ProjectIndexItem;
  active: boolean;
  onSelect: () => void;
  onPreviewMove: (item: ProjectIndexItem, event: PointerEvent<HTMLElement>) => void;
  onPreviewLeave: () => void;
  key?: string;
}) {
  const {item, active, onSelect, onPreviewMove, onPreviewLeave} = props;

  return (
    <button
      type="button"
      className={`project-row ${active ? 'is-active' : ''}`}
      onClick={onSelect}
      onPointerMove={(event) => onPreviewMove(item, event)}
      onPointerLeave={onPreviewLeave}
      onBlur={onPreviewLeave}
    >
      <span className="project-year">{item.year}</span>
      <strong>{item.title}</strong>
      <span>{item.client}</span>
      <span>{item.productType}</span>
      <span>{item.role}</span>
      <span>{item.scale}</span>
    </button>
  );
}

function ProjectIndex(props: {
  items: ProjectIndexItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onPreviewMove: (item: ProjectIndexItem, event: PointerEvent<HTMLElement>) => void;
  onPreviewLeave: () => void;
}) {
  return (
    <div className="project-index" aria-label="Project index">
      <div className="project-row project-row-heading" aria-hidden="true">
        <span>Year</span>
        <span>Project</span>
        <span>Context</span>
        <span>Type</span>
        <span>Role</span>
        <span>Scale</span>
      </div>
      {props.items.map((item) => (
        <ProjectCard
          key={item.id}
          item={item}
          active={props.activeId === item.id}
          onSelect={() => props.onSelect(item.id)}
          onPreviewMove={props.onPreviewMove}
          onPreviewLeave={props.onPreviewLeave}
        />
      ))}
    </div>
  );
}

function ProjectGrid(props: {
  items: ProjectIndexItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onPreviewMove: (item: ProjectIndexItem, event: PointerEvent<HTMLElement>) => void;
  onPreviewLeave: () => void;
}) {
  return (
    <div className="project-grid" aria-label="Project grid">
      {props.items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`project-tile ${props.activeId === item.id ? 'is-active' : ''}`}
          onClick={() => props.onSelect(item.id)}
          onPointerMove={(event) => props.onPreviewMove(item, event)}
          onPointerLeave={props.onPreviewLeave}
          onBlur={props.onPreviewLeave}
        >
          <span>{item.year}</span>
          <strong>{item.title}</strong>
          <span>{item.client}</span>
        </button>
      ))}
    </div>
  );
}

function ProjectGroups(props: {
  items: ProjectIndexItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onPreviewMove: (item: ProjectIndexItem, event: PointerEvent<HTMLElement>) => void;
  onPreviewLeave: () => void;
}) {
  const groups = Array.from(new Set(props.items.map((item) => item.scale)));

  return (
    <div className="project-groups">
      {groups.map((group) => (
        <section key={group} className="group-column">
          <div className="group-heading">
            <p className="eyebrow">{group}</p>
            <p>{props.items.filter((item) => item.scale === group).length} projects</p>
          </div>
          <div className="group-list">
            {props.items
              .filter((item) => item.scale === group)
              .map((item) => (
                <ProjectCard
                  key={item.id}
                  item={item}
                  active={props.activeId === item.id}
                  onSelect={() => props.onSelect(item.id)}
                  onPreviewMove={props.onPreviewMove}
                  onPreviewLeave={props.onPreviewLeave}
                />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ProjectBoard(props: {
  items: ProjectIndexItem[];
  activeId: string | null;
  viewMode: ViewMode;
  onSelect: (id: string) => void;
  onPreviewMove: (item: ProjectIndexItem, event: PointerEvent<HTMLElement>) => void;
  onPreviewLeave: () => void;
}) {
  if (props.viewMode === 'grid') {
    return <ProjectGrid {...props} />;
  }

  if (props.viewMode === 'groups') {
    return <ProjectGroups {...props} />;
  }

  return <ProjectIndex {...props} />;
}

function ProjectMeta(props: {item: ProjectIndexItem | null}) {
  if (!props.item) {
    return null;
  }

  return (
    <section className="project-meta" aria-live="polite">
      <p className="eyebrow">Selected</p>
      <h2>{props.item.title}</h2>
      <dl>
        <div>
          <dt>Context</dt>
          <dd>{props.item.client}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{props.item.productType}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{props.item.role}</dd>
        </div>
        <div>
          <dt>Scale</dt>
          <dd>{props.item.scale}</dd>
        </div>
      </dl>
    </section>
  );
}

function ProjectExplorer(props: {
  title: string;
  intro: string;
  items: ProjectIndexItem[];
  activeId: string | null;
  viewMode: ViewMode;
  filters: FilterState;
  onSelect: (id: string) => void;
  onViewModeChange: (view: ViewMode) => void;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onPreviewMove: (item: ProjectIndexItem, event: PointerEvent<HTMLElement>) => void;
  onPreviewLeave: () => void;
}) {
  const productTypes = uniqueValues(props.items, 'productType');
  const roles = uniqueValues(props.items, 'role');
  const scales = uniqueValues(props.items, 'scale');

  const filteredItems = props.items.filter((item) => {
    const productTypeMatches =
      props.filters.productType === allLabel || item.productType === props.filters.productType;
    const roleMatches = props.filters.role === allLabel || item.role === props.filters.role;
    const scaleMatches = props.filters.scale === allLabel || item.scale === props.filters.scale;
    return productTypeMatches && roleMatches && scaleMatches;
  });
  const activeItem = filteredItems.find((item) => item.id === props.activeId) ?? filteredItems[0] ?? null;

  return (
    <section className="portfolio-section portfolio-fade-list">
      <div className="section-header">
        <h2>{props.title}</h2>
        <p>{props.intro}</p>
      </div>

      <div className="control-bar">
        <div className="filter-grid">
          <FilterSelect
            label="Product type"
            value={props.filters.productType}
            options={productTypes}
            onChange={(value) => props.onFilterChange('productType', value)}
          />
          <FilterSelect
            label="Role"
            value={props.filters.role}
            options={roles}
            onChange={(value) => props.onFilterChange('role', value)}
          />
          <FilterSelect
            label="Scale"
            value={props.filters.scale}
            options={scales}
            onChange={(value) => props.onFilterChange('scale', value)}
          />
        </div>
        <ViewToggle current={props.viewMode} onChange={props.onViewModeChange} />
      </div>

      {filteredItems.length ? (
        <>
          <ProjectBoard
            items={filteredItems}
            activeId={props.activeId}
            viewMode={props.viewMode}
            onSelect={props.onSelect}
            onPreviewMove={props.onPreviewMove}
            onPreviewLeave={props.onPreviewLeave}
          />
          <ProjectMeta item={activeItem} />
        </>
      ) : (
        <section className="empty-state">No projects match that mix.</section>
      )}
    </section>
  );
}

function PortfolioPage(props: {
  projects: ProjectIndexItem[];
  activeId: string | null;
  viewMode: ViewMode;
  filters: FilterState;
  onSelect: (id: string) => void;
  onViewModeChange: (view: ViewMode) => void;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onPreviewMove: (item: ProjectIndexItem, event: PointerEvent<HTMLElement>) => void;
  onPreviewLeave: () => void;
  preview: {
    item: ProjectIndexItem | null;
    x: number;
    y: number;
    visible: boolean;
  };
}) {
  return (
    <div className="portfolio-shell">
      <section className="intro-section">
        <div className="hero-copy">
          <h1>{site.hero.title}</h1>
          <p>{site.hero.intro}</p>
        </div>
      </section>

      <ProjectExplorer
        title="Projects"
        intro={site.hero.detail}
        items={props.projects}
        activeId={props.activeId}
        viewMode={props.viewMode}
        filters={props.filters}
        onSelect={props.onSelect}
        onViewModeChange={props.onViewModeChange}
        onFilterChange={props.onFilterChange}
        onPreviewMove={props.onPreviewMove}
        onPreviewLeave={props.onPreviewLeave}
      />
      <div
        className={`portfolio-hover-image ${props.preview.visible && props.preview.item ? 'is-visible' : ''}`}
        style={{left: props.preview.x, top: props.preview.y}}
        aria-hidden="true"
      >
        {props.preview.item ? <img src={props.preview.item.poster} alt="" /> : null}
      </div>
    </div>
  );
}

function ProjectPhotoSeries(props: {
  projects: ProjectIndexItem[];
  onOpenProject: (projectId: string) => void;
  compact?: boolean;
}) {
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);

  useEffect(() => {
    if (!props.projects.length) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveProjectIndex((current) => (current + 1) % props.projects.length);
    }, 2800);

    return () => window.clearInterval(intervalId);
  }, [props.projects.length]);

  if (!props.projects.length) {
    return null;
  }

  const activeProject = props.projects[activeProjectIndex];
  const orderedProjects = [
    activeProject,
    ...props.projects.filter((project) => project.id !== activeProject.id),
  ];

  return (
    <section className={`panel project-photo-series home-fade-item ${props.compact ? 'is-compact' : ''}`}>
      <div className="series-margin series-margin-left">
        <p className="summary-title">{activeProject.title}</p>
      </div>
      <button
        type="button"
        className="series-image-stack"
        onClick={() => props.onOpenProject(activeProject.id)}
        aria-label={`Open ${activeProject.title} in projects`}
      >
        {orderedProjects.map((project, stackIndex) => {
          const offset = organicStackOffsets[stackIndex % organicStackOffsets.length];

          return (
            <GeneratedProjectImage
              key={project.id}
              project={project}
              imageIndex={0}
              className={stackIndex === 0 ? 'is-front is-active' : ''}
              style={{
                '--project-x': `${offset.x}px`,
                '--project-y': `${offset.y}px`,
                '--project-hover-x': `${offset.hoverX}px`,
                '--project-hover-y': `${offset.hoverY}px`,
                '--project-rotation': `${offset.rotation}deg`,
                '--project-hover-rotation': `${offset.hoverRotation}deg`,
              } as CSSProperties}
            />
          );
        })}
      </button>
      <div className="series-margin series-margin-right">
        <p className="summary-title">{activeProject.client}</p>
      </div>
      <div className="series-projects-link">
        <SmartLink href="/work" className="inline-link">
          Work
        </SmartLink>
      </div>
    </section>
  );
}

function WorkProjectStack(props: {
  projects: ProjectIndexItem[];
  project: ProjectIndexItem;
}) {
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    let active = true;
    loadProjectDetail(props.project.id).then((data) => {
      if (active) {
        setDetail(data);
        setPhotoIndex(0);
      }
    });
    return () => {
      active = false;
    };
  }, [props.project.id]);

  const baseGallery = detail?.gallery?.length
    ? detail.gallery
    : [{src: props.project.poster, alt: '', caption: props.project.teaser}];

  const gallery = baseGallery.length < 4
    ? [
        ...baseGallery,
        ...Array.from({length: 4 - baseGallery.length}).map((_, i) => ({
          ...baseGallery[0],
          caption: `${baseGallery[0].caption} (View ${i + 2})`,
        })),
      ]
    : baseGallery;

  const currentPhoto = gallery[photoIndex];

  const handleNextPhoto = () => setPhotoIndex((i) => (i + 1) % gallery.length);
  const handlePrevPhoto = () => setPhotoIndex((i) => (i === 0 ? gallery.length - 1 : i - 1));

  return (
    <section
      className="work-stack-panel home-fade-item"
      aria-label={`${props.project.title} preview stack`}
    >
      <div className="work-stack-copy work-stack-copy-left">
        {detail?.headline ? <h1>{detail.headline}</h1> : <h1>{props.project.client}</h1>}
        <div className="gallery-arrows">
          <button type="button" className="gallery-arrow" onClick={handlePrevPhoto} disabled={gallery.length <= 1} aria-label="Previous photo">←</button>
          <button type="button" className="gallery-arrow" onClick={handleNextPhoto} disabled={gallery.length <= 1} aria-label="Next photo">→</button>
        </div>
      </div>
      <button
        type="button"
        className="work-stack-frame"
        onClick={handleNextPhoto}
        disabled={gallery.length <= 1}
        aria-label="Next photo"
      >
        {gallery.map((photo, stackIndex) => {
          const offsetIndex = (stackIndex - photoIndex + gallery.length) % gallery.length;
          const offset = organicStackOffsets[offsetIndex % organicStackOffsets.length];

          return (
            <GeneratedProjectImage
              key={`${photo.src}-${stackIndex}`}
              project={props.project}
              imageIndex={stackIndex % 4}
              className={offsetIndex === 0 ? 'is-front is-active' : ''}
              style={{
                '--project-x': `${offset.x}px`,
                '--project-y': `${offset.y}px`,
                '--project-hover-x': `${offset.hoverX}px`,
                '--project-hover-y': `${offset.hoverY}px`,
                '--project-rotation': `${offset.rotation}deg`,
                '--project-hover-rotation': `${offset.hoverRotation}deg`,
              } as CSSProperties}
            />
          );
        })}
      </button>
      <div className="work-stack-copy work-stack-copy-right">
        <p className="work-stack-meta">
          <strong>{(currentPhoto as any).title || props.project.title}</strong>
        </p>
        <p className="work-stack-description">{currentPhoto.caption}</p>
      </div>
    </section>
  );
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
              , Founder & CEO.
            </p>
          </div>
          <div className="stack-item">
            <p className="micro-copy">
              <a href={profile.wspUrl} target="_blank" rel="noreferrer" className="entity-link">
                WSP
              </a>
              , Senior Consultant.
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

      <section className="panel home-social-section">
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

function WorkPage(props: {
  projects: ProjectIndexItem[];
  onOpenProject: (projectId: string) => void;
}) {
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  const groups = Array.from(new Set(props.projects.map((p) => p.scale)));
  const [activeGroup, setActiveGroup] = useState(groups[0]);

  const groupProjects = props.projects.filter((p) => p.scale === activeGroup);

  return (
    <div className="work-page">
      <section id="portfolio" className="landing-section landing-portfolio-section">
        <div className="work-group-tabs" style={{ marginBottom: '48px', display: 'flex', gap: '24px', width: 'min(720px, calc(100% - 32px))', margin: '0 auto 48px' }}>
          {groups.map((group) => (
            <button 
              key={group} 
              type="button" 
              className={`eyebrow work-group-tab ${activeGroup === group ? 'is-active' : ''}`}
              onClick={() => {
                setActiveGroup(group);
                setExpandedProjectId(null);
              }}
            >
              {group}
            </button>
          ))}
        </div>
        
        <div className="landing-project-strip work-accordion home-fade-list" aria-label={`${activeGroup} projects`}>
          {groupProjects.map((project) => {
            const isExpanded = expandedProjectId === project.id;

            return (
              <article key={project.id} className={`work-accordion-item ${isExpanded ? 'is-active' : ''}`}>
                <button
                  type="button"
                  className="landing-project-row"
                  aria-expanded={isExpanded}
                  onClick={() => {
                    setExpandedProjectId((current) => (current === project.id ? null : project.id));
                  }}
                >
                  <span>{project.company}</span>
                  <strong>{project.title}</strong>
                  <span>{project.client}</span>
                  <span>{project.productType}</span>
                </button>
                {isExpanded ? (
                  <div className="work-accordion-panel">
                    <WorkProjectStack 
                      projects={props.projects} 
                      project={project} 
                    />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ResumePage() {
  return (
    <>
      <section className="panel panel-first">
        <p className="eyebrow">Resume</p>
        <div className="stack-list now-list home-fade-list">
          <div className="stack-item">
            <p className="micro-copy">{profile.resume.summary}</p>
          </div>
          <div className="stack-item">
            <p className="micro-copy">{profile.resume.profileSummary}</p>
          </div>
          {profile.resume.contactMethods.map((method) => (
            <div key={method.label} className="stack-item">
              <p className="micro-copy">
                <strong>{method.label}</strong>
                {' · '}
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
        <p className="eyebrow">Experience</p>
        <div className="stack-list now-list home-fade-list">
          {profile.resume.experience.map((item) => (
            <article key={`${item.company}-${item.title}-${item.period}`} className="stack-item">
              <div className="repo-topline">
                <div>
                  <p className="micro-copy">
                    <strong>{item.company}</strong>
                    {' · '}
                    {item.title}
                  </p>
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
        <p className="eyebrow">Focus and tools</p>
        <div className="stack-list home-fade-list">
          <div className="stack-item">
            <p className="micro-copy"><strong>Focus</strong> · {profile.resume.focusAreas.join(', ')}.</p>
          </div>
          <div className="stack-item">
            <p className="micro-copy">
              <strong>Tools</strong>
              {' '}· {profile.resume.technicalSkills.map((group) => `${group.label}: ${group.items.join(', ')}`).join(' · ')}
            </p>
          </div>
          <div className="stack-item">
            <p className="micro-copy"><strong>Certifications</strong> · {profile.resume.certifications.join(', ')}.</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Education and recognition</p>
        <div className="stack-list home-fade-list">
          {profile.resume.education.map((entry) => (
            <div key={entry} className="stack-item">
              <p className="micro-copy">{entry}</p>
            </div>
          ))}
          <div className="stack-item">
            <p className="micro-copy"><strong>Honors</strong> · {profile.resume.honors.join(', ')}.</p>
          </div>
        </div>
      </section>
    </>
  );
}

function WritingPage() {
  return (
    <div className="writing-page-layout">
      <aside className="writing-sidebar home-fade-item">
        <div className="sticky-sidebar">
          <p className="eyebrow">Writing</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 500, margin: '8px 0 16px' }}>Notes & Essays</h2>
          <p className="micro-copy" style={{ color: 'var(--portfolio-muted)', lineHeight: 1.6 }}>
            {site.writingSummary}
          </p>
          
          <div className="external-sources" style={{ marginTop: '48px' }}>
            <p className="eyebrow">External Sources</p>
            <div style={{ marginTop: '16px' }}>
              <a href={profile.substackUrl} target="_blank" rel="noreferrer" className="entity-link">
                Substack (@aliahmed312)
              </a>
            </div>
          </div>
        </div>
      </aside>

      <main className="writing-content home-fade-list">
        {substackPosts.map((post) => (
          <article key={post.url} className="writing-post-item stack-item">
            <h3 className="post-title">
              <a href={post.url} target="_blank" rel="noreferrer">{post.title}</a>
            </h3>
            <p className="post-meta">{formatLongDate(post.publishedAt)}</p>
            {'description' in post && post.description ? (
              <p className="post-teaser">{post.description}</p>
            ) : null}
          </article>
        ))}
      </main>
    </div>
  );
}

function NotFoundPage() {
  return (
    <section className="not-found-panel">
      <p className="eyebrow">{site.notFound.eyebrow}</p>
      <h1>{site.notFound.title}</h1>
      <p>{site.notFound.body}</p>
      <SmartLink href="/" className="inline-link">
        {site.notFound.cta}
      </SmartLink>
    </section>
  );
}

export default function App() {
  const [route, setRoute] = useState<AppRoute | null>(normalizeRoute(window.location.pathname));
  const [projects, setProjects] = useState<ProjectIndexItem[]>([]);
  const [projectError, setProjectError] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(route ? routeDefaultView[route] : 'index');
  const [preview, setPreview] = useState<{
    item: ProjectIndexItem | null;
    x: number;
    y: number;
    visible: boolean;
  }>({
    item: null,
    x: 0,
    y: 0,
    visible: false,
  });
  const [filters, setFilters] = useState<FilterState>({
    productType: allLabel,
    role: allLabel,
    scale: allLabel,
  });

  const resolvedRoute = route ?? '/';
  useSeo(resolvedRoute, routeMeta[resolvedRoute]);

  useEffect(() => {
    function handlePopState() {
      const nextRoute = normalizeRoute(window.location.pathname);
      startTransition(() => {
        setRoute(nextRoute);
      });
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const nextView = route ? routeDefaultView[route] : 'index';
    if (route === '/portfolio' || route === '/projects' || route === '/work') {
      setViewMode(nextView);
    }
  }, [route]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProjects() {
      try {
        setProjectError('');
        const items = await loadProjectIndex(controller.signal);
        setProjects(items);
        setSelectedProjectId((current) => current ?? items[0]?.id ?? null);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setProjectError('Project index could not be loaded.');
      }
    }

    void fetchProjects();

    return () => controller.abort();
  }, []);

  const filteredProjects = projects.filter((item) => {
    const matchesProductType = filters.productType === allLabel || item.productType === filters.productType;
    const matchesRole = filters.role === allLabel || item.role === filters.role;
    const matchesScale = filters.scale === allLabel || item.scale === filters.scale;
    return matchesProductType && matchesRole && matchesScale;
  });

  useEffect(() => {
    if (!filteredProjects.length) {
      return;
    }

    const selectionStillVisible = filteredProjects.some((item) => item.id === selectedProjectId);
    if (!selectionStillVisible) {
      setSelectedProjectId(filteredProjects[0].id);
    }
  }, [filteredProjects, selectedProjectId]);

  function updateFilter(key: keyof FilterState, value: string) {
    setFilters((current) => ({...current, [key]: value}));
  }

  function selectProject(projectId: string) {
    startTransition(() => {
      setSelectedProjectId(projectId);
    });
  }

  function openProject(projectId: string) {
    startTransition(() => {
      setSelectedProjectId(projectId);
      setViewMode('grid');
      navigateTo('/work');
    });
  }

  function movePreview(item: ProjectIndexItem, event: PointerEvent<HTMLElement>) {
    setPreview({
      item,
      x: event.clientX + 24,
      y: event.clientY + 24,
      visible: true,
    });
  }

  function hidePreview() {
    setPreview((current) => ({...current, visible: false}));
  }

  const explorerProps = {
    projects,
    activeId: selectedProjectId,
    viewMode,
    filters,
    onSelect: selectProject,
    onViewModeChange: setViewMode,
    onFilterChange: updateFilter,
    onPreviewMove: movePreview,
    onPreviewLeave: hidePreview,
  };
  const usesPortfolioShell = route === '/portfolio';

  return (
    <div className={`site-shell ${usesPortfolioShell ? 'site-shell--portfolio' : ''}`}>
      <header className="topbar">
        <div className="topbar-inner">
          <SmartLink href="/" className="wordmark">
            {profile.name}
          </SmartLink>
          <nav className="topnav" aria-label="Primary">
            {navItems.map((item) => (
              <SmartLink
                key={item.href}
                href={item.href}
                className={`topnav-link ${route === item.href ? 'is-active' : ''}`}
              >
                {item.label}
              </SmartLink>
            ))}
            <a href={`mailto:${profile.email}`} className="topnav-link contact-link">
              Contact
            </a>
          </nav>
        </div>
      </header>

      <main className={usesPortfolioShell ? 'page-shell portfolio-shell' : 'page'}>
        {projectError ? <section className="empty-state">{projectError}</section> : null}
        {route === null ? (
          <NotFoundPage />
        ) : route === '/' ? (
          <HomePage />
        ) : route === '/portfolio' ? (
          <PortfolioPage {...explorerProps} preview={preview} />
        ) : route === '/projects' ? (
          <ProjectExplorer
            title="Projects"
            intro="A simple project architecture that can later expand into individual pages."
            items={projects}
            activeId={selectedProjectId}
            viewMode={viewMode}
            filters={filters}
            onSelect={selectProject}
            onViewModeChange={setViewMode}
            onFilterChange={updateFilter}
            onPreviewMove={movePreview}
            onPreviewLeave={hidePreview}
          />
        ) : route === '/work' ? (
          <WorkPage
            projects={projects}
            onOpenProject={openProject}
          />
        ) : route === '/resume' ? (
          <ResumePage />
        ) : (
          <WritingPage />
        )}
      </main>
    </div>
  );
}

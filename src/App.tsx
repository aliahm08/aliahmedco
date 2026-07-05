import {CSSProperties, PointerEvent, ReactNode, startTransition, useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import Footer from './components/Footer';
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
  imageSrc?: string;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
  key?: string;
}) {
  const hasUploadedImage = Boolean(
    props.imageSrc && props.imageSrc.startsWith('/project-media/'),
  );

  return (
    <div
      className={`generated-project-image ${hasUploadedImage ? 'has-uploaded-photo' : ''} ${props.className ?? ''}`}
      style={{...getGeneratedImageStyle(props.project, props.imageIndex), ...props.style}}
      role="img"
      aria-label={props.ariaLabel ?? `${props.project.title} abstract preview ${props.imageIndex + 1}`}
    >
      {hasUploadedImage ? (
        <img className="generated-project-image-photo" src={props.imageSrc} alt="" aria-hidden="true" />
      ) : null}
    </div>
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

  const gallery = baseGallery;

  const currentPhoto = gallery[photoIndex];

  const handleNextPhoto = () => setPhotoIndex((i) => (i + 1) % gallery.length);
  const handlePrevPhoto = () => setPhotoIndex((i) => (i === 0 ? gallery.length - 1 : i - 1));

  return (
    <section
      className="work-stack-panel home-fade-item"
      aria-label={`${props.project.title} preview stack`}
    >
      <div className="work-stack-copy work-stack-copy-left">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <h1>
            {props.project.title}
          </h1>
        </motion.div>
      </div>
      <motion.div
        className="work-stack-frame"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.28, ease: 'easeOut' }}
      >
        <div
          className="gallery-images-container"
          onClick={handleNextPhoto}
          style={{ cursor: gallery.length > 1 ? 'pointer' : 'default', width: '100%', height: '100%', position: 'relative' }}
        >
          {gallery.map((photo, stackIndex) => {
            const offsetIndex = (stackIndex - photoIndex + gallery.length) % gallery.length;
            const offset = organicStackOffsets[offsetIndex % organicStackOffsets.length];

            return (
              <GeneratedProjectImage
                key={`${photo.src}-${stackIndex}`}
                project={props.project}
                imageIndex={stackIndex % 4}
                imageSrc={photo.src}
                ariaLabel={photo.alt || `${props.project.title} photo ${stackIndex + 1}`}
                className={`${offsetIndex === 0 ? 'is-front is-active' : ''} stack-depth-${Math.min(offsetIndex, 4)}`}
                style={{
                  '--project-x': `${offset.x}px`,
                  '--project-y': `${offset.y}px`,
                  '--project-hover-x': `${offset.hoverX}px`,
                  '--project-hover-y': `${offset.hoverY}px`,
                  '--project-rotation': `${offset.rotation}deg`,
                  '--project-hover-rotation': `${offset.hoverRotation}deg`,
                  '--stack-depth': offsetIndex,
                } as CSSProperties}
              />
            );
          })}
        </div>
        {gallery.length > 1 && (
          <>
            <button
              type="button"
              className="gallery-nav-arrow gallery-nav-arrow-left"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevPhoto();
              }}
              aria-label="Previous photo"
            >
              ←
            </button>
            <button
              type="button"
              className="gallery-nav-arrow gallery-nav-arrow-right"
              onClick={(e) => {
                e.stopPropagation();
                handleNextPhoto();
              }}
              aria-label="Next photo"
            >
              →
            </button>
          </>
        )}
      </motion.div>
      <motion.div
        className="work-stack-copy work-stack-copy-right"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.28, ease: 'easeOut' }}
      >
        <p className="work-stack-meta">
          <strong>{(currentPhoto as any).label || `${props.project.role} / ${props.project.productType}`}</strong>
        </p>
        <p className="work-stack-description">{currentPhoto.caption}</p>
        {props.project.tags.length ? (
          <ul className="tag-list work-stack-tags" aria-label={`${props.project.title} tags`}>
            {props.project.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        ) : null}
      </motion.div>
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

function WorkPage(props: {
  projects: ProjectIndexItem[];
  onOpenProject: (projectId: string) => void;
}) {
  const [productTypeFilter, setProductTypeFilter] = useState(allLabel);
  const [roleFilter, setRoleFilter] = useState(allLabel);
  const [activeGroup, setActiveGroup] = useState('All');
  const [openFilter, setOpenFilter] = useState<'product' | 'role' | null>(null);
  const [stage, setStage] = useState<'hero' | 'content' | 'open'>('hero');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [manualProjectId, setManualProjectId] = useState<string | null>(null);
  const projectRefs = useRef<Record<string, HTMLElement | null>>({});
  const pendingOpenRef = useRef<number | null>(null);

  const productTypes = ['Advanced AI', 'B2B SaaS', 'Consumer Product'];
  const roles = ['Management', 'Design', 'Development'];
  const groups = ['All', 'Enterprise', 'Startup', 'Scale-up'];
  const productFilterLabel = productTypeFilter === allLabel ? 'Type' : productTypeFilter;
  const roleFilterLabel = roleFilter === allLabel ? 'Role' : roleFilter;
  const productTypeForProject = (project: ProjectIndexItem) => {
    if (
      project.tags.some((tag) => ['Codex', 'Python', 'Analytics', 'Computer Vision'].includes(tag)) ||
      ['Internal Tool', 'Automation', 'Data Analytics', 'Research', 'Robotics'].includes(project.productType)
    ) {
      return 'Advanced AI';
    }
    if (['Operations System', 'Growth Platform'].includes(project.productType)) {
      return 'B2B SaaS';
    }
    return 'Consumer Product';
  };
  const roleForProject = (project: ProjectIndexItem) => {
    if (project.role.includes('Management') || project.role.includes('Analyst') || project.role.includes('Delivery')) {
      return 'Management';
    }
    if (project.role.includes('Design') || project.role.includes('Computational')) {
      return 'Design';
    }
    return 'Development';
  };
  const groupForProject = (project: ProjectIndexItem) => {
    if (project.company === 'GE' || project.company === 'Gensler') {
      return 'Scale-up';
    }
    return project.scale === 'Federal' ? 'Enterprise' : project.scale;
  };

  const groupProjects = props.projects.filter((project) => {
    const matchesProductType = productTypeFilter === allLabel || productTypeForProject(project) === productTypeFilter;
    const matchesRole = roleFilter === allLabel || roleForProject(project) === roleFilter;
    const matchesGroup = activeGroup === 'All' || groupForProject(project) === activeGroup;
    return matchesProductType && matchesRole && matchesGroup;
  });
  const activeProjectId = expandedProjectId;
  const openProjectTray = (projectId: string, source: 'hover' | 'touch' | 'focus' = 'hover') => {
    if (projectId === expandedProjectId) {
      return;
    }

    if (source === 'touch' || source === 'hover' || source === 'focus') {
      setManualProjectId(projectId);
    }

    if (pendingOpenRef.current) {
      window.clearTimeout(pendingOpenRef.current);
    }

    setExpandedProjectId(null);
    pendingOpenRef.current = window.setTimeout(() => {
      setExpandedProjectId(projectId);
      pendingOpenRef.current = null;
    }, 180);
  };

  useEffect(() => {
    if (stage !== 'open') {
      return;
    }

    if (!groupProjects.length) {
      setExpandedProjectId(null);
      return;
    }

    if (manualProjectId && !groupProjects.some((project) => project.id === manualProjectId)) {
      setManualProjectId(null);
    }

    if (!pendingOpenRef.current && (!activeProjectId || !groupProjects.some((project) => project.id === activeProjectId))) {
      setExpandedProjectId(groupProjects[0].id);
    }
  }, [stage, activeProjectId, groupProjects, manualProjectId]);

  useEffect(() => {
    setManualProjectId(null);
  }, [productTypeFilter, roleFilter, activeGroup]);

  useEffect(() => {
    return () => {
      if (pendingOpenRef.current) {
        window.clearTimeout(pendingOpenRef.current);
      }
    };
  }, []);

  const heroWords = [
    "Hire", "Ali", "to", "Test", "Products,", 
    "Conceptualize", "Projects,", "and", "Launch", 
    "Concepts", "at", "10x."
  ];

  const delays: number[] = [];
  let currentDelay = 0;
  for (let i = 0; i < heroWords.length; i++) {
    delays.push(currentDelay);
    const word = heroWords[i];
    let stepDelay = 0.055; // Base delay
    if (word.endsWith(',')) {
      stepDelay = 0.24; // Longer pause at commas
    } else if (word.endsWith('.')) {
      stepDelay = 0.4; // Even longer pause at period
    }
    currentDelay += stepDelay;
  }
  const totalDuration = currentDelay;

  useEffect(() => {
    if (stage === 'hero') {
      const timer = setTimeout(() => {
        setStage('content');
      }, (totalDuration + 0.2) * 1000);
      return () => clearTimeout(timer);
    }
  }, [stage, totalDuration]);

  const wordVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: "easeOut"
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="work-page">
      <div className="work-hero">
        <motion.h1
          className="work-hero-title"
          initial="hidden"
          animate="visible"
        >
          {heroWords.map((word, idx) => {
            const isAt = word === "at";
            const isTenX = word === "10x.";

            if (isAt) {
              return (
                <span key={idx} style={{ display: 'inline-block', whiteSpace: 'nowrap', marginRight: '0.24em' }}>
                  <motion.span
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.34, delay: delays[idx], ease: "easeOut" }}
                    style={{ display: 'inline-block' }}
                  >
                    at
                  </motion.span>
                  {" "}
                  <motion.span
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.34, delay: delays[idx + 1], ease: "easeOut" }}
                    className="slant-highlight"
                  >
                    10x.
                  </motion.span>
                </span>
              );
            }

            if (isTenX) {
              return null;
            }

            return (
              <motion.span
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.34, delay: delays[idx], ease: "easeOut" }}
                style={{ display: 'inline-block', marginRight: '0.24em' }}
              >
                {word}
              </motion.span>
            );
          })}
        </motion.h1>
      </div>

      <motion.div
        variants={contentVariants}
        initial="hidden"
        animate={stage !== 'hero' ? 'visible' : 'hidden'}
        onAnimationComplete={() => {
          if (stage === 'content') {
            setTimeout(() => {
              setStage('open');
            }, 600);
          }
        }}
        style={{ width: '100%' }}
      >
        <section id="portfolio" className="landing-section landing-portfolio-section">
          <div className="work-filter-section">
            <div className="work-filter-grid">
              <div className="work-filter-dropdown">
                <button
                  type="button"
                  className={`work-filter-trigger ${openFilter === 'product' ? 'is-open' : ''}`}
                  aria-expanded={openFilter === 'product'}
                  aria-controls="work-product-filter"
                  onClick={() => setOpenFilter((current) => (current === 'product' ? null : 'product'))}
                >
                  {productFilterLabel}
                  <span aria-hidden="true">+</span>
                </button>
                <AnimatePresence initial={false}>
                  {openFilter === 'product' ? (
                    <motion.div
                      id="work-product-filter"
                      className="work-filter-menu"
                      initial={{height: 0, opacity: 0}}
                      animate={{height: 'auto', opacity: 1}}
                      exit={{height: 0, opacity: 0}}
                      transition={{duration: 0.22, ease: 'easeInOut'}}
                    >
                      {[allLabel, ...productTypes].map((type) => (
                        <button
                          key={type}
                          type="button"
                          className={`work-filter-option ${productTypeFilter === type ? 'is-active' : ''}`}
                          onClick={() => {
                            setProductTypeFilter(type);
                            setOpenFilter(null);
                          }}
                        >
                          {type === allLabel ? 'All Products' : type}
                        </button>
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="work-filter-dropdown">
                <button
                  type="button"
                  className={`work-filter-trigger ${openFilter === 'role' ? 'is-open' : ''}`}
                  aria-expanded={openFilter === 'role'}
                  aria-controls="work-role-filter"
                  onClick={() => setOpenFilter((current) => (current === 'role' ? null : 'role'))}
                >
                  {roleFilterLabel}
                  <span aria-hidden="true">+</span>
                </button>
                <AnimatePresence initial={false}>
                  {openFilter === 'role' ? (
                    <motion.div
                      id="work-role-filter"
                      className="work-filter-menu"
                      initial={{height: 0, opacity: 0}}
                      animate={{height: 'auto', opacity: 1}}
                      exit={{height: 0, opacity: 0}}
                      transition={{duration: 0.22, ease: 'easeInOut'}}
                    >
                      {[allLabel, ...roles].map((role) => (
                        <button
                          key={role}
                          type="button"
                          className={`work-filter-option ${roleFilter === role ? 'is-active' : ''}`}
                          onClick={() => {
                            setRoleFilter(role);
                            setOpenFilter(null);
                          }}
                        >
                          {role === allLabel ? 'All Roles' : role}
                        </button>
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="work-group-tabs">
                {groups.map((group) => (
                    <button
                      key={group}
                      type="button"
                      className={`eyebrow work-group-tab ${activeGroup === group ? 'is-active' : ''}`}
                      onClick={() => setActiveGroup(group)}
                    >
                      {group}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="landing-project-strip work-accordion" aria-label={`${activeGroup} projects`}>
            {!groupProjects.length ? (
              <p className="micro-copy empty-state">No projects match those filters.</p>
            ) : null}
            {groupProjects.map((project) => {
              const isExpanded = activeProjectId === project.id;

              return (
                <article
                  key={project.id}
                  id={`project-accordion-${project.id}`}
                  data-project-id={project.id}
                  ref={(element) => {
                    projectRefs.current[project.id] = element;
                  }}
                  className={`work-accordion-item ${isExpanded ? 'is-active' : ''}`}
                  onMouseEnter={() => openProjectTray(project.id, 'hover')}
                >
                  <button
                    type="button"
                    className="landing-project-row"
                    aria-expanded={isExpanded}
                    onFocus={() => openProjectTray(project.id, 'focus')}
                    onClick={() => {
                      openProjectTray(project.id, 'touch');
                    }}
                  >
                    <div className="project-row-details-grid">
                      <span>{project.company}</span>
                      <strong>{project.client}</strong>
                      <span>{project.productType}</span>
                    </div>
                  </button>
                  <AnimatePresence initial={false} mode="wait">
                    {isExpanded ? (
                      <motion.div
                        className="work-accordion-panel"
                        initial={{height: 0, opacity: 0}}
                        animate={{height: 'auto', opacity: 1}}
                        exit={{height: 0, opacity: 0}}
                        transition={{duration: 0.34, ease: 'easeInOut'}}
                      >
                        <WorkProjectStack
                          projects={props.projects}
                          project={project}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </article>
              );
            })}
          </div>
        </section>
      </motion.div>
    </div>
  );
}

function ResumePage() {
  const resumeStats = [
    {value: '$220M', label: 'enterprise project portfolio'},
    {value: '86%', label: 'safety risk model accuracy'},
    {value: '$11M', label: 'seed raise supported at huupe'},
    {value: '1,500', label: 'growth copy tests managed'},
  ];
  const resumeSections = [
    {id: 'resume-overview', label: 'Overview'},
    {id: 'resume-experience', label: 'Experience'},
    {id: 'resume-education', label: 'Education'},
    {id: 'resume-foundation', label: 'Foundation'},
    {id: 'resume-proof', label: 'Proof'},
  ];
  const [activeResumeSection, setActiveResumeSection] = useState(resumeSections[0].id);
  const [pinnedExperienceId, setPinnedExperienceId] = useState<string>('experience-0');
  const [expandedExperienceId, setExpandedExperienceId] = useState<string | null>('experience-0');
  const [pendingExperienceId, setPendingExperienceId] = useState<string | null>(null);
  const [hoveredExperienceId, setHoveredExperienceId] = useState<string | null>(null);

  const [pinnedEducationId, setPinnedEducationId] = useState<string>('education-0');
  const [expandedEducationId, setExpandedEducationId] = useState<string | null>('education-0');
  const [pendingEducationId, setPendingEducationId] = useState<string | null>(null);
  const [hoveredEducationId, setHoveredEducationId] = useState<string | null>(null);
  const [resumeFocusFilter, setResumeFocusFilter] = useState(allLabel);
  const [resumeSkillFilter, setResumeSkillFilter] = useState(allLabel);
  const [resumeEnvironmentFilter, setResumeEnvironmentFilter] = useState(allLabel);
  const [openResumeFilter, setOpenResumeFilter] = useState<'focus' | 'skill' | null>(null);

  const handleExperienceEnter = (id: string) => {
    setHoveredExperienceId(id);
    setPinnedExperienceId(id);
    if (id !== expandedExperienceId) {
      setPendingExperienceId(id);
      if (expandedExperienceId !== null) {
        setExpandedExperienceId(null);
      }
    }
  };

  const handleExperienceLeave = (id: string) => {
    setHoveredExperienceId(null);
    if (pinnedExperienceId !== id) {
      setPendingExperienceId(pinnedExperienceId);
      if (expandedExperienceId === id) {
        setExpandedExperienceId(null);
      }
    }
  };

  const handleEducationEnter = (id: string) => {
    setHoveredEducationId(id);
    setPinnedEducationId(id);
    if (id !== expandedEducationId) {
      setPendingEducationId(id);
      if (expandedEducationId !== null) {
        setExpandedEducationId(null);
      }
    }
  };

  const handleEducationLeave = (id: string) => {
    setHoveredEducationId(null);
    if (pinnedEducationId !== id) {
      setPendingEducationId(pinnedEducationId);
      if (expandedEducationId === id) {
        setExpandedEducationId(null);
      }
    }
  };

  // Work-style animated hero heading
  const heroWords = [
    "Ali", "transforms", "ambiguous", "technical", "programs", "into", "clear", "product", "decisions."
  ];

  const heroDelays: number[] = [];
  let heroCurrentDelay = 0;
  for (let i = 0; i < heroWords.length; i++) {
    heroDelays.push(heroCurrentDelay);
    const word = heroWords[i];
    let stepDelay = 0.055;
    if (word.endsWith(',')) {
      stepDelay = 0.24;
    } else if (word.endsWith('.')) {
      stepDelay = 0.4;
    }
    heroCurrentDelay += stepDelay;
  }

  const [resumeStage, setResumeStage] = useState<'hero' | 'content'>('hero');

  useEffect(() => {
    if (resumeStage === 'hero') {
      const timer = setTimeout(() => {
        setResumeStage('content');
      }, (heroCurrentDelay + 0.2) * 1000);
      return () => clearTimeout(timer);
    }
  }, [resumeStage, heroCurrentDelay]);

  // Unified Chronological Experience Items
  const experienceItems = [
    {
      title: 'Senior Analyst',
      company: 'WSP',
      period: 'Sept 2024 - Dec 2025',
      location: 'Washington, D.C.',
      tags: ['Advanced AI & ML'],
      skillSections: ['Programming', 'Data analytics', 'AI tools'],
      environment: 'Enterprise',
      skills: ['TypeScript', 'Codex', 'Python', 'Risk analytics'],
      bullets: [
        'Built an internal analytics tool with TypeScript and Codex to analyze emerging safety risks with 86% accuracy.',
        'Developed a machine learning workflow in Python that identified potential recalls with 79% success and supported $600k in renewals.',
      ]
    },
    {
      title: 'Analyst',
      company: 'WSP',
      period: 'Sept 2023 - Sept 2024',
      location: 'Washington, D.C.',
      tags: ['B2B SaaS Products'],
      skillSections: ['AI tools', 'Infrastructure'],
      environment: 'Enterprise',
      skills: ['Agile delivery', 'SharePoint', 'AI agents', 'Data models'],
      bullets: [
        'Tracked 14 resources through agile delivery to support safety risk training and improve project delivery speed by 80%.',
        'Researched system data models and taxonomy cleanup patterns to support a SharePoint AI agent workflow.',
      ]
    },
    {
      title: 'Junior Analyst',
      company: 'WSP',
      period: 'Sept 2022 - Sept 2023',
      location: 'Washington, D.C.',
      tags: ['B2B SaaS Products'],
      skillSections: ['Data analytics', 'Infrastructure'],
      environment: 'Enterprise',
      skills: ['Workflow automation', 'Clustering', 'Operations analysis'],
      bullets: [
        'Automated 12 reporting workflows using clustering and operational checkpoint analysis.',
        'Expanded report completeness by 25% to support more proactive operational measures.',
      ]
    },
    {
      title: 'Design Manager',
      company: 'LaunchGood',
      period: '2021 - 2022',
      location: 'Remote',
      tags: ['AR/VR/XR Ecosystems'],
      skillSections: ['AI tools', 'Programming'],
      environment: 'Scale-up',
      skills: ['Design systems', 'Figma', 'Notion', 'A/B testing'],
      bullets: [
        'Managed design systems to create unity between UX and customer engagement design processes.',
        'Met with design teams weekly to ensure consistency in Notion documentation with Figma embeds.',
        'Oversaw KPI development for brand performance using 1,500 copywriting A/B tests with Notion AI and Python.',
      ]
    },
    {
      title: 'Hardware Engineer',
      company: 'huupe',
      period: '2019 - 2022',
      location: 'New York, NY',
      tags: ['Consumer Hardware'],
      skillSections: ['Data analytics', 'AI tools'],
      environment: 'Startup',
      skills: ['Computer vision', 'LiDAR', '3D rendering', 'Technical briefs'],
      bullets: [
        'Designed computer vision workflows to assess vision black zones and improve 3D scope by 15% for LiDAR integration.',
        'Rendered 3D elements in a real-time engine to interpret athlete movement for AI-powered sporting goods.',
        'Supported founders with technical briefs and design renderings that helped close $11M in seed funding.',
      ]
    },
    {
      title: 'Architectural Designer',
      company: 'Norman Foster Foundation',
      period: '2019 - 2020',
      location: 'Madrid, Spain',
      tags: ['AR/VR/XR Ecosystems'],
      skillSections: ['Data analytics'],
      environment: 'Enterprise',
      skills: ['Urban systems', 'Research synthesis', 'MIT Media Lab'],
      bullets: [
        'Collaborated with Lord Norman Foster and MIT Media Lab on diagnosing slum dwelling worldwide for a sustainable alternative.',
        'Selected as one of ten global designers for the initiative.',
      ]
    },
    {
      title: 'Space Suit Engineer',
      company: 'NASA',
      period: '2018 - 2019',
      location: 'Houston, TX',
      tags: ['Consumer Hardware'],
      skillSections: ['Data analytics', 'AI tools'],
      environment: 'Enterprise',
      skills: ['Materials testing', 'Soft goods', 'Computer vision', 'HUD prototyping'],
      bullets: [
        'Focused on materials testing and мягкие goods hardware prototyping for self-egress.',
        'Trained computer vision models for object recognition integrated into space suit helmet heads-up displays.',
        'Prototyped soft goods hardware for self-egress implemented in a Mars suit cockpit.',
      ]
    },
    {
      title: 'AR Exhibits Engineer',
      company: 'Autodesk',
      period: '2017',
      location: 'San Francisco, CA',
      tags: ['AR/VR/XR Ecosystems'],
      skillSections: ['Programming'],
      environment: 'Enterprise',
      skills: ['Augmented reality', 'Exhibit systems', 'Product storytelling'],
      bullets: [
        'Worked on immersive product storytelling and exhibition experiences in augmented reality.',
      ]
    },
    {
      title: 'Design Engineer',
      company: 'Bragi',
      period: '2016 - 2017',
      location: 'Munich, Germany',
      tags: ['Consumer Hardware'],
      skillSections: ['Infrastructure'],
      environment: 'Startup',
      skills: ['Wearables', 'Interface design', 'Consumer IoT'],
      bullets: [
        'Designed soft and hard goods hardware interfaces for hearable technology and consumer IoT wearables.',
      ]
    },
    {
      title: 'Applied Innovation Engineer',
      company: 'Autodesk',
      period: '2016',
      location: 'San Francisco, CA',
      tags: ['AR/VR/XR Ecosystems'],
      skillSections: ['Programming', 'Data analytics'],
      environment: 'Enterprise',
      skills: ['Robotics', '3D printing', 'FEA animation', 'Executive demos'],
      bullets: [
        'Presented software functionality within a $4M software development effort directly to CEO Carl Bass.',
        'Tested design environments for a 15% UX optimization through robotics, 3D-print generation, and FEA animation.',
      ]
    }
  ];

  // Chronological Education Items
  const educationItems = [
    {
      title: 'Master of Architecture',
      company: 'Columbia University',
      period: '2020 - 2023',
      location: 'New York, NY',
      tags: ['AR/VR/XR Ecosystems'],
      skills: ['Architecture', 'Systems thinking', 'Design research'],
      bullets: [
        'Studied architecture at GSAPP, layering design culture and systems thinking onto an engineering foundation.',
      ]
    },
    {
      title: 'BS, Mechanical Engineering',
      company: 'The George Washington University',
      period: '2014 - 2018',
      location: 'Washington, D.C.',
      tags: ['Consumer Hardware'],
      skills: ['Mechanical engineering', 'Technical analysis', 'Prototyping'],
      bullets: [
        'Mechanical engineering training that grounded the technical side of the career before pivots into product and design.',
      ]
    }
  ];

  const resumeFocusOptions = Array.from(new Set(experienceItems.flatMap((item) => item.tags))).sort((left, right) =>
    left.localeCompare(right),
  );
  const resumeSkillOptions = Array.from(new Set(experienceItems.flatMap((item) => item.skillSections))).sort((left, right) =>
    left.localeCompare(right),
  );
  const resumeEnvironmentOptions = Array.from(new Set(experienceItems.map((item) => item.environment))).sort((left, right) =>
    left.localeCompare(right),
  );
  const filteredExperienceItems = experienceItems
    .map((item, idx) => ({item, itemId: `experience-${idx}`}))
    .filter(({item}) => {
      const focusMatches = resumeFocusFilter === allLabel || item.tags.includes(resumeFocusFilter);
      const skillMatches = resumeSkillFilter === allLabel || item.skillSections.includes(resumeSkillFilter);
      const environmentMatches = resumeEnvironmentFilter === allLabel || item.environment === resumeEnvironmentFilter;
      return focusMatches && skillMatches && environmentMatches;
    });
  const hasResumeFilter =
    resumeFocusFilter !== allLabel || resumeSkillFilter !== allLabel || resumeEnvironmentFilter !== allLabel;
  const resumeFocusFilterLabel = resumeFocusFilter === allLabel ? 'Focus Areas' : resumeFocusFilter;
  const resumeSkillFilterLabel = resumeSkillFilter === allLabel ? 'Skills' : resumeSkillFilter;
  useEffect(() => {
    const visibleIds = filteredExperienceItems.map(({itemId}) => itemId);
    const nextVisibleId = visibleIds[0] ?? null;

    setOpenResumeFilter(null);
    setPendingExperienceId(null);
    setHoveredExperienceId(null);

    if (!nextVisibleId) {
      setExpandedExperienceId(null);
      return;
    }

    setPinnedExperienceId((current) => (visibleIds.includes(current) ? current : nextVisibleId));
    setExpandedExperienceId((current) => (current && visibleIds.includes(current) ? current : nextVisibleId));
  }, [resumeFocusFilter, resumeSkillFilter, resumeEnvironmentFilter]);

  useEffect(() => {
    const sectionElements = resumeSections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!sectionElements.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleSection?.target.id) {
          setActiveResumeSection(visibleSection.target.id);
        }
      },
      {
        rootMargin: '-28% 0px -42% 0px',
        threshold: [0.2, 0.45, 0.7],
      },
    );

    sectionElements.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [resumeStage]);

  return (
    <div className="resume-page">
      <nav className="resume-section-nav" aria-label="Resume sections">
        {resumeSections.map((section, index) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={activeResumeSection === section.id ? 'step' : undefined}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            {section.label}
          </a>
        ))}
      </nav>

      <section id="resume-overview" className="resume-hero resume-snap-section panel-first">
        <div className="work-hero" style={{width: '100%', padding: '0 0 24px'}}>
          <motion.h1
            className="resume-hero-title"
            initial="hidden"
            animate="visible"
          >
            {heroWords.map((word, idx) => {
              const isTransforms = word === "transforms";

              return (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.34, delay: heroDelays[idx], ease: "easeOut" }}
                  className={isTransforms ? 'slant-highlight' : undefined}
                  style={{ display: 'inline-block', marginRight: '0.24em' }}
                >
                  {word}
                </motion.span>
              );
            })}
          </motion.h1>
        </div>

      </section>

      <motion.div
        className={`resume-content-flow ${resumeStage !== 'hero' ? 'is-visible' : ''}`}
        initial={{opacity: 0, y: 16}}
        animate={resumeStage !== 'hero' ? {opacity: 1, y: 0} : {opacity: 0, y: 16}}
        transition={{duration: 0.7, ease: 'easeInOut'}}
        style={{pointerEvents: resumeStage !== 'hero' ? 'auto' : 'none'}}
        aria-hidden={resumeStage === 'hero'}
      >
          <div className="resume-work-filter-section home-fade-item" aria-label="Filter experience">
              <div className="work-filter-grid">
                <div className="work-filter-dropdown">
                  <button
                    type="button"
                    className={`work-filter-trigger ${openResumeFilter === 'focus' ? 'is-open' : ''}`}
                    aria-expanded={openResumeFilter === 'focus'}
                    aria-controls="resume-focus-filter"
                    onClick={() => setOpenResumeFilter((current) => (current === 'focus' ? null : 'focus'))}
                  >
                    {resumeFocusFilterLabel}
                    <span aria-hidden="true">+</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {openResumeFilter === 'focus' ? (
                      <motion.div
                        id="resume-focus-filter"
                        className="work-filter-menu"
                        initial={{height: 0, opacity: 0}}
                        animate={{height: 'auto', opacity: 1}}
                        exit={{height: 0, opacity: 0}}
                        transition={{duration: 0.22, ease: 'easeInOut'}}
                      >
                        {[allLabel, ...resumeFocusOptions].map((area) => (
                          <button
                            key={area}
                            type="button"
                            className={`work-filter-option ${resumeFocusFilter === area ? 'is-active' : ''}`}
                            onClick={() => {
                              setResumeFocusFilter(area);
                              setOpenResumeFilter(null);
                            }}
                          >
                            {area === allLabel ? 'Focus Areas' : area}
                          </button>
                        ))}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                <div className="work-filter-dropdown">
                  <button
                    type="button"
                    className={`work-filter-trigger ${openResumeFilter === 'skill' ? 'is-open' : ''}`}
                    aria-expanded={openResumeFilter === 'skill'}
                    aria-controls="resume-skill-filter"
                    onClick={() => setOpenResumeFilter((current) => (current === 'skill' ? null : 'skill'))}
                  >
                    {resumeSkillFilterLabel}
                    <span aria-hidden="true">+</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {openResumeFilter === 'skill' ? (
                      <motion.div
                        id="resume-skill-filter"
                        className="work-filter-menu"
                        initial={{height: 0, opacity: 0}}
                        animate={{height: 'auto', opacity: 1}}
                        exit={{height: 0, opacity: 0}}
                        transition={{duration: 0.22, ease: 'easeInOut'}}
                      >
                        {[allLabel, ...resumeSkillOptions].map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            className={`work-filter-option ${resumeSkillFilter === skill ? 'is-active' : ''}`}
                            onClick={() => {
                              setResumeSkillFilter(skill);
                              setOpenResumeFilter(null);
                            }}
                          >
                            {skill === allLabel ? 'Skills' : skill}
                          </button>
                        ))}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                <div className="work-group-tabs" aria-label="Filter experience by environment">
                  {[allLabel, ...resumeEnvironmentOptions].map((environment) => (
                    <button
                      key={environment}
                      type="button"
                      className={`eyebrow work-group-tab ${resumeEnvironmentFilter === environment ? 'is-active' : ''}`}
                      onClick={() => {
                        setResumeEnvironmentFilter(environment);
                        setOpenResumeFilter(null);
                      }}
                    >
                      {environment}
                    </button>
                  ))}
                </div>
              </div>
              {hasResumeFilter ? (
                <div className="resume-filter-status">
                  <button
                    type="button"
                    className="resume-filter-reset"
                    onClick={() => {
                      setResumeFocusFilter(allLabel);
                      setResumeSkillFilter(allLabel);
                      setResumeEnvironmentFilter(allLabel);
                      setOpenResumeFilter(null);
                    }}
                  >
                    Clear
                  </button>
                </div>
              ) : null}
            </div>

          <section id="resume-experience" className="resume-section resume-snap-section">
            <h3 className="resume-section-label">Experience</h3>
            <div className="landing-project-strip work-accordion home-fade-list" style={{borderLeft: 'none', borderRight: 'none'}}>
              {filteredExperienceItems.map(({item, itemId}) => {
                const isExpanded = expandedExperienceId === itemId;

                return (
                  <article
                    key={itemId}
                    className={`work-accordion-item ${isExpanded ? 'is-active' : ''}`}
                    style={{borderTop: 'none'}}
                    onMouseEnter={() => handleExperienceEnter(itemId)}
                    onMouseLeave={() => handleExperienceLeave(itemId)}
                  >
                    <button
                      type="button"
                      className="landing-project-row"
                      aria-expanded={isExpanded}
                      onClick={() => {
                        setPinnedExperienceId(itemId);
                      }}
                      style={{width: '100%', padding: '16px 0'}}
                    >
                      <div className="project-row-details-grid">
                        <span className="resume-row-meta">
                          <span>{item.period}</span>
                          <span>{item.location}</span>
                        </span>
                        <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease',
                              opacity: 0.5,
                              flexShrink: 0
                            }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                          {item.title}
                        </strong>
                        <span style={{textAlign: 'right'}}>
                          {item.company}
                        </span>
                        {item.tags && (
                          <div className="resume-item-tags">
                            {item.tags.map((tag) => (
                              <span key={tag} className="resume-tag">{tag}</span>
                            ))}
                            {isExpanded ? (
                              <div className="resume-item-skills" aria-label={`${item.title} skills`}>
                                {item.skills.map((skill) => (
                                  <span key={skill}>{skill}</span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </button>
                    <AnimatePresence
                      initial={false}
                      mode="wait"
                      onExitComplete={() => {
                        setPendingExperienceId((currentPending) => {
                          if (currentPending) {
                            setExpandedExperienceId(currentPending);
                          }
                          return null;
                        });
                      }}
                    >
                      {isExpanded ? (
                        <motion.div
                          className="work-accordion-panel"
                          initial={{height: 0, opacity: 0}}
                          animate={{
                            height: 'auto',
                            opacity: 1,
                            transition: {
                              height: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
                              opacity: { duration: 0.2 }
                            }
                          }}
                          exit={{
                            height: 0,
                            opacity: 0,
                            transition: {
                              height: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
                              opacity: { duration: 0.15 }
                            }
                          }}
                          style={{padding: '16px 0 24px'}}
                        >
                          <div style={{padding: '0 16px'}}>
                            <ul className="bullet-list resume-subline-list home-fade-list" style={{margin: 0, paddingLeft: '20px'}}>
                              {item.bullets.map((bullet, bulletIdx) => (
                                <li key={bulletIdx}>
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </article>
                );
              })}
              {!filteredExperienceItems.length ? (
                <p className="resume-filter-empty">No experience items match those filters.</p>
              ) : null}
            </div>
          </section>

          <section id="resume-education" className="resume-section resume-snap-section">
            <h3 className="resume-section-label">Education</h3>
            <div className="landing-project-strip work-accordion home-fade-list" style={{borderLeft: 'none', borderRight: 'none'}}>
              {educationItems.map((item, idx) => {
                const itemId = `education-${idx}`;
                const isExpanded = expandedEducationId === itemId;

                return (
                  <article
                    key={itemId}
                    className={`work-accordion-item ${isExpanded ? 'is-active' : ''}`}
                    style={{borderTop: 'none'}}
                    onMouseEnter={() => handleEducationEnter(itemId)}
                    onMouseLeave={() => handleEducationLeave(itemId)}
                  >
                    <button
                      type="button"
                      className="landing-project-row"
                      aria-expanded={isExpanded}
                      onClick={() => {
                        setPinnedEducationId(itemId);
                      }}
                      style={{width: '100%', padding: '16px 0'}}
                    >
                      <div className="project-row-details-grid">
                        <span className="resume-row-meta">
                          <span>{item.period}</span>
                          <span>{item.location}</span>
                        </span>
                        <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease',
                              opacity: 0.5,
                              flexShrink: 0
                            }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                          {item.title}
                        </strong>
                        <span style={{textAlign: 'right'}}>
                          {item.company}
                        </span>
                        {item.tags && (
                          <div className="resume-item-tags">
                            {item.tags.map((tag) => (
                              <span key={tag} className="resume-tag">{tag}</span>
                            ))}
                            {isExpanded ? (
                              <div className="resume-item-skills" aria-label={`${item.title} skills`}>
                                {item.skills.map((skill) => (
                                  <span key={skill}>{skill}</span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </button>
                    <AnimatePresence
                      initial={false}
                      mode="wait"
                      onExitComplete={() => {
                        setPendingEducationId((currentPending) => {
                          if (currentPending) {
                            setExpandedEducationId(currentPending);
                          }
                          return null;
                        });
                      }}
                    >
                      {isExpanded ? (
                        <motion.div
                          className="work-accordion-panel"
                          initial={{height: 0, opacity: 0}}
                          animate={{
                            height: 'auto',
                            opacity: 1,
                            transition: {
                              height: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
                              opacity: { duration: 0.2 }
                            }
                          }}
                          exit={{
                            height: 0,
                            opacity: 0,
                            transition: {
                              height: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
                              opacity: { duration: 0.15 }
                            }
                          }}
                          style={{padding: '16px 0 24px'}}
                        >
                          <div style={{padding: '0 16px'}}>
                            <ul className="bullet-list resume-subline-list home-fade-list" style={{margin: 0, paddingLeft: '20px'}}>
                              {item.bullets.map((bullet, bulletIdx) => (
                                <li key={bulletIdx}>
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </article>
                );
              })}
            </div>
          </section>

          <section id="resume-foundation" className="resume-section resume-snap-section">
            <h3 className="resume-section-label">Foundation</h3>
            <div className="resume-role-grid home-fade-list">
              <article className="resume-role" style={{display: 'grid', alignContent: 'start', gap: '16px', padding: '18px'}}>
                <h3>Recognition</h3>
                <ul className="bullet-list" style={{margin: 0, paddingLeft: '20px'}}>
                  {profile.resume.honors.map((honor) => (
                    <li key={honor} style={{color: 'var(--portfolio-muted)'}}>{honor}</li>
                  ))}
                </ul>
              </article>
              <article className="resume-role" style={{display: 'grid', alignContent: 'start', gap: '16px', padding: '18px'}}>
                <h3>Certifications</h3>
                <ul className="bullet-list" style={{margin: 0, paddingLeft: '20px'}}>
                  {profile.resume.certifications.map((cert) => (
                    <li key={cert} style={{color: 'var(--portfolio-muted)'}}>{cert}</li>
                  ))}
                </ul>
              </article>
            </div>
          </section>

          <section id="resume-proof" className="resume-snap-section resume-proof-section" aria-label="Career proof points">
            <h3 className="resume-section-label">Proof</h3>
            <div className="resume-proof-grid home-fade-list">
              {resumeStats.map((stat) => (
                <article key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </div>
          </section>
      </motion.div>
    </div>
  );
}

function WritingPage() {
  const [writingStage, setWritingStage] = useState<'hero' | 'content'>('hero');
  const [writingTopicFilter, setWritingTopicFilter] = useState(allLabel);
  const [writingTypeFilter, setWritingTypeFilter] = useState(allLabel);
  const [openWritingFilter, setOpenWritingFilter] = useState<'topic' | 'type' | null>(null);
  const heroWords = ['Writing', 'on', 'AI', 'Interfaces,', 'Operations,', 'and', 'Computer-Aided', 'Work.'];
  const heroDelays: number[] = [];
  let heroCurrentDelay = 0;

  for (let i = 0; i < heroWords.length; i++) {
    heroDelays.push(heroCurrentDelay);
    const word = heroWords[i];
    let stepDelay = 0.055;
    if (word.endsWith(',')) {
      stepDelay = 0.24;
    } else if (word.endsWith('.')) {
      stepDelay = 0.4;
    }
    heroCurrentDelay += stepDelay;
  }

  useEffect(() => {
    if (writingStage === 'hero') {
      const timer = setTimeout(() => {
        setWritingStage('content');
      }, (heroCurrentDelay + 0.2) * 1000);
      return () => clearTimeout(timer);
    }
  }, [writingStage, heroCurrentDelay]);

  const writingItems = substackPosts.map((post) => ({
    ...post,
    topic: post.title.includes('MetroBus') ? 'Operations' : 'AI Interfaces',
    type: post.description.toLowerCase().includes('project') ? 'Project Notes' : 'Essay',
  }));
  const writingTopics = Array.from(new Set(writingItems.map((post) => post.topic))).sort((left, right) =>
    left.localeCompare(right),
  );
  const writingTypes = Array.from(new Set(writingItems.map((post) => post.type))).sort((left, right) =>
    left.localeCompare(right),
  );
  const filteredWritingItems = writingItems.filter((post) => {
    const topicMatches = writingTopicFilter === allLabel || post.topic === writingTopicFilter;
    const typeMatches = writingTypeFilter === allLabel || post.type === writingTypeFilter;
    return topicMatches && typeMatches;
  });
  const writingTopicFilterLabel = writingTopicFilter === allLabel ? 'Topics' : writingTopicFilter;
  const writingTypeFilterLabel = writingTypeFilter === allLabel ? 'Types' : writingTypeFilter;
  const hasWritingFilter = writingTopicFilter !== allLabel || writingTypeFilter !== allLabel;

  return (
    <div className="writing-page">
      <section className="work-hero writing-hero-section">
        <motion.h1
          className="work-hero-title"
          initial="hidden"
          animate="visible"
        >
          {heroWords.map((word, idx) => {
            const isComputer = word === 'Computer-Aided';
            const isWork = word === 'Work.';

            if (isComputer) {
              return (
                <span key={idx} style={{ display: 'inline-block', whiteSpace: 'nowrap', marginRight: '0.24em' }}>
                  <motion.span
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.34, delay: heroDelays[idx], ease: 'easeOut' }}
                    style={{ display: 'inline-block' }}
                  >
                    Computer-Aided
                  </motion.span>
                  {' '}
                  <motion.span
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.34, delay: heroDelays[idx + 1], ease: 'easeOut' }}
                    className="slant-highlight"
                  >
                    Work.
                  </motion.span>
                </span>
              );
            }

            if (isWork) {
              return null;
            }

            return (
              <motion.span
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.34, delay: heroDelays[idx], ease: 'easeOut' }}
                style={{ display: 'inline-block', marginRight: '0.24em' }}
              >
                {word}
              </motion.span>
            );
          })}
        </motion.h1>
      </section>

      <motion.div
        className={`writing-content-flow ${writingStage !== 'hero' ? 'is-visible' : ''}`}
        initial={{opacity: 0, y: 16}}
        animate={writingStage !== 'hero' ? {opacity: 1, y: 0} : {opacity: 0, y: 16}}
        transition={{duration: 0.7, ease: 'easeInOut'}}
        style={{pointerEvents: writingStage !== 'hero' ? 'auto' : 'none'}}
        aria-hidden={writingStage === 'hero'}
      >
        <div className="writing-filter-section home-fade-item" aria-label="Filter writing">
          <div className="work-filter-grid">
            <div className="work-filter-dropdown">
              <button
                type="button"
                className={`work-filter-trigger ${openWritingFilter === 'topic' ? 'is-open' : ''}`}
                aria-expanded={openWritingFilter === 'topic'}
                aria-controls="writing-topic-filter"
                onClick={() => setOpenWritingFilter((current) => (current === 'topic' ? null : 'topic'))}
              >
                {writingTopicFilterLabel}
                <span aria-hidden="true">+</span>
              </button>
              <AnimatePresence initial={false}>
                {openWritingFilter === 'topic' ? (
                  <motion.div
                    id="writing-topic-filter"
                    className="work-filter-menu"
                    initial={{height: 0, opacity: 0}}
                    animate={{height: 'auto', opacity: 1}}
                    exit={{height: 0, opacity: 0}}
                    transition={{duration: 0.22, ease: 'easeInOut'}}
                  >
                    {[allLabel, ...writingTopics].map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        className={`work-filter-option ${writingTopicFilter === topic ? 'is-active' : ''}`}
                        onClick={() => {
                          setWritingTopicFilter(topic);
                          setOpenWritingFilter(null);
                        }}
                      >
                        {topic === allLabel ? 'Topics' : topic}
                      </button>
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="work-filter-dropdown">
              <button
                type="button"
                className={`work-filter-trigger ${openWritingFilter === 'type' ? 'is-open' : ''}`}
                aria-expanded={openWritingFilter === 'type'}
                aria-controls="writing-type-filter"
                onClick={() => setOpenWritingFilter((current) => (current === 'type' ? null : 'type'))}
              >
                {writingTypeFilterLabel}
                <span aria-hidden="true">+</span>
              </button>
              <AnimatePresence initial={false}>
                {openWritingFilter === 'type' ? (
                  <motion.div
                    id="writing-type-filter"
                    className="work-filter-menu"
                    initial={{height: 0, opacity: 0}}
                    animate={{height: 'auto', opacity: 1}}
                    exit={{height: 0, opacity: 0}}
                    transition={{duration: 0.22, ease: 'easeInOut'}}
                  >
                    {[allLabel, ...writingTypes].map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`work-filter-option ${writingTypeFilter === type ? 'is-active' : ''}`}
                        onClick={() => {
                          setWritingTypeFilter(type);
                          setOpenWritingFilter(null);
                        }}
                      >
                        {type === allLabel ? 'Types' : type}
                      </button>
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
          {hasWritingFilter ? (
            <div className="writing-filter-status">
              <button
                type="button"
                className="resume-filter-reset"
                onClick={() => {
                  setWritingTopicFilter(allLabel);
                  setWritingTypeFilter(allLabel);
                  setOpenWritingFilter(null);
                }}
              >
                Clear
              </button>
            </div>
          ) : null}
        </div>

        <section className="writing-archive">
          <div className="writing-row-list home-fade-list">
            {filteredWritingItems.map((post) => (
              <article key={post.url} className="writing-row-item">
                <a
                  href={post.url}
                  target="_blank"
                  rel="noreferrer"
                  className="writing-row-trigger"
                  style={{textDecoration: 'none'}}
                >
                  <span>{formatLongDate(post.publishedAt)}</span>
                  <strong>
                    {post.title}
                  </strong>
                </a>
              </article>
            ))}
            {!filteredWritingItems.length ? (
              <p className="micro-copy empty-state">No writing matches those filters.</p>
            ) : null}
          </div>
        </section>
      </motion.div>
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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    setIsMobileMenuOpen(false);
    const nextView = route ? routeDefaultView[route] : 'index';
    if (route === '/portfolio' || route === '/projects' || route === '/work') {
      setViewMode(nextView);
    }
    
    if (route === '/work') {
      document.body.classList.add('work-page-active');
    } else {
      document.body.classList.remove('work-page-active');
    }

    if (route === '/resume') {
      document.body.classList.add('resume-page-active');
    } else {
      document.body.classList.remove('resume-page-active');
    }

    if (route === '/writing') {
      document.body.classList.add('writing-page-active');
    } else {
      document.body.classList.remove('writing-page-active');
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
  const isWorkRoute = route === '/work';

  return (
    <div className={`site-shell ${usesPortfolioShell ? 'site-shell--portfolio' : ''} ${isWorkRoute ? 'site-shell--work' : ''}`}>
      <header className="topbar">
        <div className="topbar-inner">
          <SmartLink href="/" className="wordmark">
            {profile.name}
          </SmartLink>
          <button 
            className="mobile-menu-toggle eyebrow"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? 'Close' : 'Menu'}
          </button>
          <nav className={`topnav ${isMobileMenuOpen ? 'is-open' : ''}`} aria-label="Primary">
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
      {route !== '/' ? <Footer route={route} /> : null}
    </div>
  );
}

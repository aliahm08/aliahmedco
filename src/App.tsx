import {CSSProperties, PointerEvent, ReactNode, startTransition, useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import Footer from './components/Footer';
import {useSeo} from './components/Seo';
import {substackPosts} from './content/substackPosts';
import {profile} from './content/profile';
import {AppRoute, navItems, ProjectRoute, routeMeta, RouteMeta, SiteRoute, site} from './content/site';
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
  '/work/classified-shoe-design-nomads-nobles': 'groups',
  '/resume': 'index',
  '/writing': 'index',
};

function defaultViewForRoute(route: SiteRoute | null): ViewMode {
  return route && route in routeDefaultView ? routeDefaultView[route as AppRoute] : 'index';
}

const proposalProjectId = 'nomads-nobles-classified-shoe-design';
const proposalRoute = '/work/classified-shoe-design-nomads-nobles' as const;

function projectPath(projectId: string): ProjectRoute {
  return projectId === proposalProjectId ? proposalRoute : `/work/${projectId}`;
}

function getProjectRouteId(route: SiteRoute | null) {
  if (!route || !route.startsWith('/work/') || route === proposalRoute) {
    return null;
  }

  return route.slice('/work/'.length);
}

function normalizeRoute(pathname: string): SiteRoute | null {
  const normalizedPathname = pathname !== '/' ? pathname.replace(/\/+$/, '') : pathname;

  if (normalizedPathname === '/projects') {
    return '/work';
  }

  if (
    normalizedPathname === '/' ||
    normalizedPathname === '/portfolio' ||
    normalizedPathname === '/work' ||
    normalizedPathname === '/work/classified-shoe-design-nomads-nobles' ||
    normalizedPathname === '/resume' ||
    normalizedPathname === '/writing'
  ) {
    return normalizedPathname;
  }

  if (/^\/work\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedPathname)) {
    return normalizedPathname as ProjectRoute;
  }

  return null;
}

function navigateTo(route: SiteRoute) {
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

function ProjectDetailPage(props: {
  project: ProjectIndexItem;
  projects: ProjectIndexItem[];
}) {
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [detailError, setDetailError] = useState('');
  const [activeProjectSection, setActiveProjectSection] = useState('project-overview');

  useEffect(() => {
    const controller = new AbortController();
    setDetail(null);
    setDetailError('');

    loadProjectDetail(props.project.id, controller.signal)
      .then(setDetail)
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setDetailError('This project page could not be loaded.');
      });

    return () => controller.abort();
  }, [props.project.id]);

  const projectIndex = props.projects.findIndex((project) => project.id === props.project.id);
  const previousProject = projectIndex > 0 ? props.projects[projectIndex - 1] : null;
  const nextProject = projectIndex >= 0 && projectIndex < props.projects.length - 1
    ? props.projects[projectIndex + 1]
    : null;
  const heroImage = detail?.gallery[0];
  const projectSections = [
    {id: 'project-overview', label: 'Overview'},
    {id: 'project-details', label: 'Details'},
    ...(detail
      ? [
          {id: 'project-story', label: 'Story'},
          {id: 'project-contributions', label: 'Contributions'},
          ...(detail.gallery.length > 1 ? [{id: 'project-gallery', label: 'Gallery'}] : []),
          {id: 'project-capabilities', label: 'Capabilities'},
        ]
      : []),
  ];

  useEffect(() => {
    setActiveProjectSection('project-overview');

    const sectionElements = projectSections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!sectionElements.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visibleSection?.target.id) {
          setActiveProjectSection(visibleSection.target.id);
        }
      },
      {
        rootMargin: '-24% 0px -52% 0px',
        threshold: [0, 0.2, 0.45, 0.7],
      },
    );

    sectionElements.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [detail, props.project.id]);

  return (
    <article className="project-detail-page" style={{'--project-detail-accent': props.project.accent} as CSSProperties}>
      <aside className="project-section-nav" aria-label="Project sections">
        <p>Project sections</p>
        <nav>
          {projectSections.map((section, index) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`project-section-nav-item${activeProjectSection === section.id ? ' is-active' : ''}`}
              aria-current={activeProjectSection === section.id ? 'location' : undefined}
              onClick={() => setActiveProjectSection(section.id)}
            >
              <i aria-hidden="true" />
              <span><small>{String(index + 1).padStart(2, '0')}</small>{section.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      <header id="project-overview" className="project-detail-hero">
        <a
          href="/work"
          className="project-detail-back"
          onClick={(event) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
              return;
            }
            event.preventDefault();
            navigateTo('/work');
          }}
        >
          <span aria-hidden="true">←</span> All work
        </a>
        <div className="project-detail-kicker">
          <span>{props.project.company}</span>
          <span>{props.project.year}</span>
          <span>{props.project.location}</span>
        </div>
        <h1>{props.project.title}</h1>
        <p className="project-detail-headline">{detail?.headline ?? props.project.teaser}</p>
      </header>

      <section className={`project-detail-hero-media ${heroImage ? 'has-image' : ''}`} aria-label="Project cover image">
        {heroImage ? (
          <img src={heroImage.src} alt={heroImage.alt || `${props.project.title} project cover`} />
        ) : (
          <GeneratedProjectImage project={props.project} imageIndex={0} imageSrc={props.project.poster} />
        )}
      </section>

      <section id="project-details" className="project-detail-facts" aria-label="Project facts">
        <dl>
          <div><dt>Client</dt><dd>{props.project.client}</dd></div>
          <div><dt>Type</dt><dd>{props.project.productType}</dd></div>
          <div><dt>Role</dt><dd>{props.project.role}</dd></div>
          <div><dt>Scale</dt><dd>{props.project.scale}</dd></div>
        </dl>
        <div className="project-detail-metrics">
          {props.project.metrics.map((metric) => (
            <div key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
      </section>

      {detailError ? <p className="empty-state">{detailError}</p> : null}
      {!detail && !detailError ? <p className="project-detail-loading">Loading project details…</p> : null}

      {detail ? (
        <>
          <section id="project-story" className="project-detail-story">
            <div>
              <p className="eyebrow">The challenge</p>
              <p>{detail.challenge}</p>
            </div>
            <div>
              <p className="eyebrow">The outcome</p>
              <p>{detail.outcome}</p>
            </div>
          </section>

          <section id="project-contributions" className="project-detail-contributions">
            <p className="eyebrow">Selected contributions</p>
            <ol>
              {detail.bullets.map((bullet, index) => (
                <li key={bullet}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <p>{bullet}</p>
                </li>
              ))}
            </ol>
          </section>

          {detail.gallery.length > 1 ? (
            <section id="project-gallery" className="project-detail-gallery" aria-label={`${props.project.title} gallery`}>
              {detail.gallery.slice(1).map((image, index) => (
                <figure key={`${image.src}-${index}`} className={index % 2 ? 'is-offset' : ''}>
                  <div className="project-detail-gallery-image">
                    <img src={image.src} alt={image.alt || image.title || `${props.project.title} image ${index + 2}`} />
                  </div>
                  <figcaption>
                    <span>{image.label ?? `Project view ${String(index + 2).padStart(2, '0')}`}</span>
                    <strong>{image.title ?? props.project.title}</strong>
                    <p>{image.caption}</p>
                  </figcaption>
                </figure>
              ))}
            </section>
          ) : null}

          <section id="project-capabilities" className="project-detail-capabilities">
            <p className="eyebrow">Capabilities</p>
            <ul>
              {detail.capabilities.map((capability) => <li key={capability}>{capability}</li>)}
            </ul>
          </section>
        </>
      ) : null}

      <nav className="project-detail-pagination" aria-label="Project navigation">
        {previousProject ? (
          <a
            href={projectPath(previousProject.id)}
            onClick={(event) => {
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              navigateTo(projectPath(previousProject.id));
            }}
          >
            <span>Previous project</span>
            <strong>← {previousProject.title}</strong>
          </a>
        ) : <span />}
        {nextProject ? (
          <a
            href={projectPath(nextProject.id)}
            onClick={(event) => {
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              navigateTo(projectPath(nextProject.id));
            }}
          >
            <span>Next project</span>
            <strong>{nextProject.title} →</strong>
          </a>
        ) : <span />}
      </nav>
    </article>
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

  const openProposals = props.projects.filter((project) =>
    project.metrics.some((metric) => metric.label === 'Status' && metric.value === 'Proposal'),
  );
  const portfolioProjects = props.projects.filter((project) =>
    !openProposals.some((proposal) => proposal.id === project.id),
  );
  const groupProjects = portfolioProjects.filter((project) => {
    const matchesProductType = productTypeFilter === allLabel || productTypeForProject(project) === productTypeFilter;
    const matchesRole = roleFilter === allLabel || roleForProject(project) === roleFilter;
    const matchesGroup = activeGroup === 'All' || groupForProject(project) === activeGroup;
    return matchesProductType && matchesRole && matchesGroup;
  });
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
            {props.projects.length > 0 && !groupProjects.length ? (
              <p className="micro-copy empty-state">No projects match those filters.</p>
            ) : null}
            {groupProjects.map((project) => (
                <article
                  key={project.id}
                  data-project-id={project.id}
                  className="work-accordion-item"
                >
                  <button
                    type="button"
                    className="landing-project-row"
                    aria-label={`View ${project.title} project page`}
                    onClick={() => props.onOpenProject(project.id)}
                  >
                    <div className="project-row-details-grid">
                      <span>{project.company}</span>
                      <strong>{project.client}</strong>
                      <span>{project.productType} <i className="project-row-arrow" aria-hidden="true">→</i></span>
                    </div>
                  </button>
                </article>
            ))}
          </div>

          {openProposals.length ? (
            <section className="work-open-proposals" aria-labelledby="open-proposals-heading">
              <header className="work-open-proposals-header">
                <h2 id="open-proposals-heading">Open Proposals</h2>
                <span>{String(openProposals.length).padStart(2, '0')}</span>
              </header>
              <ul className="work-open-proposals-list">
                {openProposals.map((proposal) => (
                  <li key={proposal.id}>
                    <button
                      type="button"
                      className="work-open-proposal-row"
                      onClick={() => navigateTo('/work/classified-shoe-design-nomads-nobles')}
                    >
                      <span>{proposal.company}</span>
                      <strong>{proposal.title}</strong>
                      <span className="work-open-proposal-action">View proposal <i aria-hidden="true">→</i></span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </section>
      </motion.div>
    </div>
  );
}

function ShoeDesignProposalPage() {
  const [selectedApproachId, setSelectedApproachId] = useState('fully-custom');
  const [builderStep, setBuilderStep] = useState(0);
  const scopeSectionRef = useRef<HTMLDivElement>(null);
  const developmentSectionRef = useRef<HTMLDivElement>(null);
  const estimateSectionRef = useRef<HTMLDivElement>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState(['design', 'prototyping', 'engineering']);
  const [selectedAdditionalServiceIds, setSelectedAdditionalServiceIds] = useState<string[]>([]);
  const [estimateConfirmed, setEstimateConfirmed] = useState(false);
  const developmentPhases = [
    {
      id: 'design',
      number: '01',
      name: 'Design',
      months: 6,
      fee: 60000,
      build: '0–15% build',
      monthly: '$10,000 / month',
      duration: '6 months',
      total: '$60,000 total services',
      description: 'Establish the product vision and resolve it into a launch-ready design package that can enter physical development.',
      deliveries: [
        'Creative direction and intended-wearer definition',
        'Concept system, silhouette, materials, color, and signature details',
        'Design development, technical views, and decision documentation',
        'Launch-ready design handoff for prototyping',
      ],
    },
    {
      id: 'prototyping',
      number: '02',
      name: 'Prototyping',
      months: 8,
      fee: 120000,
      build: '15–30% build',
      monthly: '$15,000 / month',
      duration: '8 months',
      total: '$120,000 total services',
      description: 'Turn the approved design into physical prototypes, using material, construction, fit, and wear feedback to identify the right product direction.',
      deliveries: [
        'Prototype strategy, technical brief, and specialist team',
        'Material and construction trials',
        'Physical prototype rounds and documented reviews',
        'Fit, comfort, wear, and visual validation',
        'Approved prototype and engineering requirements',
      ],
    },
    {
      id: 'engineering',
      number: '03',
      name: 'Engineering',
      months: 10,
      fee: 200000,
      build: '30–75% build',
      monthly: '$20,000 / month',
      duration: '10 months',
      total: '$200,000 total services',
      description: 'Work with model makers and production specialists to engineer the ideal shoe into a reproducible, quality-controlled, and shippable product.',
      deliveries: [
        'Model-maker coordination and engineered footwear architecture',
        'Last, outsole, upper, pattern, and component resolution',
        'Production tech pack, bill of materials, tolerances, and grading',
        'Size-set, fit, durability, and production validation',
        'Manufacturer-ready package and sealed production standard',
      ],
    },
  ];
  const traditionalFirmRoutes = [
    {
      id: 'private-label',
      name: 'Private-label existing shoe',
      development: '$10,000–$30,000',
      inventory: '$10,000–$40,000',
      total: '$20,000–$70,000',
      developmentMin: 10000,
      developmentMax: 30000,
      inventoryMin: 10000,
      inventoryMax: 40000,
      recommendedServices: ['design'],
      description: 'Select an existing factory shoe and customize branding, colors, and packaging with minimal product engineering.',
    },
    {
      id: 'customized-platform',
      name: 'Customized existing sole/platform',
      development: '$35,000–$100,000',
      inventory: '$20,000–$75,000',
      total: '$55,000–$175,000',
      developmentMin: 35000,
      developmentMax: 100000,
      inventoryMin: 20000,
      inventoryMax: 75000,
      recommendedServices: ['design', 'prototyping'],
      description: 'Develop a distinct upper, material package, and brand expression around an existing last and sole platform.',
    },
    {
      id: 'fully-custom',
      name: 'Fully custom premium shoe',
      development: '$100,000–$300,000',
      inventory: '$30,000–$120,000',
      total: '$130,000–$420,000',
      developmentMin: 100000,
      developmentMax: 300000,
      inventoryMin: 30000,
      inventoryMax: 120000,
      recommendedServices: ['design', 'prototyping', 'engineering'],
      description: 'Create an original silhouette, fit, construction, prototypes, tooling, and production system for a proprietary product.',
    },
    {
      id: 'technical-performance',
      name: 'Technical running/performance shoe',
      development: '$250,000–$750,000+',
      inventory: '$50,000–$200,000',
      total: '$300,000–$950,000+',
      developmentMin: 250000,
      developmentMax: 750000,
      inventoryMin: 50000,
      inventoryMax: 200000,
      recommendedServices: ['design', 'prototyping', 'engineering'],
      description: 'Add advanced biomechanics, performance engineering, laboratory validation, specialized materials, and more complex tooling.',
    },
  ];
  const selectedApproach = traditionalFirmRoutes.find((approach) => approach.id === selectedApproachId) ?? traditionalFirmRoutes[2];
  const additionalServices = [
    {id: 'factory-sourcing', name: 'Factory sourcing and audit', fee: 25000, description: 'Identify, qualify, compare, and document suitable footwear manufacturing partners.'},
    {id: 'testing-qa', name: 'Testing and quality program', fee: 30000, description: 'Define validation criteria, coordinate testing, and establish production quality controls.'},
    {id: 'packaging-launch', name: 'Packaging and launch system', fee: 15000, description: 'Develop packaging requirements, product information, and launch-ready production assets.'},
    {id: 'production-oversight', name: 'Production oversight', fee: 40000, description: 'Support pre-production approval, inspection coordination, issue resolution, and delivery reporting.'},
  ];
  const selectedServices = developmentPhases.filter((service) => selectedServiceIds.includes(service.id));
  const selectedAdditionalServices = additionalServices.filter((service) => selectedAdditionalServiceIds.includes(service.id));
  const aliServicesTotal = [...selectedServices, ...selectedAdditionalServices].reduce((sum, service) => sum + service.fee, 0);
  const totalMonths = selectedServices.reduce((sum, service) => sum + service.months, 0);
  const manufacturerReadiness = selectedServiceIds.includes('engineering')
    ? '75%'
    : selectedServiceIds.includes('prototyping')
      ? '30%'
      : selectedServiceIds.includes('design')
        ? '15%'
        : '0%';
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: 0}).format(value);
  const configuredEstimateMin = selectedApproach.developmentMin + selectedApproach.inventoryMin + aliServicesTotal;
  const configuredEstimateMax = selectedApproach.developmentMax + selectedApproach.inventoryMax + aliServicesTotal;
  const configuredEstimate = `${formatCurrency(configuredEstimateMin)}–${formatCurrency(configuredEstimateMax)}${selectedApproach.id === 'technical-performance' ? '+' : ''}`;
  let timelineCursor = 1;
  const configuredTimeline = selectedServices.map((service) => {
    const start = timelineCursor;
    const end = timelineCursor + service.months - 1;
    timelineCursor = end + 1;
    return {
      period: start === end ? `Month ${start}` : `Months ${start}–${end}`,
      name: service.name,
      output: service.deliveries.join('; '),
    };
  });
  const selectApproach = (approachId: string) => {
    const approach = traditionalFirmRoutes.find((item) => item.id === approachId);
    setSelectedApproachId(approachId);
    setSelectedServiceIds(approach?.recommendedServices ?? ['design']);
    setSelectedAdditionalServiceIds(approachId === 'technical-performance' ? ['testing-qa'] : []);
    setEstimateConfirmed(false);
  };
  const toggleSelection = (id: string, current: string[], update: (value: string[]) => void) => {
    update(current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setEstimateConfirmed(false);
  };
  const moveToBuilderStep = (step: number) => {
    const sectionRefs = [scopeSectionRef, developmentSectionRef, estimateSectionRef];
    setBuilderStep(step);
    window.requestAnimationFrame(() => {
      sectionRefs[step]?.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
    });
  };
  const downloadConfiguredProposal = async () => {
    const {downloadProposalPdf} = await import('./lib/proposalPdf');
    downloadProposalPdf({
      approach: selectedApproach.name,
      approachDescription: selectedApproach.description,
      services: selectedServices.map((service) => ({
        name: service.name,
        duration: service.duration,
        fee: formatCurrency(service.fee),
        summary: service.description,
      })),
      additionalServices: selectedAdditionalServices.map((service) => ({
        name: service.name,
        fee: formatCurrency(service.fee),
      })),
      timeline: configuredTimeline,
      aliServicesTotal: formatCurrency(aliServicesTotal),
      developmentTooling: selectedApproach.development,
      initialInventory: selectedApproach.inventory,
      estimatedTotal: configuredEstimate,
    });
  };
  return (
    <div className="proposal-page">
      <section className="proposal-hero">
        <div className="proposal-kicker">
          <span>Project proposal</span>
          <span>Prepared for Nomads &amp; Nobles</span>
        </div>
        <motion.h1
          initial={{opacity: 0, y: 14}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.55, ease: 'easeOut'}}
        >
          Classified shoe design<span className="proposal-dot">.</span>
        </motion.h1>
        <motion.p
          initial={{opacity: 0, y: 10}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.5, delay: 0.16, ease: 'easeOut'}}
        >
          An end-to-end development program that takes the shoe from creative direction through
          prototyping and production engineering, then hands a reproducible product to manufacturing.
        </motion.p>
        <div className="proposal-hero-meta">
          <span>Ali Ahmed Co.</span>
          <span>Confidential concept engagement</span>
          <span>July 2026</span>
        </div>
      </section>

      <section className="proposal-section proposal-overview">
        <p className="proposal-section-label">The opportunity</p>
        <div className="proposal-lede">
          <h2>Make the mystery tangible.</h2>
          <div>
            <p>
              The strongest classified product is not merely hidden. It feels deliberate before it
              is revealed. This engagement creates the product logic, form, and story needed to make
              that promise credible.
            </p>
            <p>
              Nomads &amp; Nobles does not need to arrive with an established footwear network. Ali
              will assemble and coordinate the designers, developers, engineers, sourcing partners,
              and manufacturers required to move the product into production.
            </p>
          </div>
        </div>
      </section>

      <section className="proposal-section proposal-builder-section">
        <nav className="proposal-builder-progress" aria-label="Proposal builder progress">
          {['Scope', 'Development Plan', 'Timeline & Estimate'].map((label, index) => (
            <button
              key={label}
              type="button"
              className={builderStep === index ? 'is-active' : builderStep > index ? 'is-complete' : ''}
              disabled={index > builderStep}
              onClick={() => index <= builderStep && moveToBuilderStep(index)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {label}
            </button>
          ))}
        </nav>
      <div ref={scopeSectionRef} id="proposal-scope" className="proposal-builder-slide proposal-approach-selector">
        <div className="proposal-section-heading">
          <p className="proposal-section-label">Choose a product route</p>
          <h2>From creative direction to launch-ready handoff.</h2>
        </div>
        <div className="proposal-approach-tabs" role="tablist" aria-label="Footwear development approaches">
          {traditionalFirmRoutes.map((approach, index) => (
            <button
              key={approach.id}
              id={`approach-tab-${approach.id}`}
              type="button"
              role="tab"
              aria-selected={selectedApproach.id === approach.id}
              aria-controls="approach-estimate-panel"
              className={selectedApproach.id === approach.id ? 'is-active' : ''}
              onClick={() => selectApproach(approach.id)}
            >
              <small className="proposal-approach-option-number">{`Option ${String(index + 1).padStart(2, '0')}`}</small>
              <span className="proposal-approach-option-name">{approach.name}</span>
              <strong>{approach.total}</strong>
              <span className="proposal-approach-option-action">
                <i aria-hidden="true" />
                {selectedApproach.id === approach.id ? 'Selected' : 'Select option'}
              </span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selectedApproach.id}
            id="approach-estimate-panel"
            role="tabpanel"
            aria-labelledby={`approach-tab-${selectedApproach.id}`}
            className="proposal-approach-panel"
            initial={{opacity: 0, y: 8}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -6}}
            transition={{duration: 0.2, ease: 'easeOut'}}
          >
            <div className="proposal-approach-panel-intro">
              <p className="proposal-section-label">Selected approach</p>
              <h3>{selectedApproach.name}</h3>
              <p>{selectedApproach.description}</p>
            </div>
            <dl>
              <div><dt>Development and tooling</dt><dd>{selectedApproach.development}</dd></div>
              <div><dt>Initial inventory</dt><dd>{selectedApproach.inventory}</dd></div>
              <div className="proposal-approach-total"><dt>Approximate total before marketing</dt><dd>{selectedApproach.total}</dd></div>
            </dl>
          </motion.div>
        </AnimatePresence>
        <p className="proposal-approach-note">
          Planning estimates only. Marketing, customer fulfillment, returns, and ongoing operations are excluded.
        </p>
        <div className="proposal-builder-actions">
          <span>Selected: {selectedApproach.name}</span>
          <button type="button" className="proposal-builder-next" onClick={() => moveToBuilderStep(1)}>
            Proceed to Development Plan <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div ref={developmentSectionRef} id="proposal-development-plan" className="proposal-builder-slide proposal-development-builder">
        <div className="proposal-section-heading">
          <p className="proposal-section-label">Development plan</p>
          <h2>Choose the services that move your product forward.</h2>
        </div>
        <p className="proposal-builder-context">
          Recommended for <strong>{selectedApproach.name}</strong>. Your scope is prepopulated, but
          every service can be added or removed before the estimate is prepared.
        </p>
        <div className="proposal-development-summary">
          <div><span>{totalMonths || '—'}{totalMonths ? ' months' : ''}</span><small>Configured core timeline</small></div>
          <div><span>{formatCurrency(aliServicesTotal)}</span><small>Selected Ali Ahmed services</small></div>
          <div><span>{manufacturerReadiness}</span><small>Projected product build</small></div>
        </div>
        <fieldset className="proposal-development-phases">
          <legend className="proposal-section-label">Core development services</legend>
          {developmentPhases.map((phase) => (
            <label
              key={phase.number}
              className={`proposal-development-phase${selectedServiceIds.includes(phase.id) ? ' is-selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedServiceIds.includes(phase.id)}
                onChange={() => toggleSelection(phase.id, selectedServiceIds, setSelectedServiceIds)}
              />
              <div className="proposal-development-phase-intro">
                <div className="proposal-development-phase-number">
                  <span>Service {phase.number}</span>
                  <span>{phase.build}</span>
                </div>
                <div className="proposal-service-title">
                  <span className="proposal-service-check" aria-hidden="true">✓</span>
                  <h3>{phase.name}</h3>
                </div>
                <p>{phase.description}</p>
              </div>
              <div className="proposal-development-phase-commercials">
                <strong>{phase.monthly}</strong>
                <span>{phase.duration}</span>
                <span>{phase.total}</span>
                <small>Payable at the start of each month</small>
              </div>
              <div className="proposal-development-phase-deliveries">
                <p className="proposal-section-label">Associated deliveries</p>
                <ul>
                  {phase.deliveries.map((delivery) => <li key={delivery}>{delivery}</li>)}
                </ul>
              </div>
            </label>
          ))}
        </fieldset>
        <fieldset className="proposal-additional-services">
          <legend className="proposal-section-label">Additional services</legend>
          <div className="proposal-additional-grid">
            {additionalServices.map((service) => (
              <label
                key={service.id}
                className={selectedAdditionalServiceIds.includes(service.id) ? 'is-selected' : ''}
              >
                <input
                  type="checkbox"
                  checked={selectedAdditionalServiceIds.includes(service.id)}
                  onChange={() => toggleSelection(service.id, selectedAdditionalServiceIds, setSelectedAdditionalServiceIds)}
                />
                <span className="proposal-service-check" aria-hidden="true">✓</span>
                <strong>{service.name}</strong>
                <span>{service.description}</span>
                <small>{formatCurrency(service.fee)} fixed service fee</small>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="proposal-manufacturer-handoff">
          <div><span>75%</span><strong>Manufacturer-ready</strong></div>
          <div><span>25%</span><strong>Manufacturing and market launch</strong></div>
          <p>
            The remaining 25% sits with the selected manufacturer: tooling completion, production,
            quality control, packaging, freight, and market delivery. These costs are client-funded
            and contracted separately from Ali Ahmed services.
          </p>
        </div>
        <div className="proposal-builder-actions">
          <button type="button" className="proposal-builder-back" onClick={() => moveToBuilderStep(0)}>← Back to Scope</button>
          <span>{selectedServices.length} core service{selectedServices.length === 1 ? '' : 's'} selected</span>
          <button
            type="button"
            className="proposal-builder-next"
            disabled={selectedServices.length === 0}
            onClick={() => moveToBuilderStep(2)}
          >
            Build Timeline &amp; Estimate <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div ref={estimateSectionRef} id="proposal-timeline-estimate" className="proposal-builder-slide proposal-market-benchmark">
        <div className="proposal-section-heading">
          <p className="proposal-section-label">Timeline &amp; estimate</p>
          <h2>Your configured development proposal.</h2>
        </div>
        <div className="proposal-estimate-hero">
          <div>
            <small>Configured planning range</small>
            <span>{configuredEstimate}</span>
            <strong>{selectedApproach.name}</strong>
          </div>
          <p>
            This combines your selected Ali Ahmed services with the market benchmark for external
            development, tooling, and initial inventory. External costs remain client-funded and are
            only incurred with written approval.
          </p>
        </div>
        <div className="proposal-configured-grid">
          <div className="proposal-configured-timeline">
            <p className="proposal-section-label">Configured timeline</p>
            <div>
              {configuredTimeline.map((item) => (
                <article key={item.name}>
                  <span>{item.period}</span>
                  <strong>{item.name}</strong>
                  <p>{item.output}</p>
                </article>
              ))}
              {selectedAdditionalServices.length > 0 ? (
                <article>
                  <span>Alongside core phases</span>
                  <strong>Additional specialist services</strong>
                  <p>{selectedAdditionalServices.map((service) => service.name).join(' · ')}</p>
                </article>
              ) : null}
            </div>
          </div>
          <div className="proposal-configured-estimate">
            <p className="proposal-section-label">Basic estimate</p>
            <dl>
              <div><dt>Ali Ahmed services</dt><dd>{formatCurrency(aliServicesTotal)}</dd></div>
              <div><dt>External development and tooling</dt><dd>{selectedApproach.development}</dd></div>
              <div><dt>Initial inventory</dt><dd>{selectedApproach.inventory}</dd></div>
              <div className="proposal-configured-total"><dt>Approximate total before marketing</dt><dd>{configuredEstimate}</dd></div>
            </dl>
          </div>
        </div>
        <div className="proposal-market-context">
          <p className="proposal-section-label">Market benchmark</p>
          <p>
            A traditional senior footwear team can cost approximately $500,000–$1.2 million in its
            first year before factory production and inventory. This configured model creates one
            accountable path while keeping materials, tooling, testing, inventory, and factory
            spending visible and client-approved.
          </p>
        </div>
        <p className="proposal-benchmark-disclaimer">
          Preliminary planning estimate—not a fixed quote. Final cost depends on scope, sample rounds,
          factory minimums, materials, testing, freight, and production decisions. Marketing, customer
          fulfillment, returns, and post-launch operations are not included.
        </p>
        <label className={`proposal-estimate-confirmation${estimateConfirmed ? ' is-confirmed' : ''}`}>
          <input
            type="checkbox"
            checked={estimateConfirmed}
            onChange={(event) => setEstimateConfirmed(event.target.checked)}
          />
          <span className="proposal-service-check" aria-hidden="true">✓</span>
          <span>
            <strong>Confirm this configuration</strong>
            <small>I understand this is a preliminary planning estimate and external costs are paid directly by the client.</small>
          </span>
        </label>
        <div className="proposal-builder-actions proposal-download-actions">
          <button type="button" className="proposal-builder-back" onClick={() => moveToBuilderStep(1)}>← Edit Development Plan</button>
          <button
            type="button"
            className="proposal-builder-next"
            disabled={!estimateConfirmed}
            onClick={downloadConfiguredProposal}
          >
            Download Configured Proposal <span aria-hidden="true">↓</span>
          </button>
        </div>
      </div>
      </section>

      <section className="proposal-section proposal-working-model">
        <p className="proposal-section-label">Working model</p>
        <div className="proposal-facts">
          <div><span>Cadence</span><strong>One working review each week</strong></div>
          <div><span>Collaboration</span><strong>Shared decisions, documented after each review</strong></div>
          <div><span>Feedback</span><strong>One consolidated response per review round</strong></div>
          <div><span>Payment</span><strong>Monthly service fee due before each month begins</strong></div>
          <div><span>External costs</span><strong>100% client-funded with written approval before purchase</strong></div>
          <div><span>Configured program</span><strong>Defined by the selected scope and services above</strong></div>
        </div>
      </section>

      <section className="proposal-acceptance">
        <p className="proposal-section-label">Next step</p>
        <h2>Ready to open the file?</h2>
        <p>
          Download and confirm the configured proposal, then attach it to your kickoff email. The
          statement of work will confirm the monthly service schedule, external-cost authorization
          process, dependencies, revision limits, and ownership before work begins.
        </p>
        <a
          className="proposal-cta"
          href={`mailto:${profile.email}?subject=Nomads%20%26%20Nobles%20shoe%20development%20kickoff&body=Please%20attach%20the%20configured%20proposal%20you%20downloaded%20from%20the%20proposal%20builder%20before%20sending.`}
        >
          Approve and Schedule Kickoff <span aria-hidden="true">↗</span>
        </a>
        <small className="proposal-attachment-note">Attach “Nomads-and-Nobles-Development-Proposal.pdf” to this email.</small>
        <SmartLink href="/work" className="proposal-back-link">← Back to work</SmartLink>
      </section>
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
  const [route, setRoute] = useState<SiteRoute | null>(normalizeRoute(window.location.pathname));
  const [projects, setProjects] = useState<ProjectIndexItem[]>([]);
  const [projectError, setProjectError] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewForRoute(route));
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
  const projectRouteId = getProjectRouteId(route);
  const projectRouteProject = projectRouteId
    ? projects.find((project) => project.id === projectRouteId) ?? null
    : null;
  const resolvedRoute = route ?? '/';
  const resolvedMeta: RouteMeta = projectRouteProject
    ? {
        title: `${projectRouteProject.title} | ${projectRouteProject.company} | Ali Ahmed Co`,
        description: projectRouteProject.teaser,
        canonicalPath: projectPath(projectRouteProject.id),
      }
    : route && route in routeMeta
      ? routeMeta[route as AppRoute]
      : projectRouteId
        ? {
            title: 'Project | Ali Ahmed Co',
            description: 'Selected product, engineering, and design work by Ali Ahmed.',
            canonicalPath: route as ProjectRoute,
            robots: 'noindex, follow',
          }
        : routeMeta['/'];
  useSeo(resolvedRoute, resolvedMeta);

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
    const nextView = defaultViewForRoute(route);
    if (route === '/portfolio' || route === '/projects' || route === '/work') {
      setViewMode(nextView);
    }
    
    if (route?.startsWith('/work')) {
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

  function openProject(projectId: string) {
    startTransition(() => {
      setSelectedProjectId(projectId);
      navigateTo(projectPath(projectId));
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
    onSelect: openProject,
    onViewModeChange: setViewMode,
    onFilterChange: updateFilter,
    onPreviewMove: movePreview,
    onPreviewLeave: hidePreview,
  };
  const usesPortfolioShell = route === '/portfolio';
  const isWorkRoute = route?.startsWith('/work') ?? false;
  const isProposalRoute = route === '/work/classified-shoe-design-nomads-nobles';

  return (
    <div className={`site-shell ${usesPortfolioShell ? 'site-shell--portfolio' : ''} ${isWorkRoute || isProposalRoute ? 'site-shell--work' : ''}`}>
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
            onSelect={openProject}
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
        ) : route === '/work/classified-shoe-design-nomads-nobles' ? (
          <ShoeDesignProposalPage />
        ) : projectRouteId ? (
          projectRouteProject ? (
            <ProjectDetailPage project={projectRouteProject} projects={projects} />
          ) : projects.length ? (
            <NotFoundPage />
          ) : (
            <section className="empty-state">Loading project…</section>
          )
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

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
            {props.project.scale === 'Scale-up' ? (
              <>
                {props.project.productType}{' '}
                <span style={{ color: '#bf4c3b' }}>{props.project.client}</span>{' '}
                {props.project.company}
              </>
            ) : props.project.scale === 'Startup' ? (
              <>
                {props.project.productType}{' '}
                {props.project.company}{' '}
                <span style={{ color: '#bf4c3b' }}>{props.project.client}</span>
              </>
            ) : (
              <>
                {props.project.company}{' '}
                <span style={{ color: '#bf4c3b' }}>{props.project.client}</span>{' '}
                {props.project.productType}
              </>
            )}
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

function HomePage(props: {
  projects: ProjectIndexItem[];
  onOpenProject: (projectId: string) => void;
}) {
  const latestPublication = substackPosts[0];

  type PivotEntry = (typeof profile.resume.pivotEntries)[number];

  function isAcademic(item: PivotEntry): item is Extract<PivotEntry, {type: 'Academic'}> {
    return item.type === 'Academic';
  }

  function isWriting(item: PivotEntry): boolean {
    return item.type === 'Article' || item.type === 'Publication';
  }

  const pivotEntries = profile.resume.pivotEntries;
  const pivotAcademic = pivotEntries.filter(isAcademic) as unknown as PivotEntry[];
  const pivotWriting = pivotEntries.filter(isWriting) as unknown as PivotEntry[];
  const top3Projects = props.projects.slice(0, 3);

  return (
    <>
      <section className="panel panel-first">
        <p className="eyebrow">WORK</p>
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
          {top3Projects.map((project) => (
            <div key={project.id} className="stack-item">
              <p className="micro-copy">
                <strong>{project.company}</strong>
                {', '}
                <button
                  type="button"
                  className="entity-link"
                  style={{
                    border: 0,
                    padding: 0,
                    background: 'none',
                    font: 'inherit',
                    cursor: 'pointer',
                  }}
                  onClick={() => props.onOpenProject(project.id)}
                >
                  {project.title}
                </button>
                {'. '}
                <span>{project.teaser}</span>
              </p>
            </div>
          ))}
          <div className="stack-item" style={{marginTop: '16px'}}>
            <SmartLink href="/work" className="inline-link">
              work
            </SmartLink>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">RESUME</p>
        <div className="stack-list now-list home-fade-list">
          <div className="stack-item">
            <p className="micro-copy" style={{lineHeight: 1.6, marginBottom: '12px'}}>
              {profile.resume.profileSummary}
            </p>
          </div>
          <div className="stack-item">
            <p className="micro-copy">
              Email:{' '}
              <a href={`mailto:${profile.email}`} className="entity-link">
                {profile.email}
              </a>
            </p>
          </div>
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
          <div className="stack-item" style={{marginTop: '16px'}}>
            <SmartLink href="/resume" className="inline-link">
              resume
            </SmartLink>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">WRITING</p>
        <div className="stack-list now-list home-fade-list">
          <div className="stack-item">
            <p className="micro-copy">
              <a href={latestPublication.url} target="_blank" rel="noreferrer" className="entity-link">
                Rebuilding Washington D.C.'s MetroBus Fleet Overhaul Program with AI
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
          {pivotWriting.map((item) => (
            <div
              key={`${item.organization}-${item.title}`}
              className="stack-item"
            >
              <p className="micro-copy">
                {'href' in item && item.href ? (
                  <a href={item.href} target="_blank" rel="noreferrer" className="entity-link">
                    {item.title}
                  </a>
                ) : (
                  item.title
                )}
              </p>
            </div>
          ))}
          <div className="stack-item" style={{marginTop: '16px'}}>
            <SmartLink href="/writing" className="inline-link">
              writing
            </SmartLink>
          </div>
        </div>
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
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(props.projects[0]?.id ?? null);
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
  const openProjectTray = (projectId: string, source: 'scroll' | 'click') => {
    if (projectId === expandedProjectId) {
      return;
    }

    if (source === 'click') {
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
    if (!groupProjects.length) {
      setExpandedProjectId(null);
      return;
    }

    if (manualProjectId && !groupProjects.some((project) => project.id === manualProjectId)) {
      setManualProjectId(null);
    }

    if (!pendingOpenRef.current && !groupProjects.some((project) => project.id === activeProjectId)) {
      setExpandedProjectId(groupProjects[0].id);
    }
  }, [activeProjectId, groupProjects, manualProjectId]);

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

  useEffect(() => {
    if (!groupProjects.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const centeredEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => {
            const viewportCenter = window.innerHeight / 2;
            const leftCenter = left.boundingClientRect.top + left.boundingClientRect.height / 2;
            const rightCenter = right.boundingClientRect.top + right.boundingClientRect.height / 2;
            return Math.abs(leftCenter - viewportCenter) - Math.abs(rightCenter - viewportCenter);
          })[0];

        const nextId = centeredEntry?.target.getAttribute('data-project-id');
        if (nextId && !manualProjectId && !pendingOpenRef.current) {
          openProjectTray(nextId, 'scroll');
        }
      },
      {rootMargin: '-38% 0% -38% 0%', threshold: 0},
    );

    groupProjects.forEach((project) => {
      const element = projectRefs.current[project.id];
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [groupProjects, manualProjectId, expandedProjectId]);

  return (
    <div className="work-page">
      <div className="work-hero home-fade-item">
        <h1 className="work-hero-title">
          Hire Ali to Test Products, Conceptualize Projects, and Launch Concepts for a 10x Value.
        </h1>
      </div>
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
              >
                <button
                  type="button"
                  className="landing-project-row"
                  aria-expanded={isExpanded}
                  onClick={() => {
                    if (isExpanded) {
                      props.onOpenProject(project.id);
                      return;
                    }

                    openProjectTray(project.id, 'click');
                    projectRefs.current[project.id]?.scrollIntoView({behavior: 'smooth', block: 'center'});
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
  const resumeIntro =
    'Ali turns ambiguous technical programs into clear product decisions. His work spans WSP enterprise delivery, Huupe growth, Autodesk R&D, and NASA systems prototyping, with $220M in managed project scope and hands-on execution across AI, robotics, spatial computing, and built-environment technology.';
  const leadExperience = profile.resume.experience.slice(0, 6);
  const earlierExperience = profile.resume.experience.slice(6);
  const resumeSections = [
    {id: 'resume-overview', label: 'Overview'},
    {id: 'resume-proof', label: 'Proof'},
    {id: 'resume-experience', label: 'Experience'},
    {id: 'resume-capabilities', label: 'Capabilities'},
    {id: 'resume-foundation', label: 'Foundation'},
  ];
  const [activeResumeSection, setActiveResumeSection] = useState(resumeSections[0].id);

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
  }, []);

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
        <div className="resume-hero-copy">
          <p className="eyebrow">Resume</p>
          <h1>AI product operator with engineering range.</h1>
          <p>{resumeIntro}</p>
        </div>
        <aside className="resume-contact-card" aria-label="Contact details">
          <p className="summary-title">{profile.name}</p>
          <p className="micro-copy">{profile.headline}</p>
          <div className="resume-contact-list">
            {profile.resume.contactMethods.map((method) => (
              <a key={method.label} href={method.href} target="_blank" rel="noreferrer">
                <span>{method.label}</span>
                <strong>{method.value}</strong>
              </a>
            ))}
            <div>
              <span>Location</span>
              <strong>{profile.location}</strong>
            </div>
          </div>
        </aside>
      </section>

      <section id="resume-proof" className="resume-snap-section resume-proof-section" aria-label="Career proof points">
        <div className="resume-section-heading">
          <p className="eyebrow">Proof</p>
          <h2>Signals a hiring manager can evaluate quickly.</h2>
        </div>
        <div className="resume-proof-grid">
          {resumeStats.map((stat) => (
            <article key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="resume-experience" className="resume-section resume-snap-section">
        <div className="resume-section-heading">
          <p className="eyebrow">Experience</p>
          <h2>Recent work with measurable operating leverage.</h2>
        </div>
        <div className="resume-role-grid">
          {leadExperience.map((item) => (
            <article key={`${item.company}-${item.title}-${item.period}`} className="resume-role">
              <div className="resume-role-meta">
                <span>{item.period}</span>
                {'location' in item && item.location ? <span>{item.location}</span> : null}
              </div>
              <div className="resume-role-body">
                <p className="resume-role-company">{item.company}</p>
                <h3>{item.title}</h3>
                {item.bullets.length ? (
                  <p>{item.bullets[0]}</p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="resume-capabilities" className="resume-section resume-systems-section resume-snap-section">
        <div className="resume-section-heading">
          <p className="eyebrow">Capabilities</p>
          <h2>Product judgment backed by technical execution.</h2>
        </div>
        <div className="resume-capability-grid">
          <article>
            <h3>Focus</h3>
            <div className="resume-chip-list">
              {profile.resume.focusAreas.map((area) => (
                <span key={area}>{area}</span>
              ))}
            </div>
          </article>
          <article>
            <h3>Technical Toolkit</h3>
            <div className="resume-skill-groups">
              {profile.resume.technicalSkills.map((group) => (
                <div key={group.label}>
                  <strong>{group.label}</strong>
                  <p>{group.items.join(', ')}</p>
                </div>
              ))}
            </div>
          </article>
          <article>
            <h3>Credentials</h3>
            <p>{profile.resume.certifications.join(', ')}</p>
          </article>
        </div>
      </section>

      <section id="resume-foundation" className="resume-section resume-education-section resume-snap-section">
        <div className="resume-section-heading">
          <p className="eyebrow">Foundation</p>
          <h2>Architecture, engineering, and earlier innovation work.</h2>
        </div>
        <div className="resume-foundation-grid">
          <article>
            <h3>Education</h3>
            {profile.resume.education.map((entry) => (
              <p key={entry}>{entry}</p>
            ))}
          </article>
          <article>
            <h3>Recognition</h3>
            <p>{profile.resume.honors.join(', ')}</p>
          </article>
          <article>
            <h3>Earlier Roles</h3>
            <div className="resume-earlier-list">
              {earlierExperience.map((item) => (
                <p key={`${item.company}-${item.title}`}>
                  <strong>{item.company}</strong>
                  {' / '}
                  {item.title}
                  {' / '}
                  <span>{item.period}</span>
                </p>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

function WritingPage() {
  return (
    <section className="writing-archive">
      <div className="writing-row-list">
        {substackPosts.map((post) => (
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
      </div>
    </section>
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
          <HomePage projects={projects} onOpenProject={openProject} />
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

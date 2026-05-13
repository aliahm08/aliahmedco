export type AppRoute = '/' | '/portfolio' | '/projects' | '/work' | '/resume' | '/writing';

export type RouteMeta = {
  title: string;
  description: string;
  canonicalPath: AppRoute;
  robots?: string;
};

export const site = {
  domain: 'https://aliahmed.co',
  name: 'Ali Ahmed Co',
  personName: 'Ali Ahmed',
  email: 'aliahm1208@gmail.com',
  linkedinUrl: 'https://www.linkedin.com/in/aliahmed-co',
  githubUrl: 'https://github.com/aliahm08',
  substackUrl: 'https://aliahmed312.substack.com',
  hero: {
    eyebrow: 'Portfolio and professional site',
    title: 'Ali Ahmed Co',
    intro:
      'A minimal professional site for Ali Ahmed across AI products, operational software, analytics systems, and technical design work.',
    detail:
      'Browse the index, filter the work, regroup the projects, and open details only when useful.',
  },
  about:
    'The site is intentionally light: a clear landing page, one project index, a small filter set, and enough structure to grow into full project pages later.',
  resumeSummary:
    'Operator working across AI, infrastructure, design, and product with experience spanning enterprise software, venture-backed startups, and federal programs.',
  writingSummary:
    'Short essays and project notes focused on AI, interfaces, and the future of computer-aided work.',
  notFound: {
    eyebrow: '404',
    title: 'This picture slipped out of the stack.',
    body:
      'The page you asked for wandered off between the contact sheet and the cutting room floor.',
    cta: 'Return to the portfolio',
  },
} as const;

export const navItems: Array<{href: AppRoute; label: string}> = [
  {href: '/work', label: 'Work'},
  {href: '/resume', label: 'Resume'},
  {href: '/writing', label: 'Writing'},
];

export const routeMeta: Record<AppRoute, RouteMeta> = {
  '/': {
    title: 'Ali Ahmed Co | AI Product, Software, and Technical Systems Portfolio',
    description:
      'A professional landing page and portfolio for Ali Ahmed across AI product work, operational software, analytics systems, and technical design.',
    canonicalPath: '/',
  },
  '/portfolio': {
    title: 'Portfolio | Ali Ahmed Co',
    description:
      'A minimal portfolio index for Ali Ahmed across AI product work, internal tooling, design operations, and hardware systems.',
    canonicalPath: '/portfolio',
  },
  '/projects': {
    title: 'Projects | Ali Ahmed Co',
    description:
      'Browse a lightweight project index by product type, role, and scale.',
    canonicalPath: '/projects',
  },
  '/work': {
    title: 'Work | Ali Ahmed Co',
    description:
      'Selected work and projects from Ali Ahmed across AI systems, analytics, product design, and technical operations.',
    canonicalPath: '/work',
  },
  '/resume': {
    title: 'Resume | Ali Ahmed Co',
    description:
      'Experience, focus areas, and technical toolkit for Ali Ahmed across product, AI systems, analytics, and design.',
    canonicalPath: '/resume',
  },
  '/writing': {
    title: 'Writing | Ali Ahmed Co',
    description:
      'Selected essays and public writing from Ali Ahmed on AI interfaces, operations, and design.',
    canonicalPath: '/writing',
  },
};

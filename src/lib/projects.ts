export type ProjectIndexItem = {
  id: string;
  title: string;
  company: string;
  client: string;
  year: string;
  location: string;
  teaser: string;
  productType: string;
  role: string;
  scale: string;
  poster: string;
  accent: string;
  tags: string[];
  metrics: Array<{label: string; value: string}>;
};

export type ProjectDetail = ProjectIndexItem & {
  headline: string;
  challenge: string;
  outcome: string;
  bullets: string[];
  capabilities: string[];
  gallery: Array<{src: string; alt: string; caption: string; title?: string}>;
};

const indexPath = '/data/projects-index.json';
const detailPath = (projectId: string) => `/data/projects/${projectId}.json`;

export async function loadProjectIndex(signal?: AbortSignal) {
  const response = await fetch(indexPath, {signal});
  if (!response.ok) {
    throw new Error('Project index request failed.');
  }

  return (await response.json()) as ProjectIndexItem[];
}

export async function loadProjectDetail(projectId: string, signal?: AbortSignal) {
  const response = await fetch(detailPath(projectId), {signal});
  if (!response.ok) {
    throw new Error('Project detail request failed.');
  }

  return (await response.json()) as ProjectDetail;
}

export function uniqueValues(items: ProjectIndexItem[], key: 'productType' | 'role' | 'scale') {
  return Array.from(new Set(items.map((item) => item[key]))).sort((left, right) =>
    left.localeCompare(right),
  );
}

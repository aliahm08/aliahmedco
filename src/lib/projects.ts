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
  gallery: Array<{src: string; alt: string; caption: string; title?: string; label?: string}>;
};

const indexPath = '/data/projects-index.json';
const detailPath = (projectId: string) => `/data/projects/${projectId}.json`;
const uploadedMediaProjectIds = new Set([
  'autodesk-generative',
  'huupe-court-vision',
  'nasa-helmet-hud',
  'norman-foster-droneport',
  'wsp-signal-engine',
]);

export function hasUploadedProjectMedia(projectId: string) {
  return uploadedMediaProjectIds.has(projectId);
}

export function orderProjectsByMedia(items: ProjectIndexItem[]) {
  return [...items].sort((left, right) => {
    const leftHasMedia = hasUploadedProjectMedia(left.id);
    const rightHasMedia = hasUploadedProjectMedia(right.id);

    if (leftHasMedia === rightHasMedia) {
      return 0;
    }

    return leftHasMedia ? -1 : 1;
  });
}

export async function loadProjectIndex(signal?: AbortSignal) {
  const response = await fetch(indexPath, {signal});
  if (!response.ok) {
    throw new Error('Project index request failed.');
  }

  return orderProjectsByMedia((await response.json()) as ProjectIndexItem[]);
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

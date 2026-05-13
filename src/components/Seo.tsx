import {useEffect} from 'react';
import {AppRoute, RouteMeta, site} from '../content/site';

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
}

function upsertLink(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
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

function absoluteUrl(path: AppRoute) {
  return new URL(path, site.domain).toString();
}

export function useSeo(route: AppRoute, meta: RouteMeta) {
  useEffect(() => {
    document.title = meta.title;
    document.documentElement.lang = 'en';

    upsertMeta('meta[name="description"]', {name: 'description', content: meta.description});
    upsertMeta('meta[name="robots"]', {
      name: 'robots',
      content: meta.robots ?? 'index, follow',
    });
    upsertMeta('meta[name="author"]', {name: 'author', content: site.personName});
    upsertMeta('meta[property="og:type"]', {property: 'og:type', content: 'website'});
    upsertMeta('meta[property="og:title"]', {property: 'og:title', content: meta.title});
    upsertMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: meta.description,
    });
    upsertMeta('meta[property="og:url"]', {
      property: 'og:url',
      content: absoluteUrl(meta.canonicalPath),
    });
    upsertMeta('meta[property="og:image"]', {
      property: 'og:image',
      content: `${site.domain}/og-image.svg`,
    });
    upsertMeta('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    upsertMeta('meta[name="twitter:title"]', {
      name: 'twitter:title',
      content: meta.title,
    });
    upsertMeta('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: meta.description,
    });
    upsertMeta('meta[name="twitter:image"]', {
      name: 'twitter:image',
      content: `${site.domain}/og-image.svg`,
    });
    upsertLink('link[rel="canonical"]', {
      rel: 'canonical',
      href: absoluteUrl(meta.canonicalPath),
    });

    if (route === '/') {
      upsertJsonLd('person-json-ld', {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: site.personName,
        url: site.domain,
        image: `${site.domain}/favicon.svg`,
        description: meta.description,
        email: site.email,
        sameAs: [site.githubUrl, site.linkedinUrl, site.substackUrl],
        worksFor: [
          { '@type': 'Organization', name: 'Ali Ahmed Co' },
          { '@type': 'Organization', name: 'WSP' },
        ],
        knowsAbout: [
          'AI products',
          'product management',
          'workflow automation',
          'TypeScript applications',
          'machine learning workflows',
          'design systems',
          'computer vision',
        ],
      });
    }
  }, [meta, route]);
}

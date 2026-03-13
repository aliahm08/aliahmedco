# Ali Ahmed Portfolio

Personal website for Ali Ahmed, positioned for discovery as a software engineer and product manager.

## What Changed

- Updated the on-site copy to emphasize software engineering, product management, AI products, and full-stack delivery.
- Replaced placeholder metadata with search-focused title, description, keywords, Open Graph, and Twitter tags.
- Added structured data through the React app so search engines can associate the site with a person profile.
- Kept GitHub activity visible so the site reflects current engineering work instead of static resume copy.

## Key Files

- `src/content/profile.ts`: primary professional positioning, keywords, contact info, and specialties.
- `src/App.tsx`: route content plus dynamic SEO metadata and JSON-LD.
- `index.html`: default metadata for the initial document response.
- `metadata.json`: app-level project description.

## Local Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Notes

- Set `profile.siteUrl` in `src/content/profile.ts` when the final production domain is known. That will make canonical URLs and structured data point to the public domain instead of the local origin.
- Add a real LinkedIn URL in `src/content/profile.ts` if you want that profile indexed and linked from the site.

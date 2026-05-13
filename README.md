# Ali Ahmed Co

Single-page portfolio for Ali Ahmed built with Vite and React.

## Architecture

- `src/App.tsx`: SPA shell, client routing, portfolio states, and route-level page composition.
- `src/content/site.ts`: central brand copy, nav items, and route metadata.
- `src/components/Seo.tsx`: runtime head tags, canonical URLs, social tags, and JSON-LD.
- `src/lib/projects.ts`: AJAX loaders for the project index and on-demand case-study details.
- `public/data/projects-index.json`: lightweight project summaries for the first paint.
- `public/data/projects/*.json`: detailed case studies fetched only when a project is selected.

## Marketability files

- `docs/marketability-source-of-truth.md`: approved brand framing and route intent.
- `docs/seo-route-inventory.md`: route, robots, and asset inventory.
- `index.html`, `metadata.json`, and `public/site.webmanifest`: static metadata defaults.

## Local Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Notes

- Project details are loaded over fetch from static JSON so the homepage stays small.
- The homepage is the primary experience; `/projects` and `/work` are alternate entry points into the same data.

# Ali Ahmed Co Marketability Skill Adaptation Report

## Outcome

The original `marketability-updates` skill was tightly coupled to the B2W website and its automation scripts. For Ali Ahmed Co, the same operating principle still applies: keep market-facing metadata, brand framing, and indexability aligned through central source files rather than page-by-page edits. The implementation points are different, though, because this repo uses a Vite app with runtime SEO logic inside `src/App.tsx` and static defaults in `index.html`.

## Adapted Skill

```md
---
name: marketability-updates
description: Keep the Ali Ahmed Co website's public marketability surface aligned after major website edits. Use when changing public routes, titles, descriptions, canonical paths, robots tags, favicons, share images, manifest entries, brand naming, founder positioning, CTA copy, or any other SEO and social-sharing metadata for Ali Ahmed Co.
---

# Marketability Updates

Keep the public brand surface current with the least amount of Codex work by editing the central metadata and positioning sources instead of scattering one-off SEO changes through components.

## Workflow

1. Check whether the edit touched any public-facing surface:
   - public route added, removed, or renamed
   - page title, description, canonical, `robots`, or share image changed
   - favicon, app icon, manifest, or top-level brand asset changed
   - Ali Ahmed Co, Ali Ahmed, service positioning, founder framing, nav copy, hero copy, or CTA copy changed
2. Update the real source file first:
   - static document defaults: `index.html`
   - runtime route metadata and canonical behavior: `src/App.tsx`
   - professional positioning, keywords, profile links, and site URL: `src/content/profile.ts`
   - app-level project metadata: `metadata.json`
   - crawl policy: `public/robots.txt`
   - manifest and install surface: `public/site.webmanifest`
   - default social share image or favicon assets: `public/og-image.svg` and `public/favicon.svg`
3. Verify route-level intent:
   - public portfolio routes should remain indexable unless there is a deliberate reason to hide them
   - private or client-only routes such as `/portal` should remain `noindex, nofollow`
   - any new route should be added to the `pageTitleByRoute` and `pageDescriptionByRoute` maps in `src/App.tsx`
4. Run `npm run build`.
5. If positioning changed materially, review the homepage hero, CTA, and profile summary for consistency.

## Preferred Inputs

- Read `src/content/profile.ts` for the approved positioning, keywords, links, and public identity data.
- Read `src/App.tsx` for route metadata, canonical handling, Open Graph tags, Twitter tags, and JSON-LD.
- Read `index.html` for first-response defaults used before the client app hydrates.
- Read `public/site.webmanifest` and `public/robots.txt` for install and crawl behavior.
- Read `metadata.json` for the project-level description used by app tooling.

## Cheap Rules

- Do not hand-edit metadata across random components when the route belongs in `src/App.tsx`.
- Do not add indexable public routes without title and description coverage in the SEO maps.
- Keep `/portal` and other private client surfaces on `noindex, nofollow` unless the task explicitly changes that.
- Reuse the default share image unless a route has a strong reason to own a different preview asset.
- When the production domain changes, update `profile.siteUrl` so canonical URLs and structured data stop pointing at localhost or preview origins.
```

## File Mapping

- Original `src/lib/seo.ts` maps to [src/App.tsx](/Users/ali/Library/CloudStorage/GoogleDrive-aliahm1208@gmail.com/My%20Drive/Ali_Ahmed_Co/aliahmedco/src/App.tsx:309).
- Original `src/components/Seo.tsx` behavior is also handled in [src/App.tsx](/Users/ali/Library/CloudStorage/GoogleDrive-aliahm1208@gmail.com/My%20Drive/Ali_Ahmed_Co/aliahmedco/src/App.tsx:309).
- Original strategic content references map most closely to [src/content/profile.ts](/Users/ali/Library/CloudStorage/GoogleDrive-aliahm1208@gmail.com/My%20Drive/Ali_Ahmed_Co/aliahmedco/src/content/profile.ts:1) and the public copy inside [src/App.tsx](/Users/ali/Library/CloudStorage/GoogleDrive-aliahm1208@gmail.com/My%20Drive/Ali_Ahmed_Co/aliahmedco/src/App.tsx:1).
- Static fallback metadata lives in [index.html](/Users/ali/Library/CloudStorage/GoogleDrive-aliahm1208@gmail.com/My%20Drive/Ali_Ahmed_Co/aliahmedco/index.html:1).
- Crawl and install surfaces live in [public/robots.txt](/Users/ali/Library/CloudStorage/GoogleDrive-aliahm1208@gmail.com/My%20Drive/Ali_Ahmed_Co/aliahmedco/public/robots.txt:1) and [public/site.webmanifest](/Users/ali/Library/CloudStorage/GoogleDrive-aliahm1208@gmail.com/My%20Drive/Ali_Ahmed_Co/aliahmedco/public/site.webmanifest:1).

## Repo-Specific Findings

- There is no `marketing:sync` script in this repo, so the B2W automation step should be removed rather than imitated.
- Route SEO is centrally managed in `useSeo()` inside `src/App.tsx`, which is the right place to maintain page-level metadata for this app.
- `/portal` is already treated as private with `noindex, nofollow`; that decision should remain explicit in the adapted skill.
- `profile.siteUrl` is currently empty in `src/content/profile.ts`, so canonical URLs depend on the runtime origin. That is workable in development, but the adapted skill should call out setting the production domain when finalized.
- The brand surface mixes `Ali Ahmed`, `Ali Ahmed Co`, and references to `B2W-ai`. That may be intentional, but future marketability edits should treat it as a governed positioning decision rather than casual copy drift.

## Recommended Next Cleanup

1. Add a small internal document such as `docs/marketability-source-of-truth.md` if you want the skill to govern messaging changes more explicitly.
2. Set `profile.siteUrl` once the production Ali Ahmed Co domain is fixed.
3. Consider extracting the route SEO maps from `src/App.tsx` into a dedicated module only if route count grows enough to justify it.

# Ali Ahmed Co Marketability Source of Truth

## Brand frame

- Primary brand name: `Ali Ahmed Co`
- Public domain: `https://aliahmed.co`
- Primary positioning: founder, operator, and product builder working across AI systems, internal tooling, design, and technical storytelling
- Homepage framing: minimal product portfolio framework with lightweight filters and no designed project frames
- Portfolio framing: `/portfolio` remains an alias for the same portfolio architecture

## Public route intent

- `/`: primary minimal portfolio architecture and project index
- `/portfolio`: alias for the portfolio architecture and project index
- `/projects`: same data, biased toward project browsing
- `/work`: same data, grouped by scale
- `/resume`: experience, skills, and work history
- `/writing`: public essays and notes

## Copy rules

- Keep the tone restrained, specific, and slightly dry.
- Use project language that sounds like product work, not inflated agency copy.
- Ground case studies in resume bullets before adding interpretation.
- Keep filters minimal: product type, role, scale.

## Metadata rules

- Default share image: `/og-image.svg`
- Indexable public routes: `/`, `/portfolio`, `/projects`, `/work`, `/resume`, `/writing`
- 404 should be `noindex, nofollow`
- Do not create one-off page metadata inside feature components; route metadata belongs in `src/content/site.ts` and runtime head updates belong in `src/components/Seo.tsx`

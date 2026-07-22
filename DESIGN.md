# Dandii Design System

**Memorable thing:** All of Addis Ababa’s transit — especially the minibuses — on one green map.

**Product:** Map-first web app for riders (public map + journey planning) and transport officials (operations console), powered by DT4A GTFS 2026.

---

## Brand mark

- **Name:** Dandii
- **Mark:** Side-view Addis Ababa minibus (woyala / shared taxi) silhouette — boxy HiAce-style body, destination board above the windshield, sliding-door rail, dual wheels.
- **Color:** Brand green `#15803D` (`brand-700`). Favicon/tile uses white mark on green rounded square.
- **Files:**
  - React: `web/src/components/foundations/logo/dandii-logo.tsx` (`DandiiMark`, `DandiiLogo`)
  - Static: `web/public/logo.svg`, `web/src/app/icon.svg`
  - Generated: `apple-icon`, `opengraph-image`

Use `DandiiLogo` in product chrome (map header, sign-in). Prefer the mark alone only when space is tight (favicons, app icons).

---

## Aesthetic

**Industrial / utilitarian + local signal** — function-first transit UI (Maps-like density) with one local icon: the minibus, not a generic city bus.

| Token | Choice | Why |
|-------|--------|-----|
| Aesthetic | Industrial / utilitarian | Riders need clarity over decoration |
| Decoration | Minimal | Map is the visual; chrome stays quiet |
| Layout | Hybrid | Grid for console; floating panels for map |
| Color | Restrained | One green accent + neutrals + operator colors |
| Motion | Minimal-functional | Sheet snaps, marker bounce — no marketing choreography |
| Spacing | 4px base, dense | Mobile map panels |

### Safe (category baseline)

- Floating search / trip panel over a full-bleed map (Google Maps literacy)
- Operator color-coding on routes
- Bottom sheet on mobile, side panel on desktop

### Risks (our face)

1. **Minibus mark instead of abstract “D” or metro icon** — majority of Addis trips are shared taxis; the mark should feel local. Cost: less “global SaaS” abstraction.
2. **Green primary (`#15803D`) instead of transit-blue defaults** — already shipped brand; keep it. Cost: diverges from Maps blue CTAs (we still use blue for map selection affordances).
3. **Poppins for brand wordmark** — free OFL face matching rz-codes.com; Inter remains body. Cost: Poppins is widely used; we accept it as intentional brand continuity with the maker’s site.

---

## Color

| Role | Hex | Token |
|------|-----|-------|
| Brand / logo | `#15803D` | `brand-700` |
| Brand soft bg | `#F0FDF4` / `#DCFCE7` | `brand-50` / `brand-100` |
| Ink | `#1C2321` | near-black green-gray |
| Muted | `#5C6B5E` | secondary text |
| Map select / links | `#1A73E8` | Google-Maps-adjacent blue |
| Surface | `#F8F9FA` | sheet backgrounds |

Operator colors live in `web/src/lib/operators.ts` — do not override with brand green on route chips.

---

## Typography

| Role | Face | Notes |
|------|------|-------|
| Brand / display | **Poppins** 600–800 | `--font-display` / `font-display` |
| Body / UI | **Inter** | `--font-body` |
| Mono / times | **IBM Plex Mono** | headways, codes |

---

## SEO & discoverability

Canonical origin: `NEXT_PUBLIC_SITE_URL` → `BETTER_AUTH_URL` → `https://dandii.et`.

| Surface | Location |
|---------|----------|
| Metadata / OG / Twitter / geo | `web/src/app/layout.tsx` |
| JSON-LD (Organization, WebSite, WebApplication) | `web/src/components/seo/json-ld.tsx` |
| Sitemap | `web/src/app/sitemap.ts` |
| Robots (+ AI crawlers allowed) | `web/src/app/robots.ts` |
| PWA manifest | `web/src/app/manifest.ts` |
| AI agent brief | `web/public/llms.txt` |
| Site constants | `web/src/lib/site.ts` |

Private areas (`/console`, `/settings`, `/profile`, `/api`) are disallowed in robots.

---

## Voice

- Direct, city-local: “Addis”, “minibus”, “fare”, “route short name”
- No generic SaaS hero copy
- Amharic may appear in stop/route names from GTFS — never invent translations

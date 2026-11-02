# InstaLink Content-Rich Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the InstaLink public website into an informative, content-rich editorial ISP experience whose primary funnel is coverage check -> installation request -> WhatsApp, without inventing unapproved commercial claims.

**Architecture:** Keep the existing Next.js App Router, React, TypeScript, Tailwind CSS, shared `PageShell`, header/footer, `Reveal`, coverage map, hero video, and current routes. Add small frontend content primitives and explicit draft/API-placeholder states rather than adding a CMS, new dependency, or backend catalog integration. Keep form handoff local-first and transparent: validate locally, then open WhatsApp with a prefilled message.

**Tech Stack:** Next.js 16, React 19, TypeScript strict mode, Tailwind CSS 4, existing Leaflet/react-leaflet coverage map, ESLint, browser smoke validation.

**Spec:** `c:\Users\dorio\.copilot\session-state\7d57093e-7870-4aaf-b734-002cf5bd1ae5\files\2026-11-02-instalink-content-rich-editorial-design.md`

## Global Constraints

- Preserve `instalink-frontend/`, `instalink-backend/`, and `instalink-infrastructure/` naming and existing technology.
- Do not add prices, customer counts, testimonials, coverage percentages, uptime/SLA guarantees, or other unsupported claims.
- Public service area is Darmaraja, Situraja, and Wado, Sumedang Regency; availability remains subject to address-level confirmation.
- Package prices are not authoritative and must not be copied into redesigned UI.
- Package cards may show no-price structure and direct visitors to availability/price confirmation until catalog exists.
- New copy is draft content requiring approval by Gingin.
- Coverage results are indicative; every result must explain that final confirmation is required.
- Local forms must never imply backend persistence; the approved temporary behavior is local validation followed by a prefilled WhatsApp handoff.
- Keep current contact data unless later replaced: `sindi@instalink.id`, admin `+62 851-3951-4123`, technician `0811-920-800`, daily `08.00–17.00 WIB`.
- Use only the confirmed logo and hero video as real assets; gallery slots remain visibly “menunggu aset”.
- Do not install dependencies, implement backend catalog/identity, or connect production systems.

## Review Focus

- **Unsupported commercial copy:** package cards and corporate sections must render draft/confirmation states instead of silently publishing prices or technical guarantees. Test in Tasks 1, 2, and 4 by checking the rendered text and source data.
- **Coverage certainty:** an indicative KML/geolocation result must not be phrased as final network availability. Test in Task 3 with available, unavailable, empty-KML, and map-error states.
- **Form honesty:** local submission must show local-validation/WhatsApp handoff status, not “saved” or “registered”. Test in Task 3 with valid and invalid form input.
- **Mobile conversion path:** at 320px/375px widths the CTA, map controls, comparison content, FAQ, and mobile navigation must remain usable without horizontal overflow. Test every route in Task 6.
- **Incomplete editorial assets:** gallery/news placeholders must be visibly draft or awaiting assets and must not resemble approved field evidence. Test in Task 4 with empty asset/content states.

---

### Task 1: Create shared editorial content primitives and safe content models

**Files:**
- Create: `instalink-frontend/components/content-section.tsx`
- Create: `instalink-frontend/components/faq-list.tsx`
- Create: `instalink-frontend/components/process-steps.tsx`
- Create: `instalink-frontend/components/draft-badge.tsx`
- Create: `instalink-frontend/lib/public-content.ts`
- Modify: `instalink-frontend/lib/catalog.ts`
- Modify: `instalink-frontend/app/globals.css`
- Test: `instalink-frontend` lint and build commands

**Interfaces:**
- `ContentSection`: accepts `{ eyebrow?: string; title: string; description?: string; children: ReactNode; className?: string }` and renders consistent section hierarchy.
- `FaqList`: accepts `items: Array<{ question: string; answer: string; draft?: boolean }>` and renders accessible disclosure controls.
- `ProcessSteps`: accepts `steps: Array<{ number: string; title: string; description: string; draft?: boolean }>` and renders a responsive process/timeline layout.
- `DraftBadge`: accepts `{ label?: string }` and visibly marks copy needing confirmation.
- `public-content.ts`: exports typed confirmed contact/service-area values and draft FAQ/process content; it must not export prices.
- `InternetPlan` remains API-ready and gains only display-safe fields needed by cards, such as `id?: string`, `benefits?: string[]`, and `status?: "draft" | "available" | "unavailable"`; no price is required for rendering.

- [ ] **Step 1: Write the failing type/markup checks**

Add a lightweight testable contract in the implementation itself through strict TypeScript types and deterministic data exports. Define the expected `ContentSection`, `FaqList`, `ProcessSteps`, `DraftBadge`, and no-price `InternetPlan` shapes before wiring pages.

- [ ] **Step 2: Run the frontend checker to verify the new contracts are not yet implemented**

Run: `Set-Location G:\Website\instalink-v2\instalink-frontend; npm.cmd run lint`

Expected: Existing project lint result is the baseline; new imports/components do not exist yet, so page integration is not attempted in this step.

- [ ] **Step 3: Implement the primitives and safe content model**

Create the four focused components and `public-content.ts`. Use semantic headings, native `<details>`/`<summary>` for FAQ disclosure, visible draft labels, and responsive Tailwind classes. Keep content strings short enough for mobile and do not add unsupported factual claims. Remove price dependence from any redesigned catalog view while preserving the original file’s type safety for future API data.

- [ ] **Step 4: Run lint and build**

Run: `Set-Location G:\Website\instalink-v2\instalink-frontend; npm.cmd run lint; if ($?) { npm.cmd run build }`

Expected: ESLint and Next.js TypeScript/build complete with exit code 0.

- [ ] **Step 5: Commit the shared primitives**

```powershell
git add instalink-frontend/components/content-section.tsx instalink-frontend/components/faq-list.tsx instalink-frontend/components/process-steps.tsx instalink-frontend/components/draft-badge.tsx instalink-frontend/lib/public-content.ts instalink-frontend/lib/catalog.ts instalink-frontend/app/globals.css
git commit -m "feat: add editorial content primitives"
```

### Task 2: Rebuild the homepage around the editorial conversion funnel

**Files:**
- Modify: `instalink-frontend/app/page.tsx`
- Modify: `instalink-frontend/components/site-header.tsx`
- Modify: `instalink-frontend/components/site-footer.tsx`
- Test: browser homepage smoke check plus frontend lint/build

**Interfaces:**
- Consumes the primitives and safe content exports from Task 1.
- Preserves hero video `/hero-background.mp4`, mobile menu behavior, and existing CTA routes.
- Produces a homepage sequence: hero, brand introduction, benefits, no-price residential offering, indicative service-area explanation, installation process, support/FAQ, and final CTA.

- [ ] **Step 1: Record the homepage acceptance checks before editing**

Define browser checks for the exact funnel: hero CTA reaches `/pasang-wifi-sumedang-murah`; coverage CTA reaches the same route; package CTA reaches `/pasang-wifi-sumedang`; service area names only Darmaraja, Situraja, and Wado; no homepage text contains the old hard-coded prices; final CTA includes WhatsApp or installation handoff.

- [ ] **Step 2: Run the existing homepage smoke baseline**

Use the shared browser page at `http://localhost:3000/` and inspect the page tree. Confirm the current hero, coverage ornament, and service cards before changes; do not treat aborted media requests during navigation as a functional failure without reproducing them on a stable page.

- [ ] **Step 3: Implement the editorial homepage sections**

Keep the current hero video and headline, then replace the sparse lower content with purposeful sections using `ContentSection`, no-price plan cards, `ProcessSteps`, and `FaqList`. Use draft badges for new copy that requires Gingin’s approval. Keep the final primary action aligned to coverage and installation; do not add invented testimonials or metrics.

- [ ] **Step 4: Update shared navigation/footer labels only where they improve the funnel**

Retain all existing routes and mobile accessibility attributes. Add clear “Cek coverage”/“Pasang baru” pathways without removing Paket, Corporate, Kabar, Kontak, or Portal pelanggan. Keep confirmed contact details in the footer.

- [ ] **Step 5: Verify the homepage**

Run: `Set-Location G:\Website\instalink-v2\instalink-frontend; npm.cmd run lint; if ($?) { npm.cmd run build }`

Then use browser inspection at desktop and mobile widths to verify heading hierarchy, CTA destinations, no horizontal overflow, no unsupported price strings, and reduced-motion-safe behavior.

- [ ] **Step 6: Commit the homepage funnel**

```powershell
git add instalink-frontend/app/page.tsx instalink-frontend/components/site-header.tsx instalink-frontend/components/site-footer.tsx
git commit -m "feat: expand homepage conversion funnel"
```

### Task 3: Expand plans and installation/coverage into an honest residential journey

**Files:**
- Modify: `instalink-frontend/app/pasang-wifi-sumedang/page.tsx`
- Modify: `instalink-frontend/app/pasang-wifi-sumedang-murah/page.tsx`
- Modify: `instalink-frontend/components/installation-form.tsx`
- Modify: `instalink-frontend/components/coverage-map.tsx`
- Modify: `instalink-frontend/components/coverage-map-loader.tsx`
- Test: browser coverage/form checks plus frontend lint/build

**Interfaces:**
- Consumes `InternetPlan`, `ContentSection`, `FaqList`, `ProcessSteps`, and public contact/service-area data from Task 1.
- `InstallationForm` retains local validation but produces an explicit local handoff state and a prefilled WhatsApp URL containing encoded user-provided name, phone, address, and selected plan.
- `CoverageMap` retains KML, geolocation, and Nominatim behavior but labels results as indicative and routes final confirmation to WhatsApp/form.

- [ ] **Step 1: Define failing behavior checks**

Check that plan cards render without prices, show a “cek ketersediaan & harga” action, and preserve the installation route. Check that empty KML, unavailable location, geolocation denial, search failure, and successful indicative results each produce explicit user-facing status. Check that invalid required fields block handoff and valid fields produce a WhatsApp link rather than claiming persistence.

- [ ] **Step 2: Run the current page/form/map smoke baseline**

Inspect `/pasang-wifi-sumedang` and `/pasang-wifi-sumedang-murah` at desktop and 375px widths. Record current controls, route links, map status, and form success wording before editing.

- [ ] **Step 3: Rework the plans page**

Add package-selection guidance, no-price comparison structure, speed/use-case explanation that avoids unsupported household guarantees, terms/confirmation notice, FAQ, and coverage/install CTA. Remove or isolate old hard-coded price strings and mark any unapproved speed/business details as draft or omit them.

- [ ] **Step 4: Rework the coverage/install page**

Add an explanatory address-first flow, map result interpretation, service-area note, post-submission expectations, FAQ, and WhatsApp fallback around the existing map and form. Preserve the KML upload and geolocation controls; do not turn indicative radius logic into a final availability promise.

- [ ] **Step 5: Make the installation form handoff explicit**

Keep browser-required validation. On valid submit, construct a `wa.me` URL using `encodeURIComponent`, set a state such as “Data tervalidasi di browser; lanjutkan melalui WhatsApp,” and provide a button/link to continue. Do not write to local storage, call a nonexistent API, or say “ajuan tersimpan”.

- [ ] **Step 6: Harden map status and input boundaries**

Add explicit empty-line and invalid-coordinate handling, a visible final-confirmation caveat, and a bounded/typed KML upload path without changing the map’s established coverage calculation. Preserve error messages from address search and avoid silent catch fallbacks.

- [ ] **Step 7: Verify**

Run: `Set-Location G:\Website\instalink-v2\instalink-frontend; npm.cmd run lint; if ($?) { npm.cmd run build }`

Use browser checks for 320px, 375px, and desktop widths; test valid/invalid form states, indicative coverage states, CTA destinations, and absence of price claims.

- [ ] **Step 8: Commit the residential journey**

```powershell
git add instalink-frontend/app/pasang-wifi-sumedang/page.tsx instalink-frontend/app/pasang-wifi-sumedang-murah/page.tsx instalink-frontend/components/installation-form.tsx instalink-frontend/components/coverage-map.tsx instalink-frontend/components/coverage-map-loader.tsx
git commit -m "feat: clarify residential plans and coverage journey"
```

### Task 4: Expand secondary information pages without inventing evidence

**Files:**
- Modify: `instalink-frontend/app/corporate/page.tsx`
- Modify: `instalink-frontend/app/portal-pelanggan/page.tsx`
- Modify: `instalink-frontend/app/galeri/page.tsx`
- Modify: `instalink-frontend/app/berita/page.tsx`
- Modify: `instalink-frontend/app/kontak/page.tsx`
- Test: browser route/content-state checks plus frontend lint/build

**Interfaces:**
- Consumes the shared primitives and draft/content status from Task 1.
- Corporate page accepts future company-profile content without hard-coding unapproved PT claims.
- Portal remains an informative shell with disabled/local-only login state and a confirmed help route.
- Gallery renders asset-ready slots labeled “menunggu aset”; news renders draft editorial entries labeled for approval; contact uses confirmed channels and local-to-WhatsApp handoff.

- [ ] **Step 1: Define page acceptance checks**

Check every route has a clear purpose, at least one useful next action, correct mobile layout, and no placeholder presented as factual. Check Corporate explicitly states that full PT material will be populated from the company profile. Check Portal does not claim login works. Check gallery/news draft states are visible.

- [ ] **Step 2: Run the current secondary-route baseline**

Inspect `/corporate`, `/portal-pelanggan`, `/galeri`, `/berita`, and `/kontak` in the browser and record current headings, CTA links, local simulation messages, and any dead-looking controls.

- [ ] **Step 3: Implement the Corporate profile structure**

Create editorial sections for PT profile, vision/mission/values, capabilities, local commitment, and consultation CTA using draft badges until the company profile file arrives. Do not retain unsupported OHO/dedicated claims as final copy.

- [ ] **Step 4: Implement honest Portal, Gallery, and News states**

Keep the portal shell useful with capabilities and help path, but label authentication as unavailable locally. Replace gradient “photos” with explicit awaiting-asset slots. Keep news cards as draft/editorial placeholders with approval state and no fake “read more” behavior unless an article destination exists.

- [ ] **Step 5: Expand Contact and Help**

Keep the approved email, admin/technician WhatsApp, and operating hours. Add contact purpose guidance, FAQ, escalation distinction, coverage/install CTA, and local validation followed by a prefilled WhatsApp handoff for the form.

- [ ] **Step 6: Verify**

Run: `Set-Location G:\Website\instalink-v2\instalink-frontend; npm.cmd run lint; if ($?) { npm.cmd run build }`

Use browser route checks at 320px, 375px, tablet, and desktop widths; verify keyboard focus, headings, link targets, visible draft labels, and no horizontal overflow.

- [ ] **Step 7: Commit the secondary pages**

```powershell
git add instalink-frontend/app/corporate/page.tsx instalink-frontend/app/portal-pelanggan/page.tsx instalink-frontend/app/galeri/page.tsx instalink-frontend/app/berita/page.tsx instalink-frontend/app/kontak/page.tsx
git commit -m "feat: expand secondary editorial pages"
```

### Task 5: Prepare metadata, media, and performance/accessibility polish

**Files:**
- Modify: `instalink-frontend/app/layout.tsx`
- Modify: `instalink-frontend/app/globals.css`
- Modify: `instalink-frontend/next.config.ts` only if a verified configuration change is needed
- Modify: affected page files from Tasks 2–4 only where validation identifies a defect
- Test: browser console/network inspection plus lint/build

**Interfaces:**
- Preserves all route behavior and existing hero asset.
- Produces accurate Indonesian metadata, consistent focus/contrast/reduced-motion behavior, and explicit media loading behavior.

- [ ] **Step 1: Reproduce the reported browser warnings**

Load the homepage without navigating, inspect console and network, then repeat with a route navigation. Separate font preload warnings and expected aborted navigation/media requests from persistent errors. Do not change configuration solely because an abort occurred during navigation.

- [ ] **Step 2: Fix verified metadata/media/accessibility issues**

Update title/description to match the expanded public site without unsupported claims. Optimize only verified font/video loading issues; keep hero autoplay muted loop playsInline and provide a sensible poster/fallback treatment if supported by an existing asset or CSS fallback. Preserve reduced-motion and focus rules.

- [ ] **Step 3: Verify**

Run: `Set-Location G:\Website\instalink-v2\instalink-frontend; npm.cmd run lint; if ($?) { npm.cmd run build }`

Confirm no persistent console errors, no unexpected route failures, no horizontal overflow, acceptable heading landmarks, keyboard navigation, and reduced-motion behavior.

- [ ] **Step 4: Commit verified polish**

```powershell
git add instalink-frontend/app/layout.tsx instalink-frontend/app/globals.css instalink-frontend/next.config.ts
git commit -m "perf: polish public site metadata and accessibility"
```

### Task 6: Run whole-site acceptance validation

**Files:**
- Test only: all public routes and relevant shared components
- Modify: only files required to fix defects found by this task

**Interfaces:**
- Validates the complete public-site funnel and all existing routes without adding backend dependencies.

- [ ] **Step 1: Run final static checks**

Run:

```powershell
Set-Location G:\Website\instalink-v2\instalink-frontend
npm.cmd run lint
if ($?) { npm.cmd run build }
```

Expected: both commands exit 0.

- [ ] **Step 2: Run route and CTA smoke checks**

Check `/`, `/pasang-wifi-sumedang`, `/pasang-wifi-sumedang-murah`, `/corporate`, `/portal-pelanggan`, `/galeri`, `/berita`, and `/kontak`. Verify all internal links resolve, WhatsApp links use the confirmed admin/technician numbers, forms show honest local status, package prices are absent, and the funnel can proceed from coverage to installation to WhatsApp.

- [ ] **Step 3: Run responsive/accessibility checks**

Check 320px, 375px, 390px, tablet, and 1440px viewports. Confirm no horizontal overflow, mobile navigation remains available, all form controls are reachable, focus indicators are visible, and content remains readable with reduced motion.

- [ ] **Step 4: Review content safety**

Search the frontend for old hard-coded prices, unsupported metrics, fake testimonials, “saved/registered” simulation language, and final-availability wording. Replace only findings caused by the redesign; document any remaining content awaiting Gingin or the company profile.

- [ ] **Step 5: Record final verification evidence**

Capture the commands, route list, viewport list, console/network findings, and unresolved external dependencies. Do not claim the backend catalog, identity, registration persistence, or production integrations work; they remain outside this public-site phase.

- [ ] **Step 6: Commit only after review**

```powershell
git add instalink-frontend
git commit -m "test: verify InstaLink public-site redesign"
```

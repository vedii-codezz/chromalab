# CHROMA LAB Foundation Implementation Plan

> Execute inline using superpowers:executing-plans; the user has supplied approved decisions and explicitly requested end-to-end implementation.

**Goal:** Establish a polished, tested landing page and static Studio shell.
**Architecture:** Server components compose reusable static palettes and previews. A client reveal boundary owns GSAP with media-query cleanup. No generator or project store is implemented.
**Tech stack:** Stable Next.js, React, strict TypeScript, Tailwind v4, GSAP, Culori, Zustand, Lucide, Vitest, RTL, Playwright; npm.
**Spec:** `docs/superpowers/specs/2026-11-05-chroma-lab-design.md`

## Global constraints

Initialize directly in this directory. No database, authentication, external AI, deployment or GitHub push. Label examples as static; disable unavailable features. Preserve server components by default.

## Review focus

Small screens must not overflow; reduced motion must retain visible content; navigation must work with a keyboard; unavailable features must be honest; client hydration must produce no browser errors.

## Task 1: Runtime and documentation

- [x] Create npm manifest, strict tsconfig, Next/PostCSS/ESLint configs, Vitest and Playwright configs.
- [x] Install compatible stable packages and retain lockfile.
- [x] Write design and phased plan.

## Task 2: Route contracts and visual foundation

Files: `tests/pages.test.tsx`, `tests/setup.ts`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `app/studio/page.tsx`, `components/layout/*`, `components/shared/reveal.tsx`, `lib/color/demo-palettes.ts`.

- [x] Add route rendering assertions and run to observe missing pages.
- [x] Implement semantic landing page, wordmark, CTA and palette illustration.
- [x] Implement scoped GSAP reveals, reduced-motion handling and focus styles.

## Task 3: Studio shell

Files: `components/studio/studio-workspace.tsx`, `components/preview/component-preview.tsx`.

- [x] Assert static disclosure, shade labels and disabled export/presentation controls.
- [x] Compose tool panel, canvas, inspector and live-looking but static component examples.
- [x] Make panels native disclosures on smaller screens; keep desktop composition editorial.
- [x] Run unit suite.

## Task 4: Verification

Files: `e2e/foundation.spec.ts`, `README.md`.

- [x] Test landing-to-studio navigation and return, viewport containment, console errors and reduced motion on desktop/mobile.
- [x] Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`; fix failures and record limitations accurately.
- [x] Inspect browser screenshots; document setup and implemented/future boundaries.

## Future phases

02: Pure OKLCH/Culori engine, input validation, 500 anchoring, ten-shade scales, locks and gamut mapping with mathematical tests.
03: Shared editable project/Zustand state, manual controls, token resolver and previews.
04: Deterministic brief recommendations, independent light/dark token mappings and accessibility analysis.
05: Versioned local persistence, migrations and undo/redo; validated import/export, CSS/Tailwind/JSON serializers using the same resolver.
06: Read-only cinematic presentation, animated fans and draggable cards, performance/accessibility verification.

## Execution record — 2026-11-05

Foundation completed inline. Independent read-only review found one small-label contrast issue. A browser regression test reproduced 4.371:1 before the CSS fix and passed afterward. Responsive panel behavior was also verified failing before enhancement and passing afterward. No deferred review findings remain.

Final checks:

| Command             | Result                                     |
| ------------------- | ------------------------------------------ |
| `npm run lint`      | Exit 0, no warnings                        |
| `npm run typecheck` | Exit 0                                     |
| `npm test`          | 3/3 passed                                 |
| `npm run build`     | Exit 0; both routes statically prerendered |
| `npm run test:e2e`  | 16/16 passed in desktop/mobile Chromium    |

Browser viewport checks cover 320, 768, 1024 and 1440px. Desktop/mobile screenshots were inspected. An initial combined viewport test timed out under six workers; independent per-width cases with two workers passed. An earlier mobile navigation failure did not reproduce after source formatting/hot reloads stopped. No routing workaround or artificial waits were added.

Ruling: retain ESLint 9 for the React lint plugin peer range. Eight moderate transitive development-tool advisories remain documented in README. No forced incompatible override or Next ESLint major downgrade was applied.

No deployment, GitHub push, database, authentication, generator, project persistence, token resolver or exports were implemented.

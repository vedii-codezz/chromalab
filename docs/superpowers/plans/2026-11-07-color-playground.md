# Color Playground implementation plan

> Execute inline with superpowers:executing-plans. The supplied Phase 03.5 / revised Phase 04 brief defines the approved scope. Do not commit, push, or deploy.

**Goal:** Extend the existing Studio into a flexible, local color exploration workspace.

**Architecture:** Keep the pure OKLCH engine and Zustand history. Canonical v2 projects contain ordered color entries and optional role references; generated scales remain derived in memory. Small client modules compose Playground, Harmony, Compatibility and Preview around those boundaries.

**Tech stack:** Existing Next.js App Router, React, TypeScript, Zustand, Culori, Vitest/RTL and Playwright. No dependencies added.

## Decisions and alternatives

Extend the existing store rather than replacing it: preserves tested lock rejection and gesture history. Migrate the fixed-family schema rather than retaining mandatory family slots: supports empty projects and any reasonable collection size. Use OKLCH hue offsets with existing gamut mapping rather than RGB rotation. Use exact WCAG calculations and labeled OKLab distance rather than an aesthetic score. Preserve editorial surfaces and responsive disclosures rather than replace the visual identity.

## Tasks

- [x] Audit source, historical specs/plans, tests and Next client-boundary guide; run baseline lint, typecheck, unit, build and browser checks.
- [x] Add migration/store regression tests, observe failures, then implement `ColorEntry`, `ColorProject`, canonical serialization, strict v1/v2 restore, v2 storage fallback and safe roles. Preserve old storage. Extend stable-ID add/remove/duplicate/reorder/name/tag/role actions, bounded history and selection repair.
- [x] Add responsive cards, empty state, accessible reordering and selection. Retain settings, inputs and generated shade locks.
- [x] Test representative HSL coordinates, then render an exact HSL square with a sampled canvas and expose independent native sliders. Preserve capture and keyboard cleanup.
- [x] Test and implement deterministic `generateHarmony(input, kind)` with six OKLCH relationships, neutral handling, gamut mapping and duplicate removal. Add candidate preview/add/reject UI.
- [x] Test and implement `compareColors`, `contrastRatio` and `describeBalance`. Use WCAG 2.2 opaque sRGB transfer function, Euclidean OKLab distance, explicit foreground/background and text-size thresholds. Document descriptive heuristics.
- [x] Test and implement optional role controls and `resolvePreviewRoles`, then Landing/Dashboard/Components templates using shared resolved values and contrast warnings. Preview-only overrides never alter colors.
- [x] Extend RTL/browser tests for collection, harmony, comparison, roles, previews, migration, mobile, keyboard, persistence and history; retain existing coverage with schema/terminology assertions adapted.
- [x] Update README/specs, run final lint/typecheck/unit/build/e2e/format checks sequentially where Next generated output is shared. Inspect desktop/mobile screenshots and console errors. Record exact outcomes and limitations.

## Review focus

Empty project selection must not crash. Undo after deletion must restore references. Corrupt v2 storage may recover valid v1 without overwriting it. Duplicate IDs and dangling roles must be rejected. Pointer interruption must close a single history transaction. Neutral colors must not acquire invented hue claims. Contrast verdicts apply only to the specified pairing and size.

## Baseline

Lint passed; unit tests 143/143 passed. Concurrent build failed on pre-existing OneDrive EPERM removing `.next/server/app/index.segments`; concurrent typecheck saw missing generated `.next/types` files. Sequential baseline typecheck passed. Baseline Playwright server stalled in the sandbox and was interrupted; no baseline browser pass is claimed. Outside-sandbox execution resolved the build and browser startup failures without infrastructure changes.

## Completion report — 2026-11-07

Implemented the flexible Playground, deterministic Harmony Explorer, explicit pair Compatibility Inspector, optional roles, accurate picker and three live previews in the existing project. No dependency, backend, authentication, AI API, deployment or engine replacement. No commit or push.

### Canonical model and migration

Version 2 stores ordered `ColorEntry[]` (stable ID, name, base HEX, anchor, settings, locks, optional tags) and `roleAssignments`. Generated scales and diagnostics stay derived. Valid version-1 projects migrate with all canonical values intact; legacy IDs become role references. The old key remains untouched. Validation rejects duplicate IDs, dangling roles, bad settings/locks and invalid scales. Corrupt v2 falls back to valid v1, then a visibly reported starter recovery. Write failures retain session data and the backup. Empty projects are valid; deleting a color clears roles; undo restores both.

### Playground, harmony, compatibility and preview

Cards support selection, names/tags, add, duplicate, remove, drag reorder and accessible earlier/later controls. Existing settings, locks, 50-entry history and one-edit-per-gesture behavior remain. Collection limit: 200. Optional project roles are independently editable and clearable.

Six pure OKLCH relationships use deterministic hue offsets or monochromatic lightness variations, existing sRGB gamut mapping, low-chroma handling, wrapping and HEX deduplication. Candidates remain temporary until explicitly added; users can preview, reject and restore them.

Compatibility reports WCAG 2.2 contrast and all four AA/AAA text thresholds, raw Euclidean OKLab distance, shortest hue angle, lightness/chroma differences and descriptive balance bins. The UI documents its heuristics and avoids aesthetic scores. Pair verdicts apply to specified foreground/background and size only.

Landing, Dashboard and Component library consume one temporary preview-role resolver. Resolution is valid override, optional project role, labeled fallback. Switching templates and overrides leaves canonical colors/history unchanged. Named pair contrast warnings include normal-size card headings on surfaces. Templates contain local sample interactions; no automatic corrections or final semantic token system.

### Accessibility and visual verification

The picker samples the actual HSL function instead of layering inaccurate gradients. Pointer capture, cleanup, keyboard navigation, independent saturation/lightness sliders, visible focus and draft errors remain. Native disclosures expose tools/inspector on mobile, keyboard/touch arrows supplement card dragging, and reduced motion disables selection transitions. Desktop/mobile screenshots were inspected; warm editorial typography, dotted canvas, borders and responsive cards remain. Viewport containment covers 320, 375, 768, 1024 and 1440 pixels. Browser flows assert no page/console errors, local restore, legacy migration, live previews, history and keyboard interaction.

Independent read-only review identified missing surface-heading contrast warnings and a card Roles action that failed to open a collapsed disclosure. Both were reproduced with failing RTL tests and fixed. A separate failing storage regression corrected corrupt-legacy recovery messaging. No important review finding remains deferred.

### Verification

| Check            | Result                                                                       |
| ---------------- | ---------------------------------------------------------------------------- |
| Lint             | Exit 0, zero warnings                                                        |
| Typecheck        | Exit 0                                                                       |
| Unit / RTL       | 155/155 across 11 files                                                      |
| Production build | Exit 0, `/` and `/studio` statically prerendered                             |
| Playwright       | 31 passed, 1 intentionally skipped, 1.3 minutes                              |
| Format check     | Exit 0, all files formatted (after generated Next declaration normalization) |
| Diff whitespace  | Exit 0                                                                       |

The one skip is the desktop-only drag test under mobile; mobile earlier/later and keyboard reorder are exercised separately. The initial new browser flow attempt passed 24/28; failures were a storage-status selector matching a slider output, a missing hydration wait in the canvas sample test, and mobile long-flow timing. Corrected new flows passed 6/6 before the full 31-pass run. A transient OneDrive Turbopack database-compaction warning occurred in the first browser run; the final browser run completed without that warning. Build and browser commands required outside-sandbox access. Next rewrites `next-env.d.ts` during dev; production build restores its production-route imports. Format verification normalizes that generated file only if necessary.

### Files created

- `components/studio/playground.tsx` — collection cards, actions, order and name/tag drafts.
- `components/studio/harmony-explorer.tsx` — relationship choice and preview/add/reject suggestions.
- `components/studio/compatibility-inspector.tsx` — pair selection, metrics, thresholds and balance.
- `components/studio/color-roles.tsx` — optional semantic role assignments.
- `components/preview/live-design-preview.tsx` — shared live templates and warnings.
- `lib/color/harmony.ts` — pure deterministic harmony calculations.
- `lib/color/compatibility.ts` — pure contrast, distance, relationships and balance.
- `lib/color/picker.ts` — exact HSL pixel conversion.
- `lib/preview-roles.ts` — shared temporary role resolution and named fallbacks.
- `tests/playground-store.test.ts` — migration, collection integrity, role cleanup and recovery.
- `tests/color/exploration.test.ts` — reference ratios, distance, harmony/gamut/neutral behavior and HSL pixels.
- `tests/playground-ui.test.tsx` — collection, harmony, roles, comparison, preview updates and review regressions.
- `tests/preview-roles.test.ts` — defaults, overrides and stale-reference resolution.
- `e2e/playground.spec.ts` — end-to-end creative flows, migration, canvas sampling and desktop drag.
- `docs/superpowers/specs/2026-11-07-color-playground.md` — current architecture, algorithms and boundaries.
- This implementation plan/completion report.

### Files modified

- `types/project.ts` — canonical entry, derived view, v2 project and optional roles.
- `lib/studio-project.ts` — starter, entry generation, canonical serialization and strict migration/restore.
- `store/color-studio-store.ts` — flexible mutations, safe references, history/selection repair and v2 persistence.
- `components/studio/studio-workspace.tsx` — collection-first composition, empty states and preserved editing.
- `components/studio/color-picker.tsx` — mathematically accurate canvas and accessible 2D description.
- `components/studio/color-inputs.tsx` — active flexible entry lookup.
- `app/globals.css` — cards, exploration panels, templates, responsive layout and restrained motion.
- `app/studio/page.tsx` — revised Playground product terminology.
- `tests/studio-store.test.ts`, `tests/studio-inputs.test.tsx`, `tests/studio-workspace.test.tsx` — retained behavior tests adapted from `families` to `colors`.
- `e2e/studio.spec.ts` — existing persistence assertions updated to v2/colors.
- `e2e/foundation.spec.ts` — adds 375px containment while retaining existing checks.
- `README.md` — current vision, capabilities, migration, algorithms and planned boundaries.

### Limitations and rulings

Opaque 8-bit sRGB only; gamut mapping and quantization can reduce chroma or merge suggestions. Harmony conventions and descriptive bins are not aesthetic guarantees. Preview checks are named pairing checks, not a complete accessibility audit. Native drag is desktop-oriented; touch uses explicit ordering buttons. History/preview assignments are session-only. Storage remains per device with no cloud or multi-tab merge. Final light/dark tokens, exports, brief generation and cinematic presentation remain planned.

Ruling: extend existing store and derived in-memory scales rather than replace them — preserves prior behavior and avoids unnecessary migrations beyond canonical v2. Ruling: preserve legacy sample names on the starter but leave roles unassigned — names are editable and no fixed family categories remain. Ruling: preserve public internal family-named action identifiers for existing integrations/tests; they now operate on any stable color ID. Ruling: execute the supplied approved scope inline without additional approval gates; use one independent final reviewer as required by the execution skill.

Suggested conventional commit: `feat: add flexible color playground, harmony and compatibility studio`

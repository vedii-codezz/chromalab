# CHROMA LAB

One color. An entire design language.

A Next.js App Router creative color laboratory. Enter with one color, collect possibilities, explore mathematical harmony relationships, compare measurable properties and preview combinations in realistic interfaces. Phase 03.5 / revised Phase 04 adds a flexible Color Playground to the existing editorial foundation and pure OKLCH engine. Semantic roles are optional.

## Run locally

Requires Node.js 22.12+ on the 22.x line, 24.x, or 26+ (Node 24 LTS recommended) and npm. Dependencies were resolved with Node 24.19.0 and npm 11.17.0.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Routes: `/` and `/studio`.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright starts its own development server at port 3100 and checks desktop and mobile Chromium. `npm run start` serves a production build. `npm run format` and `npm run format:check` maintain formatting. No environment variables are required. `next/font` downloads DM Sans and Instrument Serif during the initial build, requiring access to Google Fonts; the resulting fonts are self-hosted by Next.js.

## Implemented

- Server-rendered landing and Studio routes, working navigation and skip link.
- Shared warm neutral design system, editorial typography and static palette compositions.
- Ten authored Blue hour shade examples, three authored palette families and static component previews.
- Responsive tool/inspector disclosures; accurate HSL canvas picker, keyboard and touch controls, draft HEX/RGB/HSL entry, flexible color cards, generated shades, locks and inspector diagnostics. Presentation/export/brief controls remain unavailable.
- Stable-ID color collections (up to 200), editable names/tags, duplication/removal, drag reordering with keyboard/touch arrow controls, optional roles, 50-edit undo/redo, gesture coalescing and safe v1-to-v2 persistence migration.
- Deterministic OKLCH complementary, analogous, triadic, split-complementary, tetradic and monochromatic suggestions; explicit preview/add/reject. Neutral and gamut handling use the existing engine.
- Explicit foreground/background comparison: WCAG 2.2 ratios and AA/AAA text checks, OKLab distance, hue/lightness/chroma relationships and descriptive collection balance. No aesthetic score or universal accessibility verdict.
- Live Landing page, Dashboard and Component library previews using one temporary role resolver; editable mappings, named fallbacks and contrast warnings. Palette colors are never silently corrected.
- Scoped GSAP entrance animation with context/media cleanup and reduced-motion support. Content is visible with JavaScript disabled.
- Strict TypeScript, Tailwind v4, ESLint, Vitest/RTL and Playwright setup.
- Strict HEX/RGB/HSL/OKLCH validation, ten-step OKLCH generation, chroma-based sRGB gamut mapping, exact normalized anchors/locks and structured diagnostics.
- A server-rendered engine demonstration, separate from the authored palette cards.

## Architecture

- `app/`: routes, metadata, fonts and global visual tokens.
- `components/layout/`: shared brand.
- `components/shared/reveal.tsx`: small client animation boundary; the page content stays in server components.
- `components/shared/responsive-panel.tsx`: native disclosure enhancement; panels collapse on small screens and reopen when desktop space returns.
- `components/studio/`: interactive workspace, picker, drafts, Playground cards, harmony, comparison, optional roles and labeled legacy studies.
- `components/preview/`: authored examples plus live template previews; `lib/preview-roles.ts` provides one shared temporary role resolver, separate from future semantic tokens.
- `lib/color/demo-palettes.ts`: immutable, hand-authored samples. No color mathematics.
- `lib/color/{validation,conversion,gamut,tonal-scale,diagnostics}.ts`: pure engine modules without React, Zustand, browser or animation dependencies.
- `lib/color/{harmony,compatibility,picker}.ts`: pure exploration relationships, contrast/perceptual metrics and HSL pixel math.
- `types/color.ts`: public color input, output, options and diagnostic contracts.
- `tests/`, `e2e/`: content contracts and real browser flows.

Culori provides the engine's conversions. Zustand owns the editable project, bounded history and versioned local persistence. `types/project.ts`, `store/color-studio-store.ts` and `lib/studio-project.ts` define those boundaries. The final semantic token resolver remains future work.

Read the [design](docs/superpowers/specs/2026-11-05-chroma-lab-design.md) and [implementation plan](docs/superpowers/plans/2026-11-05-chroma-lab-implementation.md) for product decisions and future phases.

## Phase 02 — color engine

The pure engine uses Culori for conversion and actual display-lightness measurements. See the [Phase 02 design/API contract](docs/superpowers/specs/2026-11-05-chroma-lab-color-engine.md) and [execution plan](docs/superpowers/plans/2026-11-05-chroma-lab-color-engine.md).

```ts
import { normalizeColor } from "@/lib/color/conversion";
import { generateTonalScale } from "@/lib/color/tonal-scale";

const normalized = normalizeColor("hsl(218 41% 53%)");
const result = generateTonalScale("#5479B8", {
  anchor: 500,
  lightnessSpread: { lighter: 0.9, darker: 0.85 },
  chromaIntensity: 1,
  hueDrift: 10,
  locks: { 100: "#EEEEEE", 800: "#222222" },
});
if (result.ok) {
  // Exactly ten shades; hex is uppercase #RRGGBB.
  console.log(result.value.shades);
} else {
  // Contradictory lightness locks may retain a candidate in value.
  // It is not a valid scale: inspect errors before using it.
  console.error(result.errors);
}
```

Public entry points:

- `validateColorInput(input: unknown)` in `validation.ts` checks the documented opaque color subset.
- `normalizeColor(input: unknown)` in `conversion.ts` returns canonical HEX and explicit RGB/HSL/OKLCH representations.
- `mapToSrgb(color: OklchColor)` in `gamut.ts` maps validated OKLCH colors by chroma reduction.
- `generateTonalScale(base: unknown, options?: TonalScaleOptions)` in `tonal-scale.ts` returns the ten shades and errors/warnings.

Each returns `EngineResult<T>` with `ok`, `value`, `errors`, and `warnings`. Typed RGB uses fractional channels 0–1; RGB strings use 0–255 or all-percent channels. HSL objects use fractional S/L, HSL strings require percentages. OKLCH uses L 0–1 (or percent in strings), C 0–1, and degree hue. Hue wraps; null is allowed in typed neutral colors only. Unsupported CSS formats/alpha and invalid settings are errors, not silently clamped.

Generation uses piecewise smoothstep lightness between anchor/locked control points, a power-curve chroma taper, and bounded hue drift. The exact normalized anchor and locks bypass the curves. Gamut mapping uses 32 bisection iterations at fixed OKLCH L/H; only floating-point sRGB excursions within 1e-7 are bounded before serialization. Eight-bit HEX quantization may merge shades or slightly perturb L/H. Actual displayed lightness is checked afterward.

Diagnostics: `INVALID_COLOR_INPUT`, `INVALID_OPTIONS`, `GAMUT_ADJUSTED`, `DUPLICATE_SHADE`, `LIGHTNESS_ORDER_CONFLICT`, `ANCHOR_CONFLICT`, `LOCKED_SHADE_CONFLICT`. Each includes severity/message and contextual fields/shade identifiers where applicable. Conflicting anchor identity returns no scale. Impossible lock lightness order retains locked values in an invalid candidate. Out-of-gamut locks are rejected; callers can explicitly normalize them before locking.

Limitations: opaque sRGB HEX output only; no Display P3, alpha, color names, CSS expressions or full CSS color grammar. Normalized identity means the mapped, 8-bit display HEX, not unquantized numeric precision or original input spelling. Duplicate endpoint shades are unavoidable when anchoring pure white/black; they are warned, not artificially altered. No animation mutates engine data.

## Next phase

Phase 03.5 / revised Phase 04 is implemented. Client Brief Studio, AI recommendations, final light/dark semantic tokens, exports and cinematic presentation remain future work. Compatibility describes properties; aesthetic judgment is left to the designer.

## Dependency notes

`package-lock.json` records the resolved versions. The initial npm audit reports eight moderate development-tool advisories stemming from a transitive minimatch dependency in Next's ESLint configuration. The proposed automatic fix downgrades the Next ESLint config across a major version, so it has not been applied. No runtime dependency advisory was reported. Recheck with `npm audit` as upstream packages publish fixes. ESLint 9 is retained for compatibility with the React lint plugin's supported peer range.

The local repository is connected to the existing GitHub repository at https://github.com/vedii-codezz/chromalab. This phase does not push, deploy or create a commit. Deployment history has not been verified.

## Phase 03.5 / revised Phase 04 — Color Playground

Add or select any color card, drag the hue ring or inner saturation/lightness square, or commit a HEX/RGB/HSL field with Enter or blur. Escape restores the field. Arrow keys operate picker controls; Shift changes ten steps. Separate saturation and lightness sliders expose accessible controls. Settings adjust the anchor, lightness spreads, chroma intensity and hue drift through the existing engine. Use each card’s earlier/later buttons to reorder without dragging. Every color can exist without a role; one color can have multiple roles. Removing a color clears its role references.

All ten generated shades are selectable and lockable. A conflicting edit shows the engine diagnostic and retains the previous valid scale and locks. Undo/redo retain up to 50 edits; each pointer gesture is one edit. Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z work outside editable inputs. Reset requires confirmation and can be undone.

The version 2 project saves ordered canonical `colors` (ID/name/base HEX/anchor/settings/locks/tags) and optional `roleAssignments`. Scales and diagnostics are derived. Loading validates and regenerates colors after hydration. A valid `chroma-lab.project.v1` project migrates deterministically to `chroma-lab.project.v2`, preserving names, IDs, anchors, settings and locks and converting legacy IDs into roles. The legacy key is never overwritten or deleted. Corrupt v2 tries valid v1 before recovering a starter; unavailable storage preserves session editing. Selection resets to the first color/500 on refresh. Empty projects remain valid.

Harmony uses OKLCH hue offsets; monochromatic varies L. Low-chroma colors have no reliable hue relationship, and suggestions are deduplicated after sRGB gamut mapping. Compatibility uses raw Euclidean OKLab distance and exact WCAG 2.2 opaque sRGB luminance. Similarity and balance bins are documented Studio heuristics, not universal design standards. Ratios display to four decimals with a higher-precision value; thresholds use unrounded values. Normal AA/AAA require 4.5/7; large AA/AAA require 3/4.5. A passing pair does not make a whole palette accessible.

Live previews resolve temporary overrides → optional project role → labeled fallback. All templates share the same resolved values. Overrides, comparison choices and history are session-only; templates never alter project colors. Body/heading/action pair warnings help identify contrast problems without automatic corrections. This is not the final light/dark semantic token system or a complete UI accessibility audit.

See the [current architecture](docs/superpowers/specs/2026-11-07-color-playground.md) and [implementation record](docs/superpowers/plans/2026-11-07-color-playground.md). Earlier Phase 01–03 documents are historical. Browser persistence is device-local; no cloud or multi-tab merge is implemented. Only opaque sRGB is supported. Legacy authored palettes and the Phase 02 engine sample remain available in a disclosure. This phase does not commit, push or deploy.

# CHROMA LAB

One color. An entire design language.

A Next.js App Router creative color-system workspace. Phases 01–03 implement the editorial landing page, a pure OKLCH tonal engine, and an interactive manual color Studio with independent palettes, shade locks, undo/redo and validated local persistence.

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
- Responsive tool/inspector disclosures; hue ring and saturation/lightness square, keyboard and touch controls, draft HEX/RGB/HSL entry, three independent palette families, generated shades, locks and inspector diagnostics. Presentation/export/brief controls remain unavailable.
- Scoped GSAP entrance animation with context/media cleanup and reduced-motion support. Content is visible with JavaScript disabled.
- Strict TypeScript, Tailwind v4, ESLint, Vitest/RTL and Playwright setup.
- Strict HEX/RGB/HSL/OKLCH validation, ten-step OKLCH generation, chroma-based sRGB gamut mapping, exact normalized anchors/locks and structured diagnostics.
- A server-rendered engine demonstration, separate from the authored palette cards.

## Architecture

- `app/`: routes, metadata, fonts and global visual tokens.
- `components/layout/`: shared brand.
- `components/shared/reveal.tsx`: small client animation boundary; the page content stays in server components.
- `components/shared/responsive-panel.tsx`: native disclosure enhancement; panels collapse on small screens and reopen when desktop space returns.
- `components/studio/`: interactive workspace, picker, draft inputs, inspector, generated cards and labeled legacy studies.
- `components/preview/`: authored examples; these do not resolve live tokens yet.
- `lib/color/demo-palettes.ts`: immutable, hand-authored samples. No color mathematics.
- `lib/color/{validation,conversion,gamut,tonal-scale,diagnostics}.ts`: pure engine modules without React, Zustand, browser or animation dependencies.
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

Phase 03 manual editing is implemented. Brief recommendations, final semantic tokens, accessibility scoring, exports and cinematic presentation remain future work.

## Dependency notes

`package-lock.json` records the resolved versions. The initial npm audit reports eight moderate development-tool advisories stemming from a transitive minimatch dependency in Next's ESLint configuration. The proposed automatic fix downgrades the Next ESLint config across a major version, so it has not been applied. No runtime dependency advisory was reported. Recheck with `npm audit` as upstream packages publish fixes. ESLint 9 is retained for compatibility with the React lint plugin's supported peer range.

The local repository is connected to the existing GitHub repository at https://github.com/vedii-codezz/chromalab. This phase does not push, deploy or create a commit. Deployment history has not been verified.

## Phase 03 — manual editing

Choose Primary, Secondary or Accent, drag the hue ring or inner saturation/lightness square, or commit a HEX/RGB/HSL field with Enter or blur. Escape restores the field. Arrow keys operate picker controls; Shift changes ten steps. Separate saturation and lightness sliders are available. Settings adjust the anchor, lightness spreads, chroma intensity and hue drift through the existing engine.

All ten generated shades are selectable and lockable. A conflicting edit shows the engine diagnostic and retains the previous valid scale and locks. Undo/redo retain up to 50 edits; each pointer gesture is one edit. Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z work outside editable inputs. Reset requires confirmation and can be undone.

The version 1 local project saves canonical family data after valid edits, excluding history, drafts and temporary drag state. Loading validates and regenerates every family after hydration; corrupt or unavailable storage recovers safely. Family/shade selection resets on refresh. Preview colors use temporary, explicitly labeled 600/100/400/800 mappings, not final semantic tokens.

See the [Phase 03 architecture](docs/superpowers/specs/2026-11-07-chroma-lab-interactive-studio.md) and [implementation record](docs/superpowers/plans/2026-11-07-chroma-lab-interactive-studio.md). Browser persistence is device-local; no cloud or multi-tab merge is implemented. Arbitrary palette choices do not guarantee preview text contrast. Legacy authored palettes and the Phase 02 engine sample remain available in a disclosure.

# CHROMA LAB

One color. An entire design language.

A Next.js App Router creative color-system workspace. Phases 01–02 implement the editorial landing page, Studio foundation, and a pure OKLCH tonal engine with a static-input development demonstration. Interactive color editing is not implemented yet.

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
- Tool and inspector disclosure panels; presentation/export/brief controls explicitly unavailable.
- Scoped GSAP entrance animation with context/media cleanup and reduced-motion support. Content is visible with JavaScript disabled.
- Strict TypeScript, Tailwind v4, ESLint, Vitest/RTL and Playwright setup.
- Strict HEX/RGB/HSL/OKLCH validation, ten-step OKLCH generation, chroma-based sRGB gamut mapping, exact normalized anchors/locks and structured diagnostics.
- A server-rendered engine demonstration, separate from the authored palette cards.

## Architecture

- `app/`: routes, metadata, fonts and global visual tokens.
- `components/layout/`: shared brand.
- `components/shared/reveal.tsx`: small client animation boundary; the page content stays in server components.
- `components/shared/responsive-panel.tsx`: native disclosure enhancement; panels collapse on small screens and reopen when desktop space returns.
- `components/studio/`: workspace composition and the real engine's static-input development sample.
- `components/preview/`: authored examples; these do not resolve live tokens yet.
- `lib/color/demo-palettes.ts`: immutable, hand-authored samples. No color mathematics.
- `lib/color/{validation,conversion,gamut,tonal-scale,diagnostics}.ts`: pure engine modules without React, Zustand, browser or animation dependencies.
- `types/color.ts`: public color input, output, options and diagnostic contracts.
- `tests/`, `e2e/`: content contracts and real browser flows.

Culori provides the engine's conversions. Zustand remains installed for future editing work and is deliberately unused. Empty token/export/persistence/store directories have not been created. Project state, undo/redo, local storage and token resolution are planned, not implemented.

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

Phase 03 will add shared editable project state, manual controls and the common token resolver for previews/exports. These features are not implemented in Phase 02.

## Dependency notes

`package-lock.json` records the resolved versions. The initial npm audit reports eight moderate development-tool advisories stemming from a transitive minimatch dependency in Next's ESLint configuration. The proposed automatic fix downgrades the Next ESLint config across a major version, so it has not been applied. No runtime dependency advisory was reported. Recheck with `npm audit` as upstream packages publish fixes. ESLint 9 is retained for compatibility with the React lint plugin's supported peer range.

No deployment or GitHub push has been performed.

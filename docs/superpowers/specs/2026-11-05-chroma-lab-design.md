# CHROMA LAB design

Approved product decisions are supplied in the user brief. Foundation scope: two responsive, accessible routes with static demonstrations; no generator, persistence, exports, or cinematic presentation yet.

## Approach

Use Next.js App Router server components for content and a narrowly scoped client animation boundary. A fully client-rendered workspace would add state and hydration complexity before editing exists. A marketing-only prototype would omit the required studio foundation. The server-first foundation best fits this phase.

## Visual system

Warm #FAFAF7 canvas, white surfaces, #222222 text, #E8E8E3 borders and #5479B8 accent. Use a readable darker secondary ink for small labels. Editorial serif headlines pair with a clean sans-serif UI, dotted canvas, restrained shadows and tactile palette cards. Landing artwork is a static palette composition. Studio is explicitly a foundation preview with disabled coming-soon controls. At tablet/mobile widths panels flow into native disclosure sections and the workspace stays within the viewport.

## Product architecture and future contracts

- Manual Studio and Client Brief Studio will share one editable project state. Cinematic Presentation will read that project without mutations.
- OKLCH is canonical for generation. Each family has ten shades (50,100,200,300,400,500,600,700,800,900); the input anchors 500 by default. Preserve locked shades and safely map out-of-gamut colors.
- Future pure `lib/color` functions use Culori and have no React dependencies. Semantic tokens reference palette shade IDs; light/dark mappings are independent. One future token resolver must feed previews and all exports.
- Future Zustand state owns project edits and undo/redo; local-first persistence uses versioned schemas and migrations. No initial authentication.
- Future exports: CSS variables, Tailwind v4 theme tokens, JSON and complete project import/export.
- Brief recommendations in v1 are deterministic and explainable. Animation only reads rendered data and never changes color data.

## Foundation modules

`app` owns routes, metadata and visual tokens. `components/layout` owns shared branding/navigation; `components/shared` owns the GSAP reveal boundary; `components/studio` and `components/preview` compose static examples. `lib/color/demo-palettes.ts` contains explicitly authored demonstration swatches, not a generation algorithm. No unused state store or empty future directories.

## Motion and accessibility

Native tool/inspector disclosures are enhanced by a small `ResponsivePanel` client boundary: collapse tools below 640px and inspector below 1200px, reopen when returning to desktop space, and remove media listeners on unmount. Server-rendered content starts expanded and remains available without JavaScript.

GSAP matchMedia scoped inside a context animates entrance transforms/opacity only for no-preference users; revert on unmount and media changes. Content remains visible before JavaScript and under reduced motion. Native links/buttons/details, visible focus, skip navigation and labeled palette swatches preserve keyboard access. Disabled future actions are explained in adjacent text.

## Verification and boundaries

Vitest/RTL cover route content, links and honest unavailable controls. Playwright covers actual route navigation, desktop/mobile overflow, reduced motion and browser errors. Lint, strict TypeScript and production build are required. No deployment or GitHub push. The earlier reel is not a fidelity target for this replacement scope.

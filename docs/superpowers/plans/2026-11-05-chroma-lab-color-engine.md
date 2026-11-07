# Phase 02 implementation plan

**Goal:** A pure deterministic OKLCH tonal engine and one static-input Studio development sample.
**Architecture:** Strict validation → Culori conversion → hue/lightness-preserving gamut mapping → immutable normalization → constrained tonal curves → post-HEX diagnostics. All engine modules have no React, state, browser or animation dependencies.
**Spec:** `../specs/2026-11-05-chroma-lab-color-engine.md`.

1. Add explicit contracts in `types/color.ts`, diagnostic helpers and runtime input validation. Configure Node-environment `.test.ts` color tests alongside existing jsdom `.test.tsx` UI tests. Observe validation tests fail, then implement.
2. Add `lib/color/gamut.ts` and `conversion.ts`, exercising white/black, saturated and out-of-gamut colors, finite output and exact HEX normalization. Verify fixed-L/H gamut search and precision tolerance.
3. Test and implement `tonal-scale.ts`: ten fixed identifiers, anchor preservation, options validation, smoothstep segments through locks, chroma taper and bounded hue drift. Diagnose duplicates, ordering and lock/anchor conflicts. Cover input immutability and repeatability.
4. Add a server-rendered `components/studio/engine-demo.tsx` to the existing canvas. Test the generated sample content and warning presentation; keep authored samples clearly separate.
5. Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm test`. Perform independent review and fix material findings with regression tests. Document API, limitations, exact results and next-phase boundary. No push/deploy.

Review focus: exact normalized anchor/lock preservation; invalid boundary data; monochrome and endpoint division-by-zero; out-of-gamut round-off versus true clipping; actual post-HEX order; contradictory locks must not be silently repaired.

## Completion record — 2026-11-05

All five tasks are complete. No dependencies were added or upgraded. Independent read-only review found no actionable correctness issues; the suggested additional post-HEX inversion coverage was added. No review findings remain deferred.

Regression tests reproduced and verified fixes for half-byte RGB/HSL round-trip rounding, nullable neutral representation round-trips, and missing hue at the direct gamut boundary. Validation, gamut, tonal and development-demo tests were observed failing before implementation. Engine tests run in the Node environment, independently of browser APIs.

| Final command sequence                     | Result                                             |
| ------------------------------------------ | -------------------------------------------------- |
| `npm run lint`                             | Passed, exit 0, zero warnings                      |
| `npm run typecheck`                        | Passed, exit 0                                     |
| `npm test`                                 | Passed, 134 tests across 4 files                   |
| `npm run build`                            | Passed, exit 0; both routes statically prerendered |
| `npm test` (after build)                   | Passed again, 134 tests across 4 files             |
| `npm run test:e2e` (additional regression) | Passed, 16 desktop/mobile Chromium tests           |

The browser suite includes 320, 768, 1024 and 1440px containment, navigation, console errors, reduced motion and existing contrast checks. The new engine demonstration was also visually inspected in desktop and mobile screenshots: ten generated swatches, exact blue 500 anchor, and nine expected gamut warnings available in a disclosure. Screenshots are local ignored test artifacts, not application assets.

### File inventory

Created:

- `types/color.ts` — explicit contracts, frozen shade identifiers and structured results.
- `lib/color/validation.ts` — strict strings/typed objects and setting validation.
- `lib/color/conversion.ts` — normalized display identity and Culori conversions.
- `lib/color/gamut.ts` — fixed-L/H chroma bisection into sRGB.
- `lib/color/tonal-scale.ts` — constrained curves, anchors and locks.
- `lib/color/diagnostics.ts` — diagnostic construction and post-HEX checks.
- `components/studio/engine-demo.tsx` — fixed-input, real-output development sample.
- `tests/color/validation.test.ts`, `gamut.test.ts`, `tonal-scale.test.ts` — invariant/regression tests.
- This plan and `docs/superpowers/specs/2026-11-05-chroma-lab-color-engine.md` — API, equations, gamut strategy and decisions.

Modified:

- `components/studio/studio-workspace.tsx` — adds sample and updates stale future-generation copy.
- `app/globals.css` — scoped sample/diagnostic styles.
- `tests/pages.test.tsx` — distinguishes generated sample from authored examples.
- `tests/setup.ts`, `vitest.config.ts` — Node color tests alongside jsdom UI tests.
- `README.md` — current capabilities, public API, examples and limitations.

Rulings: normalized identity is uppercase 8-bit sRGB HEX, so input spelling/unquantized precision is not preserved. Out-of-gamut locks fail instead of silently mapping; callers can explicitly normalize before locking. Contradictory lightness locks return an invalid candidate (`ok:false`) with preserved colors; conflicting anchor identity returns no candidate. These behaviors are documented in the design/API contract.

Remaining boundaries: opaque sRGB output; documented CSS subset and C ≤ 1 domain; quantization can merge shades or perturb L/H, reported in warnings. Phase 03 interactive state/wheel/palette management/persistence was not implemented. No deployment or push was performed.

# Phase 02 — OKLCH color engine

This implements the user's Phase 02 brief within the existing server-first architecture. No interactive wheel, editable palette state, persistence, token resolver, deployment or Phase 03 work.

## Public contracts

`normalizeColor(unknown)` validates and normalizes opaque input into uppercase six-digit HEX and explicit RGB/HSL/OKLCH representations. String formats: #RGB, #RRGGBB, rgb() (comma or space syntax, numeric 0–255 or all-percent channels), hsl() (degrees plus percent S/L), oklch() (numeric or percent L, numeric C, degrees H). No alpha, named colors, missing channels, mixed separators, mixed RGB units, CSS expressions or other spaces. Typed objects use `mode`: rgb channels 0–1; hsl S/L 0–1; oklch L 0–1 and C 0–1. Finite hue angles wrap to [0,360); neutral hue normalizes to null. Unknown object keys are rejected. C ≤ 1 is an explicit supported-domain limit, not a claim about all possible OKLCH values.

`generateTonalScale(base, options?)` returns a structured result with value, errors and warnings. Exactly ten ordered shade records contain display HEX, actual display OKLCH, requested OKLCH, and anchor/lock flags. The normalized display HEX is the definition of exact preservation: shorthand expands, case becomes uppercase, non-HEX input quantizes to 8-bit sRGB. Original numeric precision beyond HEX is not preserved. Out-of-gamut base input maps first and reports a warning.

Settings: anchor is one of 50,100,200,300,400,500,600,700,800,900 (default 500); lightnessSpread has lighter/darker fractions [0,1] (defaults .9/.85); chromaIntensity [0,2] (default 1); hueDrift [-30,30] degrees (default 0). Settings never modify the anchor or locks. Invalid settings are errors, not clamped defaults.

Locks accept supported color inputs, are normalized once, and preserve that exact display value. Out-of-gamut locks are rejected rather than silently adjusted. Invalid locks fail without a scale. A different normalized lock at the anchor fails with ANCHOR_CONFLICT and no scale. Impossible pinned lightness order returns a candidate scale with unchanged locks and errors (`ok: false`); consumers must not treat that as a valid scale.

## Curves and constraints

Typed achromatic inputs may supply hue null (OKLCH C=0 or HSL S=0); chromatic missing/null hues are errors. RGB/HSL inputs serialize directly to HEX before perceptual conversion of the display result, avoiding half-byte tie changes from an unnecessary OKLCH round trip. Normalized representations round-trip through the public validator.

Index the ten identifiers 0–9, independent of their numeric gaps. The anchor and locks are fixed lightness control points. For unpinned endpoints, the light endpoint is max(pinned L) + (1 − max(pinned L)) × lighterSpread; the dark endpoint is min(pinned L) × (1 − darkerSpread). This expands the endpoint range when a lock requires it. Between adjacent points, L(t) = Lleft + (Lright − Lleft) × (3t² − 2t³). Smoothstep is explicit, monotonic and bounded when the pins are ordered; contradictory pins are diagnosed rather than reordered.

Generated chroma tapers toward black/white: C = Cbase × intensity × q^0.8, where q = (1−L)/(1−Lbase) on the lighter side and L/Lbase on the darker side. Clamp q to [0,1]; handle endpoints without division by zero. Neutral inputs stay neutral. Hue offset is drift × (index − anchorIndex) / max(anchorIndex, 9 − anchorIndex), wrapped to [0,360). The exact anchor bypasses all curves.

## Gamut strategy

Use Culori conversions, then a fixed 32-iteration binary search for the largest displayable chroma at fixed OKLCH L and H. Achromatic L=0/1 maps to exact black/white. Conversion round-off is tolerated only within 1e-7 sRGB channel units and then bounded for serialization; this is not general RGB clipping. Mapping emits GAMUT_ADJUSTED. Eight-bit HEX rounding can perturb hue/lightness and collapse nearby colors; inspect the actual serialized colors for duplicate and lightness diagnostics. This is an sRGB chroma-reduction strategy, not a full CSS perceptual/JND mapper or a wide-gamut export path.

## Diagnostics and verification

Structured errors/warnings include code, severity, message, optional field, shade identifiers, and numeric gamut details. Detect invalid input/settings, adjusted gamut, duplicate HEX, post-quantization lightness inversion and contradictory locks. Equality is allowed for non-increasing lightness; duplicates are separately warned. Use 1e-6 OKLCH lightness tolerance for numerical comparisons.

Tests use real Culori conversions and mathematical invariants, including endpoint/neutral/saturated inputs, nondefault anchors, lock changes and conflicts, malformed runtime data, settings boundaries, gamut preservation, determinism and immutability. A small server-rendered development demonstration is added without replacing existing authored examples. Run lint, typecheck, tests, production build, then tests again.

Reference: [Culori API](https://culorijs.org/api/) for conversion and gamut concepts; the installed Culori source is the implementation reference.

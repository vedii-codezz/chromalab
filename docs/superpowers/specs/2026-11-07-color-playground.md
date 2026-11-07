# Phase 03.5 / revised Phase 04 — Color Playground

This document supersedes the fixed-family product direction in the historical Phase 01–03 specifications. The supplied brief is the scope authority. CHROMA LAB is a creative laboratory: collect colors, generate tones, discover relationships, compare measurable properties and try combinations in realistic interfaces. Primary, Secondary and Accent are optional roles, not required containers. No AI service is involved.

## Data, migration and history

`ColorEntry` owns stable ID, editable name, normalized opaque base HEX, anchor, generation settings, locks and optional tags. `ColorProject` v2 contains ordered `colors` and optional `roleAssignments` for primary, secondary, accent, background, surface and text. The in-memory derived view also contains generated scales and warnings. Serialization writes canonical fields only. Collection size is bounded at 200 for browser performance; history remains bounded at 50 immutable project snapshots.

Legacy `chroma-lab.project.v1` stores three families in a version-1 envelope. Restore validates all entries, names, anchors, settings, locks, unique IDs and valid engine output before accepting the project. Migration preserves IDs, names, colors, settings and locks, converts the legacy IDs into role references, and regenerates scales deterministically. Successful migration writes `chroma-lab.project.v2` only. The v1 key is never deleted or overwritten. Invalid v2 tries valid v1 before recovering a starter. Unknown versions and malformed projects are rejected; no partially valid project is loaded. Storage exceptions leave session editing available. A failed migration write preserves the old backup and reports the problem.

Loading occurs in the existing client effect after hydration, before persistence writes. New starters use three sample colors with no role assignments. Empty projects are valid. Removing a color clears all references; clearing a role preserves its color. One color may serve multiple roles. Stable-ID operations cover add/remove/rename/duplicate/reorder/tags; all canonical changes are undoable. Unrelated color scales retain their references and are not regenerated. Selection, comparison, preview overrides and harmony candidates are UI state, outside persistence and history. Pointer capture, cancellation, loss, window blur and visibility cleanup close gesture transactions.

## Interface

Preserve the warm surface, serif headings, dotted canvas, fine borders and floating panels. Tools edit the selected color; the central Playground shows cards and tones; the right inspector compares explicit foreground/background choices. At narrower sizes native disclosures provide access to tools and comparison without permanent three-column layout. Cards show names, HEX, swatches, mini scales, roles and actions. HTML drag/drop reorders cards; labeled earlier/later buttons work on keyboard and touch. An empty collection has a visible Add color action.

The picker keeps its hue ring, HSL square and draft HEX/RGB/HSL fields. A sampled 160×160 canvas evaluates the exact HSL-to-sRGB formula at S=x/(width−1), L=1−y/(height−1), rather than compositing an inaccurate gradient. Display interpolation and 8-bit quantization still apply. The 2D control has keyboard instructions and a named role description; separate native saturation/lightness sliders expose independent values. Invalid drafts never alter canonical state. Hue is remembered for neutral editing. Reduced-motion preferences disable card transitions and existing entrance animation.

## Harmony

Pure `generateHarmony` uses displayed OKLCH, because its lightness/chroma are useful perceptual controls alongside the existing engine. Offsets: complementary 180°, analogous ±30°, triadic 120°/240°, split complementary 150°/210°, tetradic 90°/180°/270°. Monochromatic keeps hue/chroma and varies L by ±.11/±.22, bounded to .04–.96. Existing chroma-reduction gamut mapping fits requested colors to sRGB. HEX duplicates (including the base) are removed. Hue wraps modulo 360. Below C=.01, hue suggestions are suppressed with an explanation; monochromatic remains available at neutral/black/white endpoints. Suggestions regenerate deterministically as the selected base changes. Preview/reject/add are explicit; generation alone never adds colors.

These mathematical relationships are conventions for exploration, not proof of beauty or universal aesthetic suitability.

## Compatibility

WCAG 2.2 opaque sRGB: convert channel c using c/12.92 at c≤.04045, otherwise ((c+.055)/1.055)^2.4. Relative luminance is .2126R+.7152G+.0722B; contrast is (lighter+.05)/(darker+.05). Calculations use normalized displayed 8-bit HEX. Show the ratio to four decimal places plus a higher-precision calculated value; evaluate unrounded ratios. Normal AA 4.5, large AA 3, normal AAA 7, large AAA 4.5. Large means ≥24px or ≥18.67px bold. Verdicts apply to the explicit pairing and text size only.

Perceptual distance is Euclidean OKLab with L on 0–1, accurately labeled (not ΔE2000). Report shortest OKLCH hue angle, both lightness values, absolute ΔL and ΔC. Documented Studio heuristics: distance <.08 suggests low separation, ΔL<.10 similar lightness, hue≤30° similar, 180°±15° complementary; hue is undefined below C=.01. These are descriptions, not universal standards. Balance bins: light L≥.75; dark L<.40; midtone between; high chroma C≥.15; muted C<.06. Intermediate chroma belongs to neither chroma bin. No global palette accessibility or aesthetic score exists.

## Preview boundary

`resolvePreviewRoles` is the only temporary mapping implementation. For background, surface, heading, body, primaryAction, secondaryAction and accent, resolve a valid UI override, then its optional project role, then an explicitly listed fallback HEX. Stale overrides safely resolve through the same chain. Heading/body both use the text role by default but can be overridden independently. Templates consume identical CSS variables and update immediately without changing project data. Landing page, Dashboard and Component library contain local sample interactions; switching templates or changing overrides never changes palette colors or project history.

Named body, heading, surface, action-label and accent-text pairings show contrast warnings. Users choose corrections; no color is silently changed. Checks are not a complete accessibility audit. The future light/dark semantic token resolver may replace this boundary later; this phase does not implement final tokens or exports.

## Planned boundaries and limitations

Still planned: Client Brief Studio, AI recommendations, cloud/auth/collaboration, full light/dark semantic editor, CSS/Tailwind/JSON exports and cinematic presentation. Browser storage is local to one device; no multi-tab merge. History and preview overrides are session-only. Only opaque sRGB is supported. Collection colors are user choices and may produce poor contrast; diagnostics explain properties without deciding aesthetics. All earlier engine tests remain; existing Studio tests are adapted to the new colors schema while retaining their behavior assertions.

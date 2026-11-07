# Phase 03 — Interactive Studio architecture

Phase 03 implements the supplied manual editing brief. The established warm surfaces, dotted canvas, floating cards, native responsive panels and scoped GSAP entrance boundary remain. The earlier foundation and engine specifications remain historical records; this phase supersedes their future-state descriptions for manual editing, history and local persistence only.

## Data and engine boundaries

`types/project.ts` defines ColorProject and PaletteFamily. Each stable family ID (primary, secondary, accent) owns name, normalized base HEX, anchor, generation settings, lock HEX values, generated scale and engine warnings. Authored demo colors seed only the base colors; generated shades always come from `generateTonalScale`. Legacy studies are retained in a labeled disclosure. No color mathematics changed.

`lib/studio-project.ts` creates starter data, regenerates a family, serializes the canonical project, and validates restored data. Scale/warning objects are derived in memory, never trusted from storage. Phase 02 structured errors reject an entire edit; the previous valid project, locks and scale remain. Anchor conflicts require unlocking the anchor or choosing a compatible base.

## Store, history and persistence

`store/color-studio-store.ts` exports a vanilla Zustand factory for isolated tests and the client workspace store. Components subscribe to the active family, primitive selection/history values, or family summaries; unrelated families are not regenerated. Actions cover family/shade selection, base/settings edits, locks, undo/redo, reset and hydration.

Meaningful valid changes push immutable project references onto a 50-entry past stack. Selection does not enter history. New edits clear redo. Pointer down begins a gesture; release, cancellation or capture loss ends it and adds at most one starting snapshot. Unmount closes an open gesture. Invalid/no-op edits do not enter history. Reset asks for confirmation in the UI and is undoable. History itself is session-only.

Storage key `chroma-lab.project.v1` contains `{ version: 1, project: { families: [...] } }`. Each stored family includes only id, name, baseColor, anchor, settings and locks. Restoration validates identifiers, names, canonical hex, exact settings structure, locks and engine output. Unknown versions, corrupt JSON or invalid generation recover a starter project with a visible message. Storage exceptions leave in-memory editing available. Storage is read in a client effect after hydration and before any write. Gesture drafts, selection, diagnostics and history are not persisted; the last valid gesture result is saved at its boundary. Refresh returns selection to Primary/500 while preserving all family edits.

## Editing and accessibility

Draft fields accept partial text independently of committed color. Enter or blur commits using `normalizeColor`; Escape restores the valid value. Valid edits synchronize HEX/RGB/HSL without replacing the focused DOM input. Rejected edits retain their draft and report inline errors. The hue ring and HSL square use Pointer Events, pointer capture, local handlers and `touch-action: none`. Ring arrows adjust hue; square arrows adjust saturation/lightness; Shift changes ten steps. Separate native sliders expose saturation and lightness to assistive technology. Controls expose accessible names, selected/locked text, pressed states, focus outlines and error announcements. Ctrl/Cmd+Z and Shift+Z operate project history outside editable text/select controls. Existing reduced-motion handling remains.

The HSL square is a saturated-hue/gray horizontal gradient with white and black overlays above and below its lightness midpoint. Picker HSL is an interaction representation only; generation remains OKLCH.

## Temporary previews and limits

The active palette maps 600 to the sample button, 100 to tags/surface, and 400/600/800 to artwork. These temporary mappings are labeled in the UI and scoped CSS; they are not a semantic token resolver. Preview controls remain illustrative. No contrast scoring engine is introduced and arbitrary edited palette colors do not promise text contrast in previews.

Only opaque sRGB output and the documented Phase 02 input grammar are supported. Storage is per browser/device, with no multi-tab conflict resolver or cloud sync. No brief recommendations, harmony suggestions, final semantic token management, exports, presentation, authentication, database or AI integration are implemented.

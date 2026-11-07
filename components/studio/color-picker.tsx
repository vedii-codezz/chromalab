import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type KeyboardEvent,
} from "react";
import { hslPixel } from "@/lib/color/picker";
import { colorFromHex } from "@/lib/color/conversion";
import { studioStore, useStudio } from "@/store/color-studio-store";
const bound = (n: number) => Math.max(0, Math.min(1, n));
export function ColorPicker() {
  const hex = useStudio(
    (s) => s.project.colors.find((f) => f.id === s.activeFamilyId)!.baseColor,
  );
  const hsl = colorFromHex(hex).hsl;
  const [rememberedHue, setRememberedHue] = useState(218);
  const hue = hsl.h ?? rememberedHue;
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const node = canvas.current;
    if (!node || typeof CanvasRenderingContext2D === "undefined") return;
    const context = node.getContext("2d");
    if (!context) return;
    const size = node.width;
    const image = context.createImageData(size, size);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const rgb = hslPixel(hue, x / (size - 1), 1 - y / (size - 1));
        image.data.set([...rgb, 255], (y * size + x) * 4);
      }
    context.putImageData(image, 0, 0);
  }, [hue]);

  function change(h: number, s = hsl.s, l = hsl.l) {
    setRememberedHue(h);
    studioStore.getState().updateBaseColor({ mode: "hsl", h, s, l });
  }
  function move(e: PointerEvent<HTMLDivElement>, ring: boolean) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width,
      y = (e.clientY - rect.top) / rect.height;
    if (ring)
      change(((Math.atan2(x - 0.5, 0.5 - y) * 180) / Math.PI + 360) % 360);
    else change(hue, bound(x), 1 - bound(y));
  }
  function handlers(ring: boolean) {
    return {
      onPointerDown(e: PointerEvent<HTMLDivElement>) {
        if (!e.isPrimary || e.button !== 0) return;
        e.preventDefault();
        e.currentTarget.focus();

        e.currentTarget.setPointerCapture(e.pointerId);
        studioStore.getState().beginGesture();
        move(e, ring);
      },
      onPointerMove(e: PointerEvent<HTMLDivElement>) {
        if (
          e.currentTarget.hasPointerCapture(e.pointerId) &&
          studioStore.getState().gesture
        )
          move(e, ring);
      },
      onPointerUp(e: PointerEvent<HTMLDivElement>) {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          studioStore.getState().endGesture();
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      },
      onPointerCancel() {
        studioStore.getState().endGesture();
      },
      onLostPointerCapture() {
        studioStore.getState().endGesture();
      },
    };
  }
  function keys(e: KeyboardEvent<HTMLDivElement>, ring: boolean) {
    if (
      ![
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ].includes(e.key)
    )
      return;
    e.preventDefault();
    const step = e.shiftKey ? 10 : 1;
    if (ring)
      change(
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? 359
            : (hue +
                (["ArrowRight", "ArrowUp"].includes(e.key) ? step : -step) +
                360) %
              360,
      );
    else {
      const delta = step / 100;
      change(
        hue,
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? 1
            : bound(
                hsl.s +
                  (e.key === "ArrowRight"
                    ? delta
                    : e.key === "ArrowLeft"
                      ? -delta
                      : 0),
              ),
        bound(
          hsl.l +
            (e.key === "ArrowUp" ? delta : e.key === "ArrowDown" ? -delta : 0),
        ),
      );
    }
  }
  return (
    <div className="picker-shell">
      <div className="picker-stage">
        <div
          className="hue-ring"
          role="slider"
          tabIndex={0}
          aria-label="Hue"
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={Math.round(hue)}
          aria-valuetext={`${Math.round(hue)} degrees`}
          onKeyDown={(e) => keys(e, true)}
          {...handlers(true)}
        >
          <i
            className="picker-indicator hue-indicator"
            style={{
              left: `${50 + 44 * Math.sin((hue * Math.PI) / 180)}%`,
              top: `${50 - 44 * Math.cos((hue * Math.PI) / 180)}%`,
              background: `hsl(${hue} 100% 50%)`,
            }}
          />
        </div>
        <div
          className="sl-square"
          role="group"
          tabIndex={0}
          aria-label="Saturation and lightness"
          aria-roledescription="two-dimensional color picker"
          aria-describedby="picker-help"
          onKeyDown={(e) => keys(e, false)}
          {...handlers(false)}
        >
          <canvas
            ref={canvas}
            width={160}
            height={160}
            aria-hidden="true"
            className="picker-canvas"
          />
          <i
            className="picker-indicator"
            style={{
              left: `${hsl.s * 100}%`,
              top: `${(1 - hsl.l) * 100}%`,
              background: hex,
            }}
          />
        </div>
      </div>
      <p id="picker-help" className="sr-only">
        Use arrows for hue. In the square, left and right adjust saturation; up
        and down adjust lightness. Shift adjusts ten steps. Sliders below
        provide separate controls.
      </p>
      <div className="picker-ranges">
        {(
          [
            ["Saturation", hsl.s],
            ["Lightness", hsl.l],
          ] as const
        ).map(([name, value]) => (
          <label key={name}>
            {name} <output>{Math.round(value * 100)}%</output>
            <input
              aria-label={name}
              type="range"
              min="0"
              max="100"
              value={Math.round(value * 100)}
              onPointerDown={() => studioStore.getState().beginGesture()}
              onPointerUp={() => studioStore.getState().endGesture()}
              onPointerCancel={() => studioStore.getState().endGesture()}
              onLostPointerCapture={() => studioStore.getState().endGesture()}
              onBlur={() => studioStore.getState().endGesture()}
              onChange={(e) =>
                change(
                  hue,
                  name === "Saturation" ? Number(e.target.value) / 100 : hsl.s,
                  name === "Lightness" ? Number(e.target.value) / 100 : hsl.l,
                )
              }
            />
          </label>
        ))}
      </div>
    </div>
  );
}

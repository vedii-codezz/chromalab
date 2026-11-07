/** Exact HSL-to-sRGB channels, shared by the sampled square and coordinate tests. */
export function hslPixel(
  h: number,
  s: number,
  l: number,
): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [channel(0), channel(8), channel(4)];
}

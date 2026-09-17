/**
 * Lightens (`amount` > 0) or darkens (`amount` < 0) a `#rrggbb` colour, where 1
 * is white and -1 is black. Every shaded surface in the app — the pets and the
 * food illustrations alike — is built from one base colour plus this, so a
 * palette change stays a one-line change.
 */
export function shade(hex: string, amount: number): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) throw Error("ต้องเป็นสีแบบ #rrggbb");
  const n = parseInt(m[1], 16);
  const mix = (channel: number) =>
    Math.round(
      amount >= 0
        ? channel + (255 - channel) * Math.min(1, amount)
        : channel * (1 + Math.max(-1, amount)),
    );
  const out = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
  return "#" + out.map((c) => c.toString(16).padStart(2, "0")).join("");
}

/**
 * Pose une boîte rectangulaire (largeur w, hauteur h) sur quatre points de l'écran : c'est ainsi que la vraie
 * vidéo épouse, en perspective, la dalle du moniteur rendu dans Blender (coins exportés dans corners.json).
 * Projection carré unité → quadrilatère (Heckbert, « Fundamentals of Texture Mapping », 1989), puis mise à
 * l'échelle de la boîte. À utiliser avec transform-origin: 0 0. Test : homography.test.ts.
 */
export type Point = readonly [number, number];
export type Quad = readonly [Point, Point, Point, Point];

/** Coins dans l'ordre haut-gauche, haut-droite, bas-droite, bas-gauche → les 16 valeurs de matrix3d (par colonnes). */
export function quadMatrix(w: number, h: number, q: Quad): number[] {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const sx = x0 - x1 + x2 - x3;
  const sy = y0 - y1 + y2 - y3;
  let a: number, b: number, d: number, e: number, g: number, k: number;
  if (Math.abs(sx) < 1e-9 && Math.abs(sy) < 1e-9) {
    // Parallélogramme : simple transformation affine.
    a = x1 - x0;
    b = x2 - x1;
    d = y1 - y0;
    e = y2 - y1;
    g = 0;
    k = 0;
  } else {
    const dx1 = x1 - x2;
    const dx2 = x3 - x2;
    const dy1 = y1 - y2;
    const dy2 = y3 - y2;
    const den = dx1 * dy2 - dx2 * dy1;
    g = (sx * dy2 - dx2 * sy) / den;
    k = (dx1 * sy - sx * dy1) / den;
    a = x1 - x0 + g * x1;
    b = x3 - x0 + k * x3;
    d = y1 - y0 + g * y1;
    e = y3 - y0 + k * y3;
  }
  return [a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1];
}

export const toMatrix3d = (m: number[]): string => `matrix3d(${m.map((v) => +v.toFixed(9)).join(',')})`;

/** Où tombe le point (x, y) de la boîte une fois transformé (sert aux étiquettes accrochées à l'écran). */
export function project(m: number[], x: number, y: number): [number, number] {
  const w = m[3] * x + m[7] * y + m[15];
  return [(m[0] * x + m[4] * y + m[12]) / w, (m[1] * x + m[5] * y + m[13]) / w];
}

/** Image de taille (sw, sh) affichée en « cover » dans (vw, vh) : position et taille, en pixels. */
export function coverBox(sw: number, sh: number, vw: number, vh: number): { x: number; y: number; w: number; h: number } {
  const s = Math.max(vw / sw, vh / sh);
  const w = sw * s;
  const h = sh * s;
  return { x: (vw - w) / 2, y: (vh - h) / 2, w, h };
}

/**
 * Vérifie que la vidéo tombe pile sur les coins de l'écran 3D.
 * Lancer : node --experimental-strip-types src/scripts/lib/homography.test.ts
 */
import assert from 'node:assert/strict';
import { coverBox, project, quadMatrix, type Quad } from './homography.ts';

const W = 1600;
const H = 900;
const close = (a: number, b: number, label: string) => assert.ok(Math.abs(a - b) < 1e-6, `${label} : ${a} ≠ ${b}`);
const box: [number, number][] = [
  [0, 0],
  [W, 0],
  [W, H],
  [0, H],
];

// 1. Un rectangle identique à la boîte : matrice identité.
const id = quadMatrix(W, H, box as unknown as Quad);
[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1].forEach((v, i) => close(id[i], v, `identité[${i}]`));

// 2. Un vrai quadrilatère en perspective (image 0 du travelling, en pixels) : chaque coin arrive à sa place.
const quad: Quad = [
  [512, 271],
  [890, 256],
  [888, 484],
  [523, 550],
];
const m = quadMatrix(W, H, quad);
box.forEach(([x, y], i) => {
  const [px, py] = project(m, x, y);
  close(px, quad[i][0], `coin ${i} x`);
  close(py, quad[i][1], `coin ${i} y`);
});

// 3. Le centre de la boîte reste à l'intérieur du quadrilatère.
const [cx, cy] = project(m, W / 2, H / 2);
assert.ok(cx > 512 && cx < 890 && cy > 256 && cy < 550, 'centre hors de l’écran');

// 4. « cover » : une image 16:9 dans un écran 4:3 déborde à gauche et à droite, à égalité.
const c = coverBox(1600, 900, 1024, 768);
close(c.h, 768, 'cover hauteur');
close(c.x, -(c.w - 1024) / 2, 'cover centrage');

console.log('homography : 4 vérifications réussies');

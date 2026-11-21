// Shared building blocks: toon materials, primitive helpers, canvas textures.
import * as THREE from 'three';

const grad = new THREE.DataTexture(new Uint8Array([120, 195, 255]), 3, 1, THREE.RedFormat);
grad.minFilter = grad.magFilter = THREE.NearestFilter;
grad.needsUpdate = true;

const matCache = new Map();
export function mat(color, opts) {
  if (color && color.isMaterial) return color;
  if (!opts) {
    const k = String(color);
    if (!matCache.has(k)) matCache.set(k, new THREE.MeshToonMaterial({ color, gradientMap: grad }));
    return matCache.get(k);
  }
  return new THREE.MeshToonMaterial({ color, gradientMap: grad, ...opts });
}

const glowCache = new Map();
export function glow(color) {
  if (!glowCache.has(color)) glowCache.set(color, new THREE.MeshBasicMaterial({ color }));
  return glowCache.get(color);
}

function put(p, geo, color, x, y, z, shadow = true) {
  const m = new THREE.Mesh(geo, mat(color));
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  if (p) p.add(m);
  return m;
}

// All "standing" helpers take y as the BOTTOM of the shape.
export const box = (p, w, h, d, c, x = 0, y = 0, z = 0) => put(p, new THREE.BoxGeometry(w, h, d), c, x, y + h / 2, z);
export const cyl = (p, rt, rb, h, c, x = 0, y = 0, z = 0, seg = 16) => put(p, new THREE.CylinderGeometry(rt, rb, h, seg), c, x, y + h / 2, z);
export const cone = (p, r, h, c, x = 0, y = 0, z = 0, seg = 16) => put(p, new THREE.ConeGeometry(r, h, seg), c, x, y + h / 2, z);
export const sph = (p, r, c, x = 0, y = 0, z = 0, ws = 16, hs = 12) => put(p, new THREE.SphereGeometry(r, ws, hs), c, x, y, z);
export const dome = (p, r, c, x = 0, y = 0, z = 0, seg = 16) =>
  put(p, new THREE.SphereGeometry(r, seg, Math.ceil(seg / 2), 0, Math.PI * 2, 0, Math.PI / 2), c, x, y, z);
export const geo = (p, g, c, x = 0, y = 0, z = 0) => put(p, g, c, x, y, z);

export function plane(p, w, d, c, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(c));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.receiveShadow = true;
  if (p) p.add(m);
  return m;
}

const UP = new THREE.Vector3(0, 1, 0);
export function beam(p, a, b, t, c) {
  const A = Array.isArray(a) ? new THREE.Vector3(...a) : a;
  const B = Array.isArray(b) ? new THREE.Vector3(...b) : b;
  const dir = new THREE.Vector3().subVectors(B, A);
  const m = put(p, new THREE.BoxGeometry(t, dir.length(), t), c, 0, 0, 0);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, dir.normalize());
  return m;
}

// Square frustum (4-sided), base side w x d, top scaled by k. y = bottom.
export function frustum(p, w, d, h, k, c, x = 0, y = 0, z = 0) {
  const g = new THREE.CylinderGeometry(Math.SQRT1_2 * k, Math.SQRT1_2, 1, 4, 1);
  g.rotateY(Math.PI / 4);
  const m = put(p, g, c, x, y + h / 2, z);
  m.scale.set(w, h, d);
  return m;
}

// Triangular prism roof: ridge runs along z, triangle across x (width w).
export function prism(p, w, h, d, c, x = 0, y = 0, z = 0) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.lineTo(-w / 2, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
  g.translate(0, 0, -d / 2);
  return put(p, g, c, x, y, z);
}

export function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 4;
  return t;
}

export function texMat(tex, opts = {}) {
  return new THREE.MeshToonMaterial({ color: '#ffffff', map: tex, gradientMap: grad, ...opts });
}

export const FONT = "'Baloo 2', 'Trebuchet MS', sans-serif";

export function textSprite(text, { size = 0.5, fg = '#2b2140', bg = 'rgba(255,255,255,0.92)', px = 48 } = {}) {
  const c = document.createElement('canvas').getContext('2d');
  c.font = `800 ${px}px ${FONT}`;
  const tw = Math.ceil(c.measureText(text).width) + px;
  const th = Math.ceil(px * 1.5);
  c.canvas.width = tw; c.canvas.height = th;
  c.font = `800 ${px}px ${FONT}`;
  c.fillStyle = bg;
  const r = th / 2;
  c.beginPath(); c.roundRect(0, 0, tw, th, r); c.fill();
  c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(text, tw / 2, th / 2 + px * 0.06);
  const t = new THREE.CanvasTexture(c.canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false }));
  s.scale.set(size * tw / th, size, 1);
  return s;
}

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Water: one shared animated ripple texture per colour.
export const waterTex = [];
export function water(p, w, d, x, y, z, color = '#3fa7e0') {
  const t = canvasTex(128, 128, (c, W, H) => {
    c.fillStyle = color; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 3; c.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const yy = (i * 37) % H, xx = (i * 53) % W;
      c.beginPath(); c.moveTo(xx, yy); c.quadraticCurveTo(xx + 10, yy - 6, xx + 22, yy); c.stroke();
    }
  }, w / 8, d / 8);
  waterTex.push(t);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), texMat(t));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.receiveShadow = true;
  p.add(m);
  return m;
}

// Builds the stitched city: one cell per stop, joined end to end.
import * as THREE from 'three';
import { CELL, STOPS } from './stops.js';
import { mat, glow, box, cyl, cone, sph, dome, plane, prism, frustum, canvasTex, texMat, textSprite, rng, waterTex, FONT } from './kit.js';
import { makeCharacter } from './characters.js';
import { LANDMARKS } from './landmarks.js';

const H = CELL / 2;

// ---------- building styles ----------
const STYLES = {
  classic:    { pal: ['#efe2c4', '#e8cf9a', '#d9c7b0', '#f2e6d0', '#cdbfa8'], h: [13, 19], w: [8, 13], roof: 'mansard', roofC: '#5d6670', win: '#3d4b63', frame: '#fff7e6' },
  colonial:   { pal: ['#c8553d', '#e0a458', '#e8b4b8', '#f2e3c6', '#b5651d'], h: [9, 13], w: [8, 12], roof: 'flat', roofC: '#a5512f', win: '#2e3b4e', frame: '#fff4dc' },
  haussmann:  { pal: ['#efe6d3', '#e9dfc8', '#f3ecdc'], h: [15, 19], w: [9, 13], roof: 'mansard', roofC: '#6f7d8c', win: '#384a66', frame: '#ffffff', balcony: '#2b2b2b' },
  georgian:   { pal: ['#a2493a', '#8f3f33', '#b5603f', '#d9cfbf'], h: [11, 16], w: [7, 11], roof: 'flat', roofC: '#4a4a4a', win: '#26303f', frame: '#ffffff', chimney: true },
  skyscraper: { pal: ['#8aa0b8', '#b4c2d0', '#6f8299', '#c9b79c', '#9db0a8'], h: [34, 58], w: [10, 15], roof: 'flat', roofC: '#555', win: '#bfe3ff', frame: '#5d6f84', glass: true, billboards: true },
  roman:      { pal: ['#e0a458', '#d97b4a', '#e8c07a', '#c9603c', '#f0d09a'], h: [11, 15], w: [8, 12], roof: 'tile', roofC: '#c0573a', win: '#3b2f2a', frame: '#f6e4c4', shutters: '#3f7a4a' },
  modernista: { pal: ['#f3e2c4', '#e9c9a6', '#d8e2dc', '#f6d6c4', '#e8d7a9'], h: [13, 18], w: [8, 12], roof: 'flat', roofC: '#b86f4c', win: '#2f3f55', frame: '#ffffff', balcony: '#3a3a3a' },
  neon:       { pal: ['#d6d9df', '#b9bec8', '#e8e8ec', '#9fa6b2', '#c8c0b8'], h: [20, 34], w: [8, 12], roof: 'flat', roofC: '#666', win: '#2a3348', frame: '#7a8290', neon: true },
  canal:      { pal: ['#7a3b2a', '#5a3a2a', '#2f4f3f', '#f2efe6', '#8a4a32', '#3c3c44'], h: [13, 17], w: [5, 7], roof: 'stepped', roofC: '#3a2a22', win: '#1f2a36', frame: '#ffffff' },
  hollywood:  { pal: ['#f6d3c2', '#bfe3d8', '#f7e7a6', '#f2b8c6', '#ffffff'], h: [6, 10], w: [10, 14], roof: 'flat', roofC: '#d9a066', win: '#28394f', frame: '#ffffff', deco: true },
  desert:     { pal: ['#e3c48f', '#d9b27a', '#ead2a6', '#cfa36a'], h: [4, 8], w: [8, 12], roof: 'flat', roofC: '#c99d5e', win: '#3a2a1a', frame: '#f4e2c0' },
  mughal:     { pal: ['#b5523b', '#a8452f', '#c46a4c'], h: [8, 12], w: [10, 14], roof: 'chhatri', roofC: '#f4efe6', win: '#3a1f18', frame: '#f4e2d0', arches: true },
  harbour:    { pal: ['#9fc6dd', '#c6dbe6', '#7fb0cc', '#e6edf2'], h: [18, 30], w: [10, 14], roof: 'flat', roofC: '#6a7a88', win: '#d7f0ff', frame: '#6a8aa4', glass: true },
};

const facadeCache = new Map();
function facadeTex(style, color) {
  const k = style + color;
  if (facadeCache.has(k)) return facadeCache.get(k);
  const S = STYLES[style];
  const t = canvasTex(64, 72, (c, w, h) => {
    c.fillStyle = color; c.fillRect(0, 0, w, h);
    if (S.glass) {
      c.fillStyle = S.win; c.fillRect(3, 3, w - 6, h - 10);
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(6, 6, 10, h - 18);
      c.fillStyle = S.frame; c.fillRect(0, h - 7, w, 7);
      return;
    }
    const ww = S.arches ? 24 : 22, wh = style === 'canal' ? 44 : 34;
    const x = (w - ww) / 2, y = 16;
    c.fillStyle = S.frame; c.fillRect(x - 3, y - 3, ww + 6, wh + 8);
    c.fillStyle = S.win;
    if (S.arches) {
      c.beginPath(); c.moveTo(x, y + wh); c.lineTo(x, y + 10);
      c.quadraticCurveTo(x + ww / 2, y - 12, x + ww, y + 10); c.lineTo(x + ww, y + wh); c.fill();
    } else {
      c.fillRect(x, y, ww, wh);
      c.fillStyle = 'rgba(255,255,255,0.28)'; c.fillRect(x + 3, y + 3, 5, wh - 6);
      c.fillStyle = S.frame; c.fillRect(x + ww / 2 - 1.5, y, 3, wh); c.fillRect(x, y + wh * 0.45, ww, 3);
    }
    if (S.shutters) { c.fillStyle = S.shutters; c.fillRect(x - 9, y, 6, wh); c.fillRect(x + ww + 3, y, 6, wh); }
    if (S.balcony) { c.fillStyle = S.balcony; c.fillRect(x - 6, y + wh + 2, ww + 12, 3); for (let i = 0; i < 7; i++) c.fillRect(x - 6 + i * ((ww + 12) / 6), y + wh - 6, 1.5, 8); }
  });
  facadeCache.set(k, t);
  return t;
}

const SIGN_WORDS = ['SNAP!', 'WOW', 'SHOW', 'PIZZA', '★★★', 'SALE', 'NOODLES', 'KARAOKE', 'CAFÉ', 'LOVE', 'SMILE', 'HELLO', 'RAMEN', 'TICKETS', 'DANCE'];
const NEON = ['#ff3d7f', '#3df2ff', '#ffe03d', '#7dff3d', '#ff8a3d', '#b46bff'];
function signTex(word, color, vertical) {
  return canvasTex(vertical ? 64 : 256, vertical ? 256 : 96, (c, w, h) => {
    c.fillStyle = '#16121f'; c.fillRect(0, 0, w, h);
    c.strokeStyle = color; c.lineWidth = 6; c.strokeRect(5, 5, w - 10, h - 10);
    c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle';
    if (vertical) {
      c.font = `800 44px ${FONT}`;
      const letters = word.replace(/[^A-Z★!É]/g, '').slice(0, 5).split('');
      letters.forEach((l, i) => c.fillText(l, w / 2, 36 + i * (190 / Math.max(letters.length, 1))));
    } else {
      c.font = `800 60px ${FONT}`; c.fillText(word, w / 2, h / 2 + 4);
    }
  });
}

function makeBuilding(styleName, w, d, h, R, low) {
  const S = STYLES[styleName];
  const g = new THREE.Group();
  const color = S.pal[Math.floor(R() * S.pal.length)];
  const tex = facadeTex(styleName, color);
  const front = tex.clone(); front.repeat.set(Math.max(1, Math.round(w / 3.4)), Math.max(1, Math.round(h / 3.8))); front.needsUpdate = true;
  const side = tex.clone(); side.repeat.set(Math.max(1, Math.round(d / 3.4)), Math.max(1, Math.round(h / 3.8))); side.needsUpdate = true;
  const fm = texMat(front), sm = texMat(side), rm = mat(S.roofC);
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [sm, sm, rm, rm, fm, fm]);
  body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  // ground-floor shop band
  if (!S.glass && styleName !== 'desert') {
    box(g, w + 0.05, 3.2, d + 0.05, '#f7f1e4', 0, 0, 0).material = mat(darken(color, 0.86));
    const shopC = ['#2a9d8f', '#e76f51', '#264653', '#e9c46a', '#8338ec', '#d62828'][Math.floor(R() * 6)];
    box(g, w * 0.7, 2.2, 0.1, '#2b3a4a', 0, 0.3, d / 2 + 0.03);
    const awn = box(g, w * 0.8, 0.25, 1.4, shopC, 0, 2.7, d / 2 + 0.7);
    awn.rotation.x = 0.25;
  }
  // roofs
  switch (S.roof) {
    case 'mansard': frustum(g, w, d, 3.2, 0.72, S.roofC, 0, h, 0); break;
    case 'tile': { const r = prism(g, d, 2.4, w, S.roofC, 0, h, 0); r.rotation.y = Math.PI / 2; break; }
    case 'stepped': {
      const c = color;
      box(g, w, 2.2, 0.6, c, 0, h, d / 2 - 0.3);
      box(g, w * 0.66, 2.0, 0.6, c, 0, h + 2.2, d / 2 - 0.3);
      box(g, w * 0.33, 1.6, 0.6, c, 0, h + 4.2, d / 2 - 0.3);
      prism(g, w, 4.5, d - 0.8, S.roofC, 0, h, -0.4);
      box(g, 0.5, 0.5, 0.6, '#ffffff', 0, h + 5.8, d / 2 - 0.3);
      break;
    }
    case 'chhatri': {
      box(g, w, 0.8, d, S.frame, 0, h, 0);
      for (const sx of [-1, 1]) {
        const x = sx * (w / 2 - 1.6);
        for (const [px, pz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) cyl(g, 0.15, 0.15, 1.6, '#f4efe6', x + px, h + 0.8, d / 2 - 1.6 + pz, 6);
        box(g, 2.4, 0.3, 2.4, '#f4efe6', x, h + 2.4, d / 2 - 1.6);
        const dm = sph(g, 1.1, '#f4efe6', x, h + 2.7, d / 2 - 1.6, 12, 8);
        dm.scale.y = 1.2;
      }
      break;
    }
    default: {
      box(g, w + 0.3, 0.6, d + 0.3, S.roofC, 0, h, 0);
      if (S.chimney) for (let i = 0; i < 2; i++) box(g, 1, 2, 1, '#7a3b2e', (i - 0.5) * w * 0.5, h + 0.6, -d * 0.2);
      if (styleName === 'skyscraper' && R() < 0.5) { cyl(g, 1.4, 1.4, 2.6, '#8a6a4a', w * 0.25, h + 2.2, 0, 12); cone(g, 1.6, 1.2, '#6a4a2a', w * 0.25, h + 4.8, 0, 12); for (const sx of [-1, 1]) cyl(g, 0.1, 0.1, 2.2, '#555', w * 0.25 + sx, h, 0, 4); }
    }
  }
  if (S.deco) { box(g, w * 0.3, 2.2, 0.4, darken(color, 0.8), 0, h, d / 2 - 0.2); }
  // signs
  if (S.billboards) {
    const n = 2 + Math.floor(R() * 2);
    for (let i = 0; i < n; i++) {
      const word = SIGN_WORDS[Math.floor(R() * SIGN_WORDS.length)], col = NEON[Math.floor(R() * NEON.length)];
      const bw = Math.min(w * 0.85, 8 + R() * 4), bh = bw * 0.38;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), new THREE.MeshBasicMaterial({ map: signTex(word, col, false) }));
      m.position.set((R() - 0.5) * (w - bw) * 0.8, 7 + i * (bh + 3) + R() * 2, d / 2 + 0.12);
      g.add(m);
    }
  }
  if (S.neon) {
    const n = low ? 1 : 2 + Math.floor(R() * 2);
    for (let i = 0; i < n; i++) {
      const word = SIGN_WORDS[Math.floor(R() * SIGN_WORDS.length)], col = NEON[Math.floor(R() * NEON.length)];
      const vertical = i % 2 === 0;
      const sw = vertical ? 1.6 : Math.min(w * 0.8, 7), sh = vertical ? 6.4 : 2.6;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshBasicMaterial({ map: signTex(word, col, vertical), side: THREE.DoubleSide }));
      if (vertical) { m.position.set((R() < 0.5 ? -1 : 1) * (w / 2 - 1.2), 5 + R() * Math.max(1, h - 12), d / 2 + 0.9); m.rotation.y = Math.PI / 2; }
      else m.position.set(0, 4.2 + i * 3.5, d / 2 + 0.12);
      g.add(m);
    }
  }
  return g;
}

function darken(hex, k) {
  const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString();
}

// ---------- ground textures ----------
const GROUND = {
  cobble: () => canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#b9ada0'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      c.fillStyle = ['#c9bdb0', '#a99d90', '#bfb3a6', '#d2c7ba'][(x * 7 + y * 3) % 4];
      c.beginPath(); c.roundRect(x * 16 + (y % 2) * 8 + 1, y * 16 + 1, 14, 14, 4); c.fill();
    }
  }, 12, 12),
  plaza: () => canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#e8dcc6'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#d3c5ac'; c.lineWidth = 2;
    for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32, h); c.stroke(); c.beginPath(); c.moveTo(0, i * 32); c.lineTo(w, i * 32); c.stroke(); }
  }, 10, 10),
  asphalt: () => canvasTex(64, 64, (c, w, h) => { c.fillStyle = '#c8c4bc'; c.fillRect(0, 0, w, h); c.strokeStyle = '#b5b1a9'; c.lineWidth = 2; c.strokeRect(0, 0, w, h); }, 20, 20),
  brick: () => canvasTex(128, 64, (c, w, h) => {
    c.fillStyle = '#9c5a45'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#b06a50';
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) c.fillRect(x * 16 + (y % 2) * 8 + 1, y * 8 + 1, 14, 6);
  }, 14, 28),
  rambla: () => canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#e9d9b8'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#d9c39a'; c.lineWidth = 6;
    for (let i = -1; i < 5; i++) { c.beginPath(); for (let x = 0; x <= w; x += 8) c.lineTo(x, i * 32 + Math.sin(x / 20) * 8); c.stroke(); }
  }, 10, 10),
  wave: () => canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#f7f3ea'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#2a2a2a';
    for (let i = 0; i < 4; i++) {
      c.beginPath(); c.moveTo(0, i * 32);
      for (let x = 0; x <= w; x += 4) c.lineTo(x, i * 32 + 8 + Math.sin(x / w * Math.PI * 2) * 8);
      for (let x = w; x >= 0; x -= 4) c.lineTo(x, i * 32 + 18 + Math.sin(x / w * Math.PI * 2) * 8);
      c.fill();
    }
  }, 8, 8),
  stars: () => canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#3a3438'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#e88aa6';
    star(c, 64, 64, 34, 15);
    c.fillStyle = '#d8b24a'; c.fillRect(0, 0, w, 4); c.fillRect(0, 0, 4, h);
  }, 10, 10),
  scramble: () => canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#5a5d66'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#f2f2f2';
    for (let i = 0; i < 12; i++) { c.fillRect(i * 20 + 8, 6, 10, 46); c.fillRect(i * 20 + 8, h - 52, 10, 46); c.fillRect(6, i * 20 + 8, 46, 10); c.fillRect(w - 52, i * 20 + 8, 46, 10); }
    c.save(); c.translate(w / 2, h / 2); c.rotate(Math.PI / 4);
    for (let i = -8; i < 8; i++) c.fillRect(i * 20, -6, 10, 60);
    c.rotate(Math.PI / 2);
    for (let i = -8; i < 8; i++) c.fillRect(i * 20, -6, 10, 60);
    c.restore();
  }, 1, 1),
  sand: () => canvasTex(64, 64, (c, w, h) => {
    c.fillStyle = '#ecd19a'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { c.fillStyle = i % 2 ? '#e0c286' : '#f4dcab'; c.fillRect((i * 37) % w, (i * 23) % h, 2, 2); }
  }, 20, 20),
};
function star(c, x, y, R, r) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.fill();
}

let roadTex;
function road() {
  if (!roadTex) roadTex = canvasTex(128, 64, (c, w, h) => {
    c.fillStyle = '#4b4e57'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#f2f2f2'; c.fillRect(0, 2, w, 3); c.fillRect(0, h - 5, w, 3);
    c.fillStyle = '#f5d13a'; c.fillRect(10, h / 2 - 2, 50, 4); c.fillRect(74, h / 2 - 2, 50, 4);
  }, 1, 1);
  return roadTex;
}

// ---------- props ----------
export const PROPS = {
  tree(p, x, z, kind = 'round', s = 1) {
    if (kind === 'palm') {
      let px = x, py = 0;
      for (let i = 0; i < 6; i++) { cyl(p, 0.28 * s, 0.34 * s, 1.4 * s, '#9b7a52', px, py, z, 7); px += 0.18 * s; py += 1.35 * s; }
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * Math.PI * 2;
        const leaf = box(p, 0.7 * s, 0.12, 3.6 * s, i % 2 ? '#3f9b45' : '#57b85a', px + Math.cos(a) * 1.5 * s, py - 0.3, z + Math.sin(a) * 1.5 * s);
        leaf.rotation.y = -a + Math.PI / 2; leaf.rotation.x = 0.45;
      }
      return;
    }
    if (kind === 'pine') {
      cyl(p, 0.3 * s, 0.4 * s, 7 * s, '#7a5a3a', x, 0, z, 7);
      const c = sph(p, 3.6 * s, '#3f7d3a', x, 7.6 * s, z, 12, 8); c.scale.y = 0.42;
      return;
    }
    if (kind === 'cypress') {
      cyl(p, 0.2, 0.25, 1.2, '#6a4a2a', x, 0, z, 6);
      const c = sph(p, 1.1 * s, '#2f6b3a', x, 4 * s, z, 10, 8); c.scale.y = 3.2;
      return;
    }
    if (kind === 'xmas') {
      cyl(p, 0.35, 0.4, 1, '#6a4a2a', x, 0, z, 8);
      for (let i = 0; i < 3; i++) cone(p, 2.4 - i * 0.6, 2.4, '#2f8f4a', x, 1 + i * 1.5, z, 10);
      cone(p, 0.4, 0.6, '#ffd23a', x, 6.3, z, 5).material = glow('#ffd23a');
      const cols = ['#ff3d5a', '#3db8ff', '#ffd23a', '#ff8ad8'];
      for (let i = 0; i < 18; i++) { const a = i * 2.1, y = 1.4 + (i / 18) * 4.4, r = 2.2 - (y - 1) * 0.36; sph(p, 0.18, cols[i % 4], x + Math.cos(a) * r, y, z + Math.sin(a) * r, 8, 6).material = glow(cols[i % 4]); }
      return;
    }
    cyl(p, 0.25 * s, 0.32 * s, 2.6 * s, '#7a5a3a', x, 0, z, 7);
    sph(p, 2 * s, kind === 'blossom' ? '#f7b6cf' : '#4f9e48', x, 3.8 * s, z, 12, 9);
    sph(p, 1.4 * s, kind === 'blossom' ? '#fbd0e0' : '#63b356', x + 0.9 * s, 4.6 * s, z + 0.4 * s, 10, 8);
  },
  lamp(p, x, z, c = '#2b2f36') {
    cyl(p, 0.09, 0.14, 4.2, c, x, 0, z, 6);
    sph(p, 0.32, '#fff2b0', x, 4.4, z, 10, 8).material = glow('#fff2b0');
  },
  car(p, x, z, rotY, color = '#f5c518', taxi = true) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; p.add(g);
    box(g, 2, 1.0, 4.4, color, 0, 0.45, 0);
    box(g, 1.8, 0.8, 2.4, color, 0, 1.45, -0.2);
    box(g, 1.82, 0.6, 2.2, '#bfe3ff', 0, 1.55, -0.2);
    if (taxi) box(g, 0.9, 0.3, 0.4, '#ffffff', 0, 2.25, -0.2);
    for (const [wx, wz] of [[-1, -1.4], [1, -1.4], [-1, 1.4], [1, 1.4]]) { const w = cyl(g, 0.42, 0.42, 0.3, '#1a1a1a', wx, 0, wz, 12); w.rotation.z = Math.PI / 2; w.position.y = 0.42; }
    return g;
  },
  bus(p, x, z, rotY) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; p.add(g);
    box(g, 2.5, 4.2, 9, '#d9262c', 0, 0.4, 0);
    for (const y of [1.6, 3.4]) box(g, 2.55, 0.9, 8.2, '#2b3a4a', 0, y, 0);
    box(g, 2.6, 0.3, 9.1, '#f2f2f2', 0, 2.75, 0);
    for (const [wx, wz] of [[-1.2, -3], [1.2, -3], [-1.2, 3], [1.2, 3]]) { const w = cyl(g, 0.55, 0.55, 0.3, '#1a1a1a', wx, 0, wz, 12); w.rotation.z = Math.PI / 2; w.position.y = 0.55; }
    return g;
  },
  phonebox(p, x, z) {
    box(p, 1.2, 2.7, 1.2, '#d9262c', x, 0, z);
    for (const [dx, dz] of [[0, 0.61], [0, -0.61]]) box(p, 0.8, 1.6, 0.02, '#cfe8f5', x + dx, 0.7, z + dz);
    const r = dome(null, 0.75, '#d9262c'); r.position.set(x, 2.7, z); r.scale.y = 0.4; p.add(r);
  },
  bike(p, x, z, rotY, c = '#2a6fdb') {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; p.add(g);
    for (const dz of [-0.55, 0.55]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.04, 6, 16), mat('#222')); w.position.set(0, 0.36, dz); w.rotation.y = Math.PI / 2; g.add(w); }
    box(g, 0.06, 0.06, 1.1, c, 0, 0.62, 0);
    box(g, 0.06, 0.5, 0.06, c, 0, 0.4, -0.2);
    box(g, 0.5, 0.05, 0.05, '#222', 0, 0.95, 0.5);
    box(g, 0.3, 0.3, 0.3, '#c9a14a', 0, 0.8, 0.65);
  },
  bench(p, x, z, rotY = 0) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; p.add(g);
    box(g, 2, 0.12, 0.6, '#9b6b3e', 0, 0.45, 0);
    box(g, 2, 0.5, 0.1, '#9b6b3e', 0, 0.6, -0.28);
    for (const sx of [-0.85, 0.85]) box(g, 0.1, 0.45, 0.5, '#333', sx, 0, 0);
  },
  umbrellaTable(p, x, z, c = '#e63946') {
    cyl(p, 0.5, 0.5, 0.06, '#ffffff', x, 0.75, z, 12); cyl(p, 0.05, 0.05, 2.4, '#555', x, 0, z, 6);
    cone(p, 1.6, 0.6, c, x, 2.3, z, 8);
    for (const a of [0, 2.1, 4.2]) cyl(p, 0.2, 0.2, 0.5, '#555', x + Math.cos(a) * 0.9, 0, z + Math.sin(a) * 0.9, 8);
  },
  rail(p, x0, z0, x1, z1, c = '#2f3540') {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(len / 2.5));
    for (let i = 0; i <= n; i++) cyl(p, 0.06, 0.06, 1.1, c, x0 + (x1 - x0) * i / n, 0, z0 + (z1 - z0) * i / n, 6);
    const b = box(p, len, 0.1, 0.1, c, (x0 + x1) / 2, 1.05, (z0 + z1) / 2); b.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
    const b2 = box(p, len, 0.06, 0.06, c, (x0 + x1) / 2, 0.55, (z0 + z1) / 2); b2.rotation.y = b.rotation.y;
  },
};

// ---------- the world ----------
export function buildWorld(scene) {
  const rects = [];
  const obstacles = [];
  const animated = [];
  const runtime = [];

  // Far ground beneath everything
  plane(scene, 3000, 3000, '#9fd18b', 120, -0.08, 60);

  STOPS.forEach((s, i) => {
    const R = rng(1000 + i * 77);
    const cx = s.col * CELL, cz = s.row * CELL;
    const g = new THREE.Group(); g.position.set(cx, 0, cz); scene.add(g);
    const far = new THREE.Group(); far.position.set(cx, 0, cz); scene.add(far);
    const farOwn = new THREE.Group(); farOwn.position.set(cx, 0, cz); scene.add(farOwn);

    const open = new Set();
    for (const j of [i - 1, i + 1]) {
      const o = STOPS[j]; if (!o) continue;
      if (o.col > s.col) open.add('e'); if (o.col < s.col) open.add('w');
      if (o.row > s.row) open.add('s'); if (o.row < s.row) open.add('n');
    }
    const inset = {}, front = {};
    for (const side of ['n', 's', 'e', 'w']) {
      inset[side] = open.has(side) ? H : (s.inset?.[side] ?? 20);
      front[side] = s.front?.[side] ?? inset[side];
    }
    rects.push({ x0: cx - inset.w, x1: cx + inset.e, z0: cz - inset.n, z1: cz + inset.s });

    // Ground
    const gt = GROUND[s.ground]();
    const gm = new THREE.Mesh(new THREE.PlaneGeometry(CELL, CELL), texMat(gt));
    gm.rotation.x = -Math.PI / 2; gm.position.y = 0.005 * (i % 2); gm.receiveShadow = true; g.add(gm);

    // Road through the cell along the path
    if (s.road) {
      const rt = road();
      const addStrip = (side) => {
        const t = rt.clone(); t.repeat.set(H / 12, 1); t.needsUpdate = true;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(H + 5, 10), texMat(t));
        m.rotation.x = -Math.PI / 2; m.receiveShadow = true;
        const off = (H - 5) / 2 + 2.5;
        if (side === 'e') m.position.set(off, 0.02, 0);
        if (side === 'w') m.position.set(-off, 0.02, 0);
        if (side === 'n') { m.position.set(0, 0.021, -off); m.rotation.z = Math.PI / 2; }
        if (side === 's') { m.position.set(0, 0.021, off); m.rotation.z = Math.PI / 2; }
        g.add(m);
      };
      open.forEach(addStrip);
      if (open.size === 1) addStrip({ e: 'w', w: 'e', n: 's', s: 'n' }[[...open][0]]);
    }

    // Closed sides
    for (const side of ['n', 's', 'e', 'w']) {
      if (open.has(side)) continue;
      const kind = s.bands?.[side] ?? 'buildings';
      const f = front[side];
      if (kind === 'rail') {
        const [a, b] = sideLine(side, f);
        PROPS.rail(g, a[0], a[1], b[0], b[1]);
        continue;
      }
      if (kind === 'none') continue;
      const depth = Math.max(6, H - f + (kind === 'low' ? 0 : 2));
      let u = -H - 2;
      const gaps = s.gaps?.[side] || [];
      while (u < H + 2) {
        const S = STYLES[s.style];
        let w = S.w[0] + R() * (S.w[1] - S.w[0]);
        if (u + w > H + 2) w = H + 2 - u;
        if (w < 3) break;
        const mid = u + w / 2;
        if (!gaps.some(([a, b]) => mid > a - w / 2 && mid < b + w / 2)) {
          let h = S.h[0] + R() * (S.h[1] - S.h[0]);
          if (kind === 'low') h *= s.lowMul ?? 0.45;
          const b = makeBuilding(s.style, w - 0.2, depth, h, R, kind === 'low');
          placeOnSide(b, side, mid, f + depth / 2);
          g.add(b);
        }
        u += w;
      }
    }

    // Street furniture along the walkable edges
    const lampC = s.style === 'neon' ? '#888' : '#2b2f36';
    for (const side of ['n', 's']) {
      if (open.has(side) || s.bands?.[side] === 'none') continue;
      const z = (side === 'n' ? -1 : 1) * (inset[side] - 1.2);
      for (let x = -24; x <= 24; x += 16) { PROPS.lamp(g, x, z, lampC); obstacles.push({ x: cx + x, z: cz + z, r: 0.35 }); }
    }

    const ctx = {
      stop: s, index: i, g, far, farOwn, R, cx, cz, animated, open, inset,
      obstacle: (x, z, r) => obstacles.push({ x: cx + x, z: cz + z, r }),
    };
    LANDMARKS[s.id]?.(ctx);

    // Celebrity
    const celeb = makeCharacter(s.celebLook);
    const spot = new THREE.Vector3(cx + s.spot[0], 0, cz + s.spot[1]);
    const look = new THREE.Vector3(cx + s.look[0], s.look[1], cz + s.look[2]);
    celeb.root.position.copy(spot);
    const dir = new THREE.Vector3(look.x - spot.x, 0, look.z - spot.z).normalize();
    celeb.root.rotation.y = Math.atan2(-dir.x, -dir.z);
    celeb.setPose('signature');
    const label = textSprite(s.celeb, { size: 0.42 });
    label.position.y = 2.55;
    celeb.root.add(label);
    scene.add(celeb.root);
    obstacles.push({ x: spot.x, z: spot.z, r: 0.55, celeb: i });

    runtime.push({ stop: s, index: i, g, far, farOwn, celeb, label, spot, look, dir, center: new THREE.Vector3(cx, 0, cz) });
  });

  function inRects(x, z) {
    for (const r of rects) if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return true;
    return false;
  }
  function isWalkable(x, z, rad = 0.45) {
    if (!inRects(x - rad, z - rad) || !inRects(x + rad, z - rad) || !inRects(x - rad, z + rad) || !inRects(x + rad, z + rad)) return false;
    for (const o of obstacles) { const dx = x - o.x, dz = z - o.z; if (dx * dx + dz * dz < (o.r + rad) ** 2) return false; }
    return true;
  }
  function cellAt(x, z) {
    const col = Math.round(x / CELL), row = Math.round(z / CELL);
    return STOPS.findIndex(s => s.col === col && s.row === row);
  }
  function setFarVisibility(cur, selfieOnly = -1) {
    for (const r of runtime) {
      const near = selfieOnly >= 0 ? r.index === selfieOnly : Math.abs(r.index - cur) <= 1;
      r.far.visible = near;
      r.farOwn.visible = selfieOnly >= 0 ? r.index === selfieOnly : r.index === cur;
    }
  }
  function update(dt, t) {
    for (const w of waterTex) { w.offset.x += dt * 0.02; w.offset.y += dt * 0.012; }
    for (const a of animated) a(dt, t);
    for (const r of runtime) r.celeb.update(dt, 0);
  }
  return { rects, obstacles, stops: runtime, isWalkable, inRects, cellAt, setFarVisibility, update };
}

function sideLine(side, f) {
  if (side === 'n') return [[-H, -f], [H, -f]];
  if (side === 's') return [[-H, f], [H, f]];
  if (side === 'e') return [[f, -H], [f, H]];
  return [[-f, -H], [-f, H]];
}
function placeOnSide(obj, side, u, dist) {
  if (side === 'n') { obj.position.set(u, 0, -dist); obj.rotation.y = 0; }
  if (side === 's') { obj.position.set(u, 0, dist); obj.rotation.y = Math.PI; }
  if (side === 'e') { obj.position.set(dist, 0, u); obj.rotation.y = -Math.PI / 2; }
  if (side === 'w') { obj.position.set(-dist, 0, u); obj.rotation.y = Math.PI / 2; }
}

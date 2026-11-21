// One builder per stop: the landmark, its surroundings and local props.
// ctx.g = cell group (always visible), ctx.far = shown when within one stop,
// ctx.farOwn = shown only in this stop. Coordinates are cell-local.
import * as THREE from 'three';
import { mat, glow, box, cyl, cone, sph, dome, geo, plane, beam, frustum, prism, canvasTex, texMat, water, FONT } from './kit.js';
import { PROPS } from './world.js';

const PI = Math.PI;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function lathe(p, pts, c, x, y, z, seg = 20) {
  return geo(p, new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(r, h)), seg), c, x, y, z);
}
function onion(p, r, h, c, x, y, z) {
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const rr = r * Math.sin(Math.min(1, t * 1.25) * PI * 0.92) * (1 - t * 0.35) + (t > 0.9 ? 0 : 0);
    pts.push([Math.max(0.01, t < 0.98 ? rr : 0.01), t * h]);
  }
  return lathe(p, pts, c, x, y, z, 24);
}
function archTex(base, dark, cols = 1, rows = 1) {
  return canvasTex(64, 64, (c, w, h) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    c.fillStyle = dark;
    const x = 14, y = 14, ww = 36, hh = 44;
    c.beginPath(); c.moveTo(x, y + hh); c.lineTo(x, y + 16); c.quadraticCurveTo(x + ww / 2, y - 12, x + ww, y + 16); c.lineTo(x + ww, y + hh); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, h - 4, w, 4);
  }, cols, rows);
}
function clockTex() {
  return canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#d6b24a'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#fbf6e6'; c.beginPath(); c.arc(64, 64, 54, 0, PI * 2); c.fill();
    c.strokeStyle = '#2a2a2a'; c.lineWidth = 4; c.stroke();
    c.fillStyle = '#2a2a2a';
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; c.fillRect(64 + Math.cos(a) * 44 - 3, 64 + Math.sin(a) * 44 - 3, 6, 6); }
    c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(64, 64); c.lineTo(64, 28); c.stroke();
    c.beginPath(); c.moveTo(64, 64); c.lineTo(90, 70); c.stroke();
  });
}
function flagTex(draw) { return canvasTex(192, 120, draw); }

export const LANDMARKS = {
  // ---------------------------------------------------------------- Budapest
  budapest({ g, far, obstacle, animated }) {
    // Danube and far bank
    plane(g, 60, 8, '#bdb2a4', 0, 0.01, -26);
    water(far, 260, 52, 0, -0.035, -56);
    plane(far, 260, 60, '#8fc479', 0, 0.02, -110);
    // Parliament
    const P = new THREE.Group(); P.position.set(0, 0, -98); far.add(P);
    const W = '#f1e9d6', RED = '#b8503f';
    box(P, 96, 13, 16, W, 0, 0, 0).material = texMat(archTex(W, '#7a6a58', 28, 3));
    prism(P, 16, 5, 96, RED, 0, 13, 0).rotation.y = PI / 2;
    box(P, 26, 18, 20, W, 0, 0, 0).material = texMat(archTex(W, '#7a6a58', 7, 4));
    cyl(P, 7.5, 8, 6, W, 0, 18, 0, 20);
    lathe(P, [[8, 0], [8.4, 3], [7.4, 7], [5, 10.5], [2, 12.5], [0.6, 14], [0.01, 15]], RED, 0, 24, 0, 24);
    cone(P, 0.8, 9, W, 0, 38, 0, 8);
    for (let i = -6; i <= 6; i++) {
      if (Math.abs(i) < 2) continue;
      for (const z of [-7.5, 7.5]) cone(P, 0.7, 5 + (i % 2) * 2, W, i * 7, 14.5, z, 6);
    }
    for (const sx of [-1, 1]) {
      box(P, 8, 22, 8, W, sx * 44, 0, 0);
      cone(P, 3.2, 10, RED, sx * 44, 22, 0, 4).rotation.y = PI / 4;
      for (const dx of [-10, 10]) { box(P, 4, 24, 4, W, sx * 22 + dx * 0.2, 0, 6); cone(P, 1.4, 8, W, sx * 22 + dx * 0.2, 24, 6, 6); }
    }
    // Andrássy: chestnut trees, lamps, a yellow tram
    for (let x = -26; x <= 26; x += 10) for (const z of [-9, 9]) { if (Math.abs(x) < 6 && z < 0) continue; PROPS.tree(g, x, z, 'round', 0.85); obstacle(x, z, 0.5); }
    const tram = new THREE.Group(); tram.position.set(-14, 0, 2); g.add(tram);
    box(tram, 14, 3, 2.6, '#f2c21b', 0, 0.5, 0);
    box(tram, 13.6, 1, 2.65, '#2b3a4a', 0, 2, 0);
    box(tram, 14.2, 0.4, 2.8, '#c9a015', 0, 3.5, 0);
    for (const x of [-6, 0, 6]) obstacle(-14 + x, 2, 1.7);
    // A Christmas tree where Anya starts
    PROPS.tree(g, 16, 14, 'xmas'); obstacle(16, 14, 2.2);
  },

  // ---------------------------------------------------------------- Mexico City
  mexico({ g, obstacle, animated }) {
    const C = '#cdbb98', D = '#b39f7c';
    const cat = new THREE.Group(); cat.position.set(0, 0, -44); g.add(cat);
    box(cat, 30, 3, 6, '#c2b08c', 0, 0, 10);
    box(cat, 40, 18, 22, C, 0, 0, 0).material = texMat(archTex(C, '#5e4e3c', 8, 3));
    box(cat, 9, 12, 1, '#5e4e3c', 0, 3, 11.1);
    box(cat, 12, 6, 2, D, 0, 18, 10);
    for (const sx of [-1, 1]) {
      const x = sx * 16;
      box(cat, 9, 30, 9, C, x, 0, 6);
      box(cat, 7.5, 7, 7.5, D, x, 30, 6).material = texMat(archTex(D, '#3b3127', 2, 1));
      lathe(cat, [[4.2, 0], [4.3, 1.5], [3.6, 3.8], [2, 5.6], [0.6, 6.4], [0.01, 6.6]], '#d8c79f', x, 37, 6, 16);
      cyl(cat, 0.15, 0.15, 2.5, '#333', x, 43.4, 6, 6);
      box(cat, 1.4, 0.2, 0.2, '#333', x, 45, 6);
    }
    cyl(cat, 6, 6, 4, D, 0, 18, -4, 18);
    lathe(cat, [[6.2, 0], [6, 2.5], [4.6, 5], [2, 6.8], [0.01, 7.4]], '#e2b85a', 0, 22, -4, 20);
    // Giant flag in the middle of the square
    cyl(g, 0.35, 0.5, 26, '#d8d8d8', 0, 0, 0, 10); obstacle(0, 0, 1.4);
    cyl(g, 1.6, 2, 1.2, '#b8a888', 0, 0, 0, 12);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(10, 6, 10, 1), texMat(flagTex((c, w, h) => {
      c.fillStyle = '#006847'; c.fillRect(0, 0, w / 3, h); c.fillStyle = '#ffffff'; c.fillRect(w / 3, 0, w / 3, h); c.fillStyle = '#ce1126'; c.fillRect(2 * w / 3, 0, w / 3, h);
      c.fillStyle = '#8a5a2a'; c.beginPath(); c.ellipse(w / 2, h / 2, 14, 18, 0, 0, PI * 2); c.fill();
      c.fillStyle = '#3f8a3a'; c.beginPath(); c.ellipse(w / 2, h / 2 + 16, 18, 5, 0, 0, PI * 2); c.fill();
    }), { side: THREE.DoubleSide }));
    fl.position.set(5.2, 22.5, 0); g.add(fl);
    const base = fl.geometry.attributes.position.array.slice();
    animated.push((dt, t) => {
      const p = fl.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = base[i * 3]; p.array[i * 3 + 2] = Math.sin(x * 0.6 - t * 3) * 0.35 * (x + 5) / 10; }
      p.needsUpdate = true;
    });
    // Papel picado strings
    const cols = ['#ff3d7f', '#ffd23a', '#3db8ff', '#7ddb4a', '#ff8a3d', '#b46bff'];
    for (const z of [8, 16]) {
      for (const sx of [-1, 1]) cyl(g, 0.12, 0.12, 8, '#7a5a3a', sx * 24, 0, z, 6), obstacle(sx * 24, z, 0.3);
      for (let i = 0; i < 24; i++) {
        const x = -23 + i * 2, y = 7.6 - Math.sin((i / 23) * PI) * 1.2;
        const f = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.1), mat(cols[i % cols.length], { side: THREE.DoubleSide }));
        f.position.set(x, y, z); g.add(f);
      }
    }
  },

  // ---------------------------------------------------------------- Paris
  paris({ g, far, obstacle }) {
    plane(far, 90, 120, '#86c96f', 0, 0.01, -90);
    plane(far, 10, 120, '#e6d7b4', 0, 0.02, -90);
    const B = '#8b6a4c';
    const E = new THREE.Group(); E.position.set(0, 0, -88); far.add(E);
    const leg = (a, b) => beam(E, a, b, 2.6, B);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      leg(V(sx * 15, 0, sz * 15), V(sx * 8, 20, sz * 8));
      leg(V(sx * 8, 21, sz * 8), V(sx * 3.6, 42, sz * 3.6));
      beam(E, V(sx * 13, 4, sz * 13), V(sx * 9.5, 16, sz * -9.5 * -1), 0.6, B);
    }
    for (const r of [0, PI / 2]) {
      for (const s of [-1, 1]) {
        const a = new THREE.Mesh(new THREE.TorusGeometry(10, 0.9, 6, 18, PI), mat(B));
        a.rotation.y = r; a.position.set(r ? s * 12.5 : 0, 5, r ? 0 : s * 12.5); E.add(a);
      }
    }
    box(E, 21, 2.4, 21, B, 0, 19.5, 0);
    box(E, 10, 1.6, 10, B, 0, 42, 0);
    frustum(E, 4.8, 4.8, 28, 0.18, B, 0, 43.6, 0);
    cyl(E, 0.3, 0.3, 7, '#6d523b', 0, 71.5, 0, 6);
    box(E, 1.6, 1.2, 1.6, '#c9a76a', 0, 70.6, 0);
    // Champs-Élysées: plane trees and café tables
    for (let x = -26; x <= 26; x += 9) { if (Math.abs(x) < 5) continue; PROPS.tree(g, x, -11, 'round', 0.8); obstacle(x, -11, 0.5); }
    for (const [x, c] of [[-20, '#e63946'], [-12, '#2a6fdb'], [12, '#e63946'], [20, '#2a6fdb']]) { PROPS.umbrellaTable(g, x, 14, c); obstacle(x, 14, 1.3); }
  },

  // ---------------------------------------------------------------- London
  london({ g, obstacle }) {
    plane(g, 80, 40, '#86c96f', 0, -0.02, -50);
    const S = '#dcc68e', SL = '#3c4a5c';
    const T = new THREE.Group(); T.position.set(10, 0, -48); g.add(T);
    const stoneTex = canvasTex(32, 64, (c, w, h) => { c.fillStyle = S; c.fillRect(0, 0, w, h); c.fillStyle = '#c1aa6f'; for (let i = 0; i < 4; i++) c.fillRect(i * 8 + 3, 0, 2, h); }, 4, 6);
    box(T, 9, 40, 9, S, 0, 0, 0).material = texMat(stoneTex);
    const cl = box(T, 11, 9, 11, '#d6b24a', 0, 40, 0);
    const ct = texMat(clockTex());
    for (const r of [0, PI / 2, PI, -PI / 2]) {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), ct);
      f.position.set(Math.sin(r) * 5.55, 44.5, Math.cos(r) * 5.55); f.rotation.y = r; T.add(f);
    }
    box(T, 9.4, 5, 9.4, S, 0, 49, 0).material = texMat(archTex(S, '#5a4a30', 2, 1));
    frustum(T, 9, 9, 15, 0.06, SL, 0, 54, 0);
    cone(T, 0.35, 3, '#e8c34a', 0, 69, 0, 6);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cone(T, 0.5, 4, '#e8c34a', sx * 4.6, 54, sz * 4.6, 6);
    // Houses of Parliament wing
    const wing = box(g, 50, 15, 10, S, -22, 0, -50); wing.material = texMat(archTex(S, '#7a6a48', 16, 4));
    for (let x = -44; x <= 0; x += 5) cone(g, 0.6, 4, S, x, 15, -45.5, 6);
    // Bus, cab, phone box
    PROPS.bus(g, -12, 2.5, PI / 2); for (const x of [-15, -12, -9]) obstacle(x, 2.5, 1.5);
    PROPS.car(g, 16, -2.5, -PI / 2, '#1d1d1f', false); for (const x of [14.5, 17.5]) obstacle(x, -2.5, 1.2);
    PROPS.phonebox(g, 12, 16); obstacle(12, 16, 1);
  },

  // ---------------------------------------------------------------- New York
  newyork({ g, far, obstacle }) {
    water(far, 220, 190, 140, -0.035, -65);
    const L = new THREE.Group(); L.position.set(92, 0, -10); L.rotation.y = -PI / 2; far.add(L);
    cyl(L, 16, 17, 1, '#7fbf6a', 0, -0.4, 0, 20);
    cyl(L, 9, 10, 3, '#a9a291', 0, 0, 0, 8);
    box(L, 8, 12, 8, '#b9ad90', 0, 3, 0).material = texMat(archTex('#b9ad90', '#8a7f68', 2, 2));
    frustum(L, 6.4, 6.4, 2, 0.8, '#b9ad90', 0, 15, 0);
    const G = '#62b8a0';
    cone(L, 3.4, 13, G, 0, 16.5, 0, 14);
    cyl(L, 1.6, 2.2, 6, G, 0, 25, 0, 12);
    sph(L, 1.7, G, 0, 32.2, 0, 14, 10);
    for (let i = 0; i < 7; i++) { const a = -PI / 2 + (i - 3) * 0.38; const sp = cone(null, 0.25, 2.2, G); sp.position.set(Math.cos(a) * 1.6, 34 + Math.sin(a + PI / 2) * 0.8, Math.sin(a) * 1.6 + 0); sp.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.9); L.add(sp); }
    beam(L, V(-1.6, 29.5, 0), V(-2.8, 38.5, 0.4), 1.0, G);
    cyl(L, 0.6, 0.35, 1.2, '#d6a84a', -2.9, 38.6, 0.4, 10);
    sph(L, 0.8, '#ffcf3a', -2.9, 40.4, 0.4, 10, 8).material = glow('#ffcf3a');
    box(L, 1.6, 2.4, 0.6, G, 1.9, 26, 1.2).rotation.z = 0.3;
    // Times Square: taxis
    PROPS.car(g, -14, -2.5, PI / 2); obstacle(-15.5, -2.5, 1.2); obstacle(-12.5, -2.5, 1.2);
    PROPS.car(g, 2.5, 16, 0); obstacle(2.5, 14.5, 1.2); obstacle(2.5, 17.5, 1.2);
    PROPS.car(g, -2.5, 24, PI, '#f5c518'); obstacle(-2.5, 22.5, 1.2); obstacle(-2.5, 25.5, 1.2);
  },

  // ---------------------------------------------------------------- Rome
  rome({ g, far, obstacle }) {
    plane(far, 110, 110, '#e3c99b', 82, 0.01, 0);
    const C = new THREE.Group(); C.position.set(64, 0, 0); far.add(C);
    C.scale.set(1, 1, 1.25);
    const T = '#e8d3a8';
    const outer = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 20, 48, 1, true), texMat(archTex(T, '#6a5a44', 30, 3), { side: THREE.DoubleSide }));
    outer.position.y = 10; outer.castShadow = true; C.add(outer);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 5, 48, 1, true, PI * 0.15, PI * 1.05), mat(T, { side: THREE.DoubleSide }));
    top.position.y = 22.5; C.add(top);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(17, 17, 13, 40, 1, true), texMat(archTex('#d9c094', '#5a4a36', 22, 2), { side: THREE.DoubleSide }));
    inner.position.y = 6.5; C.add(inner);
    const arena = plane(C, 1, 1, '#e8cf94', 0, 0.3, 0); arena.geometry = new THREE.CircleGeometry(17, 32);
    for (const [x, z] of [[34, -30], [44, 34], [92, -34], [100, 30], [30, 40]]) PROPS.tree(far, x, z, 'pine', 1.2);
    PROPS.tree(g, -14, 15, 'pine', 0.9); obstacle(-14, 15, 0.6);
    PROPS.tree(g, 8, 15, 'pine', 0.9); obstacle(8, 15, 0.6);
    // A little fountain
    cyl(g, 2, 2.2, 0.8, '#d8ccb4', -6, 0, -12, 18); obstacle(-6, -12, 2.4);
    water(g, 3.4, 3.4, -6, 0.75, -12, '#5fc0ea');
    cyl(g, 0.3, 0.4, 2, '#d8ccb4', -6, 0.8, -12, 8);
  },

  // ---------------------------------------------------------------- Barcelona
  barcelona({ g, obstacle }) {
    const S = '#cfae7c', SD = '#b8945e';
    const B = new THREE.Group(); B.position.set(0, 0, 25); g.add(B);
    box(B, 22, 14, 10, S, 0, 0, 0).material = texMat(archTex(S, '#5e4a32', 5, 2));
    box(B, 7, 10, 1, '#5e4a32', 0, 0, -5.1);
    const spire = (x, z, h, r, tip) => {
      const pts = [];
      for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push([Math.max(0.05, r * (1 - t * 0.82) * (1 + 0.1 * Math.sin(t * 30))), t * h]); }
      lathe(B, pts, S, x, 0, z, 12);
      sph(B, r * 0.55, tip, x, h + r * 0.3, z, 10, 8);
      for (let k = 0; k < 4; k++) { const a = k * PI / 2; sph(B, r * 0.22, '#ffffff', x + Math.cos(a) * r * 0.4, h, z + Math.sin(a) * r * 0.4, 6, 4); }
    };
    spire(-7, -3, 34, 1.9, '#e63946'); spire(-2.4, -3, 39, 1.9, '#f4c430');
    spire(2.4, -3, 39, 1.9, '#2a9df4'); spire(7, -3, 34, 1.9, '#3fbf5f');
    spire(0, 3, 52, 3, '#f4c430');
    spire(-6, 3, 42, 2.2, '#e63946'); spire(6, 3, 42, 2.2, '#2a9df4');
    for (const [x, c] of [[-9, '#ff7ab8'], [9, '#9b5de5']]) { cyl(B, 1.4, 1.6, 6, c, x, 14, -2, 10); }
    obstacle(0, 21, 4); obstacle(-7, 21, 4); obstacle(7, 21, 4);
    // La Rambla: two rows of plane trees, flower stalls
    for (let x = -26; x <= 26; x += 8) {
      PROPS.tree(g, x, -12, 'round', 0.9); obstacle(x, -12, 0.5);
      if (Math.abs(x) > 8) { PROPS.tree(g, x, 13, 'round', 0.9); obstacle(x, 13, 0.5); }
    }
    for (const [x, c] of [[-16, '#ff7ab8'], [16, '#ffd23a']]) {
      box(g, 3, 2.6, 2, '#2f6b4a', x, 0, 0); cone(g, 2.4, 1.2, '#2f6b4a', x, 2.6, 0, 4).rotation.y = PI / 4;
      for (let i = 0; i < 6; i++) sph(g, 0.3, c, x - 1.2 + i * 0.5, 1.2, 1.1, 6, 4);
      obstacle(x, 0, 1.8);
    }
    // Miró mosaic in the pavement
    const m = plane(g, 1, 1, '#ffffff', 10, 0.03, -2);
    m.geometry = new THREE.CircleGeometry(2.4, 24);
    m.material = texMat(canvasTex(64, 64, (c, w, h) => {
      c.fillStyle = '#f1ead8'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#e63946'; c.beginPath(); c.arc(22, 26, 12, 0, PI * 2); c.fill();
      c.fillStyle = '#2a6fdb'; c.fillRect(34, 30, 18, 18);
      c.fillStyle = '#f4c430'; c.beginPath(); c.arc(44, 18, 7, 0, PI * 2); c.fill();
      c.strokeStyle = '#111'; c.lineWidth = 3; c.beginPath(); c.moveTo(8, 50); c.quadraticCurveTo(30, 40, 56, 56); c.stroke();
    }));
  },

  // ---------------------------------------------------------------- Tokyo
  tokyo({ g, farOwn, obstacle }) {
    // Mount Fuji, far to the south, only from this stop
    const F = new THREE.Group(); F.position.set(0, -2, 640); farOwn.add(F);
    const fm = mat('#7d93c4', { fog: false }), sm = mat('#ffffff', { fog: false });
    const mtn = new THREE.Mesh(new THREE.ConeGeometry(370, 430, 28), fm); mtn.position.y = 215; F.add(mtn);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(112, 130, 28), sm); cap.position.y = 367; F.add(cap);
    // Hachikō
    const H = new THREE.Group(); H.position.set(-12, 0, 16); H.rotation.y = PI; g.add(H);
    box(H, 3, 1.8, 3, '#8d8f94', 0, 0, 0);
    const D = '#7d6a4b';
    const dog = new THREE.Group(); dog.position.y = 1.8; dog.scale.setScalar(1.5); H.add(dog);
    const bd = sph(dog, 0.7, D, 0, 0.75, -0.2, 12, 10); bd.scale.set(0.8, 0.9, 1.1);
    const ch = sph(dog, 0.5, D, 0, 1.15, 0.35, 12, 10); ch.scale.set(0.8, 1.1, 0.8);
    sph(dog, 0.42, D, 0, 1.75, 0.5, 12, 10);
    const sn = sph(dog, 0.2, D, 0, 1.66, 0.88, 10, 8); sn.scale.set(1, 0.8, 1.3);
    sph(dog, 0.06, '#2a2218', 0, 1.7, 1.08, 6, 4);
    for (const sx of [-1, 1]) {
      const e = cone(dog, 0.14, 0.32, D, sx * 0.22, 2.02, 0.42, 6); e.rotation.z = -sx * 0.25;
      cyl(dog, 0.1, 0.1, 0.7, D, sx * 0.2, 0, 0.55, 8);
      const hl = sph(dog, 0.28, D, sx * 0.36, 0.3, -0.45, 10, 8); hl.scale.set(0.7, 0.8, 1.2);
    }
    const tail = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.09, 6, 12, PI * 1.6), mat(D)); tail.position.set(0, 1.05, -0.95); tail.rotation.y = PI / 2; dog.add(tail);
    obstacle(-12, 16, 2.3);
    // Big screen and vending machines
    for (const [x, c] of [[8, '#ff3d5a'], [10, '#3db8ff'], [12, '#ffd23a']]) {
      box(g, 1.8, 2.2, 1, '#f2f2f2', x, 0, 18.5);
      box(g, 1.5, 1.2, 0.05, c, x, 0.8, 18).material = glow(c);
      obstacle(x, 18.5, 1);
    }
    for (const [x, z] of [[-24, -14], [24, 14]]) { PROPS.tree(g, x, z, 'blossom', 0.8); obstacle(x, z, 0.5); }
  },

  // ---------------------------------------------------------------- Amsterdam
  amsterdam({ g, obstacle }) {
    water(g, 60, 10, 0, 0.03, -15, '#3f8fb0');
    box(g, 60, 0.3, 0.6, '#8a8a8a', 0, 0, -10.2);
    box(g, 60, 0.3, 0.6, '#8a8a8a', 0, 0, -19.8);
    // hump bridge
    const br = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.7, 6, 18, PI), mat('#a8553a'));
    br.position.set(-18, -0.6, -15); br.rotation.y = PI / 2; br.scale.set(1, 0.5, 2.4); g.add(br);
    // houseboat
    const hb = new THREE.Group(); hb.position.set(10, -0.3, -15); g.add(hb);
    box(hb, 10, 1, 3.4, '#2f5f3f', 0, 0, 0); box(hb, 6, 2, 2.8, '#f2e6c8', -1, 1, 0); box(hb, 6.4, 0.3, 3.2, '#a8553a', -1, 3, 0);
    for (let i = 0; i < 5; i++) sph(hb, 0.25, ['#e63946', '#ffd23a', '#ff7ab8'][i % 3], 2.5 + i * 0.5, 1.2, 1.5, 6, 4);
    // bikes and tulips
    for (let x = -22; x <= 22; x += 3.2) { if (Math.abs(x) < 4) continue; PROPS.bike(g, x, 17.8, 0, ['#2a6fdb', '#e63946', '#2b2b2b', '#3fbf5f'][Math.abs(Math.round(x)) % 4]); }
    obstacle(-14, 17.8, 2.5); obstacle(14, 17.8, 2.5);
    for (const x of [-26, -8, 8, 26]) {
      box(g, 3, 0.6, 1.2, '#7a5a3a', x, 0, -8.8);
      for (let i = 0; i < 6; i++) { cyl(g, 0.03, 0.03, 0.5, '#3f8a3a', x - 1.2 + i * 0.48, 0.6, -8.8, 4); sph(g, 0.14, ['#e63946', '#ffd23a', '#ff7ab8', '#f77f00'][i % 4], x - 1.2 + i * 0.48, 1.15, -8.8, 6, 5); }
    }
  },

  // ---------------------------------------------------------------- Los Angeles
  la({ g, farOwn, far, obstacle }) {
    plane(far, 120, 140, '#c9b98a', -80, 0.01, 0);
    const hills = [[-180, 0, 60, 52], [-200, -60, 70, 38], [-190, 70, 60, 34], [-240, 10, 80, 60]];
    for (const [x, z, r, h] of hills) { const m = sph(far, r, '#9c9a5e', x, 0, z, 18, 10); m.scale.y = h / r; }
    const letters = 'HOLLYWOOD'.split('');
    letters.forEach((L, i) => {
      const t = canvasTex(128, 160, (c, w, h) => { c.font = `900 170px Arial Black, ${FONT}`; c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(L, w / 2, h / 2 + 10); });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(9, 11), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
      const z = (4 - i) * 9.6;
      m.position.set(-150 + Math.abs(i - 4) * 0.6, 41 + Math.sin(i * 1.3) * 1, z); m.rotation.y = PI / 2;
      far.add(m);
    });
    for (const z of [-26, -17, -9, 9, 17, 26]) { PROPS.tree(g, -24, z, 'palm', 0.9); obstacle(-24, z, 0.5); }
    for (let x = -24; x <= 26; x += 12) { if (x > -20) { PROPS.tree(g, x, -17, 'palm', 0.9); obstacle(x, -17, 0.5); } }
    // Cinema marquee
    const mq = new THREE.Mesh(new THREE.PlaneGeometry(12, 3), new THREE.MeshBasicMaterial({
      map: canvasTex(256, 64, (c, w, h) => { c.fillStyle = '#1a1424'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffe03d'; for (let i = 0; i < 20; i++) { c.beginPath(); c.arc(8 + i * 12.6, 6, 3, 0, PI * 2); c.arc(8 + i * 12.6, h - 6, 3, 0, PI * 2); c.fill(); } c.fillStyle = '#ff3d7f'; c.font = `800 30px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('PREMIERE TONIGHT', w / 2, h / 2 + 2); }),
    }));
    mq.position.set(10, 7, -19.6); g.add(mq);
  },

  // ---------------------------------------------------------------- Rio
  rio({ g, far, obstacle }) {
    plane(g, 60, 16, '#f1dca6', 0, 0.03, 22);
    water(far, 340, 220, -40, -0.035, 140, '#2fb5d8');
    plane(far, 340, 4, '#ffffff', -40, -0.03, 31);
    // Corcovado and the statue
    const hill = cone(far, 48, 72, '#4f9a4f', -140, 0, 40, 12); hill.scale.z = 0.8;
    cone(far, 18, 14, '#6f7a6a', -140, 64, 40, 10);
    const X = new THREE.Group(); X.position.set(-140, 76, 40); X.rotation.y = PI / 2; X.scale.setScalar(1.6); far.add(X);
    const W = '#ece8de';
    box(X, 2.4, 4, 2.4, W, 0, 0, 0);
    cyl(X, 1.2, 1.9, 10, W, 0, 4, 0, 10);
    box(X, 16, 1.6, 1.4, W, 0, 12, 0);
    sph(X, 1.1, W, 0, 15, 0, 12, 10);
    const sl = cone(far, 18, 40, '#5f8a4a', -60, -6, 120, 12); sl.scale.set(1, 1, 0.7);
    // Beach umbrellas, palms, a kiosk
    for (const [x, c] of [[-20, '#ff3d5a'], [-6, '#ffd23a'], [8, '#3db8ff'], [20, '#7ddb4a']]) {
      cyl(g, 0.06, 0.06, 2.6, '#ddd', x, 0, 24, 6); cone(g, 1.8, 0.8, c, x, 2.4, 24, 10); obstacle(x, 24, 0.3);
      const tw = box(g, 1, 0.05, 2, ['#ff7ab8', '#3db8ff'][Math.abs(x) % 2], x + 1.3, 0.04, 25); tw.rotation.y = 0.3;
    }
    for (let x = -20; x <= 26; x += 10) { PROPS.tree(g, x, 12.5, 'palm', 1); obstacle(x, 12.5, 0.5); }
    box(g, 4, 3, 3, '#ffffff', 20, 0, -8); cone(g, 3.2, 1.4, '#1f9a49', 20, 3, -8, 6); obstacle(20, -8, 2.4);
  },

  // ---------------------------------------------------------------- Giza
  giza({ g, far, obstacle }) {
    plane(far, 200, 260, '#ecd19a', 0, 0.01, 160);
    for (const [x, z, r] of [[-60, 70, 22], [70, 60, 26], [-80, 200, 40], [90, 210, 36]]) { const d = sph(far, r, '#e6c588', x, 0, z, 16, 8); d.scale.y = 0.18; }
    const P = '#e2c07a';
    const pyr = (x, z, side, h) => { const m = cone(far, side * Math.SQRT1_2, h, P, x, 0, z, 4); m.rotation.y = PI / 4; cone(far, side * Math.SQRT1_2 * 0.12, h * 0.12, '#f4e4b8', x, h * 0.88, z, 4).rotation.y = PI / 4; };
    pyr(0, 105, 70, 52); pyr(-58, 150, 60, 46); pyr(44, 160, 32, 24);
    // Sphinx facing the street
    const S = new THREE.Group(); S.position.set(-26, 0, 52); S.rotation.y = PI; far.add(S);
    box(S, 6, 5, 18, '#d6b06c', 0, 0, -3);
    for (const sx of [-1.8, 1.8]) box(S, 1.6, 1.4, 7, '#d6b06c', sx, 0, 8);
    box(S, 4.4, 5, 4.4, '#d6b06c', 0, 5, 5);
    const nem = frustum(S, 6.4, 3.4, 4, 0.55, '#c9a45a', 0, 6, 4.3);
    box(S, 3.4, 3.4, 0.4, '#e0bd7c', 0, 5.8, 7.25);
    // Camel and palms
    const C = new THREE.Group(); C.position.set(14, 0, 9); C.rotation.y = -0.6; g.add(C);
    const cb = sph(C, 1.1, '#c89a5a', 0, 2.2, 0, 12, 8); cb.scale.set(0.8, 0.7, 1.4);
    sph(C, 0.7, '#c89a5a', 0, 3.1, 0, 10, 8);
    beam(C, V(0, 2.4, 1.2), V(0, 3.6, 2.2), 0.45, '#c89a5a');
    const ch = sph(C, 0.42, '#c89a5a', 0, 3.8, 2.5, 10, 8); ch.scale.z = 1.4;
    for (const [lx, lz] of [[-0.5, -1], [0.5, -1], [-0.5, 1], [0.5, 1]]) cyl(C, 0.15, 0.12, 1.8, '#b8894a', lx, 0, lz, 6);
    box(C, 1.8, 0.2, 1.4, '#c22b3a', 0, 2.9, -0.3);
    obstacle(14, 9, 2);
    for (const [x, z] of [[-22, -10], [24, -12], [-14, 24]]) { PROPS.tree(g, x, z, 'palm', 0.9); obstacle(x, z, 0.5); }
  },

  // ---------------------------------------------------------------- Agra
  agra({ g, far, obstacle }) {
    plane(far, 120, 150, '#7fc06a', 0, 0.01, 100);
    plane(far, 14, 150, '#e8dcc6', 0, 0.02, 100);
    water(far, 8, 40, 0, 0.05, 55, '#5fb0e0');
    for (let z = 32; z <= 84; z += 6) for (const x of [-9, 9]) PROPS.tree(far, x, z, 'cypress', 1);
    const W = '#f6f3ec', A = '#c9c2b4';
    const T = new THREE.Group(); T.position.set(0, 0, 104); far.add(T);
    box(T, 56, 4, 56, W, 0, 0, 0);
    box(T, 30, 22, 30, W, 0, 4, 0).material = texMat(archTex(W, A, 3, 2));
    for (const r of [0, PI / 2, PI, -PI / 2]) {
      const iw = box(null, 10, 16, 0.6, '#d8d1c2'); iw.position.set(Math.sin(r) * 15.1, 12, Math.cos(r) * 15.1); iw.rotation.y = r; T.add(iw);
    }
    cyl(T, 9, 9, 5, W, 0, 26, 0, 24);
    onion(T, 11.5, 20, W, 0, 30.5, 0);
    cone(T, 0.5, 5, '#e0b23a', 0, 49.5, 0, 8);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      cyl(T, 2.2, 2.2, 3, W, sx * 10, 26, sz * 10, 12);
      onion(T, 3, 5, W, sx * 10, 29, sz * 10);
      cyl(T, 1.4, 1.9, 34, W, sx * 25, 4, sz * 25, 12);
      for (const y of [14, 24, 34]) cyl(T, 2.3, 2.3, 0.6, W, sx * 25, y, sz * 25, 12);
      onion(T, 2.2, 4, W, sx * 25, 38, sz * 25);
    }
    // a sandstone gateway wall at the edge of the walk
    for (const sx of [-1, 1]) { box(g, 18, 3, 2, '#b5523b', sx * 21, 0, 27); }
    for (const sx of [-1, 1]) { cyl(g, 0.9, 0.9, 5, '#b5523b', sx * 11.5, 0, 27, 10); dome(g, 1.1, '#f4efe6', sx * 11.5, 5, 27); }
    for (const [x, z] of [[-24, -10], [24, -10], [-24, 10], [24, 10]]) { PROPS.tree(g, x, z, 'round', 0.8); obstacle(x, z, 0.5); }
  },

  // ---------------------------------------------------------------- Sydney
  sydney({ g, far, obstacle }) {
    water(far, 320, 260, 60, -0.035, 150, '#2f9fd8');
    water(far, 260, 80, 160, -0.035, -10, '#2f9fd8');
    // Opera House
    const O = new THREE.Group(); O.position.set(18, 0, 64); far.add(O);
    box(O, 40, 4, 26, '#d8c3a0', 0, -0.4, 0);
    const shellMat = texMat(canvasTex(64, 64, (c, w, h) => { c.fillStyle = '#fbf8f0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#e4ddcc'; c.lineWidth = 2; for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(i * 8, 0); c.lineTo(i * 8 + 8, h); c.stroke(); } }, 3, 3), { side: THREE.DoubleSide });
    const shell = (x, z, r, rotY, lean) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12, 0, PI, 0, PI / 2), shellMat);
      m.position.set(x, 3.6, z); m.scale.set(0.55, 1.5, 1); m.rotation.set(lean, rotY, 0); m.castShadow = true; O.add(m);
    };
    for (const [z, k] of [[-5, 1], [5, 0.8]]) {
      shell(-12, z, 9 * k, -PI / 2, 0.1);
      shell(-3, z, 10 * k, -PI / 2, 0.1);
      shell(6, z, 8 * k, PI / 2, 0.1);
      shell(13, z, 6 * k, PI / 2, 0.1);
    }
    // Harbour Bridge
    const B = new THREE.Group(); B.position.set(120, 0, 10); far.add(B);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(48, 2.2, 8, 48, PI), mat('#7d8794')); arch.rotation.y = PI / 2; arch.position.y = -6; arch.scale.set(1, 0.85, 1); B.add(arch);
    box(B, 10, 1.6, 140, '#6a7480', 0, 12, 0);
    for (const s of [-1, 1]) { box(B, 12, 22, 9, '#c8b894', 0, 0, s * 52); box(B, 12, 22, 9, '#c8b894', 0, 0, s * 66); }
    for (let i = -8; i <= 8; i++) beam(B, V(0, 12, i * 5), V(0, Math.max(12, -6 + Math.sqrt(Math.max(0, 48 * 48 - (i * 5) ** 2)) * 0.85), i * 5), 0.5, '#7d8794');
    // Quay: ferries board here
    for (const x of [-20, -10]) { PROPS.bench(g, x, 18, PI); obstacle(x, 18, 1.1); }
    for (const [x, z] of [[-24, -10], [24, 6], [-24, 10]]) { PROPS.tree(g, x, z, 'palm', 0.8); obstacle(x, z, 0.5); }
    const ferry = new THREE.Group(); ferry.position.set(-10, -0.3, 34); far.add(ferry);
    box(ferry, 14, 1.5, 5, '#2f7a3f', 0, 0, 0); box(ferry, 10, 2.5, 4.4, '#f2e6a8', 0, 1.5, 0); box(ferry, 10.4, 0.3, 4.8, '#2f7a3f', 0, 4, 0);
  },
};

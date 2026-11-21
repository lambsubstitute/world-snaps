// Chibi cartoon character rig shared by Anya and the celebrities.
// Faces +z, feet at y=0, about 2 m tall. Built from primitives only.
import * as THREE from 'three';
import { mat, glow, canvasTex, texMat } from './kit.js';

const PI = Math.PI;

function stripeMat(base, stripe) {
  const t = canvasTex(64, 16, (c, w, h) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    c.fillStyle = stripe;
    for (let i = 0; i < 4; i++) c.fillRect(i * 16 + 5, 0, 6, h);
  });
  return texMat(t);
}

function ballMat() {
  const t = canvasTex(128, 64, (c, w, h) => {
    c.fillStyle = '#fafafa'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#1b1b1b';
    for (const [x, y] of [[16, 16], [48, 40], [80, 14], [112, 42], [32, 56], [96, 58], [64, 4]]) {
      c.beginPath();
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * PI * 2;
        c.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8);
      }
      c.fill();
    }
  });
  return texMat(t);
}

export function makeCharacter(look) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const part = (g, c, x, y, z, parent = body) => {
    const m = new THREE.Mesh(g, mat(c));
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  };
  const skin = look.skin;
  const top = look.top || { style: 'shirt', color: '#888' };
  const bottom = look.bottom || { type: 'trousers', color: '#444' };
  const face = look.face || {};
  const hairC = look.hair?.color || '#333';
  const isDress = top.style === 'dress';

  // Legs (hip pivots)
  const legs = [];
  for (const sx of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(0.12 * sx, 0.62, 0);
    body.add(hip);
    const legC = (bottom.type === 'trousers') ? bottom.color : skin;
    part(new THREE.CylinderGeometry(0.1, 0.09, 0.56, 10), legC, 0, -0.29, 0, hip);
    if (bottom.type === 'shorts') part(new THREE.CylinderGeometry(0.125, 0.12, 0.26, 10), bottom.color, 0, -0.1, 0, hip);
    const shoe = part(new THREE.SphereGeometry(0.115, 10, 8, 0, PI * 2, 0, PI / 2), look.shoes || '#333', 0, -0.6, 0.04, hip);
    shoe.scale.set(1, 0.9, 1.5);
    legs.push(hip);
  }

  // Torso
  const torsoMat = top.stripes ? stripeMat(top.color, top.stripes) : mat(top.inner || top.color);
  if (isDress) {
    part(new THREE.CylinderGeometry(0.22, 0.27, 0.45, 14), top.color, 0, 1.0, 0);
    const len = top.long ? 0.78 : 0.42;
    part(new THREE.CylinderGeometry(0.27, top.long ? 0.42 : 0.47, len, 16), top.color, 0, 0.78 - len / 2, 0);
  } else {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.6, 14), torsoMat);
    t.position.set(0, 0.92, 0); t.castShadow = true; body.add(t);
    if (top.style === 'jacket') {
      part(new THREE.CylinderGeometry(0.258, 0.298, 0.6, 16, 1, false, 0.45, PI * 2 - 0.9), top.color, 0, 0.92, 0);
    }
    if (top.tie) part(new THREE.BoxGeometry(0.06, 0.32, 0.03), top.tie, 0, 0.98, 0.255);
    if (top.apron) part(new THREE.BoxGeometry(0.36, 0.62, 0.04), top.apron, 0, 0.78, 0.27);
    if (bottom.type === 'longskirt') {
      part(new THREE.CylinderGeometry(0.28, 0.46, 0.62, 16), bottom.color, 0, 0.36, 0);
    } else if (bottom.type !== 'none') {
      part(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 14), bottom.color, 0, 0.66, 0);
    }
  }
  if (top.collar) {
    const col = part(new THREE.TorusGeometry(0.2, 0.05, 6, 16), top.collar, 0, 1.22, 0);
    col.rotation.x = PI / 2;
  }
  if (top.shiny) {
    for (let i = 0; i < 10; i++) part(new THREE.SphereGeometry(0.025, 6, 4), '#fff6c8', Math.sin(i * 2.4) * 0.22, 0.7 + (i % 5) * 0.1, 0.25);
  }

  // Arms (shoulder pivots). arms[0] is the character's right (x<0).
  const arms = [];
  for (const sx of [-1, 1]) {
    const sh = new THREE.Group();
    sh.position.set(0.33 * sx, 1.16, 0);
    body.add(sh);
    const sleeve = (top.sleeveless || (isDress && !top.long)) ? skin : top.color;
    part(new THREE.CylinderGeometry(0.08, 0.07, 0.48, 8), sleeve, 0, -0.24, 0, sh);
    part(new THREE.SphereGeometry(0.085, 10, 8), skin, 0, -0.52, 0, sh);
    arms.push(sh);
  }

  // Head
  const head = new THREE.Group();
  head.position.y = 1.64;
  body.add(head);
  part(new THREE.CylinderGeometry(0.09, 0.1, 0.16, 8), skin, 0, -0.38, 0, head);
  part(new THREE.SphereGeometry(0.38, 22, 16), skin, 0, 0, 0, head);
  for (const sx of [-1, 1]) {
    const eye = part(new THREE.SphereGeometry(0.058, 12, 10), face.eyeColor || look.eyeColor || '#1c1426', 0.135 * sx, 0.03, 0.335, head);
    eye.scale.set(0.95, 1.3, 0.55);
    part(new THREE.SphereGeometry(0.019, 6, 6), '#ffffff', 0.135 * sx + 0.02, 0.075, 0.37, head).material = glow('#ffffff');
    if (face.lashes || face.liner) {
      const l = part(new THREE.BoxGeometry(0.11, 0.022, 0.02), '#111', 0.14 * sx, 0.1, 0.345, head);
      l.rotation.z = -0.25 * sx;
    }
    const cheek = part(new THREE.SphereGeometry(0.06, 10, 8), '#ff9aa8', 0.22 * sx, -0.08, 0.29, head);
    cheek.scale.z = 0.35;
    part(new THREE.SphereGeometry(0.07, 8, 8), skin, 0.37 * sx, 0, 0, head);
    if (face.earrings) part(new THREE.SphereGeometry(0.04, 8, 6), face.earrings, 0.37 * sx, -0.12, 0.02, head);
    if (!face.unibrow) {
      const b = part(new THREE.BoxGeometry(0.11, 0.025, 0.02), face.mcolor || hairC, 0.135 * sx, 0.155, 0.345, head);
      b.rotation.z = 0.12 * sx;
    }
  }
  if (face.unibrow) part(new THREE.BoxGeometry(0.34, 0.035, 0.02), hairC, 0, 0.155, 0.345, head);
  part(new THREE.SphereGeometry(0.04, 8, 6), skin, 0, -0.03, 0.38, head);
  const mouth = part(new THREE.TorusGeometry(0.085, 0.02, 6, 14, PI), face.lipstick || '#7a2e2e', 0, -0.12, 0.345, head);
  mouth.rotation.set(-0.25, 0, PI);
  if (face.mole) part(new THREE.SphereGeometry(0.014, 6, 4), '#2a1a14', 0.12, -0.12, 0.36, head);
  if (face.moustache) {
    const m = part(new THREE.CapsuleGeometry(0.03, 0.16, 4, 8), face.mcolor || hairC, 0, -0.085, 0.36, head);
    m.rotation.z = PI / 2;
  }
  if (face.beard) {
    part(new THREE.SphereGeometry(0.392, 16, 10, PI / 2 - 1.15, 2.3, 1.95, 0.95), face.beard, 0, 0, 0, head);
  }
  if (face.glasses) {
    for (const sx of [-1, 1]) part(new THREE.TorusGeometry(0.08, 0.016, 6, 14), face.glasses, 0.135 * sx, 0.03, 0.37, head);
    part(new THREE.BoxGeometry(0.1, 0.02, 0.02), face.glasses, 0, 0.05, 0.38, head);
  }

  buildHair(head, look.hair, part);
  buildHat(head, look.hat, part);

  // Extras
  const rightHand = new THREE.Group();
  rightHand.position.set(0, -0.55, 0.02);
  arms[0].add(rightHand);
  switch (look.extra) {
    case 'phone': {
      part(new THREE.BoxGeometry(0.09, 0.17, 0.02), '#ff4f8b', 0, -0.03, 0.07, rightHand);
      const scr = part(new THREE.BoxGeometry(0.075, 0.14, 0.005), '#9fe3ff', 0, -0.03, 0.081, rightHand);
      scr.material = glow('#9fe3ff');
      break;
    }
    case 'mic': {
      part(new THREE.CylinderGeometry(0.025, 0.02, 0.18, 8), '#2a2a2a', 0, 0, 0.07, rightHand);
      part(new THREE.SphereGeometry(0.05, 10, 8), '#c9c9c9', 0, 0.1, 0.07, rightHand);
      break;
    }
    case 'brush': {
      part(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), '#8a5a2a', 0, 0.05, 0.07, rightHand);
      part(new THREE.ConeGeometry(0.025, 0.06, 6), '#f4c430', 0, 0.22, 0.07, rightHand);
      const pal = part(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 14), '#d9b47a', 0, -0.58, 0.12, arms[1]);
      pal.rotation.x = PI / 2;
      for (const [c, a] of [['#e63946', 0], ['#2a9df4', 1.3], ['#f4c430', 2.6], ['#3fbf5f', 3.9]]) {
        part(new THREE.SphereGeometry(0.03, 6, 4), c, Math.cos(a) * 0.09, -0.58 + Math.sin(a) * 0.09, 0.14, arms[1]);
      }
      break;
    }
    case 'ball': {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), ballMat());
      b.position.set(0.42, 0.17, 0.3); b.castShadow = true;
      root.add(b);
      break;
    }
    case 'chains': {
      for (let i = 0; i < 3; i++) {
        const r = part(new THREE.TorusGeometry(0.3, 0.025, 6, 20), '#9aa0a8', 0, 0.75 + i * 0.16, 0);
        r.rotation.set(PI / 2 + (i - 1) * 0.25, 0, 0);
      }
      part(new THREE.BoxGeometry(0.12, 0.12, 0.05), '#c9a43a', 0, 0.86, 0.31);
      break;
    }
  }

  // Animation state
  const st = { phase: 0, t: Math.random() * 10, pose: 'idle', ext: look.pose || 'wave' };
  const target = { a0x: 0, a0z: 0, a1x: 0, a1z: 0 };
  function update(dt, speed = 0) {
    st.t += dt;
    const sw = Math.min(speed / 6, 1);
    st.phase += dt * (4 + speed * 1.2) * (sw > 0.02 ? 1 : 0);
    const s = Math.sin(st.phase) * 0.75 * sw;
    legs[0].rotation.x = s;
    legs[1].rotation.x = -s;
    body.position.y = Math.abs(Math.cos(st.phase)) * 0.07 * sw + Math.sin(st.t * 2.2) * 0.012;
    target.a0x = -s * 0.8; target.a1x = s * 0.8; target.a0z = -0.1; target.a1z = 0.1;
    const wig = Math.sin(st.t * 9) * 0.3;
    switch (st.pose) {
      case 'selfie': target.a0x = -2.25; target.a0z = 0.35; target.a1x = -0.2; target.a1z = 0.5; break;
      case 'wave': target.a1x = 0; target.a1z = 2.6 + wig; break;
      case 'fist': target.a1x = 0; target.a1z = 2.95 + wig * 0.3; break;
      case 'open': target.a0x = -0.4; target.a1x = -0.4; target.a0z = -1.35; target.a1z = 1.35; break;
      case 'peace': target.a1x = -0.6; target.a1z = 2.2; target.a0x = 0; target.a0z = -0.3; break;
    }
    const k = 1 - Math.exp(-dt * 12);
    arms[0].rotation.x += (target.a0x - arms[0].rotation.x) * k;
    arms[0].rotation.z += (target.a0z - arms[0].rotation.z) * k;
    arms[1].rotation.x += (target.a1x - arms[1].rotation.x) * k;
    arms[1].rotation.z += (target.a1z - arms[1].rotation.z) * k;
    head.rotation.z = st.pose === 'selfie' ? 0.18 : Math.sin(st.t * 1.3) * 0.03;
  }
  return {
    root, head, update,
    setPose(p) { st.pose = p === 'signature' ? st.ext : p; },
    get pose() { return st.pose; },
  };
}

function buildHair(head, hair, part) {
  if (!hair || hair.style === 'none') return;
  const c = hair.color;
  const cap = (thetaLen, r = 0.405) => part(new THREE.SphereGeometry(r, 22, 14, 0, PI * 2, 0, thetaLen), c, 0, 0, 0, head);
  const back = (thetaLen, r = 0.41) => part(new THREE.SphereGeometry(r, 22, 14, PI, PI, 0, thetaLen), c, 0, 0, 0, head);
  switch (hair.style) {
    case 'short': cap(1.05); back(1.75); break;
    case 'slick': cap(0.95, 0.4); back(1.65); break;
    case 'bun':
      cap(1.05); back(1.8);
      part(new THREE.SphereGeometry(0.17, 14, 10), c, 0, 0.3, -0.2, head);
      break;
    case 'long': {
      cap(1.05); back(2.2);
      const curtain = part(new THREE.CylinderGeometry(0.4, hair.wavy ? 0.5 : 0.43, 0.8, 18, 1, true, PI / 2, PI), c, 0, -0.32, 0, head);
      curtain.material = mat(c, { side: THREE.DoubleSide });
      for (const sx of [-1, 1]) part(new THREE.BoxGeometry(0.12, 0.62, 0.14), c, 0.33 * sx, -0.24, 0.12, head);
      if (hair.wavy) for (let i = 0; i < 9; i++) {
        const a = PI / 2 + (i / 8) * PI;
        part(new THREE.SphereGeometry(0.12, 8, 6), c, Math.sin(a) * 0.45, -0.68, Math.cos(a) * 0.45, head);
      }
      break;
    }
    case 'bob': {
      cap(1.05);
      const shell = part(new THREE.CylinderGeometry(0.43, 0.46, 0.62, 22, 1, true, 0.75, PI * 2 - 1.5), c, 0, -0.08, 0, head);
      shell.material = mat(c, { side: THREE.DoubleSide });
      part(new THREE.BoxGeometry(0.62, 0.13, 0.12), c, 0, 0.21, 0.33, head);
      break;
    }
    case 'curls': {
      const v = hair.volume || 1;
      cap(1.0, 0.4); back(1.7, 0.4);
      const n = Math.round(22 * v);
      for (let i = 0; i < n; i++) {
        // golden-angle spiral over the upper/back head, skipping the face
        const y = 1 - (i / (n - 1)) * (v > 1 ? 1.25 : 0.95);
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const a = i * 2.399963;
        let x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (z > 0.35 && y < 0.55) continue;
        const rad = 0.4 + 0.06 * v;
        part(new THREE.SphereGeometry(0.11 + 0.05 * v, 8, 6), c, x * rad, y * rad + 0.02, z * rad, head);
      }
      break;
    }
  }
}

function buildHat(head, hat, part) {
  if (!hat) return;
  switch (hat.type) {
    case 'fedora': {
      const c = hat.color || '#555';
      part(new THREE.CylinderGeometry(0.58, 0.58, 0.035, 22), c, 0, 0.27, 0, head);
      part(new THREE.CylinderGeometry(0.29, 0.34, 0.24, 18), c, 0, 0.4, 0, head);
      part(new THREE.CylinderGeometry(0.342, 0.342, 0.06, 18), '#222', 0, 0.31, 0, head);
      head.children.at(-3).rotation.x = -0.06;
      break;
    }
    case 'straw': {
      part(new THREE.CylinderGeometry(0.68, 0.68, 0.03, 22), '#e8c766', 0, 0.26, 0, head);
      part(new THREE.CylinderGeometry(0.29, 0.33, 0.2, 18), '#e8c766', 0, 0.37, 0, head);
      part(new THREE.CylinderGeometry(0.335, 0.335, 0.05, 18), '#3a5fb0', 0, 0.3, 0, head);
      break;
    }
    case 'flowercrown': {
      const cols = ['#e63946', '#f4c430', '#ff7ab8', '#f77f00', '#e63946', '#9b5de5'];
      for (let i = 0; i < 11; i++) {
        const a = -PI * 0.85 + (i / 10) * PI * 1.7 + PI / 2;
        part(new THREE.SphereGeometry(i % 3 === 0 ? 0.1 : 0.075, 10, 8), cols[i % cols.length], Math.cos(a) * 0.36, 0.26 + Math.sin(i) * 0.02, Math.sin(a) * 0.36, head);
      }
      break;
    }
    case 'cleo': {
      const band = part(new THREE.TorusGeometry(0.415, 0.035, 6, 24), '#e0b23a', 0, 0.16, 0, head);
      band.rotation.x = PI / 2;
      part(new THREE.ConeGeometry(0.05, 0.16, 8), '#e0b23a', 0, 0.27, 0.4, head);
      part(new THREE.SphereGeometry(0.035, 8, 6), '#2bb0a3', 0, 0.17, 0.43, head);
      break;
    }
  }
}

// World Snaps: walk the stitched city, find the celebrities, take selfies.
import * as THREE from 'three';
import { STOPS, CELL, ANYA_LOOK, ENDING_MESSAGE } from './stops.js';
import { buildWorld } from './world.js';
import { makeCharacter } from './characters.js';
import { sph, mat } from './kit.js';

const $ = (id) => document.getElementById(id);
const TOTAL = STOPS.length;

// ---------- save ----------
const SAVE_KEY = 'worldSnaps.v1';
let save = { photos: {}, visited: [], endingSeen: false };
try {
  const s = JSON.parse(localStorage.getItem(SAVE_KEY));
  if (s && typeof s === 'object') save = { ...save, ...s, photos: s.photos || {}, visited: s.visited || [] };
} catch { /* private mode or blocked storage: play without saving */ }
function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* storage full or blocked */ }
}
const foundCount = () => STOPS.filter((s) => save.photos[s.id]).length;

// ---------- renderer and scene ----------
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#8fd3ff');
scene.fog = new THREE.Fog('#cdeeff', 150, 560);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2500);
const selfieCam = new THREE.PerspectiveCamera(64, 1, 0.1, 2500);

scene.add(new THREE.HemisphereLight('#e8f6ff', '#d9c9a2', 1.7));
const sun = new THREE.DirectionalLight('#fff1d6', 2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 220 });
sun.shadow.bias = -0.0006;
scene.add(sun, sun.target);

// fluffy clouds
const cloudMat = mat('#ffffff', { fog: false });
for (let i = 0; i < 26; i++) {
  const g = new THREE.Group();
  const a = (i / 26) * Math.PI * 2, r = 260 + (i % 5) * 70;
  g.position.set(120 + Math.cos(a) * r, 110 + (i % 4) * 18, 60 + Math.sin(a) * r);
  for (let k = 0; k < 4; k++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(10 + (k % 2) * 5, 12, 8), cloudMat);
    m.position.set(k * 12 - 18, (k % 2) * 4, (k % 3) * 4);
    g.add(m);
  }
  g.scale.y = 0.6;
  scene.add(g);
}

let world, anya;

// ---------- player ----------
const pos = new THREE.Vector3(6, 0, 6);
let yaw = 0.35, pitch = 0.3, camDist = 7.5;
let facing = Math.PI;
let speedNow = 0;
let state = 'title'; // title | play | snap | modal
let curCell = -1;

const keys = new Set();
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  keys.add(e.code);
  if (state === 'play') {
    if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); trySnap(); }
    if (e.code === 'KeyM') openMap();
    if (e.code === 'KeyB' || e.code === 'Tab') { e.preventDefault(); openAlbum(); }
  } else if (state === 'modal' && e.code === 'Escape') closeModals();
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

// pointer: drag to look; on touch the left side is a joystick
const joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
const look = { id: null, lx: 0, ly: 0 };
canvas.addEventListener('pointerdown', (e) => {
  if (state !== 'play') return;
  canvas.setPointerCapture(e.pointerId);
  if (e.pointerType === 'touch' && e.clientX < innerWidth * 0.45 && joy.id === null) {
    joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joy.x = joy.y = 0;
    const base = $('joy'); base.style.display = 'block';
    base.style.left = e.clientX + 'px'; base.style.top = e.clientY + 'px';
    $('knob').style.transform = 'translate(-50%,-50%)';
  } else if (look.id === null) {
    look.id = e.pointerId; look.lx = e.clientX; look.ly = e.clientY;
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerId === joy.id) {
    let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy;
    const m = Math.hypot(dx, dy), R = 55;
    if (m > R) { dx *= R / m; dy *= R / m; }
    joy.x = dx / R; joy.y = dy / R;
    $('knob').style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  } else if (e.pointerId === look.id) {
    const k = e.pointerType === 'touch' ? 0.008 : 0.005;
    yaw -= (e.clientX - look.lx) * k;
    pitch = THREE.MathUtils.clamp(pitch + (e.clientY - look.ly) * k * 0.6, 0.05, 1.0);
    look.lx = e.clientX; look.ly = e.clientY;
  }
});
const endPointer = (e) => {
  if (e.pointerId === joy.id) { joy.id = null; joy.x = joy.y = 0; $('joy').style.display = 'none'; }
  if (e.pointerId === look.id) look.id = null;
};
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('wheel', (e) => { camDist = THREE.MathUtils.clamp(camDist + e.deltaY * 0.01, 4, 14); }, { passive: true });

// ---------- sound ----------
let actx = null;
function shutter() {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const len = 0.12, buf = actx.createBuffer(1, actx.sampleRate * len, actx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3) * (i < d.length * 0.4 || i > d.length * 0.55 ? 1 : 0.2);
    const src = actx.createBufferSource(); src.buffer = buf;
    const gain = actx.createGain(); gain.gain.value = 0.5;
    src.connect(gain).connect(actx.destination); src.start();
  } catch { /* no audio */ }
}

// ---------- HUD ----------
function updateCounter() { $('count').textContent = `${foundCount()} / ${TOTAL}`; }
let bannerTimer = 0;
function showBanner(s) {
  $('banner-street').textContent = s.street;
  $('banner-city').textContent = s.city;
  $('banner').classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => $('banner').classList.remove('show'), 3200);
}

// ---------- selfie ----------
let snap = null;
function nearCeleb() {
  if (curCell < 0) return null;
  const r = world.stops[curCell];
  const d = Math.hypot(pos.x - r.celeb.root.position.x, pos.z - r.celeb.root.position.z);
  return { r, d };
}
function trySnap() {
  const n = nearCeleb();
  if (!n || n.d > 4.5 || state !== 'play') return;
  startSnap(n.r);
}
function startSnap(r) {
  state = 'snap';
  const dir = r.dir;
  const side = new THREE.Vector3(dir.z, 0, -dir.x);
  const faceCam = Math.atan2(-dir.x, -dir.z);
  snap = { r, t: 0, captured: false, prev: pos.clone(), prevFacing: facing };
  r.celeb.root.position.copy(r.spot).addScaledVector(side, 0.62);
  r.celeb.root.rotation.y = faceCam;
  anya.root.position.copy(r.spot).addScaledVector(side, -0.62);
  anya.root.rotation.y = faceCam;
  anya.setPose('selfie');
  r.celeb.setPose('signature');
  r.label.visible = false;
  // Frame it: heads sit in the lower part of the shot, and the field of view
  // widens (up to 90 degrees) until the top of the landmark fits.
  const D = 3.9;
  const camPos = r.spot.clone().addScaledVector(dir, -D); camPos.y = 1.5;
  const horiz = Math.hypot(r.look.x - camPos.x, r.look.z - camPos.z);
  const aLook = Math.atan2(r.look.y - camPos.y, horiz) + 0.06;
  const aHead = Math.atan2(1.7 - camPos.y, D);
  const K = 0.5; // heads sit halfway between the centre and the bottom edge
  let halfV = THREE.MathUtils.degToRad(31);
  if (aHead + (1 + K) * halfV < aLook) halfV = Math.min(THREE.MathUtils.degToRad(45), (aLook - aHead) / (1 + K));
  const up = aHead + K * halfV;
  selfieCam.fov = THREE.MathUtils.radToDeg(halfV * 2);
  selfieCam.updateProjectionMatrix();
  selfieCam.position.copy(camPos);
  selfieCam.lookAt(camPos.x + dir.x * Math.cos(up), camPos.y + Math.sin(up), camPos.z + dir.z * Math.cos(up));
  world.setFarVisibility(curCell, r.index);
  $('viewfinder').classList.add('show');
  hideBubble();
  $('snapbtn').classList.remove('show');
}
function capture(r) {
  // Render the photo at a fixed 4:3 so portrait phones don't crop it.
  renderer.setPixelRatio(1);
  renderer.setSize(1000, 750, false);
  selfieCam.aspect = 4 / 3; selfieCam.updateProjectionMatrix();
  renderer.render(scene, selfieCam);
  const pc = document.createElement('canvas');
  pc.width = 540; pc.height = 650;
  const c = pc.getContext('2d');
  c.fillStyle = '#fffdf6'; c.fillRect(0, 0, 540, 650);
  c.drawImage(renderer.domElement, 0, 0, 1000, 750, 20, 20, 500, 375);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  resize();
  c.font = "700 22px 'Courier New', monospace"; c.fillStyle = '#ff8a3d';
  c.fillText("'26 12 25", 392, 380);
  c.textAlign = 'center'; c.fillStyle = '#2b2140';
  c.font = "700 50px Caveat, cursive"; c.fillText(`Me & ${r.stop.celeb}!`, 270, 462);
  c.font = "600 34px Caveat, cursive"; c.fillStyle = '#5a4a72';
  c.fillText(r.stop.landmark, 270, 516);
  c.fillText(r.stop.city, 270, 556);
  return pc.toDataURL('image/jpeg', 0.82);
}
function endSnap() {
  const r = snap.r;
  r.celeb.root.position.copy(r.spot);
  r.label.visible = true;
  pos.copy(snap.prev);
  facing = snap.prevFacing;
  anya.setPose('idle');
  world.setFarVisibility(curCell);
  $('viewfinder').classList.remove('show');
  $('flash').classList.remove('go');
  $('polaroid').classList.remove('show');
  snap = null;
  state = 'play';
  if (foundCount() === TOTAL && !save.endingSeen) setTimeout(showEnding, 400);
}

// ---------- speech bubble ----------
const tmpV = new THREE.Vector3();
function showBubble(r) {
  const b = $('bubble');
  tmpV.copy(r.celeb.root.position); tmpV.y = 2.9;
  tmpV.project(camera);
  if (tmpV.z > 1) { hideBubble(); return; }
  b.style.left = ((tmpV.x + 1) / 2) * innerWidth + 'px';
  b.style.top = ((1 - tmpV.y) / 2) * innerHeight + 'px';
  if (b.dataset.id !== r.stop.id) {
    b.dataset.id = r.stop.id;
    const got = save.photos[r.stop.id];
    b.innerHTML = `<b>${r.stop.celeb}</b>${got ? 'Back for another one? Love it!' : r.stop.line}`;
  }
  b.classList.add('show');
}
function hideBubble() { $('bubble').classList.remove('show'); $('bubble').dataset.id = ''; }

// ---------- map ----------
function drawMap(cv, big) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = cv.clientWidth, h = cv.clientHeight;
  cv.width = w * dpr; cv.height = h * dpr;
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, w, h);
  const cols = 5, rows = 3;
  const cs = Math.min(w / cols, h / rows);
  const ox = (w - cs * cols) / 2, oy = (h - cs * rows) / 2;
  const P = (col, row) => [ox + (col + 0.5) * cs, oy + (row + 0.5) * cs];
  c.lineWidth = cs * 0.22; c.lineCap = c.lineJoin = 'round'; c.strokeStyle = 'rgba(255,255,255,0.55)';
  c.beginPath(); STOPS.forEach((s, i) => { const [x, y] = P(s.col, s.row); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
  STOPS.forEach((s, i) => {
    const [x, y] = P(s.col, s.row);
    const got = !!save.photos[s.id], seen = save.visited.includes(s.id);
    c.fillStyle = got ? '#6fd08c' : seen ? '#ffd88a' : '#c9c3d6';
    c.beginPath(); c.roundRect(x - cs * 0.4, y - cs * 0.4, cs * 0.8, cs * 0.8, cs * 0.16); c.fill();
    if (i === curCell) { c.strokeStyle = '#ff4f8b'; c.lineWidth = 3; c.stroke(); }
    c.fillStyle = '#2b2140'; c.textAlign = 'center'; c.textBaseline = 'middle';
    if (big) {
      c.font = `800 ${Math.max(10, cs * 0.13)}px 'Baloo 2', sans-serif`;
      c.fillText(seen || got ? s.city : '???', x, y - cs * 0.12);
      c.font = `600 ${Math.max(9, cs * 0.1)}px 'Baloo 2', sans-serif`;
      c.fillText(got ? '✓ ' + s.celeb : seen ? 'Find ' + s.celeb : '', x, y + cs * 0.12);
    } else if (got) {
      c.font = `800 ${cs * 0.4}px sans-serif`; c.fillText('✓', x, y);
    }
  });
  // player
  const px = ox + (pos.x / CELL + 0.5) * cs, py = oy + (pos.z / CELL + 0.5) * cs;
  c.save(); c.translate(px, py); c.rotate(-facing + Math.PI);
  c.fillStyle = '#ff4f8b'; c.strokeStyle = '#fff'; c.lineWidth = 2;
  const k = big ? 1.6 : 1;
  c.beginPath(); c.moveTo(0, -8 * k); c.lineTo(6 * k, 6 * k); c.lineTo(0, 3 * k); c.lineTo(-6 * k, 6 * k); c.closePath(); c.fill(); c.stroke();
  c.restore();
}

// ---------- modals ----------
function openModal(id) {
  if (state === 'snap') return;
  closeModals(true);
  $(id).classList.add('show');
  state = 'modal';
}
function closeModals(silent) {
  for (const m of document.querySelectorAll('.modal')) m.classList.remove('show');
  if (!silent && state === 'modal') state = 'play';
}
function openMap() { openModal('mapmodal'); requestAnimationFrame(() => drawMap($('bigmap'), true)); }
function openAlbum() {
  const grid = $('albumgrid');
  grid.innerHTML = '';
  for (const s of STOPS) {
    const card = document.createElement('div');
    card.className = 'card';
    const src = save.photos[s.id];
    if (src) {
      const img = new Image(); img.src = src; img.alt = `Anya and ${s.celeb} at ${s.landmark}`;
      card.appendChild(img);
      card.onclick = () => { $('lightimg').src = src; $('lightbox').classList.add('show'); };
    } else {
      const seen = save.visited.includes(s.id);
      card.classList.add('empty');
      card.innerHTML = `<span class="q">?</span><span>${seen ? s.city : 'Somewhere…'}</span>`;
    }
    grid.appendChild(card);
  }
  $('albumtitle').textContent = `Anya's Album · ${foundCount()} / ${TOTAL}`;
  openModal('albummodal');
}
function showEnding() {
  save.endingSeen = true; persist();
  $('end-title').textContent = ENDING_MESSAGE.title;
  $('end-body').textContent = ENDING_MESSAGE.body;
  $('end-sign').textContent = ENDING_MESSAGE.signoff;
  const g = $('end-grid'); g.innerHTML = '';
  for (const s of STOPS) if (save.photos[s.id]) { const i = new Image(); i.src = save.photos[s.id]; g.appendChild(i); }
  openModal('ending');
}

$('btn-map').onclick = openMap;
$('btn-album').onclick = openAlbum;
for (const b of document.querySelectorAll('[data-close]')) b.onclick = () => closeModals();
$('lightbox').onclick = () => $('lightbox').classList.remove('show');
$('snapbtn').onclick = trySnap;
$('btn-reset').onclick = () => {
  if (!confirm('Start over? This clears every selfie in the album.')) return;
  save = { photos: {}, visited: [], endingSeen: false }; persist(); updateCounter(); openAlbum();
};

// ---------- start ----------
$('btn-start').onclick = () => {
  $('title').classList.add('hide');
  state = 'play';
  shutter.call(null); // unlock audio on iOS with a silent-ish click
  if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
  setTimeout(() => $('hint').classList.add('fade'), 14000);
};

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = selfieCam.aspect = w / h;
  camera.updateProjectionMatrix(); selfieCam.updateProjectionMatrix();
}
addEventListener('resize', resize);

// ---------- loop ----------
const clock = new THREE.Clock();
let mapTimer = 0;
const camPosSmooth = new THREE.Vector3();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  world.update(dt, t);

  if (state === 'play' || state === 'title') {
    let f = 0, r = 0;
    if (state === 'play') {
      if (keys.has('KeyW') || keys.has('ArrowUp')) f += 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) f -= 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) r -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) r += 1;
      if (keys.has('KeyQ')) yaw += dt * 2;
      if (keys.has('KeyE')) yaw -= dt * 2;
      f -= joy.y; r += joy.x;
    }
    const len = Math.hypot(f, r);
    if (len > 1) { f /= len; r /= len; }
    const running = keys.has('ShiftLeft') || keys.has('ShiftRight') || Math.hypot(joy.x, joy.y) > 0.92;
    const target = len > 0.05 ? (running ? 10 : 6.5) * Math.min(1, len) : 0;
    speedNow += (target - speedNow) * (1 - Math.exp(-dt * 10));
    if (len > 0.05) {
      const sy = Math.sin(yaw), cy = Math.cos(yaw);
      const mx = (-sy * f + cy * r), mz = (-cy * f - sy * r);
      const ml = Math.hypot(mx, mz) || 1;
      const step = speedNow * dt;
      const nx = pos.x + (mx / ml) * step, nz = pos.z + (mz / ml) * step;
      if (world.isWalkable(nx, nz)) { pos.x = nx; pos.z = nz; }
      else if (world.isWalkable(nx, pos.z)) pos.x = nx;
      else if (world.isWalkable(pos.x, nz)) pos.z = nz;
      const want = Math.atan2(mx, mz);
      let d = want - facing; d = Math.atan2(Math.sin(d), Math.cos(d));
      facing += d * (1 - Math.exp(-dt * 12));
      if (f > 0.2 && look.id === null) {
        let dy = Math.atan2(-mx, -mz) - yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        yaw += dy * dt * 1.2;
      }
    }
    if (state === 'title') yaw += dt * 0.12;
    anya.root.position.copy(pos);
    anya.root.rotation.y = facing;
    anya.update(dt, speedNow);

    // which stop are we in?
    const c = world.cellAt(pos.x, pos.z);
    if (c !== curCell && c >= 0) {
      curCell = c;
      world.setFarVisibility(c);
      const s = STOPS[c];
      if (state === 'play') showBanner(s);
      if (!save.visited.includes(s.id)) { save.visited.push(s.id); persist(); }
    }

    // celebrity nearby?
    const n = state === 'play' ? nearCeleb() : null;
    if (n && n.d < 10) {
      const cr = n.r.celeb.root;
      const want = Math.atan2(pos.x - cr.position.x, pos.z - cr.position.z);
      let d = want - cr.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
      cr.rotation.y += d * (1 - Math.exp(-dt * 5));
      showBubble(n.r);
    } else hideBubble();
    const can = n && n.d < 4.5;
    $('snapbtn').classList.toggle('show', !!can);
    if (can) $('snaplabel').textContent = save.photos[n.r.stop.id] ? 'Retake selfie' : 'Take selfie!';

    // camera follow
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    let d = camDist;
    for (let k = camDist; k >= 2.2; k -= 0.4) {
      d = k;
      if (world.inRects(pos.x + Math.sin(yaw) * cp * k, pos.z + Math.cos(yaw) * cp * k)) break;
    }
    const want = new THREE.Vector3(pos.x + Math.sin(yaw) * cp * d, 1.7 + sp * d, pos.z + Math.cos(yaw) * cp * d);
    if (camPosSmooth.lengthSq() === 0) camPosSmooth.copy(want);
    camPosSmooth.lerp(want, 1 - Math.exp(-dt * 10));
    camera.position.copy(camPosSmooth);
    camera.lookAt(pos.x, 1.45, pos.z);

    sun.position.set(pos.x + 40, 75, pos.z + 28);
    sun.target.position.set(pos.x, 0, pos.z);
    renderer.render(scene, camera);

    mapTimer -= dt;
    if (mapTimer <= 0 && state === 'play') { mapTimer = 0.25; drawMap($('minimap'), false); }
  } else if (state === 'snap') {
    snap.t += dt;
    anya.update(dt, 0);
    sun.position.set(snap.r.spot.x + 40, 75, snap.r.spot.z + 28);
    sun.target.position.copy(snap.r.spot);
    renderer.render(scene, selfieCam);
    if (!snap.captured && snap.t > 0.45) {
      snap.captured = true;
      const url = capture(snap.r);
      save.photos[snap.r.stop.id] = url; persist(); updateCounter();
      shutter();
      $('flash').classList.remove('go'); void $('flash').offsetWidth; $('flash').classList.add('go');
      $('polaroid-img').src = url;
      setTimeout(() => $('polaroid').classList.add('show'), 250);
    }
    if (snap.t > 3.4) endSnap();
  } else {
    renderer.render(scene, camera);
  }
}

// Debug helpers for testing in the browser console.
window.__snaps = {
  goto(i) { const r = world.stops[i]; pos.set(r.spot.x - r.dir.x * 3, 0, r.spot.z - r.dir.z * 3); yaw = Math.atan2(-r.dir.x, -r.dir.z); },
  snap() { trySnap(); },
  get state() { return state; },
  get cell() { return curCell; },
  walkable: (x, z) => world.isWalkable(x, z),
};

async function boot() {
  try {
    await Promise.race([
      Promise.all([document.fonts.load("800 40px 'Baloo 2'"), document.fonts.load("700 40px Caveat")]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* fonts are optional */ }
  world = buildWorld(scene);
  anya = makeCharacter(ANYA_LOOK);
  scene.add(anya.root);
  resize();
  updateCounter();
  $('btn-start').textContent = foundCount() ? 'Keep exploring' : 'Start the tour';
  $('btn-start').disabled = false;
  frame();
}
boot();

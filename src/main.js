import * as THREE from 'three';
import './style.css';

const $ = (id) => document.getElementById(id);
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x85c4be);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x85c4be, 48, 100);
const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 150);
camera.position.set(0, 23, 24);
camera.lookAt(0, 0, -13);
scene.add(new THREE.HemisphereLight(0xffffff, 0x647d69, 1.8));
const sun = new THREE.DirectionalLight(0xfff6df, 2.1);
sun.position.set(-12, 25, 8);
scene.add(sun);

const material = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
const roadMat = material(0xe5e4cc);
const railMat = material(0xfaf2dc);
const darkMat = material(0x243f50);
const blueMat = material(0x358fe2);
const redMat = material(0xe75c6a);
const bossMat = material(0xa14b76);
const sphere = new THREE.SphereGeometry(1, 7, 6);
const cylinder = new THREE.CylinderGeometry(1, 1, 1, 6);
const box = new THREE.BoxGeometry(1, 1, 1);
function mesh(geometry, mat, x, y, z, sx, sy, sz, parent = scene) {
  const m = new THREE.Mesh(geometry, mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  parent.add(m);
  return m;
}
mesh(box, roadMat, 0, -0.3, -29, 12, 0.6, 100);
mesh(box, material(0x72b9b3), 0, -0.8, -25, 240, 0.1, 220);
for (const x of [-6.2, 6.2]) {
  mesh(box, railMat, x, 0.4, -29, 0.22, 0.23, 100);
  mesh(box, material(0x6b9d8d), x, -0.08, -29, 0.48, 0.2, 100);
}
const scenery = [];
for (let z = -75; z < 16; z += 4) {
  for (const x of [-6.2, 6.2]) scenery.push(mesh(box, railMat, x, 0.1, z, 0.16, 0.7, 0.16));
  scenery.push(mesh(box, material(0xfaf7e5), 0, 0.015, z, 0.12, 0.02, 1.5));
}
const waterMat = new THREE.MeshBasicMaterial({ color: 0xb6e1d4, transparent: true, opacity: 0.3 });
for (let i = 0; i < 85; i++) {
  const x = (7 + Math.random() * 40) * (i % 2 ? 1 : -1);
  scenery.push(mesh(box, waterMat, x, -0.72, Math.random() * 95 - 78, 0.7 + Math.random() * 2, 0.02, 0.07));
}

// Each body part is instanced across the crowd; character count does not multiply draw calls.
function makeCrowd(mat, max) {
  const parts = [sphere, cylinder, cylinder, cylinder, cylinder, cylinder, box];
  return parts.map((g, i) => {
    const m = new THREE.InstancedMesh(g, i === 6 ? darkMat : mat, max);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false;
    scene.add(m);
    return m;
  });
}
const allies = makeCrowd(blueMat, 80);
const foes = makeCrowd(redMat, 600);
const bosses = makeCrowd(bossMat, 1);
const dummy = new THREE.Object3D();
function part(m, index, x, y, z, sx, sy, sz, rotation = 0) {
  dummy.position.set(x, y, z);
  dummy.rotation.set(rotation, 0, 0);
  dummy.scale.set(sx, sy, sz);
  dummy.updateMatrix();
  m.setMatrixAt(index, dummy.matrix);
}
function drawCrowd(batch, units, time, enemy = false) {
  for (let i = 0; i < units.length; i++) {
    const u = units[i], s = u.scale || 1, x = u.x, z = u.z;
    const swing = Math.sin(time * 11 + i * 1.8) * 0.55;
    const bob = Math.abs(Math.sin(time * 11 + i * 1.8)) * 0.035;
    part(batch[0], i, x, (1.44 + bob) * s, z, 0.23 * s, 0.25 * s, 0.23 * s);
    part(batch[1], i, x, 0.99 * s, z, 0.12 * s, 0.57 * s, 0.12 * s);
    part(batch[2], i, x - 0.13 * s, 0.39 * s, z, 0.075 * s, 0.68 * s, 0.075 * s, swing);
    part(batch[3], i, x + 0.13 * s, 0.39 * s, z, 0.075 * s, 0.68 * s, 0.075 * s, -swing);
    part(batch[4], i, x - 0.2 * s, 1.04 * s, z + (enemy ? 0.12 : -0.18) * s, 0.07 * s, 0.48 * s, 0.07 * s, enemy ? -0.8 : 1.1);
    part(batch[5], i, x + 0.2 * s, 1.04 * s, z + (enemy ? 0.12 : -0.18) * s, 0.07 * s, 0.48 * s, 0.07 * s, enemy ? -0.8 : 1.1);
    part(batch[6], i, x + 0.2 * s, 1.05 * s, z - 0.42 * s, enemy ? 0 : 0.12 * s, 0.14 * s, 0.54 * s);
  }
  for (const m of batch) { m.count = units.length; m.instanceMatrix.needsUpdate = true; }
}
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x254b48, transparent: true, opacity: 0.16, depthWrite: false });
const shadows = new THREE.InstancedMesh(new THREE.CircleGeometry(0.34, 10), shadowMat, 681);
shadows.frustumCulled = false;
scene.add(shadows);
function drawShadows(units) {
  units.forEach((u, i) => {
    dummy.position.set(u.x + 0.17, 0.025, u.z + 0.12);
    dummy.rotation.set(-Math.PI / 2, 0, 0);
    dummy.scale.setScalar(u.scale || 1);
    dummy.updateMatrix(); shadows.setMatrixAt(i, dummy.matrix);
  });
  shadows.count = units.length; shadows.instanceMatrix.needsUpdate = true;
}

const bulletMesh = new THREE.InstancedMesh(box, new THREE.MeshBasicMaterial({ color: 0xffbd42, toneMapped: false }), 500);
bulletMesh.frustumCulled = false; scene.add(bulletMesh);
const sparkMesh = new THREE.InstancedMesh(box, new THREE.MeshBasicMaterial({ color: 0xffda79 }), 700);
sparkMesh.frustumCulled = false; scene.add(sparkMesh);
let enemies = [], bullets = [], particles = [], gates = [], squad = [], boss = null;
let state = 'ready', elapsed = 0, kills = 0, count = 8, power = 1, playerX = 0, targetX = 0;
let shotTimer = 0, waveTimer = 0, gateIndex = 0, toastTimer = 0, invulnerable = 0;
let muted = true, audioContext, gunBuffer;
const activeGunshots = new Set();
const activePickupSounds = new Set();
let pickupTimer = 0;
const pickupDuration = 0.85;
const pickupRings = [0, 1].map(() => {
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.88, 1, 48), new THREE.MeshBasicMaterial({ color: 0xffdc67, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  scene.add(ring);
  return ring;
});
const pickupFlash = document.createElement('div');
pickupFlash.className = 'pickup-flash';
pickupFlash.setAttribute('aria-hidden', 'true');
$('game').append(pickupFlash);
let defenseZ = 5;
const defenseLine = mesh(box, new THREE.MeshBasicMaterial({ color: 0xe87769 }), 0, 0.035, defenseZ, 12, 0.04, 0.13);
const keys = new Set();
const gateSchedule = [3, 10, 18, 26, 34, 41];
function sound(freq, duration = 0.05) {
  if (muted) return;
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioContext.createOscillator(), gain = audioContext.createGain();
  osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq / 3, audioContext.currentTime + duration);
  gain.gain.setValueAtTime(0.025, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  osc.connect(gain); gain.connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + duration);
}
function gunshot() {
  if (muted || !gunBuffer) return;
  const now = audioContext.currentTime;
  // Three sample hits span each volley for a continuous machine-gun cadence.
  for (let i = 0; i < 3; i++) {
    const start = now + i * (0.32 - power * 0.035) / 3;
    const shot = audioContext.createBufferSource(), gain = audioContext.createGain();
    shot.buffer = gunBuffer;
    shot.playbackRate.value = 0.97 + Math.random() * 0.06;
    const volume = pickupTimer > 0 ? 0.08 : 0.24;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.setValueAtTime(volume, start + 0.075);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
    shot.connect(gain); gain.connect(audioContext.destination);
    activeGunshots.add(shot);
    shot.start(start); shot.stop(start + 0.23);
    shot.onended = () => { activeGunshots.delete(shot); shot.disconnect(); gain.disconnect(); };
  }
}
function stopGameSounds() {
  for (const shot of [...activeGunshots, ...activePickupSounds]) shot.stop();
  activeGunshots.clear();
  activePickupSounds.clear();
}
function pickup(special) {
  pickupTimer = pickupDuration;
  burst(playerX, 3, 48);
  for (const ring of pickupRings) ring.position.set(playerX, 0.07, 3.5);
  if (muted) return;
  const notes = special ? [784, 988, 1175, 1568] : [988, 1319, 1568];
  notes.forEach((frequency, i) => {
    const start = audioContext.currentTime + i * 0.065;
    const coin = audioContext.createOscillator(), gain = audioContext.createGain();
    coin.type = 'triangle'; coin.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(0.16, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
    coin.connect(gain); gain.connect(audioContext.destination);
    activePickupSounds.add(coin); coin.start(start); coin.stop(start + 0.23);
    coin.onended = () => { activePickupSounds.delete(coin); coin.disconnect(); gain.disconnect(); };
  });
}
function updatePickup(dt) {
  pickupTimer = Math.max(0, pickupTimer - dt);
  const t = (pickupDuration - pickupTimer) / pickupDuration;
  const glow = pickupTimer > 0 ? Math.exp(-t * 4) * (0.6 + 0.4 * Math.cos(t * Math.PI * 4)) : 0;
  blueMat.emissive.setHex(0xffd95a);
  blueMat.emissiveIntensity = glow * 1.8;
  pickupFlash.style.opacity = `${glow * 0.38}`;
  pickupRings.forEach((ring, i) => {
    const progress = (t - i * 0.13) / 0.8;
    ring.visible = pickupTimer > 0 && progress >= 0 && progress < 1;
    ring.scale.setScalar(0.8 + Math.max(0, progress) * 3);
    ring.material.opacity = Math.max(0, 1 - progress) * 0.85;
  });
}
function toast(text) { $('toast').textContent = text; toastTimer = 1.8; }
function burst(x, z, n = 9) {
  for (let i = 0; i < n && particles.length < 690; i++) particles.push({ x, y: 0.7, z, vx: (Math.random() - 0.5) * 5, vy: 2 + Math.random() * 3, vz: (Math.random() - 0.5) * 5, life: 0.5 + Math.random() * 0.3 });
}
function gateLabel(text, color) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = color; ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 68px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 128, 66);
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.95, side: THREE.DoubleSide });
}
const gateMats = [gateLabel('+8', '#3b9de0'), gateLabel('×2', '#389ace'), gateLabel('Lv↑', '#d7ad41')];
const gatePane = new THREE.PlaneGeometry(4.7, 2.4);
const bluePost = material(0x68cbef), goldPost = material(0xf5d479);
function spawnGate(index) {
  const special = index % 2 === 1;
  const group = new THREE.Group(); scene.add(group);
  const x = index % 2 === 0 ? -2.6 : 2.6;
  group.position.set(x, 0, -36);
  mesh(gatePane, gateMats[special ? 2 : index === 4 ? 1 : 0], 0, 1.6, 0, 1, 1, 1, group);
  for (const side of [-2.45, 2.45]) mesh(box, special ? goldPost : bluePost, side, 1.3, 0, 0.13, 2.6, 0.2, group);
  mesh(box, special ? goldPost : bluePost, 0, 0.06, 0, 4.9, 0.08, 0.8, group);
  gates.push({ group, x, special, multiply: index === 4 });
}
function formation(time) {
  squad = [];
  const cols = Math.min(7, Math.ceil(Math.sqrt(count)));
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols), rowCount = Math.min(cols, count - row * cols);
    squad.push({ x: playerX + (i % cols - (rowCount - 1) / 2) * 0.58, z: 3 + row * 0.59 });
  }
  defenseZ = (squad.at(-1)?.z ?? 3) + 0.45;
  defenseLine.position.z = defenseZ;
  drawCrowd(allies, squad, time);
}
function spawnWave() {
  const n = Math.min(110, 65 + Math.floor(elapsed * 1.2));
  const columns = 19;
  for (let i = 0; i < n && enemies.length < 600; i++) {
    const column = i % columns, row = Math.floor(i / columns);
    enemies.push({
      x: (column - (columns - 1) / 2) * 0.54 + (Math.random() - 0.5) * 0.08,
      z: -60 - row * 0.52 - Math.random() * 0.12,
      hp: 1 + Math.floor(elapsed / 24),
      speed: 5.8 + Math.random() * 1.7,
    });
  }
}
function reset(play = true) {
  stopGameSounds();
  pickupTimer = 0; updatePickup(0);
  for (const g of gates) scene.remove(g.group);
  enemies = []; bullets = []; particles = []; gates = []; boss = null;
  elapsed = 0; kills = 0; count = 8; power = 1; playerX = 0; targetX = 0;
  shotTimer = 0; waveTimer = 0; gateIndex = 0; invulnerable = 0; toastTimer = 0;
  state = play ? 'playing' : 'ready'; $('overlay').hidden = play; $('boss-hud').hidden = true;
  $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label', '暂停游戏');
  spawnWave(); formation(0); updateHud();
}
function updateHud() {
  $('squad-count').textContent = count; $('kills').textContent = kills; $('weapon').textContent = `Lv.${power}`;
  $('progress-fill').style.width = `${Math.min(100, elapsed / 60 * 100)}%`;
  $('toast').style.opacity = toastTimer > 0 ? '1' : '0';
  $('bottom-tip').hidden = elapsed > 6 && state === 'playing';
  if (boss) $('boss-health').style.width = `${Math.max(0, boss.hp / boss.maxHp * 100)}%`;
}
function finish(win, reason = '') {
  stopGameSounds();
  state = win ? 'won' : 'lost'; $('overlay').hidden = false;
  $('overlay-title').textContent = win ? '突围成功！' : '再集结一次！';
  $('overlay-copy').textContent = `击败 ${kills} 只怪物 · 剩余 ${count} 名队友 · 火力 Lv.${power}`;
  $('start').innerHTML = '再来一局 <span>↗</span>';
  $('overlay-note').textContent = win ? '小小火柴人，也能赢得大胜利。' : reason || '试试穿过蓝色增援门，再升级你的火力。';
  if (win) { burst(0, 2, 90); sound(880, 0.4); }
}
function togglePause() {
  if (!['playing', 'paused'].includes(state)) return;
  state = state === 'playing' ? 'paused' : 'playing';
  $('pause').textContent = state === 'paused' ? '▶' : 'Ⅱ';
  $('pause').setAttribute('aria-label', state === 'paused' ? '继续游戏' : '暂停游戏');
  $('overlay').hidden = state !== 'paused';
  if (state === 'paused') {
    stopGameSounds();
    $('overlay-title').textContent = '休息一下'; $('overlay-copy').textContent = '小队已经待命，准备好就继续。';
    $('start').innerHTML = '继续突围 <span>↗</span>'; $('overlay-note').textContent = '按空格键也可以继续';
  }
}
$('start').onclick = () => state === 'paused' ? togglePause() : reset();
$('restart').onclick = () => reset();
$('pause').onclick = togglePause;
$('sound').onclick = async () => {
  const button = $('sound');
  button.disabled = true;
  try {
    if (muted) {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      await audioContext.resume();
      if (!gunBuffer) {
        const response = await fetch(`${import.meta.env.BASE_URL}audio/lmg-fire.mp3`);
        if (!response.ok) throw new Error('Gunshot asset unavailable');
        gunBuffer = await audioContext.decodeAudioData(await response.arrayBuffer());
      }
      muted = false;
      if (state !== 'playing') gunshot();
    } else { muted = true; stopGameSounds(); }
  } catch (error) {
    muted = true; toast('音效加载失败，请再点一次音符'); console.error(error);
  } finally {
    button.disabled = false;
    button.textContent = muted ? '♪' : '♫';
    button.setAttribute('aria-label', muted ? '开启声音' : '关闭声音');
  }
};
let dragging = false, previousPointer = 0;
canvas.addEventListener('pointerdown', (e) => { dragging = true; previousPointer = e.clientX; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
  if (!dragging || state !== 'playing') return;
  targetX = THREE.MathUtils.clamp(targetX + (e.clientX - previousPointer) / canvas.clientWidth * 14, -3.7, 3.7);
  previousPointer = e.clientX;
});
canvas.addEventListener('pointerup', () => dragging = false);
canvas.addEventListener('pointercancel', () => dragging = false);
window.addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  keys.add(e.key.toLowerCase()); if (e.code === 'Space' && !e.repeat) togglePause();
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => { keys.clear(); dragging = false; if (state === 'playing') togglePause(); });
function resize() { const { width, height } = canvas.getBoundingClientRect(); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe($('game'));

function update(dt) {
  elapsed += dt; shotTimer -= dt; waveTimer -= dt; toastTimer -= dt; invulnerable -= dt;
  if (keys.has('a') || keys.has('arrowleft')) targetX -= dt * 7;
  if (keys.has('d') || keys.has('arrowright')) targetX += dt * 7;
  targetX = THREE.MathUtils.clamp(targetX, -3.7, 3.7);
  const previousPlayerX = playerX;
  playerX = THREE.MathUtils.lerp(playerX, targetX, 1 - Math.exp(-dt * 13));
  const squadMoving = Math.abs(playerX - previousPlayerX) / dt > 0.12;
  if (waveTimer <= 0 && elapsed < 47) { spawnWave(); waveTimer = 1.45; }
  if (gateIndex < gateSchedule.length && elapsed > gateSchedule[gateIndex]) spawnGate(gateIndex++);
  if (elapsed > 48 && !boss) {
    boss = { x: 0, z: -27, hp: 800, maxHp: 800, scale: 3.1 };
    $('boss-hud').hidden = false; toast('巨怪来袭！'); sound(120, 0.4);
  }
  for (const m of scenery) { m.position.z += dt * 5; if (m.position.z > 17) m.position.z -= 92; }
  for (let i = gates.length - 1; i >= 0; i--) {
    const g = gates[i]; g.group.position.z += dt * 7;
    if (g.group.position.z >= 3) {
      if (Math.abs(playerX - g.x) < 2.5) {
        if (g.special) { power = Math.min(4, power + 1); toast(`火力升级 · Lv.${power}`); }
        else { const old = count; count = Math.min(64, g.multiply ? count * 2 : count + 8); toast(`+${count - old} 位伙伴加入！`); }
        pickup(g.special);
      }
      scene.remove(g.group); gates.splice(i, 1);
    }
  }
  formation(elapsed);
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i]; e.z += dt * e.speed; e.x += THREE.MathUtils.clamp(playerX - e.x, -1, 1) * dt * 0.32;
    if (e.z >= defenseZ) { finish(false, '防线失守：有敌人绕到身后！'); return; }
    if (e.z > 2.3 && Math.abs(e.x - playerX) < 2.0 && invulnerable <= 0) {
      count = Math.max(0, count - 1); invulnerable = 0.16; burst(e.x, e.z); enemies.splice(i, 1); sound(100, 0.08);
      if (!count) { finish(false); return; }
    }
  }
  if (boss) {
    boss.z = Math.min(1, boss.z + dt * 1.65);
    boss.x = Math.sin(elapsed * 0.7) * 1.8;
    if (boss.z >= 0.9 && invulnerable <= 0) { count = Math.max(0, count - 5); invulnerable = 0.8; burst(playerX, 3, 20); if (!count) { finish(false); return; } }
  }
  if (shotTimer <= 0) {
    shotTimer = 0.32 - power * 0.035;
    for (let i = 0; i < squad.length && bullets.length < 490; i++) {
      const u = squad[i]; let target = null, best = Infinity;
      if (squadMoving) {
        for (const e of enemies) {
          const d = Math.abs(e.x - u.x) * 2 + Math.abs(e.z - u.z);
          if (e.z < u.z && d < best) { best = d; target = e; }
        }
        if (!target && boss) target = boss;
      }
      const dx = target ? target.x - u.x : 0, dz = target ? target.z - u.z : -10;
      const len = Math.hypot(dx, dz);
      bullets.push({ x: u.x + 0.18, z: u.z - 0.5, vx: dx / len * 35, vz: dz / len * 35, damage: power, life: 0.7 });
    }
    gunshot();
  }
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i]; b.x += b.vx * dt; b.z += b.vz * dt; b.life -= dt;
    let hit = false;
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (Math.abs(b.x - e.x) < 0.48 && Math.abs(b.z - e.z) < 0.7) {
        e.hp -= b.damage; hit = true;
        if (e.hp <= 0) { burst(e.x, e.z, 5); enemies.splice(j, 1); kills++; }
        break;
      }
    }
    if (!hit && boss && Math.abs(b.x - boss.x) < 1.25 && Math.abs(b.z - boss.z) < 1.1) {
      boss.hp -= b.damage; hit = true; burst(b.x, b.z, 2);
      if (boss.hp <= 0) { kills++; burst(boss.x, boss.z, 90); finish(true); return; }
    }
    if (hit || b.life <= 0) bullets.splice(i, 1);
  }
  if (elapsed > 75) finish(false);
}
let previous = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - previous) / 1000, 0.035); previous = now;
  if (state === 'playing') update(dt);
  updatePickup(state === 'paused' ? 0 : dt);
  if (state !== 'paused') {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.life -= dt; p.x += p.vx * dt; p.z += p.vz * dt; p.y += p.vy * dt; p.vy -= dt * 12;
      if (p.life < 0) particles.splice(i, 1);
    }
  }
  if (state === 'ready') formation(now / 1000);
  drawCrowd(foes, enemies, elapsed, true);
  drawCrowd(bosses, boss && boss.hp > 0 ? [boss] : [], elapsed, true);
  drawShadows([...squad, ...enemies, ...(boss && boss.hp > 0 ? [boss] : [])]);
  bullets.forEach((b, i) => part(bulletMesh, i, b.x, 1.05, b.z, 0.075, 0.075, 0.55));
  bulletMesh.count = bullets.length; bulletMesh.instanceMatrix.needsUpdate = true;
  particles.forEach((p, i) => part(sparkMesh, i, p.x, Math.max(0.05, p.y), p.z, 0.11, 0.11, 0.11, p.life * 9));
  sparkMesh.count = particles.length; sparkMesh.instanceMatrix.needsUpdate = true;
  updateHud(); renderer.render(scene, camera);
}
reset(false); resize(); requestAnimationFrame(frame);

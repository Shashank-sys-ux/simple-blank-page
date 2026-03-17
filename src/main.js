import './style.css';
import { initWorld, getCamera, getRenderer, getClouds, getAnimals } from './world.js';
import { getDB, saveDB, loadDB } from './db.js';
import QRCode from 'qrcode';

// ═══════════════════════════════
//  STATE
// ═══════════════════════════════
let currentSection = 0;
let currentPlayer = null;
let coordIn = false;
let lookupP = null;
let camStream = null;
let scanInt = null;
let xp = 5;
let xpLevel = 1;
let weatherOn = false;

const sections = ['s-hero','s-about','s-reg','s-inv','s-coord','s-dash','s-lb'];
const biomes = ['🌿 SPAWN BIOME','🌳 FOREST VILLAGE','🏠 REGISTRATION HUT','🎒 PLAYER INVENTORY','⚙️ COMMAND BLOCK ROOM','📡 COORDINATOR HQ','🏆 LEADERBOARD ARENA'];
const sectionNames = ['Spawn Area','Village','Registration Hut','Inventory','Command Room','Coord Dashboard','Leaderboard'];

// ═══════════════════════════════
//  INIT 3D WORLD
// ═══════════════════════════════
const { scene, camera, renderer, clouds, animals } = initWorld();

const sectionZ = [10, -5, -20, -35, -50, -65, -78];
let camBob = 0;
let targetZ = 10;
let camZ = 10;
let lastTime2 = 0;

function animate(ts) {
  requestAnimationFrame(animate);
  const dt = Math.min((ts - lastTime2) / 1000, 0.05);
  lastTime2 = ts;

  camZ += (targetZ - camZ) * 0.04;
  camBob += dt * 1.8;
  camera.position.set(
    Math.sin(camBob * 0.3) * 0.12,
    2.5 + Math.sin(camBob) * 0.03,
    camZ
  );
  camera.lookAt(Math.sin(camBob * 0.3) * 0.05, 2.3, camZ - 10);

  clouds.forEach(c => {
    c.mesh.position.x += c.speed;
    if (c.mesh.position.x > 45) c.mesh.position.x = -45;
  });

  animals.forEach(a => {
    a.moveTimer -= dt;
    if (a.moveTimer <= 0) {
      a.moveTimer = 2 + Math.random() * 4;
      a.ty = a.mesh.rotation.y + (Math.random() - 0.5) * 2;
    }
    a.mesh.rotation.y += (a.ty - a.mesh.rotation.y) * 0.05;
    let speed = a.type === 'chicken' ? 0.6 : a.type === 'sheep' ? 0.8 : 1.5;
    if (Math.abs(a.ty - a.mesh.rotation.y) < 0.5 && a.moveTimer > 1) {
      a.mesh.position.x -= Math.sin(a.mesh.rotation.y) * speed * dt;
      a.mesh.position.z -= Math.cos(a.mesh.rotation.y) * speed * dt;
      a.walkCycle += dt * 10;
      a.mesh.position.y = Math.abs(Math.sin(a.walkCycle)) * 0.08;
    } else {
      a.mesh.position.y = 0;
    }
    if (a.bounds) {
      if (a.mesh.position.x > a.bounds.maxX) a.ty = -Math.PI / 2;
      if (a.mesh.position.x < a.bounds.minX) a.ty = Math.PI / 2;
      if (a.mesh.position.z < a.bounds.minZ) a.ty = 0;
      if (a.mesh.position.z > a.bounds.maxZ) a.ty = Math.PI;
    } else {
      if (a.mesh.position.x > 35) a.ty = -Math.PI / 2;
      if (a.mesh.position.x < -35) a.ty = Math.PI / 2;
      if (a.mesh.position.z < -95) a.ty = 0;
      if (a.mesh.position.z > 5) a.ty = Math.PI;
    }
  });

  // Day mode — static
  document.getElementById('cx').textContent = Math.round(-camZ * 1.5);
  document.getElementById('cz').textContent = Math.round(camZ * 2);
  document.getElementById('tod').textContent = '☀️ DAY';

  renderer.render(scene, camera);
}
animate(0);

// ═══════════════════════════════
//  SECTION NAVIGATION
// ═══════════════════════════════
window.goSection = function(idx) {
  document.querySelectorAll('.section').forEach((s, i) => {
    s.classList.toggle('visible', i === idx);
  });
  document.querySelectorAll('.nd').forEach((d, i) => d.classList.toggle('active', i === idx));
  currentSection = idx;
  targetZ = sectionZ[idx];
  document.getElementById('biome').textContent = biomes[idx];
  showAreaLabel(sectionNames[idx]);
  gainXP(8);
  flashScreen();
  if (idx === 5 && !coordIn) { window.goSection(4); return; }
};

function showAreaLabel(name) {
  const el = document.getElementById('arealabel');
  el.textContent = '📍 ' + name;
  el.style.opacity = '1';
  setTimeout(() => el.style.opacity = '0', 2200);
}

// ═══════════════════════════════
//  CURSOR
// ═══════════════════════════════
document.addEventListener('mousemove', e => {
  const c = document.getElementById('cursor');
  c.style.left = e.clientX + 'px';
  c.style.top = e.clientY + 'px';
});
document.addEventListener('click', e => { spawnParticles(e.clientX, e.clientY); });

function spawnParticles(x, y) {
  const cols = ['#5D8A3C','#FFD700','#4AAD52','#CC6600','#87CEEB','#CC2222','#fff'];
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div');
    p.className = 'px-particle';
    const dx = (Math.random() - 0.5) * 90 + 'px';
    const dy = (Math.random() - 0.5) * 90 + 'px';
    p.style.cssText = `left:${x}px;top:${y}px;background:${cols[i % cols.length]};--dx:${dx};--dy:${dy};`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 650);
  }
}

window.spawnXP = function(e) {
  const r = e.target.getBoundingClientRect();
  for (let i = 0; i < 3; i++) {
    const orb = document.createElement('div');
    orb.className = 'xporb';
    orb.style.cssText = `left:${r.left + r.width / 2 + (Math.random() - 0.5) * 30}px;top:${r.top}px;animation-delay:${i * 0.08}s;`;
    document.body.appendChild(orb);
    setTimeout(() => orb.remove(), 2000);
  }
  gainXP(15);
};

function flashScreen() {
  const f = document.getElementById('flash');
  f.style.opacity = '.18';
  setTimeout(() => f.style.opacity = '0', 120);
}

function notify(msg, dur = 2200) {
  const n = document.getElementById('notif');
  n.textContent = msg;
  n.style.opacity = '1';
  setTimeout(() => n.style.opacity = '0', dur);
}
window.notify = notify;

function gainXP(amount) {
  xp += amount;
  if (xp >= 100) { xp = 0; xpLevel++; notify('★ LEVEL UP! Now Level ' + xpLevel); }
  document.getElementById('xpfill').style.width = xp + '%';
  document.getElementById('xplvl').textContent = 'LVL ' + xpLevel + ' — ' + xp + ' XP';
}

// ═══════════════════════════════
//  KEYBOARD NAVIGATION
// ═══════════════════════════════
document.addEventListener('keydown', e => {
  if (['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
  const map = { '1':0,'2':1,'3':2,'4':3,'5':4,'6':5,'7':6 };
  if (map[e.key] !== undefined) window.goSection(map[e.key]);
  if (e.key === 'Tab') { e.preventDefault(); window.goSection((currentSection + 1) % 7); }
  if (e.key === 'r' || e.key === 'R') toggleRain();
});

function toggleRain() {
  weatherOn = !weatherOn;
  const w = document.getElementById('weather');
  w.innerHTML = '';
  if (weatherOn) {
    for (let i = 0; i < 80; i++) {
      const d = document.createElement('div');
      d.className = 'rain-drop';
      const h = 40 + Math.random() * 80;
      d.style.cssText = `left:${Math.random() * 100}%;height:${h}px;top:${-h}px;animation-duration:${0.6 + Math.random() * 0.5}s;animation-delay:${Math.random() * 2}s;`;
      w.appendChild(d);
    }
    notify('🌧 Rain started! Press R to stop.');
  } else { notify('☀️ Weather cleared!'); }
}

// ═══════════════════════════════
//  VALIDATION
// ═══════════════════════════════
function showErr(id, msg) { const e = document.getElementById(id); e.textContent = msg; e.classList.remove('hidden'); }
function hideErr(id) { document.getElementById(id).classList.add('hidden'); }

// ═══════════════════════════════
//  REGISTRATION (QR FIX)
// ═══════════════════════════════
window.doRegister = async function() {
  const name = document.getElementById('rname').value.trim();
  const usn = document.getElementById('rusn').value.trim().toUpperCase();
  const email = document.getElementById('remail').value.trim();
  const db = getDB();
  ['ername','erusn','erremail','ergen'].forEach(hideErr);
  let ok = true;
  if (!name) { showErr('ername','▸ Name is required'); ok = false; }
  if (!/^[A-Za-z0-9]{10}$/.test(usn)) { showErr('erusn','▸ USN must be exactly 10 alphanumeric chars'); ok = false; }
  else if (db.participants.find(p => p.usn === usn)) { showErr('erusn','▸ USN already registered!'); ok = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showErr('erremail','▸ Invalid email address'); ok = false; }
  if (!ok) return;

  const pb = document.getElementById('regpbar'); pb.classList.remove('hidden');
  const pf = document.getElementById('regpfill');
  let w = 0; const iv = setInterval(() => { w = Math.min(w + 8, 90); pf.style.width = w + '%'; }, 80);
  await new Promise(r => setTimeout(r, 1200));
  clearInterval(iv); pf.style.width = '100%';
  await new Promise(r => setTimeout(r, 300));

  const id = 'CB-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.random().toString(36).substr(2, 8).toUpperCase();
  const qrData = id + '|' + usn;
  const p = { id, name, usn, email, qr_code: qrData, rounds_played: 0, time_taken: 0, created_at: new Date().toISOString() };
  db.participants.push(p); saveDB();
  currentPlayer = p;

  pb.classList.add('hidden');
  document.getElementById('regform').classList.add('hidden');
  document.getElementById('regsuccess').classList.remove('hidden');
  document.getElementById('qridtxt').textContent = qrData;

  // Generate QR using npm qrcode (canvas-based) — THIS FIXES THE DOWNLOAD
  const qrEl = document.getElementById('qrcanv');
  qrEl.innerHTML = '';
  try {
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, qrData, { width: 180, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
    qrEl.appendChild(canvas);
  } catch (err) {
    console.error('QR Error:', err);
  }

  window.refreshLB();
  gainXP(50);
  notify('🎉 Welcome ' + name + '! You joined CODEBUDDY!');
};

window.resetReg = function() {
  document.getElementById('regform').classList.remove('hidden');
  document.getElementById('regsuccess').classList.add('hidden');
  ['rname','rusn','remail'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('regpfill').style.width = '0%';
  document.getElementById('regpbar').classList.add('hidden');
};

window.downloadQR = function() {
  const canvas = document.querySelector('#qrcanv canvas');
  if (canvas) {
    const dataURL = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = 'codebuddy-qr.png';
    a.href = dataURL;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    notify('⬇ QR Code downloaded!');
  } else {
    notify('❌ QR not ready. Try registering again.');
  }
};

// ═══════════════════════════════
//  INVENTORY
// ═══════════════════════════════
window.loadInv = function() {
  if (!currentPlayer) return;
  renderInv(currentPlayer);
};

window.searchInv = function() {
  const db = getDB();
  const usn = document.getElementById('invusn').value.trim().toUpperCase();
  const p = db.participants.find(x => x.usn === usn);
  if (p) { renderInv(p); hideErr('invserr'); }
  else { showErr('invserr','▸ USN not found. Please register first.'); }
};

window.resetInv = function() {
  document.getElementById('invempty').classList.remove('hidden');
  document.getElementById('invdata').classList.add('hidden');
  document.getElementById('invusn').value = '';
  hideErr('invserr');
};

function getPlayerRank(usn) {
  const db = getDB();
  const sorted = [...db.participants].sort((a, b) => b.rounds_played - a.rounds_played || a.time_taken - b.time_taken);
  const idx = sorted.findIndex(p => p.usn === usn);
  return idx >= 0 ? idx + 1 : '?';
}

async function renderInv(p) {
  document.getElementById('invempty').classList.add('hidden');
  document.getElementById('invdata').classList.remove('hidden');
  const rank = getPlayerRank(p.usn);
  const slots = document.getElementById('invslots');
  slots.innerHTML = `
    <div class="islot"><div class="ico">👤</div><div class="ilbl">NAME</div><div class="ival" style="font-size:.32rem">${p.name}</div></div>
    <div class="islot"><div class="ico">🎓</div><div class="ilbl">USN</div><div class="ival">${p.usn}</div></div>
    <div class="islot"><div class="ico">📧</div><div class="ilbl">EMAIL</div><div class="ival" style="font-size:.3rem">${p.email}</div></div>
    <div class="islot gold-slot"><div class="ico">⚔️</div><div class="ilbl">ROUNDS</div><div class="ival" style="font-size:1.1rem">${p.rounds_played}</div></div>
    <div class="islot"><div class="ico">⏱️</div><div class="ilbl">TIME</div><div class="ival">${p.time_taken || 0} min</div></div>
    <div class="islot gold-slot"><div class="ico">🏆</div><div class="ilbl">RANK</div><div class="ival" style="font-size:1.1rem">#${rank}</div></div>
  `;
  const qrEl = document.getElementById('invqrbox');
  qrEl.innerHTML = '';
  try {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'background:#fff;padding:12px;width:fit-content;margin:0 auto;box-shadow:0 0 0 4px #333';
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, p.qr_code, { width: 120, margin: 2 });
    wrap.appendChild(canvas);
    qrEl.appendChild(wrap);
  } catch (err) { /* ignore */ }
  gainXP(10);
}

// ═══════════════════════════════
//  COORDINATOR
// ═══════════════════════════════
window.doLogin = function() {
  const user = document.getElementById('cuser').value.trim();
  const pass = document.getElementById('cpass').value;
  hideErr('cerr');
  if (!user) { showErr('cerr','▸ Enter a username'); return; }
  if (pass !== 'officeoffice19681') { showErr('cerr','▸ Incorrect password. Access denied.'); return; }
  coordIn = true;
  window.goSection(5);
  notify('⚡ Coordinator access granted. Welcome, ' + user + '!');
  window.refreshLB();
};

window.doLogout = function() {
  coordIn = false;
  window.stopCam();
  document.getElementById('dashcard').classList.add('hidden');
  window.goSection(4);
  notify('Logged out of coordinator panel.');
};

// ═══════════════════════════════
//  CAMERA / QR SCAN
// ═══════════════════════════════
window.startCam = async function() {
  try {
    camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    const vid = document.getElementById('svid');
    vid.style.display = 'block';
    vid.srcObject = camStream;
    document.getElementById('scanph').style.display = 'none';
    document.getElementById('cambtn').classList.add('hidden');
    document.getElementById('camstop').classList.remove('hidden');
  } catch (e) {
    document.getElementById('scanph').textContent = '⚠️ Camera access denied. Use manual lookup below.';
  }
};

window.stopCam = function() {
  if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null; }
  if (scanInt) { clearInterval(scanInt); scanInt = null; }
  const vid = document.getElementById('svid');
  vid.style.display = 'none';
  document.getElementById('scanph').style.display = 'flex';
  document.getElementById('scanph').textContent = '📷 Click START CAMERA below';
  document.getElementById('cambtn').classList.remove('hidden');
  document.getElementById('camstop').classList.add('hidden');
};

window.manualLookup = function() {
  const db = getDB();
  const val = document.getElementById('mqr').value.trim().toUpperCase();
  const p = db.participants.find(x => x.qr_code === val || x.usn === val || x.id === val || x.qr_code.toUpperCase() === val);
  if (p) { lookupP = p; showDashCard(p); notify('✅ Found: ' + p.name); gainXP(12); }
  else { notify('❌ Participant not found. Check USN or QR ID.'); }
};

function showDashCard(p) {
  document.getElementById('dashcard').classList.remove('hidden');
  document.getElementById('dashinfo').innerHTML = `
    <b>NAME:</b> ${p.name}<br>
    <b>USN:</b> ${p.usn}<br>
    <b>EMAIL:</b> ${p.email}<br>
    <b>ROUNDS:</b> ${p.rounds_played}<br>
    <b>TIME:</b> ${p.time_taken || 0} min<br>
    <b>ID:</b> ${p.id}
  `;
  document.getElementById('urounds').value = p.rounds_played;
  document.getElementById('utime').value = p.time_taken || 0;
  hideErr('updmsg');
}

window.saveUpdate = function() {
  const db = getDB();
  if (!lookupP) return;
  const r = parseInt(document.getElementById('urounds').value) || 0;
  const t = parseInt(document.getElementById('utime').value) || 0;
  const idx = db.participants.findIndex(x => x.id === lookupP.id);
  if (idx >= 0) {
    db.participants[idx].rounds_played = r;
    db.participants[idx].time_taken = t;
    saveDB(); lookupP = db.participants[idx];
    showDashCard(lookupP); window.refreshLB();
    const msg = document.getElementById('updmsg');
    msg.textContent = '✅ Saved! Leaderboard updated.'; msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 3000);
    notify('💾 ' + lookupP.name + ' updated!'); gainXP(20);
  }
};

// ═══════════════════════════════
//  LEADERBOARD
// ═══════════════════════════════
window.refreshLB = function() {
  const db = getDB();
  const sorted = [...db.participants].sort((a, b) => b.rounds_played - a.rounds_played || a.time_taken - b.time_taken);
  const tbody = document.getElementById('lbbody');
  if (!sorted.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:#555;font-family:var(--mc);font-size:.44rem;padding:18px;">No participants yet! Register to appear here.</td></tr>';
    return;
  }
  const medals = ['🥇','🥈','🥉'];
  tbody.innerHTML = sorted.map((p, i) => `
    <tr>
      <td>${medals[i] || (i + 1)}</td>
      <td style="text-align:left;">${p.name}</td>
      <td>${p.usn}</td>
      <td>${p.rounds_played}</td>
      <td>${p.time_taken || '—'}</td>
    </tr>
  `).join('');
};
setInterval(window.refreshLB, 5000);
window.refreshLB();

// ═══════════════════════════════
//  HOTBAR
// ═══════════════════════════════
document.addEventListener('keydown', e => {
  const n = parseInt(e.key);
  if (n >= 1 && n <= 9) {
    document.querySelectorAll('.hslot').forEach((s, i) => s.classList.toggle('active', i === n - 1));
  }
});

// ═══════════════════════════════
//  LOADER SEQUENCE
// ═══════════════════════════════
const msgs = ['Generating terrain...','Placing grass blocks...','Growing trees...','Building village...','Spawning animals...','Placing torches...','Loading leaderboard...','Entering world...'];
let li = 0;
const ldf = document.getElementById('ldfill');
const lds = document.getElementById('ldstatus');
function loadStep() {
  if (li >= msgs.length) {
    document.getElementById('loader').style.opacity = '0';
    setTimeout(() => document.getElementById('loader').style.display = 'none', 700);
    notify('⛏ Welcome to CODEBUDDY! Press 1-7 to navigate | R for rain | TAB to advance');
    return;
  }
  lds.textContent = msgs[li];
  ldf.style.width = ((li + 1) / msgs.length * 100) + '%';
  li++;
  setTimeout(loadStep, 280);
}
setTimeout(loadStep, 400);

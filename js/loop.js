// ─── Loop ─────────────────────────────────────────────────────────────────────
function addLog(msg, type='') {
  const log = document.getElementById('log');
  const entry = document.createElement('div');
  entry.className = 'log-entry ' + type;
  const ts = new Date(elapsed*1000);
  const mm = String(Math.floor(elapsed/60)).padStart(2,'0');
  const ss = String(Math.floor(elapsed%60)).padStart(2,'0');
  entry.textContent = `[${mm}:${ss}] ${msg}`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
  if (log.children.length > 60) log.removeChild(log.children[0]);
}

function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }

function gameLoop(ts) {
  if (!gameRunning) return;
  const dt = Math.min((ts - lastTick)/1000, 0.1);
  lastTick = ts;
  elapsed += dt;

  // update time display
  const mm=String(Math.floor(elapsed/60)).padStart(2,'0');
  const ss=String(Math.floor(elapsed%60)).padStart(2,'0');
  document.getElementById('timeDisplay').textContent = `T+${mm}:${ss}`;

  // move units
  units.forEach(u=>moveUnitToward(u,dt));
  enemies.forEach(e=>moveUnitToward(e,dt));

  // unit auto-AI
  units.forEach(u=>unitAutoAI(u,dt));

  // enemy AI
  enemies.forEach(e=>enemyThink(e,dt));

  // AP regen
  regenAP(dt);

  // fog
  updateFog();

  // projectiles & particles
  updateProjectiles(dt);
  updateParticles(dt);

  // soft follow selected unit if moving
  if (selected && selected.alive && selected.moving) {
    const targetCX = selected.px + TILE/2 - (gc_w/camera.zoom)/2;
    const targetCY = selected.py + TILE/2 - (gc_h/camera.zoom)/2;
    camera.x += (targetCX-camera.x)*0.04;
    camera.y += (targetCY-camera.y)*0.04;
    clampCamera();
  }

  render();
  updateUnitCards();
  drawMinimap();
  updateMobileUI();

  requestAnimationFrame(gameLoop);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function resize() {
  const wrap = document.getElementById('canvasWrap');
  gc_w = wrap.clientWidth;
  gc_h = wrap.clientHeight;
  canvas.width = gc_w;
  canvas.height = gc_h;
}

function startGame() {
  document.getElementById('overlay').style.display = 'none';
  mapNumber = 1;
  mapStats = { kills:0, damageTaken:0, startTime:0 };
  units = UNIT_DEFS.map(makeUnit);
  generateMap(mapNumber);
  setSelection([units[0]]);
  buildUnitCards();
  updateResourceDisplay();
  initMinimap();
  centerCamera();
  updateFog();
  gameRunning = true;
  lastTick = performance.now();
  elapsed = 0;
  document.getElementById('statusText').textContent = 'MAP 1 — GROUND PROTOCOL';
  document.getElementById('statusText').style.color = 'var(--warn)';
  addLog('Squad deployed — Foundation sector','info');
  addLog('CLICK unit to select · DRAG to box-select','info');
  addLog('CLICK map to move selection','info');
  addLog(`Map ${mapNumber} — ${mapType === 'interior' ? 'Interior facility' : 'Outdoor sector'}`, 'info');
  addLog(`${enemies.length} hostiles detected — clear all to activate extraction`,'warn');
  requestAnimationFrame(gameLoop);
}
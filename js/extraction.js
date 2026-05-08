function drawExtractionPoint() {
  if (!extractionPoint) return;
  const ep = extractionPoint;
  const cx = ep.x*TILE + TILE/2 - camera.x;
  const cy = ep.y*TILE + TILE/2 - camera.y;
  const vis = isCurrentlyVisible(ep.x*TILE, ep.y*TILE);
  const seen = fogGrid[ep.y]?.[ep.x];
  if (!seen) return;

  const t = performance.now()/1000;
  const pulse = 0.5 + 0.5*Math.sin(t*3);

  if (!mapCleared) {
    // locked — dim indicator
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI*2);
    ctx.strokeStyle = vis ? `rgba(100,100,100,${0.3+pulse*0.2})` : 'rgba(60,60,60,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (vis) {
      ctx.fillStyle = 'rgba(80,80,80,0.4)';
      ctx.fill();
      ctx.fillStyle = '#555';
      ctx.font = `bold 10px Share Tech Mono`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⊗', cx, cy);
    }
  } else {
    // active — glowing beacon
    ctx.beginPath();
    ctx.arc(cx, cy, 12 + pulse*3, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(0,200,255,${0.2+pulse*0.3})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI*2);
    ctx.fillStyle = `rgba(0,200,255,${0.15+pulse*0.2})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(0,200,255,${0.7+pulse*0.3})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = `rgba(0,200,255,${0.8+pulse*0.2})`;
    ctx.font = `bold 11px Share Tech Mono`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⊕', cx, cy);

    // check if any unit is close enough to trigger confirm
    if (!extractConfirm) {
      const near = units.some(u => {
        if (!u.alive) return false;
        return distPx(u, {px: ep.x*TILE, py: ep.y*TILE}) < TILE*1.8;
      });
      if (near) showExtractConfirm();
    }
  }
}

function showExtractConfirm() {
  extractConfirm = true;
  document.getElementById('extractConfirm').style.display = 'block';
}

function cancelExtract() {
  extractConfirm = false;
  document.getElementById('extractConfirm').style.display = 'none';
  addLog('Extraction cancelled — continue scouting','info');
}

function doExtract() {
  document.getElementById('extractConfirm').style.display = 'none';
  gameRunning = false;
  showResults();
}

function showResults() {
  const elapsed_map = elapsed - mapStats.startTime;
  const mm = String(Math.floor(elapsed_map/60)).padStart(2,'0');
  const ss = String(Math.floor(elapsed_map%60)).padStart(2,'0');
  const fogPct = Math.round(
    fogGrid.flat().filter(Boolean).length / (MAP_W*MAP_H) * 100
  );
  const aliveCount = units.filter(u=>u.alive).length;

  document.getElementById('resultsMapLabel').textContent =
    `MAP ${mapNumber} — FOUNDATION SECTOR`;
  document.getElementById('resultsTable').innerHTML = `
    <div>Hostiles eliminated <span>${mapStats.kills}</span></div>
    <div>Map uncovered      <span>${fogPct}%</span></div>
    <div>Time on ground     <span>${mm}:${ss}</span></div>
    <div>Squad surviving    <span>${aliveCount}/${units.length}</span></div>
    <div>Foundation gained  <span>+${mapStats.kills*(15+mapNumber*2)}</span></div>
  `;
  document.getElementById('resultsScreen').style.display = 'flex';
}

function showRecruit() {
  document.getElementById('resultsScreen').style.display = 'none';

  // filter out already-recruited names
  const taken = new Set(units.map(u=>u.name));
  const available = RECRUIT_POOL.filter(r=>!taken.has(r.name));

  // if roster already full or no candidates, skip straight to next map
  if (units.length >= 9 || available.length === 0) {
    nextMap();
    return;
  }

  // pick two random candidates
  const shuffled = available.sort(()=>Math.random()-0.5);
  const candidates = shuffled.slice(0, Math.min(2, shuffled.length));

  document.getElementById('recruitSquadSize').textContent =
    `SQUAD: ${units.length} / 9 — CHOOSE ONE`;

  const container = document.getElementById('recruitCards');
  container.innerHTML = '';

  candidates.forEach(def => {
    const role = ROLES[def.role];
    const card = document.createElement('div');
    card.className = 'recruit-card';
    card.innerHTML = `
      <div class="r-name">${def.name}</div>
      <div class="r-role" style="background:${role.color}22;color:${role.color}">${role.label} — ${def.role}</div>
      <div class="r-bio">${def.bio}</div>
      <div class="r-stats">
        HP  <span style="color:var(--ok);float:right">${Math.round(80*role.hpMult)}</span><br>
        ATK <span style="color:var(--danger);float:right">${role.atk}</span><br>
        DEF <span style="color:var(--accent);float:right">${role.def}</span><br>
        AP  <span style="color:#aaa;float:right">${role.ap}</span>
      </div>
    `;
    card.onclick = () => pickRecruit(def);
    container.appendChild(card);
  });

  document.getElementById('recruitScreen').style.display = 'flex';
}

function pickRecruit(def) {
  document.getElementById('recruitScreen').style.display = 'none';
  // create and add the new unit
  const newUnit = makeUnit({ ...def, x: 4, y: MAP_H-6 });
  units.push(newUnit);
  addLog(`${def.name} joins the squad — ${def.role}`, 'ok');
  nextMap();
}

function nextMap() {
  document.getElementById('resultsScreen').style.display = 'none';
  document.getElementById('recruitScreen').style.display = 'none';
  mapNumber++;
  mapStats = { kills:0, damageTaken:0, startTime: elapsed };
  mapCleared = false;
  extractConfirm = false;

  // heal units slightly between maps
  units.forEach(u => {
    if (!u.alive) { u.alive=true; u.hp=Math.round(u.maxHp*0.3); u.behaviorState='standby'; }
    else u.hp = Math.min(u.maxHp, u.hp + Math.round(u.maxHp*0.4));
    u.ap = u.maxAp;
  });

  generateMap(mapNumber);
  setSelection([units[0]]);
  buildUnitCards();
  centerCamera();
  updateFog();
  gameRunning = true;
  document.getElementById('statusText').textContent = `MAP ${mapNumber} — GROUND PROTOCOL`;
  document.getElementById('statusText').style.color = 'var(--warn)';
  addLog(`Map ${mapNumber} — squad advancing`, 'info');
  addLog(`${enemies.length} hostiles detected`, 'warn');
  addLog('Reach extraction beacon to advance', '');
  requestAnimationFrame(gameLoop);
}

function checkGameOver() {
  const allDead = units.every(u=>!u.alive);
  if (allDead) {
    addLog('SQUAD ELIMINATED — FOUNDATION FALLS','danger');
    gameRunning = false;
    document.getElementById('statusText').textContent = 'MISSION FAILED';
    document.getElementById('statusText').style.color = 'var(--danger)';
  }
}
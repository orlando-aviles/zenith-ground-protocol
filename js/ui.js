// ─── UI ───────────────────────────────────────────────────────────────────────
function getStateLabel(u) {
  if (!u.alive) return ['✕ DOWN', 'down'];
  const s = u.behaviorState || 'standby';
  const labels = {
    standby:    ['● STANDBY',    'standby'],
    moving:     ['▶ MOVING',     'moving'],
    engaging:   ['✕ ENGAGING',   'engaging'],
    guarding:   ['◈ GUARDING',   'guarding'],
    countering: ['↺ COUNTER',    'countering'],
    healing:    ['♦ HEALING',    'healing'],
    down:       ['✕ DOWN',       'down'],
  };
  return labels[s] || ['● STANDBY', 'standby'];
}

function buildUnitCards() {
  const container = document.getElementById('unitCards');
  container.innerHTML = '';

  // ── Roster pips row (all units, compact) ──
  const pipRow = document.createElement('div');
  pipRow.className = 'roster-row';
  pipRow.id = 'rosterPips';
  units.forEach((u,i) => {
    const pip = document.createElement('div');
    pip.className = 'roster-pip' + (!u.alive?' dead':'');
    pip.id = `pip-${i}`;
    pip.innerHTML = `<div class="pip-dot" style="background:${u.color}"></div>${u.name}`;
    pip.onclick = () => {
      if (!u.alive) return;
      setSelection([u]);
      centerCamera();
    };
    pipRow.appendChild(pip);
  });
  container.appendChild(pipRow);

  // ── Full cards for selected units only ──
  units.forEach((u,i) => {
    const card = document.createElement('div');
    card.className = 'unit-card selected' + (!u.alive?' dead':'');
    card.id = `ucard-${i}`;
    card.style.display = selectedUnits.has(u) ? 'block' : 'none';
    const [stateText, stateCls] = getStateLabel(u);
    card.innerHTML = `
      <div class="unit-name-row">
        <span class="unit-name">${u.name}</span>
        <span class="unit-role" style="color:${u.color}">${u.label}</span>
      </div>
      <div class="bar-row">
        <div class="bar-label"><span>HP</span><span id="hp-val-${i}">${u.hp}/${u.maxHp}</span></div>
        <div class="bar-bg"><div class="bar-fill hp-fill" id="hp-bar-${i}" style="width:${u.hp/u.maxHp*100}%;background:${u.hp/u.maxHp>0.5?'var(--ok)':u.hp/u.maxHp>0.25?'var(--warn)':'var(--danger)'}"></div></div>
      </div>
      <div class="bar-row">
        <div class="bar-label"><span>AP</span><span id="ap-val-${i}">${u.ap}/${u.maxAp}</span></div>
        <div class="bar-bg"><div class="bar-fill ap-fill" id="ap-bar-${i}" style="width:${u.ap/u.maxAp*100}%"></div></div>
      </div>
      <span class="unit-state ${stateCls}" id="state-${i}">${stateText}</span>
    `;
    card.onclick = () => {
      // clicking card deselects this unit if multiple selected
      if (!u.alive) return;
      setSelection([u]);
      centerCamera();
    };
    container.appendChild(card);
  });
}

function updateUnitCards() {
  units.forEach((u,i) => {
    // pip visibility
    const pip = document.getElementById(`pip-${i}`);
    if (pip) pip.className = 'roster-pip' + (!u.alive?' dead':'');

    // full card — show only if selected
    const card = document.getElementById(`ucard-${i}`);
    if (!card) return;
    card.style.display = selectedUnits.has(u) ? 'block' : 'none';

    if (!selectedUnits.has(u)) return; // skip updating hidden cards

    const hpBar = document.getElementById(`hp-bar-${i}`);
    const hpVal = document.getElementById(`hp-val-${i}`);
    const apBar = document.getElementById(`ap-bar-${i}`);
    const apVal = document.getElementById(`ap-val-${i}`);
    const stateEl = document.getElementById(`state-${i}`);
    if (hpBar) {
      hpBar.style.width = (u.hp/u.maxHp*100)+'%';
      hpBar.style.background = u.hp/u.maxHp>0.5?'var(--ok)':u.hp/u.maxHp>0.25?'var(--warn)':'var(--danger)';
    }
    if (hpVal) hpVal.textContent = `${u.hp}/${u.maxHp}`;
    if (apBar) apBar.style.width = (u.ap/u.maxAp*100)+'%';
    if (apVal) apVal.textContent = `${u.ap}/${u.maxAp}`;
    if (stateEl) {
      const [stateText, stateCls] = getStateLabel(u);
      stateEl.textContent = stateText;
      stateEl.className = `unit-state ${stateCls}`;
    }
  });
}

// ─── Minimap ──────────────────────────────────────────────────────────────────
let mmCanvas, mmCtx;
const MM_SCALE = 5;

function initMinimap() {
  mmCanvas = document.getElementById('minimapCanvas');
  mmCanvas.width  = MAP_W * MM_SCALE;
  mmCanvas.height = MAP_H * MM_SCALE;
  mmCtx = mmCanvas.getContext('2d');
}

function drawMinimap() {
  if (!mmCtx) return;

  // resize canvas if needed (map size may have changed)
  const needW = MAP_W * MM_SCALE;
  const needH = MAP_H * MM_SCALE;
  if (mmCanvas.width !== needW || mmCanvas.height !== needH) {
    mmCanvas.width = needW;
    mmCanvas.height = needH;
  }

  // base — unseen black
  mmCtx.fillStyle = '#000';
  mmCtx.fillRect(0, 0, mmCanvas.width, mmCanvas.height);

  let revealed = 0;
  for (let y=0;y<MAP_H;y++) {
    for (let x=0;x<MAP_W;x++) {
      const seen = fogGrid[y]?.[x];
      if (!seen) continue;
      revealed++;
      const vis = isCurrentlyVisible(x*TILE, y*TILE);
      const t = tileMap[y][x];
      if (vis) {
        // currently lit
        mmCtx.fillStyle = t===0 ? '#2a3f5a' : t===1 ? '#3a2810' : '#151c26';
      } else {
        // seen but dark — clearly different from unseen black
        mmCtx.fillStyle = t===0 ? '#162030' : t===1 ? '#1e1508' : '#0c1118';
      }
      mmCtx.fillRect(x*MM_SCALE, y*MM_SCALE, MM_SCALE, MM_SCALE);
    }
  }

  // visible enemies
  enemies.forEach(e => {
    if (!e.alive || !isCurrentlyVisible(e.px, e.py)) return;
    mmCtx.fillStyle = '#ff3a3a';
    mmCtx.fillRect(Math.round(e.px/TILE)*MM_SCALE, Math.round(e.py/TILE)*MM_SCALE, MM_SCALE, MM_SCALE);
  });

  // units — slightly larger dot
  units.forEach(u => {
    if (!u.alive) return;
    mmCtx.fillStyle = u.color;
    const ux = Math.round(u.px/TILE)*MM_SCALE;
    const uy = Math.round(u.py/TILE)*MM_SCALE;
    mmCtx.fillRect(ux-1, uy-1, MM_SCALE+1, MM_SCALE+1);
  });

  // extraction point
  if (extractionPoint) {
    const vis = isCurrentlyVisible(extractionPoint.x*TILE, extractionPoint.y*TILE);
    const seen = fogGrid[extractionPoint.y]?.[extractionPoint.x];
    if (seen) {
      mmCtx.fillStyle = mapCleared ? 'rgba(0,200,255,0.9)' : 'rgba(80,80,80,0.7)';
      mmCtx.fillRect(extractionPoint.x*MM_SCALE-1, extractionPoint.y*MM_SCALE-1, MM_SCALE+2, MM_SCALE+2);
    }
  }

  // viewport rect
  mmCtx.strokeStyle = 'rgba(0,200,255,0.5)';
  mmCtx.lineWidth = 1;
  mmCtx.strokeRect(
    (camera.x/TILE)*MM_SCALE,
    (camera.y/TILE)*MM_SCALE,
    (gc_w/TILE)*MM_SCALE,
    (gc_h/TILE)*MM_SCALE
  );

  const pct = Math.round(revealed/(MAP_W*MAP_H)*100);
  const alive = enemies.filter(e=>e.alive).length;
  const fogEl = document.getElementById('fogPct');
  const enmEl = document.getElementById('enemyCount');
  if (fogEl) fogEl.textContent = `${pct}% uncovered`;
  if (enmEl) enmEl.textContent = `${alive} hostile${alive!==1?'s':''}`;
}

function updateResourceDisplay() {
  document.getElementById('res-foundation').textContent = `Foundation: ${resources.foundation}`;
  document.getElementById('res-flux').textContent = `Flux: ${resources.flux}`;
  const mobF = document.getElementById('res-foundation-mob');
  const mobX = document.getElementById('res-flux-mob');
  if (mobF) mobF.textContent = resources.foundation;
  if (mobX) mobX.textContent = resources.flux;
}

function updateMobileUI() {
  const left = document.getElementById('mobileLeft');
  if (!left) return;
  left.innerHTML = '';

  // pip row
  const pipRow = document.createElement('div');
  pipRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px';
  units.forEach((u,i) => {
    const pip = document.createElement('div');
    pip.className = 'roster-pip' + (!u.alive?' dead':'');
    pip.style.cssText = 'display:flex;align-items:center;gap:3px;padding:2px 5px;border-radius:4px;border:1px solid var(--border);cursor:pointer;font-family:Share Tech Mono,monospace;font-size:9px;color:var(--text)';
    if (selectedUnits.has(u)) pip.style.borderColor = 'var(--accent)';
    pip.innerHTML = `<div style="width:5px;height:5px;border-radius:50%;background:${u.color}"></div>${u.name}`;
    pip.onclick = () => { if (!u.alive) return; setSelection([u]); centerCamera(); };
    pipRow.appendChild(pip);
  });
  left.appendChild(pipRow);

  // selected unit cards (compact)
  [...selectedUnits].forEach(u => {
    if (!u.alive) return;
    const [stateText, stateCls] = getStateLabel(u);
    const card = document.createElement('div');
    card.className = 'mob-card';
    card.innerHTML = `
      <div class="mob-card-name">
        <span style="color:${u.color}">${u.name}</span>
        <span style="font-size:9px;font-family:Share Tech Mono,monospace;color:var(--dim)">${u.label}</span>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <div style="flex:1">
          <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;margin-bottom:2px">
            <div style="height:100%;border-radius:2px;width:${u.hp/u.maxHp*100}%;background:${u.hp/u.maxHp>0.5?'var(--ok)':u.hp/u.maxHp>0.25?'var(--warn)':'var(--danger)'}"></div>
          </div>
          <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px">
            <div style="height:100%;border-radius:2px;width:${u.ap/u.maxAp*100}%;background:var(--accent)"></div>
          </div>
        </div>
        <span class="unit-state ${stateCls}" style="font-size:8px">${stateText}</span>
      </div>
    `;
    left.appendChild(card);
  });

  // mobile minimap
  const mctx = window._mmMobCtx;
  if (!mctx) return;
  const mc = mctx.canvas;
  const scaleX = mc.width/MAP_W, scaleY = mc.height/MAP_H;

  mctx.fillStyle='#000';
  mctx.fillRect(0,0,mc.width,mc.height);

  let revealed=0;
  for (let y=0;y<MAP_H;y++) {
    for (let x=0;x<MAP_W;x++) {
      if (!fogGrid[y]?.[x]) continue;
      revealed++;
      const vis=isCurrentlyVisible(x*TILE,y*TILE);
      const t=tileMap[y][x];
      mctx.fillStyle=vis?(t===0?'#2a3f5a':t===1?'#3a2810':'#151c26'):(t===0?'#162030':'#0c1118');
      mctx.fillRect(Math.floor(x*scaleX),Math.floor(y*scaleY),Math.ceil(scaleX),Math.ceil(scaleY));
    }
  }
  enemies.forEach(e=>{
    if(!e.alive||!isCurrentlyVisible(e.px,e.py)) return;
    mctx.fillStyle='#ff3a3a';
    mctx.fillRect(Math.floor(Math.round(e.px/TILE)*scaleX),Math.floor(Math.round(e.py/TILE)*scaleY),Math.ceil(scaleX)+1,Math.ceil(scaleY)+1);
  });
  units.forEach(u=>{
    if(!u.alive) return;
    mctx.fillStyle=u.color;
    mctx.fillRect(Math.floor(Math.round(u.px/TILE)*scaleX)-1,Math.floor(Math.round(u.py/TILE)*scaleY)-1,Math.ceil(scaleX)+2,Math.ceil(scaleY)+2);
  });

  const pct=Math.round(revealed/(MAP_W*MAP_H)*100);
  const alive=enemies.filter(e=>e.alive).length;
  const fe=document.getElementById('fogPctMob');
  const ee=document.getElementById('enemyCountMob');
  if(fe) fe.textContent=`${pct}%`;
  if(ee) ee.textContent=`${alive}✕`;

  // hint
  const hm=document.getElementById('hintTextMob');
  if(hm) hm.textContent=document.getElementById('hintText')?.textContent||'';
}

function setHint(t) { document.getElementById('hintText').textContent = t; }

function updateUI() {
  units.forEach((u,i)=>{
    const c=document.getElementById(`ucard-${i}`);
    if(c) c.className='unit-card'+(selectedUnits.has(u)?' selected':'')+(u.alive?'':' dead');
  });
  // update hint based on selection size
  if (selectedUnits.size === 0) setHint('CLICK A UNIT TO SELECT — DRAG TO BOX-SELECT');
  else if (selectedUnits.size === 1) setHint(`${selected.name} selected — CLICK MAP TO MOVE`);
  else setHint(`${selectedUnits.size} units selected — CLICK MAP TO MOVE`);
}

function setSelection(unitsArr) {
  selectedUnits = new Set(unitsArr.filter(u=>u.alive));
  selected = [...selectedUnits][0] || null;
  updateUI();
}

function addToSelection(u) {
  if (!u.alive) return;
  selectedUnits.add(u);
  selected = u;
  updateUI();
}

function moveGroupTo(tx, ty) {
  // send each selected unit to a slightly offset tile to avoid stacking
  const arr = [...selectedUnits].filter(u=>u.alive);
  const offsets = [{dx:0,dy:0},{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:1,dy:1},{dx:-1,dy:1}];
  arr.forEach((u,i) => {
    const off = offsets[i] || {dx:i,dy:0};
    let destX = tx + off.dx, destY = ty + off.dy;
    // fallback to exact tile if offset not walkable
    if (!isWalkable(destX, destY)) { destX = tx; destY = ty; }
    const path = bfs(Math.round(u.px/TILE), Math.round(u.py/TILE), destX, destY);
    if (path && path.length > 1) {
      u._path = path.slice(1);
      const next = u._path.shift();
      u.targetX = next.x; u.targetY = next.y;
      u.moving = true;
    }
  });
}
// ─── Camera ───────────────────────────────────────────────────────────────────
function centerCamera() {
  if (!selected || !selected.alive) return;
  camera.x = selected.px + TILE/2 - (gc_w / camera.zoom)/2;
  camera.y = selected.py + TILE/2 - (gc_h / camera.zoom)/2;
  clampCamera();
}

function clampCamera() {
  const visW = gc_w / camera.zoom;
  const visH = gc_h / camera.zoom;
  camera.x = Math.max(0, Math.min(MAP_W*TILE - visW, camera.x));
  camera.y = Math.max(0, Math.min(MAP_H*TILE - visH, camera.y));
}

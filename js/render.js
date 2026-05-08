// ─── AP Regen ─────────────────────────────────────────────────────────────────
let apTimer = 0;
function regenAP(dt) {
  apTimer += dt;
  if (apTimer >= AP_REGEN_MS/1000) {
    apTimer = 0;
    units.forEach(u => {
      if (!u.alive) return;
      u.ap = Math.min(u.maxAp, u.ap + 12);
    });
  }
}
// ─── Render ───────────────────────────────────────────────────────────────────
function drawTile(x,y) {
  const t = tileMap[y][x];
  const revealed = fogGrid[y][x];
  const visible = isCurrentlyVisible(x*TILE,y*TILE);

  if (!revealed) {
    ctx.fillStyle = '#000';
    ctx.fillRect(x*TILE-camera.x, y*TILE-camera.y, TILE, TILE);
    return;
  }

  // floor
  if (t===0) ctx.fillStyle = visible ? '#111820' : '#0a0e13';
  else if (t===1) ctx.fillStyle = visible ? '#1a1208' : '#0f0b05';
  else ctx.fillStyle = '#05080d';

  ctx.fillRect(x*TILE-camera.x, y*TILE-camera.y, TILE, TILE);

  // grid lines
  ctx.strokeStyle = visible ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.015)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x*TILE-camera.x+0.5, y*TILE-camera.y+0.5, TILE-1, TILE-1);

  // rubble
  if (t===1 && visible) {
    ctx.fillStyle = '#2a1f10';
    ctx.fillRect(x*TILE-camera.x+4, y*TILE-camera.y+4, TILE-8, TILE-8);
  }

  // fog fade on edges
  if (revealed && !visible) {
    ctx.fillStyle = 'rgba(7,10,15,0.5)';
    ctx.fillRect(x*TILE-camera.x, y*TILE-camera.y, TILE, TILE);
  }
}

function drawPerson(ctx, cx, cy, color, scale=1) {
  const s = scale;
  ctx.fillStyle = color;
  // head
  ctx.beginPath();
  ctx.arc(cx, cy - 8*s, 4*s, 0, Math.PI*2);
  ctx.fill();
  // body
  ctx.fillRect(cx - 3*s, cy - 4*s, 6*s, 8*s);
  // legs
  ctx.fillRect(cx - 3*s, cy + 4*s, 2.5*s, 6*s);
  ctx.fillRect(cx + 0.5*s, cy + 4*s, 2.5*s, 6*s);
  // arms
  ctx.fillRect(cx - 6*s, cy - 3*s, 3*s, 2*s);
  ctx.fillRect(cx + 3*s, cy - 3*s, 3*s, 2*s);
}

function drawUnit(u) {
  if (!u.alive) return;
  if (!isCurrentlyVisible(u.px,u.py) && !fogGrid[Math.round(u.py/TILE)]?.[Math.round(u.px/TILE)]) return;

  const cx = u.px + TILE/2 - camera.x;
  const cy = u.py + TILE/2 - camera.y;
  const isVis = isCurrentlyVisible(u.px, u.py);

  // selection ring
  if (selectedUnits.has(u)) {
    ctx.beginPath();
    ctx.arc(cx, cy, TILE/2+3, 0, Math.PI*2);
    ctx.strokeStyle = u === selected ? 'rgba(0,200,255,0.9)' : 'rgba(0,200,255,0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // sentinel guard ring
  if (u.role === 'SENTINEL' && u.guarding && isVis) {
    ctx.beginPath();
    ctx.arc(cx, cy, TILE/2+7, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(74,158,255,0.35)';
    ctx.lineWidth = 3;
    ctx.stroke();
    if (u.counterReady) {
      ctx.beginPath();
      ctx.arc(cx, cy, TILE/2+7, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(74,158,255,0.7)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4,4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // dim sprite in fog
  if (!isVis) ctx.globalAlpha = 0.45;
  drawSpriteEntity(u, roleToPalette(u.role), cx, cy);
  ctx.globalAlpha = 1;

  // hp bar above
  const bw = TILE-4, bh = 3;
  const bx = cx - bw/2;
  const by = cy - TILE/2 - 6;
  ctx.fillStyle = '#111';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = u.hp/u.maxHp > 0.5 ? '#00ff88' : u.hp/u.maxHp > 0.25 ? '#ffaa00' : '#ff3a3a';
  ctx.fillRect(bx, by, bw*(u.hp/u.maxHp), bh);
}

function drawEnemy(e) {
  if (!e.alive) return;
  if (!isCurrentlyVisible(e.px, e.py)) return;

  const cx = e.px + TILE/2 - camera.x;
  const cy = e.py + TILE/2 - camera.y;

  drawSpriteEntity(e, roleToPalette('ENEMY', e.tier), cx, cy);

  // hp bar
  const bw = TILE-4, bh = 3, bx = cx-bw/2, by = cy-TILE/2-6;
  ctx.fillStyle = '#111'; ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#cc2200'; ctx.fillRect(bx, by, bw*(e.hp/e.maxHp), bh);
}

function updateProjectiles(dt) {
  projectiles.forEach(p=>{
    if (p.done) return;
    const dx=p.tx-p.px,dy=p.ty-p.py;
    const d=Math.sqrt(dx*dx+dy*dy);
    if (d<4) { p.done=true; return; }
    p.px+=dx/d*p.spd*dt;
    p.py+=dy/d*p.spd*dt;
  });
  projectiles=projectiles.filter(p=>!p.done);
}

function drawProjectiles() {
  projectiles.forEach(p=>{
    ctx.beginPath();
    ctx.arc(p.px-camera.x,p.py-camera.y,3,0,Math.PI*2);
    ctx.fillStyle=p.color;
    ctx.fill();
    ctx.shadowColor=p.color;
    ctx.shadowBlur=8;
    ctx.fill();
    ctx.shadowBlur=0;
  });
}

function updateParticles(dt) {
  particles.forEach(p=>{
    p.px+=p.vx*dt; p.py+=p.vy*dt;
    p.vx*=0.88; p.vy*=0.88;
    p.life-=dt*1.5;
  });
  particles=particles.filter(p=>p.life>0);
}

function drawParticles() {
  particles.forEach(p=>{
    ctx.globalAlpha=p.life/p.maxLife;
    ctx.beginPath();
    ctx.arc(p.px-camera.x,p.py-camera.y,p.r,0,Math.PI*2);
    ctx.fillStyle=p.color;
    ctx.fill();
  });
  ctx.globalAlpha=1;
}

function render() {
  ctx.clearRect(0,0,gc_w,gc_h);
  ctx.save();
  ctx.scale(camera.zoom, camera.zoom);

  // tiles
  const visW = gc_w / camera.zoom;
  const visH = gc_h / camera.zoom;
  const startX=Math.max(0,Math.floor(camera.x/TILE));
  const endX=Math.min(MAP_W,Math.ceil((camera.x+visW)/TILE));
  const startY=Math.max(0,Math.floor(camera.y/TILE));
  const endY=Math.min(MAP_H,Math.ceil((camera.y+visH)/TILE));

  for (let y=startY;y<endY;y++)
    for (let x=startX;x<endX;x++)
      drawTile(x,y);

  drawParticles();
  drawProjectiles();
  enemies.forEach(drawEnemy);
  units.forEach(drawUnit);
  drawExtractionPoint();

  // box-select rectangle (in world space)
  if (boxDrag.active) {
    const bx = boxDrag.sx - camera.x;
    const by = boxDrag.sy - camera.y;
    const bw = boxDrag.ex - boxDrag.sx;
    const bh = boxDrag.ey - boxDrag.sy;
    ctx.strokeStyle = 'rgba(0,200,255,0.8)';
    ctx.lineWidth = 1.5 / camera.zoom;
    ctx.setLineDash([4/camera.zoom, 3/camera.zoom]);
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = 'rgba(0,200,255,0.06)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.setLineDash([]);
  }

  ctx.restore();
}
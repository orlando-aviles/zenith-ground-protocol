// ─── Distance helpers ─────────────────────────────────────────────────────────
function dist(a,b) {
  return Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2);
}
function distPx(a,b) {
  return Math.sqrt((a.px-b.px)**2+(a.py-b.py)**2);
}

// ─── Unit Auto-AI ─────────────────────────────────────────────────────────────
const UNIT_AI_INTERVAL = 1.2; // seconds between auto-decisions
const HEAL_THRESHOLD = 0.65;  // heal ally below 65% hp
const ATTACK_RANGE_PX = TILE * 4;
const HEAL_RANGE_PX   = TILE * 3.5;

function unitAutoAI(u, dt) {
  if (!u.alive) return;
  u.autoTimer -= dt;
  if (u.autoTimer > 0) return;
  u.autoTimer = UNIT_AI_INTERVAL + Math.random() * 0.4;

  if (u.role === 'COMMANDO') autoCommando(u);
  else if (u.role === 'SENTINEL') autoSentinel(u);
  else if (u.role === 'MEDIC') autoMedic(u);
}

function autoCommando(u) {
  if (u.ap < 20) { u.behaviorState = u.moving ? 'moving' : 'standby'; return; }
  let target = null, best = Infinity;
  enemies.forEach(e => {
    if (!e.alive) return;
    if (!isCurrentlyVisible(e.px, e.py)) return;
    const d = distPx(u, e);
    if (d < ATTACK_RANGE_PX && d < best) { best = d; target = e; }
  });
  if (target) {
    u.behaviorState = 'engaging';
    u.facing = vecToDir(target.px - u.px, target.py - u.py);
    u.ap -= 20;
    let dmg = u.atk + randInt(-4, 4);
    target.hp -= dmg;
    fireProjectile(u, target, u.color);
    spawnParticle(target.px+TILE/2, target.py+TILE/2, '#ff3a3a');
    addLog(`${u.name} fires — ${dmg} dmg`, 'ok');
    if (target.hp <= 0) killEnemy(target);
  } else {
    u.behaviorState = u.moving ? 'moving' : 'standby';
  }
}

function autoSentinel(u) {
  u.guarding = true;
  u.behaviorState = 'guarding';
  if (u.ap >= 15) u.counterReady = true;

  if (u.justHit && u.ap >= 15) {
    u.justHit = false;
    let closest = null, bd = Infinity;
    enemies.forEach(e => {
      if (!e.alive) return;
      const d = distPx(u, e);
      if (d < TILE*1.8 && d < bd) { bd=d; closest=e; }
    });
    if (closest) {
      u.behaviorState = 'countering';
      u.facing = vecToDir(closest.px - u.px, closest.py - u.py);
      u.ap -= 15;
      const dmg = u.atk + randInt(-2,2);
      closest.hp -= dmg;
      fireProjectile(u, closest, u.color);
      spawnParticle(closest.px+TILE/2, closest.py+TILE/2, '#4a9eff', 6);
      addLog(`${u.name} retaliates — ${dmg}`, 'info');
      if (closest.hp <= 0) killEnemy(closest);
    }
  }
  if (u.moving) u.behaviorState = 'moving';
}

function autoMedic(u) {
  if (u.ap < 30) { u.behaviorState = u.moving ? 'moving' : 'standby'; return; }
  let target = null, lowestRatio = HEAL_THRESHOLD;
  units.forEach(ally => {
    if (!ally.alive || ally === u) return;
    const ratio = ally.hp / ally.maxHp;
    if (ratio < lowestRatio) { lowestRatio = ratio; target = ally; }
  });
  if (!target) { u.behaviorState = u.moving ? 'moving' : 'standby'; return; }

  const d = distPx(u, target);
  if (d > HEAL_RANGE_PX) {
    u.behaviorState = 'moving';
    const path = bfs(
      Math.round(u.px/TILE), Math.round(u.py/TILE),
      Math.round(target.px/TILE), Math.round(target.py/TILE)
    );
    if (path && path.length > 1) {
      u._path = path.slice(1);
      const next = u._path.shift();
      u.targetX = next.x; u.targetY = next.y;
      u.moving = true;
    }
    return;
  }
  u.behaviorState = 'healing';
  u.ap -= 30;
  const heal = 25 + randInt(0, 10);
  target.hp = Math.min(target.maxHp, target.hp + heal);
  spawnParticle(target.px+TILE/2, target.py+TILE/2, '#00ff88', 8);
  addLog(`${u.name} restores ${heal} → ${target.name}`, 'ok');
}
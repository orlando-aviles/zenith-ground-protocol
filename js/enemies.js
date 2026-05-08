// ─── Enemy AI ─────────────────────────────────────────────────────────────────
function pickEnemyTarget(enemy) {
  // threat table: distance weighted by aggroMult — sentinel generates much higher threat
  let best = null, bestScore = -Infinity;
  units.forEach(u => {
    if (!u.alive) return;
    const d = distPx(enemy, u);
    if (d > TILE * 12) return; // outside detection range
    // threat = aggroMult / distance — closer + more aggro = higher priority
    const threat = (u.aggroMult * 300) / (d + 1);
    if (threat > bestScore) { bestScore = threat; best = u; }
  });
  return best;
}

function enemyThink(enemy, dt) {
  if (!enemy.alive) return;
  enemy.think -= dt;
  if (enemy.think > 0) return;
  enemy.think = ENEMY_THINK_MS/1000 + Math.random()*0.4;

  const target = pickEnemyTarget(enemy);
  if (!target) return;
  enemy.targetUnit = target;

  const d = distPx(enemy, target);

  if (d < TILE * 1.6) {
    // attack — sentinel def reduces damage
    enemy.behaviorState = 'engaging';
    enemy.facing = vecToDir(target.px - enemy.px, target.py - enemy.py);
    let dmg = enemy.atk + randInt(-3,3) - target.def;
    dmg = Math.max(1, dmg);

    // sentinel counter: if guarding and counterReady, reflect some damage
    if (target.role === 'SENTINEL' && target.counterReady && target.ap >= 10) {
      const counterDmg = Math.round(dmg * 0.5);
      enemy.hp -= counterDmg;
      target.ap -= 10;
      target.counterReady = false;
      spawnParticle(enemy.px+TILE/2, enemy.py+TILE/2, '#4a9eff', 8);
      addLog(`${target.name} COUNTERS — ${counterDmg} reflected`, 'info');
      if (enemy.hp <= 0) { killEnemy(enemy); return; }
    }

    target.hp -= dmg;
    target.hp = Math.max(0, target.hp);
    target.justHit = true;
    mapStats.damageTaken += dmg;
    fireProjectile(enemy, target, '#ff3a3a');
    spawnParticle(target.px+TILE/2, target.py+TILE/2, '#ff3a3a', 4);
    addLog(`${target.name} hit for ${dmg}${target.def>0?' (guarded)':''}`, 'danger');

    if (target.hp <= 0) {
      target.alive = false;
      target.hp = 0;
      target.behaviorState = 'down';
      addLog(`${target.name} is DOWN`, 'danger');
      if (selected === target) selected = null;
      checkGameOver();
    }
  } else if (d < TILE * 12) {
    enemy.behaviorState = 'moving';
    const path = bfs(
      Math.round(enemy.px/TILE), Math.round(enemy.py/TILE),
      Math.round(target.px/TILE), Math.round(target.py/TILE)
    );
    if (path && path.length > 1) {
      const next = path[1];
      enemy.targetX = next.x; enemy.targetY = next.y;
      enemy.moving = true;
      enemy._path = path.slice(2);
    }
  }
}

function killEnemy(enemy) {
  enemy.alive = false;
  enemy.hp = 0;
  spawnParticle(enemy.px+TILE/2, enemy.py+TILE/2, '#ff6600', 12);
  addLog('Enemy eliminated', 'ok');
  resources.foundation += 15 + mapNumber*2;
  resources.flux += 8 + mapNumber;
  mapStats.kills++;
  updateResourceDisplay();
  checkMapCleared();
}

function checkMapCleared() {
  if (mapCleared) return;
  const allDead = enemies.every(e=>!e.alive);
  if (allDead) {
    mapCleared = true;
    addLog('All hostiles eliminated','ok');
    addLog('Extraction point is now active — move squad to beacon','info');
    document.getElementById('statusText').textContent = 'SECTOR CLEAR — EXTRACT WHEN READY';
    document.getElementById('statusText').style.color = 'var(--ok)';
  }
}
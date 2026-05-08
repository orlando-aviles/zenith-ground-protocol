function spawnParticle(px,py,color,count=6) {
  for (let i=0;i<count;i++) {
    const ang = Math.random()*Math.PI*2;
    const spd = 30+Math.random()*60;
    particles.push({
      px,py,
      vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,
      life:1,maxLife:1,color,r:3+Math.random()*3
    });
  }
}

function fireProjectile(from, to, color) {
  projectiles.push({
    px:from.px+TILE/2, py:from.py+TILE/2,
    tx:to.px+TILE/2, ty:to.py+TILE/2,
    color, life:1, spd:320,
    done:false
  });
}

function attackEnemy(unit, enemy) {
  if (unit.ap < 20) { addLog('Not enough AP','warn'); return; }
  if (!enemy.alive) return;
  if (distPx(unit, enemy) > TILE*4) {
    addLog('Target out of range','warn'); return;
  }
  unit.ap -= 20;
  const dmg = Math.max(1, unit.atk + randInt(-4,4));
  enemy.hp -= dmg;
  fireProjectile(unit, enemy, unit.color);
  spawnParticle(enemy.px+TILE/2,enemy.py+TILE/2,'#ff3a3a');
  addLog(`${unit.name} → ${dmg} dmg`,'ok');
  if (enemy.hp <= 0) killEnemy(enemy);
  pendingCmd = null;
  setHint('SELECT A UNIT — CLICK MAP TO MOVE');
}

function healUnit(unit, target) {
  if (unit.ap < 30) { addLog('Not enough AP','warn'); return; }
  if (unit.role !== 'MEDIC') { addLog('Only MEDIC can heal','warn'); return; }
  if (distPx(unit, target) > TILE*3.5) {
    addLog('Ally out of range','warn'); return;
  }
  unit.ap -= 30;
  const heal = 25 + randInt(0,10);
  target.hp = Math.min(target.maxHp, target.hp + heal);
  spawnParticle(target.px+TILE/2,target.py+TILE/2,'#00ff88');
  addLog(`${unit.name} restores ${heal} to ${target.name}`,'ok');
  pendingCmd = null;
  setHint('SELECT A UNIT — CLICK MAP TO MOVE');
}

// ─── Scout Pulse ──────────────────────────────────────────────────────────────
function scoutPulse(unit) {
  if (unit.ap < 15) { addLog('Not enough AP','warn'); return; }
  unit.ap -= 15;
  // expand fog reveal around unit dramatically
  const ux = Math.round(unit.px/TILE), uy = Math.round(unit.py/TILE);
  const r = 8;
  for (let dy=-r;dy<=r;dy++)
    for (let dx=-r;dx<=r;dx++)
      if (dx*dx+dy*dy<=r*r) {
        const fx=ux+dx,fy=uy+dy;
        if (fy>=0&&fy<MAP_H&&fx>=0&&fx<MAP_W) fogGrid[fy][fx]=true;
      }
  spawnParticle(unit.px+TILE/2,unit.py+TILE/2,'#00c8ff',20);
  addLog(`${unit.name} scout pulse — area revealed`,'info');
  pendingCmd = null;
  setHint('SELECT A UNIT — CLICK MAP TO MOVE');
}
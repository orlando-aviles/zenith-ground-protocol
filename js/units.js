function makeUnit(def) {
  const role = ROLES[def.role];
  return {
    ...def,
    hp: Math.round(80 * role.hpMult),
    maxHp: Math.round(80 * role.hpMult),
    ap: role.ap,
    maxAp: role.ap,
    atk: role.atk,
    def: role.def,
    aggroMult: role.aggroMult,
    alive: true,
    moving: false,
    targetX: def.x,
    targetY: def.y,
    px: def.x * TILE,
    py: def.y * TILE,
    role: def.role,
    color: role.color,
    label: role.label,
    anim: 0,
    // auto-AI
    autoTimer: Math.random() * 1.5,
    guarding: false,
    counterReady: false,
    justHit: false,
    behaviorState: 'standby', // standby | moving | engaging | guarding | countering | healing | down
    // sprite
    facing: 'down',
    anim: 0,
    animTimer: 0,
  };
}

function makeEnemy(x, y, tier) {
  return {
    x, y, px: x*TILE, py: y*TILE,
    hp: 40 + tier*20, maxHp: 40 + tier*20,
    atk: 10 + tier*5,
    alive: true,
    color: '#cc2200',
    label: 'ENM',
    think: 0,
    targetUnit: null,
    tier,
    anim: 0,
    animTimer: 0,
    facing: 'down',
    behaviorState: 'standby',
  };
}
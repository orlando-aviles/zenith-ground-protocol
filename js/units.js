const ROLES = {
  COMMANDO: { color: '#ff6b35', ap: 100, hpMult: 1.0, atk: 28, def: 0,   label: 'CMD', aggroMult: 1.0 },
  SENTINEL: { color: '#4a9eff', ap: 80,  hpMult: 1.4, atk: 12, def: 10,  label: 'SEN', aggroMult: 2.5 },
  MEDIC:    { color: '#00ff88', ap: 90,  hpMult: 0.8, atk: 8,  def: 0,   label: 'MED', aggroMult: 0.4 },
};

const UNIT_DEFS = [
  { name: 'KIRA',  role: 'COMMANDO', x: 10, y: 14 },
  { name: 'RESO',  role: 'SENTINEL', x: 9,  y: 15 },
  { name: 'VAEL',  role: 'MEDIC',    x: 11, y: 15 },
];

// ─── Recruit Pool ─────────────────────────────────────────────────────────────
const RECRUIT_POOL = [
  { name: 'DRAV', role: 'COMMANDO', bio: 'Aggressive striker. Engages on sight.' },
  { name: 'MAEL', role: 'COMMANDO', bio: 'Fast attacker. High damage output.' },
  { name: 'ORYN', role: 'SENTINEL', bio: 'Heavy guard. Draws fire, counters hard.' },
  { name: 'STEL', role: 'SENTINEL', bio: 'Defensive anchor. Absorbs punishment.' },
  { name: 'CAEL', role: 'MEDIC',    bio: 'Field medic. Keeps the squad alive.' },
  { name: 'WICK', role: 'MEDIC',    bio: 'Combat healer. Prioritizes critical wounds.' },
  { name: 'RHEN', role: 'COMMANDO', bio: 'Relentless pressure. Never stops firing.' },
  { name: 'TOVA', role: 'SENTINEL', bio: 'Iron wall. Built to outlast anything.' },
  { name: 'SURI', role: 'MEDIC',    bio: 'Rapid response. Closes distance fast.' },
];

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
  };
}
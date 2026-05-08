// ─── Constants ───────────────────────────────────────────────────────────────
const TILE = 32;
const MAP_W = 56, MAP_H = 42;
const FOG_RADIUS = 4.5; // tiles visible around each unit
const ENEMY_THINK_MS = 2200;
const AP_REGEN_MS = 1800;

// ─── State ───────────────────────────────────────────────────────────────────
let canvas, ctx, gc_w, gc_h;
let camera = { x: 0, y: 0, zoom: 1 };
const ZOOM_MIN = 0.4, ZOOM_MAX = 2.0;
let gameRunning = false;
let elapsed = 0, lastTick = 0;
let mapNumber = 1;
let mapCleared = false;       // all enemies dead
let extractionPoint = null;   // {x, y}
let extractConfirm = false;   // confirm prompt showing
let mapStats = { kills:0, damageTaken:0, startTime:0 };
let selectedUnits = new Set(); // multi-select
let selected = null;           // kept for sidebar compat — first in selection

// box-select drag state
let boxDrag = { active: false, sx:0, sy:0, ex:0, ey:0 };
let pendingCmd = null; // 'attack','heal','scout'
let enemies = [];
let projectiles = [];
let particles = [];
let fogGrid = []; // revealed tiles
let resources = { foundation: 100, flux: 60 };

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
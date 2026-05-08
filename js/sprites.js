// ─── Sprite System ────────────────────────────────────────────────────────────
// 16×16 pixel-art sprites for units and enemies.
// Each pixel is a key: A=armor, a=dark armor, H=highlight, V=visor,
// D=detail, W=weapon, S=shadow, .=transparent
// Sprites are pre-rendered to offscreen canvases and cached for performance.

const _ = '.', A = 'A', a = 'a', H = 'H', V = 'V', D = 'D', W = 'W', S = 'S';

// ─── Color palettes per role ──────────────────────────────────────────────────
const SPRITE_PALETTES = {
  COMMANDO: { armor: '#cc4400', visor: '#ffaa00', detail: '#ffdd88', weapon: '#888888' },
  SENTINEL: { armor: '#1a44bb', visor: '#00eeff', detail: '#ffaa00', weapon: '#999999' },
  MEDIC:    { armor: '#1a6622', visor: '#66ff33', detail: '#ffffff', weapon: '#aaaaaa' },
  ENEMY:    { armor: '#881111', visor: '#ff2200', detail: '#ff8800', weapon: '#666666' },
  ENEMY_2:  { armor: '#5e0e88', visor: '#ff44cc', detail: '#ffcc00', weapon: '#777777' },
  ENEMY_3:  { armor: '#444400', visor: '#ffff00', detail: '#ff6600', weapon: '#555555' },
};

// ─── Pixel helpers ────────────────────────────────────────────────────────────
function mirrorRow(r) { return [...r].reverse(); }
function mirrorGrid(g) { return g.map(mirrorRow); }

// ─── Head pixels ─────────────────────────────────────────────────────────────
const HEAD_DOWN = [
  [_,_,_,_,_,_,A,A,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,A,A,A,A,A,_,_,_,_,_,_],
  [_,_,_,_,A,H,A,A,A,A,a,_,_,_,_,_],
  [_,_,_,_,A,V,V,V,V,A,a,_,_,_,_,_],
  [_,_,_,_,A,A,D,D,A,A,a,_,_,_,_,_],
];
const HEAD_UP = [
  [_,_,_,_,_,_,A,A,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,A,A,A,A,A,_,_,_,_,_,_],
  [_,_,_,_,A,A,A,A,A,A,a,_,_,_,_,_],
  [_,_,_,_,A,a,a,a,a,A,a,_,_,_,_,_],
  [_,_,_,_,A,a,A,A,a,A,a,_,_,_,_,_],
];
const HEAD_LEFT = [
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,A,A,A,A,_,_,_,_,_,_,_,_],
  [_,_,_,A,H,A,A,A,a,_,_,_,_,_,_,_],
  [_,_,_,V,V,A,A,A,a,_,_,_,_,_,_,_],
  [_,_,_,A,A,D,A,A,a,_,_,_,_,_,_,_],
];
const HEAD_RIGHT = mirrorGrid(HEAD_LEFT);

// ─── Body pixels ─────────────────────────────────────────────────────────────
const BODY_DOWN = [
  [_,_,_,A,A,A,A,A,A,A,A,_,_,_,_,_],
  [_,_,_,A,H,A,A,A,A,A,a,_,_,_,_,_],
  [_,_,_,A,A,A,D,D,A,A,a,_,_,_,_,_],
  [_,_,_,A,A,A,A,A,A,A,a,_,_,_,_,_],
  [_,_,_,A,D,A,A,A,A,D,a,_,_,_,_,_],
];
const BODY_UP = [
  [_,_,_,A,A,A,A,A,A,A,A,_,_,_,_,_],
  [_,_,_,A,a,A,A,A,A,A,a,_,_,_,_,_],
  [_,_,_,A,A,a,A,A,a,A,a,_,_,_,_,_],
  [_,_,_,A,A,A,A,A,A,A,a,_,_,_,_,_],
  [_,_,_,A,D,A,A,A,A,D,a,_,_,_,_,_],
];
const BODY_LEFT = [
  [_,_,A,A,A,A,A,_,_,_,_,_,_,_,_,_],
  [_,_,A,H,A,A,A,a,_,_,_,_,_,_,_,_],
  [_,_,A,A,D,A,A,a,_,_,_,_,_,_,_,_],
  [_,_,A,A,A,A,A,a,_,_,_,_,_,_,_,_],
  [_,_,A,D,A,A,A,a,_,_,_,_,_,_,_,_],
];
const BODY_RIGHT = mirrorGrid(BODY_LEFT);

// ─── Leg animations ───────────────────────────────────────────────────────────
function legsIdle(dir) {
  if (dir === 'down' || dir === 'up') return [
    [_,_,_,A,A,_,_,A,A,_,_,_,_,_,_,_],
    [_,_,_,A,A,_,_,A,A,_,_,_,_,_,_,_],
    [_,_,_,A,A,_,_,A,A,_,_,_,_,_,_,_],
    [_,_,A,A,A,_,_,A,A,A,_,_,_,_,_,_],
    [_,_,A,A,_,_,_,_,A,A,_,_,_,_,_,_],
  ];
  const side = [
    [_,_,_,A,A,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,A,A,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,A,A,A,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,A,A,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,A,A,A,_,_,_,_,_,_,_,_,_,_,_,_],
  ];
  return dir === 'left' ? side : mirrorGrid(side);
}

function legsWalk(dir, frame) {
  const f = frame % 4;
  if (dir === 'down' || dir === 'up') {
    const phases = [
      [[_,_,_,A,A,_,_,A,A,_,_,_,_,_,_,_],[_,_,A,A,_,_,_,A,A,_,_,_,_,_,_,_],[_,_,A,A,_,_,_,_,A,A,_,_,_,_,_,_],[_,A,A,_,_,_,_,_,A,A,_,_,_,_,_,_],[_,A,A,_,_,_,_,_,_,A,A,_,_,_,_,_]],
      [[_,_,_,A,A,A,A,A,A,_,_,_,_,_,_,_],[_,_,_,A,A,_,_,A,A,_,_,_,_,_,_,_],[_,_,_,A,A,_,_,A,A,_,_,_,_,_,_,_],[_,_,_,_,A,A,A,A,_,_,_,_,_,_,_,_],[_,_,_,_,A,A,A,A,_,_,_,_,_,_,_,_]],
      [[_,_,_,A,A,_,_,A,A,_,_,_,_,_,_,_],[_,_,_,A,A,_,_,_,A,A,_,_,_,_,_,_],[_,_,_,A,A,_,_,_,A,A,_,_,_,_,_,_],[_,_,_,A,A,_,_,_,_,A,A,_,_,_,_,_],[_,_,A,A,_,_,_,_,_,_,A,A,_,_,_,_]],
      [[_,_,_,A,A,A,A,A,A,_,_,_,_,_,_,_],[_,_,_,_,A,A,_,A,A,_,_,_,_,_,_,_],[_,_,_,_,A,A,_,A,A,_,_,_,_,_,_,_],[_,_,_,A,A,_,_,A,A,_,_,_,_,_,_,_],[_,_,A,A,_,_,_,_,A,A,_,_,_,_,_,_]],
    ];
    return phases[f];
  }
  const sidePhases = [
    [[_,_,A,A,_,_,_,_,_,_,_,_,_,_,_,_],[_,A,A,_,_,_,_,_,_,_,_,_,_,_,_,_],[_,_,A,A,_,_,_,_,_,_,_,_,_,_,_,_],[_,_,A,A,_,_,_,_,_,_,_,_,_,_,_,_],[_,A,A,_,_,_,_,_,_,_,_,_,_,_,_,_]],
    [[_,_,_,A,A,_,_,_,_,_,_,_,_,_,_,_],[_,_,_,A,A,_,_,_,_,_,_,_,_,_,_,_],[_,_,A,A,A,_,_,_,_,_,_,_,_,_,_,_],[_,_,A,A,_,_,_,_,_,_,_,_,_,_,_,_],[_,A,A,_,_,_,_,_,_,_,_,_,_,_,_,_]],
    [[_,_,A,A,_,_,_,_,_,_,_,_,_,_,_,_],[_,_,_,A,A,_,_,_,_,_,_,_,_,_,_,_],[_,_,_,A,A,_,_,_,_,_,_,_,_,_,_,_],[_,_,A,A,_,_,_,_,_,_,_,_,_,_,_,_],[_,A,A,A,_,_,_,_,_,_,_,_,_,_,_,_]],
    [[_,_,_,A,A,_,_,_,_,_,_,_,_,_,_,_],[_,_,A,A,_,_,_,_,_,_,_,_,_,_,_,_],[_,_,A,A,_,_,_,_,_,_,_,_,_,_,_,_],[_,_,_,A,A,_,_,_,_,_,_,_,_,_,_,_],[_,_,_,A,A,_,_,_,_,_,_,_,_,_,_,_]],
  ];
  const res = sidePhases[f];
  return dir === 'left' ? res : mirrorGrid(res);
}

function footRow(dir) {
  if (dir === 'down' || dir === 'up') return [_,_,A,A,A,_,_,_,A,A,A,_,_,_,_,_];
  const side = [_,_,A,A,A,_,_,_,_,_,_,_,_,_,_,_];
  return dir === 'left' ? side : mirrorRow(side);
}

// ─── Death frames (direction-agnostic) ───────────────────────────────────────
function buildDeath(frame) {
  if (frame === 0) return [
    ...HEAD_DOWN, ...BODY_DOWN,
    [_,_,_,A,A,_,_,_,A,A,_,_,_,_,_,_],
    [_,_,_,A,A,_,_,_,_,A,_,_,_,_,_,_],
    [_,_,_,_,A,A,_,_,_,A,_,_,_,_,_,_],
    [_,_,_,_,A,A,_,_,A,_,_,_,_,_,_,_],
    [_,_,_,_,_,A,A,A,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  ].slice(0, 16);
  if (frame === 1) return [
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,A,A,A,A,A,_,_,_,_,_,_],
    [_,_,_,_,A,H,A,A,A,A,a,_,_,_,_,_],
    [_,_,_,_,A,V,V,V,V,A,a,_,_,_,_,_],
    [_,_,_,A,A,A,A,A,A,A,A,_,_,_,_,_],
    [_,_,_,A,H,A,A,A,A,A,a,_,_,_,_,_],
    [_,_,_,A,A,A,D,D,A,A,a,_,_,_,_,_],
    [_,_,_,A,A,A,A,A,A,A,a,_,_,_,_,_],
    [_,_,A,A,D,A,A,A,A,D,A,A,_,_,_,_],
    [_,_,A,A,_,_,_,_,A,A,_,_,_,_,_,_],
    [_,A,A,_,_,_,_,_,A,A,_,_,_,_,_,_],
    [_,A,A,_,_,_,_,_,_,A,A,_,_,_,_,_],
    [A,A,_,_,_,_,_,_,_,_,A,A,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  ];
  if (frame === 2) return [
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [A,A,A,A,A,A,A,A,A,A,A,A,A,_,_,_],
    [A,V,V,A,A,A,A,A,A,A,A,A,A,_,_,_],
    [A,A,A,A,D,A,A,A,A,A,A,A,A,_,_,_],
    [A,A,A,A,A,A,A,A,A,A,A,A,A,_,_,_],
    [S,S,S,S,S,S,S,S,S,S,S,S,S,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  ];
  return [
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [A,A,A,A,A,A,A,A,A,A,A,A,A,A,_,_],
    [A,V,V,A,A,A,A,A,A,A,A,A,A,A,_,_],
    [A,A,A,A,D,A,A,A,A,A,A,A,A,A,_,_],
    [A,A,A,A,A,A,A,A,A,A,A,A,A,A,_,_],
    [S,S,S,S,S,S,S,S,S,S,S,S,S,S,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  ];
}

// ─── Main sprite builder ──────────────────────────────────────────────────────
function buildSprite(anim, dir, frame) {
  if (anim === 'die') return buildDeath(frame);

  let head, body;
  switch (dir) {
    case 'down':  head = HEAD_DOWN;  body = BODY_DOWN;  break;
    case 'up':    head = HEAD_UP;    body = BODY_UP;    break;
    case 'left':  head = HEAD_LEFT;  body = BODY_LEFT;  break;
    case 'right': head = HEAD_RIGHT; body = BODY_RIGHT; break;
  }

  const legs = (anim === 'walk') ? legsWalk(dir, frame) : legsIdle(dir);
  const foot = footRow(dir);
  const grid = [...head, ...body, ...legs, foot];

  // shoot weapon overlay
  if (anim === 'shoot') {
    const f2 = frame % 2;
    if (dir === 'down' || dir === 'up') {
      const ov = f2 === 0 ? [W,W,W,W,W,_,_,_] : [_,W,W,W,W,_,_,_];
      for (let c = 0; c < ov.length; c++) if (ov[c] !== _) grid[6][8+c] = ov[c];
    } else if (dir === 'right') {
      const ov = f2 === 0 ? [W,W,W,W,W,W,_,_] : [_,W,W,W,W,_,_,_];
      for (let c = 0; c < ov.length; c++) if (ov[c] !== _) grid[6][8+c] = ov[c];
    } else {
      const ov = f2 === 0 ? [_,_,W,W,W,W,W,W] : [_,_,_,W,W,W,W,_];
      for (let c = 0; c < ov.length; c++) if (ov[c] !== _) grid[6][c] = ov[c];
    }
  }

  return grid;
}

// ─── Color resolution ─────────────────────────────────────────────────────────
function hexToRgb(h) {
  return { r: parseInt(h.slice(1,3),16), g: parseInt(h.slice(3,5),16), b: parseInt(h.slice(5,7),16) };
}
function lighten(h, amt=40) {
  const {r,g,b} = hexToRgb(h);
  return `rgb(${Math.min(255,r+amt)},${Math.min(255,g+amt)},${Math.min(255,b+amt)})`;
}
function darken(h, amt=40) {
  const {r,g,b} = hexToRgb(h);
  return `rgb(${Math.max(0,r-amt)},${Math.max(0,g-amt)},${Math.max(0,b-amt)})`;
}
function getColorMap(palette) {
  return {
    A: palette.armor,
    a: darken(palette.armor, 35),
    H: lighten(palette.armor, 45),
    V: palette.visor,
    D: palette.detail,
    W: palette.weapon,
    S: 'rgba(0,0,0,0.28)',
  };
}

// ─── Offscreen cache ──────────────────────────────────────────────────────────
// Key: `${paletteName}:${anim}:${dir}:${frame}`
const _spriteCache = new Map();

// SPRITE_PX: how many canvas pixels per sprite pixel.
// Sprites are 16×16. TILE is 32, so 2px per sprite pixel fills the tile exactly.
const SPRITE_PX = 2;
const SPRITE_SIZE = 16; // pixels in the grid

function _renderToOffscreen(grid, palette) {
  const sz = SPRITE_SIZE * SPRITE_PX;
  const oc = document.createElement('canvas');
  oc.width = sz;
  oc.height = sz;
  const octx = oc.getContext('2d');
  const cm = getColorMap(palette);
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const k = grid[r][c];
      if (k === '.') continue;
      octx.fillStyle = cm[k] || '#ff00ff';
      octx.fillRect(c * SPRITE_PX, r * SPRITE_PX, SPRITE_PX, SPRITE_PX);
    }
  }
  return oc;
}

function getSprite(paletteName, anim, dir, frame) {
  const key = `${paletteName}:${anim}:${dir}:${frame}`;
  if (_spriteCache.has(key)) return _spriteCache.get(key);
  const palette = SPRITE_PALETTES[paletteName];
  const grid = buildSprite(anim, dir, frame);
  const oc = _renderToOffscreen(grid, palette);
  _spriteCache.set(key, oc);
  return oc;
}

// Warm up the cache for all unit roles at startup so first frames are instant
function warmSpriteCache() {
  const ANIMS = ['idle', 'walk', 'shoot', 'die'];
  const DIRS  = ['down', 'up', 'left', 'right'];
  const PALETTES = Object.keys(SPRITE_PALETTES);
  ANIMS.forEach(anim => {
    DIRS.forEach(dir => {
      for (let f = 0; f < 4; f++) {
        PALETTES.forEach(p => getSprite(p, anim, dir, f));
      }
    });
  });
}

// ─── Direction from movement ──────────────────────────────────────────────────
// Returns 'down' | 'up' | 'left' | 'right' from a dx/dy vector.
// Falls back to the entity's stored facing if no movement.
function vecToDir(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  }
  return dy > 0 ? 'down' : 'up';
}

// ─── Anim state from behaviorState ───────────────────────────────────────────
function behaviorToAnim(behaviorState) {
  switch (behaviorState) {
    case 'moving':    return 'walk';
    case 'engaging':  return 'shoot';
    case 'countering':return 'shoot';
    case 'down':      return 'die';
    default:          return 'idle'; // standby, guarding, healing
  }
}

// ─── Palette name from role ───────────────────────────────────────────────────
function roleToPalette(role, tier) {
  if (role === 'ENEMY') {
    if (tier >= 3) return 'ENEMY_3';
    if (tier >= 2) return 'ENEMY_2';
    return 'ENEMY';
  }
  return role; // COMMANDO, SENTINEL, MEDIC
}

// ─── Main draw call ───────────────────────────────────────────────────────────
// entity: any unit or enemy object
// paletteName: from roleToPalette()
// cx, cy: canvas center coords (world-space, camera-adjusted)
function drawSpriteEntity(entity, paletteName, cx, cy) {
  const anim  = behaviorToAnim(entity.behaviorState || 'standby');
  const frame = Math.floor(entity.anim || 0) % 4;
  const dir   = entity.facing || 'down';

  const sprite = getSprite(paletteName, anim, dir, frame);

  // Draw centered on cx, cy — sprite is SPRITE_SIZE*SPRITE_PX wide/tall
  const half = (SPRITE_SIZE * SPRITE_PX) / 2;

  // Bob on idle (frame 0,2 = up slightly, 1,3 = normal)
  const bob = (anim === 'idle' && frame % 2 === 0) ? -1 : 0;

  ctx.drawImage(sprite, cx - half, cy - half + bob);
}

// ─── Map ─────────────────────────────────────────────────────────────────────
let tileMap = [];
let rooms = [];
let mapType = 'interior';

function generateMap(mapNum) {
  tileMap = [];
  fogGrid = [];
  rooms = [];
  mapCleared = false;
  extractionPoint = null;
  extractConfirm = false;
  mapType = Math.random() < 0.5 ? 'interior' : 'outdoor';

  for (let y = 0; y < MAP_H; y++) {
    tileMap[y] = [];
    fogGrid[y] = [];
    for (let x = 0; x < MAP_W; x++) {
      tileMap[y][x] = mapType === 'interior' ? 2 : 0;
      fogGrid[y][x] = false;
    }
  }

  if (mapType === 'interior') generateInterior(mapNum);
  else generateOutdoor(mapNum);

  placeContent(mapNum);
}

// ── Interior: room-and-corridor dungeon ────────────────────────────────────────
function generateInterior(mapNum) {
  const MIN_ROOM = 5, MAX_ROOM = 11;
  const MAX_ROOMS = 12 + mapNum;

  function carveRoom(rx, ry, rw, rh) {
    for (let y=ry; y<ry+rh; y++)
      for (let x=rx; x<rx+rw; x++)
        if (y>0&&y<MAP_H-1&&x>0&&x<MAP_W-1) tileMap[y][x] = 0;
  }

  function roomsOverlap(a, b, pad=2) {
    return !(a.x+a.w+pad<=b.x || b.x+b.w+pad<=a.x ||
             a.y+a.h+pad<=b.y || b.y+b.h+pad<=a.y);
  }

  for (let i=0; i<MAX_ROOMS*8 && rooms.length<MAX_ROOMS; i++) {
    const rw = randInt(MIN_ROOM, MAX_ROOM);
    const rh = randInt(MIN_ROOM, MAX_ROOM);
    const rx = randInt(1, MAP_W-rw-1);
    const ry = randInt(1, MAP_H-rh-1);
    const c = {x:rx,y:ry,w:rw,h:rh,cx:rx+Math.floor(rw/2),cy:ry+Math.floor(rh/2)};
    if (rooms.every(r=>!roomsOverlap(r,c))) {
      rooms.push(c);
      carveRoom(rx,ry,rw,rh);
    }
  }

  // connect rooms — no rubble in corridors for interior
  const connected = new Set([0]);
  while (connected.size < rooms.length) {
    let bestDist=Infinity, bestFrom=-1, bestTo=-1;
    connected.forEach(fi => {
      rooms.forEach((r,ti) => {
        if (connected.has(ti)) return;
        const d = Math.abs(rooms[fi].cx-r.cx)+Math.abs(rooms[fi].cy-r.cy);
        if (d<bestDist) { bestDist=d; bestFrom=fi; bestTo=ti; }
      });
    });
    if (bestTo===-1) break;
    carveCorridor(rooms[bestFrom].cx, rooms[bestFrom].cy, rooms[bestTo].cx, rooms[bestTo].cy);
    connected.add(bestTo);
  }
}

// ── Outdoor: open terrain with natural obstacle clusters ──────────────────────
function generateOutdoor(mapNum) {
  // border walls only
  for (let y=0;y<MAP_H;y++)
    for (let x=0;x<MAP_W;x++)
      if (x===0||y===0||x===MAP_W-1||y===MAP_H-1) tileMap[y][x]=2;

  // organic obstacle clusters — groups of rubble tiles forming natural cover
  const clusterCount = 8 + mapNum * 2;
  for (let c=0; c<clusterCount; c++) {
    const cx = randInt(4, MAP_W-5);
    const cy = randInt(4, MAP_H-5);
    const size = randInt(3, 7);
    // grow cluster organically from center
    const cluster = [{x:cx,y:cy}];
    for (let s=0; s<size*3; s++) {
      const base = cluster[randInt(0,cluster.length-1)];
      const dirs = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]];
      const [dx,dy] = dirs[randInt(0,dirs.length-1)];
      const nx=base.x+dx, ny=base.y+dy;
      if (nx>1&&ny>1&&nx<MAP_W-2&&ny<MAP_H-2) {
        cluster.push({x:nx,y:ny});
        tileMap[ny][nx]=1;
      }
    }
  }

  // create open rooms list for content placement (just virtual zones)
  const zoneCount = 8;
  for (let z=0; z<zoneCount; z++) {
    const cx = randInt(4, MAP_W-5);
    const cy = randInt(4, MAP_H-5);
    // only add if center is walkable
    if (tileMap[cy][cx]===0)
      rooms.push({x:cx-2,y:cy-2,w:4,h:4,cx,cy});
  }
}

// ── Shared corridor carver ─────────────────────────────────────────────────────
function carveCorridor(x1,y1,x2,y2) {
  if (Math.random()<0.5) {
    for (let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++)
      if (tileMap[y1]?.[x]!==undefined) tileMap[y1][x]=0;
    for (let y=Math.min(y1,y2);y<=Math.max(y1,y2);y++)
      if (tileMap[y]?.[x2]!==undefined) tileMap[y][x2]=0;
  } else {
    for (let y=Math.min(y1,y2);y<=Math.max(y1,y2);y++)
      if (tileMap[y]?.[x1]!==undefined) tileMap[y][x1]=0;
    for (let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++)
      if (tileMap[y2]?.[x]!==undefined) tileMap[y2][x]=0;
  }
}

// ── Place squad, enemies, extraction ──────────────────────────────────────────
function placeContent(mapNum) {
  // sort rooms by distance from bottom-left
  if (rooms.length === 0) {
    rooms.push({x:2,y:MAP_H-6,w:4,h:4,cx:4,cy:MAP_H-4});
    rooms.push({x:MAP_W-6,y:2,w:4,h:4,cx:MAP_W-4,cy:4});
  }

  rooms.sort((a,b) => {
    const da = (MAP_H-a.cy) - a.cx; // closer to bottom-left = higher score
    const db = (MAP_H-b.cy) - b.cx;
    return db-da;
  });

  const spawnRoom   = rooms[0];
  const extractRoom = rooms[rooms.length-1];

  // place squad
  const spawnOffsets = [
    {dx:0,dy:0},{dx:-1,dy:0},{dx:1,dy:0},
    {dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:-1},
    {dx:1,dy:-1},{dx:-1,dy:1},{dx:1,dy:1}
  ];
  units.forEach((u,i) => {
    const off = spawnOffsets[i % spawnOffsets.length];
    let tx=spawnRoom.cx+off.dx, ty=spawnRoom.cy+off.dy;
    if (!isWalkable(tx,ty)) { tx=spawnRoom.cx; ty=spawnRoom.cy; }
    u.x=tx; u.y=ty; u.px=tx*TILE; u.py=ty*TILE;
    u.targetX=tx; u.targetY=ty; u.moving=false; u._path=[];
  });

  extractionPoint = { x: extractRoom.cx, y: extractRoom.cy };

  // place enemies in non-spawn rooms
  enemies = [];
  const tier = Math.max(0, Math.floor((mapNum-1)/2));
  const enemyRooms = rooms.slice(1);
  enemyRooms.forEach((room, ri) => {
    const isExtractRoom = ri === enemyRooms.length-1;
    const count = isExtractRoom ? 2 : randInt(1, Math.min(2+Math.floor(mapNum/3), 3));
    for (let e=0; e<count; e++) {
      const ex = randInt(room.x+1, room.x+room.w-2);
      const ey = randInt(room.y+1, room.y+room.h-2);
      if (isWalkable(ex,ey)) {
        enemies.push(makeEnemy(ex, ey, tier + (isExtractRoom?1:0)));
      }
    }
  });
}

function isWalkable(x, y) {
  if (x<0||y<0||x>=MAP_W||y>=MAP_H) return false;
  return tileMap[y][x] === 0;
}
// ─── Fog of War ───────────────────────────────────────────────────────────────
function updateFog() {
  units.forEach(u => {
    if (!u.alive) return;
    const ux = Math.round(u.px/TILE), uy = Math.round(u.py/TILE);
    for (let dy=-Math.ceil(FOG_RADIUS);dy<=Math.ceil(FOG_RADIUS);dy++) {
      for (let dx=-Math.ceil(FOG_RADIUS);dx<=Math.ceil(FOG_RADIUS);dx++) {
        if (dx*dx+dy*dy <= FOG_RADIUS*FOG_RADIUS) {
          const fx=ux+dx, fy=uy+dy;
          if (fy>=0&&fy<MAP_H&&fx>=0&&fx<MAP_W) fogGrid[fy][fx]=true;
        }
      }
    }
  });
}

function isFogVisible(x,y) {
  if (x<0||y<0||x>=MAP_W||y>=MAP_H) return false;
  return fogGrid[y][x];
}

function isCurrentlyVisible(px, py) {
  // check if within current vision radius of any alive unit
  const tx = px/TILE, ty = py/TILE;
  return units.some(u => {
    if (!u.alive) return false;
    const ux=u.px/TILE, uy=u.py/TILE;
    const d=(tx-ux)*(tx-ux)+(ty-uy)*(ty-uy);
    return d <= FOG_RADIUS*FOG_RADIUS;
  });
}
// ─── Pathfinding (simple BFS) ─────────────────────────────────────────────────
function bfs(sx,sy,ex,ey) {
  if (!isWalkable(ex,ey)) return null;
  const visited = new Set();
  const queue = [{x:sx,y:sy,path:[]}];
  visited.add(`${sx},${sy}`);
  const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
  while (queue.length) {
    const {x,y,path} = queue.shift();
    if (x===ex&&y===ey) return path.concat({x,y});
    for (const [dx,dy] of dirs) {
      const nx=x+dx,ny=y+dy;
      const key=`${nx},${ny}`;
      if (!visited.has(key)&&isWalkable(nx,ny)) {
        visited.add(key);
        queue.push({x:nx,y:ny,path:path.concat({x,y})});
      }
    }
  }
  return null;
}

// ─── Movement ─────────────────────────────────────────────────────────────────
function moveUnitToward(unit, dt) {
  if (!unit.moving) return;
  const destPx = unit.targetX * TILE;
  const destPy = unit.targetY * TILE;
  const spd = 120; // px per second
  const dx = destPx - unit.px;
  const dy = destPy - unit.py;
  const dist = Math.sqrt(dx*dx+dy*dy);
  if (dist < 2) {
    unit.px = destPx; unit.py = destPy;
    if (unit._path && unit._path.length > 0) {
      const next = unit._path.shift();
      unit.targetX = next.x; unit.targetY = next.y;
    } else {
      unit.moving = false;
      unit.x = unit.targetX; unit.y = unit.targetY;
    }
  } else {
    unit.px += (dx/dist)*spd*dt;
    unit.py += (dy/dist)*spd*dt;
  }
}
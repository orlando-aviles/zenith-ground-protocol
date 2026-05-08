// ─── Canvas Input ─────────────────────────────────────────────────────────────
function worldCoords(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    mx: (e.clientX - rect.left) / camera.zoom + camera.x,
    my: (e.clientY - rect.top)  / camera.zoom + camera.y,
  };
}

window.addEventListener('load', ()=>{
  canvas = document.getElementById('gc');
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', ()=>{ resize(); });

  // ── Canvas input (must be after canvas is assigned) ──
  // ── Mouse: left click/drag = select/move/box, right drag = pan, wheel = zoom
  let rightDrag = { active:false, startX:0, startY:0, camX:0, camY:0 };

  canvas.addEventListener('mousedown', e => {
    if (!gameRunning) return;
    e.preventDefault();
    if (e.button === 0) {
      const {mx,my} = worldCoords(e);
      boxDrag = { active:true, sx:mx, sy:my, ex:mx, ey:my };
    }
    if (e.button === 2) {
      rightDrag = { active:true, startX:e.clientX, startY:e.clientY, camX:camera.x, camY:camera.y };
    }
  });

  canvas.addEventListener('mousemove', e => {
    if (rightDrag.active) {
      camera.x = rightDrag.camX - (e.clientX - rightDrag.startX) / camera.zoom;
      camera.y = rightDrag.camY - (e.clientY - rightDrag.startY) / camera.zoom;
      clampCamera();
      return;
    }
    if (!boxDrag.active) return;
    const {mx,my} = worldCoords(e);
    boxDrag.ex = mx; boxDrag.ey = my;
  });

  canvas.addEventListener('mouseup', e => {
    if (e.button === 2) { rightDrag.active = false; return; }
    if (!gameRunning || e.button !== 0) return;
    if (!boxDrag.active) return;

    const {mx,my} = worldCoords(e);
    boxDrag.ex = mx; boxDrag.ey = my;
    boxDrag.active = false;

    const dragDist = Math.abs(boxDrag.ex-boxDrag.sx)+Math.abs(boxDrag.ey-boxDrag.sy);

    if (dragDist < 6) {
      const tx=Math.floor(mx/TILE), ty=Math.floor(my/TILE);
      const hitUnit = units.find(u =>
        u.alive &&
        Math.abs(u.px+TILE/2-mx) < TILE*0.7 &&
        Math.abs(u.py+TILE/2-my) < TILE*0.7
      );
      if (hitUnit) { setSelection([hitUnit]); centerCamera(); }
      else if (selectedUnits.size>0 && isWalkable(tx,ty)) moveGroupTo(tx,ty);
    } else {
      const x1=Math.min(boxDrag.sx,boxDrag.ex), x2=Math.max(boxDrag.sx,boxDrag.ex);
      const y1=Math.min(boxDrag.sy,boxDrag.ey), y2=Math.max(boxDrag.sy,boxDrag.ey);
      const inside = units.filter(u=>{
        if (!u.alive) return false;
        const ux=u.px+TILE/2, uy=u.py+TILE/2;
        return ux>=x1&&ux<=x2&&uy>=y1&&uy<=y2;
      });
      if (inside.length>0) {
        setSelection(inside.slice(0,9));
        if (inside.length>1) addLog(`${Math.min(inside.length,9)} units selected`,'info');
      }
    }
  });

  // Scroll wheel zoom — zoom toward cursor
  canvas.addEventListener('wheel', e => {
    if (!gameRunning) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    // world point under cursor before zoom
    const wx = cx/camera.zoom + camera.x;
    const wy = cy/camera.zoom + camera.y;
    // apply zoom
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    camera.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, camera.zoom * factor));
    // adjust camera so world point stays under cursor
    camera.x = wx - cx/camera.zoom;
    camera.y = wy - cy/camera.zoom;
    clampCamera();
  }, { passive:false });

  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // ── Touch: one finger = tap/drag-select, two fingers = pan + pinch zoom ──
  let touchStartX=0, touchStartY=0, touchMoved=false;
  let pinchStartDist=0, pinchStartZoom=1, pinchMidX=0, pinchMidY=0, pinchCamX=0, pinchCamY=0;
  let isPinching=false;

  function touchWorldCoords(touch) {
    const rect = canvas.getBoundingClientRect();
    return {
      mx: (touch.clientX - rect.left) / camera.zoom + camera.x,
      my: (touch.clientY - rect.top)  / camera.zoom + camera.y,
    };
  }

  function pinchDist(t1,t2) {
    return Math.hypot(t1.clientX-t2.clientX, t1.clientY-t2.clientY);
  }

  canvas.addEventListener('touchstart', e => {
    if (!gameRunning) return;
    e.preventDefault();

    if (e.touches.length === 2) {
      // start pinch
      isPinching = true;
      boxDrag.active = false;
      pinchStartDist = pinchDist(e.touches[0], e.touches[1]);
      pinchStartZoom = camera.zoom;
      const rect = canvas.getBoundingClientRect();
      pinchMidX = (e.touches[0].clientX + e.touches[1].clientX)/2 - rect.left;
      pinchMidY = (e.touches[0].clientY + e.touches[1].clientY)/2 - rect.top;
      pinchCamX = camera.x;
      pinchCamY = camera.y;
      return;
    }

    isPinching = false;
    const {mx,my} = touchWorldCoords(e.touches[0]);
    touchStartX=mx; touchStartY=my; touchMoved=false;
    boxDrag = { active:true, sx:mx, sy:my, ex:mx, ey:my };
  }, { passive:false });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();

    if (e.touches.length === 2) {
      boxDrag.active = false;
      const rect = canvas.getBoundingClientRect();
      const d = pinchDist(e.touches[0], e.touches[1]);
      const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, pinchStartZoom * (d/pinchStartDist)));

      // mid point of two fingers
      const midX = (e.touches[0].clientX + e.touches[1].clientX)/2 - rect.left;
      const midY = (e.touches[0].clientY + e.touches[1].clientY)/2 - rect.top;

      // zoom toward pinch midpoint
      const wx = pinchMidX/pinchStartZoom + pinchCamX;
      const wy = pinchMidY/pinchStartZoom + pinchCamY;
      camera.zoom = newZoom;
      camera.x = wx - midX/camera.zoom;
      camera.y = wy - midY/camera.zoom;

      // also pan with two-finger movement
      camera.x += (pinchMidX - midX) / camera.zoom;
      camera.y += (pinchMidY - midY) / camera.zoom;
      pinchMidX = midX; pinchMidY = midY;
      pinchCamX = camera.x; pinchCamY = camera.y;
      pinchStartDist = d;
      pinchStartZoom = camera.zoom;

      clampCamera();
      return;
    }

    if (isPinching) return;
    const {mx,my} = touchWorldCoords(e.touches[0]);
    boxDrag.ex=mx; boxDrag.ey=my;
    if (Math.abs(mx-touchStartX)+Math.abs(my-touchStartY)>8) touchMoved=true;
  }, { passive:false });

  canvas.addEventListener('touchend', e => {
    if (!gameRunning) return;
    e.preventDefault();
    if (isPinching && e.touches.length < 2) { isPinching=false; return; }
    boxDrag.active=false;

    const mx=boxDrag.ex, my=boxDrag.ey;
    const tx=Math.floor(mx/TILE), ty=Math.floor(my/TILE);

    if (!touchMoved) {
      const hitUnit = units.find(u=>
        u.alive&&Math.abs(u.px+TILE/2-mx)<TILE*0.9&&Math.abs(u.py+TILE/2-my)<TILE*0.9
      );
      if (hitUnit) { setSelection([hitUnit]); centerCamera(); }
      else if (selectedUnits.size>0&&isWalkable(tx,ty)) moveGroupTo(tx,ty);
    } else {
      const x1=Math.min(boxDrag.sx,mx),x2=Math.max(boxDrag.sx,mx);
      const y1=Math.min(boxDrag.sy,my),y2=Math.max(boxDrag.sy,my);
      if (Math.abs(x2-x1)+Math.abs(y2-y1)>20) {
        const inside=units.filter(u=>{
          if(!u.alive)return false;
          return u.px+TILE/2>=x1&&u.px+TILE/2<=x2&&u.py+TILE/2>=y1&&u.py+TILE/2<=y2;
        });
        if(inside.length>0){
          setSelection(inside.slice(0,9));
          if(inside.length>1)addLog(`${Math.min(inside.length,9)} units selected`,'info');
        }
      }
    }
  }, { passive:false });

  // ── Mobile minimap init ──────────────────────────────────────────────────
  const mmMob = document.getElementById('minimapCanvasMob');
  if (mmMob) {
    mmMob.width  = 128;
    mmMob.height = Math.round(128 * MAP_H/MAP_W);
    mmMob.style.width  = '100%';
    mmMob.style.height = 'auto';
    window._mmMobCtx = mmMob.getContext('2d');
  }

  // WASD camera pan (desktop)
  const keys = {};
  window.addEventListener('keydown',e=>{ keys[e.key]=true; });
  window.addEventListener('keyup',  e=>{ delete keys[e.key]; });
  setInterval(()=>{
    if(!gameRunning)return;
    const spd = 8/camera.zoom;
    if(keys['w']||keys['ArrowUp'])    camera.y-=spd;
    if(keys['s']||keys['ArrowDown'])  camera.y+=spd;
    if(keys['a']||keys['ArrowLeft'])  camera.x-=spd;
    if(keys['d']||keys['ArrowRight']) camera.x+=spd;
    if(keys['+']||keys['=']) camera.zoom=Math.min(ZOOM_MAX,camera.zoom*1.05);
    if(keys['-'])            camera.zoom=Math.max(ZOOM_MIN,camera.zoom*0.95);
    clampCamera();
  },16);
});
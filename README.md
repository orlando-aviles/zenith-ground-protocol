# ZENITH — Ground Protocol
### A real-time tactics prototype · Part of the Veldara Franchise

---

## What It Is

Ground Protocol is the foundational gameplay prototype for **Zenith**, a dystopian real-time strategy game set in the Veldara universe. Foundation is the last nation standing. The world heart is dying. You command a small squad of survivors navigating collapsing infrastructure, hostile remnants, and the creeping unknown.

This prototype establishes the ground-level loop that will eventually scale up to paradigm-shifting mecha combat at a cosmic level.

---

## Current Features

### Core Loop
- Procedurally generated maps — **interior facility** (room-and-corridor) or **outdoor sector** (organic terrain) chosen randomly each run
- Fog of war with persistent reveal — explored areas stay visible on the minimap
- Clear all hostiles → extraction point activates → extract to advance
- Extraction requires deliberate confirmation — no accidental exits
- Results screen with stats, then recruitment before the next map

### Squad System
- Three starting units: **KIRA** (Commando), **RESO** (Sentinel), **VAEL** (Medic)
- Roster expands up to 9 units through between-map recruitment
- Units act autonomously based on role — player controls positioning only
- Box-select any number of units, click map to move as a group
- Split and reform freely — send two units one way, leave one holding

### Role Behaviors
| Role | Behavior |
|------|----------|
| **COMMANDO** | Engages nearest visible enemy automatically on sight |
| **SENTINEL** | High aggro — draws enemy fire, reduces incoming damage, counters after being hit |
| **MEDIC** | Scans allies continuously, moves to and heals lowest HP ally below threshold |

### Enemy AI
- Threat table system — enemies target by aggro weight, not just proximity
- Sentinel naturally draws fire due to high aggro multiplier
- Enemies patrol and path toward detected units in real time

### Progression
- Map difficulty scales per run — more enemies, higher tiers, denser terrain
- Foundation and Flux resources accumulate from eliminations
- Recruit screen offers two random candidates after each map
- Partial squad heal between maps — attrition carries forward

### UI
- Live behavior state badges per unit (STANDBY / MOVING / ENGAGING / GUARDING / COUNTERING / HEALING / DOWN)
- Roster pip row for quick selection of full squad
- Full stat cards shown only for selected units
- Minimap with fog state, enemy positions, extraction beacon, and viewport indicator

### Controls

**Desktop**
| Input | Action |
|-------|--------|
| Left click unit | Select |
| Left click map | Move selected |
| Left drag | Box-select |
| Right drag | Pan camera |
| Scroll wheel | Zoom in/out |
| WASD / Arrow keys | Pan camera |
| `+` / `-` | Zoom |

**Mobile**
| Input | Action |
|-------|--------|
| Tap unit | Select |
| Tap map | Move selected |
| One-finger drag | Box-select |
| Two-finger pinch | Zoom |
| Two-finger pan | Move camera |

---

## Project Structure

Currently a single HTML file (`zenith_ground.html`) containing all HTML, CSS, and JavaScript. Planned split into modular files:

```
zenith/
  index.html
  css/
    style.css
  js/
    constants.js      — TILE, MAP dimensions, role definitions
    map.js            — Procedural generation, fog of war, pathfinding
    units.js          — Unit creation, auto-AI, drawing
    enemies.js        — Enemy creation, AI, threat tables
    combat.js         — Damage, projectiles, particles
    ui.js             — Sidebar, minimap, unit cards, mobile panel
    input.js          — Mouse, keyboard, touch, zoom
    loop.js           — Game loop, map transitions, results, recruitment
```

---

## The Veldara Franchise

Ground Protocol is one of three planned games sharing the same world and Discipline system:

| Game | Genre | Era |
|------|-------|-----|
| **Tower of Veldara** | Roguelike dungeon crawler | Prequel — Before the Fall |
| **Veldara: Forgotten Archives** | JRPG | Main story |
| **Zenith** | Real-time strategy / tactics | Dystopian future |

Each game uses the **Six Disciplines** as its mechanical spine — Momentum, Flux, Foundation, Renewal, Convergence — expressed differently per genre. What plays as a paradigm shift in the JRPG becomes unit roles in the RTS.

---

## Immediate Roadmap

- [ ] Refactor into multi-file project structure
- [ ] Git repository setup
- [ ] Enemy variety — distinct behaviors per enemy type
- [ ] Mecha system — nine-unit paradigm vehicle, mid-game inflection point
- [ ] Persistent run state across maps
- [ ] Outdoor map visual distinction — different tile palette
- [ ] Sound design pass

---

## Built With

Vanilla JavaScript · HTML5 Canvas · CSS  
No frameworks, no build tools, no dependencies  
Runs in any modern browser, desktop or mobile

---

*"Foundation is the last nation standing. The world heart is dying."*

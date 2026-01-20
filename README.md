# Hive Mind

A cooperative puzzle game where two players work together to save the Queen bee. Built for team cohesion and quick work breaks.

## Game Concept

**Theme:** You are beekeepers coordinating to guide the Queen to safety through a blocked hive chamber.

**Core mechanic:** Asymmetric abilities. Neither player can solve the puzzle alone.

| Role | Ability | Controls |
|------|---------|----------|
| **Forager** 🍯 | Slide pieces along their axis | Click to select, arrow keys to move |
| **Architect** 🔧 | Rotate pieces 90° | Click piece to rotate |

**Goal:** Get the Queen (👑) to the exit in minimum moves.

**Session length:** 3-5 minutes per puzzle.

## How to Play

### Solo Mode (Testing)
1. Select "Solo Test"
2. Pick any role to start
3. Use the role switcher at the bottom to swap between Forager and Architect
4. Solve the puzzle using both abilities

### Multiplayer Mode
1. Select "Multiplayer"
2. **Player 1:** Create Room → share the 4-letter code
3. **Player 2:** Join Room → enter the code
4. Each player picks a different role
5. Game starts when both roles are assigned
6. Coordinate verbally to solve together

## Running Locally

### Prerequisites
- Node.js v18+
- npm

### Install Dependencies
```bash
cd hive-mind
npm install
```

### Start Development Servers

**Terminal 1 - PartyKit (multiplayer server):**
```bash
npm run dev
```
This starts the WebSocket server at `http://localhost:1999`

**Terminal 2 - Static file server:**
```bash
python3 -m http.server 8080
```
This serves the game at `http://localhost:8080`

### Test Multiplayer Locally
1. Open `http://localhost:8080` in two browser windows
2. Create a room in one window
3. Join with the code in the other window
4. Pick different roles, play!

## Deploying

### Deploy PartyKit Server
```bash
npm run deploy
```
This deploys to PartyKit's edge network. Note the URL it gives you.

### Update Client for Production
Edit `js/multiplayer.js`:
```javascript
PARTYKIT_HOST: "hive-mind.YOUR_ACCOUNT.partykit.dev"
```

### Deploy Static Files
Host `index.html`, `style.css`, and `js/` folder on any static host (Vercel, Netlify, GitHub Pages).

## Project Structure

```
hive-mind/
├── index.html          # Main HTML with all screens
├── style.css           # Honeycomb theme styling
├── js/
│   ├── pieces.js       # Piece definitions, shapes, movement logic
│   ├── puzzles.js      # Puzzle configurations
│   ├── grid.js         # Grid rendering
│   ├── multiplayer.js  # PartyKit client connection
│   └── game.js         # Main game controller
├── party/
│   └── server.ts       # PartyKit server (room management, state sync)
├── partykit.json       # PartyKit configuration
└── package.json        # Dependencies and scripts
```

## Game Architecture

### Screens Flow

```
┌─────────────────┐
│  Mode Selector  │
│  Solo │ Multi   │
└───┬───────┬─────┘
    │       │
    ▼       ▼
┌───────┐ ┌─────────┐
│ Role  │ │  Lobby  │
│Select │ │Create/  │
│(Solo) │ │Join Room│
└───┬───┘ └────┬────┘
    │          │
    │          ▼
    │    ┌───────────┐
    │    │  Waiting  │
    │    │   Room    │
    │    │Pick Roles │
    │    └─────┬─────┘
    │          │
    ▼          ▼
┌─────────────────┐
│   Game Board    │
│  (Puzzle Play)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Win Screen    │
│  (Next Puzzle)  │
└─────────────────┘
```

### Piece Types

| Piece | Shape | Size | Symbol |
|-------|-------|------|--------|
| Queen | 2x1 rectangle | Horizontal | 👑 |
| Worker | 2x1 rectangle | H or V | 🐝 |
| Larva | 3x1 rectangle | H or V | 🥚 |
| Honey | L-shape | 2x2 with corner | 🍯 |

### Shapes and Rotation

Pieces have named shapes that determine their footprint:

```javascript
HORIZONTAL_2  ↔  VERTICAL_2    // 2x1 rotates to 1x2
HORIZONTAL_3  ↔  VERTICAL_3    // 3x1 rotates to 1x3
L_SHAPE_0 → L_SHAPE_90 → L_SHAPE_180 → L_SHAPE_270 → L_SHAPE_0
```

### Movement Rules

**Slide (Forager):**
- Piece moves one cell in a cardinal direction
- Cannot pass through other pieces
- Cannot move off grid (except Queen at exit)

**Rotate (Architect):**
- Piece rotates 90° clockwise
- Must have room for new orientation
- Rotation happens in-place (top-left corner stays fixed)

### Win Condition

Queen piece reaches the right edge at the designated exit row (row 2, the middle).

## Multiplayer Architecture

### PartyKit Server (`party/server.ts`)

Each room is a separate "party" with its own state:

```typescript
interface GameState {
  puzzleId: number;
  pieces: Piece[];
  moveCount: number;
  players: Record<string, Player>;
  status: "waiting" | "playing" | "won";
}
```

**Message types:**

| Client → Server | Description |
|-----------------|-------------|
| `join` | Player joins room with name |
| `select-role` | Player picks forager/architect |
| `slide` | Forager moves a piece |
| `rotate` | Architect rotates a piece |
| `reset` | Reset puzzle |

| Server → Client | Description |
|-----------------|-------------|
| `state` | Full game state sync |
| `player-joined` | New player notification |
| `player-left` | Player disconnected |
| `role-selected` | Role assignment update |
| `piece-moved` | Piece positions changed |
| `game-won` | Puzzle completed |
| `error` | Error message |

### Client Connection (`js/multiplayer.js`)

Uses PartySocket (WebSocket wrapper with auto-reconnect):

```javascript
Multiplayer.connect(roomCode, playerName);
Multiplayer.selectRole('forager');
Multiplayer.slide(pieceId, 'right');
Multiplayer.rotate(pieceId);
```

### State Synchronization

1. Server is authoritative - all moves validated server-side
2. Client sends intent (e.g., "slide piece X right")
3. Server validates and broadcasts new state to all clients
4. Clients update local state from server broadcast

## Puzzles

5 handcrafted puzzles with increasing difficulty:

| # | Name | Difficulty | Par | Description |
|---|------|------------|-----|-------------|
| 1 | First Steps | ⭐ | 3 | Tutorial - just slide |
| 2 | Turn Around | ⭐ | 5 | Introduces rotation need |
| 3 | Corner Block | ⭐⭐ | 6 | L-shape blocker |
| 4 | Traffic Jam | ⭐⭐ | 8 | Multiple blockers |
| 5 | Twist and Shout | ⭐⭐⭐ | 12 | Complex rotation sequence |

Puzzles are defined in `js/puzzles.js`.

## Scaling (Future)

The game is designed to scale to more players by adding roles:

| Players | Roles |
|---------|-------|
| 2 | Forager + Architect |
| 3 | + Swapper (exchange piece positions) |
| 4 | + Pusher (push piece and everything in path) |
| 5+ | + Phaser (move through one obstacle) |

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Vanilla HTML/CSS/JS |
| Multiplayer | PartyKit (Cloudflare Durable Objects) |
| Hosting | Any static host + PartyKit |

No build step required for the client.

## Team

Built by CodeTonight during a standup brainstorm session.

- **Concept:** Team collaboration
- **Theme:** Hive Mind (save the Queen)
- **Core mechanic:** Asymmetric abilities

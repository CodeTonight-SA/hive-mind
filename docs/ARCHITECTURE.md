# Hive Mind - Technical Architecture

Internal architecture documentation for the CodeTonight team.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Browser 1  │  │  Browser 2  │  │  Browser N  │          │
│  │  (Forager)  │  │ (Architect) │  │ (Spectator) │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         │                │                │                  │
│         └────────────────┼────────────────┘                  │
│                          │                                   │
│                    WebSocket                                 │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    PARTYKIT SERVER                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Cloudflare Durable Objects              │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │    │
│  │  │ Room A  │  │ Room B  │  │ Room C  │   ...        │    │
│  │  │ (XKCD)  │  │ (ABCD)  │  │ (WXYZ)  │              │    │
│  │  └─────────┘  └─────────┘  └─────────┘              │    │
│  │       │            │            │                    │    │
│  │       └────────────┼────────────┘                    │    │
│  │                    │                                 │    │
│  │              Edge Storage                            │    │
│  │          (State Persistence)                         │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Technology Choices

### Why Vanilla JS?

| Factor | Vanilla JS | React/Vue |
|--------|------------|-----------|
| Bundle size | ~0 KB | 40-100+ KB |
| Build step | None | Required |
| Learning curve | Low | Medium |
| Dev iteration | Instant | Rebuild needed |
| Complexity | Low | Medium-High |

For a small game, vanilla JS is faster to iterate and deploy.

### Why PartyKit?

| Factor | PartyKit | Socket.io | Raw WebSocket |
|--------|----------|-----------|---------------|
| Server management | None | Required | Required |
| Edge deployment | Built-in | Manual | Manual |
| State persistence | Built-in | Manual | Manual |
| Auto-scaling | Yes | Manual | Manual |
| Setup time | Minutes | Hours | Hours |

PartyKit eliminates infrastructure management.

### Why Not a Framework?

The game has:
- Simple state (pieces, players, moves)
- Simple UI (6 screens)
- No complex routing
- No SSR needs

A framework would add complexity without proportional benefit.

## Client Architecture

### Module Responsibilities

```
┌─────────────────────────────────────────────────────────┐
│                      game.js                             │
│              (Main Controller - Orchestration)           │
│  - Screen management                                     │
│  - Event binding                                         │
│  - Mode handling (solo/multiplayer)                      │
│  - Game flow coordination                                │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  pieces.js  │  │   grid.js   │  │multiplayer.js│
│   (Model)   │  │   (View)    │  │ (Network)    │
│             │  │             │  │              │
│ - Piece     │  │ - Grid      │  │ - Connect    │
│   shapes    │  │   rendering │  │ - Send moves │
│ - Movement  │  │ - Piece     │  │ - Handle     │
│   logic     │  │   rendering │  │   events     │
│ - Rotation  │  │ - Win       │  │              │
│   logic     │  │   detection │  │              │
└─────────────┘  └─────────────┘  └─────────────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
                         ▼
                 ┌─────────────┐
                 │ puzzles.js  │
                 │   (Data)    │
                 │             │
                 │ - Puzzle    │
                 │   configs   │
                 └─────────────┘
```

### Data Flow (Solo Mode)

```
User Click
    │
    ▼
game.js: handleGridClick()
    │
    ├─► [Forager] Select piece
    │       │
    │       ▼
    │   User Keypress
    │       │
    │       ▼
    │   game.js: handleKeyPress()
    │       │
    │       ▼
    │   pieces.js: canSlide()
    │       │
    │       ├─► [Valid] pieces.js: slidePiece()
    │       │       │
    │       │       ▼
    │       │   grid.js: createGridState()
    │       │       │
    │       │       ▼
    │       │   grid.js: renderPieces()
    │       │
    │       └─► [Invalid] No action
    │
    └─► [Architect] pieces.js: canRotate()
            │
            ├─► [Valid] pieces.js: rotatePiece()
            │       │
            │       ▼
            │   grid.js: renderPieces()
            │
            └─► [Invalid] No action
```

### Data Flow (Multiplayer Mode)

```
User Click
    │
    ▼
game.js: handleGridClick()
    │
    ▼
multiplayer.js: slide() / rotate()
    │
    ▼
WebSocket → PartyKit Server
    │
    ▼
Server validates move
    │
    ├─► [Valid] Broadcast new state
    │       │
    │       ▼
    │   All clients receive update
    │       │
    │       ▼
    │   multiplayer.js: onPieceMoved()
    │       │
    │       ▼
    │   game.js: handleStateUpdate()
    │       │
    │       ▼
    │   grid.js: renderPieces()
    │
    └─► [Invalid] Send error to requesting client
```

## Server Architecture

### Room Lifecycle

```
1. CREATE
   Client sends: connect(roomCode)
   Server: Creates new Durable Object for room
   Server: Loads any persisted state
   Server: Sends current state to client

2. JOIN
   Client sends: { type: "join", name: "Player" }
   Server: Adds player to state
   Server: Broadcasts player-joined

3. ROLE SELECT
   Client sends: { type: "select-role", role: "forager" }
   Server: Validates role available
   Server: Assigns role to player
   Server: If both roles filled → status: "playing"
   Server: Broadcasts state

4. GAMEPLAY
   Client sends: { type: "slide", pieceId, direction }
   Server: Validates player has forager role
   Server: Validates move is legal
   Server: Updates piece position
   Server: Increments move count
   Server: Checks win condition
   Server: Broadcasts piece-moved (or game-won)

5. DISCONNECT
   Client disconnects
   Server: Marks player as disconnected
   Server: Broadcasts player-left
   Server: State persists for reconnection

6. CLEANUP
   All players disconnect
   Server: Hibernates (PartyKit optimization)
   State: Persisted in Durable Object storage
```

### State Schema

```typescript
// Server-side state
interface GameState {
  puzzleId: number;
  pieces: Piece[];
  moveCount: number;
  players: Record<string, Player>;
  status: "waiting" | "playing" | "won";
}

interface Piece {
  id: string;          // Unique identifier
  type: string;        // queen, worker, larva, honey
  shapeName: string;   // HORIZONTAL_2, L_SHAPE_90, etc.
  x: number;           // Grid column (0-4)
  y: number;           // Grid row (0-4)
}

interface Player {
  id: string;          // Connection ID
  name: string;        // Display name
  role: Role | null;   // forager, architect, or null
  connected: boolean;  // Currently connected?
}

type Role = "forager" | "architect";
```

### Message Protocol

```typescript
// Client → Server
type ClientMessage =
  | { type: "join"; name: string }
  | { type: "select-role"; role: Role }
  | { type: "slide"; pieceId: string; direction: Direction }
  | { type: "rotate"; pieceId: string }
  | { type: "reset" }
  | { type: "next-puzzle" };

// Server → Client
type ServerMessage =
  | { type: "state"; state: GameState }
  | { type: "player-joined"; player: Player }
  | { type: "player-left"; playerId: string }
  | { type: "role-selected"; playerId: string; role: string }
  | { type: "piece-moved"; pieces: Piece[]; moveCount: number }
  | { type: "game-won"; moveCount: number }
  | { type: "error"; message: string };
```

## Grid Coordinate System

```
     0   1   2   3   4
   ┌───┬───┬───┬───┬───┐
 0 │   │   │   │   │   │
   ├───┼───┼───┼───┼───┤
 1 │   │   │   │   │   │
   ├───┼───┼───┼───┼───┤
 2 │ Q │ Q │   │   │   │ ← EXIT (row 2)
   ├───┼───┼───┼───┼───┤
 3 │   │   │   │   │   │
   ├───┼───┼───┼───┼───┤
 4 │   │   │   │   │   │
   └───┴───┴───┴───┴───┘

Q = Queen piece (2x1 horizontal at x:0, y:2)
Exit is at x:5, y:2 (off the right edge)
```

### Piece Positioning

Pieces are positioned by their **top-left cell**:

```
L-Shape at (1, 1):

     0   1   2   3   4
   ┌───┬───┬───┬───┬───┐
 0 │   │   │   │   │   │
   ├───┼───┼───┼───┼───┤
 1 │   │ L │ L │   │   │  ← Top-left is (1,1)
   ├───┼───┼───┼───┼───┤
 2 │   │ L │   │   │   │
   ├───┼───┼───┼───┼───┤
```

## Performance Considerations

### Client-Side

- **No virtual DOM** - Direct DOM manipulation is fast enough
- **Minimal re-renders** - Only re-render pieces, not entire grid
- **CSS transitions** - Smooth movement without JS animation
- **Event delegation** - Single listener on grid, not per-cell

### Server-Side

- **Hibernation** - PartyKit sleeps between messages
- **Minimal state** - Only store what's needed
- **No computation-heavy validation** - Simple bounds checking

### Network

- **Small messages** - JSON payloads under 1KB
- **State delta option** - Could send only changes (future optimization)
- **Edge deployment** - PartyKit runs close to users

## Security Considerations

### Current (MVP)

- Server validates move legality
- Server validates role permissions
- No authentication (room codes are secrets)

### Future Improvements

- Rate limiting (prevent spam)
- Input sanitization (already minimal)
- Room expiration (prevent orphaned rooms)
- Optional password protection

## Deployment Architecture

### Development

```
┌─────────────────┐     ┌─────────────────┐
│   Browser       │     │  PartyKit Dev   │
│                 │────►│  localhost:1999 │
│ localhost:8080  │     │                 │
└─────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐
│ Python HTTP     │
│ Server          │
│ (static files)  │
└─────────────────┘
```

### Production

```
┌─────────────────┐     ┌─────────────────────────────────┐
│   Browser       │     │        PartyKit (Cloudflare)    │
│                 │────►│  hive-mind.xxx.partykit.dev     │
│                 │     │  (Edge-deployed globally)       │
└─────────────────┘     └─────────────────────────────────┘
        │
        ▼
┌─────────────────┐
│ Static Host     │
│ (Vercel/        │
│  Netlify/etc)   │
└─────────────────┘
```

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-20 | M>> + CIPS | Initial architecture doc |

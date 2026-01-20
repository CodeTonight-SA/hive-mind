# Hive Mind - AI Assistant Guide

Instructions for AI assistants (Claude, etc.) working on this codebase.

## Project Overview

**Hive Mind** is a cooperative puzzle game where two players with different abilities must work together to save the Queen bee. Built with vanilla JS and PartyKit for real-time multiplayer.

## Key Concepts

### The Core Mechanic

Asymmetric abilities - this is the heart of the game:
- **Forager** can ONLY slide pieces
- **Architect** can ONLY rotate pieces
- Neither can solve puzzles alone
- This forces communication and coordination

### Design Constraints (Do Not Violate)

| Constraint | Reason |
|------------|--------|
| 2 player minimum | Core mechanic requires asymmetry |
| No timer | Minimum moves scoring, not speed |
| 3-5 minute sessions | Work break friendly |
| Vanilla JS | No build step, fast iteration |
| PartyKit multiplayer | Edge-deployed, low latency |

## File Guide

### Client Files (`js/`)

| File | Responsibility | Key Functions |
|------|----------------|---------------|
| `pieces.js` | Piece definitions, movement validation | `canSlide()`, `canRotate()`, `slidePiece()`, `rotatePiece()` |
| `puzzles.js` | Puzzle configurations | `getPuzzle()`, `loadPuzzlePieces()` |
| `grid.js` | Rendering, grid state | `createGrid()`, `renderPieces()`, `createGridState()` |
| `multiplayer.js` | PartyKit connection | `Multiplayer.connect()`, `.slide()`, `.rotate()` |
| `game.js` | Main controller, UI flow | `Game.init()`, `.handleGridClick()`, `.trySlide()` |

### Server Files (`party/`)

| File | Responsibility |
|------|----------------|
| `server.ts` | Room state, player management, move validation, broadcasting |

## Architecture Decisions

### Server Authority

The PartyKit server is authoritative for multiplayer:
1. Client sends intent (e.g., "slide piece X right")
2. Server validates the move
3. Server broadcasts new state to ALL clients
4. Clients update from server state

**Why:** Prevents cheating, ensures consistency between players.

### Shape System

Pieces have named shapes (`HORIZONTAL_2`, `L_SHAPE_90`, etc.) rather than storing cell arrays directly. This allows:
- Easy rotation (just change shape name)
- Consistent serialization
- Clear validation logic

### Screen-Based UI

The game uses a simple screen-based UI (show/hide divs) rather than a router or framework. Screens:
- `modeSelector` - Solo vs Multiplayer
- `lobby` - Create/Join room
- `waitingRoom` - Pick roles
- `roleSelector` - Solo role pick
- `gameBoard` - The puzzle
- `winScreen` - Victory

## Common Tasks

### Adding a New Puzzle

Edit `js/puzzles.js`:

```javascript
{
    id: 6,
    name: "Your Puzzle Name",
    difficulty: 2,  // 1-3
    exitRow: 2,     // Always 2 (middle row)
    pieces: [
        { id: 'queen', type: 'queen', shape: 'HORIZONTAL_2', x: 0, y: 2 },
        // Add more pieces...
    ],
    parMoves: 10  // Target move count
}
```

Available shapes:
- `HORIZONTAL_2`, `VERTICAL_2` (2x1)
- `HORIZONTAL_3`, `VERTICAL_3` (3x1)
- `L_SHAPE_0`, `L_SHAPE_90`, `L_SHAPE_180`, `L_SHAPE_270` (L-shapes)

### Adding a New Piece Type

1. Add to `PieceType` enum in `pieces.js`
2. Add symbol in `getPieceSymbol()`
3. Add CSS class in `style.css` (`.piece.newtype`)
4. Use in puzzle definitions

### Adding a New Role (Future)

1. Add to server message types in `party/server.ts`
2. Add handler in server (e.g., `handleSwap()`)
3. Add to `Multiplayer` object in `multiplayer.js`
4. Add UI for role selection
5. Add to `Game.tryX()` methods

### Modifying Multiplayer Messages

Both client (`js/multiplayer.js`) and server (`party/server.ts`) must agree on message format. Update both when adding new message types.

## Testing

### Solo Mode Testing

Solo mode lets you test both roles locally without starting servers:
1. Open `index.html` directly in browser
2. Select "Solo Test"
3. Use role switcher to swap between Forager/Architect

### Multiplayer Testing

Requires both servers running:

```bash
# Terminal 1
npm run dev

# Terminal 2
python3 -m http.server 8080
```

Open two browser windows at `http://localhost:8080`.

## Code Style

- Vanilla JS (no TypeScript on client, TypeScript on server)
- No build step for client
- CSS custom properties for theming
- Descriptive function names
- Comments for non-obvious logic

## Known Limitations

1. **No reconnection handling** - If a player disconnects mid-game, they lose their session
2. **No puzzle persistence** - Refreshing resets to puzzle 1
3. **Basic validation** - Server trusts client piece IDs
4. **No spectator mode** - Only 2 players per room

## Roadmap Items

| Feature | Priority | Complexity |
|---------|----------|------------|
| Touch/drag for mobile | High | Medium |
| Procedural puzzle generation | Medium | High |
| Additional roles (3+ players) | Medium | Medium |
| Leaderboards | Low | Medium |
| Company vs Company mode | Low | High |

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PARTYKIT_HOST` | `localhost:1999` | PartyKit server URL |

For production, update `PARTYKIT_HOST` in `js/multiplayer.js` after deploying.

## Debugging

### Client Console

```javascript
// Check game state
Game.pieces
Game.role
Game.mode

// Check multiplayer connection
Multiplayer.isConnected
Multiplayer.roomId
```

### PartyKit Server

PartyKit dev server logs to terminal. Look for:
- `[pk:inf]` - Info messages
- `[pk:err]` - Errors

## Dependencies

| Package | Purpose |
|---------|---------|
| `partykit` | Server framework |
| `partysocket` | Client WebSocket wrapper (via CDN) |

No other runtime dependencies. Keep it minimal.

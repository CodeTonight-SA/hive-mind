import type * as Party from "partykit/server";

// Game state stored in the room
interface GameState {
  puzzleId: number;
  pieces: Piece[];
  moveCount: number;
  players: Record<string, Player>;
  status: "waiting" | "playing" | "won";
}

interface Piece {
  id: string;
  type: string;
  shapeName: string;
  x: number;
  y: number;
}

interface Player {
  id: string;
  name: string;
  role: "forager" | "architect" | null;
  connected: boolean;
}

// Message types
type ClientMessage =
  | { type: "join"; name: string }
  | { type: "select-role"; role: "forager" | "architect" }
  | { type: "slide"; pieceId: string; direction: "up" | "down" | "left" | "right" }
  | { type: "rotate"; pieceId: string }
  | { type: "reset" }
  | { type: "next-puzzle" };

type ServerMessage =
  | { type: "state"; state: GameState }
  | { type: "player-joined"; player: Player }
  | { type: "player-left"; playerId: string }
  | { type: "role-selected"; playerId: string; role: string }
  | { type: "piece-moved"; pieces: Piece[]; moveCount: number }
  | { type: "game-won"; moveCount: number }
  | { type: "error"; message: string };

// Initial puzzle (same as puzzles.js puzzle 1)
const INITIAL_PUZZLE: Piece[] = [
  { id: "queen", type: "queen", shapeName: "HORIZONTAL_2", x: 0, y: 2 },
  { id: "w1", type: "worker", shapeName: "VERTICAL_2", x: 2, y: 1 },
];

export default class HiveMindServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  // Game state
  state: GameState = {
    puzzleId: 1,
    pieces: JSON.parse(JSON.stringify(INITIAL_PUZZLE)),
    moveCount: 0,
    players: {},
    status: "waiting",
  };

  async onStart() {
    // Load persisted state if available
    const stored = await this.room.storage.get<GameState>("gameState");
    if (stored) {
      this.state = stored;
    }
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Send current state to new connection
    conn.send(JSON.stringify({ type: "state", state: this.state } as ServerMessage));
  }

  async onMessage(message: string, sender: Party.Connection) {
    const msg = JSON.parse(message) as ClientMessage;

    switch (msg.type) {
      case "join":
        this.handleJoin(sender, msg.name);
        break;
      case "select-role":
        this.handleSelectRole(sender, msg.role);
        break;
      case "slide":
        this.handleSlide(sender, msg.pieceId, msg.direction);
        break;
      case "rotate":
        this.handleRotate(sender, msg.pieceId);
        break;
      case "reset":
        this.handleReset();
        break;
      case "next-puzzle":
        this.handleNextPuzzle();
        break;
    }
  }

  async onClose(conn: Party.Connection) {
    const player = this.state.players[conn.id];
    if (player) {
      player.connected = false;
      this.broadcast({ type: "player-left", playerId: conn.id });
      await this.saveState();
    }
  }

  // Handle player joining
  handleJoin(conn: Party.Connection, name: string) {
    const player: Player = {
      id: conn.id,
      name: name || `Player ${Object.keys(this.state.players).length + 1}`,
      role: null,
      connected: true,
    };

    this.state.players[conn.id] = player;
    this.broadcast({ type: "player-joined", player });
    this.saveState();
  }

  // Handle role selection
  handleSelectRole(conn: Party.Connection, role: "forager" | "architect") {
    const player = this.state.players[conn.id];
    if (!player) {
      conn.send(JSON.stringify({ type: "error", message: "Not joined" }));
      return;
    }

    // Check if role is already taken
    const roleTaken = Object.values(this.state.players).some(
      (p) => p.id !== conn.id && p.role === role && p.connected
    );

    if (roleTaken) {
      conn.send(JSON.stringify({ type: "error", message: `${role} role is already taken` }));
      return;
    }

    player.role = role;
    this.broadcast({ type: "role-selected", playerId: conn.id, role });

    // Check if both roles are filled to start game
    const forager = Object.values(this.state.players).find((p) => p.role === "forager" && p.connected);
    const architect = Object.values(this.state.players).find((p) => p.role === "architect" && p.connected);

    if (forager && architect && this.state.status === "waiting") {
      this.state.status = "playing";
      this.broadcast({ type: "state", state: this.state });
    }

    this.saveState();
  }

  // Handle slide move (forager only)
  handleSlide(conn: Party.Connection, pieceId: string, direction: "up" | "down" | "left" | "right") {
    const player = this.state.players[conn.id];
    if (!player || player.role !== "forager") {
      conn.send(JSON.stringify({ type: "error", message: "Only forager can slide" }));
      return;
    }

    const piece = this.state.pieces.find((p) => p.id === pieceId);
    if (!piece) return;

    // Calculate new position
    const deltas: Record<string, { dx: number; dy: number }> = {
      up: { dx: 0, dy: -1 },
      down: { dx: 0, dy: 1 },
      left: { dx: -1, dy: 0 },
      right: { dx: 1, dy: 0 },
    };

    const { dx, dy } = deltas[direction];
    const newX = piece.x + dx;
    const newY = piece.y + dy;

    // Basic bounds check (client does full validation)
    if (newY < 0 || newY >= 5) return;
    if (newX < 0) return;
    if (newX >= 5 && piece.type !== "queen") return;

    // Update piece position
    piece.x = newX;
    piece.y = newY;
    this.state.moveCount++;

    // Check win condition (queen reached exit)
    if (piece.type === "queen" && newX >= 4 && piece.y === 2) {
      this.state.status = "won";
      this.broadcast({ type: "game-won", moveCount: this.state.moveCount });
    }

    this.broadcast({ type: "piece-moved", pieces: this.state.pieces, moveCount: this.state.moveCount });
    this.saveState();
  }

  // Handle rotate move (architect only)
  handleRotate(conn: Party.Connection, pieceId: string) {
    const player = this.state.players[conn.id];
    if (!player || player.role !== "architect") {
      conn.send(JSON.stringify({ type: "error", message: "Only architect can rotate" }));
      return;
    }

    const piece = this.state.pieces.find((p) => p.id === pieceId);
    if (!piece) return;

    // Rotation mappings
    const rotations: Record<string, string> = {
      HORIZONTAL_2: "VERTICAL_2",
      VERTICAL_2: "HORIZONTAL_2",
      HORIZONTAL_3: "VERTICAL_3",
      VERTICAL_3: "HORIZONTAL_3",
      L_SHAPE_0: "L_SHAPE_90",
      L_SHAPE_90: "L_SHAPE_180",
      L_SHAPE_180: "L_SHAPE_270",
      L_SHAPE_270: "L_SHAPE_0",
    };

    const newShape = rotations[piece.shapeName];
    if (!newShape) return;

    piece.shapeName = newShape;
    this.state.moveCount++;

    this.broadcast({ type: "piece-moved", pieces: this.state.pieces, moveCount: this.state.moveCount });
    this.saveState();
  }

  // Reset puzzle
  handleReset() {
    this.state.pieces = JSON.parse(JSON.stringify(INITIAL_PUZZLE));
    this.state.moveCount = 0;
    this.state.status = "playing";
    this.broadcast({ type: "state", state: this.state });
    this.saveState();
  }

  // Next puzzle (simplified - just resets for now)
  handleNextPuzzle() {
    this.handleReset();
  }

  // Broadcast message to all connections
  broadcast(msg: ServerMessage) {
    this.room.broadcast(JSON.stringify(msg));
  }

  // Persist state
  async saveState() {
    await this.room.storage.put("gameState", this.state);
  }
}

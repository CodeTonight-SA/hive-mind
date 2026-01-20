/**
 * Multiplayer connection handler using PartyKit
 */

const Multiplayer = {
    socket: null,
    roomId: null,
    playerId: null,
    playerName: null,
    isConnected: false,

    // PartyKit host - update after deployment
    PARTYKIT_HOST: "localhost:1999", // Dev: localhost:1999, Prod: hive-mind.YOUR_SUBDOMAIN.partykit.dev

    // Callbacks
    onStateUpdate: null,
    onPlayerJoined: null,
    onPlayerLeft: null,
    onRoleSelected: null,
    onPieceMoved: null,
    onGameWon: null,
    onError: null,
    onConnectionChange: null,

    /**
     * Connect to a game room
     */
    connect(roomId, playerName) {
        this.roomId = roomId;
        this.playerName = playerName;

        // Use PartySocket from CDN (loaded in HTML)
        if (typeof PartySocket === "undefined") {
            console.error("PartySocket not loaded. Include the CDN script.");
            return;
        }

        this.socket = new PartySocket({
            host: this.PARTYKIT_HOST,
            room: roomId,
        });

        this.socket.addEventListener("open", () => {
            console.log("Connected to room:", roomId);
            this.isConnected = true;
            this.playerId = this.socket.id;

            // Send join message
            this.send({ type: "join", name: playerName });

            if (this.onConnectionChange) {
                this.onConnectionChange(true);
            }
        });

        this.socket.addEventListener("message", (event) => {
            this.handleMessage(JSON.parse(event.data));
        });

        this.socket.addEventListener("close", () => {
            console.log("Disconnected from room");
            this.isConnected = false;
            if (this.onConnectionChange) {
                this.onConnectionChange(false);
            }
        });

        this.socket.addEventListener("error", (error) => {
            console.error("Socket error:", error);
            if (this.onError) {
                this.onError("Connection error");
            }
        });
    },

    /**
     * Handle incoming messages
     */
    handleMessage(msg) {
        switch (msg.type) {
            case "state":
                if (this.onStateUpdate) {
                    this.onStateUpdate(msg.state);
                }
                break;

            case "player-joined":
                if (this.onPlayerJoined) {
                    this.onPlayerJoined(msg.player);
                }
                break;

            case "player-left":
                if (this.onPlayerLeft) {
                    this.onPlayerLeft(msg.playerId);
                }
                break;

            case "role-selected":
                if (this.onRoleSelected) {
                    this.onRoleSelected(msg.playerId, msg.role);
                }
                break;

            case "piece-moved":
                if (this.onPieceMoved) {
                    this.onPieceMoved(msg.pieces, msg.moveCount);
                }
                break;

            case "game-won":
                if (this.onGameWon) {
                    this.onGameWon(msg.moveCount);
                }
                break;

            case "error":
                console.error("Server error:", msg.message);
                if (this.onError) {
                    this.onError(msg.message);
                }
                break;
        }
    },

    /**
     * Send message to server
     */
    send(msg) {
        if (this.socket && this.isConnected) {
            this.socket.send(JSON.stringify(msg));
        }
    },

    /**
     * Select a role
     */
    selectRole(role) {
        this.send({ type: "select-role", role });
    },

    /**
     * Send slide move
     */
    slide(pieceId, direction) {
        this.send({ type: "slide", pieceId, direction });
    },

    /**
     * Send rotate move
     */
    rotate(pieceId) {
        this.send({ type: "rotate", pieceId });
    },

    /**
     * Reset puzzle
     */
    reset() {
        this.send({ type: "reset" });
    },

    /**
     * Go to next puzzle
     */
    nextPuzzle() {
        this.send({ type: "next-puzzle" });
    },

    /**
     * Disconnect from room
     */
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
            this.isConnected = false;
        }
    },

    /**
     * Generate a random room code
     */
    generateRoomCode() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars
        let code = "";
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
};

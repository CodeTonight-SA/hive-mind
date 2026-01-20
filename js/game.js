/**
 * Main game controller for Hive Mind
 */

const Game = {
    currentPuzzle: null,
    pieces: [],
    gridState: [],
    selectedPiece: null,
    moveCount: 0,
    role: null, // 'forager' or 'architect'
    mode: null, // 'solo' or 'multiplayer'

    // DOM elements
    elements: {
        modeSelector: null,
        lobby: null,
        waitingRoom: null,
        roleSelector: null,
        gameBoard: null,
        winScreen: null,
        grid: null,
        moveCount: null,
        roleBadge: null,
        finalMoves: null,
        testControls: null,
        connectionStatus: null,
        leaveBtn: null,
    },

    /**
     * Initialize the game
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.bindMultiplayerEvents();
        this.loadPuzzle(1);
    },

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements.modeSelector = document.getElementById('modeSelector');
        this.elements.lobby = document.getElementById('lobby');
        this.elements.waitingRoom = document.getElementById('waitingRoom');
        this.elements.roleSelector = document.getElementById('roleSelector');
        this.elements.gameBoard = document.getElementById('gameBoard');
        this.elements.winScreen = document.getElementById('winScreen');
        this.elements.grid = document.getElementById('grid');
        this.elements.moveCount = document.getElementById('moveCount');
        this.elements.roleBadge = document.getElementById('roleBadge');
        this.elements.finalMoves = document.getElementById('finalMoves');
        this.elements.testControls = document.getElementById('testControls');
        this.elements.connectionStatus = document.getElementById('connectionStatus');
        this.elements.leaveBtn = document.getElementById('leaveBtn');
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Mode selection
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectMode(btn.dataset.mode);
            });
        });

        // Back buttons
        document.getElementById('backToModeBtn')?.addEventListener('click', () => {
            this.showScreen('modeSelector');
        });

        document.getElementById('backFromSoloBtn')?.addEventListener('click', () => {
            this.showScreen('modeSelector');
        });

        // Solo role selection
        this.elements.roleSelector?.querySelectorAll('.role-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectRole(btn.dataset.role);
            });
        });

        // Multiplayer lobby
        document.getElementById('createRoomBtn')?.addEventListener('click', () => {
            this.createRoom();
        });

        document.getElementById('joinRoomBtn')?.addEventListener('click', () => {
            this.joinRoom();
        });

        // Waiting room role selection
        document.getElementById('foragerBtn')?.addEventListener('click', () => {
            this.selectMultiplayerRole('forager');
        });

        document.getElementById('architectBtn')?.addEventListener('click', () => {
            this.selectMultiplayerRole('architect');
        });

        // Grid interactions
        this.elements.grid.addEventListener('click', (e) => {
            this.handleGridClick(e);
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });

        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetPuzzle();
        });

        // Leave button
        this.elements.leaveBtn?.addEventListener('click', () => {
            this.leaveRoom();
        });

        // Next puzzle button
        document.getElementById('nextPuzzleBtn').addEventListener('click', () => {
            const next = getNextPuzzle(this.currentPuzzle.id);
            this.loadPuzzle(next.id);
            this.showGameBoard();
        });

        // Test mode: Role switcher (solo only)
        document.querySelectorAll('.switch-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.mode === 'solo') {
                    this.switchRole(btn.dataset.role);
                    document.querySelectorAll('.switch-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });
        });
    },

    /**
     * Bind multiplayer event handlers
     */
    bindMultiplayerEvents() {
        Multiplayer.onStateUpdate = (state) => {
            this.handleStateUpdate(state);
        };

        Multiplayer.onPlayerJoined = (player) => {
            this.updatePlayersList();
        };

        Multiplayer.onPlayerLeft = (playerId) => {
            this.updatePlayersList();
        };

        Multiplayer.onRoleSelected = (playerId, role) => {
            this.updateRoleButtons();
        };

        Multiplayer.onPieceMoved = (pieces, moveCount) => {
            this.pieces = pieces.map(p => ({
                ...p,
                shape: PieceShape[p.shapeName]
            }));
            this.moveCount = moveCount;
            this.gridState = createGridState(this.pieces);
            this.updateMoveCount();
            this.render();
        };

        Multiplayer.onGameWon = (moveCount) => {
            this.moveCount = moveCount;
            this.handleWin();
        };

        Multiplayer.onError = (message) => {
            alert(message);
        };

        Multiplayer.onConnectionChange = (connected) => {
            this.updateConnectionStatus(connected);
        };
    },

    /**
     * Select game mode
     */
    selectMode(mode) {
        this.mode = mode;

        if (mode === 'solo') {
            this.showScreen('roleSelector');
        } else {
            this.showScreen('lobby');
        }
    },

    /**
     * Show a specific screen
     */
    showScreen(screenName) {
        const screens = ['modeSelector', 'lobby', 'waitingRoom', 'roleSelector', 'gameBoard', 'winScreen'];
        screens.forEach(s => {
            const el = this.elements[s] || document.getElementById(s);
            if (el) el.style.display = 'none';
        });

        const target = this.elements[screenName] || document.getElementById(screenName);
        if (target) target.style.display = 'block';
    },

    /**
     * Create a new multiplayer room
     */
    createRoom() {
        const playerName = document.getElementById('playerName').value.trim() || 'Player';
        const roomCode = Multiplayer.generateRoomCode();

        document.getElementById('roomCodeDisplay').textContent = roomCode;
        this.showScreen('waitingRoom');

        Multiplayer.connect(roomCode, playerName);
    },

    /**
     * Join an existing room
     */
    joinRoom() {
        const playerName = document.getElementById('playerName').value.trim() || 'Player';
        const roomCode = document.getElementById('roomCodeInput').value.trim().toUpperCase();

        if (roomCode.length !== 4) {
            alert('Please enter a 4-character room code');
            return;
        }

        document.getElementById('roomCodeDisplay').textContent = roomCode;
        this.showScreen('waitingRoom');

        Multiplayer.connect(roomCode, playerName);
    },

    /**
     * Select role in multiplayer
     */
    selectMultiplayerRole(role) {
        Multiplayer.selectRole(role);
    },

    /**
     * Handle state update from server
     */
    handleStateUpdate(state) {
        // Update pieces
        this.pieces = state.pieces.map(p => ({
            ...p,
            shape: PieceShape[p.shapeName]
        }));
        this.moveCount = state.moveCount;
        this.gridState = createGridState(this.pieces);

        // Find our role
        const myPlayer = state.players[Multiplayer.playerId];
        if (myPlayer && myPlayer.role) {
            this.role = myPlayer.role;
        }

        // Update UI based on game status
        if (state.status === 'playing') {
            this.elements.testControls.style.display = 'none';
            this.elements.connectionStatus.style.display = 'flex';
            this.elements.leaveBtn.style.display = 'inline-block';
            this.showScreen('gameBoard');
            this.updateRoleBadge();
            this.render();
        } else if (state.status === 'waiting') {
            this.updatePlayersList();
            this.updateRoleButtons();
        }

        this.updateMoveCount();
    },

    /**
     * Update players list in waiting room
     */
    updatePlayersList() {
        // This would be populated from server state
        // For now, just a placeholder
    },

    /**
     * Update role buttons (show which are taken)
     */
    updateRoleButtons() {
        // This would check server state for taken roles
    },

    /**
     * Update connection status display
     */
    updateConnectionStatus(connected) {
        const dot = this.elements.connectionStatus?.querySelector('.status-dot');
        const text = this.elements.connectionStatus?.querySelector('.status-text');

        if (dot && text) {
            if (connected) {
                dot.classList.remove('disconnected');
                text.textContent = 'Connected';
            } else {
                dot.classList.add('disconnected');
                text.textContent = 'Disconnected';
            }
        }
    },

    /**
     * Leave multiplayer room
     */
    leaveRoom() {
        Multiplayer.disconnect();
        this.mode = null;
        this.role = null;
        this.showScreen('modeSelector');
    },

    /**
     * Select a role (solo mode)
     */
    selectRole(role) {
        this.role = role;
        this.elements.roleSelector.style.display = 'none';
        this.elements.gameBoard.style.display = 'block';

        // Show test controls in solo mode
        this.elements.testControls.style.display = 'block';
        this.elements.connectionStatus.style.display = 'none';
        this.elements.leaveBtn.style.display = 'none';

        this.updateRoleBadge();
        this.render();
    },

    /**
     * Update role badge display
     */
    updateRoleBadge() {
        const roleNames = {
            forager: '🍯 Forager (Slide)',
            architect: '🔧 Architect (Rotate)'
        };
        this.elements.roleBadge.textContent = roleNames[this.role] || '';
    },

    /**
     * Switch role during testing (solo mode only)
     */
    switchRole(role) {
        if (this.mode !== 'solo') return;

        this.role = role;
        this.selectedPiece = null;
        this.updateRoleBadge();
        this.render();
    },

    /**
     * Load a puzzle
     */
    loadPuzzle(puzzleId) {
        this.currentPuzzle = getPuzzle(puzzleId);
        this.pieces = loadPuzzlePieces(this.currentPuzzle);
        this.gridState = createGridState(this.pieces);
        this.selectedPiece = null;
        this.moveCount = 0;
        this.updateMoveCount();

        createGrid(this.elements.grid);
        this.render();
    },

    /**
     * Reset current puzzle
     */
    resetPuzzle() {
        if (this.mode === 'multiplayer') {
            Multiplayer.reset();
        } else {
            this.loadPuzzle(this.currentPuzzle.id);
        }
    },

    /**
     * Render the game state
     */
    render() {
        const selectedId = this.selectedPiece ? this.selectedPiece.id : null;
        renderPieces(this.elements.grid, this.pieces, selectedId, this.role);
    },

    /**
     * Handle click on grid
     */
    handleGridClick(e) {
        const pieceEl = e.target.closest('.piece');

        if (pieceEl) {
            const pieceId = pieceEl.dataset.id;
            const piece = this.pieces.find(p => p.id === pieceId);

            if (this.role === 'architect') {
                this.tryRotate(piece);
            } else {
                this.selectedPiece = piece;
                this.render();
            }
        }
    },

    /**
     * Handle keyboard input
     */
    handleKeyPress(e) {
        if (this.role !== 'forager' || !this.selectedPiece) return;

        const keyMap = {
            ArrowUp: 'up',
            ArrowDown: 'down',
            ArrowLeft: 'left',
            ArrowRight: 'right',
            w: 'up',
            s: 'down',
            a: 'left',
            d: 'right'
        };

        const direction = keyMap[e.key];
        if (direction) {
            e.preventDefault();
            this.trySlide(this.selectedPiece, direction);
        }
    },

    /**
     * Try to slide a piece
     */
    trySlide(piece, direction) {
        if (this.role !== 'forager') {
            console.log("Only the Forager can slide pieces!");
            return;
        }

        if (this.mode === 'multiplayer') {
            // Send to server, let it validate
            Multiplayer.slide(piece.id, direction);
        } else {
            // Local validation and update
            if (canSlide(piece, direction, this.gridState, GRID_SIZE)) {
                const index = this.pieces.findIndex(p => p.id === piece.id);
                this.pieces[index] = slidePiece(piece, direction);
                this.selectedPiece = this.pieces[index];

                this.gridState = createGridState(this.pieces);
                this.moveCount++;
                this.updateMoveCount();

                if (checkWin(this.pieces, this.currentPuzzle.exitRow)) {
                    this.handleWin();
                }

                this.render();
            }
        }
    },

    /**
     * Try to rotate a piece
     */
    tryRotate(piece) {
        if (this.role !== 'architect') {
            console.log("Only the Architect can rotate pieces!");
            return;
        }

        if (this.mode === 'multiplayer') {
            // Send to server
            Multiplayer.rotate(piece.id);
        } else {
            // Local validation and update
            if (canRotate(piece, this.gridState, GRID_SIZE)) {
                const index = this.pieces.findIndex(p => p.id === piece.id);
                this.pieces[index] = rotatePiece(piece);

                this.gridState = createGridState(this.pieces);
                this.moveCount++;
                this.updateMoveCount();

                if (checkWin(this.pieces, this.currentPuzzle.exitRow)) {
                    this.handleWin();
                }

                this.render();
            } else {
                console.log("Can't rotate - not enough space!");
            }
        }
    },

    /**
     * Update move counter display
     */
    updateMoveCount() {
        this.elements.moveCount.textContent = this.moveCount;
    },

    /**
     * Handle win condition
     */
    handleWin() {
        setTimeout(() => {
            this.elements.gameBoard.style.display = 'none';
            this.elements.winScreen.style.display = 'block';
            this.elements.finalMoves.textContent = this.moveCount;
        }, 300);
    },

    /**
     * Show game board (after win screen)
     */
    showGameBoard() {
        this.elements.winScreen.style.display = 'none';
        this.elements.gameBoard.style.display = 'block';
    },
};

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});

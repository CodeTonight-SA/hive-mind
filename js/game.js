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

    // DOM elements
    elements: {
        roleSelector: null,
        gameBoard: null,
        winScreen: null,
        grid: null,
        moveCount: null,
        roleBadge: null,
        finalMoves: null
    },

    /**
     * Initialize the game
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadPuzzle(1);
    },

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements.roleSelector = document.getElementById('roleSelector');
        this.elements.gameBoard = document.getElementById('gameBoard');
        this.elements.winScreen = document.getElementById('winScreen');
        this.elements.grid = document.getElementById('grid');
        this.elements.moveCount = document.getElementById('moveCount');
        this.elements.roleBadge = document.getElementById('roleBadge');
        this.elements.finalMoves = document.getElementById('finalMoves');
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Role selection
        document.querySelectorAll('.role-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectRole(btn.dataset.role);
            });
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

        // Next puzzle button
        document.getElementById('nextPuzzleBtn').addEventListener('click', () => {
            const next = getNextPuzzle(this.currentPuzzle.id);
            this.loadPuzzle(next.id);
            this.showGameBoard();
        });
    },

    /**
     * Select a role
     */
    selectRole(role) {
        this.role = role;
        this.elements.roleSelector.style.display = 'none';
        this.elements.gameBoard.style.display = 'block';

        const roleNames = {
            forager: '🍯 Forager (Slide)',
            architect: '🔧 Architect (Rotate)'
        };
        this.elements.roleBadge.textContent = roleNames[role];

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
        this.loadPuzzle(this.currentPuzzle.id);
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
                // Architect: rotate on click
                this.tryRotate(piece);
            } else {
                // Forager: select piece
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
            this.showMessage("Only the Forager can slide pieces!");
            return;
        }

        if (canSlide(piece, direction, this.gridState, GRID_SIZE)) {
            // Update piece
            const index = this.pieces.findIndex(p => p.id === piece.id);
            this.pieces[index] = slidePiece(piece, direction);
            this.selectedPiece = this.pieces[index];

            // Update grid state
            this.gridState = createGridState(this.pieces);

            // Increment moves
            this.moveCount++;
            this.updateMoveCount();

            // Check win
            if (checkWin(this.pieces, this.currentPuzzle.exitRow)) {
                this.handleWin();
            }

            this.render();
        }
    },

    /**
     * Try to rotate a piece
     */
    tryRotate(piece) {
        if (this.role !== 'architect') {
            this.showMessage("Only the Architect can rotate pieces!");
            return;
        }

        if (canRotate(piece, this.gridState, GRID_SIZE)) {
            // Update piece
            const index = this.pieces.findIndex(p => p.id === piece.id);
            this.pieces[index] = rotatePiece(piece);

            // Update grid state
            this.gridState = createGridState(this.pieces);

            // Increment moves
            this.moveCount++;
            this.updateMoveCount();

            // Check win (rotation alone shouldn't win, but check anyway)
            if (checkWin(this.pieces, this.currentPuzzle.exitRow)) {
                this.handleWin();
            }

            this.render();
        } else {
            this.showMessage("Can't rotate - not enough space!");
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

    /**
     * Show a temporary message
     */
    showMessage(msg) {
        // Simple alert for now - could make this nicer
        console.log(msg);
    }
};

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});

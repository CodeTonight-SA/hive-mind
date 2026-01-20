/**
 * Grid rendering and management for Hive Mind
 */

const GRID_SIZE = 5;
const CELL_SIZE = 60;
const GAP_SIZE = 2;

/**
 * Create the visual grid
 */
function createGrid(container) {
    container.innerHTML = '';

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            container.appendChild(cell);
        }
    }
}

/**
 * Create a 2D array representing the grid state
 * Each cell contains the piece ID occupying it, or null
 */
function createGridState(pieces) {
    const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));

    for (const piece of pieces) {
        const cells = getPieceCells(piece);
        for (const cell of cells) {
            if (cell.x >= 0 && cell.x < GRID_SIZE && cell.y >= 0 && cell.y < GRID_SIZE) {
                grid[cell.y][cell.x] = piece.id;
            }
        }
    }

    return grid;
}

/**
 * Render pieces on the grid
 */
function renderPieces(container, pieces, selectedId, role) {
    // Remove existing piece elements
    container.querySelectorAll('.piece').forEach(el => el.remove());

    for (const piece of pieces) {
        const el = document.createElement('div');
        el.className = `piece ${piece.type}`;
        el.dataset.id = piece.id;

        if (piece.id === selectedId) {
            el.classList.add('selected');
        }

        // Calculate position
        const left = piece.x * (CELL_SIZE + GAP_SIZE) + GAP_SIZE;
        const top = piece.y * (CELL_SIZE + GAP_SIZE) + GAP_SIZE;

        // Calculate size based on shape
        const width = piece.shape.width * CELL_SIZE + (piece.shape.width - 1) * GAP_SIZE;
        const height = piece.shape.height * CELL_SIZE + (piece.shape.height - 1) * GAP_SIZE;

        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        el.style.width = `${width}px`;
        el.style.height = `${height}px`;

        // Add symbol
        el.textContent = getPieceSymbol(piece.type);

        // For L-shapes, we need special rendering
        if (piece.shapeName.startsWith('L_SHAPE')) {
            el.style.background = 'transparent';
            el.innerHTML = renderLShape(piece);
        }

        container.appendChild(el);
    }
}

/**
 * Render L-shaped piece using multiple divs
 */
function renderLShape(piece) {
    const cells = piece.shape.cells;
    const pieceColors = {
        honey: 'linear-gradient(135deg, #f4a100, #c17900)',
        worker: 'linear-gradient(135deg, #8d6e63, #6d4c41)',
        larva: 'linear-gradient(135deg, #ffe0b2, #ffcc80)'
    };
    const color = pieceColors[piece.type] || pieceColors.honey;

    let html = '';
    for (const [dx, dy] of cells) {
        const left = dx * (CELL_SIZE + GAP_SIZE);
        const top = dy * (CELL_SIZE + GAP_SIZE);
        html += `<div style="
            position: absolute;
            left: ${left}px;
            top: ${top}px;
            width: ${CELL_SIZE}px;
            height: ${CELL_SIZE}px;
            background: ${color};
            border-radius: 8px;
        "></div>`;
    }

    // Add symbol in center
    const centerX = (piece.shape.width * (CELL_SIZE + GAP_SIZE) - GAP_SIZE) / 2;
    const centerY = (piece.shape.height * (CELL_SIZE + GAP_SIZE) - GAP_SIZE) / 2;
    html += `<span style="
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 1.5rem;
        z-index: 1;
    ">${getPieceSymbol(piece.type)}</span>`;

    return html;
}

/**
 * Get piece at grid coordinates
 */
function getPieceAt(pieces, x, y) {
    for (const piece of pieces) {
        const cells = getPieceCells(piece);
        for (const cell of cells) {
            if (cell.x === x && cell.y === y) {
                return piece;
            }
        }
    }
    return null;
}

/**
 * Check if queen has reached the exit
 */
function checkWin(pieces, exitRow) {
    const queen = pieces.find(p => p.type === PieceType.QUEEN);
    if (!queen) return false;

    // Queen wins when its rightmost cell is at x = GRID_SIZE (off the grid)
    // or touching the right edge at the exit row
    const cells = getPieceCells(queen);
    const rightmostX = Math.max(...cells.map(c => c.x));
    const queenY = cells[0].y; // Queen is horizontal, so all cells same Y

    return rightmostX >= GRID_SIZE - 1 && queenY === exitRow;
}

/**
 * Highlight valid moves for selected piece
 */
function highlightValidMoves(container, piece, grid, role) {
    // Remove existing highlights
    container.querySelectorAll('.cell.highlight').forEach(el => {
        el.classList.remove('highlight');
    });

    if (!piece) return;

    // For forager, highlight slide directions
    if (role === 'forager') {
        const directions = ['up', 'down', 'left', 'right'];
        for (const dir of directions) {
            if (canSlide(piece, dir, grid, GRID_SIZE)) {
                // Highlight the cell in that direction
                const deltas = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
                const [dx, dy] = deltas[dir];
                const cells = getPieceCells(piece);
                for (const cell of cells) {
                    const newX = cell.x + dx;
                    const newY = cell.y + dy;
                    if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
                        const cellEl = container.querySelector(`[data-x="${newX}"][data-y="${newY}"]`);
                        if (cellEl) cellEl.classList.add('highlight');
                    }
                }
            }
        }
    }
}

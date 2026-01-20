/**
 * Piece definitions and shapes for Hive Mind
 */

const PieceType = {
    QUEEN: 'queen',
    WORKER: 'worker',
    LARVA: 'larva',
    HONEY: 'honey'
};

const PieceShape = {
    HORIZONTAL_2: { width: 2, height: 1, cells: [[0,0], [1,0]] },
    VERTICAL_2: { width: 1, height: 2, cells: [[0,0], [0,1]] },
    HORIZONTAL_3: { width: 3, height: 1, cells: [[0,0], [1,0], [2,0]] },
    VERTICAL_3: { width: 1, height: 3, cells: [[0,0], [0,1], [0,2]] },
    L_SHAPE_0: { width: 2, height: 2, cells: [[0,0], [0,1], [1,1]] },   // ┘
    L_SHAPE_90: { width: 2, height: 2, cells: [[0,0], [1,0], [0,1]] },  // └
    L_SHAPE_180: { width: 2, height: 2, cells: [[0,0], [1,0], [1,1]] }, // ┌
    L_SHAPE_270: { width: 2, height: 2, cells: [[1,0], [0,1], [1,1]] }  // ┐
};

// L-shape rotation mapping
const L_ROTATIONS = {
    'L_SHAPE_0': 'L_SHAPE_90',
    'L_SHAPE_90': 'L_SHAPE_180',
    'L_SHAPE_180': 'L_SHAPE_270',
    'L_SHAPE_270': 'L_SHAPE_0'
};

// Horizontal/Vertical rotation mapping
const LINE_ROTATIONS = {
    'HORIZONTAL_2': 'VERTICAL_2',
    'VERTICAL_2': 'HORIZONTAL_2',
    'HORIZONTAL_3': 'VERTICAL_3',
    'VERTICAL_3': 'HORIZONTAL_3'
};

/**
 * Create a piece object
 */
function createPiece(id, type, shapeName, x, y) {
    return {
        id,
        type,
        shapeName,
        shape: PieceShape[shapeName],
        x,
        y
    };
}

/**
 * Get all cells occupied by a piece
 */
function getPieceCells(piece) {
    return piece.shape.cells.map(([dx, dy]) => ({
        x: piece.x + dx,
        y: piece.y + dy
    }));
}

/**
 * Check if a piece can rotate at its current position
 */
function canRotate(piece, grid, gridSize) {
    // Get the rotated shape
    let newShapeName;
    if (L_ROTATIONS[piece.shapeName]) {
        newShapeName = L_ROTATIONS[piece.shapeName];
    } else if (LINE_ROTATIONS[piece.shapeName]) {
        newShapeName = LINE_ROTATIONS[piece.shapeName];
    } else {
        return false; // Can't rotate this shape
    }

    const newShape = PieceShape[newShapeName];

    // Check if all new cells are valid and empty
    for (const [dx, dy] of newShape.cells) {
        const newX = piece.x + dx;
        const newY = piece.y + dy;

        // Check bounds
        if (newX < 0 || newX >= gridSize || newY < 0 || newY >= gridSize) {
            return false;
        }

        // Check if cell is occupied by another piece
        const occupant = grid[newY][newX];
        if (occupant && occupant !== piece.id) {
            return false;
        }
    }

    return true;
}

/**
 * Rotate a piece 90 degrees clockwise
 */
function rotatePiece(piece) {
    let newShapeName;
    if (L_ROTATIONS[piece.shapeName]) {
        newShapeName = L_ROTATIONS[piece.shapeName];
    } else if (LINE_ROTATIONS[piece.shapeName]) {
        newShapeName = LINE_ROTATIONS[piece.shapeName];
    } else {
        return piece; // Can't rotate
    }

    return {
        ...piece,
        shapeName: newShapeName,
        shape: PieceShape[newShapeName]
    };
}

/**
 * Check if a piece can slide in a direction
 */
function canSlide(piece, direction, grid, gridSize) {
    const deltas = {
        up: { dx: 0, dy: -1 },
        down: { dx: 0, dy: 1 },
        left: { dx: -1, dy: 0 },
        right: { dx: 1, dy: 0 }
    };

    const { dx, dy } = deltas[direction];
    const cells = getPieceCells(piece);

    for (const cell of cells) {
        const newX = cell.x + dx;
        const newY = cell.y + dy;

        // Check bounds (allow right edge exit for queen)
        if (newX < 0 || newY < 0 || newY >= gridSize) {
            return false;
        }
        if (newX >= gridSize && piece.type !== PieceType.QUEEN) {
            return false;
        }

        // Check if cell is occupied by another piece
        if (newX < gridSize) {
            const occupant = grid[newY][newX];
            if (occupant && occupant !== piece.id) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Slide a piece one cell in a direction
 */
function slidePiece(piece, direction) {
    const deltas = {
        up: { dx: 0, dy: -1 },
        down: { dx: 0, dy: 1 },
        left: { dx: -1, dy: 0 },
        right: { dx: 1, dy: 0 }
    };

    const { dx, dy } = deltas[direction];

    return {
        ...piece,
        x: piece.x + dx,
        y: piece.y + dy
    };
}

/**
 * Get emoji/symbol for piece type
 */
function getPieceSymbol(type) {
    const symbols = {
        [PieceType.QUEEN]: '👑',
        [PieceType.WORKER]: '🐝',
        [PieceType.LARVA]: '🥚',
        [PieceType.HONEY]: '🍯'
    };
    return symbols[type] || '?';
}

/**
 * Puzzle definitions for Hive Mind
 * Each puzzle defines piece positions on a 5x5 grid
 * Queen must exit through the right side (row index 2, the middle)
 */

const PUZZLES = [
    // Puzzle 1: Tutorial - Simple slide
    {
        id: 1,
        name: "First Steps",
        difficulty: 1,
        exitRow: 2,
        pieces: [
            { id: 'queen', type: 'queen', shape: 'HORIZONTAL_2', x: 0, y: 2 },
            { id: 'w1', type: 'worker', shape: 'VERTICAL_2', x: 2, y: 1 }
        ],
        parMoves: 3
    },

    // Puzzle 2: Need to rotate
    {
        id: 2,
        name: "Turn Around",
        difficulty: 1,
        exitRow: 2,
        pieces: [
            { id: 'queen', type: 'queen', shape: 'HORIZONTAL_2', x: 0, y: 2 },
            { id: 'w1', type: 'worker', shape: 'HORIZONTAL_2', x: 2, y: 2 },
            { id: 'w2', type: 'worker', shape: 'VERTICAL_2', x: 4, y: 1 }
        ],
        parMoves: 5
    },

    // Puzzle 3: L-shape introduction
    {
        id: 3,
        name: "Corner Block",
        difficulty: 2,
        exitRow: 2,
        pieces: [
            { id: 'queen', type: 'queen', shape: 'HORIZONTAL_2', x: 0, y: 2 },
            { id: 'h1', type: 'honey', shape: 'L_SHAPE_0', x: 2, y: 2 },
            { id: 'w1', type: 'worker', shape: 'VERTICAL_2', x: 4, y: 2 }
        ],
        parMoves: 6
    },

    // Puzzle 4: Multiple blockers
    {
        id: 4,
        name: "Traffic Jam",
        difficulty: 2,
        exitRow: 2,
        pieces: [
            { id: 'queen', type: 'queen', shape: 'HORIZONTAL_2', x: 1, y: 2 },
            { id: 'w1', type: 'worker', shape: 'VERTICAL_2', x: 0, y: 1 },
            { id: 'w2', type: 'worker', shape: 'VERTICAL_2', x: 3, y: 1 },
            { id: 'w3', type: 'worker', shape: 'VERTICAL_2', x: 3, y: 3 },
            { id: 'l1', type: 'larva', shape: 'HORIZONTAL_3', x: 0, y: 0 }
        ],
        parMoves: 8
    },

    // Puzzle 5: Complex rotation needed
    {
        id: 5,
        name: "Twist and Shout",
        difficulty: 3,
        exitRow: 2,
        pieces: [
            { id: 'queen', type: 'queen', shape: 'HORIZONTAL_2', x: 0, y: 2 },
            { id: 'h1', type: 'honey', shape: 'L_SHAPE_180', x: 2, y: 1 },
            { id: 'h2', type: 'honey', shape: 'L_SHAPE_0', x: 3, y: 2 },
            { id: 'w1', type: 'worker', shape: 'VERTICAL_2', x: 1, y: 0 },
            { id: 'w2', type: 'worker', shape: 'HORIZONTAL_2', x: 0, y: 4 }
        ],
        parMoves: 12
    }
];

/**
 * Get puzzle by ID
 */
function getPuzzle(id) {
    return PUZZLES.find(p => p.id === id);
}

/**
 * Get next puzzle
 */
function getNextPuzzle(currentId) {
    const currentIndex = PUZZLES.findIndex(p => p.id === currentId);
    if (currentIndex < PUZZLES.length - 1) {
        return PUZZLES[currentIndex + 1];
    }
    return PUZZLES[0]; // Loop back to first
}

/**
 * Load puzzle pieces
 */
function loadPuzzlePieces(puzzle) {
    return puzzle.pieces.map(p => createPiece(p.id, p.type, p.shape, p.x, p.y));
}

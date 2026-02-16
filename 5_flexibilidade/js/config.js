const CONFIG = {
    GAME_WIDTH: 1200,
    GAME_HEIGHT: 675,
    COLORS: {
        background: "#F5F7FA",
        text: "#2C3E50",
        accent: "#81C784",
        error: "#e74c3c",
        teams: [
            { bg: "#ff7676", text: "#ffffff" }, // Pastel Red
            { bg: "#ffb65e", text: "#ffffff" }, // Pastel Orange
            { bg: "#94972b", text: "#ffffff" }, // Pastel Yellow (dark text for contrast)
            { bg: "#6bff4d", text: "#ffffff" }, // Pastel Green
            { bg: "#38eeff", text: "#ffffff" }, // Pastel Cyan
            { bg: "#498bf7", text: "#ffffff" }, // Pastel Blue
            { bg: "#7961fd", text: "#ffffff" }, // Pastel Purple
            { bg: "#ff48ff", text: "#ffffff" }, // Pastel Pink
            { bg: "#899e49", text: "#ffffff" }, // Olive Green
            { bg: "#448ead", text: "#ffffff" }, // Blue Grey
        ]
    },
    GAMEPLAY: {
        timeLimit: 180,
        deskRows: 6,
        deskCols: 2, // Increased by 2 blocks width
        numDesks: 3,
        teamNames: [
            "RH", "Financeiro", "Vendas", "Marketing", "Suporte", 
            "Finanças", "Jurídico", "Operações", "Produto", "Dados", "Qualidade"
        ]
    },
    // Shapes will be populated dynamically below
    POLYOMINOES: {} 
};

// --- Shape Generation Logic ---
(function generateShapes() {
    function getRotations(matrix) {
        const rots = [matrix];
        let curr = matrix;
        for (let i = 0; i < 3; i++) {
            const rows = curr.length;
            const cols = curr[0].length;
            let next = Array.from({ length: cols }, () => Array(rows).fill(0));
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    next[c][rows - 1 - r] = curr[r][c];
                }
            }
            if (!rots.some(r => JSON.stringify(r) === JSON.stringify(next))) {
                rots.push(next);
            }
            curr = next;
        }
        return rots;
    }

    const BASE_SHAPES = {
        4: [
            [[1], [1], [1], [1]], // I-Line (Start)
            [[1, 1], [1, 1]], // Box
            [[1, 1], [1, 0], [1, 0]], // L
            [[1, 0], [1, 0], [1, 1]], // L flip
            [[1, 0], [1, 1], [0, 1]], // S
            [[0, 1], [1, 1], [1, 0]]  // Z
        ],
        5: [
            [[1], [1], [1], [1], [1]], // I-Line
            [[1, 1], [1, 0], [1, 0], [1, 0]], // L
            [[1, 0], [1, 0], [1, 0], [1, 1]], // J
            [[1, 1], [1, 0], [1, 1]], // U / C
            [[1, 1], [1, 1], [1, 0]], // P
            [[1, 0], [1, 1], [1, 1]]  // d
        ],
        6: [
            [[1], [1], [1], [1], [1], [1]], // I-Line
            [[1, 1], [1, 1], [1, 1]], // Rect 
            [[1, 1], [1, 0], [1, 0], [1, 1]], // C-long
            [[1, 0], [1, 0], [1, 1], [1, 1]], // L-thick
            [[1, 1], [1, 0], [1, 1], [1, 0]], // F / E
            [[1, 1], [0, 1], [1, 1], [0, 1]] // E inverted
        ]
    };

    Object.keys(BASE_SHAPES).forEach(size => {
        CONFIG.POLYOMINOES[size] = [];
        BASE_SHAPES[size].forEach(base => {
            const allRotations = getRotations(base);
            // Filter: Only keep shapes that fit in 2 columns width
            const valid = allRotations.filter(matrix => matrix[0].length <= 2);
            CONFIG.POLYOMINOES[size].push(...valid);
        });
        
        // Remove duplicates again after filtering
        const unique = [];
        CONFIG.POLYOMINOES[size].forEach(shape => {
            if (!unique.some(u => JSON.stringify(u) === JSON.stringify(shape))) {
                unique.push(shape);
            }
        });
        CONFIG.POLYOMINOES[size] = unique;
    });
})();


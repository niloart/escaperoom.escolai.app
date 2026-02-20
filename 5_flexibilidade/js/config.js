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
    // Fixed Shapes: [Straight, Correct, Distractor]
    POLYOMINOES: {
        4: [
            [[1], [1], [1], [1]], // 1. Straight
            [[1, 1], [1, 1]],     // 2. Square (Correct for Desk 1)
            [[1, 0], [1, 0], [1, 1]] // 3. L-shape (Distractor)
        ],
        5: [
            [[1], [1], [1], [1], [1]], // 1. Straight
            [[1, 1], [1, 1], [1, 0]],  // 2. P-shape (Correct for Desk 2)
            [[1, 1], [1, 0], [1, 1]]   // 3. U-shape (Distractor)
        ],
        6: [
            [[1], [1], [1], [1], [1], [1]], // 1. Straight
            [[1, 1], [1, 0], [1, 0], [1, 1]], // 2. C-shape (Correct for Desk 3)
            [[1, 1], [1, 1], [1, 1]]        // 3. Rect 3x2 (Distractor)
        ]
    } 
};

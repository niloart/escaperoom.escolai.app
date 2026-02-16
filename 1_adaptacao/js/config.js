/**
 * CONSTANTS & CONFIG
 */
const CONFIG = {
    cols: 8,
    rows: 6,
    tileSize: 80, // Base size, scales dynamically
    bgColor: 'rgba(0,0,0,0)',
    pipeInactive: '#6a2a2a', // Dim red (mais visível)
    pipeActive: '#c41e3a',   // Glowing red
    lineWidth: 12,
    animSpeed: 0.2 // Speed of rotation lerp (0.0 to 1.0)
};

// Pipe Directions: North=1, East=2, South=4, West=8
const DIRS = {
    N: 1,
    E: 2,
    S: 4,
    W: 8
};

// Pipe Types Definition - Apenas retos e em L
// maps type ID to its connections at rotation 0
const PIPE_TYPES = {
    STRAIGHT: DIRS.N | DIRS.S,    // 5
    ELBOW:    DIRS.N | DIRS.E,    // 3
    EMPTY:    0
};

// Canos especiais - cores e configurações
const SPECIAL_PIPES = {
    RECONHECER: {
        id: 'reconhecer',
        name: 'Reconhecer',
        color: '#4CAF50',
        colorActive: '#81C784',
        order: 1,
        icon: 'assets/icons/icone_reconhecer.png',
        message: 'Reconhecer o que estamos a sentir (curiosidade, receio, resistência).'
    },
    RESPEITAR: {
        id: 'respeitar',
        name: 'Respeitar',
        color: '#2196F3',
        colorActive: '#64B5F6',
        order: 2,
        icon: 'assets/icons/icone_respeitar.png',
        message: 'Respeitar o tempo de adaptação de cada pessoa.'
    },
    REORIENTAR: {
        id: 'reorientar',
        name: 'Reorientar',
        color: '#9C27B0',
        colorActive: '#BA68C8',
        order: 3,
        icon: 'assets/icons/icone_reorientar.png',
        message: 'Reorientar o comportamento para as novas práticas e guidelines.'
    }
};

/**
 * UTILITIES
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getOppositeDir(dir) {
    if (dir === DIRS.N) return DIRS.S;
    if (dir === DIRS.S) return DIRS.N;
    if (dir === DIRS.E) return DIRS.W;
    if (dir === DIRS.W) return DIRS.E;
    return 0;
}

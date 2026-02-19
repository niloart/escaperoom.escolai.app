const CONFIG = {
    GAME_WIDTH: 1200,
    GAME_HEIGHT: 675,
    PROGRESS_INDEX: 2,
    SESSION_DEADLINE_KEY: 'escaperoom_deadline_ts',
    WRONG_CLICK_PENALTY_MS: 10000,
    COLORS: {
        background: "#1a1a2e",
        accent: "#81C784",
        text: "#e2e8f0",
        surface: "#262b45"
    },
    TEXTS: {
        title: "Convivência",
        startDescription: "<i>Open space</i> requer autorregulação e consciência de que não estamos sozinhos no espaço. Identifique os 3 necessidades de ajustes nesta cena.",
        wrongClick: "Nada de errado por aqui. Você perdeu 10 segundos do tempo geral",
        endMessage: "Necessidades de ajustes identificadas. Módulo de Convivência Instalado."
    },
    HIDDEN_SPOTS: [
        {
            id: "local-1",
            x: 569,
            y: 270,
            width: 64,
            height: 136,
            message: "NECESSIDADE DE AJUSTE. Um colaborador a falar alto ao telemóvel no <i>open space</i>."
        },
        {
            id: "local-2",
            x: 37,
            y: 375,
            width: 211,
            height: 212,
            message: "NECESSIDADE DE AJUSTE! Duas pessoas estão a ter uma reunião de pé ao lado de alguém que está concentrado, o que pode dificultar o foco no <i>open space</i>."
        },
        {
            id: "local-3",
            x: 802,
            y: 456,
            width: 156,
            height: 121,
            message: "NECESSIDADE DE AJUSTE! Ela está a fazer reuniões com fones, mas a falar em volume elevado."
        }
    ]
};

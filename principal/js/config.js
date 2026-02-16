const CONFIG = {
    GAME_WIDTH: 1200,
    GAME_HEIGHT: 675,
    STORAGE_KEY: "escaperoom_progress",
    COLORS: {
        background: "#1a1a2e", 
        screenLocked: "#cf4545",       // Vermelho
        screenActive: "#e6c200",       // Amarelo (aguardando chave)
        screenUnlocked: "#45cf78",     // Verde
        screenCompleted: "#2a8a4a",    // Verde escuro (concluído)
        screenNeutral: "#333333",      // Cinza desligado
        text: "#e2e8f0"
    },
    PASSWORDS: {
        final: "wecare"
    },
    COMPLETION_LETTERS: ["W", "E", "C", "A", "R", "E"],
    SCREENS: [
        { id: "screen-1", x: 40,  y: 90,  width: 280, height: 170, label: "Adaptação",     gameUrl: "/1_adaptacao/",     previewImage: "/1_adaptacao/assets/backgrounds/Fundo_inicio.png" },
        { id: "screen-2", x: 880, y: 90,  width: 280, height: 170, label: "Convivência",   gameUrl: "/2_convivencia/",   previewImage: "/2_convivencia/assets/fundo_inicio.png" },
        // { id: "screen-2", x: 328, y: 320, width: 250, height: 150, label: "Convivência",   gameUrl: "/2_convivencia/",   previewImage: "/2_convivencia/assets/fundo_inicio.png" },
        { id: "screen-3", x: 50,  y: 320, width: 250, height: 150, label: "Navegação",     gameUrl: "/3_navegacao/",     previewImage: "/3_navegacao/assets/screens/Fundo_missao_novo.png" },
        { id: "screen-4", x: 328, y: 320, width: 250, height: 150, label: "Sincronização", gameUrl: "/4_sincronizacao/", previewImage: "/4_sincronizacao/assets/backgrounds/Fundo_inicio.png" },
        { id: "screen-5", x: 610, y: 320, width: 250, height: 150, label: "Flexibilidade", gameUrl: "/5_flexibilidade/", previewImage: "/5_flexibilidade/assets/screens/Fundo_inicio.png" },
        { id: "screen-6", x: 880, y: 320, width: 250, height: 150, label: "Organização",   gameUrl: "/6_organizacao/",   previewImage: "/6_organizacao/assets/screens/fundo_incio.png" }
    ],
    FINAL_PANEL: {
        id: "final-panel",
        x: 400,
        y: 520,
        width: 400,
        height: 110,
        label: "TERMINAL MESTRE"
    },
    KEYS: {
        count: 6,
        containerX: 900,
        containerY: 520
    }
};

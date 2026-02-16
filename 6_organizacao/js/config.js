const CONFIG = {
    GAME_WIDTH: 1200,
    GAME_HEIGHT: 675,
    WRONG_DESTINATION_PENALTY_SECONDS: 10,

    PHASE1: {
        BOARD_BACKGROUND: "assets/mesa.png",
        ITEM_DEFAULT_SIZE: { width: "100%", height: "100%" },
        ITEMS: [
            { id: "papel", image: "assets/papel.png", x: 231, y: 525, destination: "LIXO" },
            { id: "garrafa", image: "assets/garrafa.png", x: 935, y: 420, destination: "CACIFO" },
            // { id: "canetas", image: "assets/canetas.png", x: 794, y: 440, destination: "CACIFO" },
            { id: "fone", image: "assets/fone.png", x: 338, y: 491, destination: "CACIFO" },
            { id: "cafe", image: "assets/cafe.png", x: 874, y: 488, destination: "LIXO" },
            { id: "mochila", image: "assets/mochila.png", x: 980, y: 533, destination: "CACIFO" },
            { id: "teclado", image: "assets/teclado.png", x: 465, y: 521, destination: "MESA", keepOnTable: true },
            { id: "mouse", image: "assets/mouse.png", x: 779, y: 535, destination: "MESA", keepOnTable: true }
        ],
        HOTSPOTS: []
    },

    PHASE2: {
        INITIAL_TIME: 30,
        PENALTY_TIME: 10,
        LOCKER_START: 200,
        LOCKER_END: 214
    },

    COLORS: {
        accent: "#81C784",
        error: "#E57373"
    },

    TEXTS: {
        introMessage:
            "ORGANIZAÇÃO:\nAnalise os objetos destacados e decida o destino imediato: LIXO, CACIFO ou MANTER NA MESA. Depois, deverá ir à zona de Cacifos e guardar os seus pertences",
        phase1Header: "FASE 1 - ARRUMAR A MESA",
        phase2Header: "FASE 2 - GUARDAR NO CACIFO",
        phase2Instruction: "Escolha um armário, defina a senha e depois reencontre-o.",
        allPhase1Done: "Mesa organizada. Agora siga para os cacifos.",
        wrongChoice: "Destino incorreto.",
        localIncorreto: "Local incorreto!",
        rightChoice: "Correto!",
        pinSetPrompt: "CRIE UMA SENHA",
        pinEnterPrompt: "INSIRA A SENHA",
        phase2FindLockerPrompt: "Agora, encontre ter cacifo e insira a senha para coletar seus pertences",
        winTitle: "ACESSO PERMITIDO",
        winMsg: "Você concluiu as duas fases da organização.",
        loseTitle: "SISTEMA BLOQUEADO",
        loseMsg: "Tempo esgotado ou muitas tentativas falhas."
    }
};

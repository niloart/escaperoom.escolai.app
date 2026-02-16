const CONFIG = {
    GAME_WIDTH: 1200,
    GAME_HEIGHT: 675,
    COLORS: {
        background: "#1a1a2e", // Dark background
        surface: "#262b45",
        primary: "#81C784", // Pastel Green for success/accent
        secondary: "#64B5F6", // Pastel Blue
        text: "#e2e8f0", // Light text
        error: "#EF5350", // Pastel Red
        locked: "#2d3748" // Dark Grey
    },
    SCENARIOS: [
        {
            id: 1,
            title: "INTERAÇÃO 1 — ECO DETETADO",
            visualDesc: "Um colaborador na sala e com o portátil aberto. O ícone de som do portátil está ativo. O sistema da sala também está ligado",
            visualIcon: "🎤",
            alert: "Alerta de Áudio: Eco detetado.",
            coords: { x: 170, y: 396 },
            options: [
                { id: 'A', text: "Baixar volume do portátil do João", correct: false },
                { id: 'B', text: "Desligar microfone do portátil do João", correct: true }
            ]
        },
        {
            id: 2,
            title: "INTERAÇÃO 2 — HEADSETS DUPLICADOS",
            visualDesc: "Três colegas na mesa usam headsets individuais e olham para os seus próprios ecrãs",
            visualIcon: "🎧",
            alert: "Colaboradores com headsets no mesmo espaço físico.",
            coords: { x: 362, y: 260 },
            options: [
                { id: 'A', text: "Pedir atenção aos colaboradores.", correct: false },
                { id: 'B', text: "Pedir para retirarem os headsets e usarem o áudio da sala.", correct: true }
            ]
        },
        {
            id: 3,
            title: "INTERAÇÃO 3 — QUEM ESTÁ A FALAR?",
            visualDesc: "Uma colaboradora está a falar e escrever no quadro branco, que fica fora do ângulo da câmara da sala. ",
            visualIcon: "📹",
            alert: "Não sabes quem está a falar.",
            coords: { x: 665, y: 125 },
            options: [
                { id: 'A', text: "Pedir para ajustar a câmara", correct: true },
                { id: 'B', text: "Pedir se identificar e falar mais alto.", correct: false }
            ]
        },
        {
            id: 4,
            title: "INTERAÇÃO 4 — SOM DO TECLADO",
            visualDesc: "Um colaborador está a digitar freneticamente no teclado do portátil, muito perto do microfone central.",
            visualIcon: "⌨️",
            alert: "Som do teclado está a abafar as vozes.",
            coords: { x: 539, y: 401 },
            options: [
                { id: 'A', text: "Pedir para afastar o microfone do teclado.", correct: true },
                { id: 'B', text: "Solicitar que colaborador desligue o microfone.", correct: false }
            ]
        },
        {
            id: 5,
            title: "INTERAÇÃO 5 — RUÍDO DE FUNDO",
            visualDesc: "Dois colegas no fundo da sala começam falar entre si.",
            visualIcon: "👥",
            alert: "Ruído de fundo não identificado.",
            coords: { x: 226, y: 260 },
            options: [
                { id: 'A', text: "Ignorar, pois não é sobre a reunião.", correct: false },
                { id: 'B', text: "Pedir para partilhar os comentários com quem está remoto.", correct: true }
            ]
        }
    ],
    GAMEPLAY: {
        lockTime: 5, // Seconds to lock on error
        syncIncrease: 20, // Increase per correct answer
        baseSync: 0,
        wrongAnswerPenaltySeconds: 10
    }
};

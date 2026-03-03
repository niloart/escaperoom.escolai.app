/**
 * Configurações do Jogo Office Traffic Controller
 */

const CONFIG = {
    // Duração total do jogo em segundos (5 minutos)
    GAME_DURATION: 300,
    
    // Total de colaboradores a serem atendidos
    TOTAL_EMPLOYEES: 9,
    
    // Intervalo de atualização do game loop (ms)
    UPDATE_INTERVAL: 100,
    
    // Paciência máxima
    PATIENCE_MAX: 500,
    
    // Taxa de decaimento da paciência por segundo
    PATIENCE_DECAY: {
        RECEPTION: 2,      // ~25 segundos para zerar na receção
        WAITING_ROOM: 1  // ~67 segundos para zerar na sala de espera
    },
    
    // Penalidade por colocar em local errado (segundos perdidos no timer)
    WRONG_PLACE_PENALTY: 10,
    
    // Tipos de tarefas com suas configurações
    TASK_TYPES: {
        blue: {
            name: 'E-mail',
            fullName: 'E-mail / Chat',
            icon: '📧',
            workTime: 10000,      // 10 segundos
            workspace: 'open-space',
            slots: ['open-a', 'open-b']
        },
        red: {
            name: 'Confid.',
            fullName: 'Confidencial / Feedback',
            icon: '🔐',
            workTime: 10000,     // 10 segundos
            workspace: 'phonebooth',
            slots: ['phone']
        },
        green: {
            name: 'Reunião',
            fullName: 'Reunião / Alinhamento',
            icon: '🤝',
            workTime: 10000,     // 10 segundos
            workspace: 'huddle-room',
            slots: ['huddle']
        }
    },
    
    // Configuração das fases (ajustado para 1 minuto)
    PHASES: {
        1: {
            name: 'Aquecimento',
            startTime: 0,           // Início imediato
            endTime: 20,            // Até 20 segundos
            spawnInterval: 4000,    // A cada 4 segundos
            employeeCount: 3,       // 3 colaboradores nesta fase
            description: 'Todas as salas livres, ritmo tranquilo'
        },
        2: {
            name: 'Gargalo',
            startTime: 15,          // A partir de 15 segundos
            endTime: 40,            // Até 40 segundos
            spawnInterval: 3000,    // A cada 3 segundos
            employeeCount: 3,       // 3 colaboradores nesta fase
            description: 'Salas começam a ficar ocupadas'
        },
        3: {
            name: 'Fluxo Intenso',
            startTime: 30,          // A partir de 30 segundos
            endTime: 60,            // Até 60 segundos
            spawnInterval: 3000,    // A cada 3 segundos
            employeeCount: 3,       // 3 colaboradores nesta fase
            description: 'Ritmo intenso, gestão crítica'
        }
    },
    
    // Lista de colaboradores com seus tipos (baseado nos cards)
    EMPLOYEES: [
        { name: 'Alan', type: 'blue', image: 'assets/cards/alan.png' },
        { name: 'Ana', type: 'blue', image: 'assets/cards/ana.png' },
        { name: 'Mel', type: 'blue', image: 'assets/cards/mel.png' },
        { name: 'Teresa', type: 'blue', image: 'assets/cards/teresa.png' },
        { name: 'Pietro', type: 'blue', image: 'assets/cards/pietro.png' },
        { name: 'Rebeca', type: 'red', image: 'assets/cards/rebeca.png' },
        { name: 'Letícia', type: 'green', image: 'assets/cards/leticia.png' },
        { name: 'Danilo', type: 'green', image: 'assets/cards/danilo.png' },
        { name: 'Vitor', type: 'blue', image: 'assets/cards/vitor.png' }
    ],
    
    // Caminhos das imagens
    ASSETS: {
        BACKGROUND: 'assets/backgrounds/fundo_principal.png',
        SCREEN_INICIO: 'assets/screens/inicio.png',
        SCREEN_MISSAO: 'assets/screens/missao.png'
    }
};

// Congelar configurações para evitar modificações acidentais
Object.freeze(CONFIG);
Object.freeze(CONFIG.PATIENCE_DECAY);
Object.freeze(CONFIG.TASK_TYPES);
Object.freeze(CONFIG.PHASES);
Object.freeze(CONFIG.EMPLOYEES);
Object.freeze(CONFIG.ASSETS);

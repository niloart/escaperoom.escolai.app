// Serviço de som simples para substituir caso o original tenha dependências
const soundService = {
    playClick: () => {
        // Implementação simulada ou real via AudioContext se necessário
        // Por enquanto, placeholder seguro para não quebrar
        console.log("Sound: Click");
    },
    playSuccess: () => {
        console.log("Sound: Success");
    },
    playError: () => {
        console.log("Sound: Error");
    }
};

window.soundService = soundService;

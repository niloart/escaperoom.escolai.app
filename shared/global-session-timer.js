(() => {
    // Timer e lógica de reinício removidos conforme solicitado.
    // Mantendo a interface para compatibilidade com chamadas existentes.

    const CONFIG = {
        progressKey: 'escaperoom_progress',
        finalUnlockedKey: 'escaperoom_final_unlocked',
        totalGames: 6
    };

    function resetAllProgress() {
        // Apenas remove o progresso salvo, sem lógica de timer
        localStorage.removeItem(CONFIG.progressKey);
        localStorage.removeItem(CONFIG.finalUnlockedKey);
    }

    // No-op functions
    function startSession() {}
    function applyPenaltyMs(ms) {}
    function applyPenaltySeconds(s) {}

    window.EscapeRoomSessionTimer = {
        resetAllProgress,
        startSession,
        applyPenaltyMs,
        applyPenaltySeconds
    };
})();

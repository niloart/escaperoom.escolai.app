class GameController {
    constructor() {
        this.foundSpots = new Set();

        this.container = document.getElementById('game-container');
        this.introScreen = document.getElementById('intro-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.victoryScreen = document.getElementById('victory-screen');
        this.startBtn = document.getElementById('start-btn');
        this.sceneArea = document.getElementById('scene-area');
        this.messageLayer = document.getElementById('message-layer');
        this.foundCount = document.getElementById('found-count');
        this.returnBtn = document.getElementById('return-panel-btn');
        this.endTitle = document.getElementById('end-title');
        this.endMessage = document.getElementById('end-message');
        this.timerEl = document.getElementById('game-timer');

        this.gameTimerSeconds = 300;
        this.gameTimerInterval = null;
        this.gameEnded = false;

        this.init();
    }

    init() {
        this.showScreen('intro');
        this.updateFoundCount();
        this.bindEvents();
    }

    bindEvents() {
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.startGame());
        }

        if (this.sceneArea) {
            this.sceneArea.addEventListener('click', (event) => this.handleSceneClick(event));
        }

        if (this.returnBtn) {
            this.returnBtn.addEventListener('click', () => this.completeAndReturn());
        }

        // Botão de ajuda
        const helpBtn = document.getElementById('help-btn');
        const helpModal = document.getElementById('help-modal');
        if (helpBtn) helpBtn.addEventListener('click', () => helpModal.classList.add('visible'));
        const helpCloseBtn = document.getElementById('help-close-btn');
        if (helpCloseBtn) helpCloseBtn.addEventListener('click', () => helpModal.classList.remove('visible'));
    }

    startGame() {
        this.showScreen('game');
        this.startGameTimer();
    }

    startGameTimer() {
        this.gameTimerSeconds = 300;
        this.updateTimerDisplay();
        this.gameTimerInterval = setInterval(() => {
            this.gameTimerSeconds--;
            this.updateTimerDisplay();
            if (this.gameTimerSeconds <= 0) {
                clearInterval(this.gameTimerInterval);
                this.gameTimerInterval = null;
                this.triggerTimeout();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        if (!this.timerEl) return;
        const m = Math.floor(this.gameTimerSeconds / 60).toString().padStart(2, '0');
        const s = (this.gameTimerSeconds % 60).toString().padStart(2, '0');
        this.timerEl.textContent = `${m}:${s}`;
        this.timerEl.classList.remove('warning', 'danger');
        if (this.gameTimerSeconds <= 30) {
            this.timerEl.classList.add('danger');
        } else if (this.gameTimerSeconds <= 60) {
            this.timerEl.classList.add('warning');
        }
    }

    triggerTimeout() {
        if (this.gameEnded) return;
        this.gameEnded = true;
        if (this.endTitle) this.endTitle.textContent = 'Tempo Esgotado';
        if (this.endMessage) this.endMessage.innerHTML = 'Necessidades de ajuste não encontradas. Em um <em>Open Space</em>, a autorregulação é fundamental. O respeito pelo foco dos colegas exige que se evitem comportamentos disruptivos, como falar alto ao telemóvel ou realizar reuniões de pé no meio das secretárias, garantindo assim um ambiente harmonioso para todos.';
        this.showScreen('victory');
    }

    showScreen(screen) {
        this.introScreen.classList.add('hidden');
        this.gameScreen.classList.add('hidden');
        this.victoryScreen.classList.add('hidden');

        if (screen === 'intro') this.introScreen.classList.remove('hidden');
        if (screen === 'game') this.gameScreen.classList.remove('hidden');
        if (screen === 'victory') this.victoryScreen.classList.remove('hidden');

        const helpBtn = document.getElementById('help-btn');
        if (helpBtn) helpBtn.style.display = (screen === 'game') ? 'block' : 'none';
    }

    handleSceneClick(event) {
        if (!this.sceneArea || this.foundSpots.size >= CONFIG.HIDDEN_SPOTS.length) {
            return;
        }

        const rect = this.sceneArea.getBoundingClientRect();
        const clickX = Math.round(event.clientX - rect.left);
        const clickY = Math.round(event.clientY - rect.top);

        const spot = this.findSpotByPosition(clickX, clickY);
        if (!spot) {
            this.applyWrongClickPenalty();
            this.showClickMessage(CONFIG.TEXTS.wrongClick, clickX, clickY, 'error', false);
            return;
        }

        if (this.foundSpots.has(spot.id)) {
            this.showClickMessage('Este desafio já foi identificado.', clickX, clickY, 'info', false);
            return;
        }

        this.foundSpots.add(spot.id);
        this.updateFoundCount();
        this.showClickMessage(spot.message, clickX, clickY, 'success', true);

        if (this.foundSpots.size === CONFIG.HIDDEN_SPOTS.length) {
            this.gameEnded = true;
            if (this.gameTimerInterval) {
                clearInterval(this.gameTimerInterval);
                this.gameTimerInterval = null;
            }
            if (this.endTitle) this.endTitle.textContent = 'Desafios Identificados.';
            if (this.endMessage) this.endMessage.innerHTML = 'Excelente capacidade de observação. Identificaste corretamente todas as situações que requeriam ajuste.<br>Num <em>open space</em>, a autorregulação é essencial. Respeitar o foco dos colegas implica evitar comportamentos disruptivos, como falar alto ao telemóvel ou realizar reuniões informais nas zonas de trabalho.<br>Assim garantimos um ambiente mais equilibrado, produtivo e confortável para todos.';
            setTimeout(() => {
                this.showScreen('victory');
            }, 4500);
        }
    }

    findSpotByPosition(x, y) {
        return CONFIG.HIDDEN_SPOTS.find((spot) => {
            const insideX = x >= spot.x && x <= spot.x + spot.width;
            const insideY = y >= spot.y && y <= spot.y + spot.height;
            return insideX && insideY;
        });
    }

    applyWrongClickPenalty() {
        const penaltySeconds = Math.round(CONFIG.WRONG_CLICK_PENALTY_MS / 1000);
        this.gameTimerSeconds = Math.max(0, this.gameTimerSeconds - penaltySeconds);
        this.updateTimerDisplay();
        if (this.gameTimerSeconds <= 0 && !this.gameEnded) {
            if (this.gameTimerInterval) {
                clearInterval(this.gameTimerInterval);
                this.gameTimerInterval = null;
            }
            this.triggerTimeout();
        }
    }

    updateFoundCount() {
        if (this.foundCount) {
            this.foundCount.textContent = String(this.foundSpots.size);
        }
    }

    showClickMessage(message, clickX, clickY, type = 'info', persist = false) {
        if (!this.messageLayer) {
            return;
        }

        const messageEl = document.createElement('div');
        messageEl.className = `scene-message ${type}`;
        messageEl.innerHTML = message;
        this.messageLayer.appendChild(messageEl);

        const maxLeft = Math.max(0, CONFIG.GAME_WIDTH - messageEl.offsetWidth - 12);
        const maxTop = Math.max(0, CONFIG.GAME_HEIGHT - messageEl.offsetHeight - 12);
        const left = Math.max(12, Math.min(clickX + 14, maxLeft));
        const top = Math.max(12, Math.min(clickY - messageEl.offsetHeight - 12, maxTop));

        messageEl.style.left = `${left}px`;
        messageEl.style.top = `${top}px`;

        if (!persist) {
            setTimeout(() => {
                messageEl.remove();
            }, 2400);
        }
    }

    completeAndReturn() {
        localStorage.setItem('escaperoom_progress', String(CONFIG.PROGRESS_INDEX));
        window.location.href = '/principal/';
    }
}

// Inicialização ao carregar a página
window.onload = () => new GameController();

class ScapeRoomGame {
    constructor() {
        this.container = document.getElementById('game-container');
        this.keysContainer = document.getElementById('keys-container');
        this.dragHintPopup = document.getElementById('drag-hint-popup');
        
        // Modal elements
        this.passwordModal = document.getElementById('password-modal');
        this.passwordInput = document.getElementById('password-input');
        this.submitBtn = document.getElementById('modal-submit');
        this.closeBtn = document.getElementById('modal-close');
        this.errorMsg = document.getElementById('modal-error');
        this.feedbackScreen = document.getElementById('feedback-screen');
        this.resetProgressBtn = document.getElementById('reset-progress-btn');
        
        // Estado do Jogo
        this.currentScreenIndex = 0;
        this.unlockedScreens = new Set();
        this.isFinalStage = false;
        this.hasInteractedWithKey = false;

        this.init();
    }

    // --- Inicialização ---

    init() {
        this.loadProgress();
        this.createScreens();
        this.createKeys();
        this.createFinalPanel();
        this.bindModalEvents();
        this.restoreVisualState();
        this.showDragHint();
    }

    /** Lê o progresso do localStorage */
    loadProgress() {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        this.currentScreenIndex = saved ? parseInt(saved, 10) : 0;
        
        // Garante que o valor é válido (0 a 6)
        if (isNaN(this.currentScreenIndex) || this.currentScreenIndex < 0) {
            this.currentScreenIndex = 0;
        }
        if (this.currentScreenIndex > CONFIG.SCREENS.length) {
            this.currentScreenIndex = CONFIG.SCREENS.length;
        }
    }

    /** Restaura o estado visual baseado no progresso salvo */
    restoreVisualState() {
        // Marca monitores já concluídos
        for (let i = 0; i < this.currentScreenIndex; i++) {
            const screenId = CONFIG.SCREENS[i].id;
            const screenEl = document.getElementById(screenId);
            if (screenEl) {
                screenEl.classList.remove('locked', 'active');
                screenEl.classList.add('completed');
            }
            // Esconde a chave correspondente
            const keyEl = document.getElementById(`key-${i}`);
            if (keyEl) {
                keyEl.classList.add('used');
            }
        }

        // Verifica se todos os jogos estão completos
        if (this.currentScreenIndex >= CONFIG.SCREENS.length) {
            this.hideDragHint();
            this.activateFinalPanel();
        } else {
            // Ativa o próximo monitor na sequência
            this.activateScreen(this.currentScreenIndex);
        }
    }

    // --- Criação de Elementos ---

    createScreens() {
        CONFIG.SCREENS.forEach((screenData, index) => {
            const el = document.createElement('div');
            el.id = screenData.id;
            el.dataset.index = index;
            el.className = 'monitor locked';
            el.style.left = screenData.x + 'px';
            el.style.top = screenData.y + 'px';
            el.style.width = screenData.width + 'px';
            el.style.height = screenData.height + 'px';

            // Label do monitor
            const label = document.createElement('span');
            label.className = 'monitor-label';
            label.textContent = screenData.label;
            el.appendChild(label);

            if (screenData.previewImage) {
                const thumbnail = document.createElement('div');
                thumbnail.className = 'monitor-thumbnail';
                thumbnail.style.backgroundImage = `url("${screenData.previewImage}")`;
                el.appendChild(thumbnail);
            }

            const completionLetter = document.createElement('span');
            completionLetter.className = 'monitor-letter';
            completionLetter.textContent = CONFIG.COMPLETION_LETTERS[index] || '';
            el.appendChild(completionLetter);
            
            // Eventos de Drop
            el.ondragover = (e) => this.handleDragOver(e);
            el.ondragleave = (e) => this.handleDragLeave(e);
            el.ondrop = (e) => this.handleDrop(e, index);
            
            this.container.appendChild(el);
        });
    }

    createKeys() {
        if (!this.keysContainer) {
            console.error("Keys container not found!");
            return;
        }
        for (let i = 0; i < CONFIG.KEYS.count; i++) {
            const key = document.createElement('div');
            key.className = 'key-item';
            if (i === 0) {
                key.classList.add('first-key-highlight');
            }
            key.draggable = true;
            key.id = `key-${i}`;
            
            key.ondragstart = (e) => {
                e.dataTransfer.setData("text/plain", key.id);
                e.dataTransfer.effectAllowed = "move";
                key.classList.add('dragging');
                if (!this.hasInteractedWithKey) {
                    this.hasInteractedWithKey = true;
                    this.hideDragHint();
                }
            };
            
            key.ondragend = () => {
                key.classList.remove('dragging');
            };

            this.keysContainer.appendChild(key);
        }
    }

    createFinalPanel() {
        const panelData = CONFIG.FINAL_PANEL;
        const el = document.createElement('div');
        el.id = panelData.id;
        el.style.left = panelData.x + 'px';
        el.style.top = panelData.y + 'px';
        el.style.width = panelData.width + 'px';
        el.style.height = panelData.height + 'px';
        
        el.onclick = () => this.handleFinalPanelClick();
        
        this.container.appendChild(el);
        this.finalPanelElement = el;
    }

    bindModalEvents() {
        this.submitBtn.onclick = () => this.checkPassword();
        this.closeBtn.onclick = () => this.closeModal();
        this.passwordInput.onkeypress = (e) => {
            if (e.key === 'Enter') this.checkPassword();
        };

        if (this.resetProgressBtn) {
            this.resetProgressBtn.onclick = () => this.resetProgress();
        }
    }

    showDragHint() {
        if (this.dragHintPopup && this.currentScreenIndex < CONFIG.SCREENS.length) {
            this.dragHintPopup.classList.remove('hidden');
        }
    }

    hideDragHint() {
        if (this.dragHintPopup) {
            this.dragHintPopup.classList.add('hidden');
        }
    }

    // --- Lógica de Jogo ---

    activateScreen(index) {
        if (index >= CONFIG.SCREENS.length) return;
        
        const screenId = CONFIG.SCREENS[index].id;
        const screenEl = document.getElementById(screenId);
        
        if (screenEl) {
            screenEl.classList.remove('locked');
            screenEl.classList.add('active');
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }

    handleDragLeave(e) {
        // Opcional: remover highlight de hover
    }

    handleDrop(e, screenIndex) {
        e.preventDefault();

        // Valida se a tela é a correta da sequência
        if (screenIndex !== this.currentScreenIndex) return;

        const keyId = e.dataTransfer.getData("text/plain");
        const keyEl = document.getElementById(keyId);
        
        if (keyEl) {
            this.useKeyOnScreen(keyEl, screenIndex);
        }
    }

    useKeyOnScreen(keyEl, screenIndex) {
        // 1. Remove a chave visualmente
        keyEl.classList.add('used');
        
        // 2. Atualiza a tela visualmente
        const screenData = CONFIG.SCREENS[screenIndex];
        const screenEl = document.getElementById(screenData.id);
        
        screenEl.classList.remove('active');
        screenEl.classList.add('unlocked');
        
        // 3. Mostra mensagem "DESBLOQUEADO"
        this.showFloatingMessage(screenEl, "DESBLOQUEADO");

        // 4. Navega para o jogo após 2 segundos
        setTimeout(() => {
            window.location.href = screenData.gameUrl;
        }, 2000);
    }

    showFloatingMessage(targetEl, text) {
        const msg = document.createElement('div');
        msg.className = 'floating-message';
        msg.innerText = text;
        
        const rect = targetEl.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        const top = rect.top - containerRect.top + (rect.height / 2);
        const left = rect.left - containerRect.left + (rect.width / 2);

        msg.style.top = top + 'px';
        msg.style.left = left + 'px';
        
        this.container.appendChild(msg);
        
        setTimeout(() => msg.remove(), 2500);
    }

    // --- Lógica Final (Senha) ---

    activateFinalPanel() {
        this.isFinalStage = true;
        this.finalPanelElement.classList.add('active');
    }

    handleFinalPanelClick() {
        if (!this.isFinalStage) return;
        this.openModal("SENHA MESTRA");
    }

    openModal(title) {
        document.getElementById('modal-title').innerText = title;
        this.passwordInput.value = '';
        this.errorMsg.innerText = '';
        this.passwordModal.classList.remove('hidden');
        this.passwordInput.focus();
    }

    closeModal() {
        this.passwordModal.classList.add('hidden');
    }

    checkPassword() {
        const input = this.passwordInput.value.trim();
        const correctPassword = CONFIG.PASSWORDS.final;
        const normalizedInput = input.replace(/\s+/g, '').toLowerCase();
        const normalizedCorrect = correctPassword.replace(/\s+/g, '').toLowerCase();

        if (normalizedInput === normalizedCorrect) {
            this.handleVictory();
        } else {
            this.errorMsg.innerText = "SENHA INCORRETA";
            this.passwordInput.value = '';
            this.passwordInput.classList.add('shake');
            setTimeout(() => this.passwordInput.classList.remove('shake'), 500);
        }
    }

    handleVictory() {
        this.closeModal();
        this.triggerVictory();
    }

    triggerVictory() {
        localStorage.setItem('escaperoom_final_unlocked', '1');
        localStorage.removeItem('escaperoom_deadline_ts');
        this.feedbackScreen.classList.remove('hidden');
        this.feedbackScreen.innerHTML = '';
        if (this.resetProgressBtn) {
            this.resetProgressBtn.innerText = 'Jogar o desafio final novamente';
            this.resetProgressBtn.classList.add('on-final-screen');
        }
        const certBtn = document.getElementById('download-certificate-btn');
        if (certBtn) {
            certBtn.classList.remove('hidden');
            certBtn.classList.add('on-final-screen');
        }

        const pdfBtn = document.getElementById('download-pdf-btn');
        if (pdfBtn) {
            pdfBtn.classList.remove('hidden');
            pdfBtn.classList.add('on-final-screen');
        }

        const finalizarBtn = document.getElementById('finalizar-btn');
        if (finalizarBtn) {
            finalizarBtn.classList.add('on-final-screen');
            finalizarBtn.onclick = () => {
                const overlay = document.getElementById('finalizar-overlay');
                if (overlay) overlay.classList.add('visible');
            };
        }
    }

    resetProgress() {
        if (window.EscapeRoomSessionTimer && typeof window.EscapeRoomSessionTimer.resetAllProgress === 'function') {
            window.EscapeRoomSessionTimer.resetAllProgress();
        } else {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            localStorage.removeItem('escaperoom_deadline_ts');
        }

        window.location.reload();
    }
}

// Inicializa o jogo
window.onload = () => new ScapeRoomGame();

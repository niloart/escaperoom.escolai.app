class GameController {
    constructor() {
        this.gameState = 'intro'; // intro, playing, locked, victory
        this.currentScenarioIndex = -1; // -1 means no scenario selected
        this.completedScenarios = []; // Track completed scenario IDs
        this.syncLevel = 0;
        this.lockTimer = 0;
        this.lockInterval = null;

        this.elements = {
            introScreen: document.getElementById('intro-screen'),
            gameScreen: document.getElementById('game-screen'),
            victoryScreen: document.getElementById('victory-screen'),
            
            startBtn: document.getElementById('start-btn'),
            
            syncBar: document.getElementById('sync-fill'),
            syncText: document.getElementById('sync-text'),
            
            // Left Panel (Visual)
            visualContent: document.querySelector('.visual-content'),
            interactionButtons: document.getElementById('interaction-buttons'),
            alertBox: document.getElementById('alert-box'),
            alertTitle: document.getElementById('alert-title'),
            alertVisualDesc: document.getElementById('alert-visual-desc'),
            feedbackOverlay: document.getElementById('feedback-overlay'),
            feedbackIcon: document.getElementById('feedback-icon'),
            feedbackTitle: document.getElementById('feedback-title'),
            feedbackMessage: document.getElementById('feedback-message'),
            
            // Right Panel (Options)
            rightPanel: document.getElementById('right-panel'),
            scenarioTitle: document.getElementById('scenario-title'),
            instructionText: document.querySelector('.instruction-text'),
            optionsContainer: document.getElementById('options-container')
        };

        this.init();
    }

    init() {
        this.elements.startBtn.addEventListener('click', () => this.startGame());
        this.showScreen('intro');
    }

    startGame() {
        this.completedScenarios = [];
        this.syncLevel = 0;
        this.lockTimer = 0;
        this.setGameState('playing');
        
        this.updateSyncUI();
        this.renderInteractionButtons();
        this.clearRightPanel();
        this.showScreen('game');
    }

    renderInteractionButtons() {
        // Clear existing buttons (or check if we need to recreate)
        // For simplicity: clear and recreate
        let container = this.elements.interactionButtons;
        if (!container) {
            // If somehow not found, create it dynamically
            container = document.createElement('div');
            container.id = 'interaction-buttons';
            this.elements.visualContent.appendChild(container);
            this.elements.interactionButtons = container;
        }
        
        container.innerHTML = ''; // Clear

        CONFIG.SCENARIOS.forEach((scenario, index) => {
            if (this.completedScenarios.includes(scenario.id)) {
                 // Option: Don't render completed buttons, or render as completed?
                 // Let's render as completed for visual feedback
                 return; 
            }

            const btn = document.createElement('div');
            btn.className = 'interaction-btn';
            
            // Use coords from config
            if (scenario.coords) {
                btn.style.left = `${scenario.coords.x}px`;
                btn.style.top = `${scenario.coords.y}px`;
            } else {
                // Fallback valid position
                 btn.style.left = `${(index * 50) + 50}px`;
                 btn.style.top = '50px';
            }
            
            // Icon - "Sinal de ruido" -> Using a wave or similar
            btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h2l2 5 2-10 2 5 2-8 2 10 2-5 2 3h2"/></svg>`;
            
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent bubbling issues
                this.selectScenario(index);
            });
            
            container.appendChild(btn);
        });
    }

    selectScenario(index) {
        if (this.gameState === 'locked') return;

        this.currentScenarioIndex = index;
        this.renderScenario();
    }

    clearRightPanel() {
        this.elements.scenarioTitle.textContent = "AGUARDANDO SELEÇÃO...";
        this.elements.instructionText.textContent = "Selecione um ponto de interferência na imagem.";
        this.elements.optionsContainer.innerHTML = '';
        this.elements.alertBox.style.display = 'none';
        this.elements.rightPanel.style.opacity = '0.5'; // Dim implies inactive
    }

    setGameState(state) {
        this.gameState = state;
    }

    showScreen(screenName) {
        this.elements.introScreen.classList.remove('active');
        this.elements.gameScreen.classList.remove('active');
        this.elements.victoryScreen.classList.remove('active');

        if (screenName === 'intro') this.elements.introScreen.classList.add('active');
        if (screenName === 'game') this.elements.gameScreen.classList.add('active');
        if (screenName === 'victory') this.elements.victoryScreen.classList.add('active');
    }

    updateSyncUI() {
        this.elements.syncBar.style.width = `${this.syncLevel}%`;
        this.elements.syncText.textContent = `${this.syncLevel}%`;
        
        // Color based on level
        if (this.syncLevel === 100) {
            this.elements.syncBar.style.backgroundColor = CONFIG.COLORS.primary;
            this.elements.syncText.style.color = CONFIG.COLORS.primary;
        } else {
            this.elements.syncBar.style.backgroundColor = CONFIG.COLORS.secondary;
            this.elements.syncText.style.color = CONFIG.COLORS.secondary;
        }
    }

    renderScenario() {
        const scenario = CONFIG.SCENARIOS[this.currentScenarioIndex];
        
        // Activate Panel
        this.elements.rightPanel.style.opacity = '1';

        // Content
        this.elements.scenarioTitle.innerHTML = scenario.title;
        this.elements.instructionText.textContent = "Escolhe a ação corretiva:";
        
        this.elements.alertTitle.innerHTML = scenario.alert;
        this.elements.alertVisualDesc.textContent = scenario.visualDesc;
        this.elements.alertBox.style.display = 'flex'; 

        // Options
        this.elements.optionsContainer.innerHTML = '';
        scenario.options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = option.text;
            btn.addEventListener('click', () => this.handleOption(option.id, option.correct));
            this.elements.optionsContainer.appendChild(btn);
        });

        // Hide feedback
        this.elements.feedbackOverlay.classList.remove('visible', 'success', 'error');
    }

    handleOption(optionId, isCorrect) {
        if (this.gameState === 'locked') return;

        if (isCorrect) {
            this.handleSuccess();
        } else {
            this.handleError();
        }
    }

    handleSuccess() {
        const scenario = CONFIG.SCENARIOS[this.currentScenarioIndex];
        
        // Mark as completed
        if (!this.completedScenarios.includes(scenario.id)) {
            this.completedScenarios.push(scenario.id);
            this.syncLevel = Math.min(this.syncLevel + CONFIG.GAMEPLAY.syncIncrease, 100);
        }

        this.updateSyncUI();
        
        this.showFeedback('success', '✅ Interferência eliminada', '+20% Sincronização');
        
        // Re-render buttons (removes the completed one)
        this.renderInteractionButtons();

        setTimeout(() => {
            this.elements.feedbackOverlay.classList.remove('visible');
            this.clearRightPanel(); // Reset right panel state

            if (this.completedScenarios.length >= CONFIG.SCENARIOS.length) {
                this.handleVictory();
            }
        }, 1500);
    }

    handleError() {
        this.setGameState('locked');

        const penaltySeconds = CONFIG.GAMEPLAY.wrongAnswerPenaltySeconds || 10;
        const appliedViaSessionTimer =
            window.EscapeRoomSessionTimer &&
            typeof window.EscapeRoomSessionTimer.applyPenaltySeconds === 'function' &&
            window.EscapeRoomSessionTimer.applyPenaltySeconds(penaltySeconds);

        if (!appliedViaSessionTimer) {
            const rawDeadline = parseInt(localStorage.getItem('escaperoom_deadline_ts') || '0', 10);
            if (Number.isFinite(rawDeadline) && rawDeadline > 0) {
                localStorage.setItem('escaperoom_deadline_ts', String(rawDeadline - (penaltySeconds * 1000)));
            }
        }
        
        // Removed wait time, just show feedback briefly
        this.showFeedback('error', '❌ Solução incorreta!', `- ${penaltySeconds}s no tempo geral. Tente novamente...`);
        
        setTimeout(() => {
            this.elements.feedbackOverlay.classList.remove('visible');
            this.setGameState('playing'); // Resume game on same screen
        }, 1500);
    }


    showFeedback(type, title, message) {
        this.elements.feedbackOverlay.className = `feedback-overlay visible ${type}`;
        this.elements.feedbackTitle.textContent = title;
        this.elements.feedbackMessage.textContent = message;
    }

    handleVictory() {
        this.setGameState('victory');
        this.showScreen('victory');
        // Update victory screen stats if needed
    }
}

window.onload = () => new GameController();

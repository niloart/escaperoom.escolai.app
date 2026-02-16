/**
 * Classe principal do jogo Office Traffic Controller
 */

class Game {
    constructor() {
        this.isRunning = false;
        this.timeRemaining = CONFIG.GAME_DURATION;
        this.currentPhase = 1;
        this.employees = [];
        this.completedCount = 0;
        this.spawnedCount = 0;

        this.employeeFactory = new EmployeeFactory();
        this.dragDropManager = null;

        this.gameLoopInterval = null;
        this.spawnInterval = null;
        this.timerInterval = null;

        this.cacheElements();
        this.setupEventListeners();
    }

    /**
     * Cache dos elementos DOM
     */
    cacheElements() {
        this.elements = {
            missionScreen: document.getElementById('mission-screen'),
            gameArea: document.getElementById('game-area'),
            timer: document.getElementById('timer'),
            phaseText: document.getElementById('phase-text'),
            completed: document.getElementById('completed'),
            progressFill: document.getElementById('progress-fill'),
            receptionSlots: document.getElementById('reception-slots'),
            waitingSlots: document.getElementById('waiting-slots'),
            workSlots: document.querySelectorAll('.work-slot'),
            messageOverlay: document.getElementById('message-overlay'),
            messageBox: document.getElementById('message-box'),
            messageIcon: document.getElementById('message-icon'),
            messageTitle: document.getElementById('message-title'),
            messageText: document.getElementById('message-text'),
            messageStats: document.getElementById('message-stats'),
            restartBtnOverlay: document.getElementById('restart-btn-overlay'),
            returnPanelBtn: document.getElementById('return-panel-btn'),
            toast: document.getElementById('toast'),
            continueBtn: document.getElementById('continue-btn')
        };
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        this.elements.continueBtn.addEventListener('click', () => this.start());
        this.elements.restartBtnOverlay.addEventListener('click', () => this.restart());
    }

    /**
     * Reinicia o jogo (volta para o ecrã de missão)
     */
    restart() {
        this.elements.messageOverlay.classList.add('hidden');
        this.elements.gameArea.classList.remove('hidden');
        this.elements.missionScreen.classList.remove('hidden');
    }

    /**
     * Inicia o jogo
     */
    start() {
        // Esconde o ecrã de missão
        this.elements.missionScreen.classList.add('hidden');

        // Reset do estado
        this.isRunning = true;
        this.timeRemaining = CONFIG.GAME_DURATION;
        this.currentPhase = 1;
        this.employees = [];
        this.completedCount = 0;
        this.spawnedCount = 0;

        // Reset da factory
        this.employeeFactory.reset();

        // Limpar elementos
        this.clearAllSlots();

        // Atualizar UI
        this.elements.gameArea.classList.remove('hidden');
        this.elements.messageOverlay.classList.add('hidden');
        this.updateTimerUI();
        this.updatePhaseUI();
        this.updateProgressUI();
        this.updateCounts();

        // Inicializar drag and drop
        this.dragDropManager = new DragDropManager(this);

        // Spawn inicial
        this.spawnEmployee();

        // Iniciar intervals
        this.gameLoopInterval = setInterval(() => this.gameLoop(), CONFIG.UPDATE_INTERVAL);
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
        this.scheduleNextSpawn();
    }

    /**
     * Limpa todos os slots
     */
    clearAllSlots() {
        this.elements.receptionSlots.innerHTML = `
            <span class="slot-placeholder"></span>
            <span class="slot-placeholder"></span>
            <span class="slot-placeholder"></span>
            <span class="slot-placeholder"></span>
        `;
        this.elements.waitingSlots.innerHTML = `
            <span class="slot-placeholder"></span>
            <span class="slot-placeholder"></span>
            <span class="slot-placeholder"></span>
        `;

        this.elements.workSlots.forEach(slot => {
            const employee = slot.querySelector('.employee');
            if (employee) employee.remove();
            slot.classList.remove('occupied');

            const timer = slot.querySelector('.slot-timer');
            if (timer) timer.classList.add('hidden');
        });
    }

    /**
     * Loop principal do jogo
     */
    gameLoop() {
        if (!this.isRunning) return;

        const deltaTime = CONFIG.UPDATE_INTERVAL / 1000;

        // Atualizar cada colaborador
        for (let i = this.employees.length - 1; i >= 0; i--) {
            const employee = this.employees[i];

            // Atualizar paciência (apenas se não estiver trabalhando)
            if (!employee.isWorking) {
                const hasPatience = employee.updatePatience(deltaTime);

                if (!hasPatience) {
                    this.gameOver(false, employee);
                    return;
                }
            }

            // Atualizar trabalho
            if (employee.isWorking) {
                const completed = employee.updateWork();

                if (completed) {
                    this.completeEmployee(employee);
                }
            }

            employee.updateUI();
        }

        // Verificar vitória
        if (this.completedCount >= CONFIG.TOTAL_EMPLOYEES) {
            this.gameOver(true);
        }
    }

    /**
     * Agenda o próximo spawn de colaborador
     */
    scheduleNextSpawn() {
        if (!this.isRunning) return;
        if (this.spawnedCount >= CONFIG.TOTAL_EMPLOYEES) return;

        const phase = CONFIG.PHASES[this.currentPhase];
        const interval = phase.spawnInterval;

        this.spawnInterval = setTimeout(() => {
            if (this.isRunning) {
                this.spawnEmployee();
                this.scheduleNextSpawn();
            }
        }, interval);
    }

    /**
     * Cria um novo colaborador
     */
    spawnEmployee() {
        if (this.spawnedCount >= CONFIG.TOTAL_EMPLOYEES) return;

        // Verificar se a receção está cheia (limite de 4 cards)
        const receptionCount = this.elements.receptionSlots.querySelectorAll('.employee').length;
        if (receptionCount >= 4) return;

        // Determinar tipo baseado nos colaboradores disponíveis
        const type = this.getBalancedType();

        const employee = this.employeeFactory.create(type);

        // Se não há mais colaboradores disponíveis, retorna
        if (!employee) return;

        const element = employee.createElement();

        this.elements.receptionSlots.appendChild(element);
        this.dragDropManager.attachDragEvents(element);

        this.employees.push(employee);
        this.spawnedCount++;

        this.updateCounts();

        // Mostrar toast no primeiro spawn
        if (this.spawnedCount === 1) {
            this.showToast(`${employee.name} chegou! Arraste para a sala correta.`, 'success');
        }
    }

    /**
     * Obtém um tipo balanceado para spawn
     */
    getBalancedType() {
        // Retorna tipo aleatório baseado nos colaboradores ainda disponíveis
        return this.employeeFactory.getRandomType();
    }

    /**
     * Completa um colaborador (terminou o trabalho)
     */
    completeEmployee(employee) {
        // Remover do array
        this.employees = this.employees.filter(e => e.id !== employee.id);

        // Liberar o slot
        const slot = document.querySelector(`[data-slot="${employee.slotId}"]`);
        if (slot) {
            slot.classList.remove('occupied');
            const timer = slot.querySelector('.slot-timer');
            if (timer) timer.classList.add('hidden');
        }

        // Animação de saída
        employee.remove();

        // Atualizar contagem
        this.completedCount++;
        this.updateProgressUI();
        this.updateCounts();

        this.showToast(`✅ ${employee.name} concluiu a tarefa!`, 'success');
    }

    /**
     * Atualiza o timer
     */
    updateTimer() {
        if (!this.isRunning) return;

        this.timeRemaining--;
        this.updateTimerUI();
        this.checkPhaseTransition();

        if (this.timeRemaining <= 0) {
            // Tempo esgotado - verifica se completou todos
            if (this.completedCount >= CONFIG.TOTAL_EMPLOYEES) {
                this.gameOver(true);
            } else {
                this.gameOver(false);
            }
        }
    }

    /**
     * Verifica e realiza transição de fase
     */
    checkPhaseTransition() {
        const elapsedTime = CONFIG.GAME_DURATION - this.timeRemaining;

        for (const [phaseNum, phase] of Object.entries(CONFIG.PHASES)) {
            if (elapsedTime >= phase.startTime && elapsedTime < phase.endTime) {
                if (parseInt(phaseNum) !== this.currentPhase) {
                    this.currentPhase = parseInt(phaseNum);
                    this.updatePhaseUI();
                    this.showToast(`📢 Fase ${this.currentPhase}: ${phase.name}`, 'warning');
                }
                break;
            }
        }
    }

    /**
     * Aplica penalidade por colocar em local errado
     */
    applyPenalty() {
        const appliedViaSessionTimer =
            window.EscapeRoomSessionTimer &&
            typeof window.EscapeRoomSessionTimer.applyPenaltySeconds === 'function' &&
            window.EscapeRoomSessionTimer.applyPenaltySeconds(CONFIG.WRONG_PLACE_PENALTY);

        if (!appliedViaSessionTimer) {
            const rawDeadline = parseInt(localStorage.getItem('escaperoom_deadline_ts') || '0', 10);
            if (Number.isFinite(rawDeadline) && rawDeadline > 0) {
                localStorage.setItem(
                    'escaperoom_deadline_ts',
                    String(rawDeadline - (CONFIG.WRONG_PLACE_PENALTY * 1000))
                );
            }
        }

        this.showToast(`❌ Local errado! -${CONFIG.WRONG_PLACE_PENALTY}s no tempo geral`, 'error');
    }

    /**
     * Game Over (vitória ou derrota)
     */
    gameOver(victory, failedEmployee = null) {
        this.isRunning = false;

        clearInterval(this.gameLoopInterval);
        clearInterval(this.timerInterval);
        clearTimeout(this.spawnInterval);

        this.elements.messageOverlay.classList.remove('hidden');

        if (victory) {
            this.elements.messageBox.className = 'victory';
            this.elements.messageIcon.textContent = '';
            this.elements.messageTitle.textContent = 'FLUXO OTIMIZADO';
            this.elements.messageText.textContent =
                'Parabéns! Todos os colaboradores encontraram o seu espaço. Fluxo de navegação definido!';

            // Mostrar botão de retorno ao painel
            if (this.elements.returnPanelBtn) {
                this.elements.returnPanelBtn.classList.remove('hidden');
            }

            // Esconder botão de recomeçar na vitória
            this.elements.restartBtnOverlay.classList.add('hidden');

            // Ocultar estatísticas
            this.elements.messageStats.classList.add('hidden');
        } else {
            this.elements.messageBox.className = 'defeat';
            this.elements.messageIcon.textContent = '';

            // Esconder botão de retorno na derrota
            if (this.elements.returnPanelBtn) {
                this.elements.returnPanelBtn.classList.add('hidden');
            }

            // Mostrar botão de recomeçar apenas na derrota
            this.elements.restartBtnOverlay.classList.remove('hidden');

            this.elements.messageTitle.textContent = 'GAME OVER';
            this.elements.messageText.textContent = 'O Colaborador esperou tempo demais';

            // Ocultar estatísticas na derrota
            this.elements.messageStats.classList.add('hidden');
        }
    }

    /**
     * Obtém colaborador por ID
     */
    getEmployeeById(id) {
        return this.employees.find(e => e.id === id);
    }

    /**
     * Atualiza contagens
     */
    updateCounts() {
        // Contagens removidas da UI - função mantida para compatibilidade
    }

    /**
     * Atualiza contagem da sala de espera
     */
    updateWaitingCount() {
        // Contagens removidas da UI - função mantida para compatibilidade
    }

    /**
     * Atualiza UI do timer
     */
    updateTimerUI() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;

        this.elements.timer.textContent =
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        this.elements.timer.classList.remove('warning', 'danger');

        if (this.timeRemaining <= 30) {
            this.elements.timer.classList.add('danger');
        } else if (this.timeRemaining <= 60) {
            this.elements.timer.classList.add('warning');
        }
    }

    /**
     * Atualiza UI da fase
     */
    updatePhaseUI() {
        const phase = CONFIG.PHASES[this.currentPhase];
        this.elements.phaseText.textContent = `Fase ${this.currentPhase}: ${phase.name}`;
    }

    /**
     * Atualiza UI do progresso
     */
    updateProgressUI() {
        this.elements.completed.textContent = this.completedCount;

        const progress = (this.completedCount / CONFIG.TOTAL_EMPLOYEES) * 100;
        this.elements.progressFill.style.width = `${progress}%`;
    }

    /**
     * Mostra toast de feedback
     */
    showToast(message, type = 'error') {
        this.elements.toast.textContent = message;
        this.elements.toast.className = `show ${type}`;

        setTimeout(() => {
            this.elements.toast.className = '';
        }, 2500);
    }
}

// Inicializar o jogo quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

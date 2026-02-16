/**
 * Sistema de Drag and Drop para o jogo
 */

class DragDropManager {
    constructor(game) {
        this.game = game;
        this.isDragging = false;
        this.draggedEmployee = null;
        this.draggedElement = null;
        this.originalParent = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.isResolvingWrongDrop = false;

        this.waitingSlots = document.getElementById('waiting-slots');
        this.workSlots = document.querySelectorAll('.work-slot');

        this.setupEventListeners();
    }

    /**
     * Configura os event listeners globais
     */
    setupEventListeners() {
        // Prevenir menu de contexto em dispositivos móveis
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.employee')) {
                e.preventDefault();
            }
        });

        // Event listeners para movimento e soltar
        document.addEventListener('mousemove', (e) => this.onDrag(e));
        document.addEventListener('mouseup', (e) => this.endDrag(e));
        document.addEventListener('touchmove', (e) => this.onDrag(e), { passive: false });
        document.addEventListener('touchend', (e) => this.endDrag(e));
    }

    /**
     * Anexa eventos de drag a um elemento de colaborador
     * @param {HTMLElement} element - Elemento do colaborador
     */
    attachDragEvents(element) {
        element.addEventListener('mousedown', (e) => this.startDrag(e));
        element.addEventListener('touchstart', (e) => this.startDrag(e), { passive: false });
    }

    /**
     * Inicia o arrasto
     */
    startDrag(e) {
        if (!this.game.isRunning || this.isResolvingWrongDrop) return;

        const el = e.target.closest('.employee');
        if (!el || el.classList.contains('working')) return;

        e.preventDefault();
        this.isDragging = true;

        const employeeId = parseInt(el.dataset.id);
        this.draggedEmployee = this.game.getEmployeeById(employeeId);
        this.draggedElement = el;
        this.originalParent = el.parentElement;

        const rect = el.getBoundingClientRect();
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;

        this.dragOffsetX = clientX - rect.left;
        this.dragOffsetY = clientY - rect.top;

        el.classList.add('dragging');
        el.style.position = 'fixed';
        el.style.zIndex = '1000';
        el.style.left = `${clientX - this.dragOffsetX}px`;
        el.style.top = `${clientY - this.dragOffsetY}px`;
        el.style.width = `${rect.width}px`;

        document.body.appendChild(el);
    }

    /**
     * Durante o arrasto
     */
    onDrag(e) {
        if (!this.isDragging || !this.draggedElement) return;

        e.preventDefault();

        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        if (clientX === undefined || clientY === undefined) return;

        this.draggedElement.style.left = `${clientX - this.dragOffsetX}px`;
        this.draggedElement.style.top = `${clientY - this.dragOffsetY}px`;

        this.highlightDropZones(clientX, clientY);
    }

    /**
     * Destaca as zonas de drop válidas
     */
    highlightDropZones(x, y) {
        // Limpar todos os highlights
        this.clearHighlights();

        if (!this.draggedEmployee) return;

        // Verificar sala de espera
        const waitingRect = this.waitingSlots.getBoundingClientRect();
        if (this.isPointInRect(x, y, waitingRect)) {
            this.waitingSlots.classList.add('highlight');
        }

        // Verificar slots de trabalho
        this.workSlots.forEach(slot => {
            const rect = slot.getBoundingClientRect();
            if (this.isPointInRect(x, y, rect)) {
                if (slot.querySelector('.employee')) {
                    // Slot ocupado
                    return;
                }

                if (slot.dataset.type === this.draggedEmployee.type) {
                    slot.classList.add('highlight');
                }
            }
        });
    }

    /**
     * Limpa todos os highlights
     */
    clearHighlights() {
        this.waitingSlots.classList.remove('highlight');
        this.workSlots.forEach(slot => {
            slot.classList.remove('highlight');
            slot.classList.remove('invalid');
        });
    }

    /**
     * Finaliza o arrasto
     */
    endDrag(e) {
        if (!this.isDragging) return;

        this.isDragging = false;

        if (!this.draggedEmployee || !this.draggedElement) {
            this.clearHighlights();
            return;
        }

        const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
        const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);

        let placed = false;

        // Tentar colocar na sala de espera
        const waitingRect = this.waitingSlots.getBoundingClientRect();
        if (this.isPointInRect(clientX, clientY, waitingRect)) {
            this.placeInWaitingRoom();
            placed = true;
        }

        // Tentar colocar em slot de trabalho
        if (!placed) {
            for (const slot of this.workSlots) {
                const rect = slot.getBoundingClientRect();
                if (this.isPointInRect(clientX, clientY, rect)) {
                    if (!slot.querySelector('.employee')) {
                        if (slot.dataset.type === this.draggedEmployee.type) {
                            this.placeInWorkSlot(slot);
                            placed = true;
                        } else {
                            this.handleWrongPlacement(clientX, clientY);
                            placed = true;
                        }
                    }
                    break;
                }
            }
        }

        // Quando for local errado, o retorno ocorre após animação
        if (this.isResolvingWrongDrop) {
            this.clearHighlights();
            return;
        }

        // Retornar ao local original se não foi colocado
        if (!placed) {
            this.returnToOriginal();
        }

        this.cleanupDragState();
    }

    /**
     * Coloca o colaborador na sala de espera
     */
    placeInWaitingRoom() {
        // Verificar se a sala de espera está cheia (limite de 3 cards)
        const waitingCount = this.waitingSlots.querySelectorAll('.employee').length;
        if (waitingCount >= 3) {
            this.returnToOriginal();
            this.game.showToast('⚠️ Sala de espera cheia! Máximo 3 pessoas.', 'error');
            return;
        }

        this.resetElementPosition(this.draggedElement);
        this.waitingSlots.appendChild(this.draggedElement);

        this.draggedEmployee.moveTo('waiting');
        this.game.updateWaitingCount();

        this.game.showToast('🪑 Aguardando na sala de espera', 'success');
    }

    /**
     * Coloca o colaborador em um slot de trabalho
     */
    placeInWorkSlot(slot) {
        this.resetElementPosition(this.draggedElement);
        slot.appendChild(this.draggedElement);
        slot.classList.add('occupied');

        this.draggedEmployee.moveTo('working', slot.dataset.slot);
        this.draggedEmployee.startWorking();

        // Mostrar timer no slot
        this.showSlotTimer(slot, this.draggedEmployee);

        this.game.updateCounts();
    }

    /**
     * Mostra o timer no slot de trabalho
     */
    showSlotTimer(slot, employee) {
        const timerEl = slot.querySelector('.card-timer');

        if (timerEl) {
            timerEl.classList.remove('hidden');

            const updateTimer = () => {
                if (!employee.isWorking) {
                    timerEl.classList.add('hidden');
                    return;
                }

                const remaining = employee.getRemainingWorkTime();
                timerEl.textContent = `⏱️ ${remaining}s`;

                if (remaining > 0) {
                    requestAnimationFrame(updateTimer);
                } else {
                    timerEl.classList.add('hidden');
                }
            };

            updateTimer();
        }
    }

    /**
     * Trata colocação em local errado
     */
    handleWrongPlacement(x, y) {
        if (!this.draggedElement || !this.draggedEmployee) return;

        this.isResolvingWrongDrop = true;
        const element = this.draggedElement;
        const employee = this.draggedEmployee;
        const originalParent = this.originalParent;
        element.classList.add('wrong-drop');

        this.game.applyPenalty();
        this.showErrorTooltip(x, y);

        setTimeout(() => {
            element.classList.remove('wrong-drop');
            this.returnSpecificToOriginal(element, employee, originalParent);
            this.isResolvingWrongDrop = false;
            this.cleanupDragState();
        }, 450);
    }

    /**
     * Mostra tooltip de erro
     */
    showErrorTooltip(x, y) {
        const tooltip = document.getElementById('error-tooltip');
        tooltip.style.left = `${x + 10}px`;
        tooltip.style.top = `${y - 40}px`;
        tooltip.classList.remove('hidden');

        setTimeout(() => {
            tooltip.classList.add('hidden');
        }, 1500);
    }

    /**
     * Retorna o colaborador ao local original
     */
    returnToOriginal() {
        if (!this.draggedElement || !this.draggedEmployee) return;
        this.returnSpecificToOriginal(this.draggedElement, this.draggedEmployee, this.originalParent);
    }

    /**
     * Retorna um elemento para seu local original
     */
    returnSpecificToOriginal(element, employee, originalParent) {
        this.resetElementPosition(element);

        if (employee.location === 'reception') {
            document.getElementById('reception-slots').appendChild(element);
        } else if (employee.location === 'waiting') {
            this.waitingSlots.appendChild(element);
        } else if (originalParent) {
            originalParent.appendChild(element);
        }
    }

    /**
     * Limpa estado de drag atual
     */
    cleanupDragState() {
        this.clearHighlights();

        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
        }

        this.draggedElement = null;
        this.draggedEmployee = null;
        this.originalParent = null;
    }

    /**
     * Reseta a posição do elemento
     */
    resetElementPosition(element) {
        element.style.position = '';
        element.style.left = '';
        element.style.top = '';
        element.style.width = '';
        element.style.zIndex = '';
    }

    /**
     * Verifica se um ponto está dentro de um retângulo
     */
    isPointInRect(x, y, rect) {
        return x >= rect.left && x <= rect.right &&
            y >= rect.top && y <= rect.bottom;
    }
}

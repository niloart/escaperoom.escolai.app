class CofresGame {
    constructor() {
        this.lockers = [];
        this.state = "INTRO";
        this.timeLeft = CONFIG.PHASE2.INITIAL_TIME;
        this.timerInterval = null;
        this.gameTimerSeconds = 300;
        this.gameTimerInterval = null;
        this.selectedLockerId = null;
        this.targetLockerId = null;
        this.targetPin = null;
        this.keypadInput = "";
        this.selectedPhase1ItemId = null;
        this.phase1Registry = new Map();
        this.lastPhase1Interaction = 0;
        this.hintGlowTimer = null;
        this.currentHintItemId = null;
        this.phase2GuideToastTimer = null;

        this.elements = {
            gameScreen: document.getElementById("game-screen"),
            startScreen: document.getElementById("start-screen"),
            endScreen: document.getElementById("end-screen"),
            endContent: document.getElementById("end-content"),
            keypadModal: document.getElementById("keypad-modal"),
            lockersIntroScreen: document.getElementById("lockers-intro-screen"),
            lockersIntroButton: document.getElementById("lockers-intro-btn"),
            lockersGrid: document.getElementById("lockers-grid"),
            startButton: document.getElementById("start-btn"),
            keypadDisplay: document.getElementById("keypad-display"),
            keypadMessage: document.getElementById("keypad-message"),
            keypadKeys: document.querySelectorAll(".keypad-btn"),
            keypadClose: document.getElementById("keypad-close"),
            startMessage: document.getElementById("start-message"),
            phase1Board: document.getElementById("phase1-board"),
            itemsLayer: document.getElementById("items-layer"),
            choiceMenu: document.getElementById("choice-menu"),
            choiceButtons: document.querySelectorAll(".choice-btn"),
            phase1ErrorToast: document.getElementById("phase1-error-toast"),
            phase2GuideToast: document.getElementById("phase2-guide-toast")
        };

        this.setupStaticTexts();
        this.setupEventListeners();
    }

    setupStaticTexts() {
        if (this.elements.startMessage) {
            this.elements.startMessage.innerHTML = CONFIG.TEXTS.introMessage.replace("\n", "<br>");
        }
        this.elements.phase1Board.style.backgroundImage = `url('${CONFIG.PHASE1.BOARD_BACKGROUND}')`;
    }

    setupEventListeners() {
        this.elements.startButton.addEventListener("click", () => this.start());
        if (this.elements.lockersIntroButton) {
            this.elements.lockersIntroButton.addEventListener("click", () => {
                if (this.state === "PHASE2_WAITING_START") {
                    this.startPhase2Setup();
                }
            });
        }
        this.elements.keypadClose.addEventListener("click", () => this.closeKeypad());

        this.elements.keypadKeys.forEach((key) => {
            key.addEventListener("click", (e) => {
                const value = e.currentTarget.dataset.key;
                if (value) {
                    this.handleKeypadInput(value);
                }
            });
        });

        this.elements.choiceButtons.forEach((btn) => {
            btn.addEventListener("click", (event) => {
                event.stopPropagation();
                const choice = event.currentTarget.dataset.choice;
                if (choice) {
                    this.handlePhase1Choice(choice);
                }
            });
        });

        this.elements.phase1Board.addEventListener("click", (event) => {
            if (event.target === this.elements.phase1Board || event.target === this.elements.itemsLayer) {
                this.hideChoiceMenu();
            }
        });
    }

    resetPhase1Interaction() {
        this.lastPhase1Interaction = Date.now();
    }

    removeHintGlow() {
        this.elements.itemsLayer.querySelectorAll(".table-item.hint-glow").forEach((el) => {
            el.classList.remove("hint-glow");
        });
        this.currentHintItemId = null;
    }

    startPhase1HintTimer() {
        if (this.hintGlowTimer) {
            clearInterval(this.hintGlowTimer);
            this.hintGlowTimer = null;
        }
        this.lastPhase1Interaction = Date.now();

        this.hintGlowTimer = setInterval(() => {
            if (this.state !== "PHASE1") {
                return;
            }
            if (this.elements.choiceMenu && !this.elements.choiceMenu.classList.contains("hidden")) {
                return;
            }
            if (this.currentHintItemId) {
                const currentHintItem = this.phase1Registry.get(this.currentHintItemId);
                if (currentHintItem && !currentHintItem.resolved && currentHintItem.element && currentHintItem.element.isConnected) {
                    return;
                }
                this.currentHintItemId = null;
            }
            const elapsed = Date.now() - this.lastPhase1Interaction;
            if (elapsed < 5000) {
                return;
            }
            const visibleItems = [...this.phase1Registry.values()].filter(
                (item) => !item.resolved && item.element && item.element.isConnected
            );
            if (visibleItems.length === 0) {
                return;
            }
            this.removeHintGlow();
            const randomItem = visibleItems[Math.floor(Math.random() * visibleItems.length)];
            randomItem.element.classList.add("hint-glow");
            this.currentHintItemId = randomItem.id;
        }, 500);
    }

    stopPhase1HintTimer() {
        if (this.hintGlowTimer) {
            clearInterval(this.hintGlowTimer);
            this.hintGlowTimer = null;
        }
        this.removeHintGlow();
    }

    showLocalIncorretoToast() {
        const toast = this.elements.phase1ErrorToast;
        if (!toast) return;
        toast.textContent = CONFIG.TEXTS.localIncorreto || "Local incorreto!";
        toast.classList.remove("hidden");
        setTimeout(() => {
            toast.classList.add("hidden");
        }, 2000);
    }

    hidePhase2GuideToast() {
        if (this.phase2GuideToastTimer) {
            clearTimeout(this.phase2GuideToastTimer);
            this.phase2GuideToastTimer = null;
        }
        if (this.elements.phase2GuideToast) {
            this.elements.phase2GuideToast.classList.add("hidden");
        }
    }

    schedulePhase2GuideToast() {
        this.hidePhase2GuideToast();
        if (!this.elements.phase2GuideToast) {
            return;
        }

        this.phase2GuideToastTimer = setTimeout(() => {
            this.elements.phase2GuideToast.textContent =
                CONFIG.TEXTS.phase2FindLockerPrompt ||
                "Agora, encontre ter cacifo e insira a senha para coletar seus pertences";
            this.elements.phase2GuideToast.classList.remove("hidden");

            this.phase2GuideToastTimer = setTimeout(() => {
                if (this.elements.phase2GuideToast) {
                    this.elements.phase2GuideToast.classList.add("hidden");
                }
                this.phase2GuideToastTimer = null;
            }, 5000);
        }, 2000);
    }

    start() {
        this.hidePhase2GuideToast();
        this.state = "PHASE1";
        this.elements.startScreen.classList.add("hidden");
        this.elements.endScreen.classList.add("hidden");
        this.elements.gameScreen.classList.remove("hidden");
        this.elements.keypadModal.classList.add("hidden");

        this.elements.phase1Board.classList.remove("hidden");
        if (this.elements.lockersIntroScreen) {
            this.elements.lockersIntroScreen.classList.add("hidden");
        }
        this.elements.lockersGrid.classList.add("hidden");

        this.buildPhase1Items();
        this.startPhase1HintTimer();
        this.startGameTimer();
    }

    startGameTimer() {
        if (this.gameTimerInterval) {
            clearInterval(this.gameTimerInterval);
        }
        this.gameTimerSeconds = 300;
        const timerEl = document.getElementById('game-timer');
        const updateDisplay = () => {
            if (!timerEl) return;
            const m = Math.floor(this.gameTimerSeconds / 60).toString().padStart(2, '0');
            const s = (this.gameTimerSeconds % 60).toString().padStart(2, '0');
            timerEl.textContent = `${m}:${s}`;
            timerEl.classList.remove('warning', 'danger');
            if (this.gameTimerSeconds <= 30) {
                timerEl.classList.add('danger');
            } else if (this.gameTimerSeconds <= 60) {
                timerEl.classList.add('warning');
            }
        };
        updateDisplay();
        this.gameTimerInterval = setInterval(() => {
            this.gameTimerSeconds--;
            updateDisplay();
            if (this.gameTimerSeconds <= 0) {
                clearInterval(this.gameTimerInterval);
                this.gameTimerInterval = null;
                if (this.state !== "GAME_OVER") {
                    this.gameOver(false);
                }
            }
        }, 1000);
    }

    buildPhase1Items() {
        this.elements.itemsLayer.innerHTML = "";
        this.phase1Registry.clear();

        const createButton = (itemDef, type) => {
            const itemButton = document.createElement("button");
            itemButton.type = "button";
            itemButton.className = `table-item ${type}`;
            itemButton.dataset.itemId = itemDef.id;
            itemButton.style.left = `${itemDef.x}px`;
            itemButton.style.top = `${itemDef.y}px`;

            if (type === "hotspot") {
                itemButton.style.width = `${itemDef.width}px`;
                itemButton.style.height = `${itemDef.height}px`;
                itemButton.setAttribute("aria-label", itemDef.id);
            } else {
                if (typeof itemDef.width === "number") {
                    itemButton.style.width = `${itemDef.width}px`;
                } else {
                    itemButton.style.width = `${CONFIG.PHASE1.ITEM_DEFAULT_SIZE.width}px`;
                }

                if (typeof itemDef.height === "number") {
                    itemButton.style.height = `${itemDef.height}px`;
                } else {
                    itemButton.style.height = `${CONFIG.PHASE1.ITEM_DEFAULT_SIZE.height}px`;
                }
                const image = document.createElement("img");
                image.src = itemDef.image;
                image.alt = itemDef.id;
                image.draggable = false;
                itemButton.appendChild(image);
            }

            itemButton.addEventListener("click", (event) => {
                event.stopPropagation();
                this.handlePhase1ItemClick(itemDef.id, event.currentTarget);
            });

            this.elements.itemsLayer.appendChild(itemButton);
            this.phase1Registry.set(itemDef.id, {
                ...itemDef,
                type,
                resolved: false,
                element: itemButton
            });
        };

        CONFIG.PHASE1.ITEMS.forEach((itemDef) => createButton(itemDef, "sprite"));
        CONFIG.PHASE1.HOTSPOTS.forEach((itemDef) => createButton(itemDef, "hotspot"));
    }

    handlePhase1ItemClick(itemId, element) {
        if (this.state !== "PHASE1") {
            return;
        }

        const itemData = this.phase1Registry.get(itemId);
        if (!itemData || itemData.resolved) {
            return;
        }

        this.selectedPhase1ItemId = itemId;
        this.showChoiceMenuNearElement(element);
    }

    showChoiceMenuNearElement(element) {
        const boardRect = this.elements.phase1Board.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const menuWidth = 185;
        const menuHeight = 150;

        let left = elementRect.left - boardRect.left + elementRect.width + 8;
        let top = elementRect.top - boardRect.top - 8;

        if (left + menuWidth > boardRect.width - 8) {
            left = elementRect.left - boardRect.left - menuWidth - 8;
        }

        if (top + menuHeight > boardRect.height - 8) {
            top = boardRect.height - menuHeight - 8;
        }

        if (top < 8) {
            top = 8;
        }

        this.elements.choiceMenu.style.left = `${left}px`;
        this.elements.choiceMenu.style.top = `${top}px`;
        this.elements.choiceMenu.classList.remove("hidden");
    }

    hideChoiceMenu() {
        this.elements.choiceMenu.classList.add("hidden");
        this.selectedPhase1ItemId = null;
    }

    handlePhase1Choice(choice) {
        if (!this.selectedPhase1ItemId || this.state !== "PHASE1") {
            return;
        }

        const itemData = this.phase1Registry.get(this.selectedPhase1ItemId);
        if (!itemData) {
            this.hideChoiceMenu();
            return;
        }

        const isCorrect = choice === itemData.destination;

        if (isCorrect) {
            this.playSound("success");
            if (this.currentHintItemId === itemData.id) {
                this.removeHintGlow();
            }
            this.markPhase1ItemResolved(itemData);
            this.resetPhase1Interaction();
            this.checkPhase1Completion();
        } else {
            this.applyWrongDestinationPenalty();
            this.playSound("error");
            itemData.element.classList.add("shake");
            setTimeout(() => {
                itemData.element.classList.remove("shake");
            }, 450);
            this.showLocalIncorretoToast();
        }

        this.hideChoiceMenu();
    }

    applyWrongDestinationPenalty() {
        const penaltySeconds = CONFIG.WRONG_DESTINATION_PENALTY_SECONDS || 10;
        const appliedViaSessionTimer =
            window.EscapeRoomSessionTimer &&
            typeof window.EscapeRoomSessionTimer.applyPenaltySeconds === "function" &&
            window.EscapeRoomSessionTimer.applyPenaltySeconds(penaltySeconds);

        if (!appliedViaSessionTimer) {
            const rawDeadline = parseInt(localStorage.getItem("escaperoom_deadline_ts") || "0", 10);
            if (Number.isFinite(rawDeadline) && rawDeadline > 0) {
                localStorage.setItem("escaperoom_deadline_ts", String(rawDeadline - (penaltySeconds * 1000)));
            }
        }
    }

    markPhase1ItemResolved(itemData) {
        itemData.resolved = true;
        itemData.element.disabled = true;

        if (itemData.keepOnTable) {
            itemData.element.classList.add("resolved");
            return;
        }

        itemData.element.classList.add("vanish");
        setTimeout(() => {
            itemData.element.remove();
        }, 180);
    }

    checkPhase1Completion() {
        const pending = [...this.phase1Registry.values()].some((item) => !item.resolved);
        if (pending) {
            return;
        }

        this.state = "PHASE1_COMPLETE";
        this.stopPhase1HintTimer();
        setTimeout(() => this.showPhase2Instructions(), 1100);
    }

    showPhase2Instructions() {
        this.hidePhase2GuideToast();
        this.state = "PHASE2_WAITING_START";
        this.hideChoiceMenu();
        this.elements.phase1Board.classList.add("hidden");
        this.elements.lockersGrid.classList.add("hidden");
        if (this.elements.lockersIntroScreen) {
            this.elements.lockersIntroScreen.classList.remove("hidden");
        }
    }

    startPhase2Setup() {
        this.hidePhase2GuideToast();
        this.state = "PHASE2_SETUP_SELECTION";
        this.timeLeft = CONFIG.PHASE2.INITIAL_TIME;
        this.targetLockerId = null;
        this.targetPin = null;
        this.selectedLockerId = null;
        this.keypadInput = "";

        this.hideChoiceMenu();
        this.elements.phase1Board.classList.add("hidden");
        if (this.elements.lockersIntroScreen) {
            this.elements.lockersIntroScreen.classList.add("hidden");
        }
        this.elements.lockersGrid.classList.remove("hidden");

        this.initLockers();
    }

    initLockers() {
        this.lockers = [];
        for (let i = CONFIG.PHASE2.LOCKER_START; i <= CONFIG.PHASE2.LOCKER_END; i++) {
            this.lockers.push({
                id: i,
                status: "AVAILABLE"
            });
        }
        this.renderLockers();
    }

    renderLockers() {
        this.elements.lockersGrid.innerHTML = "";

        this.lockers.forEach((locker) => {
            const el = document.createElement("div");
            const searchingMode = this.state === "PHASE2_GAME_SEARCH" || this.state === "PHASE2_GAME_PIN";
            el.className = `locker ${searchingMode ? "" : "available"}`.trim();
            el.dataset.id = locker.id;

            const interior = document.createElement("div");
            interior.className = "locker-interior";
            interior.innerHTML =
                locker.status === "OPEN" ? '<span class="locker-open-label">ABERTO</span>' : "";

            const door = document.createElement("div");
            door.className = "locker-door interactive";
            door.innerHTML = `
                <div class="locker-number">#${locker.id}</div>
                <div class="locker-led"></div>
                <div class="locker-vent">
                    <div class="vent-slot"></div>
                    <div class="vent-slot"></div>
                    <div class="vent-slot"></div>
                </div>
                <div class="locker-handle"></div>
            `;

            door.addEventListener("click", () => this.handleLockerClick(locker));

            el.appendChild(interior);
            el.appendChild(door);
            this.elements.lockersGrid.appendChild(el);
        });
    }

    handleLockerClick(locker) {
        if (this.state === "PHASE2_SETUP_SELECTION") {
            this.selectedLockerId = locker.id;
            this.targetLockerId = locker.id;
            this.state = "PHASE2_SETUP_PIN";
            this.openKeypad("SETUP");
            return;
        }

        if (this.state === "PHASE2_GAME_SEARCH") {
            if (locker.id === this.targetLockerId) {
                this.state = "PHASE2_GAME_PIN";
                this.selectedLockerId = locker.id;
                this.openKeypad("GAME");
            } else {
                this.playSound("error");
                const door = this.elements.lockersGrid.querySelector(`[data-id="${locker.id}"] .locker-door`);
                if (door) {
                    door.classList.add("shake");
                    setTimeout(() => door.classList.remove("shake"), 300);
                }
            }
        }
    }

    startPhase2Gameplay() {
        this.state = "PHASE2_GAME_SEARCH";
        this.renderLockers();

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    openKeypad(mode) {
        this.elements.keypadModal.classList.remove("hidden");
        this.keypadInput = "";
        this.elements.keypadDisplay.textContent = "";
        this.elements.keypadMessage.textContent =
            mode === "SETUP" ? CONFIG.TEXTS.pinSetPrompt : CONFIG.TEXTS.pinEnterPrompt;
    }

    closeKeypad() {
        this.elements.keypadModal.classList.add("hidden");

        if (this.state === "PHASE2_SETUP_PIN") {
            this.state = "PHASE2_SETUP_SELECTION";
            this.targetLockerId = null;
        } else if (this.state === "PHASE2_GAME_PIN") {
            this.state = "PHASE2_GAME_SEARCH";
        }
    }

    handleKeypadInput(key) {
        this.playSound("click");

        if (key === "C") {
            this.keypadInput = "";
        } else if (key === "Enter") {
            if (this.keypadInput.length > 0) {
                this.confirmKeypad();
            }
            return;
        } else if (this.keypadInput.length < 6) {
            this.keypadInput += key;
        }

        this.elements.keypadDisplay.textContent = this.keypadInput;
    }

    confirmKeypad() {
        if (this.state === "PHASE2_SETUP_PIN") {
            this.targetPin = this.keypadInput;
            this.elements.keypadModal.classList.add("hidden");
            this.startPhase2Gameplay();
            this.schedulePhase2GuideToast();
            return;
        }

        if (this.state !== "PHASE2_GAME_PIN") {
            return;
        }

        if (this.keypadInput === this.targetPin) {
            this.playSound("success");
            this.elements.keypadModal.classList.add("hidden");
            this.openLocker(this.selectedLockerId);
            setTimeout(() => this.gameOver(true), 1500);
            return;
        }

        this.playSound("error");
        this.elements.keypadDisplay.style.borderColor = CONFIG.COLORS.error;
        setTimeout(() => {
            this.elements.keypadDisplay.style.borderColor = "";
        }, 500);
        this.keypadInput = "";
        this.elements.keypadDisplay.textContent = "";
    }

    openLocker(id) {
        const lockerEl = this.elements.lockersGrid.querySelector(`[data-id="${id}"]`);
        if (lockerEl) {
            lockerEl.classList.add("open");
            const locker = this.lockers.find((candidate) => candidate.id === id);
            if (locker) {
                locker.status = "OPEN";
            }
        }
    }

    updateTimerDisplay() {
        if (!this.elements.timerDisplay) {
            return;
        }
        const safeTime = Math.max(0, this.timeLeft);
        const minutes = Math.floor(safeTime / 60).toString().padStart(2, "0");
        const seconds = (safeTime % 60).toString().padStart(2, "0");
        this.elements.timerDisplay.textContent = `${minutes}:${seconds}`;

        if (safeTime < 10) {
            this.elements.timerDisplay.style.color = CONFIG.COLORS.error;
        } else {
            this.elements.timerDisplay.style.color = "";
        }
    }

    gameOver(win) {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (this.gameTimerInterval) {
            clearInterval(this.gameTimerInterval);
            this.gameTimerInterval = null;
        }

        this.state = "GAME_OVER";

        const successMsg = 'Protocolos de segurança e organização concluídos com distinção. A política de <em>Clean Desk</em> exige que a secretária fique organizada e apenas com o equipamento padrão para o próximo colega. Deixar itens pessoais, lixo ou documentos no posto compromete a segurança da informação e o bem-estar, devendo os pertences ser guardados no cacifo digital.';
        const failMsg = 'O protocolo de segurança e a organização falharam. A política de <em>Clean Desk</em> exige que a secretária fique organizada e apenas com o equipamento padrão para o próximo colega. Deixar itens pessoais, lixo ou documentos no posto compromete a segurança da informação e o bem-estar, devendo os pertences ser guardados no cacifo digital.';

        this.elements.endContent.innerHTML = `
            <h1 class="${win ? "text-success" : "text-fail"}">${win ? 'ORGANIZAÇÃO CONCLUÍDA!' : 'TEMPO ESGOTADO'}</h1>
            <p>${win ? successMsg : failMsg}</p>
        `;

        const returnBtn = document.getElementById("return-panel-btn");
        if (returnBtn) {
            returnBtn.classList.remove("hidden");
        }

        this.elements.gameScreen.classList.add("hidden");
        this.elements.endScreen.classList.remove("hidden");
    }

    playSound(type) {
        if (!window.soundService) {
            return;
        }
        if (type === "click") {
            window.soundService.playClick();
        } else if (type === "success") {
            window.soundService.playSuccess();
        } else if (type === "error") {
            window.soundService.playError();
        }
    }
}

window.onload = () => {
    new CofresGame();
};

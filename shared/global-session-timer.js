(() => {
    const CONFIG = {
        progressKey: 'escaperoom_progress',
        deadlineKey: 'escaperoom_deadline_ts',
        finalUnlockedKey: 'escaperoom_final_unlocked',
        durationMs: 10 * 60 * 1000,
        totalGames: 6
    };

    const path = window.location.pathname || '';
    const isPrincipalPage = path.includes('/principal');
    let activeIntervalId = null;
    let activeDeadline = null;
    let expiredHandled = false;
    let timerValueEl = null;

    function getProgress() {
        const raw = parseInt(localStorage.getItem(CONFIG.progressKey) || '0', 10);
        if (Number.isNaN(raw) || raw < 0) return 0;
        if (raw > CONFIG.totalGames) return CONFIG.totalGames;
        return raw;
    }

    function formatTime(msLeft) {
        const totalSeconds = Math.max(0, Math.ceil(msLeft / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function resetAllProgress() {
        localStorage.removeItem(CONFIG.progressKey);
        localStorage.removeItem(CONFIG.deadlineKey);
        localStorage.removeItem(CONFIG.finalUnlockedKey);
    }

    function hasFinalUnlocked() {
        return localStorage.getItem(CONFIG.finalUnlockedKey) === '1';
    }

    function ensureTimerOverlay() {
        if (document.getElementById('global-session-timer')) {
            return document.getElementById('global-session-timer');
        }

        const style = document.createElement('style');
        style.textContent = `
            #global-session-timer {
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 10000;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 10px 12px;
                border-radius: 8px;
                border: none;
                background: rgba(7, 12, 24, 0.92);
                color: #e2e8f0;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.35);
                font-family: 'Nunito', Arial, sans-serif;
                font-size: 14px;
                white-space: nowrap;
                max-width: calc(100vw - 20px);
            }
            #global-session-timer .label {
                opacity: 0.85;
            }
            #global-session-timer .value {
                font-weight: 900;
                color: #45cf78;
                letter-spacing: 0.5px;
            }
            #global-session-timer.warning .value {
                color: #ffd166;
            }
            #global-session-timer.danger .value {
                color: #ff6b6b;
            }
        `;
        document.head.appendChild(style);

        const timer = document.createElement('div');
        timer.id = 'global-session-timer';
        timer.innerHTML = `
            <span class="label">Tempo:</span>
            <span class="value">10:00</span>
        `;

        document.body.appendChild(timer);
        timerValueEl = timer.querySelector('.value');
        return timer;
    }

    function createTimerElement() {
        ensureTimerOverlay();
        return document.getElementById('global-session-timer');
    }

    function handleExpired() {
        if (expiredHandled) return;
        expiredHandled = true;

        if (activeIntervalId) {
            clearInterval(activeIntervalId);
            activeIntervalId = null;
        }

        resetAllProgress();
        localStorage.setItem('escaperoom_timeout_expired', '1');
        window.location.href = '/principal/?timeout=1';
    }

    function ensureDeadline(progress, forceStart = false) {
        if (hasFinalUnlocked()) {
            localStorage.removeItem(CONFIG.deadlineKey);
            return null;
        }

        let deadline = parseInt(localStorage.getItem(CONFIG.deadlineKey) || '0', 10);
        const hasDeadline = Number.isFinite(deadline) && deadline > 0;

        const shouldStartNow = forceStart || progress > 0 || !isPrincipalPage;
        if (!hasDeadline && shouldStartNow) {
            deadline = Date.now() + CONFIG.durationMs;
            localStorage.setItem(CONFIG.deadlineKey, String(deadline));
        }

        return hasDeadline || shouldStartNow ? deadline : null;
    }

    function startTimer(deadline) {
        const timerEl = createTimerElement();
        const valueEl = timerValueEl || timerEl.querySelector('.value');
        activeDeadline = deadline;

        const tick = () => {
            const msLeft = activeDeadline - Date.now();
            if (msLeft <= 0) {
                handleExpired();
                return;
            }

            valueEl.textContent = formatTime(msLeft);
            timerEl.classList.remove('warning', 'danger');
            if (msLeft <= 60 * 1000) {
                timerEl.classList.add('danger');
            } else if (msLeft <= 3 * 60 * 1000) {
                timerEl.classList.add('warning');
            }
        };

        if (activeIntervalId) {
            clearInterval(activeIntervalId);
        }

        tick();
        activeIntervalId = setInterval(tick, 1000);
    }

    function applyPenaltyMs(penaltyMs) {
        if (!Number.isFinite(penaltyMs) || penaltyMs <= 0) {
            return false;
        }

        const rawDeadline = parseInt(localStorage.getItem(CONFIG.deadlineKey) || '0', 10);
        if (!Number.isFinite(rawDeadline) || rawDeadline <= 0) {
            return false;
        }

        const updatedDeadline = rawDeadline - penaltyMs;
        localStorage.setItem(CONFIG.deadlineKey, String(updatedDeadline));
        activeDeadline = updatedDeadline;

        if (updatedDeadline <= Date.now()) {
            handleExpired();
            return true;
        }

        if (!activeIntervalId) {
            startTimer(updatedDeadline);
        }

        return true;
    }

    function initGlobalTimer() {
        createTimerElement();
        const progress = getProgress();
        const deadline = ensureDeadline(progress);
        if (!deadline) return;
        startTimer(deadline);
    }

    function startSession() {
        const progress = getProgress();
        const deadline = ensureDeadline(progress, true);
        if (!deadline) return;
        startTimer(deadline);
    }

    window.EscapeRoomSessionTimer = {
        resetAllProgress,
        startSession,
        applyPenaltyMs,
        applyPenaltySeconds(seconds) {
            return applyPenaltyMs(seconds * 1000);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGlobalTimer);
    } else {
        initGlobalTimer();
    }
})();

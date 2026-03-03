class GameController {
    constructor() {
        this.state = {
            status: "IDLE", // IDLE, PLAYING, WON, LOST
            teams: [],
            desks: [],
            isFlexibilityActive: false,
            timerInterval: null
        };

        this.elements = {
            screens: {
                intro: document.getElementById('intro-screen'),
                game: document.getElementById('game-ui'),
                victory: document.getElementById('victory-screen'),
                defeat: document.getElementById('defeat-screen')
            },
            teamsList: document.getElementById('teams-list'),
            officeArea: document.getElementById('office-area'),
            // flexBtn: document.getElementById('flex-btn'), // Removed
            restartGameBtn: document.getElementById('restart-game-btn'),
            
            toast: document.getElementById('toast'),
            startBtn: document.getElementById('start-btn')
        };

        this.draggedTeamId = null;
        this.lastHoveredCoords = null; // Optimization for dragover
        this.suggestedPlacement = null; // Smart snapping storage

        this.gameTimerSeconds = 300;
        this.timerEl = document.getElementById('game-timer');

        this.init();
    }

    init() {
        // Event Listeners
        // Level Selection
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = parseInt(e.currentTarget.dataset.level);
                this.startGame(level);
            });
        });

        // this.elements.flexBtn.addEventListener('click', () => this.toggleFlexibility()); // Removed
        if(this.elements.restartGameBtn) {
            this.elements.restartGameBtn.addEventListener('click', () => this.startGame(this.currentLevel));
        }
        

        // Create Drag Ghost Container
        const ghostContainer = document.createElement('div');
        ghostContainer.id = 'drag-ghost-container';
        document.body.appendChild(ghostContainer);
        this.elements.ghostContainer = ghostContainer;
    }

    startGame(levelNum = 1) {
        this.currentLevel = levelNum;
        const level = this.generateLevel(levelNum);
        this.state.teams = level.teams;
        this.state.desks = level.desks;
        this.state.status = "PLAYING";
        this.state.isFlexibilityActive = true; // Always active

        this.showScreen('game');
        // this.updateFlexButton();
        this.render();

        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }

        this.startGameTimer();
    }

    startGameTimer() {
        this.gameTimerSeconds = 300;
        this.updateTimerDisplay();
        this.state.timerInterval = setInterval(() => {
            this.gameTimerSeconds--;
            this.updateTimerDisplay();
            if (this.gameTimerSeconds <= 0) {
                clearInterval(this.state.timerInterval);
                this.state.timerInterval = null;
                if (this.state.status === 'PLAYING') {
                    this.endGame(false);
                }
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

    showScreen(screenName) {
        Object.values(this.elements.screens).forEach(el => el.classList.add('hidden'));
        this.elements.screens[screenName].classList.remove('hidden');
    }

    // --- Logic ---

    generateLevel(levelNum) {
        // Defined holes for specific shapes:
        // Team 1 (Size 4): Box 2x2. Occupies (2,0)-(3,1)
        // Team 2 (Size 5): P-Shape. Occupies (1,0)-(2,1) + (3,0)
        // Team 3 (Size 6): Rect 3x2. Occupies (1,0)-(3,1)

        const desks = [
            { 
                id: 'desk-1', 
                rows: 6, cols: 2, 
                blockedCells: [
                    {r:0,c:0},{r:0,c:1}, 
                    {r:1,c:0},{r:1,c:1},
                    // Hole at 2,3
                    {r:4,c:0},{r:4,c:1}, 
                    {r:5,c:0},{r:5,c:1}
                ] 
            },
            { 
                id: 'desk-2', 
                rows: 6, cols: 2, 
                blockedCells: [
                    {r:0,c:0},{r:0,c:1}, 
                    // Hole at 1,2,3
                    {r:3,c:1}, // P-shape empty spot at (3,1) for the 'stem' on left
                    {r:4,c:0},{r:4,c:1}, 
                    {r:5,c:0},{r:5,c:1}
                ] 
            },
            { 
                id: 'desk-3', 
                rows: 6, cols: 2, 
                blockedCells: [
                    {r:0,c:0},{r:0,c:1}, 
                    // C-shape hole:
                    // free cells = (1,0)(1,1)(2,0)(3,0)(4,0)(4,1)
                    {r:2,c:1},{r:3,c:1},
                    {r:5,c:0},{r:5,c:1}
                ] 
            }
        ];

        const teams = [
            {
                id: 'team-1',
                name: 'Recursos Humanos',
                size: 4,
                variantIndex: 0, // Starts as Line
                placement: null,
                color: '#ff7676',
                textColor: '#ffffff',
                correctDeskId: 'desk-1'
            },
            {
                id: 'team-2',
                name: 'Sinistros',
                size: 5,
                variantIndex: 0, // Starts as Line
                placement: null,
                color: '#ffb65e',
                textColor: '#ffffff',
                correctDeskId: 'desk-2'
            },
            {
                id: 'team-3',
                name: 'Marketing',
                size: 6,
                variantIndex: 0, // Starts as Line
                placement: null,
                color: '#94972b',
                textColor: '#ffffff',
                correctDeskId: 'desk-3'
            }
        ];

        return { teams, desks };
    }

    // Recursive Backtracking to fit teams (Unused now but kept for structure compatibility if needed)
    solveLayout(teams, desks) {
        // Work on a copy/reference. Since we modify team.placement, it's fine.
        // Sort large teams first for better fitting?
        // Random shuffle is better for variety
        // Actually, sorting by size desc is good heuristic for backtracking
        // But we want randomness. Let's rely on shuffle.
        return this.placeTeamRecursive(teams, 0, desks);
    }

    placeTeamRecursive(teams, index, desks) {
        if (index === teams.length) return true; // All placed

        const team = teams[index];
        const variants = CONFIG.POLYOMINOES[team.size];
        
        // Randomize trial order
        const variantIndices = this.shuffle(variants.map((_, i) => i));
        const deskIndices = this.shuffle(desks.map((_, i) => i));

        for (const vIdx of variantIndices) {
            const shape = this.getShapeFor(team, vIdx);
            
            for (const dIdx of deskIndices) {
                const desk = desks[dIdx];
                
                // Try all valid top-left positions
                // Optimization: Generate valid start points
                const maxR = desk.rows - shape.length;
                const maxC = desk.cols - shape[0].length;
                
                if (maxR < 0 || maxC < 0) continue; // Shape doesn't fit desk bounds

                // Generate and shuffle positions
                let positions = [];
                for(let r=0; r<=maxR; r++) {
                    for(let c=0; c<=maxC; c++) {
                        positions.push({r, c});
                    }
                }
                this.shuffle(positions);

                for (const pos of positions) {
                    if (this.checkCollision(desk, shape, pos.r, pos.c, teams, index)) {
                        // Place
                        team.placement = { deskId: desk.id, r: pos.r, c: pos.c };
                        team.variantIndex = vIdx; // Temp set for next recursions check
                        
                        if (this.placeTeamRecursive(teams, index + 1, desks)) return true;
                        
                        // Backtrack
                        team.placement = null;
                    }
                }
            }
        }
        
        return false;
    }

    checkCollision(desk, shape, startR, startC, teams, limitIndex) {
        // Check ONLY against teams [0...limitIndex-1] (already placed)
        // And desk bounds (already checked by loop limits, but safe to double check)
        
        for(let r=0; r<shape.length; r++) {
            for(let c=0; c<shape[0].length; c++) {
                if (shape[r][c] === 1) {
                    const absR = startR + r;
                    const absC = startC + c;

                    // Check vs other teams
                    for (let i = 0; i < limitIndex; i++) {
                        const other = teams[i];
                        if (other.placement && other.placement.deskId === desk.id) {
                            const otherShape = this.getShapeFor(other, other.variantIndex);
                            const oLocalR = absR - other.placement.r;
                            const oLocalC = absC - other.placement.c;
                            
                            if (oLocalR >= 0 && oLocalR < otherShape.length && 
                                oLocalC >= 0 && oLocalC < otherShape[0].length) {
                                if (otherShape[oLocalR][oLocalC] === 1) return false;
                            }
                        }
                    }
                }
            }
        }
        return true;
    }

    getShapeFor(team, vIdx) {
        return CONFIG.POLYOMINOES[team.size][vIdx];
    }

    endGame(won) {
        this.state.status = won ? "WON" : "LOST";
        clearInterval(this.state.timerInterval);
        this.showScreen(won ? 'victory' : 'defeat');
    }

    // --- Actions ---

    toggleFlexibility() {
        // No-op or removed
    }

    rotateTeam(teamId) {
        // Always allowed since flexibility is active default
        const team = this.state.teams.find(t => t.id === teamId);
        if (team) {
            const oldVariant = team.variantIndex;
            const variants = CONFIG.POLYOMINOES[team.size];
            team.variantIndex = (team.variantIndex + 1) % variants.length;
            
            // If team is placed, validate
            if (team.placement) {
                const desk = this.state.desks.find(d => d.id === team.placement.deskId);
                // Temporarily remove placement to check collision against OTHERS
                const currentPlacement = {...team.placement};
                team.placement = null; 

                if (!this.isValidPlacement(desk, team, currentPlacement.r, currentPlacement.c)) {
                    // Revert
                    team.variantIndex = oldVariant;
                    team.placement = currentPlacement;
                    this.showToast("Forma inviável aqui!");
                } else {
                    // Valid
                    team.placement = currentPlacement;
                }
            }
            this.render();
        }
    }

    handleDropToCell(deskId, row, col) {
        this.clearPreviews(); // Clear any ghosts
        const startRow = parseInt(row);
        const startCol = parseInt(col);

        const team = this.state.teams.find(t => t.id === this.draggedTeamId);
        const desk = this.state.desks.find(d => d.id === deskId);
        
        if (!team || !desk) return;

        // Use smart snap result if valid and matches current desk
        let targetR = startRow;
        let targetC = startCol;

        if (this.suggestedPlacement && 
            this.suggestedPlacement.deskId === deskId) {
            targetR = this.suggestedPlacement.r;
            targetC = this.suggestedPlacement.c;
            console.log("Using snapped position", targetR, targetC);
        }
        this.suggestedPlacement = null; // Reset

        // If team was already here, remove it for check
        const oldPlacement = team.placement;
        team.placement = null;

        // Validation: Check if this is the correct desk
        if (team.correctDeskId && team.correctDeskId !== deskId) {
            this.handleInvalidDrop(team, oldPlacement, "Lugar errado!");
            return;
        }

        if (this.isValidPlacement(desk, team, targetR, targetC)) {
            team.placement = { deskId, r: targetR, c: targetC };
            this.render();
        } else {
            this.handleInvalidDrop(team, oldPlacement, "Lugar errado!");
        }
        this.draggedTeamId = null;
        
        // Check win condition immediately
        const unassignedCount = this.state.teams.filter(t => t.placement === null).length;
        if (unassignedCount === 0) {
             this.endGame(true);
        }
    }

    handleDropToSidebar() {
        const team = this.state.teams.find(t => t.id === this.draggedTeamId);
        if (team && team.placement !== null) {
            team.placement = null;
            this.render();
        }
        this.draggedTeamId = null;
    }

    // --- Validation Helpers ---

    isValidPlacement(desk, team, startR, startC) {
        // Ensure numeric input
        const sR = parseInt(startR);
        const sC = parseInt(startC);

        const shapeMatrix = this.getCurrentShape(team);
        const shapeH = shapeMatrix.length;
        const shapeW = shapeMatrix[0].length;

        // 1. Bounds check
        if (sR < 0 || sC < 0 || sR + shapeH > desk.rows || sC + shapeW > desk.cols) {
            return false;
        }

        // 2. Collision check with BLOCKED cells
        for (let r = 0; r < shapeH; r++) {
            for (let c = 0; c < shapeW; c++) {
                if (shapeMatrix[r][c] === 1) {
                    const absR = sR + r;
                    const absC = sC + c;
                    if (desk.blockedCells && desk.blockedCells.some(b => b.r === absR && b.c === absC)) {
                        return false;
                    }
                }
            }
        }

        // 3. Collision check with OTHER teams
        const occupied = new Set();
        this.state.teams.forEach(t => {
            if (t.id !== team.id && t.placement && t.placement.deskId === desk.id) {
                const tMatrix = this.getCurrentShape(t);
                for (let r = 0; r < tMatrix.length; r++) {
                    for (let c = 0; c < tMatrix[0].length; c++) {
                        if (tMatrix[r][c] === 1) {
                            occupied.add(`${t.placement.r + r},${t.placement.c + c}`);
                        }
                    }
                }
            }
        });

        for (let r = 0; r < shapeH; r++) {
            for (let c = 0; c < shapeW; c++) {
                if (shapeMatrix[r][c] === 1) {
                    if (occupied.has(`${sR + r},${sC + c}`)) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    getCurrentShape(team) {
        if (!CONFIG.POLYOMINOES[team.size]) {
            console.error("Missing shapes for size", team.size);
            return [[1]]; // Fail safe
        }
        return CONFIG.POLYOMINOES[team.size][team.variantIndex] || CONFIG.POLYOMINOES[team.size][0];
    }

    // --- Rendering ---

    render() {
        this.renderSidebar();
        this.renderOffice();
    }

    renderSidebar() {
        this.elements.teamsList.innerHTML = '';
        const unassignedTeams = this.state.teams.filter(t => t.placement === null);
        
        unassignedTeams.forEach(team => {
            const card = document.createElement('div');
            card.className = 'team-card';
            card.setAttribute('draggable', 'true');
            card.dataset.id = team.id;
            
            // Preview shape
            const matrix = this.getCurrentShape(team);
            const preview = document.createElement('div');
            preview.className = 'team-shape-preview';
            preview.style.gridTemplateColumns = `repeat(${matrix[0].length}, 10px)`;
            
            matrix.forEach(row => {
                row.forEach(cell => {
                    const cellDiv = document.createElement('div');
                    cellDiv.className = 'preview-cell';
                    if (cell) cellDiv.style.backgroundColor = team.color;
                    preview.appendChild(cellDiv);
                });
            });

            // Info
            const info = document.createElement('div');
            info.className = 'team-info';
            info.innerHTML = `<div class="team-name" style="color:${team.textColor}; background-color:${team.color}; padding: 2px 5px; border-radius: 4px;">${team.name}</div>`;

            // Rotate Btn (if flexibility active)
            if (this.state.isFlexibilityActive) {
                const rotBtn = document.createElement('button');
                rotBtn.className = 'flex-btn';
                rotBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i><span>ATIVAR FLEXIBILIDADE</span>';
                rotBtn.style.cursor = 'pointer';
                rotBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.rotateTeam(team.id);
                };
                info.appendChild(rotBtn);
            }

            card.appendChild(preview);
            card.appendChild(info);

            // DnD events
            card.addEventListener('dragstart', (e) => {
                this.draggedTeamId = team.id;
                e.dataTransfer.setData('text/plain', team.id);
                e.dataTransfer.effectAllowed = 'move';

                // --- Generate Drag Image (Ghost) ---
                const ghostMatrix = this.getCurrentShape(team);
                const ghost = document.createElement('div');
                ghost.className = 'ghost-shape';
                // Adjust ghost grid to match board size (38px) 
                ghost.style.gridTemplateColumns = `repeat(${ghostMatrix[0].length}, 38px)`;
                
                ghostMatrix.forEach(row => {
                    row.forEach(cellVal => {
                        const cDiv = document.createElement('div');
                        if (cellVal) {
                            cDiv.className = 'ghost-cell';
                            cDiv.style.backgroundColor = team.color;
                            cDiv.innerText = team.name.substring(0,2); // Small hint
                        }
                        ghost.appendChild(cDiv);
                    });
                });
                
                // Mount to off-screen container then set as drag image
                this.elements.ghostContainer.innerHTML = '';
                this.elements.ghostContainer.appendChild(ghost);
                e.dataTransfer.setDragImage(ghost, 20, 20); // Pivot

                setTimeout(() => card.classList.add('dragging'), 0);
            });
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                this.clearPreviews();
            });
            
            this.elements.teamsList.appendChild(card);
        });

        // Add dropzone to sidebar to return items
        this.elements.sidebarContainer = document.getElementById('sidebar-container');
        this.elements.sidebarContainer.ondragover = (e) => { e.preventDefault(); }; 
        this.elements.sidebarContainer.ondrop = (e) => {
            e.preventDefault();
            this.handleDropToSidebar();
        }
    }

    renderOffice() {
        this.elements.officeArea.innerHTML = '';
        
        this.state.desks.forEach(desk => {
            const deskEl = document.createElement('div');
            deskEl.className = 'desk';
            deskEl.dataset.id = desk.id;
            deskEl.style.gridTemplateColumns = `repeat(${desk.cols}, var(--grid-cell-size))`;
            deskEl.innerHTML = `<h3>Mesa ${desk.id.split('-')[1]}</h3>`;

            // Render Cells
            for (let r = 0; r < desk.rows; r++) {
                for (let c = 0; c < desk.cols; c++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    cell.dataset.r = r;
                    cell.dataset.c = c;
                    
                    // Check blocked
                    if (desk.blockedCells && desk.blockedCells.some(b => b.r === r && b.c === c)) {
                        cell.classList.add('blocked');
                        cell.title = "Lugar indisponível";
                        // Prevent interaction
                        deskEl.appendChild(cell);
                        continue; 
                    }

                    // Check occupation
                    const occupyingTeam = this.getTeamAt(desk.id, r, c);
                    if (occupyingTeam) {
                        // cell.style.backgroundColor = occupyingTeam.color; // Removed for fixed appearance
                        cell.classList.add('occupied');
                        cell.classList.add('occupied-fixed');
                        cell.dataset.teamId = occupyingTeam.id;
                        cell.title = occupyingTeam.name;

                        // Add click to rotate if placed on board and flexibility active
                        if (this.state.isFlexibilityActive) {
                            cell.style.cursor = 'pointer';
                            cell.onclick = () => this.rotateTeam(occupyingTeam.id);
                        }
                        
                        // Allow dragging from board ?? 
                        // The requirements imply we can "Organize", so yes, we should be able to move them.
                        // I'll make the occupied cell draggable which represents the team?
                        // Actually, better to click and drag the "Block".
                        // Logic gets complex here. Simplest is: if you click an occupied cell, you pick up the team?
                        // Let's implement dragging FROM board.
                        
                        cell.draggable = true;
                        cell.addEventListener('dragstart', (e) => {
                           this.draggedTeamId = occupyingTeam.id;
                           e.dataTransfer.setData('text/plain', occupyingTeam.id);
                           setTimeout(() => { /* Style change if needed */ }, 0);
                        });
                    }

                    // Drop Events
                    cell.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        this.handleDragOverCell(desk, r, c);
                    });
                    cell.addEventListener('dragleave', () => { 
                        // Optional: Debounce clearing?
                        // For now relying on next dragover to clear.
                    });
                    cell.addEventListener('drop', (e) => {
                        e.preventDefault();
                        this.clearPreviews();
                        this.handleDropToCell(desk.id, r, c);
                    });

                    deskEl.appendChild(cell);
                }
            }
            this.elements.officeArea.appendChild(deskEl);
        });
    }

    handleDragOverCell(desk, startR, startC) {
        if (!this.draggedTeamId) return;
        
        startR = parseInt(startR);
        startC = parseInt(startC);

        // Optimize: Don't redraw if same cell
        const coordsKey = `${desk.id}-${startR}-${startC}`;
        if (this.lastHoveredCoords === coordsKey) return;
        this.lastHoveredCoords = coordsKey;

        this.clearPreviews();

        const team = this.state.teams.find(t => t.id === this.draggedTeamId);
        if (!team) return;

        // Temporarily nullify placement to check
        const originalPlacement = team.placement;
        team.placement = null;

        // Smart Snap: Search for valid placement near strict target
        const shapeH = this.getCurrentShape(team).length;
        const searchOrder = [];
        
        // 1. Prioritize EXACT under mouse
        searchOrder.push({dr: 0, dc: 0}); 
        
        // 2. Try vertical shifts (Up) to accommodate bottom anchor
        for(let dr = -1; dr > -shapeH; dr--) {
             searchOrder.push({dr: dr, dc: 0});
        }
        
        // 3. Try horizontal shifts (Left)
        searchOrder.push({dr: 0, dc: -1});
        
        // 4. Try Top-Left combos
        for(let dr = -1; dr > -shapeH; dr--) {
             searchOrder.push({dr: dr, dc: -1});
        }

        let bestFit = null;
        
        for (const offset of searchOrder) {
            const tr = startR + offset.dr;
            const tc = startC + offset.dc;
            if (this.isValidPlacement(desk, team, tr, tc)) {
                bestFit = { r: tr, c: tc };
                break; // Found closest valid
            }
        }

        team.placement = originalPlacement; // Restore for now

        if (bestFit) {
             // Valid Snap Found
             this.suggestedPlacement = { deskId: desk.id, r: bestFit.r, c: bestFit.c };
             this.renderPreview(desk, team, bestFit.r, bestFit.c, true);
        } else {
             // No valid snap -> Show invalid at mouse
             this.suggestedPlacement = null;
             this.renderPreview(desk, team, startR, startC, false);
        }
    }

    renderPreview(desk, team, startR, startC, isValid) {
        const matrix = this.getCurrentShape(team);
        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[0].length; c++) {
                if (matrix[r][c] === 1) {
                    const targetR = startR + r;
                    const targetC = startC + c;
                    const cellEl = document.querySelector(`.desk[data-id="${desk.id}"] .cell[data-r="${targetR}"][data-c="${targetC}"]`);
                    if (cellEl) {
                        cellEl.classList.add(isValid ? 'preview-valid' : 'preview-invalid');
                    }
                }
            }
        }
    }

    clearPreviews() {
        this.lastHoveredCoords = null;
        const els = document.querySelectorAll('.preview-valid, .preview-invalid');
        els.forEach(el => el.classList.remove('preview-valid', 'preview-invalid'));
    }

    getTeamAt(deskId, r, c) {
        return this.state.teams.find(t => {
            if (!t.placement || t.placement.deskId !== deskId) return false;
            const matrix = this.getCurrentShape(t);
            // Local coords
            const localR = r - t.placement.r;
            const localC = c - t.placement.c;
            if (localR >= 0 && localR < matrix.length && localC >= 0 && localC < matrix[0].length) {
                return matrix[localR][localC] === 1;
            }
            return false;
        });
    }

    // --- Utils ---

    updateFlexButton() {
        if (this.state.isFlexibilityActive) {
            this.elements.flexBtn.classList.add('active');
            this.elements.flexBtn.style.backgroundColor = '#2ecc71';
        } else {
            this.elements.flexBtn.classList.remove('active');
            this.elements.flexBtn.style.backgroundColor = CONFIG.COLORS.accent;
        }
    }

    showToast(msg) {
        this.elements.toast.innerText = msg;
        this.elements.toast.classList.add('visible');
        setTimeout(() => {
            this.elements.toast.classList.remove('visible');
        }, 3000);
    }

    handleInvalidDrop(team, oldPlacement, msg) {
        this.draggedTeamId = null;
        this.suggestedPlacement = null;
        this.clearPreviews();

        if (oldPlacement) {
            team.placement = oldPlacement;
            this.render();
            this.shakePlacedTeam(team.id);
        } else {
            team.placement = null;
            this.render();
            this.shakeSidebarTeam(team.id);
        }

        setTimeout(() => {
            this.showToast(msg);
            setTimeout(() => {
                team.placement = null;
                this.render();
            }, 350);
        }, 450);
    }

    shakeSidebarTeam(teamId) {
        const card = this.elements.teamsList.querySelector(`.team-card[data-id="${teamId}"]`);
        if (!card) return;
        card.classList.add('invalid-shake');
        setTimeout(() => card.classList.remove('invalid-shake'), 450);
    }

    shakePlacedTeam(teamId) {
        const occupiedCells = document.querySelectorAll(`.cell[data-team-id="${teamId}"]`);
        if (!occupiedCells.length) return;
        occupiedCells.forEach(cell => cell.classList.add('invalid-shake'));
        setTimeout(() => {
            occupiedCells.forEach(cell => cell.classList.remove('invalid-shake'));
        }, 450);
    }

    shuffle(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}

// Start
window.onload = () => {
    new GameController();
};

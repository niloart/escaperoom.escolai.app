/**
 * CLASS: GAME
 * Handles Logic, Input, and Rendering
 * Mapa fixo com canos especiais
 */
class NeuralCircuit {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('overlay');
        this.markerEnd = document.getElementById('marker-end');
        
        // Ecrã de introdução
        this.introScreen = document.getElementById('intro-screen');
        this.startGameBtn = document.getElementById('startGameBtn');
        
        // Modal para canos especiais
        this.modal = document.getElementById('special-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalText = document.getElementById('modal-text');
        this.modalClose = document.getElementById('modal-close');
        this.modalIcon = document.getElementById('modal-icon');
        
        this.grid = [];
        this.startPoint = null;
        this.endPoint = null;
        this.path = [];
        this.isGameOver = false;
        this.gameStarted = false;
        this.specialPipesActivated = [];
        this.currentFlowSpecials = [];

        this.tileSize = CONFIG.tileSize;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Inputs
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.startGameBtn.addEventListener('click', () => this.startGame());

        // Prepara o jogo mas não inicia ainda
        this.initLevel();
        this.loop();
    }
    
    startGame() {
        this.introScreen.classList.add('hidden');
        this.gameStarted = true;
    }
    
    restartGame() {
        this.initLevel();
    }

    resize() {
        // Container fixo de 1200x675
        const containerWidth = 1200;
        const containerHeight = 675;
        
        const sizeW = Math.floor(containerWidth / CONFIG.cols);
        const sizeH = Math.floor(containerHeight / CONFIG.rows);
        
        this.tileSize = Math.min(sizeW, sizeH); 
        
        this.canvas.width = this.tileSize * CONFIG.cols;
        this.canvas.height = this.tileSize * CONFIG.rows;
    }

    /**
     * Ecrã FIXO - Layout pré-definido
     * Grid 8x6 com caminho fixo passando pelos 3 canos especiais
     */
    initLevel() {
        this.isGameOver = false;
        this.overlay.classList.remove('visible');
        this.specialPipesActivated = [];
        this.currentFlowSpecials = [];
        this.grid = [];

        // Inicializa grid vazio
        for(let r = 0; r < CONFIG.rows; r++) {
            let row = [];
            for(let c = 0; c < CONFIG.cols; c++) {
                row.push(new Tile(c, r, PIPE_TYPES.EMPTY));
            }
            this.grid.push(row);
        }

        // Define pontos de entrada e saída fixos
        this.startPoint = { r: 2, c: 0, entryDir: DIRS.W, side: 3 };
        this.endPoint = { r: 3, c: 7, entryDir: DIRS.E, side: 1 };

        this.setupFixedMap();
        this.scramble();
        this.checkFlow();
    }

    setupFixedMap() {
        // Caminho solução válido com espaçamento entre especiais:
        // Início(2,0) → (2,1) → (2,2) → (1,2) → (1,3)[RECONHECER] → (1,4) → (1,5) →
        // (2,5) → (3,5)[RESPEITAR] → (4,5) → (5,5) → (5,6) → (5,7)[REORIENTAR] →
        // (4,7) → (3,7)[Saída]
        
        // Linha 0 - todos decoys
        for(let c = 0; c < 8; c++) {
            this.grid[0][c].type = (c % 2 === 0) ? PIPE_TYPES.ELBOW : PIPE_TYPES.STRAIGHT;
        }
        
        // Linha 1 - contém RECONHECER
        this.grid[1][0].type = PIPE_TYPES.STRAIGHT;  // decoy
        this.grid[1][1].type = PIPE_TYPES.ELBOW;     // decoy
        this.grid[1][2].type = PIPE_TYPES.ELBOW;     // S-E (do caminho vindo de baixo)
        this.grid[1][3].type = PIPE_TYPES.STRAIGHT;  // W-E RECONHECER (Horizontal)
        this.grid[1][3].special = 'reconhecer';
        this.grid[1][3].rotation = 1;                // 90 degrees: N-S -> W-E
        this.grid[1][3].targetRotation = 1;
        this.grid[1][3].visualRotation = 1 * (Math.PI/2);
        this.grid[1][3].locked = true;               // Fixed position
        
        this.grid[1][4].type = PIPE_TYPES.STRAIGHT;  // W-E
        this.grid[1][5].type = PIPE_TYPES.ELBOW;     // W-S (vira para baixo)
        this.grid[1][6].type = PIPE_TYPES.STRAIGHT;  // decoy
        this.grid[1][7].type = PIPE_TYPES.ELBOW;     // decoy
        
        // Linha 2 - entrada
        this.grid[2][0].type = PIPE_TYPES.STRAIGHT;  // W-E entrada
        this.grid[2][1].type = PIPE_TYPES.STRAIGHT;  // W-E
        this.grid[2][2].type = PIPE_TYPES.ELBOW;     // W-N (vira para cima)
        this.grid[2][3].type = PIPE_TYPES.ELBOW;     // decoy
        this.grid[2][4].type = PIPE_TYPES.STRAIGHT;  // decoy
        this.grid[2][5].type = PIPE_TYPES.STRAIGHT;  // N-S (vem de cima, vai para baixo)
        this.grid[2][6].type = PIPE_TYPES.ELBOW;     // decoy
        this.grid[2][7].type = PIPE_TYPES.STRAIGHT;  // decoy
        
        // Linha 3 - contém RESPEITAR e saída
        this.grid[3][0].type = PIPE_TYPES.ELBOW;     // decoy
        this.grid[3][1].type = PIPE_TYPES.STRAIGHT;  // decoy
        this.grid[3][2].type = PIPE_TYPES.ELBOW;     // decoy
        this.grid[3][3].type = PIPE_TYPES.STRAIGHT;  // decoy
        this.grid[3][4].type = PIPE_TYPES.ELBOW;     // decoy
        
        this.grid[3][5].type = PIPE_TYPES.STRAIGHT;  // N-S RESPEITAR (Vertical)
        this.grid[3][5].special = 'respeitar';
        this.grid[3][5].rotation = 0;                // 0 degrees: N-S
        this.grid[3][5].targetRotation = 0;
        this.grid[3][5].visualRotation = 0;
        this.grid[3][5].locked = true;               // Fixed position
        
        this.grid[3][6].type = PIPE_TYPES.STRAIGHT;  // decoy
        this.grid[3][7].type = PIPE_TYPES.ELBOW;     // S-E saída (vem de baixo, sai para leste)
        
        // Linha 4
        this.grid[4][0].type = PIPE_TYPES.STRAIGHT;  // decoy
        this.grid[4][1].type = PIPE_TYPES.ELBOW;     // decoy
        this.grid[4][2].type = PIPE_TYPES.STRAIGHT;  // decoy
        this.grid[4][3].type = PIPE_TYPES.ELBOW;     // decoy
        this.grid[4][4].type = PIPE_TYPES.STRAIGHT;  // decoy
        this.grid[4][5].type = PIPE_TYPES.STRAIGHT;  // N-S (vem de cima, vai para baixo)
        this.grid[4][6].type = PIPE_TYPES.ELBOW;     // decoy
        this.grid[4][7].type = PIPE_TYPES.STRAIGHT;  // N-S (vem de baixo, vai para cima)
        
        // Linha 5 - contém REORIENTAR
        this.grid[5][0].type = PIPE_TYPES.ELBOW;     // decoy
        this.grid[5][1].type = PIPE_TYPES.STRAIGHT;  // decoy
        this.grid[5][2].type = PIPE_TYPES.ELBOW;     // decoyL da esquerda para cima)
        this.grid[5][7].special = 'reorientar';
        this.grid[5][7].rotation = 3;                // 270 degrees: N-E -> W-N
        this.grid[5][7].targetRotation = 3;
        this.grid[5][7].visualRotation = 3 * (Math.PI/2);
        this.grid[5][7].locked = true;               // Fixed positionGHT;  // decoy
        this.grid[5][4].type = PIPE_TYPES.ELBOW;     // decoy
        this.grid[5][5].type = PIPE_TYPES.ELBOW;     // N-E (vem de cima, vai para direita)
        this.grid[5][6].type = PIPE_TYPES.STRAIGHT;  // W-E
        this.grid[5][7].type = PIPE_TYPES.ELBOW;     // W-N REORIENTAR (vem da esquerda, vai para cima)
        this.grid[5][7].special = 'reorientar';
    }

    scramble() {
        for(let r = 0; r < CONFIG.rows; r++) {
            for(let c = 0; c < CONFIG.cols; c++) {
                if (this.grid[r][c].locked) continue; // Skip locked tiles
                
                let randRot = randomInt(0, 3);
                this.grid[r][c].rotation = randRot;
                this.grid[r][c].targetRotation = randRot;
                this.grid[r][c].visualRotation = randRot * (Math.PI/2);
                this.grid[r][c].wasActivated = false;
            }
        }
    }

    handleClick(e) {
        if (this.isGameOver) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const c = Math.floor(x / this.tileSize);
        const r = Math.floor(y / this.tileSize);

        if (c >= 0 && c < CONFIG.cols && r >= 0 && r < CONFIG.rows) {
            this.grid[r][c].rotate();
            this.checkFlow();
        }
    }

    checkFlow() {
        for(let r = 0; r < CONFIG.rows; r++) {
            for(let c = 0; c < CONFIG.cols; c++) {
                this.grid[r][c].isLit = false;
            }
        }
        
        this.currentFlowSpecials = [];

        const startR = this.startPoint.r;
        const startC = this.startPoint.c;
        const entryDir = this.startPoint.entryDir;

        const startTile = this.grid[startR][startC];
        
        if (startTile.getConnections() & entryDir) {
            this.propagateFlow(startR, startC, entryDir);
        }
        
        this.checkSpecialPipesOrder();
    }

    propagateFlow(r, c, fromDir) {
        const tile = this.grid[r][c];
        if (tile.isLit) return;

        tile.isLit = true;
        
        if (tile.special) {
            this.currentFlowSpecials.push(tile.special);
        }

        if (r === this.endPoint.r && c === this.endPoint.c) {
            if (tile.getConnections() & this.endPoint.entryDir) {
                if (this.validateSpecialOrder()) {
                    this.triggerWin();
                }
            }
        }

        const cons = tile.getConnections();

        if ((cons & DIRS.N) && fromDir !== DIRS.N) {
            this.tryConnect(r-1, c, DIRS.S);
        }
        if ((cons & DIRS.E) && fromDir !== DIRS.E) {
            this.tryConnect(r, c+1, DIRS.W);
        }
        if ((cons & DIRS.S) && fromDir !== DIRS.S) {
            this.tryConnect(r+1, c, DIRS.N);
        }
        if ((cons & DIRS.W) && fromDir !== DIRS.W) {
            this.tryConnect(r, c-1, DIRS.E);
        }
    }

    tryConnect(r, c, requiredConnection) {
        if (r < 0 || r >= CONFIG.rows || c < 0 || c >= CONFIG.cols) return;
        
        const neighbor = this.grid[r][c];
        const neighborCons = neighbor.getConnections();

        if (neighborCons & requiredConnection) {
            this.propagateFlow(r, c, requiredConnection); 
        }
    }
    
    validateSpecialOrder() {
        const expectedOrder = ['reconhecer', 'respeitar', 'reorientar'];
        const foundSpecials = this.currentFlowSpecials.filter(s => expectedOrder.includes(s));
        
        if (foundSpecials.length !== 3) return false;
        
        for (let i = 0; i < 3; i++) {
            if (foundSpecials[i] !== expectedOrder[i]) return false;
        }
        
        return true;
    }
    
    checkSpecialPipesOrder() {
        const expectedOrder = ['reconhecer', 'respeitar', 'reorientar'];
        
        for (let i = 0; i < this.currentFlowSpecials.length; i++) {
            const special = this.currentFlowSpecials[i];
            const expectedIndex = expectedOrder.indexOf(special);
            
            if (expectedIndex === i) {
                for (let r = 0; r < CONFIG.rows; r++) {
                    for (let c = 0; c < CONFIG.cols; c++) {
                        const tile = this.grid[r][c];
                        if (tile.special === special && !tile.wasActivated && tile.isLit) {
                            tile.wasActivated = true;
                            this.showSpecialModal(special);
                            return;
                        }
                    }
                }
            }
        }
    }
    
    showSpecialModal(specialId) {
        const config = SPECIAL_PIPES[specialId.toUpperCase()];
        if (!config) return;
        
        this.modalTitle.textContent = config.name;
        this.modalTitle.style.color = config.colorActive;
        this.modalText.textContent = config.message;
        
        // Exibir ícone do cano especial
        if (config.icon) {
            this.modalIcon.src = config.icon;
            this.modalIcon.alt = config.name;
            this.modalIcon.style.display = 'block';
        } else {
            this.modalIcon.style.display = 'none';
        }
        
        this.modal.classList.add('visible');
    }
    
    closeModal() {
        this.modal.classList.remove('visible');
    }

    triggerWin() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        
        // Mostrar marcador "Adaptação Concluída"
        if (this.markerEnd) {
            this.markerEnd.classList.add('visible');
        }
        
        setTimeout(() => {
            this.overlay.classList.add('visible');
        }, 500);
    }

    loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for(let r = 0; r < CONFIG.rows; r++) {
            for(let c = 0; c < CONFIG.cols; c++) {
                this.grid[r][c].update();
                this.grid[r][c].draw(this.ctx, this.tileSize);
            }
        }

        this.drawIO(this.startPoint, true);
        this.drawIO(this.endPoint, false);

        requestAnimationFrame(() => this.loop());
    }

    drawIO(point, isStart) {
        if (!point) return;

        const size = this.tileSize;
        const cx = point.c * size + size/2;
        const cy = point.r * size + size/2;

        let offsetX = 0, offsetY = 0;
        const offsetAmt = size * 0.6;

        if (point.entryDir === DIRS.N) offsetY = -offsetAmt;
        if (point.entryDir === DIRS.S) offsetY = offsetAmt;
        if (point.entryDir === DIRS.W) offsetX = -offsetAmt;
        if (point.entryDir === DIRS.E) offsetX = offsetAmt;

        this.ctx.save();
        this.ctx.translate(cx + offsetX, cy + offsetY);

        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = isStart ? '#fff' : CONFIG.pipeActive;
        this.ctx.fillStyle = isStart ? '#fff' : CONFIG.pipeActive;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0,0);
        this.ctx.lineTo(-offsetX*0.6, -offsetY*0.6); 
        this.ctx.strokeStyle = this.ctx.fillStyle;
        this.ctx.lineWidth = size * 0.2;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 0.25, 0, Math.PI*2);
        this.ctx.fill();

        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowBlur = 0;
        this.ctx.fillText(isStart ? "ENT." : "SAÍ.", 0, 0);

        this.ctx.restore();
    }
}

/**
 * CLASS: TILE
 * Represents a single grid square
 */

// Pré-carregar imagens dos ícones especiais
const SPECIAL_ICONS = {};
let iconsLoaded = 0;

function preloadSpecialIcons() {
    for (const key in SPECIAL_PIPES) {
        const pipe = SPECIAL_PIPES[key];
        if (pipe.icon) {
            const img = new Image();
            img.onload = function () {
                iconsLoaded++;
                console.log('Icon loaded:', pipe.id, iconsLoaded);
            };
            img.onerror = function () {
                console.error('Failed to load icon:', pipe.icon);
            };
            img.src = pipe.icon;
            SPECIAL_ICONS[pipe.id] = img;
        }
    }
}
preloadSpecialIcons();

class Tile {
    constructor(c, r, type) {
        this.c = c;
        this.r = r;
        this.type = type; // Initial connections mask (Rotation 0)
        this.rotation = 0; // 0, 1, 2, 3 (x90 degrees)
        this.targetRotation = 0;
        this.visualRotation = 0; // For animation
        this.isLit = false;
        this.locked = false; // If true, cannot rotate (optional, used for decoys or fixed starts)
        this.special = null; // Para canos especiais: 'reconhecer', 'respeitar', 'reorientar'
        this.wasActivated = false; // Marca se o cano especial já foi ativado
        this.isSolution = false; // Se faz parte do caminho solução
    }

    // Get the connections for the CURRENT rotation
    getConnections() {
        let connections = 0;
        // Standard bitwise rotation logic
        // N(1) -> E(2) -> S(4) -> W(8) -> N(1)

        // Check North bit of base type
        if (this.type & DIRS.N) connections |= (DIRS.N << this.rotation);
        if (this.type & DIRS.E) connections |= (DIRS.E << this.rotation);
        if (this.type & DIRS.S) connections |= (DIRS.S << this.rotation);
        if (this.type & DIRS.W) connections |= (DIRS.W << this.rotation);

        // Clean up overflow (anything > 8 needs to wrap around)
        // Actually, cleaner logic:
        let result = 0;
        if (this.hasDir(DIRS.N)) result |= this.rotateDir(DIRS.N);
        if (this.hasDir(DIRS.E)) result |= this.rotateDir(DIRS.E);
        if (this.hasDir(DIRS.S)) result |= this.rotateDir(DIRS.S);
        if (this.hasDir(DIRS.W)) result |= this.rotateDir(DIRS.W);

        return result;
    }

    // Helper: Does the base type have this direction?
    hasDir(dir) {
        return (this.type & dir) !== 0;
    }

    // Helper: Rotate a single direction bit based on current rotation
    rotateDir(dir) {
        let shifts = this.rotation % 4;
        for (let i = 0; i < shifts; i++) {
            if (dir === DIRS.N) dir = DIRS.E;
            else if (dir === DIRS.E) dir = DIRS.S;
            else if (dir === DIRS.S) dir = DIRS.W;
            else if (dir === DIRS.W) dir = DIRS.N;
        }
        return dir;
    }

    rotate() {
        if (this.locked) return;
        this.targetRotation += 1;
        this.rotation = this.targetRotation % 4;
    }

    update() {
        // Smooth interpolation for rotation
        const diff = (this.targetRotation * (Math.PI / 2)) - this.visualRotation;
        if (Math.abs(diff) > 0.01) {
            this.visualRotation += diff * CONFIG.animSpeed;
        } else {
            this.visualRotation = this.targetRotation * (Math.PI / 2);
        }
    }

    getSpecialConfig() {
        if (!this.special) return null;
        return SPECIAL_PIPES[this.special.toUpperCase()];
    }

    draw(ctx, size, hintActive = false) {
        const cx = this.c * size + size / 2;
        const cy = this.r * size + size / 2;

        ctx.save();
        ctx.translate(cx, cy);

        // Se dica ativa e NÃO é solução, fica escuro
        if (hintActive && !this.isSolution) {
            ctx.globalAlpha = 0.2;
        }

        // Draw Grid Background for Tile
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.strokeRect(-size / 2, -size / 2, size, size);

        // Apply Rotation
        ctx.rotate(this.visualRotation);

        // Style
        ctx.lineCap = 'round';
        ctx.lineWidth = size * 0.2; // Responsive line width

        // Shadow/Glow - cores especiais para canos especiais
        const specialConfig = this.getSpecialConfig();

        if (this.isLit) {
            if (specialConfig) {
                ctx.strokeStyle = specialConfig.colorActive;
                ctx.shadowColor = specialConfig.colorActive;
            } else {
                ctx.strokeStyle = CONFIG.pipeActive;
                ctx.shadowColor = CONFIG.pipeActive;
            }
            ctx.shadowBlur = 20;
        } else {
            if (specialConfig) {
                ctx.strokeStyle = specialConfig.color;
                ctx.shadowColor = specialConfig.color;
                ctx.shadowBlur = 10;
            } else if (hintActive && this.isSolution) {
                // Destaque da dica para o caminho certo
                ctx.strokeStyle = '#FFD700'; // Gold
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 20;
            } else {
                ctx.strokeStyle = CONFIG.pipeInactive;
                ctx.shadowBlur = 0;
            }
        }

        // Draw Pipe Shape based on BASE TYPE (since we rotated the canvas)
        ctx.beginPath();

        // Center point
        // If it's not a straight line, we usually draw from center to edge.
        // Even straight lines look better drawn as two segments meeting in middle for consistency.

        if (this.type & DIRS.N) { ctx.moveTo(0, 0); ctx.lineTo(0, -size * 0.4); }
        if (this.type & DIRS.E) { ctx.moveTo(0, 0); ctx.lineTo(size * 0.4, 0); }
        if (this.type & DIRS.S) { ctx.moveTo(0, 0); ctx.lineTo(0, size * 0.4); }
        if (this.type & DIRS.W) { ctx.moveTo(0, 0); ctx.lineTo(-size * 0.4, 0); }

        ctx.stroke();

        // Decorative "Joint" in the center
        if (this.type !== PIPE_TYPES.EMPTY) {
            if (specialConfig) {
                ctx.fillStyle = this.isLit ? '#fff' : specialConfig.color;
            } else {
                ctx.fillStyle = this.isLit ? '#fff' : '#2a1a10';
            }
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.08, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Draw special pipe icon (without rotation)
        if (specialConfig) {
            ctx.save();
            ctx.translate(cx, cy);

            // Desenhar ícone da imagem
            const icon = SPECIAL_ICONS[this.special];
            if (icon && icon.complete && icon.naturalWidth > 0) {
                const iconSize = size * 0.8; // Ícone 80% do tile para todos os lados (quadrado)
                ctx.shadowBlur = this.isLit ? 25 : 12;
                ctx.shadowColor = this.isLit ? '#fff' : specialConfig.color;
                ctx.globalAlpha = this.isLit ? 1.0 : 0.8;
                // Força proporção quadrada
                ctx.drawImage(icon, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
                ctx.globalAlpha = 1.0;
            } else {
                // Fallback visual enquanto carrega
                ctx.fillStyle = specialConfig.color;
                ctx.font = `bold ${Math.max(8, size * 0.12)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowBlur = 5;
                ctx.shadowColor = specialConfig.color;
                ctx.fillText(specialConfig.name.substring(0, 3).toUpperCase(), 0, 0);
            }
            ctx.restore();
        }
    }
}

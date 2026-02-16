/**
 * Classe Employee - Representa um colaborador no jogo
 */

class Employee {
    constructor(id, type, name, image) {
        this.id = id;
        this.type = type;  // 'blue', 'red', 'green'
        this.name = name;
        this.image = image;  // Caminho para a imagem do card
        this.patience = CONFIG.PATIENCE_MAX;
        this.location = 'reception';  // 'reception', 'waiting', 'working'
        this.slotId = null;
        this.isWorking = false;
        this.workProgress = 0;
        this.workStartTime = null;
        this.element = null;
    }

    /**
     * Obtém as informações da tarefa baseado no tipo
     */
    getTaskInfo() {
        return CONFIG.TASK_TYPES[this.type];
    }

    /**
     * Cria o elemento DOM do colaborador
     */
    createElement() {
        const el = document.createElement('div');
        el.className = `employee ${this.type}`;
        el.id = `employee-${this.id}`;
        el.dataset.id = this.id;
        
        el.innerHTML = `
            <div class="patience-container">
                <div class="patience-bar" style="width: ${this.patience}%"></div>
            </div>
            <img src="${this.image}" alt="${this.name}" class="employee-card-image" draggable="false">
        `;

        this.element = el;
        return el;
    }

    /**
     * Atualiza a UI do colaborador
     */
    updateUI() {
        if (!this.element) return;

        const patienceBar = this.element.querySelector('.patience-bar');
        if (patienceBar) {
            patienceBar.style.width = `${this.patience}%`;
            
            if (this.patience < 30) {
                patienceBar.classList.add('low');
            } else {
                patienceBar.classList.remove('low');
            }
        }

        if (this.isWorking) {
            this.element.classList.add('working');
        }
    }

    /**
     * Atualiza a paciência do colaborador
     * @param {number} deltaTime - Tempo decorrido em segundos
     * @returns {boolean} - true se ainda tem paciência, false se zerou
     */
    updatePatience(deltaTime) {
        if (this.isWorking) return true;

        const decayRate = this.location === 'reception' 
            ? CONFIG.PATIENCE_DECAY.RECEPTION 
            : CONFIG.PATIENCE_DECAY.WAITING_ROOM;
        
        this.patience -= decayRate * deltaTime;
        
        if (this.patience <= 0) {
            this.patience = 0;
            return false;
        }
        
        return true;
    }

    /**
     * Inicia o trabalho do colaborador
     */
    startWorking() {
        this.isWorking = true;
        this.location = 'working';
        this.workStartTime = Date.now();
        this.workProgress = 0;
        
        if (this.element) {
            this.element.classList.add('working');
        }
    }

    /**
     * Atualiza o progresso do trabalho
     * @returns {boolean} - true se terminou o trabalho
     */
    updateWork() {
        if (!this.isWorking || !this.workStartTime) return false;

        const taskInfo = this.getTaskInfo();
        const elapsed = Date.now() - this.workStartTime;
        this.workProgress = Math.min(100, (elapsed / taskInfo.workTime) * 100);

        return this.workProgress >= 100;
    }

    /**
     * Obtém o tempo restante de trabalho em segundos
     */
    getRemainingWorkTime() {
        if (!this.isWorking || !this.workStartTime) return 0;
        
        const taskInfo = this.getTaskInfo();
        const elapsed = Date.now() - this.workStartTime;
        const remaining = Math.max(0, taskInfo.workTime - elapsed);
        
        return Math.ceil(remaining / 1000);
    }

    /**
     * Verifica se o slot é válido para este colaborador
     * @param {string} slotType - Tipo do slot ('blue', 'red', 'green')
     */
    canWorkAt(slotType) {
        return this.type === slotType;
    }

    /**
     * Move o colaborador para um novo local
     * @param {string} location - Novo local ('reception', 'waiting', 'working')
     * @param {string} slotId - ID do slot (opcional)
     */
    moveTo(location, slotId = null) {
        this.location = location;
        this.slotId = slotId;
        
        if (location === 'waiting') {
            // Restaura um pouco da paciência ao ir para sala de espera
            this.patience = Math.min(CONFIG.PATIENCE_MAX, this.patience + 10);
        }
    }

    /**
     * Remove o elemento do DOM
     */
    remove() {
        if (this.element) {
            this.element.style.transform = 'scale(0)';
            this.element.style.opacity = '0';
            setTimeout(() => {
                if (this.element && this.element.parentNode) {
                    this.element.remove();
                }
            }, 200);
        }
    }
}

/**
 * Factory para criar colaboradores
 */
class EmployeeFactory {
    constructor() {
        this.idCounter = 0;
        this.availableEmployees = [];
        this.reset();
    }

    /**
     * Cria um novo colaborador
     * @param {string} type - Tipo opcional, se não fornecido será baseado nos disponíveis
     */
    create(type = null) {
        // Filtrar colaboradores disponíveis por tipo se especificado
        let candidates = type 
            ? this.availableEmployees.filter(e => e.type === type)
            : this.availableEmployees;
        
        if (candidates.length === 0) {
            // Se não há candidatos do tipo, pega qualquer um disponível
            candidates = this.availableEmployees;
        }
        
        if (candidates.length === 0) {
            // Se não há mais colaboradores, retorna null
            return null;
        }
        
        // Seleciona aleatoriamente um colaborador
        const randomIndex = Math.floor(Math.random() * candidates.length);
        const employeeData = candidates[randomIndex];
        
        // Remove o colaborador da lista de disponíveis
        this.availableEmployees = this.availableEmployees.filter(e => e.name !== employeeData.name);
        
        const employee = new Employee(
            ++this.idCounter,
            employeeData.type,
            employeeData.name,
            employeeData.image
        );
        
        return employee;
    }

    /**
     * Obtém um tipo aleatório baseado nos colaboradores disponíveis
     */
    getRandomType() {
        if (this.availableEmployees.length === 0) return 'blue';
        const randomEmployee = this.availableEmployees[Math.floor(Math.random() * this.availableEmployees.length)];
        return randomEmployee.type;
    }

    /**
     * Reseta a factory
     */
    reset() {
        this.idCounter = 0;
        // Cria uma cópia da lista de colaboradores
        this.availableEmployees = [...CONFIG.EMPLOYEES];
    }
}

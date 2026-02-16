# System Prompt: Padrão de Desenvolvimento de Jogos (Estilo Escolai)

Este documento define o padrão arquitetural, visual e técnico para a criação de novos jogos web para a plataforma.
Qualquer IA ou desenvolvedor deve seguir estas diretrizes rigorosamente para manter a consistência com o ecossistema existente.

## 1. Diretrizes Visuais (Theme & UI)

### Estilo e Atmosfera
- **Tema Escuro (Dark Mode):** Fundo escuro com elementos claros para criar imersão.
- **Paleta de Cores Padrão:**
  - **Background Corpo:** `#0f172a` (azul-escuro profundo para o body)
  - **Background Container:** `#1a1a2e` (azul-escuro para o game-container)
  - **Surface/Painéis:** `#262b45` (cinza-azulado para cards e painéis)
  - **Texto Principal:** `#e2e8f0` (branco suave)
  - **Texto Secundário:** `#94a3b8` (cinza claro)
  - **Acento/Sucesso:** `#81C784` (verde menta pastel)
  - **Acento Hover:** `#66BB6A` (verde mais vivo)
  - **Secundário/Info:** `#64B5F6` (azul pastel)
  - **Erro/Perigo:** `#EF5350` (vermelho suave)
  - **Alerta/Warning:** `#ed8936` (laranja)
- **Contraste:** Texto claro sobre fundo escuro. Nunca usar preto puro (#000000) como background principal.

### Dimensões e Layout
- **Resolução Fixa:** `1200x675` pixels.
- **Container:** O jogo deve ser contido em uma `div#game-container` com dimensões explicitamente fixadas em CSS.
- **Posicionamento:** Uso extensivo de `position: absolute;` para elementos de jogo (sprites, UI, personagens).
- **Responsividade:** **NÃO IMPLEMENTAR.** O jogo não deve se ajustar a telas menores (mobile). A integridade das posições (x,y) é prioritária.
- **Mobile:** Não criar controles de toque específicos ou adaptações de layout.
- **Overflow:** O `#game-container` deve ter `overflow: hidden`. Todo conteúdo (mensagens, cronómetro, botões) deve caber dentro de 1200x675.

### Tipografia
- **Família Principal:** `'Nunito', 'Segoe UI', sans-serif` — obrigatório importar via Google Fonts.
- **Família Monospace (timers/códigos):** `'Share Tech Mono', monospace` — opcional, importar se necessário.
- **Import obrigatório no HTML:**
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  ```
- **Tamanhos:** Fontes grandes e legíveis para instruções e UI.

## 2. Arquitetura Técnica

### Stack Tecnológica
- **Linguagem:** Javascript (Vanilla ES6+). **Proibido o uso de Frameworks** (React, Vue, Phaser) para jogos simples, a menos que a complexidade exija.
- **Estilos:** CSS3 Puro (Uso obrigatório de CSS Variables `:root`).
- **Markup:** HTML5 Semântico básico.

### Estrutura de Pastas (Obrigatória)
O projeto deve seguir esta organização exata para manter a consistência com os jogos atuais:

```text
nome-do-jogo/
├── index.html          # Ponto de entrada único
├── css/
│   └── style.css       # Folha de estilos única (SEMPRE style.css, nunca styles.css)
├── js/
│   ├── config.js       # Arquivo de configuração (CONSTANTS)
│   ├── game.js         # Classe principal do jogo (Controller)
│   └── [modulo].js     # Classes extras se necessário (ex: tile.js, employee.js)
└── assets/
    ├── backgrounds/    # Imagens de fundo
    ├── buttons/        # Sprites de botões e UI
    ├── icons/          # Ícones de gameplay
    └── screens/        # Imagens para telas de Intro/Win/Fail (opcional)
```

### CSS Variables Padrão (Obrigatório em `:root`)
```css
:root {
    --color-bg: #1a1a2e;
    --color-surface: #262b45;
    --color-text: #e2e8f0;
    --color-text-light: #94a3b8;
    --color-accent: #81C784;
    --color-accent-hover: #66BB6A;
    --color-secondary: #64B5F6;
    --color-error: #EF5350;
    --font-main: 'Nunito', 'Segoe UI', sans-serif;
    --font-mono: 'Share Tech Mono', monospace;
    --container-width: 1200px;
    --container-height: 675px;
}
```

### Padrões de Código (Code Style)

#### 1. Configuração Centralizada (`js/config.js`)
Obrigatório separar "Magic Numbers" da lógica. Cores, tempos, pontuações e textos devem estar neste arquivo.
```javascript
const CONFIG = {
    GAME_WIDTH: 1200,
    GAME_HEIGHT: 675,
    COLORS: {
        background: "#1a1a2e",
        surface: "#262b45",
        accent: "#81C784",
        text: "#e2e8f0"
    },
    GAMEPLAY: {
        timeLimit: 120,
        scorePerItem: 10
    }
};
```

#### 2. Orientação a Objetos (`js/game.js`)
O código principal deve ser uma Class. Não escrever código solto no escopo global.
```javascript
class GameController {
    constructor() {
        this.score = 0;
        this.init();
    }
    init() { ... }
    update() { ... }
}
// Inicialização ao carregar a página
window.onload = () => new GameController();
```

#### 3. CSS Base do Body e Container (Obrigatório)
```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    background-color: #0f172a;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    font-family: var(--font-main);
    color: var(--color-text);
    overflow: hidden;
}

#game-container {
    width: var(--container-width);
    height: var(--container-height);
    background-color: var(--color-bg);
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    border-radius: 8px;
}
```

## 3. Elementos de Interface (UX/UI)

### Fluxo de Telas (Screens)
O jogo deve implementar o conceito de "Screens" (divs de tela cheia absolute) que são mostradas/ocultadas:
1. **Intro Screen:** Título, Instruções curtas, Botão "Iniciar".
2. **Game Screen:** O container onde o jogo acontece.
3. **Overlay/Menu:** (Opcional) Pausa ou Configurações.
4. **End Screen (Victory/Defeat):** Resultado, Pontuação, Botão "Voltar ao Painel de Controlo".

### Estrutura de Tela Padrão
```css
.screen {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10;
    background-color: var(--color-bg);
    transition: opacity 0.3s ease;
}

.screen.hidden {
    opacity: 0;
    pointer-events: none;
    z-index: 0;
}

.screen.active {
    display: flex;
}
```

### Botão "Voltar ao Painel" (Obrigatório em tela de vitória)
```css
.btn-return-panel {
    background: transparent;
    border: 2px solid var(--color-accent);
    color: var(--color-accent);
    padding: 15px 40px;
    font-size: 1.1rem;
    font-family: var(--font-main);
    font-weight: 700;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s;
    margin-top: 20px;
    box-shadow: 0 0 15px rgba(129, 199, 132, 0.3);
    letter-spacing: 2px;
    border-radius: 8px;
}

.btn-return-panel:hover {
    background: var(--color-accent);
    color: #000;
    box-shadow: 0 0 30px rgba(129, 199, 132, 0.6);
}
```

### Botão de retorno — Lógica JavaScript
```html
<button class="btn-return-panel"
    onclick="localStorage.setItem('escaperoom_progress', 'N');
             window.location.href='/principal/';">
    Voltar ao Painel de Controlo
</button>
```
Onde `N` é o índice do progresso ao completar o jogo.

### Convenções de Assets
- **Backgrounds:** Imagens compatíveis com 1200x675 em PNG/JPG.
- **Botões:** Devem ter estados hover (via CSS ou troca de sprite).

## 4. Instruções para a IA Geradora
Ao receber o comando para criar um jogo:
1. **Planejamento:** Liste os arquivos que serão criados com base na estrutura acima.
2. **Config:** Defina todo o balanceamento do jogo em `config.js`.
3. **Visual:** Garanta que o CSS use tema escuro com as CSS Variables padrão.
4. **Fontes:** Sempre importe Nunito via Google Fonts no HTML.
5. **Resolução:** Container fixo de 1200x675. Tudo (cronómetro, mensagens, botões) deve caber neste espaço.
6. **Lógica:** Escreva código limpo, comentado e separado em métodos pequenos dentro da classe do jogo.
7. **Simplicidade:** Se possível, use manipulação de DOM para jogos de gerenciamento/puzzle (mais fácil de estilizar) e Canvas apenas para jogos de ação/física em tempo real.

---
**Objetivo:** Criar uma biblioteca de mini-games coesa, onde um desenvolvedor possa abrir qualquer pasta de jogo e entender a estrutura imediatamente.

# Arquitetura Técnica - Escape Room Corporativo Fidelidade

Referência técnica para agentes de IA e desenvolvedores. Consulte este documento ANTES de ler os arquivos do projeto.

---

## Visão Geral

Escape room web para treinamento corporativo da empresa Fidelidade (Portugal). O jogador interage com um **Painel de Controlo** (`principal/`) que contém 6 monitores e 6 chaves. Ele arrasta chaves sequencialmente para desbloquear monitores, cada um levando a um mini-jogo independente. Após completar os 6 jogos, o painel final pede uma senha para concluir.

**Stack:** HTML5 + CSS3 + JavaScript Vanilla (ES6+). Zero frameworks, zero build tools. Cada jogo é uma pasta independente com `index.html` como ponto de entrada.

**Resolução fixa:** 1200x675px. Sem responsividade. Sem suporte mobile.

**Padrões de código:** Definidos em `GAME_DESIGN.md` (obrigatório seguir).

---

## Estrutura de Pastas

```
escaperoom.escolai.app/
├── GAME_DESIGN.md          # Padrões visuais e técnicos (ler antes de criar jogos)
├── ARCHITECTURE.md         # Este documento
│
├── principal/              # Hub / Painel de Controlo
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── config.js       # CONFIG: telas, senhas, URLs dos jogos
│       └── game.js         # Classe ScapeRoomGame
│
├── 1_adaptacao/            # Jogo 1: Circuito Neural (puzzle de canos)
├── 2_convivencia/          # Jogo 2: Placeholder (em construção)
├── 3_navegacao/            # Jogo 3: Gestor de Tráfego (drag-and-drop)
├── 4_sincronizacao/        # Jogo 4: Chave da Sincronização (quiz)
├── 5_flexibilidade/        # Jogo 5: Lugares Certos (polyominos)
└── 6_organizacao/          # Jogo 6: Puzzle dos Cofres (keypad)
```

Cada jogo segue a mesma estrutura interna:
```
N_nome/
├── index.html
├── css/style.css
├── js/
│   ├── config.js           # Constantes, textos, balanceamento
│   ├── game.js             # Classe principal do jogo
│   └── [modulos].js        # Opcionais (tile.js, employee.js, etc.)
└── assets/
    ├── backgrounds/
    ├── buttons/
    ├── icons/
    └── screens/
```

---

## Fluxo de Navegação e Persistência

### Chave de Progresso

| Item | Valor |
|------|-------|
| **localStorage key** | `escaperoom_progress` |
| **Tipo** | String numérica (`"0"` a `"6"`) |
| **Significado** | Quantos jogos foram concluídos sequencialmente |
| **Quem escreve** | Cada jogo, ao vencer (botão "Voltar ao Painel") |
| **Quem lê** | `principal/js/game.js` no `init()` via `loadProgress()` |

### Sequência Completa

```
1. Jogador abre /principal/
2. Hub lê localStorage → restaura estado visual
3. Monitor N+1 está "ativo" (amarelo, aguardando chave)
4. Jogador arrasta chave → monitor mostra "LIBERADO"
5. Após 2s → window.location.href = gameUrl do jogo N+1
6. Jogador completa o jogo → tela de vitória com botão "Voltar ao Painel"
7. Botão salva localStorage("escaperoom_progress", N+1) e redireciona para /principal/
8. Volta ao passo 2 (próximo jogo ativo)
9. Após 6 jogos → painel final ativo → pede senha "123"
10. Senha correta → tela de vitória final
```

### Mapeamento Monitores → Jogos

| Índice | Monitor ID | Label | gameUrl | Progresso ao completar |
|--------|-----------|-------|---------|----------------------|
| 0 | screen-1 | Adaptação | `/1_adaptacao/` | `"1"` |
| 1 | screen-2 | Convivência | `/2_convivencia/` | `"2"` |
| 2 | screen-3 | Navegação | `/3_navegacao/` | `"3"` |
| 3 | screen-4 | Sincronização | `/4_sincronizacao/` | `"4"` |
| 4 | screen-5 | Flexibilidade | `/5_flexibilidade/` | `"5"` |
| 5 | screen-6 | Organização | `/6_organizacao/` | `"6"` |

Esta tabela está definida em `principal/js/config.js` → `CONFIG.SCREENS[]`.

---

## Painel de Controlo (principal/)

### Arquivos-chave

| Arquivo | Responsabilidade |
|---------|-----------------|
| `js/config.js` | `CONFIG` com SCREENS (posição, label, gameUrl), PASSWORDS, KEYS, COLORS |
| `js/game.js` | Classe `ScapeRoomGame` — toda a lógica do hub |
| `css/style.css` | Estilos dos monitores, chaves, modal, feedback |
| `index.html` | Container, modal de senha, tela de feedback |

### Classe ScapeRoomGame — Métodos Principais

| Método | O que faz |
|--------|-----------|
| `loadProgress()` | Lê `localStorage.getItem("escaperoom_progress")` |
| `restoreVisualState()` | Marca monitores concluídos (`.completed`), esconde chaves usadas, ativa próximo monitor ou painel final |
| `createScreens()` | Cria divs dos monitores com labels baseados no CONFIG |
| `createKeys()` | Cria 6 chaves arrastáveis no `#keys-container` |
| `useKeyOnScreen()` | Anima "LIBERADO" e navega para `gameUrl` após 2s |
| `activateFinalPanel()` | Ativa o terminal mestre após 6 jogos |
| `checkPassword()` | Compara input com `CONFIG.PASSWORDS.final` (`"123"`) |
| `triggerVictory()` | Mostra tela de vitória final |

### Estados visuais dos monitores (classes CSS)

| Classe | Significado | Visual |
|--------|-------------|--------|
| `.locked` | Jogo ainda não disponível | Cinza, "BLOQUEADO" |
| `.active` | Aguardando chave (próximo na fila) | Amarelo pulsante, "AGUARDANDO CHAVE" |
| `.unlocked` | Chave acabou de ser usada | Verde brilhante, "LIBERADO" |
| `.completed` | Jogo já concluído | Verde escuro, "CONCLUÍDO ✓" |

---

## Referência por Jogo

### 1_adaptacao — Circuito Neural

| Item | Valor |
|------|-------|
| **Classe JS** | `NeuralCircuit` (em `js/game.js`) |
| **Inicialização** | `js/main.js` → `new NeuralCircuit('gameCanvas')` |
| **Método de vitória** | `triggerWin()` → mostra `#overlay` |
| **Módulos extras** | `js/tile.js` (classe Tile), `js/config.js` (grid, pipes) |
| **Mecânica** | Puzzle de canos em canvas. Clique para rodar peças. Fluxo deve passar pelos 3R na ordem. |
| **Botão de retorno** | No `#overlay` do HTML, salva progresso `"1"` |
| **Fontes externas** | Google Fonts: Nunito |

### 2_convivencia — Placeholder

| Item | Valor |
|------|-------|
| **Classe JS** | `GameController` (em `js/game.js`) |
| **Método de retorno** | `completeAndReturn()` → salva progresso `"2"` |
| **Estado** | Placeholder funcional. Tela com mensagem "em construção" e botão de avanço. |
| **Fontes externas** | Google Fonts: Nunito |

### 3_navegacao — Gestor de Tráfego

| Item | Valor |
|------|-------|
| **Classe JS** | `Game` (em `js/game.js`) |
| **Método de vitória** | `gameOver(true)` → mostra `#message-overlay` |
| **Módulos extras** | `js/employee.js` (EmployeeFactory), `js/dragdrop.js` (DragDropManager) |
| **Mecânica** | Drag-and-drop de colaboradores para salas corretas dentro do tempo. |
| **Botão de retorno** | `#return-panel-btn` dentro de `#message-overlay`, visível só na vitória. Salva `"3"`. |
| **CSS** | `css/style.css` |
| **Fontes externas** | Google Fonts: Nunito |

### 4_sincronizacao — Chave da Sincronização

| Item | Valor |
|------|-------|
| **Classe JS** | `GameController` (em `js/game.js`) |
| **Método de vitória** | `handleVictory()` → mostra `#victory-screen` |
| **Mecânica** | Quiz de cenários de reuniões híbridas. Escolher ação corretiva. |
| **Botão de retorno** | Dentro de `#victory-screen .victory-content`, salva `"4"`. |
| **Fontes externas** | Google Fonts: Nunito |

### 5_flexibilidade — Lugares Certos

| Item | Valor |
|------|-------|
| **Classe JS** | `GameController` (em `js/game.js`) |
| **Método de vitória** | `endGame(true)` → mostra `#victory-screen` |
| **Mecânica** | Polyominos — arrastar equipas (formas irregulares) para encaixar em espaços livres. |
| **Botão de retorno** | Dentro de `#victory-screen`, salva `"5"`. |
| **Fontes externas** | Font Awesome 6.0.0 (CDN), Google Fonts implícita |

### 6_organizacao — Puzzle dos Cofres

| Item | Valor |
|------|-------|
| **Classe JS** | `CofresGame` (em `js/game.js`) |
| **Método de vitória** | `gameOver(true)` → mostra `#end-screen` |
| **Módulos extras** | `js/soundService.js` (áudio) |
| **Mecânica** | Escolher armário, definir PIN, depois reencontrar e desbloquear. |
| **Botão de retorno** | `#return-panel-btn` dentro de `#end-screen`, visível só na vitória. Salva `"6"`. |
| **Fontes externas** | Google Fonts: Nunito, Share Tech Mono |

---

## Guia de Alterações Comuns

### Adicionar um novo jogo

1. Criar pasta `N_nomedojogo/` seguindo a estrutura de `GAME_DESIGN.md`
2. No `principal/js/config.js`:
   - Adicionar entrada em `CONFIG.SCREENS[]` com `gameUrl: "/N_nomedojogo/"`
   - Atualizar `CONFIG.KEYS.count` se necessário
3. No HTML do novo jogo: adicionar botão de retorno com `localStorage.setItem('escaperoom_progress', 'N')` e redirect para `/principal/`
4. Atualizar os valores de progresso dos jogos subsequentes (se inserir no meio da sequência)

### Alterar a ordem dos jogos

1. Reordenar `CONFIG.SCREENS[]` em `principal/js/config.js`
2. Atualizar o valor de progresso salvo pelo botão de retorno de CADA jogo afetado (no onclick do HTML)
3. Os índices devem ser sequenciais: jogo na posição 0 salva `"1"`, posição 1 salva `"2"`, etc.

### Alterar a senha final

Editar `CONFIG.PASSWORDS.final` em `principal/js/config.js`. Atualmente é `"123"`.

### Alterar textos/labels dos monitores

Editar a propriedade `label` de cada item em `CONFIG.SCREENS[]` em `principal/js/config.js`.

### Alterar a tela de vitória final (após senha)

Editar o método `triggerVictory()` em `principal/js/game.js` e/ou o HTML do `#feedback-screen` em `principal/index.html`.

### Resetar progresso (debug)

Executar no console do navegador:
```javascript
localStorage.removeItem('escaperoom_progress');
```
Ou para forçar um progresso específico:
```javascript
localStorage.setItem('escaperoom_progress', '3'); // Simula 3 jogos concluídos
```

### Substituir o placeholder do jogo 2

Substituir os arquivos em `2_convivencia/`. Manter o botão de retorno que salva progresso `"2"` e redireciona para `/principal/`.

### Alterar visual dos monitores no hub

Editar `principal/css/style.css`. As classes relevantes são: `.monitor`, `.monitor.locked`, `.monitor.active`, `.monitor.unlocked`, `.monitor.completed`, `.monitor-label`.

---

## Dependências Externas

| Recurso | Usado por |
|---------|-----------|
| Google Fonts: Nunito | Todos os jogos (obrigatório) |
| Google Fonts: Share Tech Mono | 6_organizacao (timers/códigos) |
| Font Awesome 6.0.0 | 5_flexibilidade |

Todos os jogos importam obrigatoriamente a fonte Nunito via Google Fonts.

---

## Notas Importantes

- **CSS do jogo 3** foi renomeado para `style.css` para manter consistência com os outros jogos.
- **Jogo 2** é um placeholder funcional. Quando o jogo real for criado, substituir os arquivos mantendo o mecanismo de retorno.
- **Todos os jogos** são independentes e podem funcionar isoladamente acessando o `index.html` direto. A integração com o hub é feita apenas via localStorage + redirect.
- **Não há backend.** Toda a persistência é via localStorage no navegador do jogador.
- **Não há build process.** Editar os arquivos diretamente.

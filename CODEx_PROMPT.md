# Prompt para o Codex (versão atual do FinFlow)

## Stack existente
- Projeto **React 18 + Vite 5** já configurado e funcionando (`npm install`/`npm run dev`).
- Componentes de dashboard em `src/components` e widgets individuais em `src/widgets`.
- Layout arrastável usa `react-grid-layout` e já está integrado em `src/components/Dashboard.jsx`.
- Utilitários: `classnames`, `dayjs` (com plugins ISO week) e helpers de formato em `src/utils/format.js`.
- Estilos globais em `src/styles/global.css` controlam cards (`.widget-card`), cabeçalhos (`.widget-header`) e linhas de categoria.

> **Não gerar** novos projetos, arquivos base (como `index.html`, `main.jsx`, `App.jsx`, `vite.config.js`, `package*.json`) ou alterar widgets que não sejam o de metas.

## Objetivo pontual
Ajustar **apenas** o widget `Metas de gastos` que está implementado em `src/widgets/GoalsWidget.jsx`, mantendo o restante do dashboard intacto e compatível com o layout mostrado no screenshot oficial (cards claros, sombras suaves, colunas 4x8).

## Requisitos do ajuste
1. **Cabeçalho do widget**
   - Título "Metas de gastos" + subtítulo "Acompanhe suas metas por categoria" usando `var(--text-muted)`.
   - Seletor de período (Mensal/Semanal) reutilizando os botões já existentes (`.period-selector button`) e ids `goalsPrevPeriod` / `goalsNextPeriod` nas setas de navegação.
2. **Comportamento compacto vs. expandido**
   - Recebe `isExpanded` via props (já passado pelo `Dashboard`).
   - Compacto: mostrar somente **top 3** categorias pelo gasto do período + mensagem "Aumente o widget..." caso haja mais itens.
   - Expandido: listar todas as categorias com metas/gastos, exibir banner resumo com meta total, gasto total e economia mensal/anual.
3. **Dados**
   - Usar `expenses` e `spendingGoals` de `src/data/spending.js`.
   - Calcular montantes e percentuais por categoria e período (mensal ou semanal), conforme o já iniciado no arquivo.
   - Estado vazio: se não houver metas para o período, mostrar card com emoji 🎯, texto de incentivo e botão "Configurar metas" chamando `abrirConfiguracaoMeta`.
4. **Visual**
   - Manter o estilo das classes existentes (`.category-row`, `.progress-bar`, `.summary-banner`).
   - Fundos/textos sempre via variáveis de tema: `var(--card)`, `var(--text-main)`, `var(--text-muted)`.
   - Barras coloridas podem usar o mapa `CATEGORY_COLORS` definido no próprio arquivo.
5. **Escopo das alterações**
   - Preferir manter mudanças restritas a `src/widgets/GoalsWidget.jsx`.
   - Só toque em outros arquivos se for impossível evitar; nesse caso explique claramente no patch o porquê.

## Checklist final antes de enviar o patch
- [ ] Nenhum arquivo novo criado nem arquivos principais sobrescritos.
- [ ] GoalsWidget continua integrado ao `widgetsConfig` existente.
- [ ] Código compila com `npm run build`.
- [ ] Layout permanece igual ao design moderno do FinFlow (cards atuais, não versões antigas).

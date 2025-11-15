# Prompt para o Codex

Contexto existente:
- Projeto React já configurado para o dashboard FinFlow; não criar novo projeto, nem sobrescrever arquivos globais como `package.json`, `vite.config.js` ou `index.html`.
- Estrutura atual segue widgets arrastáveis/redimensionáveis; componentes principais localizados em `src/dashboard` e `src/widgets`.
- Dependências já presentes incluem `react`, `react-dom`, `react-grid-layout`, `classnames` e `dayjs`. Não adicionar novas libs nem remover as existentes.

Objetivo: Ajustar apenas o widget "Metas de gastos" preservando o restante do projeto.

Tarefas específicas:
1. Atualizar `src/widgets/GoalsWidget.jsx` para implementar o layout detalhado de metas por categoria.
   - Cabeçalho com título, subtítulo, seletor Mensal/Semanal e navegação por período (botões com ids `goalsPrevPeriod` e `goalsNextPeriod`).
   - Lógica para alternar entre modo compacto (mostrar top 3 categorias) e modo expandido (todas as categorias + resumo com economia mensal/anual).
   - Barras de progresso coloridas por categoria, usando dados reais de gastos/metas já fornecidos pelos utilitários existentes.
   - Estado vazio amigável caso não haja metas para o período e botão de "Configurar metas" chamando `abrirConfiguracaoMeta(categoria)`.
2. Garantir que o widget use as variáveis de tema (`var(--card)`, `var(--text-main)`, `var(--text-muted)`) em vez de cores fixas para fundo e textos.
3. Reutilizar helpers/utilitários já existentes (ex.: formatação monetária, filtros de período). Se precisar de ajustes nesses helpers, editar apenas os arquivos relevantes em `src/utils/` sem alterar API pública.
4. Manter integração com o sistema de widgets: respeitar props de tamanho/redimensionamento e não alterar outros widgets ou a configuração geral.
5. Não modificar arquivos fora de `src/widgets/GoalsWidget.jsx` e, se indispensável, documentar no comentário do patch o motivo da alteração em cada arquivo adicional.

Saída esperada: patch mínimo com as alterações descritas acima, sem gerar arquivos novos nem remover arquivos existentes.

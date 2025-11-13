import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekday from 'dayjs/plugin/weekday';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import updateLocale from 'dayjs/plugin/updateLocale';
import 'dayjs/locale/pt-br';
import classNames from 'classnames';
import { expenses, spendingGoals } from '../data/spending.js';
import { formatCurrency, formatPercent } from '../utils/format.js';

const CATEGORY_ORDER = [
  'Alimentação',
  'Transporte',
  'Prestadores de serviço',
  'Lazer',
  'Assinaturas e serviços',
  'Tarifas bancárias',
  'Marketing',
  'Outros'
];

const CATEGORY_COLORS = {
  Alimentação: '#2563eb',
  Transporte: '#f97316',
  'Prestadores de serviço': '#10b981',
  Lazer: '#a855f7',
  'Assinaturas e serviços': '#facc15',
  'Tarifas bancárias': '#06b6d4',
  Marketing: '#ef4444',
  Outros: '#4b5563'
};

dayjs.extend(isoWeek);
dayjs.extend(weekday);
dayjs.extend(localizedFormat);
dayjs.extend(updateLocale);
dayjs.locale('pt-br');
dayjs.updateLocale('pt-br', {
  weekStart: 1
});

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const abrirConfiguracaoMeta = (categoria) => {
  console.log(`Abrir configuração de meta para ${categoria}`);
};

const buildCategorySet = (periodExpenses, periodGoals) => {
  const set = new Set(CATEGORY_ORDER);
  periodExpenses.forEach((item) => set.add(item.categoria));
  periodGoals.forEach((item) => set.add(item.categoria));
  return Array.from(set);
};

const sortCategories = (list) => {
  const orderMap = new Map();
  CATEGORY_ORDER.forEach((name, index) => orderMap.set(name, index));
  return list.sort((a, b) => {
    const orderA = orderMap.has(a) ? orderMap.get(a) : CATEGORY_ORDER.length + a.localeCompare(b);
    const orderB = orderMap.has(b) ? orderMap.get(b) : CATEGORY_ORDER.length + b.localeCompare(a);
    return orderA - orderB;
  });
};

const GoalsWidget = ({ isExpanded }) => {
  const [periodMode, setPeriodMode] = useState('mensal');
  const [baseDate, setBaseDate] = useState(() => dayjs());

  const { label, year, month, week } = useMemo(() => {
    if (periodMode === 'mensal') {
      const formatted = capitalize(baseDate.format('MMMM YYYY'));
      return {
        label: formatted,
        year: baseDate.year(),
        month: baseDate.month() + 1
      };
    }
    const start = baseDate.startOf('week');
    const end = baseDate.endOf('week');
    return {
      label: `Semana de ${capitalize(start.format('DD MMM'))} – ${capitalize(end.format('DD MMM YYYY'))}`,
      year: baseDate.isoWeekYear(),
      week: baseDate.isoWeek()
    };
  }, [baseDate, periodMode]);

  const data = useMemo(() => {
    const filteredExpenses = expenses.filter((expense) => {
      const date = dayjs(expense.data);
      if (periodMode === 'mensal') {
        return date.year() === year && date.month() + 1 === month;
      }
      return date.isoWeekYear() === year && date.isoWeek() === week;
    });

    const filteredGoals = spendingGoals.filter((goal) => {
      if (periodMode === 'mensal') {
        return goal.tipoPeriodo === 'mensal' && goal.ano === year && goal.mes === month;
      }
      return goal.tipoPeriodo === 'semanal' && goal.ano === year && goal.semanaISO === week;
    });

    const categories = sortCategories(buildCategorySet(filteredExpenses, filteredGoals));

    const metaTotal = filteredGoals.reduce((acc, goal) => acc + goal.valorMeta, 0);
    const gastosTotais = filteredExpenses.reduce((acc, item) => acc + item.valor, 0);

    const categorySummaries = categories
      .map((categoria) => {
        const gastosCategoria = filteredExpenses.filter((item) => item.categoria === categoria);
        const metasCategoria = filteredGoals.filter((goal) => goal.categoria === categoria);
        const gastoPeriodo = gastosCategoria.reduce((acc, item) => acc + item.valor, 0);
        const metaPeriodo = metasCategoria.reduce((acc, item) => acc + item.valorMeta, 0);
        const percentualGasto = metaPeriodo > 0 ? (gastoPeriodo / metaPeriodo) * 100 : gastoPeriodo > 0 ? Infinity : 0;
        const percentualMetaNoTotal = metaTotal > 0 ? (metaPeriodo / metaTotal) * 100 : 0;

        return {
          categoria,
          gastoPeriodo,
          metaPeriodo,
          percentualGasto,
          percentualMetaNoTotal
        };
      })
      .sort((a, b) => b.gastoPeriodo - a.gastoPeriodo);

    const economiaPeriodo = Math.max(0, metaTotal - gastosTotais);
    const economiaMensal = periodMode === 'mensal' ? economiaPeriodo : economiaPeriodo * 4.33;
    const economiaAnual = economiaMensal * 12;

    return {
      categories: categorySummaries,
      metaTotal,
      gastosTotais,
      economiaMensal,
      economiaAnual,
      temMetas: filteredGoals.length > 0
    };
  }, [periodMode, year, month, week]);

  const categoriasVisiveis = useMemo(() => {
    if (isExpanded) return data.categories;
    return data.categories.slice(0, 3);
  }, [data.categories, isExpanded]);

  const handlePrev = () => {
    setBaseDate((current) => (periodMode === 'mensal' ? current.subtract(1, 'month') : current.subtract(1, 'week')));
  };

  const handleNext = () => {
    setBaseDate((current) => (periodMode === 'mensal' ? current.add(1, 'month') : current.add(1, 'week')));
  };

  const handleChangeMode = (mode) => {
    setPeriodMode(mode);
    setBaseDate((current) => (mode === 'mensal' ? current.date(1) : current.startOf('week').add(3, 'day')));
  };

  const renderCategoryRow = (category) => {
    const color = CATEGORY_COLORS[category.categoria] || '#6366f1';
    const fillWidth = category.metaPeriodo > 0 ? Math.min((category.gastoPeriodo / category.metaPeriodo) * 100, 100) : 0;
    const overflow = category.metaPeriodo > 0 && category.gastoPeriodo > category.metaPeriodo;

    return (
      <div className="category-row" key={category.categoria}>
        <div className="category-row-header">
          <span className="category-chip" style={{ background: color }}>
            {category.categoria.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>{category.categoria}</strong>
            <div className="category-row-info">
              <span>
                {periodMode === 'mensal' ? 'Mês' : 'Semana'}:{' '}
                <strong>
                  {formatCurrency(category.gastoPeriodo)} ({formatPercent(category.percentualGasto)})
                </strong>
              </span>
              <span style={{ color: '#16a34a', fontWeight: 600 }}>
                Meta: {formatCurrency(category.metaPeriodo)} ({formatPercent(category.percentualMetaNoTotal)})
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${fillWidth}%`, background: color }} />
            {category.metaPeriodo > 0 && <div className="progress-target" style={{ left: '100%' }} />}
          </div>
          {category.metaPeriodo === 0 && (
            <div className="category-row-info" style={{ justifyContent: 'space-between' }}>
              <span>Defina uma meta para esta categoria.</span>
              <span className="category-row-actions" onClick={() => abrirConfiguracaoMeta(category.categoria)}>
                Criar meta
              </span>
            </div>
          )}
          {overflow && (
            <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 600 }}>
              Você ultrapassou a meta em {formatCurrency(category.gastoPeriodo - category.metaPeriodo)}.
            </span>
          )}
        </div>
      </div>
    );
  };

  if (!data.temMetas) {
    return (
      <div className="widget-frame" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header className="widget-header">
          <div className="widget-header-top">
            <div>
              <h3>Metas de gastos</h3>
              <p style={{ color: 'var(--text-muted)' }}>Acompanhe suas metas por categoria</p>
            </div>
          </div>
        </header>
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>🎯</span>
          <p>Você ainda não definiu metas de gastos para este período.</p>
          <button type="button" onClick={() => abrirConfiguracaoMeta('todas')}>Configurar metas</button>
        </div>
      </div>
    );
  }

  return (
    <div className="widget-frame" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <header className="widget-header">
        <div className="widget-header-top">
          <div>
            <h3>Metas de gastos</h3>
            <p style={{ color: 'var(--text-muted)' }}>Acompanhe suas metas por categoria</p>
          </div>
          <div className="widget-header-controls">
            <div className="period-selector">
              <button
                type="button"
                className={classNames({ active: periodMode === 'mensal' })}
                onClick={() => handleChangeMode('mensal')}
              >
                Mensal
              </button>
              <button
                type="button"
                className={classNames({ active: periodMode === 'semanal' })}
                onClick={() => handleChangeMode('semanal')}
              >
                Semanal
              </button>
            </div>
            <div className="period-nav">
              <button id="goalsPrevPeriod" type="button" onClick={handlePrev}>
                ⟵
              </button>
              <span>{label}</span>
              <button id="goalsNextPeriod" type="button" onClick={handleNext}>
                ⟶
              </button>
            </div>
          </div>
        </div>
      </header>

      {isExpanded && (
        <div className="summary-banner">
          <p style={{ marginBottom: 8 }}>
            Ao cumprir suas metas, você economizará <strong>{formatCurrency(data.economiaMensal)}</strong> todos os meses,
            totalizando <strong>{formatCurrency(data.economiaAnual)}</strong> no ano.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span>
              Meta total: <strong>{formatCurrency(data.metaTotal)}</strong>
            </span>
            <span>
              Gasto total: <strong>{formatCurrency(data.gastosTotais)}</strong>
            </span>
          </div>
        </div>
      )}

      <div className={classNames({ 'widget-content-scroll': isExpanded })} style={{ flex: 1 }}>
        {categoriasVisiveis.map((categoria) => renderCategoryRow(categoria))}
      </div>

      {!isExpanded && data.categories.length > 3 && (
        <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 12 }}>
          Aumente o widget para ver todas as categorias e detalhes das metas.
        </p>
      )}
    </div>
  );
};

export default GoalsWidget;

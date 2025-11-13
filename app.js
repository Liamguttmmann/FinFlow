const btnAdicionarGasto = document.getElementById('btnAdicionarGasto');
const btnImportarFatura = document.getElementById('btnImportarFatura');
const modalAdicionarGasto = document.getElementById('modalAdicionarGasto');
const modalImportarFatura = document.getElementById('modalImportarFatura');
const formAdicionarGasto = document.getElementById('formAdicionarGasto');
const tabelaGastos = document.querySelector('#tabelaGastos tbody');
const estadoVazio = document.getElementById('estadoVazio');
const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
const btnEnviarFatura = document.getElementById('btnEnviarFatura');

let currentRange = '30d';
let gastos = [];
let rendaMensal = 9000;
let editandoId = null;
let chartInstance = null;

const coresCategorias = {
  'Despesas obrigatórias': '#2F855A',
  'Despesas não obrigatórias': '#2B6CB0',
  Financiamentos: '#DD6B20',
  Dívidas: '#B83280',
  Investimentos: '#38A169',
  'Empresa e autônomo': '#805AD5',
  Projetos: '#D69E2E',
  Outros: '#4A5568'
};

const categoriasPadrao = Object.keys(coresCategorias);

const formatoMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const formatoData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});

function carregarDados() {
  const dadosLocal = localStorage.getItem('finflow_gastos');
  if (dadosLocal) {
    try {
      gastos = JSON.parse(dadosLocal);
    } catch (error) {
      gastos = [];
    }
  } else {
    gastos = gerarGastosExemplo();
  }

  const rendaSalva = localStorage.getItem('finflow_renda');
  if (rendaSalva) {
    const renda = Number(rendaSalva);
    if (!Number.isNaN(renda)) {
      rendaMensal = renda;
    }
  }
}

function salvarDados() {
  localStorage.setItem('finflow_gastos', JSON.stringify(gastos));
}

function gerarGastosExemplo() {
  const hoje = new Date();
  return [
    {
      id: crypto.randomUUID(),
      data: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 3).toISOString(),
      descricao: 'Supermercado Viva',
      tipo: 'Variável',
      categoria: 'Despesas obrigatórias',
      etiqueta: 'Cartão Visa',
      valor: 420.5
    },
    {
      id: crypto.randomUUID(),
      data: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 12).toISOString(),
      descricao: 'Plano de internet',
      tipo: 'Fixo',
      categoria: 'Despesas obrigatórias',
      etiqueta: 'Residência',
      valor: 149.9
    },
    {
      id: crypto.randomUUID(),
      data: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 18).toISOString(),
      descricao: 'Restaurante',
      tipo: 'Variável',
      categoria: 'Despesas não obrigatórias',
      etiqueta: 'Cartão Nubank',
      valor: 230.0
    },
    {
      id: crypto.randomUUID(),
      data: new Date(hoje.getFullYear(), hoje.getMonth() - 2, hoje.getDate() - 10).toISOString(),
      descricao: 'Parcela do carro',
      tipo: 'Fixo',
      categoria: 'Financiamentos',
      etiqueta: 'Banco X',
      valor: 980.0
    },
    {
      id: crypto.randomUUID(),
      data: new Date(hoje.getFullYear(), hoje.getMonth() - 4, hoje.getDate() - 2).toISOString(),
      descricao: 'Aporte em investimentos',
      tipo: 'Variável',
      categoria: 'Investimentos',
      etiqueta: 'Corretora',
      valor: 1200.0
    },
    {
      id: crypto.randomUUID(),
      data: new Date(hoje.getFullYear(), hoje.getMonth() - 5, hoje.getDate() - 6).toISOString(),
      descricao: 'Curso de fotografia',
      tipo: 'Variável',
      categoria: 'Projetos',
      etiqueta: 'Aprendizado',
      valor: 690.0
    }
  ];
}

function exibirModal(modal) {
  modal.hidden = false;
}

function fecharModal(modal) {
  modal.hidden = true;
  if (modal === modalAdicionarGasto) {
    formAdicionarGasto.reset();
    editandoId = null;
  }
}

function definirRange(range) {
  currentRange = range;
  filterButtons.forEach((btn) => {
    btn.classList.toggle('filter-btn--active', btn.dataset.range === range);
  });
  atualizarInterface();
}

function filtrarGastosPorPeriodo() {
  const agora = new Date();
  const inicio = new Date(agora);

  if (currentRange === '7d') {
    inicio.setDate(agora.getDate() - 7);
  } else if (currentRange === '30d') {
    inicio.setDate(agora.getDate() - 30);
  } else if (currentRange === '6m') {
    inicio.setMonth(agora.getMonth() - 6);
  }

  return gastos.filter((gasto) => {
    const data = new Date(gasto.data);
    return data >= inicio && data <= agora;
  });
}

function atualizarInterface() {
  const gastosFiltrados = filtrarGastosPorPeriodo();
  atualizarGraficoBarras(gastosFiltrados, rendaMensal);
  renderizarTabelaGastos(gastosFiltrados);
}

function mapearCategoriaStack(categoria) {
  if (!categoria) return 'Outros';
  const categoriaNormalizada = categoria.toLowerCase();

  const correspondencias = [
    { chaves: ['obrigatoria', 'moradia', 'supermercado', 'conta', 'energia', 'luz'], categoria: 'Despesas obrigatórias' },
    { chaves: ['nao obrigatoria', 'lazer', 'restaurante', 'compras'], categoria: 'Despesas não obrigatórias' },
    { chaves: ['financiamento', 'parcela', 'consorcio'], categoria: 'Financiamentos' },
    { chaves: ['divida', 'emprestimo'], categoria: 'Dívidas' },
    { chaves: ['invest', 'aporte', 'renda passiva'], categoria: 'Investimentos' },
    { chaves: ['empresa', 'autonomo', 'negocio'], categoria: 'Empresa e autônomo' },
    { chaves: ['projeto', 'curso', 'educacao'], categoria: 'Projetos' }
  ];

  const encontrada = correspondencias.find((item) =>
    item.chaves.some((chave) => categoriaNormalizada.includes(chave))
  );

  return encontrada ? encontrada.categoria : categoriasPadrao.find((cat) => cat.toLowerCase() === categoriaNormalizada) || 'Outros';
}

function obterResumoCategorias(gastosFiltrados) {
  const resumo = categoriasPadrao.reduce((acc, categoria) => {
    acc[categoria] = 0;
    return acc;
  }, {});

  let total = 0;

  gastosFiltrados.forEach((gasto) => {
    const categoriaStack = mapearCategoriaStack(gasto.categoria);
    resumo[categoriaStack] += Number(gasto.valor) || 0;
    total += Number(gasto.valor) || 0;
  });

  return { resumo, total };
}

function atualizarGraficoBarras(gastosFiltrados, totalRenda) {
  const { resumo, total } = obterResumoCategorias(gastosFiltrados);
  const labels = ['Rendas', 'Gastos'];

  const dadosCategorias = categoriasPadrao.map((categoria) => resumo[categoria]);
  const datasets = [];

  datasets.push({
    label: 'Rendas',
    data: [totalRenda, 0],
    backgroundColor: '#38A169',
    borderRadius: 12,
    stack: 'Renda'
  });

  categoriasPadrao.forEach((categoria, index) => {
    datasets.push({
      label: categoria,
      data: [0, dadosCategorias[index]],
      backgroundColor: coresCategorias[categoria],
      stack: 'Gastos',
      borderRadius: index === categoriasPadrao.length - 1 ? { topLeft: 12, topRight: 12 } : 0
    });
  });

  const ctx = document.getElementById('gastosChart');

  if (chartInstance) {
    chartInstance.data.labels = labels;
    chartInstance.data.datasets = datasets;
    chartInstance.update();
  } else {
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label(context) {
                const categoria = context.dataset.label;
                if (categoria === 'Rendas') {
                  return `${categoria}: ${formatoMoeda.format(context.parsed.y)}`;
                }
                const valor = context.raw || 0;
                const percentual = total ? ((valor / total) * 100).toFixed(1) : 0;
                return `${categoria}: ${formatoMoeda.format(valor)} (${percentual}%)`;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            ticks: { color: '#52606d', font: { weight: '600' } },
            grid: { display: false }
          },
          y: {
            stacked: true,
            ticks: {
              color: '#52606d',
              font: { weight: '600' },
              callback(value) {
                return formatoMoeda.format(value);
              }
            },
            grid: { color: 'rgba(82, 96, 109, 0.16)' }
          }
        }
      }
    });
  }

  renderizarLegenda(resumo, total);
}

function renderizarLegenda(resumo, total) {
  const legendContainer = document.getElementById('chartLegend');
  legendContainer.innerHTML = '';

  categoriasPadrao.forEach((categoria) => {
    const valor = resumo[categoria];
    if (!valor) return;
    const percentual = total ? ((valor / total) * 100).toFixed(1) : 0;

    const item = document.createElement('div');
    item.className = 'chart-legend__item';

    const marcador = document.createElement('span');
    marcador.className = 'chart-legend__color';
    marcador.style.backgroundColor = coresCategorias[categoria];

    const texto = document.createElement('span');
    texto.textContent = `${categoria} · ${formatoMoeda.format(valor)} (${percentual}%)`;

    item.appendChild(marcador);
    item.appendChild(texto);
    legendContainer.appendChild(item);
  });
}

function renderizarTabelaGastos(gastosFiltrados) {
  tabelaGastos.innerHTML = '';

  if (!gastosFiltrados.length) {
    estadoVazio.hidden = false;
    return;
  }

  estadoVazio.hidden = true;

  const ordenados = [...gastosFiltrados].sort((a, b) => new Date(b.data) - new Date(a.data));

  ordenados.forEach((gasto) => {
    const linha = document.createElement('tr');
    linha.dataset.id = gasto.id;

    const data = document.createElement('td');
    data.textContent = formatoData.format(new Date(gasto.data));

    const descricao = document.createElement('td');
    descricao.textContent = gasto.descricao;

    const tipo = document.createElement('td');
    tipo.textContent = gasto.tipo;

    const categoria = document.createElement('td');
    categoria.textContent = gasto.categoria || 'Outros';

    const etiqueta = document.createElement('td');
    etiqueta.textContent = gasto.etiqueta || '—';

    const valor = document.createElement('td');
    valor.className = 'col-valor';
    valor.textContent = formatoMoeda.format(Number(gasto.valor) || 0);

    linha.appendChild(data);
    linha.appendChild(descricao);
    linha.appendChild(tipo);
    linha.appendChild(categoria);
    linha.appendChild(etiqueta);
    linha.appendChild(valor);

    linha.addEventListener('click', () => prepararEdicaoGasto(gasto.id));

    tabelaGastos.appendChild(linha);
  });
}

function prepararEdicaoGasto(id) {
  const gasto = gastos.find((item) => item.id === id);
  if (!gasto) return;

  editandoId = id;
  exibirModal(modalAdicionarGasto);

  document.getElementById('gastoData').value = gasto.data.slice(0, 10);
  document.getElementById('gastoDescricao').value = gasto.descricao;
  document.getElementById('gastoTipo').value = gasto.tipo;
  document.getElementById('gastoCategoria').value = gasto.categoria;
  document.getElementById('gastoEtiqueta').value = gasto.etiqueta || '';
  document.getElementById('gastoValor').value = Number(gasto.valor);
}

function criarNovoGasto(dados) {
  return {
    id: crypto.randomUUID(),
    ...dados
  };
}

function atualizarGasto(id, dados) {
  gastos = gastos.map((gasto) => (gasto.id === id ? { ...gasto, ...dados } : gasto));
}

function analisarFatura() {
  fecharModal(modalImportarFatura);
  console.log('Placeholder de análise de fatura acionado.');
}

function configurarEventos() {
  btnAdicionarGasto.addEventListener('click', () => exibirModal(modalAdicionarGasto));
  btnImportarFatura.addEventListener('click', () => exibirModal(modalImportarFatura));

  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      const modal = event.target.closest('.modal-overlay');
      if (modal) fecharModal(modal);
    });
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => definirRange(btn.dataset.range));
  });

  formAdicionarGasto.addEventListener('submit', (event) => {
    event.preventDefault();

    const dados = {
      data: document.getElementById('gastoData').value,
      descricao: document.getElementById('gastoDescricao').value,
      tipo: document.getElementById('gastoTipo').value,
      categoria: document.getElementById('gastoCategoria').value,
      etiqueta: document.getElementById('gastoEtiqueta').value,
      valor: Number(document.getElementById('gastoValor').value)
    };

    if (editandoId) {
      atualizarGasto(editandoId, dados);
    } else {
      gastos.push(criarNovoGasto(dados));
    }

    salvarDados();
    fecharModal(modalAdicionarGasto);
    atualizarInterface();
  });

  modalAdicionarGasto.addEventListener('click', (event) => {
    if (event.target === modalAdicionarGasto) fecharModal(modalAdicionarGasto);
  });

  modalImportarFatura.addEventListener('click', (event) => {
    if (event.target === modalImportarFatura) fecharModal(modalImportarFatura);
  });

  btnEnviarFatura.addEventListener('click', analisarFatura);
}

function init() {
  carregarDados();
  configurarEventos();
  atualizarInterface();
}

init();

const triagem = JSON.parse(localStorage.getItem('finflow_triagem') || '{}');

const investimentos = JSON.parse(localStorage.getItem('finflow_investimentos') || '[]');
const metas = JSON.parse(localStorage.getItem('finflow_metas') || '[]');

let editingInvestimentoId = null;
let editingMetaId = null;
let carteiraChartInstance = null;
let metaChartInstance = null;
let metaSelecionadaId = null;

const temaSalvo = localStorage.getItem('finflow_tema');
if (temaSalvo === 'dark') {
  document.body.classList.add('theme-dark');
}

const toggleThemeButton = document.getElementById('toggleTheme');
if (toggleThemeButton) {
  toggleThemeButton.addEventListener('click', () => {
    document.body.classList.toggle('theme-dark');
    const tema = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
    localStorage.setItem('finflow_tema', tema);
  });
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarPercentual(valor) {
  return `${Number(valor || 0).toFixed(2).replace('.', ',')}%`;
}

function obterAporteMedio() {
  const aporteTriagem = Number(triagem.aporteMensal || triagem.capacidadeInvestimento || 0);
  const renda = Number(triagem.renda || 0);
  const percentual = Number(triagem.percentualInvestivel || 0);

  if (aporteTriagem > 0) return aporteTriagem;
  if (renda > 0 && percentual > 0) {
    return renda * (percentual / 100);
  }
  return 500;
}

function obterTaxaMensalEsperada() {
  const taxa = Number(triagem.taxaMensalInvestimentos || triagem.rentabilidadeEsperada || 0);
  if (taxa > 0) {
    return taxa / 100;
  }
  return 0.005;
}

function salvarInvestimentos() {
  localStorage.setItem('finflow_investimentos', JSON.stringify(investimentos));
}

function salvarMetas() {
  localStorage.setItem('finflow_metas', JSON.stringify(metas));
}

function atualizarResumoCarteira() {
  const totalInvestido = investimentos.reduce((acc, item) => acc + Number(item.valorInvestido || 0), 0);
  const valorAtual = investimentos.reduce((acc, item) => acc + Number(item.valorAtual || 0), 0);
  const rentabilidade = totalInvestido > 0 ? ((valorAtual - totalInvestido) / totalInvestido) * 100 : 0;

  document.querySelector('[data-field="total-investido"]').textContent = formatarMoeda(totalInvestido);
  document.querySelector('[data-field="valor-atual"]').textContent = formatarMoeda(valorAtual);
  document.querySelector('[data-field="rentabilidade-total"]').textContent = formatarPercentual(rentabilidade);
}

function atualizarGraficoInvestimentos() {
  const ctx = document.getElementById('carteiraChart');
  const valorAtual = investimentos.reduce((acc, item) => acc + Number(item.valorAtual || 0), 0);
  const aporteMensal = obterAporteMedio();
  const taxaMensal = obterTaxaMensalEsperada();

  const pontos = 24;
  const labels = [];
  const dados = [];
  let saldo = valorAtual;

  for (let mes = 1; mes <= pontos; mes += 1) {
    saldo = saldo * (1 + taxaMensal) + aporteMensal;
    labels.push(`M${mes}`);
    dados.push(saldo);
  }

  const dataset = {
    labels,
    datasets: [
      {
        label: 'Projeção da carteira',
        data: dados,
        borderColor: '#ffc72c',
        backgroundColor: 'rgba(255, 199, 44, 0.15)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  if (carteiraChartInstance) {
    carteiraChartInstance.data = dataset;
    carteiraChartInstance.update();
    return;
  }

  carteiraChartInstance = new Chart(ctx, {
    type: 'line',
    data: dataset,
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return formatarMoeda(context.parsed.y);
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#6f7787',
          },
          grid: {
            display: false,
          },
        },
        y: {
          ticks: {
            color: '#6f7787',
            callback(value) {
              return formatarMoeda(value);
            },
          },
          grid: {
            color: 'rgba(15, 23, 42, 0.08)',
          },
        },
      },
    },
  });
}

function renderizarTabelaInvestimentos() {
  const corpo = document.getElementById('investimentosTableBody');
  corpo.innerHTML = '';
  const valorAtualTotal = investimentos.reduce((acc, item) => acc + Number(item.valorAtual || 0), 0);

  const ordenados = [...investimentos].sort((a, b) => Number(b.valorAtual || 0) - Number(a.valorAtual || 0));

  if (!ordenados.length) {
    const linha = document.createElement('tr');
    const coluna = document.createElement('td');
    coluna.colSpan = 8;
    coluna.textContent = 'Nenhum investimento cadastrado ainda.';
    linha.appendChild(coluna);
    corpo.appendChild(linha);
    return;
  }

  ordenados.forEach((item) => {
    const tr = document.createElement('tr');
    tr.dataset.id = item.id;

    const percentualCarteira = valorAtualTotal > 0 ? (Number(item.valorAtual || 0) / valorAtualTotal) * 100 : 0;

    tr.innerHTML = `
      <td>${item.plataforma || '-'}</td>
      <td>${item.ativo || '-'}</td>
      <td>${item.tipo || '-'}</td>
      <td>${item.categoria || '-'}</td>
      <td>${formatarMoeda(item.valorInvestido)}</td>
      <td>${formatarMoeda(item.valorAtual)}</td>
      <td>${formatarPercentual(item.rentabilidadePercentual)}</td>
      <td>${formatarPercentual(percentualCarteira)}</td>
    `;

    tr.addEventListener('click', () => abrirModalInvestimento(item.id));
    corpo.appendChild(tr);
  });
}

function preencherFormInvestimento(investimento) {
  const form = document.getElementById('formInvestimento');
  form.plataforma.value = investimento?.plataforma || '';
  form.tipo.value = investimento?.tipo || 'Renda Fixa';
  form.ativo.value = investimento?.ativo || '';
  form.categoria.value = investimento?.categoria || '';
  form.valorInvestido.value = investimento?.valorInvestido || '';
  form.valorAtual.value = investimento?.valorAtual || '';
  form.rentabilidadePercentual.value = investimento?.rentabilidadePercentual || '';
  form.dataUltimaAtualizacao.value = investimento?.dataUltimaAtualizacao || new Date().toISOString().substring(0, 10);
}

function abrirModalInvestimento(id = null) {
  const modal = document.getElementById('modalInvestimento');
  const titulo = document.getElementById('modalInvestimentoTitulo');
  editingInvestimentoId = id;
  if (id) {
    const investimento = investimentos.find((item) => item.id === id);
    titulo.textContent = 'Editar investimento';
    preencherFormInvestimento(investimento);
  } else {
    titulo.textContent = 'Adicionar investimento';
    preencherFormInvestimento(null);
  }
  modal.setAttribute('aria-hidden', 'false');
}

function fecharModais() {
  document.querySelectorAll('.modal').forEach((modal) => {
    modal.setAttribute('aria-hidden', 'true');
  });
  editingInvestimentoId = null;
  editingMetaId = null;
}

document.querySelectorAll('[data-close-modal]').forEach((botao) => {
  botao.addEventListener('click', fecharModais);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    fecharModais();
  }
});

function configurarModalInvestimento() {
  document.getElementById('btnAddInvestimento').addEventListener('click', () => abrirModalInvestimento());
  document.getElementById('modalInvestimento').addEventListener('click', (event) => {
    if (event.target.id === 'modalInvestimento') {
      fecharModais();
    }
  });

  document.getElementById('formInvestimento').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.target;
    const dados = {
      id: editingInvestimentoId || Date.now().toString(),
      plataforma: form.plataforma.value.trim(),
      tipo: form.tipo.value,
      ativo: form.ativo.value.trim(),
      categoria: form.categoria.value.trim(),
      valorInvestido: Number(form.valorInvestido.value || 0),
      valorAtual: Number(form.valorAtual.value || 0),
      rentabilidadePercentual: Number(form.rentabilidadePercentual.value || 0),
      dataUltimaAtualizacao: form.dataUltimaAtualizacao.value,
    };

    if (editingInvestimentoId) {
      const indice = investimentos.findIndex((item) => item.id === editingInvestimentoId);
      investimentos[indice] = dados;
    } else {
      investimentos.push(dados);
    }

    salvarInvestimentos();
    atualizarResumoCarteira();
    atualizarGraficoInvestimentos();
    renderizarTabelaInvestimentos();
    fecharModais();
  });
}

function calcularMesesNecessarios({ valorAtual, valorAlvo, aporteMensal, taxaMensalEsperada }) {
  let saldo = Number(valorAtual || 0);
  const alvo = Number(valorAlvo || 0);
  const aporte = Number(aporteMensal || 0);
  const taxa = Number(taxaMensalEsperada || 0);
  let meses = 0;

  while (saldo < alvo && meses < 600) {
    saldo = saldo * (1 + taxa) + aporte;
    meses += 1;
  }

  return { meses, saldoFinal: saldo };
}

function formatarPrazo(meses) {
  if (!meses || meses === Infinity) return '—';
  const anos = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;
  const partes = [];
  if (anos > 0) partes.push(`${anos} ${anos === 1 ? 'ano' : 'anos'}`);
  if (mesesRestantes > 0) partes.push(`${mesesRestantes} ${mesesRestantes === 1 ? 'mês' : 'meses'}`);
  return partes.length ? partes.join(' e ') : '0 mês';
}

function desenharGraficoMeta(meta) {
  if (!meta) return;
  const card = document.getElementById('metaGraficoCard');
  const descricao = document.getElementById('metaGraficoDescricao');
  const canvas = document.getElementById('metaChart');

  card.hidden = false;

  const taxa = Number(meta.taxaMensalEsperada || 0);
  const aporte = Number(meta.aporteMensal || 0);
  const alvo = Number(meta.valorAlvo || 0);
  let saldo = Number(meta.valorAtual || 0);

  const labels = ['Hoje'];
  const dados = [saldo];

  for (let mes = 1; mes <= meta.mesesNecessariosCalculados; mes += 1) {
    saldo = saldo * (1 + taxa) + aporte;
    labels.push(`M${mes}`);
    dados.push(saldo);
    if (saldo >= alvo) break;
  }

  descricao.textContent = `Projeção considerando aportes de ${formatarMoeda(aporte)} com taxa de ${(taxa * 100).toFixed(2)}% a.m.`;

  const dataset = {
    labels,
    datasets: [
      {
        label: meta.nome,
        data: dados,
        borderColor: '#ffc72c',
        backgroundColor: 'rgba(255, 199, 44, 0.15)',
        fill: true,
        tension: 0.35,
      },
    ],
  };

  if (metaChartInstance) {
    metaChartInstance.data = dataset;
    metaChartInstance.update();
    return;
  }

  metaChartInstance = new Chart(canvas, {
    type: 'line',
    data: dataset,
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return formatarMoeda(context.parsed.y);
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#6f7787' },
          grid: { display: false },
        },
        y: {
          ticks: {
            color: '#6f7787',
            callback(value) {
              return formatarMoeda(value);
            },
          },
          grid: { color: 'rgba(15, 23, 42, 0.08)' },
        },
      },
    },
  });
}

function renderMetas() {
  const lista = document.getElementById('listaMetas');
  lista.innerHTML = '';

  if (!metas.length) {
    const card = document.createElement('div');
    card.className = 'card meta-card';
    card.innerHTML = '<strong>Nenhuma meta cadastrada.</strong><span class="meta-categoria">Adicione sua primeira meta para visualizar projeções.</span>';
    lista.appendChild(card);
    document.getElementById('metaGraficoCard').hidden = true;
    return;
  }

  metas.forEach((meta) => {
    const { meses } = calcularMesesNecessarios(meta);
    meta.mesesNecessariosCalculados = meses;

    const card = document.createElement('div');
    card.className = `card meta-card${metaSelecionadaId === meta.id ? ' selecionada' : ''}`;
    card.dataset.id = meta.id;

    const progresso = Number(meta.valorAlvo) > 0 ? Math.min((Number(meta.valorAtual) / Number(meta.valorAlvo)) * 100, 100) : 0;
    const mesesFormatado = formatarPrazo(meta.mesesNecessariosCalculados);

    const dataAlvo = new Date();
    dataAlvo.setMonth(dataAlvo.getMonth() + meta.mesesNecessariosCalculados);
    const dataAlvoTexto = dataAlvo.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    card.innerHTML = `
      <div>
        <div class="meta-categoria">${meta.categoria}</div>
        <strong>${meta.nome}</strong>
      </div>
      <div>
        <span class="meta-categoria">Valor alvo</span>
        <strong>${formatarMoeda(meta.valorAlvo)}</strong>
      </div>
      <div>
        <span class="meta-categoria">Valor atual</span>
        <strong>${formatarMoeda(meta.valorAtual)}</strong>
      </div>
      <div>
        <span class="meta-categoria">Aporte mensal</span>
        <strong>${formatarMoeda(meta.aporteMensal)}</strong>
      </div>
      <div>
        <span class="meta-categoria">Previsão</span>
        <strong>${mesesFormatado} (≈ ${dataAlvoTexto})</strong>
      </div>
      <div class="meta-progress"><span style="width: ${progresso}%"></span></div>
    `;

    card.addEventListener('click', () => {
      metaSelecionadaId = meta.id;
      abrirModalMeta(meta.id);
      desenharGraficoMeta(meta);
      renderMetas();
    });

    lista.appendChild(card);
  });

  if (metaSelecionadaId) {
    const meta = metas.find((item) => item.id === metaSelecionadaId);
    if (meta) {
      desenharGraficoMeta(meta);
    }
  } else {
    document.getElementById('metaGraficoCard').hidden = true;
  }
}

function preencherFormMeta(meta) {
  const form = document.getElementById('formMeta');
  form.categoria.value = meta?.categoria || 'Carro';
  form.nome.value = meta?.nome || '';
  form.valorAlvo.value = meta?.valorAlvo || '';
  form.valorAtual.value = meta?.valorAtual ?? 0;
  form.aporteMensal.value = meta?.aporteMensal || obterAporteMedio();
  form.prazoMesesDesejado.value = meta?.prazoMesesDesejado || '';
  const taxa = meta?.taxaMensalEsperada != null ? meta.taxaMensalEsperada * 100 : obterTaxaMensalEsperada() * 100;
  form.taxaMensalEsperada.value = taxa;
  form.dataCriacao.value = meta?.dataCriacao || new Date().toISOString().substring(0, 10);
}

function abrirModalMeta(id = null) {
  const modal = document.getElementById('modalMeta');
  const titulo = document.getElementById('modalMetaTitulo');
  editingMetaId = id;

  if (id) {
    const meta = metas.find((item) => item.id === id);
    titulo.textContent = 'Editar meta';
    preencherFormMeta(meta);
  } else {
    titulo.textContent = 'Nova meta';
    preencherFormMeta(null);
  }

  modal.setAttribute('aria-hidden', 'false');
}

function configurarModalMeta() {
  const categoria = document.getElementById('metaCategoria');
  const nome = document.getElementById('metaNome');

  categoria.addEventListener('change', () => {
    if (!editingMetaId) {
      switch (categoria.value) {
        case 'Carro':
          nome.value = 'Comprar um carro';
          break;
        case 'Casa':
          nome.value = 'Entrada da casa';
          break;
        case 'Eletrônico':
          nome.value = 'Novo eletrônico';
          break;
        case 'Viagem':
          nome.value = 'Viagem dos sonhos';
          break;
        case 'Reserva de Emergência':
          nome.value = 'Reserva de emergência';
          break;
        default:
          nome.value = '';
      }
    }
  });

  document.getElementById('btnAddMeta').addEventListener('click', () => {
    metaSelecionadaId = null;
    abrirModalMeta();
  });

  document.getElementById('modalMeta').addEventListener('click', (event) => {
    if (event.target.id === 'modalMeta') {
      fecharModais();
    }
  });

  document.getElementById('formMeta').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.target;
    const dados = {
      id: editingMetaId || Date.now().toString(),
      categoria: form.categoria.value,
      nome: form.nome.value.trim() || form.categoria.value,
      valorAlvo: Number(form.valorAlvo.value || 0),
      valorAtual: Number(form.valorAtual.value || 0),
      aporteMensal: Number(form.aporteMensal.value || 0),
      prazoMesesDesejado: form.prazoMesesDesejado.value ? Number(form.prazoMesesDesejado.value) : null,
      taxaMensalEsperada: Number(form.taxaMensalEsperada.value || 0) / 100,
      dataCriacao: form.dataCriacao.value || new Date().toISOString().substring(0, 10),
      mesesNecessariosCalculados: 0,
    };

    const { meses } = calcularMesesNecessarios(dados);
    dados.mesesNecessariosCalculados = meses;

    if (editingMetaId) {
      const indice = metas.findIndex((item) => item.id === editingMetaId);
      metas[indice] = dados;
      metaSelecionadaId = dados.id;
    } else {
      metas.push(dados);
      metaSelecionadaId = dados.id;
    }

    salvarMetas();
    renderMetas();
    desenharGraficoMeta(dados);
    fecharModais();
  });
}

function configurarTabsInvestimentos() {
  const botoes = document.querySelectorAll('.tab-invest');
  const views = document.querySelectorAll('.investimentos-view');

  botoes.forEach((botao) => {
    botao.addEventListener('click', () => {
      const tab = botao.dataset.tab;
      botoes.forEach((b) => b.classList.toggle('active', b === botao));
      views.forEach((view) => view.classList.toggle('active', view.id === `investimentos-${tab}`));
    });
  });
}

function inicializarInvestimentos() {
  atualizarResumoCarteira();
  atualizarGraficoInvestimentos();
  renderizarTabelaInvestimentos();
}

function inicializarMetas() {
  renderMetas();
}

function inicializar() {
  configurarTabsInvestimentos();
  configurarModalInvestimento();
  configurarModalMeta();
  inicializarInvestimentos();
  inicializarMetas();
}

document.addEventListener('DOMContentLoaded', inicializar);

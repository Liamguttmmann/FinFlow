const STORAGE_KEY = 'finflow_gastos';
let gastos = [];
let gastoEditandoId = null;
let graficoGastos = null;

const btnAddGasto = document.getElementById('btnAddGasto');
const modal = document.getElementById('gasto-modal');
const modalTitle = modal.querySelector('.modal__header h2');
const modalOverlay = modal.querySelector('.modal__overlay');
const form = document.getElementById('gasto-form');
const tipoSelect = document.getElementById('gasto-tipo');
const categoriaSelect = document.getElementById('gasto-categoria');
const subcategoriaGroup = document.getElementById('subcategoria-group');
const subcategoriaSelect = document.getElementById('gasto-subcategoria');
const etiquetaInput = document.getElementById('gasto-etiqueta');
const descricaoInput = document.getElementById('gasto-descricao');
const valorInput = document.getElementById('gasto-valor');
const dataInput = document.getElementById('gasto-data');
const listaContainer = document.getElementById('gastos-lista-container');
const tabButtons = Array.from(document.querySelectorAll('.tab-button'));

const coresGrafico = ['#111827', '#2563eb', '#f59e0b'];
const tiposGrafico = ['Fixo', 'Variável', 'Assinatura'];

const subcategoriasPorCategoria = {
  'Telefone/Internet': ['Vivo', 'Claro', 'TIM', 'Oi', 'Outra'],
  Transporte: ['Uber', '99', 'Gasolina', 'Outros']
};

function carregarGastos() {
  const armazenados = localStorage.getItem(STORAGE_KEY);
  if (!armazenados) return;
  try {
    const dados = JSON.parse(armazenados);
    if (Array.isArray(dados)) {
      gastos = dados;
    }
  } catch (error) {
    console.error('Não foi possível ler os gastos do localStorage', error);
  }
}

function salvarGastos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gastos));
}

function gerarId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `gasto-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0);
}

function formatarData(isoDate) {
  if (!isoDate) return '';
  const [ano, mes, dia] = isoDate.split('-');
  return `${dia}/${mes}/${ano}`;
}

function obterHojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function atualizarSubcategorias(categoria, selecionada = '') {
  const opcoes = subcategoriasPorCategoria[categoria];
  if (!opcoes) {
    subcategoriaGroup.classList.remove('active');
    subcategoriaSelect.innerHTML = '<option value="">Não se aplica</option>';
    subcategoriaSelect.value = '';
    return;
  }

  subcategoriaGroup.classList.add('active');
  subcategoriaSelect.innerHTML = opcoes
    .map((opcao) => `<option value="${opcao}">${opcao}</option>`)
    .join('');
  if (selecionada && opcoes.includes(selecionada)) {
    subcategoriaSelect.value = selecionada;
  } else {
    subcategoriaSelect.value = opcoes[0];
  }
}

function abrirModal(gasto = null) {
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  if (gasto) {
    modalTitle.textContent = 'Editar gasto';
    gastoEditandoId = gasto.id;
    tipoSelect.value = gasto.tipo;
    categoriaSelect.value = gasto.categoria;
    atualizarSubcategorias(gasto.categoria, gasto.subcategoria || '');
    etiquetaInput.value = gasto.etiqueta || '';
    descricaoInput.value = gasto.descricao || '';
    valorInput.value = Number(gasto.valor).toFixed(2);
    dataInput.value = gasto.data;
  } else {
    modalTitle.textContent = 'Registrar novo gasto';
    gastoEditandoId = null;
    form.reset();
    atualizarSubcategorias('');
    dataInput.value = obterHojeISO();
  }

  setTimeout(() => {
    tipoSelect.focus();
  }, 150);
}

function fecharModal() {
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  form.reset();
  atualizarSubcategorias('');
  gastoEditandoId = null;
}

function calcularTotais(gastosLista) {
  const totais = {
    Fixo: 0,
    Variável: 0,
    Assinatura: 0
  };

  gastosLista.forEach((gasto) => {
    if (typeof gasto.valor !== 'number') return;
    if (gasto.tipo in totais) {
      totais[gasto.tipo] += gasto.valor;
    }
  });

  return totais;
}

function atualizarLegenda(totais) {
  const legendEl = document.getElementById('gastos-chart-legend');
  legendEl.innerHTML = '';

  tiposGrafico.forEach((tipo, index) => {
    const item = document.createElement('div');
    item.className = 'legend-item';

    const label = document.createElement('div');
    label.className = 'legend-item__label';

    const dot = document.createElement('span');
    dot.className = 'legend-item__dot';
    dot.style.background = coresGrafico[index];

    const texto = document.createElement('span');
    texto.textContent = tipo;

    label.append(dot, texto);

    const valor = document.createElement('span');
    valor.textContent = formatarMoeda(totais[tipo]);

    item.append(label, valor);
    legendEl.appendChild(item);
  });
}

function atualizarGraficoGastos(gastosFiltrados) {
  const totais = calcularTotais(gastosFiltrados);
  const dataGrafico = tiposGrafico.map((tipo) => Number(totais[tipo].toFixed(2)));
  const ctx = document.getElementById('gastos-chart').getContext('2d');

  if (!graficoGastos) {
    graficoGastos = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: tiposGrafico,
        datasets: [
          {
            data: dataGrafico,
            backgroundColor: coresGrafico,
            borderWidth: 0,
            hoverOffset: 12
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label(context) {
                const tipo = context.label;
                const valor = Number(context.parsed || 0);
                const dataset = context.chart.data.datasets[context.datasetIndex];
                const total = dataset.data.reduce((acc, val) => acc + Number(val || 0), 0);
                const porcentagem = total ? ((valor / total) * 100).toFixed(1) : '0.0';
                return `${tipo}: ${formatarMoeda(valor)} (${porcentagem}%)`;
              }
            }
          }
        },
        cutout: '65%',
        borderRadius: 12
      }
    });
  } else {
    graficoGastos.data.datasets[0].data = dataGrafico;
    graficoGastos.update();
  }

  atualizarLegenda(totais);
}

function ordenarPorDataDesc(lista) {
  return [...lista].sort((a, b) => {
    const dataA = new Date(`${a.data}T00:00:00`);
    const dataB = new Date(`${b.data}T00:00:00`);
    return dataB - dataA;
  });
}

function renderizarGastos(gastosFiltrados) {
  listaContainer.innerHTML = '';

  if (!gastosFiltrados.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <h3>Nenhum gasto cadastrado</h3>
      <p>Cadastre seu primeiro gasto.</p>
    `;
    listaContainer.appendChild(empty);
    return;
  }

  const gastosOrdenados = ordenarPorDataDesc(gastosFiltrados);

  gastosOrdenados.forEach((gasto) => {
    const card = document.createElement('article');
    card.className = 'gasto-card';
    card.dataset.id = gasto.id;

    const info = document.createElement('div');
    info.className = 'gasto-card__info';

    const titulo = document.createElement('h3');
    titulo.className = 'gasto-card__descricao';
    titulo.textContent = gasto.descricao;

    const meta = document.createElement('div');
    meta.className = 'gasto-card__meta';
    const partes = [gasto.tipo, `${gasto.categoria}${gasto.subcategoria ? ` · ${gasto.subcategoria}` : ''}`];

    const detalhes = document.createElement('span');
    detalhes.textContent = partes.join(' · ');

    const dataSpan = document.createElement('span');
    dataSpan.textContent = formatarData(gasto.data);

    meta.appendChild(detalhes);

    if (gasto.etiqueta) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = gasto.etiqueta;
      meta.appendChild(badge);
    }

    meta.appendChild(dataSpan);

    info.append(titulo, meta);

    const valor = document.createElement('div');
    valor.className = 'gasto-card__valor';
    valor.textContent = formatarMoeda(gasto.valor);

    card.append(info, valor);
    listaContainer.appendChild(card);
  });
}

function filtrarGastos(escopo) {
  if (escopo === 'weekly') {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    inicio.setDate(hoje.getDate() - 6);

    return gastos.filter((gasto) => {
      const dataGasto = new Date(`${gasto.data}T00:00:00`);
      return dataGasto >= inicio && dataGasto <= hoje;
    });
  }

  if (escopo === 'monthly') {
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    fim.setHours(23, 59, 59, 999);

    return gastos.filter((gasto) => {
      const dataGasto = new Date(`${gasto.data}T00:00:00`);
      return dataGasto >= inicio && dataGasto <= fim;
    });
  }

  return gastos;
}

function atualizarInterface(escopo = 'overview') {
  const filtrados = filtrarGastos(escopo);
  atualizarGraficoGastos(filtrados);
  renderizarGastos(filtrados);
}

function definirAbaAtiva(aba) {
  tabButtons.forEach((botao) => {
    const ativa = botao.dataset.tab === aba;
    botao.classList.toggle('active', ativa);
    botao.setAttribute('aria-selected', String(ativa));
  });
}

function handleSubmit(event) {
  event.preventDefault();

  if (!form.reportValidity()) return;

  const tipo = tipoSelect.value;
  const categoria = categoriaSelect.value;
  const subcategoria = subcategoriaGroup.classList.contains('active')
    ? subcategoriaSelect.value
    : '';
  const etiqueta = etiquetaInput.value.trim();
  const descricao = descricaoInput.value.trim();
  const valor = Number(valorInput.value);
  const data = dataInput.value;

  if (!tipo || !categoria || !descricao || !data || Number.isNaN(valor)) {
    return;
  }

  const novoGasto = {
    id: gastoEditandoId ?? gerarId(),
    tipo,
    categoria,
    subcategoria,
    etiqueta,
    descricao,
    valor,
    data
  };

  if (gastoEditandoId) {
    gastos = gastos.map((gasto) => (gasto.id === gastoEditandoId ? novoGasto : gasto));
  } else {
    gastos.push(novoGasto);
  }

  salvarGastos();
  const abaAtiva = tabButtons.find((botao) => botao.classList.contains('active'))?.dataset.tab ?? 'overview';
  atualizarInterface(abaAtiva);
  fecharModal();
}

function inicializarEventos() {
  btnAddGasto?.addEventListener('click', () => abrirModal());

  modal.querySelectorAll('[data-close]').forEach((elemento) => {
    elemento.addEventListener('click', fecharModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('active')) {
      fecharModal();
    }
  });

  modalOverlay.addEventListener('click', fecharModal);

  categoriaSelect.addEventListener('change', (event) => {
    atualizarSubcategorias(event.target.value);
  });

  listaContainer.addEventListener('click', (event) => {
    const card = event.target.closest('.gasto-card');
    if (!card) return;
    const gastoId = card.dataset.id;
    const gasto = gastos.find((item) => item.id === gastoId);
    if (gasto) {
      abrirModal(gasto);
    }
  });

  tabButtons.forEach((botao) => {
    botao.addEventListener('click', () => {
      const aba = botao.dataset.tab;
      definirAbaAtiva(aba);
      atualizarInterface(aba);
    });
  });

  form.addEventListener('submit', handleSubmit);
}

(function iniciar() {
  atualizarSubcategorias('');
  carregarGastos();
  inicializarEventos();
  atualizarInterface('overview');
})();

window.atualizarGraficoGastos = atualizarGraficoGastos;
window.renderizarGastos = renderizarGastos;

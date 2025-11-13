const modalOverlay = document.getElementById('gasto-modal-overlay');
const btnAddGasto = document.getElementById('btnAddGasto');
const closeGastoModal = document.getElementById('close-gasto-modal');
const cancelarGasto = document.getElementById('cancelar-gasto');
const gastoForm = document.getElementById('gasto-form');
const gastoTipo = document.getElementById('gasto-tipo');
const gastoCategoria = document.getElementById('gasto-categoria');
const gastoSubcategoria = document.getElementById('gasto-subcategoria');
const subcategoriaWrapper = document.getElementById('subcategoria-wrapper');
const gastoDescricao = document.getElementById('gasto-descricao');
const gastoValor = document.getElementById('gasto-valor');
const gastoData = document.getElementById('gasto-data');
const gastosListaContainer = document.getElementById('gastos-lista-container');
const tabs = document.querySelectorAll('.gastos-tab');
const legendFixo = document.getElementById('legend-fixo');
const legendVariavel = document.getElementById('legend-variavel');
const legendAssinatura = document.getElementById('legend-assinatura');
let gastos = [];
let filtroAtual = 'visao';
let gastosChart;
const subcategorias = {
  'Telefone/Internet': ['Vivo', 'Claro', 'TIM', 'Oi', 'Outra'],
  Transporte: ['Uber', '99', 'Gasolina', 'Outros']
};
function gerarId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `gasto-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}
function abrirModal() {
  gastoForm.reset();
  gastoData.value = new Date().toISOString().split('T')[0];
  atualizarSubcategoria();
  modalOverlay.classList.remove('hidden');
  setTimeout(() => gastoTipo.focus(), 0);
}
function fecharModal() {
  modalOverlay.classList.add('hidden');
}
function atualizarSubcategoria() {
  const categoriaSelecionada = gastoCategoria.value;
  const opcoes = subcategorias[categoriaSelecionada];
  if (opcoes) {
    subcategoriaWrapper.style.display = 'flex';
    gastoSubcategoria.required = true;
    gastoSubcategoria.innerHTML = ['<option value="">Selecione</option>', ...opcoes.map(opcao => `<option value="${opcao}">${opcao}</option>`)].join('');
  } else {
    subcategoriaWrapper.style.display = 'none';
    gastoSubcategoria.required = false;
    gastoSubcategoria.innerHTML = '<option value="">Não se aplica</option>';
  }
  gastoSubcategoria.value = '';
}
function carregarGastos() {
  const armazenados = localStorage.getItem('finflow_gastos');
  if (!armazenados) {
    gastos = [];
    return;
  }
  try {
    const dados = JSON.parse(armazenados);
    gastos = Array.isArray(dados) ? dados : [];
  } catch (error) {
    gastos = [];
  }
}
function salvarGastos() {
  localStorage.setItem('finflow_gastos', JSON.stringify(gastos));
}
function formatarMoeda(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function renderizarGastos(lista) {
  const ordenados = [...lista].sort((a, b) => new Date(b.data) - new Date(a.data));
  gastosListaContainer.innerHTML = '';
  if (!ordenados.length) {
    gastosListaContainer.innerHTML = '<div class="gasto-card vazio"><div class="gasto-info"><strong>Nenhum gasto cadastrado</strong><span class="gasto-meta"><span>Cadastre seu primeiro gasto</span></span></div></div>';
    return;
  }
  ordenados.forEach(gasto => {
    const meta = [gasto.tipo, gasto.categoria + (gasto.subcategoria ? ` · ${gasto.subcategoria}` : ''), new Date(gasto.data + 'T00:00').toLocaleDateString('pt-BR')];
    const card = document.createElement('article');
    card.className = 'gasto-card';
    card.innerHTML = `
      <div class="gasto-info">
        <strong>${gasto.descricao || gasto.categoria}</strong>
        <div class="gasto-meta">
          ${meta.map(item => `<span>${item}</span>`).join('')}
        </div>
      </div>
      <div class="gasto-valor">${formatarMoeda(gasto.valor)}</div>
    `;
    gastosListaContainer.appendChild(card);
  });
}
function totaisPorTipo(lista) {
  return lista.reduce(
    (acc, gasto) => {
      if (gasto.tipo === 'Fixo') acc.fixo += Number(gasto.valor);
      if (gasto.tipo === 'Variável') acc.variavel += Number(gasto.valor);
      if (gasto.tipo === 'Assinatura') acc.assinatura += Number(gasto.valor);
      return acc;
    },
    { fixo: 0, variavel: 0, assinatura: 0 }
  );
}
function atualizarLegenda(totais) {
  legendFixo.textContent = formatarMoeda(totais.fixo);
  legendVariavel.textContent = formatarMoeda(totais.variavel);
  legendAssinatura.textContent = formatarMoeda(totais.assinatura);
}
function atualizarGraficoGastos(lista) {
  const totais = totaisPorTipo(lista);
  const dados = [totais.fixo, totais.variavel, totais.assinatura];
  if (!gastosChart) {
    gastosChart = new Chart(document.getElementById('gastosPieChart'), {
      type: 'doughnut',
      data: {
        labels: ['Fixos', 'Variáveis', 'Assinaturas'],
        datasets: [
          {
            data: dados,
            backgroundColor: ['#111827', '#38bdf8', '#f97316'],
            borderWidth: 0,
            hoverOffset: 16
          }
        ]
      },
      options: {
        cutout: '55%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: context => {
                const valor = Number(context.raw || 0);
                const dataset = context.chart.data.datasets[0].data;
                const total = dataset.reduce((soma, atual) => soma + atual, 0) || 1;
                const percentual = ((valor / total) * 100).toFixed(1);
                return `${context.label}: ${formatarMoeda(valor)} (${percentual}%)`;
              }
            }
          }
        }
      }
    });
  } else {
    gastosChart.data.datasets[0].data = dados;
    gastosChart.update();
  }
  atualizarLegenda(totais);
}
function filtrarGastos() {
  const hoje = new Date();
  if (filtroAtual === 'semanal') {
    const inicioSemana = new Date(hoje);
    const dia = inicioSemana.getDay();
    const diff = (dia === 0 ? -6 : 1) - dia;
    inicioSemana.setDate(hoje.getDate() + diff);
    inicioSemana.setHours(0, 0, 0, 0);
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999);
    return gastos.filter(gasto => {
      const dataGasto = new Date(gasto.data + 'T00:00');
      return dataGasto >= inicioSemana && dataGasto <= fimSemana;
    });
  }
  if (filtroAtual === 'mensal') {
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);
    return gastos.filter(gasto => {
      const dataGasto = new Date(gasto.data + 'T00:00');
      return dataGasto >= inicioMes && dataGasto <= fimMes;
    });
  }
  return gastos;
}
function aplicarFiltro(tipo) {
  filtroAtual = tipo;
  tabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.filter === tipo);
  });
  const filtrados = filtrarGastos();
  atualizarGraficoGastos(filtrados);
  renderizarGastos(filtrados);
}
function inicializar() {
  carregarGastos();
  aplicarFiltro('visao');
}
btnAddGasto.addEventListener('click', abrirModal);
closeGastoModal.addEventListener('click', fecharModal);
cancelarGasto.addEventListener('click', fecharModal);
modalOverlay.addEventListener('click', event => {
  if (event.target === modalOverlay) fecharModal();
});
gastoCategoria.addEventListener('change', atualizarSubcategoria);
tabs.forEach(tab => {
  tab.addEventListener('click', () => aplicarFiltro(tab.dataset.filter));
});
gastoForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!gastoForm.reportValidity()) return;
  const novoGasto = {
    id: gerarId(),
    descricao: gastoDescricao.value.trim(),
    tipo: gastoTipo.value,
    categoria: gastoCategoria.value,
    subcategoria: gastoSubcategoria.value,
    valor: Number(gastoValor.value),
    data: gastoData.value
  };
  gastos.push(novoGasto);
  salvarGastos();
  aplicarFiltro(filtroAtual);
  fecharModal();
});
document.addEventListener('DOMContentLoaded', () => {
  atualizarSubcategoria();
  inicializar();
});

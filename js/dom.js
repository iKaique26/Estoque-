import { filtrarEstoque, registrarSaida } from './estoque.js'; // Importações do estoque.js
import { alternarTema } from './tema.js'; // Importação do tema.js
import { exibirHistorico } from './historico.js'; // Importação do historico.js
import { exportarCSV, exportarPDF } from './exportacao.js'; // Importação do exportacao.js

// Cache de elementos do DOM
export const elementos = {
    pesquisa: document.getElementById('pesquisa'),
    tabelaEstoque: document.getElementById('tabela-estoque'),
    historicoBtn: document.getElementById('btnHistorico'),
    exportarBtn: document.getElementById('btnExportar'),
    exportarPDFBtn: document.getElementById('btnExportarPDF'),
    temaBtn: document.getElementById('btnTema'),
    forms: {
        adicionar: document.getElementById('formAdicionar'),
        editar: document.getElementById('formEditar'),
        entrada: document.getElementById('formEntrada'),
        saida: document.getElementById('formSaida')
    },
    selects: {
        entrada: document.getElementById('materialEntrada'),
        saida: document.getElementById('materialSaida')
    },
    modais: document.querySelectorAll('.modal'),
    modalContainer: document.getElementById('modalContainer'),
    mensagem: document.getElementById('mensagem'),
    historicoContainer: document.getElementById('historicoContainer'),
    historicoLista: document.getElementById('historico-lista')
};

// Função para alternar a sidebar
export function alternarSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Função para configurar eventos
export function configurarEventos() {
    // Evento para alternar a sidebar
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', alternarSidebar);
    }

    // Evento para fechar a sidebar ao clicar no overlay
    const overlay = document.querySelector('.overlay');
    if (overlay) {
        overlay.addEventListener('click', alternarSidebar);
    }

    // Eventos da sidebar
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.addEventListener('click', abrirModal);
    });

    // Eventos de fechar modais
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', fecharModal);
    });

    // Evento de clique fora do modal
    elementos.modalContainer.addEventListener('click', (e) => {
        if (e.target === elementos.modalContainer) fecharModal();
    });

    // Evento de pesquisa com debounce
    elementos.pesquisa.addEventListener('input', debounce(() => {
        const termo = elementos.pesquisa.value.trim();
        filtrarEstoque(termo);
    }, 300));

    // Evento para abrir o histórico
    elementos.historicoBtn.addEventListener('click', exibirHistorico);

    // Evento para exportar CSV
    elementos.exportarBtn.addEventListener('click', exportarCSV);

    // Evento para exportar PDF
    elementos.exportarPDFBtn.addEventListener('click', exportarPDF);

    // Evento para alternar tema
    elementos.temaBtn.addEventListener('click', alternarTema);

    // Evento para exibir/ocultar notificações
    const btnNotificacoes = document.getElementById('btnNotificacoes');
    const notificacoesContainer = document.getElementById('notificacoesContainer');

    if (btnNotificacoes && notificacoesContainer) {
        btnNotificacoes.addEventListener('click', () => {
            notificacoesContainer.classList.toggle('active');
        });
    }
}

// Função para abrir modais
export function abrirModal(e) {
    // Encontra o botão mais próximo que possui o atributo data-modal
    const botao = e.target.closest('[data-modal]');

    // Verifica se o botão foi encontrado e se possui o atributo data-modal
    if (!botao || !botao.dataset.modal) {
        console.error('O botão clicado não possui um atributo data-modal válido.');
        return;
    }

    const modalId = botao.dataset.modal;

    // Verifica se o modalId existe no DOM
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        elementos.modalContainer.classList.add('active');
    } else {
        console.error(`Modal com ID "${modalId}" não encontrado.`);
    }
}

// Função para fechar modais
export function fecharModal() {
    elementos.modais.forEach(modal => modal.classList.remove('active'));
    elementos.modalContainer.classList.remove('active');
    elementos.forms.adicionar.reset();
    elementos.forms.editar.reset();
    elementos.forms.entrada.reset();
    elementos.forms.saida.reset();
}

// Função para exibir mensagens
export function exibirMensagem(texto, isErro = false) {
    elementos.mensagem.textContent = texto;
    elementos.mensagem.classList.toggle('erro', isErro);
    elementos.mensagem.style.display = 'block';

    setTimeout(() => {
        elementos.mensagem.style.display = 'none';
    }, 3000);
}

elementos.forms.saida.addEventListener('submit', async (e) => {
    e.preventDefault();
    const materialId = elementos.forms.saida.materialSaida.value;
    const quantidade = elementos.forms.saida.quantidadeSaida.value.trim();

    if (!materialId || isNaN(quantidade) || quantidade <= 0) {
        exibirMensagem('Selecione um material e insira uma quantidade válida.', true);
        return;
    }

    await registrarSaida(materialId, quantidade);
});

// Função debounce para melhorar a performance da pesquisa
export function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
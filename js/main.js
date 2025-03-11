import { configurarEventos } from './dom.js';
import { carregarEstoque } from './estoque.js';
import { carregarTemaSalvo } from './tema.js';

// Função principal de inicialização
function init() {
    configurarEventos();
    carregarEstoque();
    carregarTemaSalvo();
}

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', init);
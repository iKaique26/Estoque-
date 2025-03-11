import { elementos, exibirMensagem, fecharModal } from './dom.js'; // Importações do dom.js
import { enviarDados } from './api.js';
import { registrarHistorico } from './historico.js';

export let estoque = [];

// Função para preencher os selects de material
export function preencherSelectsMaterial() {
    // Limpa os selects antes de preenchê-los
    elementos.selects.entrada.innerHTML = '<option value="">Selecione um material</option>';
    elementos.selects.saida.innerHTML = '<option value="">Selecione um material</option>';

    // Preenche os selects com os materiais do estoque
    estoque.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id; // Usa o ID do material como valor
        option.textContent = item.material; // Usa o nome do material como texto

        // Adiciona a opção aos selects de entrada e saída
        elementos.selects.entrada.appendChild(option.cloneNode(true));
        elementos.selects.saida.appendChild(option);
    });
}

// Função para carregar o estoque
export async function carregarEstoque() {
    try {
        const dados = await enviarDados('http://localhost:5000/estoque', 'GET');
        estoque = dados;
        atualizarTabela(estoque);
        preencherSelectsMaterial(); // Preenche os selects de material
        verificarEstoqueCritico();
    } catch (err) {
        console.error('Erro ao carregar estoque:', err);
        exibirMensagem('Erro ao carregar estoque. Verifique o console para detalhes.', true);
    }
}

// Função para atualizar a tabela de estoque
export function atualizarTabela(itens = estoque) {
    elementos.tabelaEstoque.innerHTML = itens.map(item => `
        <tr>
            <td>${item.material}</td>
            <td class="${getNivelEstoque(item.quantidade)}">${item.quantidade}</td>
            <td>${item.ultimaEntrada || '-'}</td>
            <td>${item.qtdEntrada || '-'}</td>
            <td>${item.ultimaSaida || '-'}</td>
            <td>${item.qtdSaida || '-'}</td>
            <td>
                <button class="btn-editar" data-id="${item.id}" aria-label="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-remover" data-id="${item.id}" aria-label="Remover">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');

    // Adicionar eventos aos botões de editar e remover
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', () => abrirEdicao(btn.dataset.id));
    });

    document.querySelectorAll('.btn-remover').forEach(btn => {
        btn.addEventListener('click', () => removerItem(btn.dataset.id));
    });
}

// Função para filtrar o estoque
export function filtrarEstoque(termo) {
    const filtrado = estoque.filter(item => 
        item.material.toLowerCase().includes(termo.toLowerCase())
    );
    atualizarTabela(filtrado);
}

// Função para determinar o nível de estoque
function getNivelEstoque(quantidade) {
    if (quantidade >= 50) return 'nivel-bom'; // Verde
    if (quantidade >= 20) return 'nivel-medio'; // Amarelo
    return 'nivel-critico'; // Vermelho
}

// Função para verificar estoque crítico e atualizar notificações
export function verificarEstoqueCritico() {
    const itensCriticos = estoque.filter(item => item.quantidade < 20);
    const notificacaoContador = document.getElementById('notificacaoContador');
    const notificacoesLista = document.getElementById('notificacoesLista');

    if (notificacaoContador && notificacoesLista) {
        notificacaoContador.textContent = itensCriticos.length;
        notificacoesLista.innerHTML = '';
        itensCriticos.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `Estoque crítico: ${item.material} (${item.quantidade} restantes)`;
            notificacoesLista.appendChild(li);
        });
    }
}

// Função para abrir o modal de edição
function abrirEdicao(id) {
    const item = estoque.find(item => item.id === id);
    if (!item) {
        exibirMensagem("Erro: Item não encontrado.", true);
        return;
    }

    // Preencher os campos do modal
    elementos.forms.editar.material.value = item.material;
    elementos.forms.editar.quantidade.value = item.quantidade;
    elementos.forms.editar.dataset.editId = id;

    // Abrir o modal
    document.getElementById('modalEditar').classList.add('active');
    elementos.modalContainer.classList.add('active');
}

// Função para remover um item
async function removerItem(id) {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
        await enviarDados(`http://localhost:5000/estoque/${id}`, 'DELETE');
        await carregarEstoque();
        exibirMensagem('Item removido com sucesso!');
    } catch (error) {
        console.error('Erro ao remover item:', error);
        exibirMensagem('Erro ao remover item. Verifique o console para detalhes.', true);
    }
}

// Função para registrar entrada de material
export async function registrarEntrada(materialId, quantidade) {
    try {
        const response = await enviarDados(`http://localhost:5000/estoque/entrada/${materialId}`, 'POST', {
            quantidade
        });

        if (response) {
            await carregarEstoque();
            await registrarHistorico('Entrada', materialId, quantidade);
            exibirMensagem('Entrada registrada com sucesso!');
            fecharModal();
        }
    } catch (error) {
        console.error('Erro ao registrar entrada:', error);
        exibirMensagem('Erro ao registrar entrada. Verifique o console para detalhes.', true);
    }
}

// Função para registrar saída de material
export async function registrarSaida(materialId, quantidade) {
    console.log("Registrando saída:", { materialId, quantidade }); // Depuração
    try {
        const response = await enviarDados(`http://localhost:5000/estoque/saida/${materialId}`, 'POST', {
            quantidade
        });

        if (response) {
            console.log("Resposta do servidor:", response); // Depuração
            await carregarEstoque();
            await registrarHistorico('Saída', materialId, quantidade);
            exibirMensagem('Saída registrada com sucesso!');
            fecharModal();
        }
    } catch (error) {
        console.error('Erro ao registrar saída:', error);
        exibirMensagem('Erro ao registrar saída. Verifique o console para detalhes.', true);
    }
}

// Função para obter o estoque
export function getEstoque() {
    return estoque;
}

// Função para adicionar um novo item ao estoque
export async function adicionarItem(material, quantidade) {
    try {
        const response = await enviarDados('http://localhost:5000/estoque', 'POST', { material, quantidade });

        if (response) {
            await carregarEstoque();
            exibirMensagem('Item adicionado com sucesso!');
            fecharModal();
        }
    } catch (error) {
        console.error('Erro ao adicionar item:', error);
        exibirMensagem('Erro ao adicionar item. Verifique o console para detalhes.', true);
    }
}

// Configurar eventos dos formulários
export function configurarFormularios() {
    // Formulário de adicionar item
    elementos.forms.adicionar.addEventListener('submit', async (e) => {
        e.preventDefault();
        const material = elementos.forms.adicionar.material.value.trim();
        const quantidade = elementos.forms.adicionar.quantidade.value.trim();

        if (!material || isNaN(quantidade) || quantidade <= 0) {
            exibirMensagem('Preencha todos os campos corretamente.', true);
            return;
        }

        try {
            await adicionarItem(material, quantidade);
        } catch (error) {
            console.error('Erro ao adicionar item:', error);
            exibirMensagem('Erro ao adicionar item. Verifique o console para detalhes.', true);
        }
    });

    // Formulário de editar item
    elementos.forms.editar.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = elementos.forms.editar.dataset.editId;
        const material = elementos.forms.editar.material.value.trim();
        const quantidade = elementos.forms.editar.quantidade.value.trim();

        if (!material || isNaN(quantidade) || quantidade <= 0) {
            exibirMensagem('Preencha todos os campos corretamente.', true);
            return;
        }

        try {
            await enviarDados(`http://localhost:5000/estoque/${id}`, 'PUT', { material, quantidade });
            await carregarEstoque();
            exibirMensagem('Item atualizado com sucesso!');
            fecharModal();
        } catch (error) {
            console.error('Erro ao editar item:', error);
            exibirMensagem('Erro ao editar item. Verifique o console para detalhes.', true);
        }
    });

    // Formulário de registrar entrada
    elementos.forms.entrada.addEventListener('submit', async (e) => {
        e.preventDefault();
        const materialId = elementos.forms.entrada.materialEntrada.value;
        const quantidade = elementos.forms.entrada.quantidadeEntrada.value.trim();

        if (!materialId || isNaN(quantidade) || quantidade <= 0) {
            exibirMensagem('Selecione um material e insira uma quantidade válida.', true);
            return;
        }

        await registrarEntrada(materialId, quantidade);
    });

    // Formulário de registrar saída
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
}
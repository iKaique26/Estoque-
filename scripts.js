document.addEventListener('DOMContentLoaded', () => {
    let estoque = []; // Array para armazenar os itens do estoque

    // URLs da API
    const API_URL = 'http://localhost:3000';
    const ESTOQUE_URL = `${API_URL}/estoque`;
    const ENTRADA_URL = `${API_URL}/entrada`;
    const SAIDA_URL = `${API_URL}/saida`;

    // Elementos do DOM
    const inputPesquisa = document.getElementById('pesquisa');
    const tabelaEstoque = document.getElementById('tabela-estoque');
    const formAdicionar = document.getElementById('formAdicionar');
    const formEntrada = document.getElementById('formEntrada');
    const formSaida = document.getElementById('formSaida');
    const formEditar = document.getElementById('formEditar');

    let itemEmEdicao = null;

    // Função para carregar os itens do estoque
    function carregarEstoque() {
        fetch(ESTOQUE_URL)
            .then(response => response.json())
            .then(data => {
                estoque = data;
                atualizarTabela(estoque);
            })
            .catch(err => console.error('Erro ao carregar estoque:', err));
    }

    // Função para atualizar a tabela com os itens do estoque
    function atualizarTabela(itens) {
        tabelaEstoque.innerHTML = ''; // Limpa a tabela antes de atualizar

        itens.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.material}</td>
                <td>${item.quantidade}</td>
                <td>${item.dataEntrada || ''}</td>
                <td>${item.quantidadeEntrada || ''}</td>
                <td>${item.dataSaida || ''}</td>
                <td>${item.quantidadeSaida || ''}</td>
                <td>
                    <button class="editar-btn" data-id="${item.id}">Editar</button>
                    <button class="remover-btn" data-id="${item.id}">Remover</button>
                </td>
            `;
            tabelaEstoque.appendChild(row);
        });

        // Adiciona eventos de editar e remover aos botões
        document.querySelectorAll('.editar-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const itemId = event.target.getAttribute('data-id');
                abrirModalEditar(itemId);
            });
        });

        document.querySelectorAll('.remover-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const itemId = event.target.getAttribute('data-id');
                removerItem(itemId);
            });
        });
    }

    // Função para filtrar itens conforme o termo de pesquisa
    function filtrarItens(termo) {
        const itensFiltrados = estoque.filter(item =>
            item.material.toLowerCase().includes(termo.toLowerCase())
        );
        atualizarTabela(itensFiltrados);
    }

    // Evento de pesquisa
    inputPesquisa.addEventListener('input', () => {
        filtrarItens(inputPesquisa.value);
    });

    // Função para adicionar um novo item ao estoque
    function adicionarItem(event) {
        event.preventDefault();

        const novoItem = {
            material: formAdicionar.material.value,
            quantidade: parseInt(formAdicionar.quantidade.value),
            dataEntrada: formAdicionar.dataEntrada.value,
            quantidadeEntrada: parseInt(formAdicionar.quantidadeEntrada.value),
            dataSaida: formAdicionar.dataSaida.value,
            quantidadeSaida: parseInt(formAdicionar.quantidadeSaida.value)
        };

        fetch(ESTOQUE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoItem)
        })
            .then(response => response.json())
            .then(item => {
                estoque.push(item);
                atualizarTabela(estoque);
                fecharModal('modalAdicionar');
                formAdicionar.reset(); // Limpa o formulário
            })
            .catch(err => console.error('Erro ao adicionar item:', err));
    }

    // Função para registrar entrada de item
    function registrarEntrada(event) {
        event.preventDefault();

        const entrada = {
            material: formEntrada.materialEntrada.value,
            quantidadeEntrada: parseInt(formEntrada.quantidadeEntrada.value)
        };

        fetch(ENTRADA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entrada)
        })
            .then(response => response.json())
            .then(item => {
                estoque = estoque.map(e => e.material === item.material ? item : e);
                atualizarTabela(estoque);
                fecharModal('modalEntrada');
                formEntrada.reset(); // Limpa o formulário
            })
            .catch(err => console.error('Erro ao registrar entrada:', err));
    }

    // Função para registrar saída de item
    function registrarSaida(event) {
        event.preventDefault();

        const saida = {
            material: formSaida.materialSaida.value,
            quantidadeSaida: parseInt(formSaida.quantidadeSaida.value)
        };

        fetch(SAIDA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saida)
        })
            .then(response => response.json())
            .then(item => {
                estoque = estoque.map(e => e.material === item.material ? item : e);
                atualizarTabela(estoque);
                fecharModal('modalSaida');
                formSaida.reset(); // Limpa o formulário
            })
            .catch(err => console.error('Erro ao registrar saída:', err));
    }

    // Função para abrir o modal de edição
    function abrirModalEditar(itemId) {
        itemEmEdicao = estoque.find(item => item.id === itemId);
        formEditar.material.value = itemEmEdicao.material;
        formEditar.quantidade.value = itemEmEdicao.quantidade;
        formEditar.dataEntrada.value = itemEmEdicao.dataEntrada;
        formEditar.quantidadeEntrada.value = itemEmEdicao.quantidadeEntrada;
        formEditar.dataSaida.value = itemEmEdicao.dataSaida;
        formEditar.quantidadeSaida.value = itemEmEdicao.quantidadeSaida;

        abrirModal('modalEditar');
    }

    // Função para salvar as alterações no item
    function salvarAlteracoes(event) {
        event.preventDefault();

        const itemAtualizado = {
            material: formEditar.material.value,
            quantidade: parseInt(formEditar.quantidade.value),
            dataEntrada: formEditar.dataEntrada.value,
            quantidadeEntrada: parseInt(formEditar.quantidadeEntrada.value),
            dataSaida: formEditar.dataSaida.value,
            quantidadeSaida: parseInt(formEditar.quantidadeSaida.value)
        };

        fetch(`${ESTOQUE_URL}/${itemEmEdicao.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemAtualizado)
        })
            .then(response => response.json())
            .then(updatedItem => {
                estoque = estoque.map(item => item.id === updatedItem.id ? updatedItem : item);
                atualizarTabela(estoque);
                fecharModal('modalEditar');
                formEditar.reset();
            })
            .catch(err => console.error('Erro ao atualizar item:', err));
    }

    // Função para remover um item do estoque
    function removerItem(itemId) {
        fetch(`${ESTOQUE_URL}/${itemId}`, { method: 'DELETE' })
            .then(() => {
                estoque = estoque.filter(item => item.id !== itemId);
                atualizarTabela(estoque);
            })
            .catch(err => console.error('Erro ao remover item:', err));
    }

    // Função para abrir o modal
    function abrirModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'flex';
    }

    // Função para fechar o modal
    function fecharModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'none';
    }

    // Eventos para abrir modais
    document.querySelectorAll('.sidebar-btn').forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-modal');
            abrirModal(modalId);
        });
    });

    // Eventos para fechar modais
    document.querySelectorAll('.close').forEach(closeButton => {
        closeButton.addEventListener('click', () => {
            const modalId = closeButton.closest('.modal').id;
            fecharModal(modalId);
        });
    });

    // Fechar modal ao clicar fora da área do conteúdo
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                fecharModal(modal.id);
            }
        });
    });

    // Eventos de submit dos formulários
    formAdicionar.addEventListener('submit', adicionarItem);
    formEntrada.addEventListener('submit', registrarEntrada);
    formSaida.addEventListener('submit', registrarSaida);
    formEditar.addEventListener('submit', salvarAlteracoes);

    // Carregar estoque ao iniciar
    carregarEstoque();
});

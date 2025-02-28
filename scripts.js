document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/estoque';
    let estoque = [];

    // Cache de elementos do DOM
    const elementos = {
        pesquisa: document.getElementById('pesquisa'),
        tabelaEstoque: document.getElementById('tabela-estoque'),
        forms: {
            adicionar: document.getElementById('formAdicionar'),
            editar: {
                form: document.getElementById('formEditar'),
                material: document.getElementById('materialEditar'),
                quantidade: document.getElementById('quantidadeEditar')
            },
            entrada: document.getElementById('formEntrada'),
            saida: document.getElementById('formSaida')
        },
        selects: {
            entrada: document.getElementById('materialEntrada'),
            saida: document.getElementById('materialSaida')
        },
        modais: document.querySelectorAll('.modal'),
        modalContainer: document.getElementById('modalContainer'),
        mensagem: document.getElementById('mensagem')
    };

    // Função principal de inicialização
    function init() {
        configurarEventos();
        carregarEstoque();
    }

    // Configurar eventos
    function configurarEventos() {
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

        // Eventos de submit dos formulários
        elementos.forms.adicionar.addEventListener('submit', handleAdicionar);
        elementos.forms.editar.form.addEventListener('submit', handleEditar);
        elementos.forms.entrada.addEventListener('submit', handleEntrada);
        elementos.forms.saida.addEventListener('submit', handleSaida);

        // Evento de pesquisa com debounce
        elementos.pesquisa.addEventListener('input', debounce(filtrarEstoque, 300));
    }

    // Carregar estoque da API
    async function carregarEstoque() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Erro ao carregar estoque');
            estoque = await response.json();
            atualizarInterface();
        } catch (err) {
            console.error('Erro ao carregar estoque:', err);
            exibirMensagem('Erro ao carregar estoque. Verifique o console para detalhes.', true);
        }
    }

    // Atualizar a interface com os dados do estoque
    function atualizarInterface() {
        atualizarTabela(estoque);
        popularDropdowns();
    }

    // Atualizar a tabela de estoque
    function atualizarTabela(itens = estoque) {
        elementos.tabelaEstoque.innerHTML = itens.map(item => `
            <tr class="${getNivelEstoque(item.quantidade)}">
                <td>${item.material}</td>
                <td>${item.quantidade}</td>
                <td>${item.ultimaEntrada || '-'}</td>
                <td>${item.qtdEntrada || '-'}</td>
                <td>${item.ultimaSaida || '-'}</td>
                <td>${item.qtdSaida || '-'}</td>
                <td>
                    <button class="btn-editar" data-id="${item.id}" aria-label="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-remover" data-id="${item.id}" aria-label="Remover"><i class="fas fa-trash-alt"></i></button>
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

    // Determinar o nível de estoque com base na quantidade
    function getNivelEstoque(quantidade) {
        if (quantidade >= 50) return 'nivel-bom'; // Verde
        if (quantidade >= 20) return 'nivel-medio'; // Amarelo
        return 'nivel-critico'; // Vermelho
    }

    // Popular dropdowns de materiais
    function popularDropdowns() {
        const options = estoque.map(item => 
            `<option value="${item.id}">${item.material}</option>`
        ).join('');
        
        elementos.selects.entrada.innerHTML = `<option value="">Selecione um material</option>${options}`;
        elementos.selects.saida.innerHTML = `<option value="">Selecione um material</option>${options}`;
    }

    // Função para adicionar um novo item
    async function handleAdicionar(e) {
        e.preventDefault();
        const material = elementos.forms.adicionar.material.value.trim();
        const quantidade = Number(elementos.forms.adicionar.quantidade.value);

        if (!material || quantidade <= 0) {
            exibirMensagem('Por favor, preencha todos os campos corretamente.', true);
            return;
        }

        try {
            const novoItem = { material, quantidade };
            await enviarDados(API_URL, 'POST', novoItem);
            await registrarHistorico('Adição', material, quantidade);
            exibirMensagem('Item adicionado com sucesso!');
            fecharModal();
        } catch (error) {
            console.error('Erro ao adicionar item:', error);
            exibirMensagem('Erro ao adicionar item. Verifique o console para detalhes.', true);
        }
    }

    // Função para editar um item
    async function handleEditar(e) {
        e.preventDefault();
        const material = elementos.forms.editar.material.value.trim();
        const quantidade = Number(elementos.forms.editar.quantidade.value);

        if (!material || quantidade <= 0) {
            exibirMensagem('Por favor, preencha todos os campos corretamente.', true);
            return;
        }

        try {
            const itemAtualizado = { material, quantidade };
            const id = elementos.forms.editar.form.dataset.editId;
            await enviarDados(`${API_URL}/${id}`, 'PUT', itemAtualizado);
            await registrarHistorico('Edição', material, quantidade);
            exibirMensagem('Item atualizado com sucesso!');
            fecharModal();
        } catch (error) {
            console.error('Erro ao editar item:', error);
            exibirMensagem('Erro ao editar item. Verifique o console para detalhes.', true);
        }
    }

    // Função para registrar uma entrada
    async function handleEntrada(e) {
        e.preventDefault();
        const quantidade = Number(elementos.forms.entrada.quantidadeEntrada.value);
        const materialId = elementos.selects.entrada.value;

        if (quantidade <= 0) {
            exibirMensagem('A quantidade deve ser maior que zero.', true);
            return;
        }

        try {
            await enviarDados(`${API_URL}/entrada/${materialId}`, 'POST', { quantidade });
            const material = estoque.find(item => item.id === materialId).material;
            await registrarHistorico('Entrada', material, quantidade);
            exibirMensagem('Entrada registrada com sucesso!');
            await carregarEstoque();
            fecharModal();
        } catch (error) {
            console.error('Erro ao registrar entrada:', error);
            exibirMensagem(`Erro ao registrar entrada: ${error.message}`, true);
        }
    }

    // Função para registrar uma saída
    async function handleSaida(e) {
        e.preventDefault();
        const quantidade = Number(elementos.forms.saida.quantidadeSaida.value);
        const materialId = elementos.selects.saida.value;

        if (quantidade <= 0) {
            exibirMensagem('A quantidade deve ser maior que zero.', true);
            return;
        }

        try {
            await enviarDados(`${API_URL}/saida/${materialId}`, 'POST', { quantidade });
            const material = estoque.find(item => item.id === materialId).material;
            await registrarHistorico('Saída', material, quantidade);
            exibirMensagem('Saída registrada com sucesso!');
            await carregarEstoque();
            fecharModal();
        } catch (error) {
            console.error('Erro ao registrar saída:', error);
            exibirMensagem(`Erro ao registrar saída: ${error.message}`, true);
        }
    }

    // Função genérica para enviar dados à API
    async function enviarDados(url, method, data) {
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro na requisição');
            }

            await carregarEstoque();
            return await response.json();
        } catch (err) {
            console.error(`Erro no ${method}:`, err);
            throw err;
        }
    }

    // Abrir modal
    function abrirModal(e) {
        const modalId = e.target.dataset.modal;
        document.getElementById(modalId).classList.add('active');
        elementos.modalContainer.classList.add('active');
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
        elementos.forms.editar.form.dataset.editId = id;

        // Limpar mensagens de erro
        document.querySelector('.erro-material').textContent = '';
        document.querySelector('.erro-quantidade').textContent = '';

        // Abrir o modal
        const modalEditar = document.getElementById('modalEditar');
        modalEditar.classList.add('active');
        elementos.modalContainer.classList.add('active');
    }

    // Função para validar o formulário de edição
    function validarFormularioEditar() {
        const material = elementos.forms.editar.material.value.trim();
        const quantidade = Number(elementos.forms.editar.quantidade.value);

        let valido = true;

        if (!material) {
            document.querySelector('.erro-material').textContent = 'O campo Material é obrigatório.';
            document.querySelector('.erro-material').style.display = 'block';
            valido = false;
        } else {
            document.querySelector('.erro-material').style.display = 'none';
        }

        if (quantidade <= 0 || isNaN(quantidade)) {
            document.querySelector('.erro-quantidade').textContent = 'A quantidade deve ser maior que zero.';
            document.querySelector('.erro-quantidade').style.display = 'block';
            valido = false;
        } else {
            document.querySelector('.erro-quantidade').style.display = 'none';
        }

        return valido;
    }

    // Evento de submit do formulário de edição
    elementos.forms.editar.form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validarFormularioEditar()) return;

        const material = elementos.forms.editar.material.value.trim();
        const quantidade = Number(elementos.forms.editar.quantidade.value);
        const id = elementos.forms.editar.form.dataset.editId;

        try {
            await enviarDados(`${API_URL}/${id}`, 'PUT', { material, quantidade });
            await registrarHistorico('Edição', material, quantidade);
            exibirMensagem('Item atualizado com sucesso!');
            fecharModal();
        } catch (error) {
            console.error('Erro ao editar item:', error);
            exibirMensagem('Erro ao editar item. Verifique o console para detalhes.', true);
        }
    });

    // Evento de cancelar edição
    document.querySelector('.btn-cancelar').addEventListener('click', fecharModal);

    // Remover item
    async function removerItem(id) {
        if (!confirm('Tem certeza que deseja excluir este item?')) return;

        try {
            const item = estoque.find(item => item.id === id);
            await enviarDados(`${API_URL}/${id}`, 'DELETE');
            await registrarHistorico('Remoção', item.material, item.quantidade);
            exibirMensagem('Item removido com sucesso!');
        } catch (error) {
            console.error('Erro ao remover item:', error);
            exibirMensagem('Erro ao remover item. Verifique o console para detalhes.', true);
        }
    }

    // Filtrar estoque
    function filtrarEstoque() {
        const termo = elementos.pesquisa.value.toLowerCase();
        const filtrado = estoque.filter(item => 
            item.material.toLowerCase().includes(termo)
        );
        atualizarTabela(filtrado);
    }

    // Fechar modal
    function fecharModal() {
        elementos.modais.forEach(modal => modal.classList.remove('active'));
        elementos.modalContainer.classList.remove('active');
        elementos.forms.adicionar.reset();
        elementos.forms.editar.form.reset();
        elementos.forms.entrada.reset();
        elementos.forms.saida.reset();
    }

    // Debounce para melhorar a performance da pesquisa
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Exibir mensagens na interface
    function exibirMensagem(texto, isErro = false) {
        elementos.mensagem.textContent = texto;
        elementos.mensagem.classList.toggle('erro', isErro);
        elementos.mensagem.style.display = 'block';

        setTimeout(() => {
            elementos.mensagem.style.display = 'none';
        }, 3000);
    }

    // Função para registrar uma alteração no histórico
    async function registrarHistorico(acao, material, quantidade) {
        const data = new Date().toLocaleString('pt-BR');
        const historicoItem = { acao, material, quantidade, data };

        try {
            await fetch(`${API_URL}/historico`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(historicoItem)
            });
        } catch (error) {
            console.error('Erro ao registrar histórico:', error);
        }
    }

    // Função para exibir o histórico de alterações
    async function exibirHistorico() {
        try {
            const response = await fetch(`${API_URL}/historico`);
            if (!response.ok) throw new Error('Erro ao carregar histórico');
            const historico = await response.json();

            // Exibir o histórico em uma nova seção ou modal
            const historicoHTML = historico.map(item => `
                <div class="historico-item">
                    <span class="historico-acao">${item.acao}</span>
                    <span class="historico-material">${item.material}</span>
                    <span class="historico-quantidade">${item.quantidade}</span>
                    <span class="historico-data">${item.data}</span>
                </div>
            `).join('');

            const historicoContainer = document.createElement('div');
            historicoContainer.id = 'historico-container';
            historicoContainer.innerHTML = `
                <h2>Histórico de Alterações</h2>
                <div class="historico-lista">${historicoHTML}</div>
            `;

            document.body.appendChild(historicoContainer);
        } catch (error) {
            console.error('Erro ao exibir histórico:', error);
        }
    }

    // Inicializar a aplicação
    init();
});
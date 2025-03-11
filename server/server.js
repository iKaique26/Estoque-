const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;
const caminhoArquivo = path.join(__dirname, 'estoque.json');
const caminhoHistorico = path.join(__dirname, 'historico.json');

// Função para carregar o estoque
async function carregarEstoque() {
    try {
        const dados = await fs.readFile(caminhoArquivo, 'utf-8');
        return JSON.parse(dados);
    } catch (erro) {
        if (erro.code === 'ENOENT') {
            await fs.writeFile(caminhoArquivo, '[]', 'utf-8');
            return [];
        } else if (erro instanceof SyntaxError) {
            await fs.writeFile(caminhoArquivo, '[]', 'utf-8');
            return [];
        } else {
            throw erro;
        }
    }
}

// Função para salvar o estoque
async function salvarEstoque(estoque) {
    try {
        await fs.writeFile(caminhoArquivo, JSON.stringify(estoque, null, 4), 'utf-8');
    } catch (erro) {
        console.error('Erro ao salvar o estoque:', erro);
        throw erro;
    }
}

// Middleware para carregar o estoque em todas as rotas
app.use(async (req, res, next) => {
    try {
        req.estoque = await carregarEstoque();
        next();
    } catch (erro) {
        res.status(500).json({ mensagem: "Erro ao carregar o estoque", erro: erro.message });
    }
});

// Rota para obter todos os itens
app.get('/estoque', (req, res) => {
    res.json(req.estoque);
});

// Rota para adicionar um novo item
app.post('/estoque', async (req, res) => {
    console.log("Recebendo requisição para adicionar item:", req.body); // Depuração
    const { material, quantidade } = req.body;

    if (!material || isNaN(quantidade) || quantidade <= 0) {
        return res.status(400).json({ mensagem: "Dados inválidos. Material e quantidade são obrigatórios." });
    }

    const novoItem = {
        id: Date.now().toString(),
        material,
        quantidade: Number(quantidade),
        ultimaEntrada: null,
        qtdEntrada: null,
        ultimaSaida: null,
        qtdSaida: null
    };

    req.estoque.push(novoItem);
    await salvarEstoque(req.estoque);
    res.status(201).json(novoItem);
});

// Rota para atualizar um item
app.put('/estoque/:id', async (req, res) => {
    const { id } = req.params;
    const { material, quantidade } = req.body;

    const item = req.estoque.find(item => item.id === id);
    if (!item) {
        return res.status(404).json({ mensagem: "Item não encontrado" });
    }

    if (material) item.material = material;
    if (!isNaN(quantidade) && quantidade > 0) item.quantidade = Number(quantidade);

    await salvarEstoque(req.estoque);
    res.json(item);
});

// Rota para remover um item
app.delete('/estoque/:id', async (req, res) => {
    const { id } = req.params;

    const index = req.estoque.findIndex(item => item.id === id);
    if (index === -1) {
        return res.status(404).json({ mensagem: "Item não encontrado" });
    }

    const [itemRemovido] = req.estoque.splice(index, 1);
    await salvarEstoque(req.estoque);
    res.json({ mensagem: "Item removido", item: itemRemovido });
});

// Rota para registrar uma entrada no estoque
app.post('/estoque/entrada/:id', async (req, res) => {
    const { id } = req.params;
    const { quantidade } = req.body;

    const item = req.estoque.find(item => item.id === id);
    if (!item) return res.status(404).json({ mensagem: "Item não encontrado" });
    if (isNaN(quantidade) || quantidade <= 0) return res.status(400).json({ mensagem: "Quantidade inválida" });

    item.quantidade += Number(quantidade);
    item.qtdEntrada = Number(quantidade);
    item.ultimaEntrada = new Date().toLocaleDateString('pt-BR');

    await salvarEstoque(req.estoque);
    res.json({ mensagem: "Entrada registrada com sucesso", item });
});

// Rota para registrar uma saída do estoque
app.post('/estoque/saida/:id', async (req, res) => {
    const { id } = req.params;
    const { quantidade } = req.body;

    const item = req.estoque.find(item => item.id === id);
    if (!item) return res.status(404).json({ mensagem: "Item não encontrado" });
    if (isNaN(quantidade) || quantidade <= 0) return res.status(400).json({ mensagem: "Quantidade inválida" });
    if (item.quantidade < quantidade) return res.status(400).json({ mensagem: "Estoque insuficiente" });

    item.quantidade -= Number(quantidade);
    item.qtdSaida = Number(quantidade);
    item.ultimaSaida = new Date().toLocaleDateString('pt-BR');

    await salvarEstoque(req.estoque);
    res.json({ mensagem: "Saída registrada com sucesso", item });
});

// Rota para registrar histórico de movimentações
app.post('/estoque/historico', async (req, res) => {
    const { acao, material, quantidade, data } = req.body;

    if (!acao || !material || isNaN(quantidade) || !data) {
        return res.status(400).json({ mensagem: "Dados inválidos. Todos os campos são obrigatórios." });
    }

    try {
        const historico = await carregarHistorico();
        historico.push({ acao, material, quantidade, data });
        await salvarHistorico(historico);
        res.status(201).json({ mensagem: "Histórico registrado com sucesso" });
    } catch (erro) {
        res.status(500).json({ mensagem: "Erro ao registrar histórico", erro: erro.message });
    }
});

// Rota para obter histórico de movimentações
app.get('/estoque/historico', async (req, res) => {
    try {
        const historico = await carregarHistorico();
        res.json(historico);
    } catch (erro) {
        res.status(500).json({ mensagem: "Erro ao carregar histórico", erro: erro.message });
    }
});

// Funções para carregar e salvar histórico
async function carregarHistorico() {
    try {
        const dados = await fs.readFile(caminhoHistorico, 'utf-8');
        return JSON.parse(dados);
    } catch (erro) {
        return [];
    }
}

async function salvarHistorico(historico) {
    try {
        await fs.writeFile(caminhoHistorico, JSON.stringify(historico, null, 4), 'utf-8');
    } catch (erro) {
        console.error('Erro ao salvar histórico:', erro);
        throw erro;
    }
}

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
    console.error("Erro interno no servidor:", err.stack);
    res.status(500).json({ mensagem: "Erro interno no servidor", erro: err.message });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Erro: Porta ${PORT} já está em uso.`);
    } else {
        console.error("Erro ao iniciar o servidor:", err);
    }
});
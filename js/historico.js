// historico.js
import { enviarDados } from './api.js';

// Função para registrar uma movimentação no histórico
export async function registrarHistorico(acao, material, quantidade) {
    const data = new Date().toLocaleString('pt-BR');
    await enviarDados('http://localhost:5000/estoque/historico', 'POST', {
        acao, material, quantidade, data
    });
}

// Função para exibir o histórico de movimentações
export async function exibirHistorico() {
    try {
        const response = await fetch('http://localhost:5000/estoque/historico');
        if (!response.ok) throw new Error('Erro ao carregar histórico');
        const historico = await response.json();

        const historicoHTML = historico.map(item => `
            <div class="historico-item">
                <span class="historico-acao">${item.acao}</span>
                <span class="historico-material">${item.material}</span>
                <span class="historico-quantidade">${item.quantidade}</span>
                <span class="historico-data">${item.data}</span>
            </div>
        `).join('');

        document.getElementById('historico-lista').innerHTML = historicoHTML;

        // Abrir o modal de histórico
        document.getElementById('historicoContainer').classList.add('active');
        document.getElementById('modalContainer').classList.add('active');
    } catch (error) {
        console.error('Erro ao exibir histórico:', error);
        exibirMensagem('Erro ao carregar histórico. Verifique o console para detalhes.', true);
    }
}
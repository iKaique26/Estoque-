// Função debounce para melhorar a performance da pesquisa
export function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Função para exibir mensagens
export function exibirMensagem(texto, isErro = false) {
    const mensagem = document.getElementById('mensagem');
    mensagem.textContent = texto;
    mensagem.classList.toggle('erro', isErro);
    mensagem.style.display = 'block';

    setTimeout(() => {
        mensagem.style.display = 'none';
    }, 3000);
}
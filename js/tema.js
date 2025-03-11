// Função para alternar o tema
export function alternarTema() {
    document.body.classList.toggle('tema-escuro');
    const temaAtual = document.body.classList.contains('tema-escuro') ? 'escuro' : 'claro';
    localStorage.setItem('tema', temaAtual);
}

// Função para carregar o tema salvo
export function carregarTemaSalvo() {
    const temaSalvo = localStorage.getItem('tema');
    if (temaSalvo === 'escuro') {
        document.body.classList.add('tema-escuro');
    } else {
        document.body.classList.remove('tema-escuro');
    }
}
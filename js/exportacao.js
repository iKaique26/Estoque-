import { getEstoque } from './estoque.js';

// Função para exportar CSV
export function exportarCSV() {
    const estoque = getEstoque();

    if (!Array.isArray(estoque) || estoque.length === 0) {
        alert('Nenhum dado disponível para exportação.');
        return;
    }

}

// Função para exportar PDF usando pdfmake
export function exportarPDF() {
    const estoque = getEstoque();

    if (!Array.isArray(estoque) || estoque.length === 0) {
        alert('Nenhum dado disponível para exportação.');
        return;
    }

    // Definir o conteúdo do PDF
    const docDefinition = {
        content: [
            { text: 'Relatório de Estoque', style: 'header' },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', '*', '*', '*', '*', '*'],
                    body: [
                        ['Material', 'Quantidade', 'Última Entrada', 'Qtd Entrada', 'Última Saída', 'Qtd Saída'],
                        ...estoque.map(item => [
                            item.material,
                            item.quantidade.toString(),
                            item.ultimaEntrada || '-',
                            item.qtdEntrada || '-',
                            item.ultimaSaida || '-',
                            item.qtdSaida || '-'
                        ])
                    ]
                }
            }
        ],
        styles: {
            header: {
                fontSize: 18,
                bold: true,
                margin: [0, 0, 0, 10]
            }
        }
    };

    // Gerar o PDF
    pdfMake.createPdf(docDefinition).download('estoque.pdf');
}
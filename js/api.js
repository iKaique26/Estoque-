const API_URL = 'http://localhost:5000/estoque';

export async function enviarDados(url, method, data) {
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

        return await response.json();
    } catch (err) {
        console.error(`Erro no ${method}:`, err);
        throw err;
    }
}
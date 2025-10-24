import { API_BASE_URL } from './api-config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const resultContainer = document.getElementById('resultContainer');
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const transactionId = params.get('id');

    if (!status || !transactionId) {
        resultContainer.innerHTML = '<h1>Error</h1><p>No se encontró información de la transacción.</p><a href="index.html">Volver a la tienda</a>';
        resultContainer.classList.add('declined');
        return;
    }

    // Verificar la transacción con el backend para seguridad
    try {
        await fetch(`${API_BASE_URL}/payments/verify-transaction/${transactionId}`);
    } catch (error) {
        console.error("Error verificando la transacción:", error);
    }

    if (status === 'approved') {
        resultContainer.innerHTML = `
            <h1>¡Pago Aprobado!</h1>
            <p>Gracias por tu compra. Hemos recibido tu pedido y te hemos enviado un correo de confirmación.</p>
            <p>ID de transacción: ${transactionId}</p>
            <a href="index.html">Seguir comprando</a>
        `;
        resultContainer.classList.add('approved');
    } else {
        resultContainer.innerHTML = `
            <h1>Pago Rechazado</h1>
            <p>Lo sentimos, tu pago no pudo ser procesado. Por favor, intenta de nuevo o contacta a tu banco.</p>
            <p>ID de transacción: ${transactionId}</p>
            <a href="checkout.html">Intentar de nuevo</a>
        `;
        resultContainer.classList.add('declined');
    }
});
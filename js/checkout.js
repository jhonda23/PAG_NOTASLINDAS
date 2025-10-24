import { API_BASE_URL } from './api-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const carrito = JSON.parse(localStorage.getItem('notasLindasCarrito') || '[]');
    const orderSummary = document.getElementById('orderSummary');
    const checkoutForm = document.getElementById('checkoutForm');
    const payBtn = document.getElementById('payBtn');

    if (carrito.length === 0) {
        orderSummary.innerHTML = '<p>Tu carrito está vacío. <a href="index.html">Vuelve a la tienda</a>.</p>';
        payBtn.disabled = true;
        return;
    }

    const total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

    orderSummary.innerHTML = `
        <h3>Resumen del Pedido</h3>
        <p>Total de productos: ${totalItems}</p>
        <p><strong>Total a pagar: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(total)}</strong></p>
    `;

    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        payBtn.disabled = true;
        payBtn.textContent = 'Procesando...';

        const cliente = {
            nombre: document.getElementById('nombre').value,
            email: document.getElementById('email').value,
            telefono: document.getElementById('telefono').value,
        };

        const pedidoData = {
            productos: carrito,
            total,
            ...cliente
        };

        try {
            const res = await fetch(`${API_BASE_URL}/payments/create-wompi-transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pedidoData)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error al crear la transacción');
            }

            const { transactionData, publicKey, reference, amountInCents } = await res.json();

            // Limpiar carrito después de crear la transacción
            localStorage.removeItem('notasLindasCarrito');

            // Abrir el widget de Wompi
            const checkout = new WidgetCheckout({
                currency: 'COP',
                amountInCents: amountInCents,
                reference: reference,
                publicKey: publicKey,
                redirectUrl: `http://127.0.0.1:5500/html/payment-result.html`,
            });

            checkout.open(function (result) {
                const transaction = result.transaction;
                if (transaction.status === 'APPROVED') {
                    window.location.href = `payment-result.html?status=approved&id=${transaction.id}`;
                } else {
                    window.location.href = `payment-result.html?status=declined&id=${transaction.id}`;
                }
            });

        } catch (error) {
            console.error('Error en el checkout:', error);
            alert('Hubo un problema al procesar tu pago. Por favor, intenta de nuevo.');
            payBtn.disabled = false;
            payBtn.textContent = 'Pagar con Wompi';
        }
    });
});
import express from 'express';
import Order from '../models/Order.js';
import { sendOrderNotificationEmail } from '../utils/mailer.js';

const router = express.Router();

// Crear transacción de Wompi
router.post('/create-wompi-transaction', async (req, res) => {
  try {
    const { productos, total, nombre, email, telefono } = req.body;

    if (!productos || productos.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    // Crear orden en la base de datos con estado "pendiente"
    const order = new Order({
      productos,
      total,
      estado: 'Pendiente',
      cliente: { nombre, email, telefono }
    });
    await order.save();

    // Configurar datos para Wompi
    const reference = `NOTAS-${order._id}`;
    const amountInCents = Math.round(total * 100); // Convertir a centavos

    // URL de redirección después del pago
    const redirectUrl = `http://localhost:5500/html/payment-result.html?order=${order._id}`;

    // Datos de la transacción para Wompi
    const transactionData = {
      reference: reference,
      amount_in_cents: amountInCents,
      currency: 'COP',
      customer_email: email || 'cliente@notalindas.com',
      redirect_url: redirectUrl,
      // Configuración del widget
      public_key: process.env.WOMPI_PUBLIC_KEY
    };

    // Devolver datos al frontend para abrir el widget de Wompi
    res.json({
      success: true,
      orderId: order._id,
      transactionData,
      publicKey: process.env.WOMPI_PUBLIC_KEY,
      reference,
      amountInCents
    });

  } catch (err) {
    console.error('Error creando transacción:', err);
    res.status(500).json({ error: 'Error al procesar el pedido', details: err.message });
  }
});

// Verificar estado de transacción de Wompi
router.get('/verify-transaction/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Consultar transacción en Wompi
    const response = await fetch(`https://production.wompi.co/v1/transactions/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.WOMPI_PRIVATE_KEY}`
      }
    });

    const transaction = await response.json();

    // Actualizar orden según el estado de la transacción
    if (transaction.data && transaction.data.reference) {
      const orderId = transaction.data.reference.replace('NOTAS-', '');
      const order = await Order.findById(orderId);

      if (order) {
        // Actualizar estado según respuesta de Wompi
        if (transaction.data.status === 'APPROVED') {
          order.estado = 'Pagado';
          order.transactionId = transactionId;
          await order.save();

          // Enviar correo de confirmación
          try {
            await sendOrderNotificationEmail(order);
          } catch (mailErr) {
            console.error('Error enviando correo:', mailErr);
          }
        } else if (transaction.data.status === 'DECLINED') {
          order.estado = 'Rechazado';
          await order.save();
        }
      }
    }

    res.json({
      success: true,
      transaction: transaction.data
    });

  } catch (err) {
    console.error('Error verificando transacción:', err);
    res.status(500).json({ error: 'Error al verificar la transacción', details: err.message });
  }
});

// Webhook para recibir notificaciones de Wompi
router.post('/wompi-webhook', async (req, res) => {
  try {
    const event = req.body;

    console.log('Webhook recibido de Wompi:', event);

    // Validar el evento y actualizar la orden
    if (event.event === 'transaction.updated' && event.data) {
      const transaction = event.data.transaction;
      const orderId = transaction.reference.replace('NOTAS-', '');

      const order = await Order.findById(orderId);
      if (order) {
        if (transaction.status === 'APPROVED') {
          order.estado = 'Pagado';
          order.transactionId = transaction.id;
          await order.save();

          // Enviar correo
          try {
            await sendOrderNotificationEmail(order);
          } catch (mailErr) {
            console.error('Error enviando correo:', mailErr);
          }
        } else if (transaction.status === 'DECLINED') {
          order.estado = 'Rechazado';
          await order.save();
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error procesando webhook:', err);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});

export default router;

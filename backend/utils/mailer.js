const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuración del transporter para Nodemailer usando Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // tu_email@gmail.com
        pass: process.env.EMAIL_PASS, // tu contraseña de aplicación
    },
});

// Función para enviar el correo de notificación de nuevo pedido
async function sendOrderNotificationEmail(order) {
    const clienteEmail = order.cliente?.email || process.env.EMAIL_USER;
    const adminEmail = process.env.EMAIL_USER;

    // Formateador de moneda
    const formatCurrency = (value) => new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
    }).format(value);

    // Generar el HTML para la lista de productos
    const productosHtml = order.productos.map(p => `
        <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px; display: flex; align-items: center;">
                <img src="${p.imagen}" alt="${p.nombre}" width="60" style="border-radius: 8px; margin-right: 15px;">
                <div>
                    <strong>${p.nombre}</strong>
                    <br>
                    <small>Cantidad: ${p.cantidad}</small>
                </div>
            </td>
            <td style="padding: 10px; text-align: right;">${formatCurrency(p.precio * p.cantidad)}</td>
        </tr>
    `).join('');

    // Plantilla HTML del correo
    const mailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #d63384;">¡Nuevo Pedido Recibido!</h1>
                <p>Se ha generado un nuevo pedido en <strong>Notas Lindas</strong>.</p>
            </div>
            
            <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px;">Detalles del Pedido #${order._id.toString().slice(-6)}</h3>
            <p><strong>Fecha:</strong> ${new Date(order.fecha).toLocaleString('es-CO')}</p>
            <p><strong>Estado:</strong> <span style="background: #ffe4e6; padding: 3px 8px; border-radius: 5px;">${order.estado}</span></p>
            
            <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 30px;">Productos</h3>
            <table style="width: 100%; border-collapse: collapse;">
                ${productosHtml}
            </table>
            
            <div style="text-align: right; margin-top: 20px; font-size: 1.2em;">
                <strong>Total del Pedido: ${formatCurrency(order.total)}</strong>
            </div>

            ${order.cliente || order.clienteInfo ? `
            <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 30px;">Información del Cliente</h3>
            <p><strong>Nombre:</strong> ${order.cliente?.nombre || order.clienteInfo?.nombre}</p>
            <p><strong>Email:</strong> ${order.cliente?.email || order.clienteInfo?.email || 'No proporcionado'}</p>
            <p><strong>Teléfono:</strong> ${order.cliente?.telefono || order.clienteInfo?.telefono}</p>
            <p><strong>Dirección:</strong> ${order.cliente?.direccion || 'Recoge en tienda'}</p>
            ` : ''}

            <div style="text-align: center; margin-top: 30px; font-size: 0.9em; color: #777;">
                <p>Este es un correo automático. Por favor, no respondas a este mensaje.</p>
                <p>&copy; ${new Date().getFullYear()} Notas Lindas</p>
            </div>
        </div>
    `;

    // Opciones del correo
    const mailOptions = {
        from: `"Notas Lindas" <${process.env.EMAIL_USER}>`,
        to: [clienteEmail, adminEmail].join(','), // Envía al cliente y al admin
        subject: `Confirmación de Pedido #${order._id.toString().slice(-6)} - Notas Lindas`,
        html: mailHtml,
    };

    // Enviar el correo
    await transporter.sendMail(mailOptions);
}

module.exports = { sendOrderNotificationEmail };
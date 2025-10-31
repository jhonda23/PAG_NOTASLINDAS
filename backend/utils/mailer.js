import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Configuración del transporter para Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // tu cuenta configurada en .env
        pass: process.env.EMAIL_PASS, // clave de aplicación de Gmail
    },
});

export async function sendOrderNotificationEmail(order) {
    const adminEmail = 'notaslindas20@gmail.com'; // correo del dueño

    const formatCurrency = (value) => new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
    }).format(value);

    const productosHtml = order.productos.map(p => `
        <tr style="border-bottom:1px solid #eee;">
            <td style="padding:12px;display:flex;align-items:center;">
                <img src="${p.imagen}" width="60" height="60" style="border-radius:8px;margin-right:12px;object-fit:cover;">
                <div>
                    <strong>${p.nombre}</strong><br>
                    <small>Cantidad: ${p.cantidad}</small>
                </div>
            </td>
            <td style="text-align:right;padding:12px;">${formatCurrency(p.precio * p.cantidad)}</td>
        </tr>
    `).join('');

    const mailHtml = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:650px;margin:auto;border:1px solid #f2f2f2;border-radius:10px;overflow:hidden;">
            
            <!-- ENCABEZADO -->
            <div style="background:#fce4ec;padding:25px;text-align:center;">
                <img src="https://i.imgur.com/DcgDk2L.png" alt="Notas Lindas" style="width:120px;margin-bottom:10px;">
                <h1 style="color:#d81b60;margin:0;">Nuevo Pedido</h1>
                <p style="margin:0;color:#555;">Has recibido un nuevo pedido en <strong>Notas Lindas</strong></p>
            </div>

            <!-- DETALLES -->
            <div style="padding:25px;">
                <h3 style="margin-bottom:10px;color:#d81b60;">Pedido #${order._id.toString().slice(-6)}</h3>
                <p><strong>Fecha:</strong> ${new Date(order.fecha).toLocaleString('es-CO')}</p>
                <p><strong>Estado:</strong> <span style="background:#ffe4ec;padding:4px 8px;border-radius:5px;">${order.estado}</span></p>

                <h3 style="border-bottom:2px solid #f2f2f2;padding-bottom:6px;margin-top:25px;">Productos</h3>
                <table style="width:100%;border-collapse:collapse;margin-top:10px;">
                    ${productosHtml}
                </table>

                <div style="text-align:right;margin-top:20px;font-size:1.2em;">
                    <strong>Total: ${formatCurrency(order.total)}</strong>
                </div>

                ${order.cliente || order.clienteInfo ? `
                <h3 style="border-bottom:2px solid #f2f2f2;padding-bottom:6px;margin-top:25px;">Datos del Cliente</h3>
                <p><strong>Nombre:</strong> ${order.cliente?.nombre || order.clienteInfo?.nombre}</p>
                <p><strong>Teléfono:</strong> ${order.cliente?.telefono || order.clienteInfo?.telefono}</p>
                <p><strong>Dirección:</strong> ${order.cliente?.direccion || 'Recoge en tienda'}</p>
                ` : ''}
            </div>

            <!-- PIE -->
            <div style="background:#fafafa;padding:20px;text-align:center;color:#999;font-size:0.9em;">
                <p>Este correo fue enviado automáticamente por <strong>Notas Lindas</strong>.</p>
                <p>&copy; ${new Date().getFullYear()} Notas Lindas. Todos los derechos reservados.</p>
            </div>
        </div>
    `;

    const mailOptions = {
        from: `"Notas Lindas 💌" <${adminEmail}>`, // De: Notas Lindas
        to: adminEmail, // Para: el mismo correo
        subject: `📦 Nuevo Pedido #${order._id.toString().slice(-6)} - Notas Lindas`,
        html: mailHtml,
    };

    await transporter.sendMail(mailOptions);
}

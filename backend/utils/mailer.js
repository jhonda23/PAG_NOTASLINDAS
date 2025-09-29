import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function enviarCorreoPedido(order) {
  const { productos, total, estado, _id } = order;
  const productosHtml = productos.map(p => `
    <li>${p.nombre} (x${p.cantidad}) - $${p.precio}</li>
  `).join('');
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'dayanacruz.profe@gmail.com',
    subject: `Nuevo pedido recibido (ID: ${_id || 'nuevo'})` ,
    html: `
      <h2>Nuevo pedido recibido</h2>
      <ul>${productosHtml}</ul>
      <p><b>Total:</b> $${total}</p>
      <p><b>Estado:</b> ${estado}</p>
    `
  };
  await transporter.sendMail(mailOptions);
}
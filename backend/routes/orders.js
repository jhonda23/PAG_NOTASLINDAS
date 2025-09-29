import express from 'express';
import Order from '../models/Order.js';
import { enviarCorreoPedido } from '../utils/mailer.js';

const router = express.Router();

// Obtener todos los pedidos
router.get('/', async (req, res) => {
  const orders = await Order.find();
  res.json(orders);
});

// Agregar un pedido
router.post('/', async (req, res) => {
  try {
    const { productos, total, estado } = req.body;
    const order = new Order({ productos, total, estado });
    await order.save();
    // Enviar correo de pedido
    try {
      await enviarCorreoPedido(order);
    } catch (mailErr) {
      console.error('Error enviando correo de pedido:', mailErr);
    }
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Editar pedido
router.put('/:id', async (req, res) => {
  try {
    const { productos, total, estado } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { productos, total, estado }, { new: true });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar pedido
router.delete('/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pedido eliminado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { sendOrderNotificationEmail } = require('../utils/mailer');

// GET todos los pedidos
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ fecha: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST crear un nuevo pedido
router.post('/', async (req, res) => {
    const { productos, total, tipoEntrega, cliente } = req.body;

    const order = new Order({
        productos,
        total,
        tipoEntrega,
        estado: req.body.estado || 'Pendiente',
        cliente
    });

    try {
        const newOrder = await order.save();

        // Enviar correo de notificación
        try {
            await sendOrderNotificationEmail(newOrder);
            console.log(`Correo de notificación enviado para el pedido ${newOrder._id}`);
        } catch (emailError) {
            console.error(`Error al enviar correo para el pedido ${newOrder._id}:`, emailError);
            // No detenemos la respuesta al cliente por un error de email
        }

        res.status(201).json(newOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT actualizar el estado de un pedido
router.put('/:id', async (req, res) => {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { estado: req.body.estado },
            { new: true }
        );
        if (!updatedOrder) return res.status(404).json({ message: 'Pedido no encontrado' });
        res.json(updatedOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


module.exports = router;
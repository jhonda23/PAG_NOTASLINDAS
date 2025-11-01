// routes/orders.js
import express from 'express';
import Order from '../models/Order.js';
import { sendOrderNotificationEmail } from '../utils/mailer.js';

const router = express.Router();

// --- Obtener todos los pedidos ---
router.get('/', async (req, res) => {
  try {
    // Ordenar por fecha de creación descendente (más recientes primero)
    const orders = await Order.find().sort({ createdAt: -1 });
    console.log(`📦 Pedidos cargados: ${orders.length}, más recientes primero`);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener pedidos', error });
  }
});

// --- Crear un pedido nuevo ---
router.post('/', async (req, res) => {
  try {
    const nuevaOrden = new Order(req.body);
    const guardada = await nuevaOrden.save();

    // Notificar por correo (si está configurado)
    try {
      await sendOrderNotificationEmail(guardada);
    } catch (err) {
      console.warn('No se pudo enviar correo de notificación:', err.message);
    }

    res.status(201).json(guardada);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear pedido', error });
  }
});

// --- ⚠️ NUEVO: Actualizar estado de pedido ---
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    console.log('🔄 Actualizando pedido:', id, '->', estado);

    // Validar que el estado esté en los enum permitidos
    const estadosPermitidos = ['Pendiente', 'Pendiente de Recoger', 'Procesado', 'Pagado', 'Enviado', 'Completado', 'Cancelado', 'Rechazado'];
    
    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({ 
        message: 'Estado no válido', 
        estadosPermitidos 
      });
    }

    const pedidoActualizado = await Order.findByIdAndUpdate(
      id, 
      { estado }, 
      { new: true, runValidators: true }
    );

    if (!pedidoActualizado) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    console.log('✅ Pedido actualizado:', pedidoActualizado.estado);
    res.json(pedidoActualizado);
  } catch (error) {
    console.error('❌ Error actualizando pedido:', error);
    res.status(500).json({ message: 'Error al actualizar pedido', error: error.message });
  }
});

// --- NUEVO: marcar pedido como finalizado ---
router.patch('/:id/finalizar', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔄 Finalizando pedido:', id);
    
    const pedido = await Order.findById(id);
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Actualizar estado a Finalizado
    pedido.estado = 'Finalizado';
    await pedido.save();

    console.log('✅ Pedido finalizado:', pedido._id);
    res.json({ message: 'Pedido finalizado correctamente', pedido });
  } catch (error) {
    console.error('❌ Error finalizando pedido:', error);
    res.status(500).json({ message: 'Error al finalizar pedido', error: error.message });
  }
});

// --- estadísticas de pedidos ---
router.get('/stats', async (req, res) => {
  try {
    const total = await Order.countDocuments();
    const pendientes = await Order.countDocuments({
      estado: { $regex: /pendiente/i },
    });
    res.json({ total, pendientes });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas de pedidos', error });
  }
});

export default router;
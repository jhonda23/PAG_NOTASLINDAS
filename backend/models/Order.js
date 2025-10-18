import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  productos: [{
    id: { type: String, required: true },
    nombre: { type: String, required: true },
    cantidad: { type: Number, required: true },
    precio: { type: Number, required: true },
    imagen: String
  }],
  total: Number,
  estado: { 
    type: String, 
    default: 'Pendiente',
    enum: ['Pendiente', 'Pendiente de Recoger', 'Procesado', 'Pagado', 'Enviado', 'Completado', 'Cancelado', 'Rechazado']
  },
  fecha: { type: Date, default: Date.now },
  tipoEntrega: String,
  cliente: {
    nombre: String,
    telefono: String,
    email: String,
    direccion: String
  },
  transactionId: String // Para guardar el ID de la transacción de Wompi
});

export default mongoose.model('Order', orderSchema);
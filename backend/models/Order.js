import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  productos: [
    {
      nombre: String,
      cantidad: Number,
      precio: Number
    }
  ],
  total: Number,
  estado: { type: String, default: 'pendiente' },
  fecha: { type: Date, default: Date.now }
});

export default mongoose.model('Order', orderSchema);
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },
  categoria: { type: String, required: true },
  stock: { type: Number, required: true },
  descripcion: { type: String },
  imagen: { type: String },
  fechaCreacion: { type: Date, default: Date.now }
});

export default mongoose.model('Product', productSchema);
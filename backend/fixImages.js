// backend/fixImages.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

async function fixProductImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('🟢 Conectado a MongoDB. Corrigiendo imágenes...');

    const productos = await Product.find();
    let corregidos = 0;

    for (const p of productos) {
      if (p.imagen && p.imagen.includes('/backend/uploads/')) {
        // Corregir rutas incorrectas
        p.imagen = p.imagen.replace('/backend/uploads/', '/uploads/');
        await p.save();
        corregidos++;
        console.log(`✅ Corregido: ${p.nombre} -> ${p.imagen}`);
      }
    }

    console.log(`✅ Proceso completado. Se corrigieron ${corregidos} productos.`);
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error al corregir imágenes:', error);
    mongoose.connection.close();
  }
}

fixProductImages();
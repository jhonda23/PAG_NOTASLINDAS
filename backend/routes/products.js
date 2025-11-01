// routes/products.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import Product from '../models/Product.js';

const router = express.Router();

// --- Configuración de subida de imágenes ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Asegurar nombre único
    const uniqueName = `${Date.now()}${path.extname(file.originalname)}`;
    console.log('📸 Guardando imagen:', uniqueName);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Verificar que sea imagen
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  }
});

// ⚠️ CRÍTICO: Rutas específicas PRIMERO

// --- ESTADÍSTICAS ---
router.get('/stats', async (req, res) => {
  try {
    const total = await Product.countDocuments();
    const agotados = await Product.countDocuments({ stock: 0 });
    res.json({ total, agotados });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
});

// --- Obtener todos los productos ---
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ fechaCreacion: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
});

// --- Agregar producto nuevo ---
router.post('/', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, precio, categoria, stock, descripcion } = req.body;
    
    // 
    const imagen = req.file ? `/uploads/${req.file.filename}` : '';

    console.log('📸 Imagen subida:', {
      filename: req.file?.filename,
      path: imagen,
      body: req.body
    });

    const nuevoProducto = new Product({
      nombre,
      precio,
      categoria,
      stock,
      descripcion,
      imagen
    });

    const guardado = await nuevoProducto.save();
    
    console.log('✅ Producto guardado en BD:', {
      id: guardado._id,
      imagen: guardado.imagen
    });
    
    res.json(guardado);
  } catch (error) {
    console.error('❌ Error agregando producto:', error);
    res.status(500).json({ message: 'Error al agregar producto', error: error.message });
  }
});

// --- ⚠️ TOGGLE-STOCK debe ir ANTES de /:id ---
router.patch('/:id/toggle-stock', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔄 Toggle stock para ID:', id);
    
    const producto = await Product.findById(id);
    
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const stockAnterior = producto.stock;
    producto.stock = producto.stock > 0 ? 0 : 1;
    await producto.save();

    console.log(`✅ Stock cambiado: ${stockAnterior} → ${producto.stock}`);

    res.json({ message: 'Estado de stock actualizado', producto });
  } catch (error) {
    console.error('❌ Error en toggle-stock:', error);
    res.status(500).json({ message: 'Error al cambiar estado de stock', error: error.message });
  }
});

// --- Editar producto ---
router.put('/:id', upload.single('imagen'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, categoria, stock, descripcion } = req.body;

    const updateData = { nombre, precio, categoria, stock, descripcion };
    
    // ❌ CORREGIR: estaba /backend/uploads/ debería ser /uploads/
    if (req.file) updateData.imagen = `/uploads/${req.file.filename}`;

    console.log('📝 Actualizando producto:', id, updateData);

    const productoActualizado = await Product.findByIdAndUpdate(id, updateData, { new: true });
    if (!productoActualizado) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(productoActualizado);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar producto', error: error.message });
  }
});

// --- Eliminar producto ---
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Product.findByIdAndDelete(id);
    
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar producto', error: error.message });
  }
});

export default router;
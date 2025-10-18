import express from 'express';
import multer from 'multer';
import Product from '../models/Product.js';
import path from 'path';

const router = express.Router();

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Obtener todos los productos
router.get('/', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Agregar un producto
router.post('/', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, precio, categoria, stock, descripcion } = req.body;
    const imagen = req.file ? `/uploads/${req.file.filename}` : '';
    const product = new Product({ nombre, precio, categoria, stock, descripcion, imagen });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Editar producto
router.put('/:id', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, precio, categoria, stock, descripcion } = req.body;
    const update = { nombre, precio, categoria, stock, descripcion };
    if (req.file) {
      update.imagen = `/uploads/${req.file.filename}`;
    }
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar producto
router.delete('/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Dar like a un producto
router.post('/:id/like', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    product.likes = (product.likes || 0) + 1;
    await product.save();
    res.json({ likes: product.likes });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

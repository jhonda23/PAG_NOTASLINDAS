import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';

dotenv.config();

const app = express();

// Para usar __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración CORS mejorada
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));

app.use(express.json());

// ⚠️ CONFIGURACIÓN CRÍTICA: Servir uploads como archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware de logging para debugging
app.use('/uploads', (req, res, next) => {
    console.log('📁 Solicitud de archivo estático:', req.method, req.url);
    next();
});

// Middleware para verificar que uploads existe
app.use((req, res, next) => {
    if (req.url.startsWith('/uploads')) {
        console.log('🔍 Ruta uploads detectada:', req.url);
    }
    next();
});

const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ MongoDB conectado');
}).catch(err => {
    console.error('❌ Error conectando a MongoDB:', err);
});

// Rutas API
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

// Ruta de health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        uploadsPath: path.join(__dirname, 'uploads'),
        files: 'N/A' // Podrías listar archivos aquí para debugging
    });
});

// Ruta para listar archivos en uploads (solo para desarrollo)
app.get('/debug-uploads', (req, res) => {
    const fs = require('fs');
    try {
        const files = fs.readdirSync(path.join(__dirname, 'uploads'));
        res.json({ files });
    } catch (error) {
        res.json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('API de Notas Lindas funcionando');
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📁 Ruta de uploads: ${path.join(__dirname, 'uploads')}`);
    console.log(`🌐 URL de imágenes: http://localhost:${PORT}/uploads/`);
});
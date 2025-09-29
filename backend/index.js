import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB conectado');
}).catch(err => {
  console.error('Error conectando a MongoDB:', err);
});

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

app.get('/', (req, res) => {
  res.send('API de Notas Lindas funcionando');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
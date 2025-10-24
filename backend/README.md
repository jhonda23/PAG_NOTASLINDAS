# 🛍️ NOTAS LINDAS - Backend

Backend del sistema de e-commerce Notas Lindas (Kawai Store)

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecución](#ejecución)
- [API Endpoints](#api-endpoints)
- [Despliegue](#despliegue)

---

## 🔧 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (v18 o superior) - [Descargar aquí](https://nodejs.org/)
- **MongoDB** (v5 o superior) - [Descargar aquí](https://www.mongodb.com/try/download/community)
- **Git** - [Descargar aquí](https://git-scm.com/)

---

## 📦 Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd "NOTAS LINDAS/backend"
```

### 2. Instalar dependencias

```bash
npm install
```

---

## ⚙️ Configuración

### 1. Crear archivo de variables de entorno

Copia el archivo de plantilla y renómbralo:

```bash
# En Windows
copy .env.dist .env

# En Linux/Mac
cp .env.dist .env
```

### 2. Configurar las variables de entorno

Abre el archivo `.env` y configura las siguientes variables:

#### **Base de Datos (MongoDB)**

```env
MONGODB_URI=mongodb://localhost:27017/notaslindas
```

Para MongoDB Atlas (producción):
```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/notaslindas
```

#### **Puerto del Servidor**

```env
PORT=4000
```

#### **Email (Gmail)**

Para enviar notificaciones de pedidos:

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. **Seguridad** > **Verificación en dos pasos** (debe estar activada)
3. **Contraseñas de aplicaciones**
4. Genera una contraseña para "Correo"
5. Usa esa contraseña en tu archivo `.env`

```env
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion
```

⚠️ **IMPORTANTE**: NO uses tu contraseña normal de Gmail, usa una **contraseña de aplicación**.

#### **Wompi (Pagos Online) - OPCIONAL**

Si vas a usar pagos en línea con Wompi:

1. Regístrate en https://comercios.wompi.co
2. Obtén tus claves en el panel de comercio
3. Configúralas en tu `.env`

```env
WOMPI_PUBLIC_KEY=pub_test_tu_clave_publica
WOMPI_PRIVATE_KEY=prv_test_tu_clave_privada
```

---

## 🚀 Ejecución

### Modo Desarrollo

```bash
npm start
```

El servidor se iniciará en: `http://localhost:4000`

### Verificar que funciona

Abre tu navegador y ve a: `http://localhost:4000`

Deberías ver: **"🚀 API funcionando correctamente"**

---

## 📡 API Endpoints

### Productos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/products` | Obtener todos los productos |
| GET | `/api/products/tendencias` | Top 10 productos por likes |
| POST | `/api/products` | Crear nuevo producto |
| PUT | `/api/products/:id` | Actualizar producto |
| DELETE | `/api/products/:id` | Eliminar producto |
| POST | `/api/products/:id/like` | Dar like a un producto |

### Pedidos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/orders` | Obtener todos los pedidos |
| POST | `/api/orders` | Crear nuevo pedido |
| PUT | `/api/orders/:id` | Actualizar pedido |
| DELETE | `/api/orders/:id` | Eliminar pedido |

### Pagos (Wompi)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/payments/create-wompi-transaction` | Crear transacción de pago |

---

## 📝 Estructura del Proyecto

```
backend/
├── models/          # Modelos de Mongoose
│   ├── Product.js   # Esquema de productos
│   └── Order.js     # Esquema de pedidos
├── routes/          # Rutas de la API
│   ├── products.js  # Endpoints de productos
│   ├── orders.js    # Endpoints de pedidos
│   └── payments.js  # Endpoints de pagos
├── utils/           # Utilidades
│   └── mailer.js    # Configuración de envío de correos
├── uploads/         # Imágenes subidas
├── .env.dist        # Plantilla de configuración
├── .env             # Configuración real (NO subir a Git)
├── index.js         # Punto de entrada
└── package.json     # Dependencias
```

---

## 🔒 Seguridad

### Variables de Entorno

- ✅ El archivo `.env` está en `.gitignore` y NO se sube a GitHub
- ✅ Usa `.env.dist` como plantilla para otros desarrolladores
- ⚠️ **NUNCA** compartas tu archivo `.env` con nadie
- ⚠️ **NUNCA** subas credenciales reales a repositorios públicos

### Credenciales de Gmail

- Usa **contraseñas de aplicación**, no tu contraseña normal
- Activa la **verificación en dos pasos** en tu cuenta de Google
- Revoca las contraseñas de aplicación que no uses

---

## 🌐 Despliegue

### Preparación para Producción

1. **Actualiza las variables de entorno:**
   - Usa MongoDB Atlas para la base de datos
   - Configura un servidor SMTP profesional
   - Usa claves de producción de Wompi

2. **Configuración de CORS:**
   Actualiza `index.js` con los dominios permitidos:
   ```javascript
   const allowedOrigins = [
     'https://tu-dominio.com',
     'https://www.tu-dominio.com'
   ];
   ```

3. **Variables de entorno en producción:**
   Configura las variables en tu plataforma de hosting (Heroku, Vercel, Railway, etc.)

### Plataformas Recomendadas

- **Backend**: Railway, Render, Heroku
- **Base de Datos**: MongoDB Atlas (gratuito hasta 512MB)
- **Frontend**: Vercel, Netlify, GitHub Pages

---

## 🤝 Contribuir

Si quieres contribuir al proyecto:

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

---

## 📧 Soporte

Si tienes problemas o preguntas:

- Revisa la documentación
- Verifica que todas las variables de entorno estén configuradas
- Asegúrate de que MongoDB esté corriendo
- Revisa los logs del servidor

---

## 📄 Licencia

Este proyecto es privado y está bajo la licencia de Notas Lindas.

---

💕 **Notas Lindas - Kawai Store**

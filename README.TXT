🎀 NOTAS LINDAS - TIENDA ONLINE 🎀
====================================

¡Tu tienda de papelería y detalles está lista!

📁 ESTRUCTURA DEL PROYECTO:
notas-lindas-tienda/
├── 📄 index.html          (Página principal de la tienda)
├── 📄 admin.html          (Panel de control administrativo)
├── 📁 css/
│   ├── style.css          (Estilos de la tienda)
│   └── admin.css          (Estilos del panel admin)
├── 📁 js/
│   ├── firebase-config.js (Configuración de Firebase)
│   ├── app.js             (Funciones de la tienda)
│   └── admin.js           (Funciones del panel admin)
├── 📁 images/             (Imágenes de productos)
└── 📄 README.txt          (Este archivo)

🚀 CONFIGURACIÓN INICIAL:
1. CONFIGURAR FIREBASE:
   - Ve a https://console.firebase.google.com
   - Crea un nuevo proyecto: "notas-lindas"
   - Activa: Authentication, Firestore, Storage
   - Copia tu configuración y pégala en js/firebase-config.js

2. DATOS DE ACCESO DEMO:
   Panel Admin: admin@notaslindas.com / Admin12345

🛍️ FUNCIONALIDADES DE LA TIENDA:
✅ Catálogo de productos con filtros
✅ Carrito de compras con cantidades
✅ Diseño responsive rosa profesional
✅ Pedidos que llegan por email
✅ Integración con redes sociales

⚙️ PANEL ADMINISTRATIVO:
✅ Login seguro
✅ Agregar/editar/eliminar productos
✅ Gestionar stock y precios
✅ Ver y procesar pedidos
✅ Subir imágenes de productos

🌐 CÓMO PONERLA EN INTERNET:
1. FIREBASE HOSTING (Recomendado):
   - Ejecuta: npm install -g firebase-tools
   - Ejecuta: firebase init hosting
   - Ejecuta: firebase deploy

2. NETLIFY (Más fácil):
   - Ve a https://netlify.com
   - Arrastra la carpeta completa
   - ¡Listo!

3. GITHUB PAGES:
   - Sube el código a GitHub
   - Ve a Settings > Pages
   - Selecciona la rama main

📧 CONFIGURACIÓN DE EMAILS:
Para recibir pedidos por email, configura EmailJS:
1. Regístrate en https://emailjs.com
2. Crea un servicio de email
3. Configura las credenciales en js/app.js

🎨 PERSONALIZACIÓN:
- Colores: Edita los colores en css/style.css
- Logo: Reemplaza images/logo.png
- Productos: Usa el panel admin para agregar productos reales

📞 SOPORTE:
Si tienes problemas con la configuración, contacta para ayuda.

¡Tu tienda online está lista para funcionar! 🎉
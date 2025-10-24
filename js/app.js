import { API_BASE_URL } from './api-config.js';
let productos = [];
let carrito = [];
let filtroActual = 'all';
let terminoBusqueda = '';

// Elementos del DOM
const productsGrid = document.getElementById('productsGrid');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.querySelector('.cart-count');
const cartSidebar = document.getElementById('cartSidebar');
const cartToggle = document.getElementById('cartToggle');
const closeCart = document.getElementById('closeCart');
const pickupBtn = document.getElementById('pickupBtn');
const pickupModal = document.getElementById('pickupModal');
const closePickupModal = document.getElementById('closePickupModal');
const pickupForm = document.getElementById('pickupForm');
const onlinePaymentModal = document.getElementById('onlinePaymentModal');
const closeOnlinePaymentModal = document.getElementById('closeOnlinePaymentModal');
const onlinePaymentForm = document.getElementById('onlinePaymentForm');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    cargarProductos();
    inicializarEventos();
    cargarCarritoDesdeLocalStorage();
});

// Cargar productos desde la API REST
async function cargarProductos() {
    try {
        const res = await fetch(`${API_BASE_URL}/products`);
        const data = await res.json();
        productos = data.map(p => ({
            ...p,
            id: p._id,
            imagen: p.imagen && p.imagen.startsWith('/uploads/') ? `http://localhost:4000${p.imagen}` : p.imagen
        }));
        mostrarProductos();
    } catch (error) {
        console.error('Error cargando productos:', error);
        mostrarProductosDemo(); // Productos de demostración
    }
}

// Mostrar productos en el grid
function mostrarProductos() {
    const productosFiltrados = filtrarProductos();
    
    productsGrid.innerHTML = '';
    
    productosFiltrados.forEach(producto => {
        const productCard = crearProductCard(producto);
        productsGrid.appendChild(productCard);
    });
}

// Filtrar productos según categoría
function filtrarProductos() {
    let productosFiltrados = productos;

    // 1. Filtrar por categoría
    if (filtroActual !== 'all') {
        productosFiltrados = productosFiltrados.filter(producto => producto.categoria === filtroActual);
    }

    // 2. Filtrar por término de búsqueda
    if (terminoBusqueda) {
        productosFiltrados = productosFiltrados.filter(producto => 
            producto.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase())
        );
    }

    return productosFiltrados;
}

// Crear tarjeta de producto
function crearProductCard(producto) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <img src="${producto.imagen || 'images/placeholder.jpg'}" 
             alt="${producto.nombre}" 
             class="product-image"
             onerror="this.src='images/placeholder.jpg'">
        <h3 class="product-title">${producto.nombre}</h3>
        <p class="product-price">$${producto.precio}</p>
        <p class="product-stock ${producto.stock === 0 ? 'stock-out' : ''}">
            ${producto.stock === 0 ? 'Agotado' : `Stock: ${producto.stock}`}
        </p>
        <button class="add-to-cart" 
                data-id="${producto.id}"
                ${producto.stock === 0 ? 'disabled' : ''}>
            ${producto.stock === 0 ? 'Agotado' : 'Agregar al Carrito'}
        </button>
    `;
    // Asignar evento al botón
    card.querySelector('.add-to-cart').addEventListener('click', function() {
        agregarAlCarrito(producto.id);
    });

    // Evento de doble clic para dar "like"
    card.addEventListener('dblclick', function() {
        darLike(producto.id, card);
    });
    return card;
}

// Productos de demostración (si Firebase falla)
function mostrarProductosDemo() {
    productos = [
        {
            id: '1',
            nombre: 'Cuaderno Decorado',
            precio: 15000,
            categoria: 'papeleria',
            stock: 10,
            imagen: 'images/placeholder.jpg'
        },
        {
            id: '2', 
            nombre: 'Set de Stickers',
            precio: 8000,
            categoria: 'papeleria',
            stock: 15,
            imagen: 'images/placeholder.jpg'
        },
        {
            id: '3',
            nombre: 'Taza Personalizada',
            precio: 25000,
            categoria: 'detalles',
            stock: 5,
            imagen: 'images/placeholder.jpg'
        },
        {
            id: '4',
            nombre: 'Caja Sorpresa',
            precio: 35000,
            categoria: 'detalles',
            stock: 8,
            imagen: 'images/placeholder.jpg'
        }
    ];
    mostrarProductos();
}

// Inicializar eventos
function inicializarEventos() {
    // Filtros
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtroActual = btn.dataset.filter;
            mostrarProductos();
        });
    });

    // Búsqueda
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Evita que la página se recargue
        terminoBusqueda = searchInput.value.trim();
        mostrarProductos();
    });

    searchInput.addEventListener('input', () => {
        terminoBusqueda = searchInput.value.trim();
        mostrarProductos();
    });

    // Carrito
    cartToggle.addEventListener('click', toggleCarrito);
    closeCart.addEventListener('click', toggleCarrito);
    
    // Botón para Pagar en Punto Físico
    pickupBtn.addEventListener('click', abrirModalRecoger);
    closePickupModal.addEventListener('click', cerrarModalRecoger);
    pickupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        finalizarPedidoRecoger();
    });

    // Botón para Pagar Online
    const payBtn = document.getElementById('payBtn');
    if (payBtn) {
        payBtn.addEventListener('click', abrirModalPagoOnline);
    }
    closeOnlinePaymentModal.addEventListener('click', cerrarModalPagoOnline);
    onlinePaymentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        procesarPagoOnline();
    });

    // Delegación de eventos para los botones del carrito
    cartItems.addEventListener('click', handleCartActions);
}

// Funciones del Carrito
function agregarAlCarrito(productoId) {
    const producto = productos.find(p => p.id === productoId);
    if (!producto || producto.stock === 0) return;

    const itemExistente = carrito.find(item => item.id === productoId);
    
    if (itemExistente) {
        if (itemExistente.cantidad < producto.stock) {
            itemExistente.cantidad++;
        } else {
            alert('No hay suficiente stock disponible');
            return;
        }
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
            imagen: producto.imagen
        });
    }
    
    actualizarCarrito();
    guardarCarritoEnLocalStorage();
    mostrarNotificacion(`${producto.nombre} agregado al carrito`);
}

function actualizarCarrito() {
    cartItems.innerHTML = '';
    let total = 0;
    let totalItems = 0;

    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        totalItems += item.cantidad;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info" style="display:flex;align-items:center;gap:10px;">
                <img src="${item.imagen || 'images/placeholder.jpg'}" alt="${item.nombre}" style="width:40px;height:40px;object-fit:cover;border-radius:8px;">
                <div>
                    <h4 style="margin:0 0 2px 0;">${item.nombre}</h4>
                    <p style="margin:0;font-size:0.97em;">$${item.precio} x ${item.cantidad}</p>
                    <p style="margin:0;font-size:0.97em;">Subtotal: $${subtotal}</p>
                </div>
            </div>
            <div class="cart-item-controls">
                <button class="quantity-btn" data-id="${item.id}" data-action="decrease">-</button>
                <span>${item.cantidad}</span>
                <button class="quantity-btn" data-id="${item.id}" data-action="increase">+</button>
                <button class="quantity-btn remove-btn" data-id="${item.id}" data-action="remove">🗑️</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });

    cartTotal.textContent = total;
    cartCount.textContent = totalItems;
}

function handleCartActions(e) {
    const target = e.target;
    if (!target.classList.contains('quantity-btn')) return;

    const id = target.dataset.id;
    const action = target.dataset.action;

    if (action === 'increase') {
        modificarCantidad(id, 1);
    } else if (action === 'decrease') {
        modificarCantidad(id, -1);
    } else if (action === 'remove') {
        eliminarDelCarrito(id);
    }
}

function modificarCantidad(productoId, cambio, ) {
    const item = carrito.find(item => item.id === productoId);
    if (!item) return;

    const producto = productos.find(p => p.id === productoId);
    const nuevaCantidad = item.cantidad + cambio;

    if (nuevaCantidad < 1) {
        eliminarDelCarrito(productoId, true); // No mostrar notificación doble
        return;
    }

    if (nuevaCantidad > producto.stock) {
        mostrarNotificacion('⚠️ No hay suficiente stock disponible', 'warning');
        return;
    }

    item.cantidad = nuevaCantidad;
    actualizarCarrito();
    guardarCarritoEnLocalStorage();
}

function eliminarDelCarrito(productoId, silent = false) {
    const itemIndex = carrito.findIndex(item => item.id === productoId);
    if (itemIndex === -1) return;
    const [removedItem] = carrito.splice(itemIndex, 1);
    carrito = carrito.filter(item => item.id !== productoId);
    actualizarCarrito();
    guardarCarritoEnLocalStorage();
    if (!silent) mostrarNotificacion(`🗑️ ${removedItem.nombre} eliminado del carrito`, 'info');
}

function toggleCarrito() {
    cartSidebar.classList.toggle('active');
    document.body.classList.toggle('no-scroll');
}

// --- Flujo de Pedido para Recoger en Tienda ---

function abrirModalRecoger() {
    if (carrito.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }
    // Llenar resumen en el modal
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    document.getElementById('pickupSummary').innerHTML = `
        <p><strong>Total a pagar en tienda:</strong> ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(total)}</p>
    `;
    pickupModal.style.display = 'flex';
}

function cerrarModalRecoger() {
    pickupModal.style.display = 'none';
}

async function finalizarPedidoRecoger() {
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    const cliente = {
        nombre: document.getElementById('pickupName').value,
        telefono: document.getElementById('pickupPhone').value
    };

    if (!cliente.nombre || !cliente.telefono) {
        mostrarNotificacion('Por favor, completa tu nombre y teléfono.', 'warning');
        return;
    }

    const pedidoData = {
        productos: carrito.map(({ id, nombre, precio, cantidad, imagen }) => ({ id, nombre, precio, cantidad, imagen })),
        total: total,
        estado: 'Pendiente de Recoger',
        tipoEntrega: 'recoger_en_tienda',
        cliente: cliente
    };

    try {
        const res = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pedidoData)
        });
        if (!res.ok) throw new Error('Error al guardar el pedido');

        // Crear resumen para la alerta
        const resumenPedido = carrito.map(item => 
            `- ${item.nombre} (x${item.cantidad})`
        ).join('\n');

        mostrarNotificacion(`✅ ¡Pedido procesado con éxito! Revisa tu WhatsApp para la confirmación.`, 'success', 5000);

        // Limpiar y cerrar todo
        carrito = [];
        actualizarCarrito();
        guardarCarritoEnLocalStorage();
        cerrarModalRecoger();
        pickupForm.reset();

    } catch (error) {
        console.error('Error al finalizar pedido:', error);
        alert('Error al procesar el pedido. Intenta nuevamente.');
    }
}

// --- Flujo de Pago Online ---

function abrirModalPagoOnline() {
    if (carrito.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }
    onlinePaymentModal.style.display = 'flex';
}

function cerrarModalPagoOnline() {
    onlinePaymentModal.style.display = 'none';
}

async function procesarPagoOnline() {
    const payBtn = document.getElementById('confirmPayBtn');
    payBtn.disabled = true;
    payBtn.textContent = 'Procesando...';

    const cliente = {
        nombre: document.getElementById('onlineName').value,
        email: document.getElementById('onlineEmail').value,
        telefono: document.getElementById('onlinePhone').value,
    };

    const total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

    const pedidoData = {
        productos: carrito.map(({ id, nombre, precio, cantidad, imagen }) => ({ id, nombre, precio, cantidad, imagen })),
        total,
        ...cliente
    };

    try {
        const res = await fetch(`${API_BASE_URL}/payments/create-wompi-transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pedidoData)
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Error al crear la transacción');
        }

        const { transactionData, publicKey, reference, amountInCents } = await res.json();

        // Limpiar carrito después de crear la transacción
        localStorage.removeItem('notasLindasCarrito');

        // Abrir el widget de Wompi
        const checkout = new WidgetCheckout({
            currency: 'COP',
            amountInCents: amountInCents,
            reference: reference,
            publicKey: publicKey,
            redirectUrl: `http://127.0.0.1:5500/html/payment-result.html`,
        });

        checkout.open(function (result) {
            // El usuario será redirigido por el widget
            // No es necesario hacer nada más aquí
        });

    } catch (error) {
        console.error('Error en el checkout:', error);
        alert('Hubo un problema al procesar tu pago. Por favor, intenta de nuevo.');
        payBtn.disabled = false;
        payBtn.textContent = 'Pagar con Wompi';
    }
}

// Local Storage
function guardarCarritoEnLocalStorage() {
    localStorage.setItem('notasLindasCarrito', JSON.stringify(carrito));
}

function cargarCarritoDesdeLocalStorage() {
    const carritoGuardado = localStorage.getItem('notasLindasCarrito');
    if (carritoGuardado) {
        carrito = JSON.parse(carritoGuardado);
        actualizarCarrito();
    }
}

// Notificaciones
function mostrarNotificacion(mensaje, tipo = 'success', duracion = 3000) {
    const notification = document.createElement('div');
    notification.className = `toast-notification ${tipo}`;
    notification.style.cssText = `
        position: fixed;
        top: 85px;
        right: 20px;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 1002;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    notification.textContent = mensaje;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.4s ease forwards';
        notification.addEventListener('animationend', () => {
            notification.remove();
        });
    }, duracion);
}

// Función para dar "Like" a un producto
async function darLike(productoId, cardElement) {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;

    // 1. Actualización visual inmediata
    producto.likes = (producto.likes || 0) + 1;
    mostrarAnimacionLike(cardElement);

    // 2. Notificar a la página de tendencias vía localStorage
    try {
        const likesData = JSON.parse(localStorage.getItem('notasLindasLikes') || '{}');
        likesData[productoId] = producto.likes;
        localStorage.setItem('notasLindasLikes', JSON.stringify(likesData));
        // Este evento alertará a otras pestañas (como tendencias.html)
        localStorage.setItem('likeActualizado', Date.now().toString());
    } catch (err) {
        console.warn('No se pudo guardar el like localmente:', err);
    }

    // 3. Enviar actualización al backend (sin esperar respuesta)
    try {
        const res = await fetch(`${API_BASE_URL}/products/${productoId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
            const data = await res.json();
            // Actualizar el contador local con la respuesta definitiva del servidor
            producto.likes = data.likes;
        }
    } catch (error) {
        console.error('Error enviando like al backend:', error);
        // Si falla, el like visual se mantiene, pero no se guardará permanentemente en este ciclo.
        // Se podría implementar una lógica de reintento si fuera necesario.
    }
}

// Muestra una animación de corazón sobre el producto
function mostrarAnimacionLike(cardElement) {
    const heart = document.createElement('div');
    heart.textContent = '❤️';
    heart.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 4rem;
        opacity: 0;
        animation: like-animation 0.8s ease-out;
        pointer-events: none; /* Para no interferir con otros clics */
    `;
    cardElement.style.position = 'relative'; // Necesario para el posicionamiento absoluto del corazón
    cardElement.appendChild(heart);
    setTimeout(() => heart.remove(), 800);
}

// Estilos para la notificación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(120%); opacity: 0; }
    }
    
    .no-scroll {
        overflow: hidden;
    }

    @keyframes like-animation {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
        70% { transform: translate(-50%, -80%) scale(1.2); opacity: 0.8; }
        100% { transform: translate(-50%, -100%) scale(1); opacity: 0; }
    }

    .toast-notification.success { background-color: #28a745; }
    .toast-notification.info { background-color: #17a2b8; }
    .toast-notification.warning { background-color: #ffc107; color: #333; }
    .toast-notification.error { background-color: #dc3545; }
`;
document.head.appendChild(style);
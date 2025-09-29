import { API_BASE_URL } from './api-config.js';
let productos = [];
let carrito = [];
let filtroActual = 'all';

// Elementos del DOM
const productsGrid = document.getElementById('productsGrid');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.querySelector('.cart-count');
const cartSidebar = document.getElementById('cartSidebar');
const cartToggle = document.getElementById('cartToggle');
const closeCart = document.getElementById('closeCart');
const checkoutBtn = document.getElementById('checkoutBtn');
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
    if (filtroActual === 'all') return productos;
    return productos.filter(producto => producto.categoria === filtroActual);
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

    // Carrito
    cartToggle.addEventListener('click', toggleCarrito);
    closeCart.addEventListener('click', toggleCarrito);
    
    // Checkout
    checkoutBtn.addEventListener('click', () => finalizarPedido('recoger'));
    const payBtn = document.getElementById('payBtn');
    if (payBtn) {
        payBtn.addEventListener('click', () => finalizarPedido('pagar'));
    }
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
                <button class="quantity-btn" onclick="modificarCantidad('${item.id}', -1)">-</button>
                <span>${item.cantidad}</span>
                <button class="quantity-btn" onclick="modificarCantidad('${item.id}', 1)">+</button>
                <button class="quantity-btn" onclick="eliminarDelCarrito('${item.id}')">🗑️</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });

    cartTotal.textContent = total;
    cartCount.textContent = totalItems;
}

function modificarCantidad(productoId, cambio) {
    const item = carrito.find(item => item.id === productoId);
    if (!item) return;

    const producto = productos.find(p => p.id === productoId);
    const nuevaCantidad = item.cantidad + cambio;

    if (nuevaCantidad < 1) {
        eliminarDelCarrito(productoId);
        return;
    }

    if (nuevaCantidad > producto.stock) {
        alert('No hay suficiente stock disponible');
        return;
    }

    item.cantidad = nuevaCantidad;
    actualizarCarrito();
    guardarCarritoEnLocalStorage();
}

function eliminarDelCarrito(productoId) {
    carrito = carrito.filter(item => item.id !== productoId);
    actualizarCarrito();
    guardarCarritoEnLocalStorage();
}

function toggleCarrito() {
    cartSidebar.classList.toggle('active');
    document.body.classList.toggle('no-scroll');
}

// Finalizar pedido
async function finalizarPedido(tipoEntrega = 'recoger') {
    if (carrito.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }

    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const pedidoData = {
        productos: carrito,
        total: total,
        estado: 'pendiente',
        tipoEntrega: tipoEntrega // recoger o pagar
    };

    try {
        // Guardar pedido en la API REST
        const res = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pedidoData)
        });
        if (!res.ok) throw new Error('Error al guardar el pedido');

        // Enviar email (simulado por ahora)
        enviarEmailPedido(pedidoData);

        // Limpiar carrito
        carrito = [];
        actualizarCarrito();
        guardarCarritoEnLocalStorage();
        toggleCarrito();

        if (tipoEntrega === 'pagar') {
            mostrarNotificacion('¡Pedido realizado! (Simulación de pago: aquí iría integración con pasarela)');
        } else {
            mostrarNotificacion('¡Pedido realizado con éxito! Te contactaremos pronto.');
        }
    } catch (error) {
        console.error('Error al finalizar pedido:', error);
        alert('Error al procesar el pedido. Intenta nuevamente.');
    }
}

// Enviar email del pedido (simulado)
function enviarEmailPedido(pedido) {
    console.log('Enviando email con pedido:', pedido);
    // Aquí integrarías EmailJS o otro servicio
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
function mostrarNotificacion(mensaje) {
    // Crear notificación simple
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1002;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = mensaje;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Estilos para la notificación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .no-scroll {
        overflow: hidden;
    }
`;
document.head.appendChild(style);

// Hacer funciones globales para los botones del carrito
window.modificarCantidad = modificarCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;
import { API_BASE_URL } from './api-config.js';

let adminProducts = [];
let adminOrders = [];

// Elementos del DOM del admin
const loginScreen = document.getElementById('loginScreen');
const adminPanel = document.getElementById('adminPanel');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const productsTableBody = document.getElementById('productsTableBody');
const ordersTableBody = document.getElementById('ordersTableBody');
const addProductForm = document.getElementById('addProductForm');
const editModal = document.getElementById('editModal');
const editProductForm = document.getElementById('editProductForm');
const orderDetailsModal = document.getElementById('orderDetailsModal');

// Inicializar el panel admin
document.addEventListener('DOMContentLoaded', function() {
    document.body.classList.add('js-enabled');
    
    // Pequeño delay para asegurar que el CSS se aplique
    setTimeout(() => {
        if (localStorage.getItem('adminLoggedIn') === 'true') {
            mostrarPanelAdmin();
            cargarDatosAdmin();
        } else {
            mostrarLogin();
        }
        inicializarEventosAdmin();
    }, 50);
});

function mostrarLogin() {
    loginScreen.style.display = 'flex';
    adminPanel.style.display = 'none';
}

function mostrarPanelAdmin() {
    loginScreen.style.display = 'none';
    adminPanel.style.display = 'block';
}

// Inicializar eventos del admin
function inicializarEventosAdmin() {
    // Login
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (email === 'admin@notaslindas.com' && password === 'Admin12345') {
            localStorage.setItem('adminLoggedIn', 'true');
            mostrarPanelAdmin();
            cargarDatosAdmin();
        } else {
            alert('Usuario o contraseña incorrectos');
        }
    });

    // Logout
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('adminLoggedIn');
        mostrarLogin();
        // Limpiar datos al cerrar sesión
        adminProducts = [];
        adminOrders = [];
        productsTableBody.innerHTML = '';
        ordersTableBody.innerHTML = '';
    });

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => cambiarTab(btn.dataset.tab));
    });

    // Forms
    addProductForm.addEventListener('submit', agregarProducto);
    editProductForm.addEventListener('submit', guardarEdicionProducto);

    // Modal
    document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) modal.style.display = 'none';
    }));
    document.querySelector('.btn-cancel').addEventListener('click', () => cerrarModal('editModal'));

    // Preview de imagen
    document.getElementById('productImage').addEventListener('change', previewImage);

    // Delegación de eventos para las tablas
    productsTableBody.addEventListener('click', handleProductsTableActions);
    ordersTableBody.addEventListener('click', handleOrdersTableActions);

    // Cerrar modal al hacer click fuera
    window.addEventListener('click', function(event) {
        if (event.target === editModal) {
            cerrarModal();
        }
    });
}

// Cambiar entre tabs
function cambiarTab(tabName) {
    // Actualizar botones de tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Actualizar contenido de tabs
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Cargar datos del admin
async function cargarDatosAdmin() {
    await cargarProductosAdmin();
    await cargarPedidosAdmin();
    actualizarEstadisticas();
}

// Cargar productos para el admin desde la API
async function cargarProductosAdmin() {
    const loader = document.getElementById('productsLoader');
    const tableContainer = document.getElementById('productsTableContainer');
    if (loader && tableContainer) {
        loader.style.display = 'block';
        tableContainer.style.display = 'none';
    }
    try {
        const res = await fetch(`${API_BASE_URL}/products`);
        if (!res.ok) throw new Error('Error al cargar productos');
        const data = await res.json();
        adminProducts = data.map(p => ({
            ...p,
            id: p._id
        }));
        mostrarProductosAdmin();
    } catch (error) {
        console.error('Error cargando productos:', error);
        adminProducts = [];
        mostrarProductosAdmin();
    } finally {
        if (loader && tableContainer) {
            loader.style.display = 'none';
            tableContainer.style.display = 'block';
        }
    }
}

// Mostrar productos en la tabla del admin
function mostrarProductosAdmin() {
    productsTableBody.innerHTML = '';
    
    adminProducts.forEach(producto => {
        const row = document.createElement('tr');
        // Determinar la URL de la imagen
        let imagenUrl = 'https://via.placeholder.com/60x60?text=No+Image';
        if (producto.imagen) {
            if (producto.imagen.startsWith('/uploads/')) {
                imagenUrl = `http://localhost:4000${producto.imagen}`;
            } else {
                imagenUrl = producto.imagen;
            }
        }
        row.innerHTML = `
            <td class="product-image-cell">
             <img src="${imagenUrl}" 
                 alt="${producto.nombre}"
                 onerror="this.src='https://via.placeholder.com/60x60?text=No+Image'">
            </td>
            <td>${producto.nombre}</td>
            <td>${producto.categoria === 'papeleria' ? 'Papelería' : 'Detalles'}</td>
            <td>${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(producto.precio)}</td>
            <td>${producto.stock}</td>
            <td>
                <span class="status-badge ${Number(producto.stock) > 0 ? 'status-available' : 'status-out'}">
                    ${Number(producto.stock) > 0 ? 'Disponible' : 'Agotado'}
                </span>
            </td>
            <td>
                <button class="btn-action btn-edit" data-id="${producto.id}" title="Editar">✏️</button>
                <button class="btn-action btn-toggle" data-id="${producto.id}" title="Cambiar disponibilidad">
                    ${Number(producto.stock) > 0 ? '⏸️' : '▶️'}
                </button>
                <button class="btn-action btn-delete" data-id="${producto.id}" title="Eliminar">🗑️</button>
            </td>
        `;
        productsTableBody.appendChild(row);
    });
}

// Mostrar pedidos en la tabla del admin
function mostrarPedidosAdmin() {
    ordersTableBody.innerHTML = '';
    adminOrders.forEach(pedido => {
        const productosHtml = pedido.productos.map(p => `
            <div class="order-product-thumbnail" title="${p.nombre} (x${p.cantidad})">
                <img src="${p.imagen || 'https://via.placeholder.com/40'}" alt="${p.nombre}">
                <span class="thumbnail-qty">${p.cantidad}</span>
            </div>
        `).join('');
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(pedido.fecha).toLocaleString()}</td>
            <td><div class="product-thumbnail-container">${productosHtml}</div></td>
            <td>${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(pedido.total)}</td>
            <td>
                <select class="status-select" data-id="${pedido.id}" onchange="actualizarEstadoPedido(this.dataset.id, this.value)">
                    <option value="Pendiente" ${pedido.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="Procesado" ${pedido.estado === 'Procesado' ? 'selected' : ''}>Procesado</option>
                    <option value="Enviado" ${pedido.estado === 'Enviado' ? 'selected' : ''}>Enviado</option>
                    <option value="Completado" ${pedido.estado === 'Completado' ? 'selected' : ''}>Completado</option>
                    <option value="Cancelado" ${pedido.estado === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
                <span class="status-badge status-${pedido.estado?.toLowerCase().replace(/ /g, '-')}">
                    ${pedido.estado || 'N/A'}
                </span>
            </td>
            <td>
                <button class="btn-action btn-view" data-id="${pedido.id}" title="Ver Detalles">
                    👁️
                </button>
            </td>
        `;
        ordersTableBody.appendChild(row);
    });
}

// Delegación de eventos para acciones en tablas
function handleProductsTableActions(e) {
    const target = e.target.closest('.btn-action');
    if (!target) return;

    const id = target.dataset.id;
    if (target.classList.contains('btn-edit')) {
        abrirEditarProducto(id);
    } else if (target.classList.contains('btn-toggle')) {
        toggleDisponibilidad(id);
    } else if (target.classList.contains('btn-delete')) {
        eliminarProducto(id);
    }
}

function handleOrdersTableActions(e) {
    const target = e.target.closest('.btn-action');
    if (!target) return;

    const id = target.dataset.id;
    if (target.classList.contains('btn-view')) {
        verDetallesPedido(id);
    }
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    document.getElementById('totalProducts').textContent = adminProducts.length;
    
    const pedidosPendientes = adminOrders.filter(p => p.estado === 'Pendiente' || p.estado === 'pendiente').length;
    document.getElementById('pendingOrders').textContent = pedidosPendientes;
    
    const productosAgotados = adminProducts.filter(p => p.stock === 0).length;
    document.getElementById('outOfStock').textContent = productosAgotados;
}

// Agregar nuevo producto usando la API
async function agregarProducto(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('productName').value;
    const precio = parseInt(document.getElementById('productPrice').value);
    const categoria = document.getElementById('productCategory').value;
    const stock = parseInt(document.getElementById('productStock').value);
    const descripcion = document.getElementById('productDescription').value;
    const imagenFile = document.getElementById('productImage').files[0];

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('precio', precio);
    formData.append('categoria', categoria);
    formData.append('stock', stock);
    formData.append('descripcion', descripcion);
    
    if (imagenFile) {
        formData.append('imagen', imagenFile);
    }

    try {
        const res = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            body: formData
        });
        
        if (!res.ok) throw new Error('Error al agregar producto');
        
        await cargarProductosAdmin();
        addProductForm.reset();
        document.getElementById('imagePreview').innerHTML = ''; // Limpiar preview
        mostrarNotificacionAdmin('✅ Producto agregado exitosamente!', 'success');
    } catch (error) {
        console.error('Error agregando producto:', error);
        mostrarNotificacionAdmin(`❌ Error: ${error.message}`, 'error');
    }
}

// Preview de imagen
function previewImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('imagePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}

// Abrir modal para editar producto
function abrirEditarProducto(productoId) {
    const producto = adminProducts.find(p => p.id === productoId);
    if (!producto) return;
    
    document.getElementById('editProductId').value = producto.id;
    document.getElementById('editProductName').value = producto.nombre;
    document.getElementById('editProductPrice').value = producto.precio;
    document.getElementById('editProductCategory').value = producto.categoria;
    document.getElementById('editProductStock').value = producto.stock;
    
    editModal.style.display = 'block';
}

// Cerrar un modal por su ID
function cerrarModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Guardar edición de producto usando la API
async function guardarEdicionProducto(e) {
    e.preventDefault();
    
    const productoId = document.getElementById('editProductId').value;
    const nombre = document.getElementById('editProductName').value;
    const precio = parseInt(document.getElementById('editProductPrice').value);
    const categoria = document.getElementById('editProductCategory').value;
    const stock = parseInt(document.getElementById('editProductStock').value);

    try {
        const res = await fetch(`${API_BASE_URL}/products/${productoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, precio, categoria, stock })
        });
        
        if (!res.ok) throw new Error('Error al actualizar producto');
        
        await cargarProductosAdmin();
        cerrarModal('editModal');
        mostrarNotificacionAdmin('✅ Producto actualizado exitosamente!', 'success');
    } catch (error) {
        console.error('Error actualizando producto:', error);
        mostrarNotificacionAdmin(`❌ Error: ${error.message}`, 'error');
    }
}

// Cambiar disponibilidad del producto usando la API
async function toggleDisponibilidad(productoId) {
    const producto = adminProducts.find(p => p.id === productoId);
    if (!producto) return;
    
    const nuevoStock = producto.stock > 0 ? 0 : 1; // Pone en 0 si hay stock, o en 1 si no hay.
    
    try {
        const res = await fetch(`${API_BASE_URL}/products/${productoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: nuevoStock })
        });
        
        if (!res.ok) throw new Error('Error al cambiar disponibilidad');
        
        await cargarProductosAdmin();
        mostrarNotificacionAdmin(`✅ Producto ${nuevoStock > 0 ? 'habilitado' : 'deshabilitado'}`, 'info');
    } catch (error) {
        console.error('Error cambiando disponibilidad:', error);
        mostrarNotificacionAdmin(`❌ Error: ${error.message}`, 'error');
    }
}

// Eliminar producto usando la API
async function eliminarProducto(productoId) {
    const confirmacion = await mostrarConfirmacion('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.');
    if (!confirmacion) return;
    
    try {
        const res = await fetch(`${API_BASE_URL}/products/${productoId}`, {
            method: 'DELETE'
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Error al eliminar producto');
        }
        
        await cargarProductosAdmin();
        actualizarEstadisticas();
        mostrarNotificacionAdmin('🗑️ Producto eliminado exitosamente!', 'success');
    } catch (error) {
        console.error('Error eliminando producto:', error);
        mostrarNotificacionAdmin(`❌ Error: ${error.message}`, 'error');
    }
}

// Actualizar estado de un pedido
async function actualizarEstadoPedido(pedidoId, nuevoEstado) {
    try {
        const res = await fetch(`${API_BASE_URL}/orders/${pedidoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (!res.ok) throw new Error('Error al actualizar el estado del pedido');

        // Actualizar localmente para reflejar el cambio inmediatamente
        const pedidoIndex = adminOrders.findIndex(p => p.id === pedidoId);
        if (pedidoIndex > -1) adminOrders[pedidoIndex].estado = nuevoEstado;
        
        mostrarNotificacionAdmin('✅ Estado del pedido actualizado.', 'success');
    } catch (error) {
        console.error('Error actualizando estado:', error);
        mostrarNotificacionAdmin(`❌ Error: ${error.message}`, 'error');
    }
}

// Ver detalles del pedido
function verDetallesPedido(pedidoId) {
    const pedido = adminOrders.find(p => p.id === pedidoId);
    if (!pedido) return;

    const modalBody = document.getElementById('orderDetailsBody');
    const clienteInfo = pedido.cliente || pedido.clienteInfo;

    const productosHtml = pedido.productos.map(p => `
        <div class="order-item">
            <img src="${p.imagen || 'https://via.placeholder.com/50'}" alt="${p.nombre}">
            <div class="order-item-details">
                <strong>${p.nombre}</strong>
                <span>Cantidad: ${p.cantidad}</span>
                <span>Precio: ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(p.precio)}</span>
            </div>
        </div>
    `).join('');

    modalBody.innerHTML = `
        <h4>Pedido #${pedido.id.slice(-6)}</h4>
        <p><strong>Fecha:</strong> ${new Date(pedido.fecha).toLocaleString()}</p>
        <p><strong>Estado:</strong> ${pedido.estado}</p>
        <p><strong>Total:</strong> ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(pedido.total)}</p>
        
        ${clienteInfo ? `
        <h4>Cliente</h4>
        <p><strong>Nombre:</strong> ${clienteInfo.nombre || 'N/A'}</p>
        <p><strong>Email:</strong> ${clienteInfo.email || 'N/A'}</p>
        <p><strong>Teléfono:</strong> ${clienteInfo.telefono || 'N/A'}</p>
        ` : ''}

        <h4>Productos</h4>
        <div class="order-items-container">${productosHtml}</div>
    `;

    orderDetailsModal.style.display = 'block';
}

// Sistema de Notificaciones para Admin
function mostrarNotificacionAdmin(mensaje, tipo = 'success', duracion = 3000) {
    const container = document.getElementById('notification-container') || createNotifContainer();
    const notif = document.createElement('div');
    notif.className = `admin-notification ${tipo}`;
    notif.textContent = mensaje;
    container.appendChild(notif);

    setTimeout(() => {
        notif.classList.add('fade-out');
        notif.addEventListener('animationend', () => notif.remove());
    }, duracion);
}

function createNotifContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
    return container;
}

// Modal de Confirmación
function mostrarConfirmacion(mensaje) {
    return new Promise(resolve => {
        const container = document.getElementById('confirmation-container') || createConfirmContainer();
        container.innerHTML = `
            <div class="confirm-modal">
                <p>${mensaje}</p>
                <div class="confirm-actions">
                    <button id="confirm-yes">Sí, eliminar</button>
                    <button id="confirm-no">Cancelar</button>
                </div>
            </div>
        `;
        container.style.display = 'flex';

        document.getElementById('confirm-yes').onclick = () => {
            container.style.display = 'none';
            resolve(true);
        };
        document.getElementById('confirm-no').onclick = () => {
            container.style.display = 'none';
            resolve(false);
        };
    });
}

function createConfirmContainer() {
    const container = document.createElement('div');
    container.id = 'confirmation-container';
    container.className = 'modal-overlay';
    document.body.appendChild(container);
    return container;
}

window.actualizarEstadoPedido = actualizarEstadoPedido; // Mantener global para el onchange
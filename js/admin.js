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
    
    const btnCancel = document.querySelector('.btn-cancel');
    if (btnCancel) {
        btnCancel.addEventListener('click', () => cerrarModal('editModal'));
    }

    // Preview de imagen
    const productImageInput = document.getElementById('productImage');
    if (productImageInput) {
        productImageInput.addEventListener('change', previewImage);
    }

    // Delegación de eventos para las tablas
    productsTableBody.addEventListener('click', handleProductsTableActions);
    ordersTableBody.addEventListener('click', handleOrdersTableActions);

    // Cerrar modal al hacer click fuera
    window.addEventListener('click', function(event) {
        if (event.target === editModal) {
            cerrarModal('editModal');
        }
        if (event.target === orderDetailsModal) {
            cerrarModal('orderDetailsModal');
        }
    });
}

// Cambiar entre tabs
function cambiarTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
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
    diagnosticarImagenes(); // ← NUEVA FUNCIÓN DE DIAGNÓSTICO
}

// Función auxiliar para construir URL de imagen correctamente - SIN PLACEHOLDER
function construirUrlImagen(imagenPath, size = 60) {
    try {
        console.log('🖼️ Construyendo URL para imagen:', imagenPath);
        
        // Si no hay imagen, retornar null o cadena vacía
        if (!imagenPath || imagenPath === '' || imagenPath === 'null' || imagenPath === 'undefined') {
            console.log('🖼️ Sin imagen disponible');
            return ''; // Retornar cadena vacía en lugar de placeholder
        }
        
        // Si ya es una URL completa, devolverla tal cual
        if (imagenPath.startsWith('http://') || imagenPath.startsWith('https://')) {
            return imagenPath;
        }
        
        // Limpiar la ruta de la imagen
        let rutaLimpia = String(imagenPath).trim();
        
        // ❌ ELIMINAR CUALQUIER /api/ de la ruta
        rutaLimpia = rutaLimpia.replace(/^\/?api\//, '');
        
        // Asegurar que la ruta empiece con /uploads/
        if (!rutaLimpia.startsWith('/uploads/')) {
            if (rutaLimpia.startsWith('uploads/')) {
                rutaLimpia = `/${rutaLimpia}`;
            } else {
                rutaLimpia = `/uploads/${rutaLimpia}`;
            }
        }
        
        // Construir URL final SIN /api
        const baseUrl = API_BASE_URL.replace('/api', '');
        const urlFinal = `${baseUrl}${rutaLimpia}`;
        
        console.log('🖼️ URL construida final:', urlFinal);
        return urlFinal;
    } catch (error) {
        console.error('❌ Error construyendo URL de imagen:', error);
        return ''; // Retornar cadena vacía en caso de error
    }
}
// Función de diagnóstico para verificar imágenes
async function diagnosticarImagenes() {
    console.log('🔍 DIAGNÓSTICO DE IMÁGENES');
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('URL Base sin /api:', API_BASE_URL.replace('/api', ''));
    
    if (adminProducts.length > 0) {
        adminProducts.forEach((producto, index) => {
            const urlFinal = construirUrlImagen(producto.imagen);
            console.log(`📦 Producto ${index + 1}:`, {
                nombre: producto.nombre,
                imagenEnDB: producto.imagen,
                urlConstruida: urlFinal
            });
            
            // Testear la URL
            testImageLoad(urlFinal, producto.nombre);
        });
    } else {
        console.log('📦 No hay productos cargados');
    }
}

// Función para testear carga de imágenes
function testImageLoad(url, nombre) {
    const img = new Image();
    img.onload = function() {
        console.log(`✅ Imagen cargada: ${nombre}`);
    };
    img.onerror = function() {
        console.log(`❌ Error cargando imagen: ${nombre}`, url);
    };
    img.src = url;
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
        
        console.log('Productos cargados:', data); // Debug
        
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

// Cargar pedidos para el admin desde la API
async function cargarPedidosAdmin() {
    const loader = document.getElementById('ordersLoader');
    const tableContainer = document.getElementById('ordersTableContainer');
    if (loader && tableContainer) {
        loader.style.display = 'block';
        tableContainer.style.display = 'none';
    }
    try {
        const res = await fetch(`${API_BASE_URL}/orders`);
        if (!res.ok) throw new Error('Error al cargar pedidos');
        const data = await res.json();
        
        // Ordenar por fecha descendente (más recientes primero) - redundante por si el backend falla
        adminOrders = data.map(o => ({
            ...o,
            id: o._id,
            fecha: o.createdAt || o.fecha
        })).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // ← ORDENAR EN FRONTEND TAMBIÉN
        
        console.log(`📦 ${adminOrders.length} pedidos cargados, ordenados por fecha descendente`);
        mostrarPedidosAdmin();
    } catch (error) {
        console.error('Error cargando pedidos:', error);
        adminOrders = [];
        mostrarPedidosAdmin();
    } finally {
        if (loader && tableContainer) {
            loader.style.display = 'none';
            tableContainer.style.display = 'block';
        }
    }
}
// Mostrar productos en la tabla del admin - VERSIÓN CORREGIDA
function mostrarProductosAdmin() {
    productsTableBody.innerHTML = '';
    
    if (adminProducts.length === 0) {
        productsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay productos registrados</td></tr>';
        return;
    }
    
    adminProducts.forEach(producto => {
        const imagenUrl = construirUrlImagen(producto.imagen, 60);
        console.log('URL de imagen construida:', imagenUrl, 'desde:', producto.imagen);
        
        const row = document.createElement('tr');
        
        // Si no hay imagen, mostrar un div vacío en lugar de img con error
        const imagenHtml = imagenUrl ? 
            `<img src="${imagenUrl}" 
                  alt="${producto.nombre || 'Producto'}"
                  style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; display: block; margin: 0 auto;"
                  onerror="this.style.display='none';">` :
            `<div style="width: 60px; height: 60px; background: #f5f5f5; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 10px;">Sin img</div>`;
        
        row.innerHTML = `
            <td class="product-image-cell" style="padding: 8px;">
                ${imagenHtml}
            </td>
            <td>${producto.nombre || 'Sin nombre'}</td>
            <td>${producto.categoria === 'papeleria' ? 'Papelería' : producto.categoria === 'detalles' ? 'Detalles' : producto.categoria}</td>
            <td>${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(producto.precio || 0)}</td>
            <td>${producto.stock || 0}</td>
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

// Mostrar pedidos en la tabla del admin - VERSIÓN CORREGIDA
function mostrarPedidosAdmin() {
    ordersTableBody.innerHTML = '';
    
    if (adminOrders.length === 0) {
        ordersTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay pedidos registrados</td></tr>';
        return;
    }
    
    adminOrders.forEach(pedido => {
        console.log('📦 Procesando pedido:', pedido.id, pedido.productos);
        
        let productosHtml = '';
        
        if (pedido.productos && pedido.productos.length > 0) {
            productosHtml = pedido.productos.map(p => {
                // En tu estructura, la imagen está en p.imagen
                const imgSrc = construirUrlImagen(p.imagen, 40);
                const nombreProducto = p.nombre || 'Producto';
                const cantidad = p.cantidad || 1;
                
                // Si no hay imagen, mostrar solo el nombre
                const imagenHtml = imgSrc ? 
                    `<img src="${imgSrc}" 
                         alt="${nombreProducto}" 
                         style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;"
                         onerror="this.style.display='none';">` :
                    `<div style="width: 40px; height: 40px; background: #f5f5f5; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 8px;">Sin img</div>`;
                
                return `
                    <div class="order-product-thumbnail" title="${nombreProducto} (x${cantidad})">
                        ${imagenHtml}
                        <span class="thumbnail-qty">${cantidad}</span>
                    </div>
                `;
            }).join('');
        } else {
            productosHtml = '<div style="color: #999;">Sin productos</div>';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${pedido.fecha ? new Date(pedido.fecha).toLocaleString('es-CO') : 'Fecha no disponible'}</td>
            <td><div class="product-thumbnail-container">${productosHtml}</div></td>
            <td>${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(pedido.total || 0)}</td>
            <td>
                <select class="status-select" data-id="${pedido.id}">
                    <option value="Pendiente" ${pedido.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="Pendiente de Recoger" ${pedido.estado === 'Pendiente de Recoger' ? 'selected' : ''}>Pendiente de Recoger</option>
                    <option value="Procesado" ${pedido.estado === 'Procesado' ? 'selected' : ''}>Procesado</option>
                    <option value="Pagado" ${pedido.estado === 'Pagado' ? 'selected' : ''}>Pagado</option>
                    <option value="Enviado" ${pedido.estado === 'Enviado' ? 'selected' : ''}>Enviado</option>
                    <option value="Completado" ${pedido.estado === 'Completado' ? 'selected' : ''}>Completado</option>
                    <option value="Cancelado" ${pedido.estado === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                    <option value="Rechazado" ${pedido.estado === 'Rechazado' ? 'selected' : ''}>Rechazado</option>
                </select>
                <span class="status-badge status-${(pedido.estado || 'Pendiente').toLowerCase().replace(/ /g, '-')}">
                    ${pedido.estado || 'Pendiente'}
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
    
    // Configurar event listeners para los selects
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', (e) => {
            actualizarEstadoPedido(e.target.dataset.id, e.target.value);
        });
    });
}
    // Configurar event listeners para los selects
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', (e) => {
            actualizarEstadoPedido(e.target.dataset.id, e.target.value);
        });
    });


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
    const totalProductsEl = document.getElementById('totalProducts');
    const pendingOrdersEl = document.getElementById('pendingOrders');
    const outOfStockEl = document.getElementById('outOfStock');
    
    if (totalProductsEl) {
        totalProductsEl.textContent = adminProducts.length;
    }
    
    if (pendingOrdersEl) {
        const pedidosPendientes = adminOrders.filter(p => 
            p.estado === 'Pendiente' || p.estado === 'pendiente'
        ).length;
        pendingOrdersEl.textContent = pedidosPendientes;
    }
    
    if (outOfStockEl) {
        const productosAgotados = adminProducts.filter(p => Number(p.stock) === 0).length;
        outOfStockEl.textContent = productosAgotados;
    }
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
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Error al agregar producto');
        }
        
        await cargarProductosAdmin();
        actualizarEstadisticas();
        addProductForm.reset();
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview) {
            imagePreview.innerHTML = '';
        }
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
    
    if (!preview) return;
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; object-fit: cover; border-radius: 8px;">`;
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
    
    const editDescEl = document.getElementById('editProductDescription');
    if (editDescEl) {
        editDescEl.value = producto.descripcion || '';
    }
    
    editModal.style.display = 'block';
}

// Cerrar un modal por su ID
function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Guardar edición de producto usando la API
async function guardarEdicionProducto(e) {
    e.preventDefault();
    
    const productoId = document.getElementById('editProductId').value;
    const nombre = document.getElementById('editProductName').value;
    const precio = parseInt(document.getElementById('editProductPrice').value);
    const categoria = document.getElementById('editProductCategory').value;
    const stock = parseInt(document.getElementById('editProductStock').value);
    const descripcionEl = document.getElementById('editProductDescription');
    const descripcion = descripcionEl ? descripcionEl.value : '';

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('precio', precio);
    formData.append('categoria', categoria);
    formData.append('stock', stock);
    if (descripcion) {
        formData.append('descripcion', descripcion);
    }

    try {
        const res = await fetch(`${API_BASE_URL}/products/${productoId}`, {
            method: 'PUT',
            body: formData
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Error al actualizar producto');
        }
        
        await cargarProductosAdmin();
        actualizarEstadisticas();
        cerrarModal('editModal');
        mostrarNotificacionAdmin('✅ Producto actualizado exitosamente!', 'success');
    } catch (error) {
        console.error('Error actualizando producto:', error);
        mostrarNotificacionAdmin(`❌ Error: ${error.message}`, 'error');
    }
}

// Cambiar disponibilidad del producto usando el endpoint toggle-stock
async function toggleDisponibilidad(productoId) {
    const producto = adminProducts.find(p => p.id === productoId);
    if (!producto) {
        mostrarNotificacionAdmin('❌ Producto no encontrado', 'error');
        return;
    }
    
    console.log('Alternando disponibilidad para producto:', productoId); // Debug
    
    try {
        const url = `${API_BASE_URL}/products/${productoId}/toggle-stock`;
        console.log('Haciendo petición PATCH a:', url); // Debug
        
        const res = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Respuesta recibida. Status:', res.status); // Debug
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Error del servidor:', errorText); // Debug
            let errorMessage = 'Error al cambiar disponibilidad';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        const data = await res.json();
        console.log('Respuesta exitosa:', data); // Debug
        
        await cargarProductosAdmin();
        actualizarEstadisticas();
        
        const nuevoStock = data.producto?.stock;
        mostrarNotificacionAdmin(
            `✅ Producto ${nuevoStock > 0 ? 'habilitado' : 'deshabilitado'}`, 
            'info'
        );
    } catch (error) {
        console.error('Error completo cambiando disponibilidad:', error);
        mostrarNotificacionAdmin(`❌ Error: ${error.message}`, 'error');
    }
}

// Eliminar producto usando la API
async function eliminarProducto(productoId) {
    const producto = adminProducts.find(p => p.id === productoId);
    const nombreProducto = producto ? producto.nombre : 'este producto';
    
    const confirmacion = await mostrarConfirmacion(
        `¿Estás seguro de que quieres eliminar "${nombreProducto}"?`,
        'Esta acción no se puede deshacer.'
    );
    
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

// Actualizar estado de un pedido - VERSIÓN CORREGIDA
async function actualizarEstadoPedido(pedidoId, nuevoEstado) {
    console.log('🔄 Actualizando estado del pedido:', pedidoId, '->', nuevoEstado);
    
    try {
        let url;
        let method = 'PUT';
        let body = JSON.stringify({ estado: nuevoEstado });
        
        // Si es Finalizado, usar el endpoint específico
        if (nuevoEstado === 'Finalizado') {
            url = `${API_BASE_URL}/orders/${pedidoId}/finalizar`;
            method = 'PATCH';
            body = null; // PATCH no necesita body para este endpoint
        } else {
            url = `${API_BASE_URL}/orders/${pedidoId}`;
        }
        
        console.log('📝 Request:', method, url);
        
        const options = {
            method: method,
            headers: { 
                'Content-Type': 'application/json'
            }
        };
        
        if (body) {
            options.body = body;
        }
        
        const res = await fetch(url, options);

        console.log('📡 Respuesta recibida. Status:', res.status);
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error('❌ Error del servidor:', errorText);
            
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.message || `Error ${res.status}`);
            } catch (e) {
                throw new Error(`Error ${res.status}: ${errorText.substring(0, 100)}`);
            }
        }

        const responseData = await res.json();
        console.log('✅ Pedido actualizado:', responseData);

        // Actualizar el estado localmente
        const pedidoIndex = adminOrders.findIndex(p => p.id === pedidoId);
        if (pedidoIndex > -1) {
            adminOrders[pedidoIndex].estado = nuevoEstado;
        }
        
        // Actualizar la tabla
        mostrarPedidosAdmin();
        actualizarEstadisticas();
        mostrarNotificacionAdmin('✅ Estado del pedido actualizado.', 'success');
        
    } catch (error) {
        console.error('❌ Error actualizando estado:', error);
        mostrarNotificacionAdmin(`❌ Error: ${error.message}`, 'error');
        
        // Recargar pedidos para sincronizar
        await cargarPedidosAdmin();
    }
}
// Ver detalles del pedido -
function verDetallesPedido(pedidoId) {
    const pedido = adminOrders.find(p => p.id === pedidoId);
    if (!pedido) return;

    const modalBody = document.getElementById('orderDetailsBody');
    const clienteInfo = pedido.cliente;

    const productosHtml = pedido.productos.map(p => {
        const imgSrc = construirUrlImagen(p.imagen, 50);
        const nombreProducto = p.nombre || 'Producto';
        const cantidad = p.cantidad || 1;
        const precio = p.precio || 0;
        
        // Si no hay imagen, mostrar solo el nombre
        const imagenHtml = imgSrc ? 
            `<img src="${imgSrc}" 
                 alt="${nombreProducto}" 
                 style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"
                 onerror="this.style.display='none';">` :
            `<div style="width: 50px; height: 50px; background: #f5f5f5; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 10px;">Sin img</div>`;
        
        return `
            <div class="order-item">
                ${imagenHtml}
                <div class="order-item-details">
                    <strong>${nombreProducto}</strong>
                    <span>Cantidad: ${cantidad}</span>
                    <span>Precio: ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(precio)}</span>
                </div>
            </div>
        `;
    }).join('');

    modalBody.innerHTML = `
        <h4>Pedido #${pedido.id.slice(-6)}</h4>
        <p><strong>Fecha:</strong> ${new Date(pedido.fecha).toLocaleString('es-CO')}</p>
        <p><strong>Estado:</strong> <span class="status-badge status-${pedido.estado?.toLowerCase()}">${pedido.estado}</span></p>
        <p><strong>Total:</strong> ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(pedido.total)}</p>
        <p><strong>Tipo entrega:</strong> ${pedido.tipoEntrega || 'No especificado'}</p>
        
        ${clienteInfo ? `
        <h4>Cliente</h4>
        <p><strong>Nombre:</strong> ${clienteInfo.nombre || 'N/A'}</p>
        <p><strong>Email:</strong> ${clienteInfo.email || 'N/A'}</p>
        <p><strong>Teléfono:</strong> ${clienteInfo.telefono || 'N/A'}</p>
        ${clienteInfo.direccion ? `<p><strong>Dirección:</strong> ${clienteInfo.direccion}</p>` : ''}
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
    container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000;';
    document.body.appendChild(container);
    return container;
}

// Modal de Confirmación MEJORADO - MÁS VISIBLE
function mostrarConfirmacion(mensaje, submensaje = '') {
    return new Promise(resolve => {
        const container = document.getElementById('confirmation-container') || createConfirmContainer();
        container.innerHTML = `
            <div class="confirm-modal" style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 450px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                text-align: center;
            ">
                <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                <h3 style="margin: 0 0 10px 0; color: #333; font-size: 20px;">${mensaje}</h3>
                ${submensaje ? `<p style="color: #666; margin: 0 0 25px 0; font-size: 14px;">${submensaje}</p>` : ''}
                <div class="confirm-actions" style="
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    margin-top: 25px;
                ">
                    <button id="confirm-yes" style="
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 600;
                    ">Sí, eliminar</button>
                    <button id="confirm-no" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 600;
                    ">Cancelar</button>
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
    container.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        z-index: 99999;
        align-items: center;
        justify-content: center;
    `;
    document.body.appendChild(container);
    return container;
}
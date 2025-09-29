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
    document.querySelector('.close-modal').addEventListener('click', cerrarModal);
    document.querySelector('.btn-cancel').addEventListener('click', cerrarModal);

    // Preview de imagen
    document.getElementById('productImage').addEventListener('change', previewImage);

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
                <button class="btn-action btn-edit" onclick="abrirEditarProducto('${producto.id}')">✏️</button>
                <button class="btn-action btn-toggle" onclick="toggleDisponibilidad('${producto.id}')">
                    ${Number(producto.stock) > 0 ? '⏸️' : '▶️'}
                </button>
                <button class="btn-action btn-delete" onclick="eliminarProducto('${producto.id}')">🗑️</button>
            </td>
        `;
        productsTableBody.appendChild(row);
    });
}

// Cargar pedidos para el admin
async function cargarPedidosAdmin() {
    try {
        // Para MongoDB, necesitarías un endpoint específico para pedidos
        // Por ahora usamos datos de ejemplo
        adminOrders = [
            {
                id: '1',
                fecha: new Date().toLocaleString(),
                productos: [
                    { nombre: 'Cuaderno Decorado', cantidad: 2, precio: 15000 }
                ],
                total: 30000,
                estado: 'pendiente'
            },
            {
                id: '2',
                fecha: new Date(Date.now() - 86400000).toLocaleString(),
                productos: [
                    { nombre: 'Stickers Decorativos', cantidad: 1, precio: 8000 },
                    { nombre: 'Taza Personalizada', cantidad: 1, precio: 12000 }
                ],
                total: 20000,
                estado: 'procesado'
            }
        ];
        mostrarPedidosAdmin();
    } catch (error) {
        console.error('Error cargando pedidos:', error);
        adminOrders = [];
        mostrarPedidosAdmin();
    }
}

// Mostrar pedidos en la tabla del admin
function mostrarPedidosAdmin() {
    ordersTableBody.innerHTML = '';
    
    adminOrders.forEach(pedido => {
        const productosList = pedido.productos.map(p => 
            `${p.nombre} (${p.cantidad})`
        ).join(', ');
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${pedido.fecha}</td>
            <td>${productosList}</td>
            <td>$${pedido.total}</td>
            <td>
                <span class="status-badge ${pedido.estado === 'pendiente' ? 'status-pending' : 'status-available'}">
                    ${pedido.estado}
                </span>
            </td>
            <td>
                <button class="btn-action btn-edit" onclick="marcarPedidoProcesado('${pedido.id}')">
                    ✅
                </button>
                <button class="btn-action" onclick="verDetallesPedido('${pedido.id}')">
                    👁️
                </button>
            </td>
        `;
        ordersTableBody.appendChild(row);
    });
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    document.getElementById('totalProducts').textContent = adminProducts.length;
    
    const pedidosPendientes = adminOrders.filter(p => p.estado === 'pendiente').length;
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
        document.getElementById('imagePreview').innerHTML = '';
        alert('Producto agregado exitosamente!');
    } catch (error) {
        console.error('Error agregando producto:', error);
        alert('Error al agregar el producto: ' + error.message);
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

// Cerrar modal
function cerrarModal() {
    editModal.style.display = 'none';
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
        cerrarModal();
        alert('Producto actualizado exitosamente!');
    } catch (error) {
        console.error('Error actualizando producto:', error);
        alert('Error al actualizar el producto: ' + error.message);
    }
}

// Cambiar disponibilidad del producto usando la API
async function toggleDisponibilidad(productoId) {
    const producto = adminProducts.find(p => p.id === productoId);
    if (!producto) return;
    
    const nuevoStock = producto.stock > 0 ? 0 : 10;
    
    try {
        const res = await fetch(`${API_BASE_URL}/products/${productoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: nuevoStock })
        });
        
        if (!res.ok) throw new Error('Error al cambiar disponibilidad');
        
        await cargarProductosAdmin();
        alert(`Producto ${nuevoStock > 0 ? 'habilitado' : 'deshabilitado'} exitosamente!`);
    } catch (error) {
        console.error('Error cambiando disponibilidad:', error);
        alert('Error: ' + error.message);
    }
}

// Eliminar producto usando la API
async function eliminarProducto(productoId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
    
    try {
        const res = await fetch(`${API_BASE_URL}/products/${productoId}`, {
            method: 'DELETE'
        });
        
        if (!res.ok) throw new Error('Error al eliminar producto');
        
        await cargarProductosAdmin();
        alert('Producto eliminado exitosamente!');
    } catch (error) {
        console.error('Error eliminando producto:', error);
        alert('Error al eliminar el producto: ' + error.message);
    }
}

// Marcar pedido como procesado
async function marcarPedidoProcesado(pedidoId) {
    try {
        // En una implementación real, aquí harías un fetch a tu API
        const pedido = adminOrders.find(p => p.id === pedidoId);
        if (pedido) {
            pedido.estado = 'procesado';
            mostrarPedidosAdmin();
            actualizarEstadisticas();
            alert('Pedido marcado como procesado!');
        }
    } catch (error) {
        console.error('Error procesando pedido:', error);
        alert('Error: ' + error.message);
    }
}

// Ver detalles del pedido
function verDetallesPedido(pedidoId) {
    const pedido = adminOrders.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    const detalles = pedido.productos.map(p => 
        `${p.nombre} - Cantidad: ${p.cantidad} - $${p.precio} c/u`
    ).join('\n');
    
    alert(`Detalles del Pedido:\n\n${detalles}\n\nTotal: $${pedido.total}\nEstado: ${pedido.estado}`);
}

// Hacer funciones globales para los event listeners inline
window.abrirEditarProducto = abrirEditarProducto;
window.toggleDisponibilidad = toggleDisponibilidad;
window.eliminarProducto = eliminarProducto;
window.marcarPedidoProcesado = marcarPedidoProcesado;
window.verDetallesPedido = verDetallesPedido;
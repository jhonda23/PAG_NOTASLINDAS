// js/tendencias.js - Productos del backend + likes locales
import { API_BASE_URL } from './api-config.js';

const grid = document.getElementById('trendingGrid');
let productos = [];

// Inicializar página
document.addEventListener('DOMContentLoaded', async () => {
    await cargarTendencias();

    // Escuchar cambios de likes locales (desde index)
    window.addEventListener('storage', (e) => {
        if (e.key === 'likeActualizado') {
            console.log('🔄 Like detectado, actualizando ranking...');
            aplicarLikesLocales();
            productos.sort((a, b) => b.likes - a.likes); // Re-ordenar la lista
            mostrarProductos();
        }
    });
});

// ===============================
// 🔹 CARGAR PRODUCTOS DEL BACKEND
// ===============================
async function cargarTendencias() {
    try {
        grid.innerHTML = `
            <div style="text-align:center; padding:40px; font-size:1.2em; color:#555;">
                🔄 Cargando productos en tendencia...
            </div>
        `;

        const res = await fetch(`${API_BASE_URL}/products`);
        if (!res.ok) throw new Error('Error cargando productos');

        const data = await res.json();
        productos = data.map(p => {
            let imagenURL = p.imagen;
            if (imagenURL && imagenURL.startsWith('/uploads/')) {
                imagenURL = `http://localhost:4000${imagenURL}`;
            } else if (imagenURL && !imagenURL.startsWith('http')) {
                imagenURL = `http://localhost:4000/uploads/${imagenURL}`;
            }
            return {
                ...p,
                id: p._id || p.id,
                imagen: imagenURL,
                likes: p.likes || 0
            };
        });

        // Aplicar likes locales sin borrar productos
        aplicarLikesLocales();

        // Ordenar por likes descendente
        productos.sort((a, b) => b.likes - a.likes);

        mostrarProductos();
    } catch (error) {
        console.error('❌ Error cargando tendencias:', error);
        grid.innerHTML = `
            <div style="text-align:center; padding:40px; color:red;">
                <p>Error al cargar las tendencias</p>
                <button onclick="cargarTendencias()" 
                        style="margin-top:10px; padding:8px 16px; background:#ff4081; color:white; border:none; border-radius:4px; cursor:pointer;">
                    Reintentar
                </button>
            </div>
        `;
    }
}

// ===============================
// 🔹 MOSTRAR PRODUCTOS EN GRID
// ===============================
function mostrarProductos() {
    grid.innerHTML = '';

    if (!productos || productos.length === 0) {
        grid.innerHTML = `
            <div style="text-align:center; padding:40px; color:#777;">
                <p>No hay productos en tendencia todavía.</p>
                <p>¡Dale ❤️ a tus productos favoritos en la página principal!</p>
            </div>
        `;
        return;
    }

    productos.forEach((producto, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';

        let imagenUrl = producto.imagen || '../images/placeholder.jpg';

        // Badge top 3
        const positionBadge = index < 3 ? `
            <div style="position:absolute; left:8px; top:8px; background:${index === 0 ? 'gold' : index === 1 ? 'silver' : '#cd7f32'}; 
                        color:black; padding:4px 8px; border-radius:16px; font-weight:bold; font-size:0.8em;">
                #${index + 1}
            </div>
        ` : '';

        card.innerHTML = `
            <div class="product-image-wrapper" style="position:relative;">
                ${positionBadge}
                <img src="${imagenUrl}" 
                     alt="${producto.nombre}" 
                     class="product-image"
                     onerror="this.onerror=null; this.src='../images/placeholder.jpg'">

                <div class="likes-badge"
                     data-id="${producto.id}"
                     style="position:absolute; right:8px; top:8px; background: rgba(255,255,255,0.9);
                            padding:4px 8px; border-radius:16px; font-weight:600; cursor:pointer;"
                     title="Haz clic para dar like">
                    ❤️ <span class="likes-count">${producto.likes}</span>
                </div>
            </div>

            <h3 class="product-title">${producto.nombre}</h3>
            <p class="product-price">$${producto.precio}</p>
        `;

        // Evento dar like
        const badge = card.querySelector('.likes-badge');
        badge.addEventListener('click', async (event) => {
            event.stopPropagation();
            await darLike(producto, badge);
        });

        grid.appendChild(card);
    });
}

// ===============================
// 🔹 DAR LIKE
// ===============================
async function darLike(producto, badgeElement) {
    const likesSpan = badgeElement.querySelector('.likes-count');
    let likes = parseInt(likesSpan.textContent) || 0;
    likes++;
    likesSpan.textContent = likes;

    // Guardar en localStorage
    try {
        const likesData = JSON.parse(localStorage.getItem('notasLindasLikes') || '{}');
        likesData[producto.id] = likes;
        localStorage.setItem('notasLindasLikes', JSON.stringify(likesData));
        localStorage.setItem('likeActualizado', Date.now().toString());
    } catch (err) {
        console.warn('⚠️ Error guardando like local:', err);
    }

    // Enviar al backend sin alert
    try {
        const res = await fetch(`${API_BASE_URL}/products/${producto.id}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        if (res.ok) {
            const result = await res.json();
            if (result.likes !== undefined) {
                likesSpan.textContent = result.likes;
                const idx = productos.findIndex(p => p.id === producto.id);
                if (idx !== -1) productos[idx].likes = result.likes;

                // Actualizar localStorage con valor final
                const likesData = JSON.parse(localStorage.getItem('notasLindasLikes') || '{}');
                likesData[producto.id] = result.likes;
                localStorage.setItem('notasLindasLikes', JSON.stringify(likesData));
            }
        }
    } catch (err) {
        console.warn('⚠️ Error enviando like al backend:', err);
    }
}

// ===============================
// 🔹 APLICAR LIKES LOCALES
// ===============================
function aplicarLikesLocales() {
    try {
        const likesData = JSON.parse(localStorage.getItem('notasLindasLikes') || '{}');
        productos.forEach(p => {
            if (likesData[p.id] !== undefined) p.likes = likesData[p.id];
        });
    } catch (err) {
        console.warn('⚠️ Error leyendo likes locales:', err);
    }
}

// Hacer global por si quieres recargar manualmente
window.cargarTendencias = cargarTendencias;

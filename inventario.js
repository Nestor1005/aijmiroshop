// ==================== INVENTARIO MODULE ====================

// Variables globales
let products = [];
let filteredProducts = [];
let currentPage = 1;
let rowsPerPage = 5;
let editingProductId = null;
let currentImageBase64 = '';

// Inicializar módulo
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('inventario.html')) {
        initInventory();
    }
});

async function initInventory() {
    const user = checkAuth();
    if (!user) return;
    
    // Validar que solo Admin pueda acceder a este módulo
    if (user.role !== 'admin') {
        Notification.error('No tiene permisos para acceder a este módulo', 'Acceso Denegado');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        return;
    }
    
    // Actualizar información del usuario
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    const userIcon = document.getElementById('userIcon');
    
    if (userName) userName.textContent = user.name;
    if (userRole) userRole.textContent = user.role === 'admin' ? 'Admin' : 'Operador';
    if (userIcon) userIcon.className = user.role === 'admin' ? 'fas fa-user-shield' : 'fas fa-user';
    
    updateDateTime();
    await loadProducts(); // Ahora es async
    renderProducts();
    
    // Notificación de bienvenida
    setTimeout(() => {
        Notification.success('Módulo de Inventario cargado correctamente', 'Bienvenido');
    }, 500);
}

// Cargar productos desde Supabase/localStorage
async function loadProducts() {
    try {
        const result = await window.StorageAPI.getProducts();
        console.log('Productos recibidos:', result);
        
        // Asegurarse de que products sea siempre un array
        products = Array.isArray(result) ? result : [];
        
        // Si no hay productos, usar los por defecto
        if (products.length === 0) {
            console.log('No hay productos en DB, usando productos por defecto');
            products = getDefaultProducts();
        }
        
        filteredProducts = [...products];
    } catch (error) {
        console.error('Error al cargar productos:', error);
        products = getDefaultProducts();
        filteredProducts = [...products];
    }
}

// Productos por defecto
function getDefaultProducts() {
    return [
        {
            id: 1,
            name: 'Camiseta Deportiva',
            color: 'Rojo',
            stock: 50,
            cost: 45.50,
            price: 89.90,
            image: ''
        },
        {
            id: 2,
            name: 'Pantalón Jean',
            color: 'Azul',
            stock: 25,
            cost: 120.00,
            price: 199.00,
            image: ''
        },
        {
            id: 3,
            name: 'Zapatillas Running',
            color: 'Negro',
            stock: 8,
            cost: 280.00,
            price: 450.00,
            image: ''
        }
    ];
}

// Renderizar productos en la tabla
function renderProducts() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedProducts = filteredProducts.slice(start, end);
    
    if (paginatedProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px;">
                    <i class="fas fa-box-open" style="font-size: 48px; color: var(--text-light); margin-bottom: 10px; display: block;"></i>
                    <p style="color: var(--text-light); font-size: 16px;">No se encontraron productos</p>
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = paginatedProducts.map((product, index) => {
            const globalIndex = start + index + 1;
            const profit = product.price - product.cost;
            const profitPercent = product.cost > 0 ? ((profit / product.cost) * 100).toFixed(1) : 0;
            
            let stockClass = 'stock-high';
            if (product.stock <= 5) stockClass = 'stock-low';
            else if (product.stock <= 15) stockClass = 'stock-medium';
            
            return `
                <tr>
                    <td>${globalIndex}</td>
                    <td>
                        ${product.image ? 
                            `<img src="${product.image}" alt="${product.name}" class="product-image">` :
                            `<div class="no-image"><i class="fas fa-image"></i></div>`
                        }
                    </td>
                    <td><strong>${escapeHtml(product.name)}</strong></td>
                    <td>${escapeHtml(product.color)}</td>
                    <td><span class="stock-badge ${stockClass}">${product.stock} unid.</span></td>
                    <td>Bs. ${formatCurrency(product.cost)}</td>
                    <td>Bs. ${formatCurrency(product.price)}</td>
                    <td>
                        <strong style="color: ${profit > 0 ? 'var(--secondary-color)' : 'var(--danger-color)'};">
                            Bs. ${formatCurrency(profit)}
                        </strong>
                        <br><small style="color: var(--text-light);">(${profit > 0 ? '+' : ''}${profitPercent}%)</small>
                    </td>
                    <td>
                        <button class="action-btn btn-edit" onclick="editProduct(${product.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn btn-delete" onclick="deleteProduct(${product.id})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    updatePaginationInfo();
    renderPagination();
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Actualizar información de paginación
function updatePaginationInfo() {
    const start = filteredProducts.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(currentPage * rowsPerPage, filteredProducts.length);
    
    document.getElementById('showingStart').textContent = start;
    document.getElementById('showingEnd').textContent = end;
    document.getElementById('totalProducts').textContent = filteredProducts.length;
}

// Renderizar botones de paginación
function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
    const paginationContainer = document.getElementById('paginationButtons');
    
    if (!paginationContainer) return;
    
    let buttonsHTML = '';
    
    // Botón anterior
    buttonsHTML += `
        <button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Botones de páginas
    if (totalPages <= 7) {
        // Mostrar todas las páginas si son pocas
        for (let i = 1; i <= totalPages; i++) {
            buttonsHTML += `
                <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        }
    } else {
        // Mostrar con puntos suspensivos
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - 1 && i <= currentPage + 1)
            ) {
                buttonsHTML += `
                    <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                buttonsHTML += `<span style="padding: 0 8px; color: var(--text-light);">...</span>`;
            }
        }
    }
    
    // Botón siguiente
    buttonsHTML += `
        <button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    paginationContainer.innerHTML = buttonsHTML;
}

// Cambiar página
function changePage(page) {
    const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Cambiar filas por página
function changeRowsPerPage() {
    const select = document.getElementById('rowsPerPage');
    rowsPerPage = parseInt(select.value);
    currentPage = 1;
    renderProducts();
}

// Buscar productos
function searchProducts() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.color.toLowerCase().includes(searchTerm) ||
            product.id.toString().includes(searchTerm)
        );
    }
    
    currentPage = 1;
    renderProducts();
}

// Abrir modal para agregar producto
function openAddProductModal() {
    editingProductId = null;
    currentImageBase64 = '';
    
    const modalTitle = document.getElementById('modalTitle');
    const productForm = document.getElementById('productForm');
    const productId = document.getElementById('productId');
    const imagePreview = document.getElementById('imagePreview');
    
    if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Agregar Producto';
    if (productForm) productForm.reset();
    if (productId) productId.value = '';
    if (imagePreview) {
        imagePreview.innerHTML = `
            <i class="fas fa-camera"></i>
            <p>Click para seleccionar imagen</p>
        `;
    }
    
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.add('show');
}

// Cerrar modal
function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('show');
    editingProductId = null;
    currentImageBase64 = '';
}

// Preview de imagen
function previewImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('imagePreview');
    
    if (!file) return;
    
    // Validar tamaño (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB en bytes
    if (file.size > maxSize) {
        Notification.error('La imagen no puede superar los 10MB', 'Archivo muy grande');
        event.target.value = '';
        currentImageBase64 = '';
        preview.innerHTML = `
            <i class="fas fa-camera"></i>
            <p>Click para seleccionar imagen</p>
        `;
        return;
    }
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
        Notification.error('Solo se permiten archivos de imagen', 'Tipo de archivo inválido');
        event.target.value = '';
        currentImageBase64 = '';
        preview.innerHTML = `
            <i class="fas fa-camera"></i>
            <p>Click para seleccionar imagen</p>
        `;
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        // Comprimir la imagen antes de guardar
        compressImage(e.target.result, (compressedImage) => {
            currentImageBase64 = compressedImage;
            preview.innerHTML = `<img src="${compressedImage}" alt="Preview">`;
        });
    };
    reader.onerror = function() {
        Notification.error('Error al cargar la imagen', 'Error');
        currentImageBase64 = '';
    };
    reader.readAsDataURL(file);
}

// Comprimir imagen para reducir tamaño en localStorage
function compressImage(base64Image, callback) {
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calcular nuevas dimensiones (máximo 800x800 manteniendo proporción)
        let width = img.width;
        let height = img.height;
        const maxSize = 800;
        
        if (width > height) {
            if (width > maxSize) {
                height *= maxSize / width;
                width = maxSize;
            }
        } else {
            if (height > maxSize) {
                width *= maxSize / height;
                height = maxSize;
            }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a base64 con calidad reducida (0.7 = 70%)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        callback(compressedBase64);
    };
    img.src = base64Image;
}

// Guardar producto
// Guardar producto (Agregar o Editar)
async function saveProduct(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('productName');
    const colorInput = document.getElementById('productColor');
    const stockInput = document.getElementById('productStock');
    const costInput = document.getElementById('productCost');
    const priceInput = document.getElementById('productPrice');
    
    if (!nameInput || !colorInput || !stockInput || !costInput || !priceInput) {
        Notification.error('Error al obtener los datos del formulario', 'Error');
        return;
    }
    
    const productData = {
        name: nameInput.value.trim(),
        color: colorInput.value.trim(),
        stock: parseInt(stockInput.value),
        cost: parseFloat(costInput.value),
        price: parseFloat(priceInput.value),
        image: currentImageBase64
    };
    
    // Validaciones
    if (!productData.name) {
        Notification.warning('El nombre del producto es requerido', 'Validación');
        nameInput.focus();
        return;
    }
    
    if (!productData.color) {
        Notification.warning('El color es requerido', 'Validación');
        colorInput.focus();
        return;
    }
    
    if (isNaN(productData.stock) || productData.stock < 0) {
        Notification.warning('El stock debe ser un número mayor o igual a 0', 'Validación');
        stockInput.focus();
        return;
    }
    
    if (isNaN(productData.cost) || productData.cost < 0) {
        Notification.warning('El costo debe ser un número mayor o igual a 0', 'Validación');
        costInput.focus();
        return;
    }
    
    if (isNaN(productData.price) || productData.price < 0) {
        Notification.warning('El precio debe ser un número mayor o igual a 0', 'Validación');
        priceInput.focus();
        return;
    }
    
    // Validar precio de venta mayor que costo
    if (productData.price <= productData.cost) {
        Notification.warning('El precio de venta debe ser mayor que el costo', 'Validación');
        priceInput.focus();
        return;
    }
    
    if (editingProductId) {
        // Editar producto existente
        const index = products.findIndex(p => p.id === editingProductId);
        if (index !== -1) {
            products[index] = { 
                ...products[index], 
                ...productData 
            };
            await window.StorageAPI.saveProduct(products[index]);
            Notification.success(`Producto "${productData.name}" actualizado correctamente`, 'Éxito');
        }
    } else {
        // Agregar nuevo producto
        productData.id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push(productData);
        await window.StorageAPI.saveProduct(productData);
        Notification.success(`Producto "${productData.name}" agregado correctamente`, 'Éxito');
    }
    
    filteredProducts = [...products];
    renderProducts();
    closeProductModal();
}

// Editar producto
function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) {
        Notification.error('Producto no encontrado', 'Error');
        return;
    }
    
    editingProductId = id;
    currentImageBase64 = product.image || '';
    
    const modalTitle = document.getElementById('modalTitle');
    const productId = document.getElementById('productId');
    const productName = document.getElementById('productName');
    const productColor = document.getElementById('productColor');
    const productStock = document.getElementById('productStock');
    const productCost = document.getElementById('productCost');
    const productPrice = document.getElementById('productPrice');
    const preview = document.getElementById('imagePreview');
    
    if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Producto';
    if (productId) productId.value = id;
    if (productName) productName.value = product.name;
    if (productColor) productColor.value = product.color;
    if (productStock) productStock.value = product.stock;
    if (productCost) productCost.value = product.cost;
    if (productPrice) productPrice.value = product.price;
    
    if (preview) {
        if (product.image) {
            preview.innerHTML = `<img src="${product.image}" alt="${product.name}">`;
        } else {
            preview.innerHTML = `
                <i class="fas fa-camera"></i>
                <p>Click para seleccionar imagen</p>
            `;
        }
    }
    
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.add('show');
}

// Eliminar producto
async function deleteProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) {
        Notification.error('Producto no encontrado', 'Error');
        return;
    }
    
    ConfirmDialog.show(
        `¿Está seguro que desea eliminar el producto "${product.name}"?`,
        'Eliminar Producto',
        async () => {
            products = products.filter(p => p.id !== id);
            await window.StorageAPI.deleteProduct(id);
            filteredProducts = [...products];
            
            // Ajustar página actual si es necesario
            const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
            if (currentPage > totalPages && totalPages > 0) {
                currentPage = totalPages;
            }
            
            renderProducts();
            Notification.success(`Producto "${product.name}" eliminado correctamente`, 'Éxito');
        }
    );
}

// Descargar formato Excel
function downloadTemplate() {
    try {
        const template = [
            ['Nombre del Producto', 'Color', 'Stock', 'Costo', 'Precio de Venta'],
            ['Ejemplo: Camiseta', 'Rojo', '50', '45.50', '89.90'],
            ['Ejemplo: Pantalón', 'Azul', '30', '120.00', '199.00']
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(template);
        
        // Ajustar anchos de columna
        ws['!cols'] = [
            { wch: 25 },
            { wch: 15 },
            { wch: 10 },
            { wch: 12 },
            { wch: 18 }
        ];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Productos');
        
        XLSX.writeFile(wb, 'formato_productos_aijmiroshop.xlsx');
        Notification.success('Formato descargado correctamente', 'Descarga Exitosa');
    } catch (error) {
        console.error('Error al descargar formato:', error);
        Notification.error('Error al generar el archivo. Verifique que la librería XLSX esté cargada.', 'Error');
    }
}

// Importar productos
async function importProducts() {
    const input = document.getElementById('importFileInput');
    if (input) input.click();
}

async function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            
            // Saltar la primera fila (encabezados)
            const importedProducts = [];
            let errorCount = 0;
            
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                
                // Validar que la fila tenga datos
                if (!row || row.length === 0 || !row[0]) continue;
                
                const name = String(row[0] || '').trim();
                const color = String(row[1] || 'Sin color').trim();
                const stock = parseInt(row[2]) || 0;
                const cost = parseFloat(row[3]) || 0;
                const price = parseFloat(row[4]) || 0;
                
                // Validar datos
                if (!name) {
                    errorCount++;
                    continue;
                }
                
                if (price <= cost) {
                    errorCount++;
                    continue;
                }
                
                importedProducts.push({
                    id: products.length + importedProducts.length + 1,
                    name: name,
                    color: color,
                    stock: stock,
                    cost: cost,
                    price: price,
                    image: ''
                });
            }
            
            if (importedProducts.length > 0) {
                products = [...products, ...importedProducts];
                // Guardar cada producto en Supabase
                for (const product of importedProducts) {
                    await window.StorageAPI.saveProduct(product);
                }
                filteredProducts = [...products];
                renderProducts();
                
                let message = `${importedProducts.length} producto(s) importado(s) correctamente`;
                if (errorCount > 0) {
                    message += `. ${errorCount} fila(s) ignorada(s) por datos inválidos`;
                }
                Notification.success(message, 'Importación Exitosa');
            } else {
                Notification.warning('No se encontraron productos válidos en el archivo', 'Sin Datos');
            }
        } catch (error) {
            console.error('Error al importar:', error);
            Notification.error('Error al leer el archivo. Verifique el formato.', 'Error de Importación');
        }
    };
    reader.onerror = function() {
        Notification.error('Error al leer el archivo', 'Error');
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
}

// Exportar productos
function exportProducts() {
    if (products.length === 0) {
        Notification.warning('No hay productos para exportar', 'Sin Datos');
        return;
    }
    
    try {
        const exportData = products.map(p => {
            const profit = p.price - p.cost;
            const profitPercent = p.cost > 0 ? ((profit / p.cost) * 100).toFixed(2) : 0;
            
            return {
                'ID': p.id,
                'Nombre del Producto': p.name,
                'Color': p.color,
                'Stock': p.stock,
                'Costo (BOB)': p.cost.toFixed(2),
                'Precio de Venta (BOB)': p.price.toFixed(2),
                'Ganancia (BOB)': profit.toFixed(2),
                'Ganancia (%)': profitPercent + '%'
            };
        });
        
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // Ajustar anchos de columna
        ws['!cols'] = [
            { wch: 6 },
            { wch: 25 },
            { wch: 15 },
            { wch: 10 },
            { wch: 15 },
            { wch: 20 },
            { wch: 18 },
            { wch: 15 }
        ];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
        
        const date = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `inventario_aijmiroshop_${date}.xlsx`);
        Notification.success(`${products.length} producto(s) exportado(s) correctamente`, 'Exportación Exitosa');
    } catch (error) {
        console.error('Error al exportar:', error);
        Notification.error('Error al generar el archivo. Verifique que la librería XLSX esté cargada.', 'Error');
    }
}

// Vaciar inventario
function clearInventory() {
    if (products.length === 0) {
        Notification.info('El inventario ya está vacío', 'Sin Productos');
        return;
    }
    
    ConfirmDialog.show(
        `⚠️ ADVERTENCIA ⚠️\n\n` +
        `¿Está seguro que desea ELIMINAR TODOS los productos del inventario?\n\n` +
        `Esta acción eliminará ${products.length} producto(s) y NO se puede deshacer.\n\n` +
        `Se recomienda exportar el inventario antes de continuar.`,
        'Vaciar Inventario',
        async () => {
            // Segunda confirmación para mayor seguridad
            ConfirmDialog.show(
                `Esta es su última oportunidad.\n\n` +
                `¿Realmente desea VACIAR el inventario completamente?`,
                'Confirmación Final',
                async () => {
                    const deletedCount = products.length;
                    // Eliminar todos los productos de Supabase
                    for (const product of products) {
                        await window.StorageAPI.deleteProduct(product.id);
                    }
                    products = [];
                    filteredProducts = [];
                    currentPage = 1;
                    
                    renderProducts();
                    
                    Notification.success(
                        `Se han eliminado ${deletedCount} producto(s) del inventario. El inventario está vacío.`, 
                        'Inventario Vaciado'
                    );
                }
            );
        }
    );
}

// Volver al dashboard
function goToDashboard() {
    window.location.href = 'dashboard.html';
}

// Cerrar modal al hacer clic fuera de él
window.onclick = function(event) {
    const modal = document.getElementById('productModal');
    if (event.target === modal) {
        closeProductModal();
    }
}

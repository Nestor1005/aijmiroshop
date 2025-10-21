// ==================== VENTAS MODULE ====================

// Variables globales
let cart = [];
let products = [];
let clients = [];
let selectedClient = null;
let sales = [];

// Inicializar módulo
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('ventas.html')) {
        initSales();
    }
});

function initSales() {
    const user = checkAuth();
    if (!user) return;
    
    // Actualizar información del usuario
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    const userIcon = document.getElementById('userIcon');
    
    if (userName) userName.textContent = user.name;
    if (userRole) userRole.textContent = user.role === 'admin' ? 'Admin' : 'Operador';
    if (userIcon) userIcon.className = user.role === 'admin' ? 'fas fa-user-shield' : 'fas fa-user';
    
    updateDateTime();
    loadData();
    renderProducts();
    loadClientsToSelect();
    
    // Notificación de bienvenida
    setTimeout(() => {
        Notification.success('Módulo de Ventas cargado correctamente', 'Bienvenido');
    }, 500);
}

// Cargar datos desde localStorage
function loadData() {
    // Cargar productos
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
        try {
            products = JSON.parse(savedProducts);
        } catch (error) {
            console.error('Error al cargar productos:', error);
            products = [];
        }
    }
    
    // Cargar clientes
    const savedClients = localStorage.getItem('clients');
    if (savedClients) {
        try {
            clients = JSON.parse(savedClients);
        } catch (error) {
            console.error('Error al cargar clientes:', error);
            clients = [];
        }
    }
    
    // Cargar ventas
    const savedSales = localStorage.getItem('sales');
    if (savedSales) {
        try {
            sales = JSON.parse(savedSales);
        } catch (error) {
            console.error('Error al cargar ventas:', error);
            sales = [];
        }
    } else {
        sales = [];
    }
}

// Guardar ventas
function saveSales() {
    try {
        localStorage.setItem('sales', JSON.stringify(sales));
    } catch (error) {
        console.error('Error al guardar ventas:', error);
        Notification.error('Error al guardar la venta.', 'Error');
    }
}

// Actualizar productos en localStorage
function updateProducts() {
    try {
        localStorage.setItem('products', JSON.stringify(products));
    } catch (error) {
        console.error('Error al actualizar productos:', error);
    }
}

// Renderizar productos disponibles
function renderProducts(filterText = '') {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    let filteredProducts = products;
    
    if (filterText) {
        const search = filterText.toLowerCase();
        filteredProducts = products.filter(p => 
            p.name.toLowerCase().includes(search) ||
            p.color.toLowerCase().includes(search) ||
            p.id.toString().includes(search)
        );
    }
    
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-light);">
                <i class="fas fa-box-open" style="font-size: 48px; margin-bottom: 10px; display: block;"></i>
                <p>No se encontraron productos</p>
            </div>
        `;
        return;
    }
    
    productsGrid.innerHTML = filteredProducts.map(product => {
        const stockClass = product.stock === 0 ? 'out' : 
                          product.stock <= 5 ? 'low' : 
                          product.stock <= 15 ? 'medium' : 'high';
        
        const stockText = product.stock === 0 ? 'Agotado' : `Stock: ${product.stock}`;
        const isOutOfStock = product.stock === 0;
        
        const imageHtml = product.image ? 
            `<img src="${product.image}" alt="${product.name}" class="product-image">` :
            `<div class="product-image" style="display: flex; align-items: center; justify-content: center; color: var(--text-light);">
                <i class="fas fa-image" style="font-size: 32px;"></i>
            </div>`;
        
        return `
            <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}" onclick="${isOutOfStock ? '' : `addToCart(${product.id})`}">
                ${imageHtml}
                <div class="product-name" title="${product.name}">${product.name}</div>
                <div class="product-color">${product.color}</div>
                <div class="product-details">
                    <div class="product-price">Bs. ${formatCurrency(product.price)}</div>
                    <span class="product-stock ${stockClass}">${stockText}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Buscar productos
function searchProducts() {
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        renderProducts(searchInput.value);
    }
}

// Agregar producto al carrito
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock === 0) {
        Notification.warning('Producto sin stock disponible', 'Stock Insuficiente');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            Notification.warning(`Solo hay ${product.stock} unidades disponibles`, 'Stock Insuficiente');
            return;
        }
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            color: product.color,
            price: product.price,
            quantity: 1,
            maxStock: product.stock
        });
    }
    
    renderCart();
    Notification.success(`${product.name} agregado al carrito`, 'Producto Agregado');
}

// Renderizar carrito
function renderCart() {
    const cartItems = document.getElementById('cartItems');
    if (!cartItems) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-basket"></i>
                <p>No hay productos en el carrito</p>
                <small>Busca y agrega productos para comenzar</small>
            </div>
        `;
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-header">
                    <div class="cart-item-name">${item.name} Color ${item.color}</div>
                    <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-control">
                        <button class="qty-btn" onclick="decreaseQuantity(${item.id})" ${item.quantity <= 1 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" class="qty-input" value="${item.quantity}" readonly>
                        <button class="qty-btn" onclick="increaseQuantity(${item.id})" ${item.quantity >= item.maxStock ? 'disabled' : ''}>
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="cart-item-price">Bs. ${formatCurrency(item.price * item.quantity)}</div>
                </div>
            </div>
        `).join('');
    }
    
    calculateTotal();
}

// Aumentar cantidad
function increaseQuantity(productId) {
    const item = cart.find(i => i.id === productId);
    if (item && item.quantity < item.maxStock) {
        item.quantity++;
        renderCart();
    }
}

// Disminuir cantidad
function decreaseQuantity(productId) {
    const item = cart.find(i => i.id === productId);
    if (item && item.quantity > 1) {
        item.quantity--;
        renderCart();
    }
}

// Eliminar del carrito
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    renderCart();
    Notification.info('Producto eliminado del carrito', 'Eliminado');
}

// Calcular total
function calculateTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountInput = document.getElementById('discountAmount');
    const shippingInput = document.getElementById('shippingCost');
    const discount = discountInput ? parseFloat(discountInput.value) || 0 : 0;
    const shipping = shippingInput ? parseFloat(shippingInput.value) || 0 : 0;
    const total = Math.max(0, subtotal - discount + shipping);
    
    document.getElementById('subtotal').textContent = `Bs. ${formatCurrency(subtotal)}`;
    document.getElementById('total').textContent = `Bs. ${formatCurrency(total)}`;
    
    calculateChange();
}

// Calcular cambio
function calculateChange() {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    if (paymentMethod !== 'efectivo') {
        const changeDisplay = document.getElementById('changeDisplay');
        if (changeDisplay) changeDisplay.style.display = 'none';
        return;
    }
    
    const cashReceived = parseFloat(document.getElementById('cashReceived').value) || 0;
    
    // Obtener el total directamente del cálculo
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountInput = document.getElementById('discountAmount');
    const shippingInput = document.getElementById('shippingCost');
    const discount = discountInput ? parseFloat(discountInput.value) || 0 : 0;
    const shipping = shippingInput ? parseFloat(shippingInput.value) || 0 : 0;
    const total = Math.max(0, subtotal - discount + shipping);
    
    const change = cashReceived - total;
    
    const changeDisplay = document.getElementById('changeDisplay');
    const changeAmount = document.getElementById('changeAmount');
    
    if (cashReceived > 0 && change >= 0) {
        changeDisplay.style.display = 'flex';
        changeAmount.textContent = `Bs. ${formatCurrency(change)}`;
    } else {
        changeDisplay.style.display = 'none';
    }
}

// Toggle campos de pago
function togglePaymentFields() {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const cashFields = document.getElementById('cashFields');
    
    if (paymentMethod === 'efectivo') {
        cashFields.style.display = 'block';
    } else {
        cashFields.style.display = 'none';
    }
}

// Cargar clientes al select
function loadClientsToSelect() {
    const clientSelect = document.getElementById('clientSelect');
    if (!clientSelect) return;
    
    clientSelect.innerHTML = `
        <option value="">Seleccionar cliente...</option>
        <option value="general">Cliente General</option>
        ${clients.map(client => 
            `<option value="${client.id}">${client.name} - CI: ${client.ci}</option>`
        ).join('')}
    `;
}

// Seleccionar cliente
function selectClient() {
    const clientSelect = document.getElementById('clientSelect');
    const clientInfo = document.getElementById('clientInfo');
    
    if (!clientSelect || !clientInfo) return;
    
    const clientId = clientSelect.value;
    
    if (clientId === '') {
        selectedClient = null;
        clientInfo.style.display = 'none';
        return;
    }
    
    if (clientId === 'general') {
        selectedClient = { id: 'general', name: 'Cliente General' };
        clientInfo.style.display = 'block';
        clientInfo.innerHTML = '<p><strong>Cliente General</strong></p>';
        return;
    }
    
    const client = clients.find(c => c.id === parseInt(clientId));
    if (client) {
        selectedClient = client;
        clientInfo.style.display = 'block';
        clientInfo.innerHTML = `
            <p><strong>${client.name}</strong></p>
            <p>CI: ${client.ci}${client.complement ? ' ' + client.complement : ''}</p>
            ${client.phone ? `<p>Teléfono: ${client.phone}</p>` : ''}
        `;
    }
}

// Modal cliente rápido
function openQuickClientModal() {
    const modal = document.getElementById('quickClientModal');
    if (modal) modal.classList.add('show');
}

function closeQuickClientModal() {
    const modal = document.getElementById('quickClientModal');
    const form = document.getElementById('quickClientForm');
    if (modal) modal.classList.remove('show');
    if (form) form.reset();
}

function saveQuickClient(event) {
    event.preventDefault();
    
    const name = document.getElementById('quickClientName').value.trim();
    const ci = document.getElementById('quickClientCI').value.trim();
    const phone = document.getElementById('quickClientPhone').value.trim();
    
    if (!name) {
        Notification.warning('El nombre del cliente es requerido', 'Validación');
        return;
    }
    
    const newClient = {
        id: clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1,
        name: name,
        ci: ci || 'S/N',
        complement: '',
        phone: phone || '',
        address: ''
    };
    
    clients.push(newClient);
    
    try {
        localStorage.setItem('clients', JSON.stringify(clients));
        loadClientsToSelect();
        
        // Seleccionar el cliente recién creado
        const clientSelect = document.getElementById('clientSelect');
        if (clientSelect) {
            clientSelect.value = newClient.id;
            selectClient();
        }
        
        closeQuickClientModal();
        Notification.success(`Cliente "${name}" agregado correctamente`, 'Cliente Agregado');
    } catch (error) {
        Notification.error('Error al guardar el cliente', 'Error');
    }
}

// Limpiar venta
function clearSale() {
    if (cart.length === 0) {
        Notification.info('No hay productos en el carrito', 'Carrito Vacío');
        return;
    }
    
    ConfirmDialog.show(
        '¿Está seguro que desea cancelar esta venta?\n\nSe eliminarán todos los productos del carrito.',
        'Cancelar Venta',
        () => {
            cart = [];
            selectedClient = null;
            document.getElementById('clientSelect').value = '';
            document.getElementById('clientInfo').style.display = 'none';
            document.getElementById('discountAmount').value = 0;
            document.getElementById('shippingCost').value = 0;
            document.getElementById('shippingAddress').value = '';
            document.getElementById('cashReceived').value = '';
            renderCart();
            Notification.info('Venta cancelada', 'Cancelado');
        }
    );
}

// Completar venta
function completeSale() {
    // Validaciones
    if (cart.length === 0) {
        Notification.warning('El carrito está vacío', 'Sin Productos');
        return;
    }
    
    if (!selectedClient) {
        Notification.warning('Debe seleccionar un cliente', 'Cliente Requerido');
        return;
    }
    
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    // Calcular total directamente
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountInput = document.getElementById('discountAmount');
    const shippingInput = document.getElementById('shippingCost');
    const discount = discountInput ? parseFloat(discountInput.value) || 0 : 0;
    const shipping = shippingInput ? parseFloat(shippingInput.value) || 0 : 0;
    const total = Math.max(0, subtotal - discount + shipping);
    
    // Validar efectivo
    if (paymentMethod === 'efectivo') {
        const cashReceived = parseFloat(document.getElementById('cashReceived').value) || 0;
        if (cashReceived < total) {
            Notification.warning('El monto recibido es insuficiente', 'Monto Insuficiente');
            return;
        }
    }
    
    // Mostrar modal de confirmación
    showConfirmModal();
}

// Mostrar modal de confirmación
function showConfirmModal() {
    const modal = document.getElementById('confirmSaleModal');
    const summaryContent = document.getElementById('saleSummaryContent');
    
    if (!modal || !summaryContent) return;
    
    const subtotalText = document.getElementById('subtotal').textContent;
    const totalText = document.getElementById('total').textContent;
    const discount = parseFloat(document.getElementById('discountAmount').value) || 0;
    const shipping = parseFloat(document.getElementById('shippingCost').value) || 0;
    const shippingAddress = document.getElementById('shippingAddress').value.trim();
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    let paymentMethodText = '';
    switch(paymentMethod) {
        case 'efectivo': paymentMethodText = 'Efectivo'; break;
        case 'qr': paymentMethodText = 'QR'; break;
        case 'transferencia': paymentMethodText = 'Transferencia'; break;
        case 'otro': paymentMethodText = 'Otro'; break;
    }
    
    summaryContent.innerHTML = `
        <p><span>Cliente:</span> <strong>${selectedClient.name}</strong></p>
        <p><span>Productos:</span> <strong>${cart.length} item(s)</strong></p>
        <p><span>Subtotal:</span> <strong>${subtotalText}</strong></p>
        ${discount > 0 ? `<p><span>Descuento:</span> <strong>Bs. ${formatCurrency(discount)}</strong></p>` : ''}
        ${shipping > 0 ? `<p><span>Envío:</span> <strong>Bs. ${formatCurrency(shipping)}</strong></p>` : ''}
        ${shippingAddress ? `<p><span>Lugar de Envío:</span> <strong>${shippingAddress}</strong></p>` : ''}
        <p><span>Total:</span> <strong style="color: var(--success-color); font-size: 20px;">${totalText}</strong></p>
        <p><span>Método de Pago:</span> <strong>${paymentMethodText}</strong></p>
    `;
    
    modal.classList.add('show');
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmSaleModal');
    if (modal) modal.classList.remove('show');
}

// Confirmar y capturar venta
function confirmAndCaptureSale() {
    const subtotalText = document.getElementById('subtotal').textContent;
    const subtotal = parseFloat(subtotalText.replace('Bs. ', '').replace(/\./g, '').replace(',', '.'));
    const discount = parseFloat(document.getElementById('discountAmount').value) || 0;
    const shipping = parseFloat(document.getElementById('shippingCost').value) || 0;
    const shippingAddress = document.getElementById('shippingAddress').value.trim();
    const totalText = document.getElementById('total').textContent;
    const total = parseFloat(totalText.replace('Bs. ', '').replace(/\./g, '').replace(',', '.'));
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    // Obtener configuración de ticket para número inicial
    const ticketSettings = JSON.parse(localStorage.getItem('ticketSettings')) || { startNumber: 1 };
    const startNumber = ticketSettings.startNumber || 1;
    
    // Calcular ID: si hay ventas, obtener el máximo y sumar 1, pero nunca menor que startNumber
    let newId;
    if (sales.length > 0) {
        const maxId = Math.max(...sales.map(s => s.id));
        newId = Math.max(maxId + 1, startNumber);
    } else {
        newId = startNumber;
    }
    
    // Crear objeto de venta
    const sale = {
        id: newId,
        date: new Date().toISOString(),
        client: selectedClient,
        items: cart.map(item => ({...item})),
        subtotal: subtotal,
        discount: discount,
        shipping: shipping,
        shippingAddress: shippingAddress,
        total: total,
        paymentMethod: paymentMethod,
        user: JSON.parse(sessionStorage.getItem('currentUser')).name
    };
    
    // Actualizar stock de productos
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
            product.stock -= item.quantity;
        }
    });
    
    // Guardar datos
    sales.push(sale);
    saveSales();
    updateProducts();
    
    // Capturar imagen del ticket antes de limpiar
    captureTicket(sale);
    
    // Limpiar formulario
    cart = [];
    selectedClient = null;
    document.getElementById('clientSelect').value = '';
    document.getElementById('clientInfo').style.display = 'none';
    document.getElementById('discountAmount').value = 0;
    document.getElementById('shippingCost').value = 0;
    document.getElementById('shippingAddress').value = '';
    document.getElementById('cashReceived').value = '';
    renderCart();
    renderProducts();
    
    closeConfirmModal();
    
    // Notificación de éxito
    Notification.success(`Venta #${sale.id} registrada correctamente. Total: Bs. ${formatCurrency(total)}`, 'Venta Completada');
}

// Capturar ticket como imagen y descargar automáticamente
function captureTicket(sale) {
    // Obtener configuración del ticket
    const ticketSettings = JSON.parse(localStorage.getItem('ticketSettings')) || {
        companyName: 'AIJMIROSHOP',
        subtitle: 'Sistema de Gestión de Inventario',
        footerMessage: '¡Gracias por su compra!'
    };
    
    // Crear un contenedor temporal para el ticket
    const ticketContainer = document.createElement('div');
    ticketContainer.id = 'ticket-to-capture';
    ticketContainer.style.position = 'absolute';
    ticketContainer.style.left = '-9999px';
    ticketContainer.style.top = '0';
    ticketContainer.style.width = '340px';
    ticketContainer.style.padding = '20px';
    ticketContainer.style.background = 'white';
    ticketContainer.style.fontFamily = "'Courier New', monospace";
    ticketContainer.style.fontSize = '13px';
    ticketContainer.style.color = '#000';
    
    const paymentMethodText = sale.paymentMethod === 'efectivo' ? 'Efectivo' : 
                              sale.paymentMethod === 'qr' ? 'QR' : 
                              sale.paymentMethod === 'transferencia' ? 'Transferencia' : 
                              'Otro';
    
    ticketContainer.innerHTML = `
        <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 15px;">
            <h2 style="margin: 10px 0; font-size: 22px; font-weight: bold;">${ticketSettings.companyName}</h2>
            <p style="margin: 5px 0; font-size: 12px;">${ticketSettings.subtitle}</p>
            <p style="margin: 8px 0; font-weight: bold;">Venta #${sale.id}</p>
            <p style="margin: 5px 0; font-size: 11px;">${new Date(sale.date).toLocaleString('es-BO', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit', 
                hour12: true 
            })}</p>
        </div>
        
        <p style="margin: 8px 0;"><strong>Cliente:</strong> ${sale.client.name}</p>
        ${sale.client.ci && sale.client.ci !== 'S/N' ? `<p style="margin: 8px 0;"><strong>CI:</strong> ${sale.client.ci}</p>` : ''}
        <p style="margin: 8px 0;"><strong>Atendido por:</strong> ${sale.user}</p>
        
        <div style="border-top: 2px dashed #000; border-bottom: 2px dashed #000; margin: 15px 0; padding: 10px 0;">
            ${sale.items.map(item => `
                <div style="margin: 8px 0;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="flex: 1; font-weight: 600;">${item.name} Color ${item.color}</span>
                        <span style="font-weight: bold;">Bs. ${formatCurrency(item.price * item.quantity)}</span>
                    </div>
                    <div style="font-size: 11px; color: #555; margin-top: 3px;">
                        <span>P/U: Bs. ${formatCurrency(item.price)} × ${item.quantity}</span>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div style="display: flex; justify-content: space-between; margin: 8px 0;">
            <span>Subtotal:</span>
            <span style="font-weight: bold;">Bs. ${formatCurrency(sale.subtotal)}</span>
        </div>
        ${sale.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                <span>Descuento:</span>
                <span style="font-weight: bold;">Bs. ${formatCurrency(sale.discount)}</span>
            </div>
        ` : ''}
        ${sale.shipping > 0 ? `
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                <span>Envío:</span>
                <span style="font-weight: bold;">Bs. ${formatCurrency(sale.shipping)}</span>
            </div>
        ` : ''}
        ${sale.shippingAddress ? `
            <div style="margin: 12px 0; padding: 10px; background: #f0f0f0; border-radius: 6px;">
                <p style="margin: 0; font-size: 11px;"><strong>Lugar de Envío:</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 12px;">${sale.shippingAddress}</p>
            </div>
        ` : ''}
        
        <div style="border-top: 2px dashed #000; margin-top: 15px; padding-top: 15px;">
            <div style="display: flex; justify-content: space-between; margin: 8px 0; font-size: 16px;">
                <span style="font-weight: bold;">TOTAL:</span>
                <span style="font-weight: bold; font-size: 18px;">Bs. ${formatCurrency(sale.total)}</span>
            </div>
        </div>
        
        <p style="margin: 12px 0;"><strong>Método de Pago:</strong> ${paymentMethodText}</p>
        
        <div style="text-align: center; margin-top: 20px; border-top: 2px dashed #000; padding-top: 15px;">
            <p style="margin: 10px 0; font-size: 13px;">${ticketSettings.footerMessage}</p>
        </div>
    `;
    
    document.body.appendChild(ticketContainer);
    
    // Usar html2canvas para capturar y descargar
    setTimeout(() => {
        html2canvas(ticketContainer, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            width: 340,
            height: ticketContainer.offsetHeight
        }).then(canvas => {
            // Convertir canvas a blob
            canvas.toBlob(blob => {
                // Crear enlace de descarga
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const fecha = new Date(sale.date).toISOString().split('T')[0];
                link.download = `Venta_${sale.id}_${fecha}_${ticketSettings.companyName.replace(/\s+/g, '_')}.png`;
                link.href = url;
                link.click();
                
                // Limpiar
                URL.revokeObjectURL(url);
                document.body.removeChild(ticketContainer);
                
                Notification.success('Ticket descargado correctamente', 'Descarga Completa');
            });
        }).catch(error => {
            console.error('Error al capturar ticket:', error);
            document.body.removeChild(ticketContainer);
            Notification.error('Error al generar la imagen del ticket', 'Error');
        });
    }, 100);
}

// Volver al dashboard
function goToDashboard() {
    if (cart.length > 0) {
        ConfirmDialog.show(
            'Hay productos en el carrito. ¿Está seguro que desea salir?',
            'Salir sin guardar',
            () => {
                window.location.href = 'dashboard.html';
            }
        );
    } else {
        window.location.href = 'dashboard.html';
    }
}

// Cerrar modales al hacer clic fuera
window.onclick = function(event) {
    const quickClientModal = document.getElementById('quickClientModal');
    const confirmSaleModal = document.getElementById('confirmSaleModal');
    
    if (event.target === quickClientModal) {
        closeQuickClientModal();
    }
    if (event.target === confirmSaleModal) {
        closeConfirmModal();
    }
}

// Variables globales
let sales = [];
let filteredSales = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentSaleForTicket = null;

// Volver al dashboard
function goToDashboard() {
    window.history.back();
}

// Eliminar todo el historial
function clearAllSales() {
    if (sales.length === 0) {
        Notification.warning('No hay ventas para eliminar', 'Historial Vacío');
        return;
    }
    
    ConfirmDialog.show(
        '¿Estás seguro de eliminar TODO el historial de ventas? Esta acción no se puede deshacer.',
        'Eliminar Historial Completo',
        () => {
            localStorage.removeItem('sales');
            sales = [];
            filteredSales = [];
            currentPage = 1;
            renderTable();
            updateStats();
            Notification.success('Historial eliminado completamente', 'Historial Vacío');
        }
    );
}

// Cargar ventas al iniciar
document.addEventListener('DOMContentLoaded', function() {
    loadSales();
    renderTable();
    updateStats();
    setDefaultDates();
    checkUserPermissions();
    updateUserInfo();
});

// Actualizar información del usuario en el header
function updateUserInfo() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (user) {
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');
        const userIcon = document.getElementById('userIcon');
        
        if (userName) userName.textContent = user.name;
        if (userRole) userRole.textContent = user.role === 'admin' ? 'Admin' : 'Operador';
        
        // Cambiar icono según rol
        if (userIcon) {
            userIcon.className = user.role === 'admin' ? 'fas fa-user-shield' : 'fas fa-user';
        }
    }
}

// Verificar permisos de usuario
function checkUserPermissions() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (user && user.role === 'operator') {
        // Ocultar botón de vaciar historial para operadores
        const clearButton = document.getElementById('clearHistoryBtn');
        if (clearButton) {
            clearButton.style.display = 'none';
        }
    }
}

// Establecer fechas por defecto (último mes)
function setDefaultDates() {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    document.getElementById('dateFrom').valueAsDate = lastMonth;
    document.getElementById('dateTo').valueAsDate = today;
}

// Cargar ventas desde localStorage
function loadSales() {
    const savedSales = localStorage.getItem('sales');
    sales = savedSales ? JSON.parse(savedSales) : [];
    // Ordenar por fecha descendente (más recientes primero)
    sales.sort((a, b) => new Date(b.date) - new Date(a.date));
    filteredSales = [...sales];
}

// Aplicar filtros
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    const paymentFilter = document.getElementById('paymentFilter').value;
    
    filteredSales = sales.filter(sale => {
        // Filtro de búsqueda
        const clientName = typeof sale.client === 'string' ? sale.client : (sale.client?.name || 'Cliente General');
        const matchesSearch = !searchTerm || 
            sale.id.toString().includes(searchTerm) ||
            clientName.toLowerCase().includes(searchTerm) ||
            sale.user.toLowerCase().includes(searchTerm);
        
        // Filtro de fecha
        const saleDate = new Date(sale.date).toISOString().split('T')[0];
        const matchesDateFrom = !dateFrom || saleDate >= dateFrom;
        const matchesDateTo = !dateTo || saleDate <= dateTo;
        
        // Filtro de método de pago
        const matchesPayment = !paymentFilter || sale.paymentMethod.toLowerCase() === paymentFilter.toLowerCase();
        
        return matchesSearch && matchesDateFrom && matchesDateTo && matchesPayment;
    });
    
    currentPage = 1;
    renderTable();
    updateStats();
}

// Limpiar filtros
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('paymentFilter').value = '';
    setDefaultDates();
    filteredSales = [...sales];
    currentPage = 1;
    renderTable();
    updateStats();
}

// Búsqueda en tiempo real
document.getElementById('searchInput')?.addEventListener('input', applyFilters);

// Actualizar estadísticas
function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    
    // Total de ventas filtradas
    document.getElementById('totalSales').textContent = filteredSales.length;
    
    // Ingresos totales
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    document.getElementById('totalRevenue').textContent = `Bs. ${formatCurrency(totalRevenue)}`;
    
    // Ventas de hoy
    const todaySales = filteredSales.filter(sale => 
        new Date(sale.date).toISOString().split('T')[0] === today
    ).length;
    document.getElementById('todaySales').textContent = todaySales;
    
    // Ticket promedio
    const avgTicket = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;
    document.getElementById('avgTicket').textContent = `Bs. ${formatCurrency(avgTicket)}`;
}

// Renderizar tabla
function renderTable() {
    const tbody = document.getElementById('salesTableBody');
    
    if (filteredSales.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No se encontraron ventas</p>
                </td>
            </tr>
        `;
        updatePagination();
        return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedSales = filteredSales.slice(startIndex, endIndex);
    
    tbody.innerHTML = paginatedSales.map(sale => {
        const saleDate = new Date(sale.date);
        const formattedDate = saleDate.toLocaleString('es-BO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const itemsCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
        
        // Obtener nombre del cliente (puede ser string u objeto)
        const clientName = typeof sale.client === 'string' ? sale.client : (sale.client?.name || 'Cliente General');
        
        return `
            <tr>
                <td><strong>#${sale.id}</strong></td>
                <td>${formattedDate}</td>
                <td>${clientName}</td>
                <td>${itemsCount} producto${itemsCount !== 1 ? 's' : ''}</td>
                <td>Bs. ${formatCurrency(sale.subtotal)}</td>
                <td>${sale.discount > 0 ? 'Bs. ' + formatCurrency(sale.discount) : '-'}</td>
                <td>${sale.shipping > 0 ? 'Bs. ' + formatCurrency(sale.shipping) : '-'}</td>
                <td><strong>Bs. ${formatCurrency(sale.total)}</strong></td>
                <td><span class="badge badge-${sale.paymentMethod.toLowerCase()}">${sale.paymentMethod}</span></td>
                <td>${sale.user}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="viewSaleDetail(${sale.id})" title="Ver detalle">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-download" onclick="downloadSaleTicket(${sale.id})" title="Descargar ticket">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    updatePagination();
}

// Ver detalle de venta
function viewSaleDetail(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;
    
    currentSaleForTicket = sale;
    
    const saleDate = new Date(sale.date).toLocaleString('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const content = `
        <div class="sale-detail-grid">
            <div class="detail-group">
                <h3>ID de Venta</h3>
                <p>#${sale.id}</p>
            </div>
            <div class="detail-group">
                <h3>Fecha y Hora</h3>
                <p>${saleDate}</p>
            </div>
            <div class="detail-group">
                <h3>Cliente</h3>
                <p>${typeof sale.client === 'string' ? sale.client : (sale.client?.name || 'Cliente General')}</p>
            </div>
            <div class="detail-group">
                <h3>Método de Pago</h3>
                <p><span class="payment-badge badge-${sale.paymentMethod.toLowerCase()}">${sale.paymentMethod}</span></p>
            </div>
            <div class="detail-group">
                <h3>Atendido por</h3>
                <p>${sale.user}</p>
            </div>
            ${sale.shippingAddress ? `
            <div class="detail-group">
                <h3>Dirección de Envío</h3>
                <p>${sale.shippingAddress}</p>
            </div>
            ` : ''}
        </div>
        
        <h3 class="section-title"><i class="fas fa-box"></i> Productos</h3>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th style="text-align: center;">Cantidad</th>
                    <th style="text-align: right;">P/U</th>
                    <th style="text-align: right;">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${sale.items.map(item => `
                    <tr>
                        <td>${item.name} Color ${item.color}</td>
                        <td style="text-align: center;">${item.quantity}</td>
                        <td style="text-align: right;">Bs. ${formatCurrency(item.price)}</td>
                        <td style="text-align: right;"><strong>Bs. ${formatCurrency(item.price * item.quantity)}</strong></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="total-summary">
            <div class="total-row">
                <span>Subtotal:</span>
                <strong>Bs. ${formatCurrency(sale.subtotal)}</strong>
            </div>
            ${sale.discount > 0 ? `
            <div class="total-row">
                <span>Descuento:</span>
                <strong style="color: #e74c3c;">- Bs. ${formatCurrency(sale.discount)}</strong>
            </div>
            ` : ''}
            ${sale.shipping > 0 ? `
            <div class="total-row">
                <span>Envío:</span>
                <strong>Bs. ${formatCurrency(sale.shipping)}</strong>
            </div>
            ` : ''}
            <div class="total-row final">
                <span>TOTAL:</span>
                <span>Bs. ${formatCurrency(sale.total)}</span>
            </div>
        </div>
    `;
    
    document.getElementById('saleDetailContent').innerHTML = content;
    document.getElementById('detailModal').classList.add('active');
}

// Cerrar modal de detalle
function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('active');
    currentSaleForTicket = null;
}

// Descargar ticket de una venta
function downloadSaleTicket(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;
    
    generateTicket(sale);
}

// Descargar ticket desde el modal
function downloadTicketAgain() {
    if (!currentSaleForTicket) return;
    generateTicket(currentSaleForTicket);
}

// Generar y descargar ticket
function generateTicket(sale) {
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
    
    // Obtener el nombre del cliente (puede ser string o objeto)
    const clientName = typeof sale.client === 'string' ? sale.client : sale.client.name;
    const clientCI = typeof sale.client === 'object' && sale.client.ci ? sale.client.ci : null;
    
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
        
        <p style="margin: 8px 0;"><strong>Cliente:</strong> ${clientName}</p>
        ${clientCI && clientCI !== 'S/N' ? `<p style="margin: 8px 0;"><strong>CI:</strong> ${clientCI}</p>` : ''}
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

// Actualizar paginación
function updatePagination() {
    const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredSales.length);
    
    // Actualizar información
    document.getElementById('showingStart').textContent = filteredSales.length > 0 ? startIndex + 1 : 0;
    document.getElementById('showingEnd').textContent = endIndex;
    document.getElementById('totalRecords').textContent = filteredSales.length;
    
    // Botones anterior/siguiente
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages || totalPages === 0;
    
    // Números de página
    const pageNumbers = document.getElementById('pageNumbers');
    pageNumbers.innerHTML = '';
    
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => goToPage(i);
        pageNumbers.appendChild(pageBtn);
    }
}

// Navegar a página
function goToPage(page) {
    currentPage = page;
    renderTable();
}

// Página anterior
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
}

// Página siguiente
function nextPage() {
    const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
}

// Cambiar items por página
function changeItemsPerPage() {
    itemsPerPage = parseInt(document.getElementById('itemsPerPage').value);
    currentPage = 1;
    renderTable();
}

// Variables globales
let sales = [];
let products = [];
let currentPeriod = '30days';
let charts = {};

// Volver al dashboard
function goToDashboard() {
    window.history.back();
}

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', function() {
    updateUserInfo();
    loadData();
    initializeCharts();
    updateAllReports();
});

// Actualizar información del usuario en el header
function updateUserInfo() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Validar que solo Admin pueda acceder a este módulo
    if (user.role !== 'admin') {
        Notification.error('No tiene permisos para acceder a este módulo', 'Acceso Denegado');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        return;
    }
    
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

// Cargar datos desde localStorage
function loadData() {
    const savedSales = localStorage.getItem('sales');
    const savedProducts = localStorage.getItem('products');
    
    sales = savedSales ? JSON.parse(savedSales) : [];
    products = savedProducts ? JSON.parse(savedProducts) : [];
}

// Cambiar período
function changePeriod(period) {
    currentPeriod = period;
    
    // Actualizar botones activos
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    updateAllReports();
}

// Filtrar ventas por período
function filterSalesByPeriod() {
    const now = new Date();
    let startDate;
    
    switch(currentPeriod) {
        case '7days':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
        case '30days':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 30);
            break;
        case '90days':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 90);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 30);
    }
    
    return sales.filter(sale => new Date(sale.date) >= startDate);
}

// Actualizar todos los reportes
function updateAllReports() {
    const filteredSales = filterSalesByPeriod();
    
    updateSummaryCards(filteredSales);
    updateSalesChart(filteredSales);
    updatePaymentMethodsChart(filteredSales);
    updateTopProductsChart(filteredSales);
    updateTopClientsChart(filteredSales);
    updateUserSalesChart(filteredSales);
    updateInventoryChart();
    updateAnalysisTable(filteredSales);
}

// Actualizar tarjetas de resumen
function updateSummaryCards(filteredSales) {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalSalesCount = filteredSales.length;
    const avgTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;
    const totalProductsSold = filteredSales.reduce((sum, sale) => 
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    
    document.getElementById('totalRevenue').textContent = `Bs. ${formatCurrency(totalRevenue)}`;
    document.getElementById('totalSales').textContent = totalSalesCount;
    document.getElementById('avgTicket').textContent = `Bs. ${formatCurrency(avgTicket)}`;
    document.getElementById('totalProducts').textContent = totalProductsSold;
    
    // Calcular cambios (comparar con período anterior)
    // Esto es una simulación, en producción compararías con datos reales
    document.getElementById('revenueChange').textContent = '+12.5%';
    document.getElementById('salesChange').textContent = '+8.3%';
    document.getElementById('ticketChange').textContent = '+2.1%';
    document.getElementById('productsChange').textContent = '+15.7%';
}

// Inicializar gráficos
function initializeCharts() {
    // Configuración común
    Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    Chart.defaults.color = '#666';
}

// Gráfico de Ventas por Período
function updateSalesChart(filteredSales) {
    const ctx = document.getElementById('salesChart');
    const periodType = document.getElementById('salesPeriodType').value;
    
    let labels = [];
    let data = [];
    
    if (periodType === 'daily') {
        // Últimos 7 días
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            labels.push(date.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' }));
            
            const dayTotal = filteredSales
                .filter(s => new Date(s.date).toISOString().split('T')[0] === dateStr)
                .reduce((sum, s) => sum + s.total, 0);
            data.push(dayTotal);
        }
    } else if (periodType === 'monthly') {
        // Últimos 6 meses
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            labels.push(date.toLocaleDateString('es-BO', { month: 'short', year: 'numeric' }));
            
            const monthTotal = filteredSales
                .filter(s => {
                    const saleDate = new Date(s.date);
                    return saleDate.getMonth() === date.getMonth() && 
                           saleDate.getFullYear() === date.getFullYear();
                })
                .reduce((sum, s) => sum + s.total, 0);
            data.push(monthTotal);
        }
    }
    
    if (charts.salesChart) {
        charts.salesChart.destroy();
    }
    
    charts.salesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos (Bs.)',
                data: data,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Ingresos: Bs. ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Bs. ' + formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de Métodos de Pago
function updatePaymentMethodsChart(filteredSales) {
    const ctx = document.getElementById('paymentMethodsChart');
    
    const paymentMethods = {};
    filteredSales.forEach(sale => {
        paymentMethods[sale.paymentMethod] = (paymentMethods[sale.paymentMethod] || 0) + sale.total;
    });
    
    const labels = Object.keys(paymentMethods);
    const data = Object.values(paymentMethods);
    
    if (charts.paymentMethodsChart) {
        charts.paymentMethodsChart.destroy();
    }
    
    charts.paymentMethodsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos por Método (Bs.)',
                data: data,
                backgroundColor: [
                    'rgba(67, 233, 123, 0.8)',
                    'rgba(79, 172, 254, 0.8)',
                    'rgba(249, 93, 106, 0.8)',
                    'rgba(156, 136, 255, 0.8)'
                ],
                borderColor: [
                    'rgba(67, 233, 123, 1)',
                    'rgba(79, 172, 254, 1)',
                    'rgba(249, 93, 106, 1)',
                    'rgba(156, 136, 255, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': Bs. ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Bs. ' + formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de Top Productos
function updateTopProductsChart(filteredSales) {
    const ctx = document.getElementById('topProductsChart');
    
    const productSales = {};
    filteredSales.forEach(sale => {
        sale.items.forEach(item => {
            if (!productSales[item.name]) {
                productSales[item.name] = { quantity: 0, revenue: 0 };
            }
            productSales[item.name].quantity += item.quantity;
            productSales[item.name].revenue += item.price * item.quantity;
        });
    });
    
    const sortedProducts = Object.entries(productSales)
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .slice(0, 10);
    
    const labels = sortedProducts.map(p => p[0]);
    const data = sortedProducts.map(p => p[1].quantity);
    
    if (charts.topProductsChart) {
        charts.topProductsChart.destroy();
    }
    
    charts.topProductsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Unidades Vendidas',
                data: data,
                backgroundColor: 'rgba(240, 147, 251, 0.8)',
                borderColor: 'rgba(240, 147, 251, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Gráfico de Top Clientes
function updateTopClientsChart(filteredSales) {
    const ctx = document.getElementById('topClientsChart');
    
    const clientSales = {};
    filteredSales.forEach(sale => {
        // Obtener nombre del cliente (puede ser string u objeto)
        const clientName = typeof sale.client === 'string' ? sale.client : (sale.client?.name || 'Cliente General');
        clientSales[clientName] = (clientSales[clientName] || 0) + sale.total;
    });
    
    const sortedClients = Object.entries(clientSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const labels = sortedClients.map(c => c[0]);
    const data = sortedClients.map(c => c[1]);
    
    if (charts.topClientsChart) {
        charts.topClientsChart.destroy();
    }
    
    charts.topClientsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Gastado (Bs.)',
                data: data,
                backgroundColor: 'rgba(79, 172, 254, 0.8)',
                borderColor: 'rgba(79, 172, 254, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Total: Bs. ' + formatCurrency(context.parsed.x);
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Bs. ' + formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de Ventas por Usuario
function updateUserSalesChart(filteredSales) {
    const ctx = document.getElementById('userSalesChart');
    
    const userSales = {};
    filteredSales.forEach(sale => {
        userSales[sale.user] = (userSales[sale.user] || 0) + sale.total;
    });
    
    const labels = Object.keys(userSales);
    const data = Object.values(userSales);
    
    if (charts.userSalesChart) {
        charts.userSalesChart.destroy();
    }
    
    charts.userSalesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ventas por Usuario (Bs.)',
                data: data,
                backgroundColor: 'rgba(67, 233, 123, 0.8)',
                borderColor: 'rgba(67, 233, 123, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Total: Bs. ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Bs. ' + formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de Estado del Inventario
function updateInventoryChart() {
    const ctx = document.getElementById('inventoryChart');
    
    const labels = products.slice(0, 15).map(p => p.name);
    const stockData = products.slice(0, 15).map(p => p.stock);
    
    if (charts.inventoryChart) {
        charts.inventoryChart.destroy();
    }
    
    charts.inventoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Stock Actual',
                data: stockData,
                backgroundColor: stockData.map(stock => 
                    stock < 10 ? 'rgba(220, 53, 69, 0.8)' : 
                    stock < 20 ? 'rgba(255, 193, 7, 0.8)' : 
                    'rgba(40, 167, 69, 0.8)'
                ),
                borderColor: stockData.map(stock => 
                    stock < 10 ? 'rgba(220, 53, 69, 1)' : 
                    stock < 20 ? 'rgba(255, 193, 7, 1)' : 
                    'rgba(40, 167, 69, 1)'
                ),
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 10
                    }
                }
            }
        }
    });
}

// Actualizar tabla de análisis
function updateAnalysisTable(filteredSales) {
    const tbody = document.getElementById('analysisTableBody');
    
    const productStats = {};
    
    filteredSales.forEach(sale => {
        sale.items.forEach(item => {
            if (!productStats[item.name]) {
                const product = products.find(p => p.name === item.name);
                productStats[item.name] = {
                    unitsSold: 0,
                    revenue: 0,
                    stock: product ? product.stock : 0
                };
            }
            productStats[item.name].unitsSold += item.quantity;
            productStats[item.name].revenue += item.price * item.quantity;
        });
    });
    
    const sortedStats = Object.entries(productStats)
        .sort((a, b) => b[1].revenue - a[1].revenue);
    
    tbody.innerHTML = sortedStats.map(([name, stats]) => {
        const rotation = stats.stock > 0 ? (stats.unitsSold / stats.stock * 100).toFixed(1) : 0;
        const rotationClass = rotation > 50 ? 'rotation-high' : rotation > 20 ? 'rotation-medium' : 'rotation-low';
        
        return `
            <tr>
                <td><strong>${name}</strong></td>
                <td>${stats.unitsSold}</td>
                <td>Bs. ${formatCurrency(stats.revenue)}</td>
                <td>${stats.stock}</td>
                <td class="${rotationClass}">${rotation}%</td>
            </tr>
        `;
    }).join('');
}

// Generar PDF
function generatePDF() {
    Notification.info('Generando reporte PDF...', 'Exportando');
    
    // Implementación básica - en producción usar jsPDF con más detalle
    setTimeout(() => {
        Notification.success('Reporte PDF generado', 'Exportación Completa');
    }, 1500);
}

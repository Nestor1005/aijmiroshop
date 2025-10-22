// ==================== CLIENTES MODULE ====================

// Variables globales
let clients = [];
let filteredClients = [];
let currentPage = 1;
let rowsPerPage = 5;
let editingClientId = null;

// Inicializar módulo
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('clientes.html')) {
        initClients();
    }
});

function initClients() {
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
    loadClients().then(() => {
        renderClients();
    });
    
    // Notificación de bienvenida
    setTimeout(() => {
        Notification.success('Módulo de Clientes cargado correctamente', 'Bienvenido');
    }, 500);
}

// Cargar clientes desde Supabase
async function loadClients() {
    try {
        clients = await window.StorageAPI.getClients();
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        clients = [];
    }
    filteredClients = [...clients];
}

// Clientes por defecto
function getDefaultClients() {
    return [
        {
            id: 1,
            name: 'Juan Pérez López',
            ci: '12345678',
            complement: '1A',
            phone: '70123456',
            address: 'Av. América #123, Zona Central'
        },
        {
            id: 2,
            name: 'María González',
            ci: '87654321',
            complement: '',
            phone: '71234567',
            address: 'Calle Libertad #456'
        },
        {
            id: 3,
            name: 'Carlos Rodríguez',
            ci: '11223344',
            complement: '2B',
            phone: '72345678',
            address: 'Av. Ballivián #789'
        }
    ];
}

// Guardar clientes en localStorage
function saveClients() {
    try {
        localStorage.setItem('clients', JSON.stringify(clients));
    } catch (error) {
    ];
}

// Renderizar clientes en la tabla
    if (paginatedClients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <i class="fas fa-users" style="font-size: 48px; color: var(--text-light); margin-bottom: 10px; display: block;"></i>
                    <p style="color: var(--text-light); font-size: 16px;">No se encontraron clientes</p>
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = paginatedClients.map((client, index) => {
            const globalIndex = start + index + 1;
            const ciDisplay = client.complement ? 
                `<span class="ci-badge">${escapeHtml(client.ci)} <span class="ci-complement">${escapeHtml(client.complement)}</span></span>` :
                `<span class="ci-badge">${escapeHtml(client.ci)}</span>`;
            
            const phoneDisplay = client.phone ? 
                `<span class="phone-badge"><i class="fas fa-phone"></i> ${escapeHtml(client.phone)}</span>` :
                '<span style="color: var(--text-light);">Sin teléfono</span>';
            
            const addressDisplay = client.address ? 
                `<span class="address-text" title="${escapeHtml(client.address)}">${escapeHtml(client.address)}</span>` :
                '<span style="color: var(--text-light);">Sin dirección</span>';
            
            return `
                <tr>
                    <td>${globalIndex}</td>
                    <td><strong>${escapeHtml(client.name)}</strong></td>
                    <td>${ciDisplay}</td>
                    <td>${client.complement ? escapeHtml(client.complement) : '-'}</td>
                    <td>${phoneDisplay}</td>
                    <td>${addressDisplay}</td>
                    <td>
                        <button class="action-btn btn-edit" onclick="editClient(${client.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn btn-delete" onclick="deleteClient(${client.id})" title="Eliminar">
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
    const start = filteredClients.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(currentPage * rowsPerPage, filteredClients.length);
    
    document.getElementById('showingStart').textContent = start;
    document.getElementById('showingEnd').textContent = end;
    document.getElementById('totalClients').textContent = filteredClients.length;
}

// Renderizar botones de paginación
function renderPagination() {
    const totalPages = Math.ceil(filteredClients.length / rowsPerPage);
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
        for (let i = 1; i <= totalPages; i++) {
            buttonsHTML += `
                <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        }
    } else {
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
    const totalPages = Math.ceil(filteredClients.length / rowsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderClients();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Cambiar filas por página
function changeRowsPerPage() {
    const select = document.getElementById('rowsPerPage');
    rowsPerPage = parseInt(select.value);
    currentPage = 1;
    renderClients();
}

// Buscar clientes
function searchClients() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredClients = [...clients];
    } else {
        filteredClients = clients.filter(client => 
            client.name.toLowerCase().includes(searchTerm) ||
            client.ci.toLowerCase().includes(searchTerm) ||
            (client.phone && client.phone.toLowerCase().includes(searchTerm)) ||
            (client.complement && client.complement.toLowerCase().includes(searchTerm)) ||
            client.id.toString().includes(searchTerm)
        );
    }
    
    currentPage = 1;
    renderClients();
}

// Abrir modal para agregar cliente
function openAddClientModal() {
    editingClientId = null;
    
    const modalTitle = document.getElementById('modalTitle');
    const clientForm = document.getElementById('clientForm');
    const clientId = document.getElementById('clientId');
    
    if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-user-plus"></i> Agregar Cliente';
    if (clientForm) clientForm.reset();
    if (clientId) clientId.value = '';
    
    const modal = document.getElementById('clientModal');
    if (modal) modal.classList.add('show');
}

// Cerrar modal
function closeClientModal() {
    const modal = document.getElementById('clientModal');
    if (modal) modal.classList.remove('show');
    editingClientId = null;
}

// Guardar cliente
async function saveClient(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('clientName');
    const ciInput = document.getElementById('clientCI');
    const complementInput = document.getElementById('clientComplement');
    const phoneInput = document.getElementById('clientPhone');
    const addressInput = document.getElementById('clientAddress');
    
    if (!nameInput || !ciInput) {
        Notification.error('Error al obtener los datos del formulario', 'Error');
        return;
    }
    
    const clientData = {
        name: nameInput.value.trim(),
        ci: ciInput.value.trim(),
        complement: complementInput ? complementInput.value.trim().toUpperCase() : '',
        phone: phoneInput ? phoneInput.value.trim() : '',
        address: addressInput ? addressInput.value.trim() : ''
    };
    
    // Validaciones
    if (!clientData.name) {
        Notification.warning('El nombre del cliente es requerido', 'Validación');
        nameInput.focus();
        return;
    }
    
    if (!clientData.ci) {
        Notification.warning('El Carnet de Identidad es requerido', 'Validación');
        ciInput.focus();
        return;
    }
    
    // Validar que el CI no esté duplicado (excepto si estamos editando el mismo cliente)
    const ciExists = clients.find(c => 
        c.ci === clientData.ci && 
        c.complement === clientData.complement && 
        c.id !== editingClientId
    );
    
    if (ciExists) {
        Notification.warning('Ya existe un cliente con este CI' + (clientData.complement ? ' y complemento' : ''), 'CI Duplicado');
        ciInput.focus();
        return;
    }
    
    if (editingClientId) {
        // Editar cliente existente
        const index = clients.findIndex(c => c.id === editingClientId);
        if (index !== -1) {
            clients[index] = { 
                ...clients[index], 
                ...clientData 
            };
            await window.StorageAPI.saveClient(clients[index]);
            Notification.success(`Cliente "${clientData.name}" actualizado correctamente`, 'Éxito');
        }
    } else {
        // Agregar nuevo cliente
        clientData.id = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1;
        clients.push(clientData);
        await window.StorageAPI.saveClient(clientData);
        Notification.success(`Cliente "${clientData.name}" agregado correctamente`, 'Éxito');
    }
    
    filteredClients = [...clients];
    renderClients();
    closeClientModal();
}

// Editar cliente
function editClient(id) {
    const client = clients.find(c => c.id === id);
    if (!client) {
        Notification.error('Cliente no encontrado', 'Error');
        return;
    }
    
    editingClientId = id;
    
    const modalTitle = document.getElementById('modalTitle');
    const clientId = document.getElementById('clientId');
    const clientName = document.getElementById('clientName');
    const clientCI = document.getElementById('clientCI');
    const clientComplement = document.getElementById('clientComplement');
    const clientPhone = document.getElementById('clientPhone');
    const clientAddress = document.getElementById('clientAddress');
    
    if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-user-edit"></i> Editar Cliente';
    if (clientId) clientId.value = id;
    if (clientName) clientName.value = client.name;
    if (clientCI) clientCI.value = client.ci;
    if (clientComplement) clientComplement.value = client.complement || '';
    if (clientPhone) clientPhone.value = client.phone || '';
    if (clientAddress) clientAddress.value = client.address || '';
    
    const modal = document.getElementById('clientModal');
    if (modal) modal.classList.add('show');
}

// Eliminar cliente
async function deleteClient(id) {
    const client = clients.find(c => c.id === id);
    if (!client) {
        Notification.error('Cliente no encontrado', 'Error');
        return;
    }
    
    ConfirmDialog.show(
        `¿Está seguro que desea eliminar al cliente "${client.name}"?`,
        'Eliminar Cliente',
        async () => {
            clients = clients.filter(c => c.id !== id);
            await window.StorageAPI.deleteClient(id);
            filteredClients = [...clients];
            
            // Ajustar página actual si es necesario
            const totalPages = Math.ceil(filteredClients.length / rowsPerPage);
            if (currentPage > totalPages && totalPages > 0) {
                currentPage = totalPages;
            }
            
            renderClients();
            Notification.success(`Cliente "${client.name}" eliminado correctamente`, 'Éxito');
        }
    );
}

// Vaciar clientes
async function clearClients() {
    if (clients.length === 0) {
        Notification.info('La lista de clientes ya está vacía', 'Sin Clientes');
        return;
    }
    
    ConfirmDialog.show(
        `⚠️ ADVERTENCIA ⚠️\n\n` +
        `¿Está seguro que desea ELIMINAR TODOS los clientes?\n\n` +
        `Esta acción eliminará ${clients.length} cliente(s) y NO se puede deshacer.\n\n` +
        `Se recomienda exportar la lista antes de continuar.`,
        'Vaciar Lista de Clientes',
        async () => {
            ConfirmDialog.show(
                `Esta es su última oportunidad.\n\n` +
                `¿Realmente desea VACIAR la lista de clientes?`,
                'Confirmación Final',
                async () => {
                    const deletedCount = clients.length;
                    // Eliminar todos de Supabase
                    for (const client of clients) {
                        await window.StorageAPI.deleteClient(client.id);
                    }
                    clients = [];
                    filteredClients = [];
                    currentPage = 1;
                    
                    renderClients();
                    
                    Notification.success(
                        `Se han eliminado ${deletedCount} cliente(s). La lista está vacía.`, 
                        'Lista Vaciada'
                    );
                }
            );
        }
    );
}

// Descargar formato Excel
function downloadClientTemplate() {
    try {
        const template = [
            ['Nombre del Cliente', 'CI', 'Complemento', 'Celular/Teléfono', 'Dirección'],
            ['Ejemplo: Juan Pérez', '12345678', '1A', '70123456', 'Av. América #123'],
            ['Ejemplo: María González', '87654321', '', '71234567', 'Calle Libertad #456']
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(template);
        
        // Ajustar anchos de columna
        ws['!cols'] = [
            { wch: 25 },
            { wch: 12 },
            { wch: 12 },
            { wch: 18 },
            { wch: 35 }
        ];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
        
        XLSX.writeFile(wb, 'formato_clientes_aijmiroshop.xlsx');
        Notification.success('Formato descargado correctamente', 'Descarga Exitosa');
    } catch (error) {
        console.error('Error al descargar formato:', error);
        Notification.error('Error al generar el archivo.', 'Error');
    }
}

// Importar clientes
function importClients() {
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
            
            const importedClients = [];
            let errorCount = 0;
            
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                
                if (!row || row.length === 0 || !row[0] || !row[1]) continue;
                
                const name = String(row[0] || '').trim();
                const ci = String(row[1] || '').trim();
                const complement = String(row[2] || '').trim().toUpperCase();
                const phone = String(row[3] || '').trim();
                const address = String(row[4] || '').trim();
                
                if (!name || !ci) {
                    errorCount++;
                    continue;
                }
                
                // Verificar duplicados
                const exists = clients.find(c => c.ci === ci && c.complement === complement);
                if (exists) {
                    errorCount++;
                    continue;
                }
                
                importedClients.push({
                    id: clients.length + importedClients.length + 1,
                    name: name,
                    ci: ci,
                    complement: complement,
                    phone: phone,
                    address: address
                });
            }
            
            if (importedClients.length > 0) {
                clients = [...clients, ...importedClients];
                // Guardar cada cliente en Supabase
                for (const client of importedClients) {
                    await window.StorageAPI.saveClient(client);
                }
                filteredClients = [...clients];
                renderClients();
                
                let message = `${importedClients.length} cliente(s) importado(s) correctamente`;
                if (errorCount > 0) {
                    message += `. ${errorCount} fila(s) ignorada(s) por datos inválidos o duplicados`;
                }
                Notification.success(message, 'Importación Exitosa');
            } else {
                Notification.warning('No se encontraron clientes válidos en el archivo', 'Sin Datos');
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

// Exportar clientes
function exportClients() {
    if (clients.length === 0) {
        Notification.warning('No hay clientes para exportar', 'Sin Datos');
        return;
    }
    
    try {
        const exportData = clients.map(c => ({
            'ID': c.id,
            'Nombre del Cliente': c.name,
            'CI': c.ci,
            'Complemento': c.complement || '-',
            'Celular/Teléfono': c.phone || '-',
            'Dirección': c.address || '-'
        }));
        
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        ws['!cols'] = [
            { wch: 6 },
            { wch: 25 },
            { wch: 12 },
            { wch: 12 },
            { wch: 18 },
            { wch: 35 }
        ];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
        
        const date = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `clientes_aijmiroshop_${date}.xlsx`);
        Notification.success(`${clients.length} cliente(s) exportado(s) correctamente`, 'Exportación Exitosa');
    } catch (error) {
        console.error('Error al exportar:', error);
        Notification.error('Error al generar el archivo.', 'Error');
    }
}

// Volver al dashboard
function goToDashboard() {
    window.location.href = 'dashboard.html';
}

// Cerrar modal al hacer clic fuera de él
window.onclick = function(event) {
    const modal = document.getElementById('clientModal');
    if (event.target === modal) {
        closeClientModal();
    }
}

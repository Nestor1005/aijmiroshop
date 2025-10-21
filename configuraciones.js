// Variables globales
let operators = [];
let editingOperatorId = null;

// Volver al dashboard
function goToDashboard() {
    window.history.back();
}

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', function() {
    updateUserInfo();
    loadOperators();
    loadAdminInfo();
    loadTicketSettings();
    renderOperatorsTable();
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

// Cargar operarios desde localStorage
function loadOperators() {
    const savedOperators = localStorage.getItem('operators');
    operators = savedOperators ? JSON.parse(savedOperators) : [];
}

// Guardar operarios en localStorage
function saveOperators() {
    localStorage.setItem('operators', JSON.stringify(operators));
}

// Cargar información del admin
function loadAdminInfo() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const admin = users.find(u => u.role === 'admin');
    
    if (admin) {
        document.getElementById('currentUsername').textContent = admin.username;
        document.getElementById('currentName').textContent = admin.name;
    }
}

// Cambiar entre tabs
function switchTab(tabName) {
    // Actualizar botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Actualizar contenido
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tabName === 'admin') {
        document.getElementById('adminTab').classList.add('active');
    } else if (tabName === 'operators') {
        document.getElementById('operatorsTab').classList.add('active');
        renderOperatorsTable();
    } else if (tabName === 'ticket') {
        document.getElementById('ticketTab').classList.add('active');
    }
}

// Actualizar credenciales del admin
function updateAdminCredentials(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('adminCurrentPassword').value;
    const newUsername = document.getElementById('adminNewUsername').value;
    const newName = document.getElementById('adminNewName').value;
    const newPassword = document.getElementById('adminNewPassword').value;
    const confirmPassword = document.getElementById('adminConfirmPassword').value;
    
    // Obtener usuarios
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const adminIndex = users.findIndex(u => u.role === 'admin');
    
    if (adminIndex === -1) {
        Notification.error('No se encontró el usuario administrador', 'Error');
        return;
    }
    
    const admin = users[adminIndex];
    
    // Verificar contraseña actual
    if (admin.password !== currentPassword) {
        Notification.error('La contraseña actual es incorrecta', 'Error de Autenticación');
        return;
    }
    
    // Validar nueva contraseña si se ingresó
    if (newPassword && newPassword !== confirmPassword) {
        Notification.error('Las contraseñas no coinciden', 'Error de Validación');
        return;
    }
    
    // Actualizar datos
    if (newUsername) admin.username = newUsername;
    if (newName) admin.name = newName;
    if (newPassword) admin.password = newPassword;
    
    users[adminIndex] = admin;
    localStorage.setItem('users', JSON.stringify(users));
    
    // Actualizar sesión si está activo
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (currentUser && currentUser.role === 'admin') {
        currentUser.username = admin.username;
        currentUser.name = admin.name;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    Notification.success('Credenciales actualizadas correctamente', 'Cambios Guardados');
    
    // Limpiar formulario
    document.getElementById('adminForm').reset();
    loadAdminInfo();
}

// Abrir modal para agregar operario
function openAddOperatorModal() {
    editingOperatorId = null;
    document.getElementById('operatorModalTitle').innerHTML = '<i class="fas fa-user-plus"></i> Agregar Operario';
    document.getElementById('operatorForm').reset();
    document.getElementById('operatorId').value = '';
    document.getElementById('operatorModal').style.display = 'flex';
}

// Abrir modal para editar operario
function openEditOperatorModal(id) {
    editingOperatorId = id;
    const operator = operators.find(op => op.id === id);
    
    if (!operator) return;
    
    document.getElementById('operatorModalTitle').innerHTML = '<i class="fas fa-user-edit"></i> Editar Operario';
    document.getElementById('operatorId').value = operator.id;
    document.getElementById('operatorUsername').value = operator.username;
    document.getElementById('operatorName').value = operator.name;
    document.getElementById('operatorPassword').value = operator.password;
    document.getElementById('operatorConfirmPassword').value = operator.password;
    
    document.getElementById('operatorModal').style.display = 'flex';
}

// Cerrar modal
function closeOperatorModal() {
    document.getElementById('operatorModal').style.display = 'none';
    editingOperatorId = null;
}

// Guardar operario
function saveOperator(event) {
    event.preventDefault();
    
    const username = document.getElementById('operatorUsername').value.trim();
    const name = document.getElementById('operatorName').value.trim();
    const password = document.getElementById('operatorPassword').value;
    const confirmPassword = document.getElementById('operatorConfirmPassword').value;
    
    // Validaciones
    if (!username || !name || !password) {
        Notification.error('Todos los campos son obligatorios', 'Error de Validación');
        return;
    }
    
    if (password.length < 4) {
        Notification.error('La contraseña debe tener al menos 4 caracteres', 'Error de Validación');
        return;
    }
    
    if (password !== confirmPassword) {
        Notification.error('Las contraseñas no coinciden', 'Error de Validación');
        return;
    }
    
    // Verificar si el usuario ya existe
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const usernameExists = users.some(u => u.username === username && (!editingOperatorId || u.id !== editingOperatorId));
    
    if (usernameExists) {
        Notification.error('El nombre de usuario ya está en uso', 'Usuario Duplicado');
        return;
    }
    
    if (editingOperatorId) {
        // Editar operario existente
        const index = operators.findIndex(op => op.id === editingOperatorId);
        if (index !== -1) {
            operators[index] = {
                ...operators[index],
                username,
                name,
                password
            };
            
            // Actualizar también en users
            const userIndex = users.findIndex(u => u.id === editingOperatorId);
            if (userIndex !== -1) {
                users[userIndex] = {
                    ...users[userIndex],
                    username,
                    name,
                    password
                };
                localStorage.setItem('users', JSON.stringify(users));
            }
            
            Notification.success('Operario actualizado correctamente', 'Cambios Guardados');
        }
    } else {
        // Crear nuevo operario
        const newOperator = {
            id: Date.now(),
            username,
            name,
            password,
            role: 'operator',
            active: true,
            createdAt: new Date().toISOString()
        };
        
        operators.push(newOperator);
        users.push(newOperator);
        localStorage.setItem('users', JSON.stringify(users));
        
        Notification.success(`Operario ${name} creado correctamente`, 'Operario Agregado');
    }
    
    saveOperators();
    renderOperatorsTable();
    closeOperatorModal();
}

// Renderizar tabla de operarios
function renderOperatorsTable() {
    const tbody = document.getElementById('operatorsTableBody');
    
    if (operators.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-users" style="font-size: 48px; display: block; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p style="margin: 0; font-size: 16px;">No hay operarios registrados</p>
                    <small>Haz clic en "Agregar Operario" para crear uno nuevo</small>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = operators.map((operator, index) => {
        const createdDate = new Date(operator.createdAt).toLocaleDateString('es-BO');
        const statusClass = operator.active ? 'status-active' : 'status-inactive';
        const statusText = operator.active ? 'Activo' : 'Inactivo';
        
        return `
            <tr>
                <td><strong>${index + 1}</strong></td>
                <td><strong>${operator.username}</strong></td>
                <td>${operator.name}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${createdDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="openEditOperatorModal(${operator.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-toggle" onclick="toggleOperatorStatus(${operator.id})" title="${operator.active ? 'Desactivar' : 'Activar'}">
                            <i class="fas fa-${operator.active ? 'toggle-on' : 'toggle-off'}"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteOperator(${operator.id})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Cambiar estado del operario
function toggleOperatorStatus(id) {
    const index = operators.findIndex(op => op.id === id);
    if (index === -1) return;
    
    operators[index].active = !operators[index].active;
    
    // Actualizar también en users
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex !== -1) {
        users[userIndex].active = operators[index].active;
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    saveOperators();
    renderOperatorsTable();
    
    const status = operators[index].active ? 'activado' : 'desactivado';
    Notification.success(`Operario ${status} correctamente`, 'Estado Actualizado');
}

// Eliminar operario
function deleteOperator(id) {
    const operator = operators.find(op => op.id === id);
    if (!operator) return;
    
    ConfirmDialog.show(
        `¿Estás seguro de eliminar al operario "${operator.name}"?`,
        'Eliminar Operario',
        () => {
            operators = operators.filter(op => op.id !== id);
            
            // Eliminar también de users
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const filteredUsers = users.filter(u => u.id !== id);
            localStorage.setItem('users', JSON.stringify(filteredUsers));
            
            saveOperators();
            renderOperatorsTable();
            
            Notification.success(`Operario ${operator.name} eliminado correctamente`, 'Operario Eliminado');
        }
    );
}

// ==================== CONFIGURACIÓN DE TICKET ====================

// Cargar configuración del ticket
function loadTicketSettings() {
    const settings = JSON.parse(localStorage.getItem('ticketSettings')) || {
        companyName: 'AIJMIROSHOP',
        subtitle: 'Sistema de Gestión de Inventario',
        startNumber: 1,
        footerMessage: '¡Gracias por su compra!'
    };
    
    document.getElementById('ticketCompanyName').value = settings.companyName;
    document.getElementById('ticketSubtitle').value = settings.subtitle;
    document.getElementById('ticketStartNumber').value = settings.startNumber;
    document.getElementById('ticketFooterMessage').value = settings.footerMessage;
    
    updatePreview();
}

// Actualizar vista previa
function updatePreview() {
    const companyName = document.getElementById('ticketCompanyName').value;
    const subtitle = document.getElementById('ticketSubtitle').value;
    const startNumber = document.getElementById('ticketStartNumber').value;
    const footerMessage = document.getElementById('ticketFooterMessage').value;
    
    document.getElementById('previewCompanyName').textContent = companyName;
    document.getElementById('previewSubtitle').textContent = subtitle;
    document.getElementById('previewStartNumber').textContent = startNumber;
    document.getElementById('previewFooterMessage').textContent = footerMessage;
}

// Escuchar cambios en los inputs para actualizar preview en tiempo real
document.addEventListener('DOMContentLoaded', function() {
    const inputs = ['ticketCompanyName', 'ticketSubtitle', 'ticketStartNumber', 'ticketFooterMessage'];
    inputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('input', updatePreview);
        }
    });
});

// Guardar configuración del ticket
function updateTicketSettings(event) {
    event.preventDefault();
    
    const settings = {
        companyName: document.getElementById('ticketCompanyName').value,
        subtitle: document.getElementById('ticketSubtitle').value,
        startNumber: parseInt(document.getElementById('ticketStartNumber').value),
        footerMessage: document.getElementById('ticketFooterMessage').value
    };
    
    localStorage.setItem('ticketSettings', JSON.stringify(settings));
    
    // Si el número inicial cambió, actualizar el contador de ventas
    const currentSales = JSON.parse(localStorage.getItem('sales')) || [];
    if (currentSales.length === 0) {
        // Solo actualizar si no hay ventas registradas
        localStorage.setItem('nextSaleId', settings.startNumber);
    }
    
    Notification.success('Configuración del ticket guardada correctamente', 'Configuración Guardada');
}

// Restaurar valores predeterminados
function resetTicketSettings() {
    ConfirmDialog.show(
        '¿Estás seguro de restaurar los valores predeterminados del ticket?',
        'Restaurar Configuración',
        () => {
            const defaultSettings = {
                companyName: 'AIJMIROSHOP',
                subtitle: 'Sistema de Gestión de Inventario',
                startNumber: 1,
                footerMessage: '¡Gracias por su compra!'
            };
            
            localStorage.setItem('ticketSettings', JSON.stringify(defaultSettings));
            loadTicketSettings();
            
            Notification.success('Configuración restaurada a valores predeterminados', 'Restaurado');
        }
    );
}

// Función para obtener configuración del ticket (para usar en otros módulos)
function getTicketSettings() {
    return JSON.parse(localStorage.getItem('ticketSettings')) || {
        companyName: 'AIJMIROSHOP',
        subtitle: 'Sistema de Gestión de Inventario',
        startNumber: 1,
        footerMessage: '¡Gracias por su compra!'
    };
}

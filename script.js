// Utilidades para formato de moneda boliviana (BOB)
const formatCurrency = (amount) => {
    // Convertir a número y redondear a 2 decimales
    const num = Number(amount).toFixed(2);
    
    // Separar parte entera y decimal
    const parts = num.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    // Agregar separador de miles (punto)
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    // Retornar con coma como separador decimal
    return formattedInteger + ',' + decimalPart;
};

// ==================== SISTEMA DE NOTIFICACIONES ====================
const Notification = {
    show: function(message, type = 'info', title = '') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Definir iconos según el tipo
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        // Definir títulos por defecto
        const defaultTitles = {
            success: 'Éxito',
            error: 'Error',
            warning: 'Advertencia',
            info: 'Información'
        };
        
        const finalTitle = title || defaultTitles[type];
        const icon = icons[type] || icons.info;
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${finalTitle}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(notification);
        
        // Agregar evento de cierre al botón
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            Notification.close(notification);
        });
        
        // Auto-cerrar después de 5 segundos
        setTimeout(() => {
            Notification.close(notification);
        }, 5000);
    },
    
    close: function(element) {
        if (!element) return;
        
        const notification = element.classList && element.classList.contains('notification') 
            ? element 
            : element.closest('.notification');
            
        if (notification && notification.parentNode) {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    },
    
    success: function(message, title) {
        this.show(message, 'success', title);
    },
    
    error: function(message, title) {
        this.show(message, 'error', title);
    },
    
    warning: function(message, title) {
        this.show(message, 'warning', title);
    },
    
    info: function(message, title) {
        this.show(message, 'info', title);
    }
};

// Sistema de Confirmación Personalizado
const ConfirmDialog = {
    show: function(message, title = '¿Está seguro?', onConfirm, onCancel) {
        // Crear el modal de confirmación
        const modal = document.createElement('div');
        modal.className = 'confirm-modal-overlay';
        modal.innerHTML = `
            <div class="confirm-modal">
                <div class="confirm-modal-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>${title}</h3>
                </div>
                <div class="confirm-modal-body">
                    <p>${message}</p>
                </div>
                <div class="confirm-modal-footer">
                    <button class="btn-cancel-confirm" id="confirmCancel">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button class="btn-confirm" id="confirmAccept">
                        <i class="fas fa-check"></i> Confirmar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Agregar estilos si no existen
        if (!document.getElementById('confirm-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'confirm-modal-styles';
            style.textContent = `
                .confirm-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    animation: fadeIn 0.2s ease;
                }
                
                .confirm-modal {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                    max-width: 450px;
                    width: 90%;
                    animation: slideDown 0.3s ease;
                }
                
                .confirm-modal-header {
                    background: linear-gradient(135deg, #f39c12, #e67e22);
                    color: white;
                    padding: 20px 25px;
                    border-radius: 12px 12px 0 0;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                
                .confirm-modal-header i {
                    font-size: 24px;
                }
                
                .confirm-modal-header h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                }
                
                .confirm-modal-body {
                    padding: 30px 25px;
                }
                
                .confirm-modal-body p {
                    margin: 0;
                    font-size: 15px;
                    line-height: 1.6;
                    color: #2c3e50;
                    white-space: pre-line;
                }
                
                .confirm-modal-footer {
                    padding: 20px 25px;
                    border-top: 1px solid #e0e0e0;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                
                .btn-cancel-confirm,
                .btn-confirm {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .btn-cancel-confirm {
                    background: #6c757d;
                    color: white;
                }
                
                .btn-cancel-confirm:hover {
                    background: #5a6268;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
                }
                
                .btn-confirm {
                    background: linear-gradient(135deg, #e74c3c, #c0392b);
                    color: white;
                }
                
                .btn-confirm:hover {
                    background: linear-gradient(135deg, #c0392b, #e74c3c);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
                }
                
                @keyframes slideDown {
                    from {
                        transform: translateY(-50px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Manejar eventos
        const btnCancel = modal.querySelector('#confirmCancel');
        const btnAccept = modal.querySelector('#confirmAccept');
        
        btnCancel.onclick = () => {
            modal.remove();
            if (onCancel) onCancel();
        };
        
        btnAccept.onclick = () => {
            modal.remove();
            if (onConfirm) onConfirm();
        };
        
        // Cerrar al hacer clic fuera
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                if (onCancel) onCancel();
            }
        };
    }
};

// Credenciales de prueba (en producción usar base de datos y encriptación)
const users = {
    admin: {
        id: 1,
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        name: 'Administrador'
    },
    operator: {
        id: 2,
        username: 'operador',
        password: 'oper123',
        role: 'operator',
        name: 'Operador'
    }
};

// Inicializar usuarios en localStorage si no existen
function initializeUsers() {
    const savedUsers = localStorage.getItem('users');
    if (!savedUsers) {
        const initialUsers = [
            {
                id: 1,
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                name: 'Administrador'
            },
            {
                id: 2,
                username: 'operador',
                password: 'oper123',
                role: 'operator',
                name: 'Operador',
                active: true,
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('users', JSON.stringify(initialUsers));
        
        // También inicializar operadores
        const operators = initialUsers.filter(u => u.role === 'operator');
        localStorage.setItem('operators', JSON.stringify(operators));
    }
}

// Inicializar al cargar
initializeUsers();

// ==================== ROLE SELECTION PAGE ====================
function selectRole(role) {
    console.log('Seleccionando rol:', role);
    localStorage.setItem('selectedRole', role);
    sessionStorage.setItem('selectedRole', role);
    console.log('Rol guardado, redirigiendo a login...');
    window.location.href = 'login.html';
}

// ==================== LOGIN PAGE ====================
function goBack() {
    window.location.href = 'index.html';
}

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        eyeIcon.className = 'fas fa-eye';
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const selectedRole = sessionStorage.getItem('selectedRole') || localStorage.getItem('selectedRole');
    const errorMessage = document.getElementById('errorMessage');
    
    console.log('Intentando login con rol:', selectedRole);
    
    try {
        // Obtener usuarios usando Storage API (Supabase o localStorage)
        const savedUsers = await window.StorageAPI.getUsers();
        
        // Buscar usuario que coincida con credenciales y rol
        const validUser = savedUsers.find(user => 
            user.username === username && 
            user.password === password && 
            user.role === selectedRole &&
            (user.role === 'admin' || user.active !== false) // Operadores inactivos no pueden entrar
        );
        
        if (validUser) {
            // Guardar sesión
            sessionStorage.setItem('currentUser', JSON.stringify(validUser));
            sessionStorage.setItem('isLoggedIn', 'true');
            
            // Redirigir al dashboard
            window.location.href = 'dashboard.html';
        } else {
            // Mostrar error en el formulario
            errorMessage.textContent = 'Usuario o contraseña incorrectos';
            errorMessage.classList.add('show');
            
            setTimeout(() => {
                errorMessage.classList.remove('show');
            }, 3000);
        }
    } catch (error) {
        console.error('Error durante el login:', error);
        errorMessage.textContent = 'Error al iniciar sesión. Intente nuevamente.';
        errorMessage.classList.add('show');
    }
}

// Inicializar página de login
function initLoginPage() {
    // Intentar obtener el rol de múltiples fuentes
    const urlParams = new URLSearchParams(window.location.search);
    const roleFromUrl = urlParams.get('role');
    
    let selectedRole = roleFromUrl || sessionStorage.getItem('selectedRole') || localStorage.getItem('selectedRole');
    
    // Si viene de la URL, guardarlo
    if (roleFromUrl) {
        localStorage.setItem('selectedRole', roleFromUrl);
        sessionStorage.setItem('selectedRole', roleFromUrl);
    }
    
    console.log('InitLoginPage - Rol seleccionado:', selectedRole);
    
    if (!selectedRole) {
        console.log('No hay rol seleccionado, redirigiendo a index...');
        window.location.href = 'index.html';
        return;
    }
    
    const roleBadge = document.getElementById('roleBadge');
    const roleDescription = document.getElementById('roleDescription');
    
    if (selectedRole === 'admin') {
        roleBadge.textContent = 'Administrador';
        roleBadge.className = 'role-badge admin';
        roleDescription.textContent = 'Acceso completo al sistema';
    } else {
        roleBadge.textContent = 'Operador';
        roleBadge.className = 'role-badge operator';
        roleDescription.textContent = 'Acceso a operaciones diarias';
    }
}

// ==================== DASHBOARD PAGE ====================
function checkAuth() {
    // No verificar autenticación en páginas públicas
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'index.html' || currentPage === '' || currentPage === 'login.html') {
        return null;
    }
    
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const currentUser = sessionStorage.getItem('currentUser');
    
    if (!isLoggedIn || !currentUser) {
        window.location.href = 'index.html';
        return null;
    }
    
    return JSON.parse(currentUser);
}

function logout() {
    ConfirmDialog.show(
        '¿Está seguro que desea cerrar sesión?',
        'Cerrar Sesión',
        () => {
            const user = JSON.parse(sessionStorage.getItem('currentUser'));
            sessionStorage.clear();
            window.location.href = 'index.html';
        }
    );
}

function openModule(module) {
    // Módulos disponibles
    const moduleRoutes = {
        'inventario': 'inventario.html',
        'clientes': 'clientes.html',
        'ventas': 'ventas.html',
        'historial': 'historial.html',
        'reportes': 'reportes.html',
        'configuraciones': 'configuraciones.html'
    };
    
    if (moduleRoutes[module]) {
        window.location.href = moduleRoutes[module];
    } else {
        Notification.info(`El módulo "${module}" estará disponible próximamente. Se desarrollará según las instrucciones específicas.`, 'Módulo en Desarrollo');
    }
}

function updateDateTime() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = now.toLocaleDateString('es-BO', options);
    }
}

function initDashboard() {
    const user = checkAuth();
    if (!user) return;
    
    // Actualizar información del usuario
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    const userIcon = document.getElementById('userIcon');
    
    if (userName) userName.textContent = user.name;
    if (userRole) userRole.textContent = user.role === 'admin' ? 'Admin' : 'Operador';
    
    // Cambiar icono según rol
    if (userIcon) {
        userIcon.className = user.role === 'admin' ? 'fas fa-user-shield' : 'fas fa-user';
    }
    
    // Actualizar fecha
    updateDateTime();
    
    // Mostrar notificación de bienvenida
    setTimeout(() => {
        Notification.success(`Bienvenido/a ${user.name} a AIJMIROSHOP`, 'Sesión Iniciada');
    }, 500);
    
    // Si es operador, filtrar módulos disponibles
    if (user.role === 'operator') {
        filterModulesForOperator();
    }
}

function filterModulesForOperator() {
    // Módulos permitidos para operador
    const allowedModules = ['ventas', 'historial'];
    
    // Obtener todas las tarjetas de módulos
    const moduleCards = document.querySelectorAll('.module-card');
    
    moduleCards.forEach(card => {
        const onclickAttr = card.getAttribute('onclick');
        const moduleMatch = onclickAttr.match(/openModule\('(.+?)'\)/);
        
        if (moduleMatch) {
            const moduleName = moduleMatch[1];
            
            // Ocultar módulos no permitidos
            if (!allowedModules.includes(moduleName)) {
                card.style.display = 'none';
            }
        }
    });
    
    // Actualizar mensaje de bienvenida
    const welcomeSection = document.querySelector('.welcome-section p');
    if (welcomeSection) {
        welcomeSection.textContent = 'Acceso a operaciones de venta';
    }
}

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'index.html' || currentPage === '') {
        // Página de selección de roles - no hacer nada
        return;
    } else if (currentPage === 'login.html') {
        initLoginPage();
    } else if (currentPage === 'dashboard.html') {
        initDashboard();
    } else {
        // Para todos los demás módulos, actualizar fecha y verificar autenticación
        const user = checkAuth();
        if (user) {
            updateDateTime();
        }
    }
});

// ==================== Realtime listener (actualización en tiempo real) ====================
window.addEventListener('realtime-change', function(e) {
    try {
        const detail = e.detail || {};
        console.log('Realtime change received:', detail);

        // Si la tabla afecta a la UI actual, actualizar según contexto
        const currentPage = window.location.pathname.split('/').pop();

        // Casos simples: si estamos en páginas que muestran users/products/clients, recargar
        const reloadPages = ['dashboard.html', 'inventario.html', 'clientes.html', 'historial.html', 'reportes.html', 'configuraciones.html'];
        if (reloadPages.includes(currentPage) || currentPage === '') {
            // Opcional: podríamos re-renderizar solo la parte afectada, pero ahora recargaremos
            console.log('Refrescando página por cambio en:', detail.table);
            setTimeout(() => location.reload(), 500);
        }
    } catch (err) {
        console.error('Error manejando realtime-change:', err);
    }
});

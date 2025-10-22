// =====================================================
// Configuración de Supabase
// =====================================================

// NOTA: Las variables se inyectan desde Vercel en tiempo de build
// Si estás en desarrollo local, cámbialas aquí temporalmente
const SUPABASE_URL = 'https://zfssyuieasxmukrazmtr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3N5dWllYXN4bXVrcmF6bXRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzg3MjcsImV4cCI6MjA3NjY1NDcyN30.cLJWda-vHs8tQw2klWBNZloOm2MHwuKq3_8t4SCIdMA';

// Cliente de Supabase (se inicializa cuando se carga la librería)
let supabase = null;

// Modo de almacenamiento (localStorage o supabase)
let storageMode = 'localStorage';

// Inicializar Supabase cuando esté disponible
function initSupabase() {
    if (typeof window !== 'undefined' && window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            storageMode = 'supabase';
            console.log('✅ Supabase inicializado correctamente');
                // Si StorageAPI está cargada, iniciar realtime
                if (window.StorageAPI && typeof window.StorageAPI.startRealtime === 'function') {
                    try {
                        window.StorageAPI.startRealtime();
                        console.log('🔁 StorageAPI realtime iniciado');
                    } catch (err) {
                        console.warn('No se pudo iniciar StorageAPI realtime:', err);
                    }
                }
            return true;
        } catch (error) {
            console.warn('⚠️ Error al inicializar Supabase, usando localStorage:', error);
            storageMode = 'localStorage';
            return false;
        }
    }
    console.log('ℹ️ Usando localStorage (modo offline)');
    return false;
}

// =====================================================
// Funciones de compatibilidad con localStorage
// =====================================================

// Verificar si Supabase está disponible
function isSupabaseAvailable() {
    return supabase !== null && storageMode === 'supabase';
}

// Configurar credenciales de Supabase manualmente (para desarrollo)
function configureSupabase(url, key) {
    localStorage.setItem('SUPABASE_URL', url);
    localStorage.setItem('SUPABASE_ANON_KEY', key);
    location.reload(); // Recargar para aplicar configuración
}

// Exportar funciones
window.supabaseConfig = {
    initSupabase,
    isSupabaseAvailable,
    configureSupabase,
    getClient: () => supabase,
    getMode: () => storageMode
};

// Auto-inicializar cuando el DOM esté listo
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSupabase);
    } else {
        initSupabase();
    }
}

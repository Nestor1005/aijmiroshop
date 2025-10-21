// =====================================================
// Configuración de Supabase
// =====================================================

// Variables de entorno (deben configurarse en Vercel)
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 
                     (typeof process !== 'undefined' ? process.env?.SUPABASE_URL : null) || 
                     localStorage.getItem('SUPABASE_URL');

const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || 
                          (typeof process !== 'undefined' ? process.env?.SUPABASE_ANON_KEY : null) || 
                          localStorage.getItem('SUPABASE_ANON_KEY');

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

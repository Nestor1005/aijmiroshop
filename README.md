# AIJMIROSHOP

Sitio profesional, moderno y responsivo para gestión modular (Inventario, Clientes, Ticket, Historial, Usuarios, Estadísticas, Configuración) construido con Vite + React + Tailwind CSS.

## Requisitos
- Node.js 18+
- npm

## Desarrollo
```bash
npm install
npm run dev
```
Abrir http://localhost:5173

## Credenciales demo
- Administrador → Usuario: `Anahi`, Contraseña: `2025`
- Usuario → Usuario: `Usuario`, Contraseña: `2025`

## Estructura
- src/components/Login.jsx — Pantalla de inicio de sesión
- src/components/Dashboard.jsx — Layout con navegación lateral y rutas
- src/components/cards/* — Módulos (cards)
- src/utils/* — Utilidades (formato numérico, import/export XLSX, persistencia)

## Despliegue en Vercel
- Se puede conectar el repo de GitHub y desplegar el frontend de Vite automáticamente.
- Para backend, se recomienda usar funciones serverless en `/api` o un servicio Express aparte.

## Nota
Este proyecto usa almacenamiento local (localStorage) como base. La integración con Supabase/Express puede añadirse en siguientes iteraciones.

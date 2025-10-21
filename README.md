# 🛍️ AIJMIROSHOP

**Sistema de Gestión de Inventario y Punto de Venta**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/TU_USUARIO/aijmiroshop)

---

## 🎯 Descripción

AIJMIROSHOP es un sistema completo de gestión de inventario y punto de venta (POS) diseñado para pequeños y medianos negocios. Incluye gestión de productos, clientes, ventas, reportes y más.

### ✨ Características Principales

- ✅ **Gestión de Inventario** - CRUD completo de productos con imágenes
- ✅ **Gestión de Clientes** - Base de datos de clientes
- ✅ **Punto de Venta** - Carrito de compras interactivo
- ✅ **Historial de Ventas** - Registro completo con filtros
- ✅ **Reportes y Gráficos** - Estadísticas visuales con Chart.js
- ✅ **Tickets Personalizables** - Descarga automática en PNG
- ✅ **Sistema de Roles** - Admin y Operador
- ✅ **100% Responsive** - Optimizado para móviles
- ✅ **PWA Ready** - Instalable como app

---

## 🚀 Demo en Vivo

**URL:** [https://aijmiroshop.vercel.app](https://aijmiroshop.vercel.app) *(reemplazar con tu URL)*

### Credenciales de Prueba

**Administrador:**
- Usuario: `admin`
- Contraseña: `admin123`

**Operador:**
- Usuario: `operador`
- Contraseña: `oper123`

---

## 🛠️ Tecnologías

### Frontend
- HTML5
- CSS3 (Grid, Flexbox, Custom Properties)
- JavaScript ES6+ (Vanilla)

### Backend
- **Supabase** (PostgreSQL)
- **Vercel** (Hosting)

### Librerías
- Font Awesome 6.4.0
- Chart.js
- html2canvas
- SheetJS/XLSX

---

## 📦 Instalación Local

### Requisitos
- Navegador moderno
- Cuenta en Supabase (gratuita)

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/TU_USUARIO/aijmiroshop.git
cd aijmiroshop
```

2. **Configurar Supabase**

   - Crea un proyecto en [Supabase](https://supabase.com)
   - Ejecuta el archivo `supabase-schema.sql` en el SQL Editor
   - Copia tus credenciales (URL y anon key)

3. **Configurar variables de entorno**

```bash
# Crear archivo .env
cp .env.example .env

# Editar .env con tus credenciales
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key-aqui
```

4. **Abrir en navegador**

```bash
# Opción 1: Abrir directamente
# Abre index.html en tu navegador

# Opción 2: Servidor local (recomendado)
npx http-server -p 3000
# Abre http://localhost:3000
```

---

## 🌐 Despliegue en Vercel

### Despliegue Automático

1. Haz fork de este repositorio
2. Ve a [Vercel](https://vercel.com)
3. Click en "New Project"
4. Importa tu repositorio de GitHub
5. Configura las variables de entorno:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
6. Click en "Deploy"

### Despliegue Manual

```bash
npm install
npm run deploy
```

**Ver guía completa:** [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)

---

## 📱 Capturas de Pantalla

### Desktop
![Dashboard](screenshots/dashboard.png)
*Panel principal con acceso a todos los módulos*

### Móvil
![Ventas Mobile](screenshots/mobile-ventas.png)
*Optimizado para smartphones*

---

## 📂 Estructura del Proyecto

```
aijmiroshop/
├── index.html              # Página principal
├── login.html              # Login
├── dashboard.html          # Dashboard
├── inventario.html         # Gestión de inventario
├── clientes.html           # Gestión de clientes
├── ventas.html             # Punto de venta
├── historial.html          # Historial de ventas
├── reportes.html           # Reportes y gráficos
├── configuraciones.html    # Configuraciones
├── script.js               # Lógica principal
├── inventario.js           # Lógica de inventario
├── clientes.js             # Lógica de clientes
├── ventas.js               # Lógica de ventas
├── historial.js            # Lógica de historial
├── reportes.js             # Lógica de reportes
├── configuraciones.js      # Lógica de configuración
├── styles.css              # Estilos globales
├── supabase-config.js      # Configuración de Supabase
├── supabase-schema.sql     # Schema de base de datos
├── vercel.json             # Configuración de Vercel
├── package.json            # Dependencias
└── README.md               # Este archivo
```

---

## 🎨 Módulos

### 1. Inventario
- Crear, editar, eliminar productos
- Subir imágenes (compresión automática)
- Importar/Exportar Excel
- Búsqueda y filtrado
- Paginación

### 2. Clientes
- CRUD completo de clientes
- Validación de CI
- Importar/Exportar Excel

### 3. Ventas
- Carrito de compras
- Múltiples métodos de pago
- Descuentos y envíos
- Generación de tickets
- Cliente rápido

### 4. Historial
- Registro completo de ventas
- Filtros avanzados
- Re-descarga de tickets
- Estadísticas en tiempo real

### 5. Reportes
- 6 gráficos interactivos
- Top productos y clientes
- Análisis de rotación
- Exportar a PDF

### 6. Configuraciones
- Gestión de usuarios
- Operadores
- Personalización de tickets

---

## 👥 Roles y Permisos

| Módulo | Admin | Operador |
|--------|-------|----------|
| Inventario | ✅ | ❌ |
| Clientes | ✅ | ❌ |
| Ventas | ✅ | ✅ |
| Historial | ✅ | ✅ (limitado) |
| Reportes | ✅ | ❌ |
| Configuraciones | ✅ | ❌ |

---

## 📊 Base de Datos

### Tablas Principales

- `users` - Usuarios del sistema
- `products` - Inventario
- `clients` - Clientes
- `sales` - Ventas
- `sale_items` - Items de cada venta
- `settings` - Configuraciones

Ver schema completo: [supabase-schema.sql](supabase-schema.sql)

---

## 🔐 Seguridad

### Implementado
- ✅ Validación de roles
- ✅ Sesión verificada
- ✅ Escape de HTML (XSS prevention)
- ✅ RLS en Supabase

### Recomendaciones para Producción
- [ ] Encriptar contraseñas (bcrypt)
- [ ] Implementar JWT
- [ ] Rate limiting
- [ ] Backups automáticos

---

## 🐛 Reportar Problemas

Si encuentras un bug:

1. Verifica que no esté ya reportado en [Issues](https://github.com/TU_USUARIO/aijmiroshop/issues)
2. Crea un nuevo issue con:
   - Descripción del problema
   - Pasos para reproducirlo
   - Capturas de pantalla (si aplica)
   - Navegador y versión

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más información.

---

## 📧 Contacto

- **Proyecto:** AIJMIROSHOP
- **Versión:** 1.0.0
- **Repositorio:** [GitHub](https://github.com/TU_USUARIO/aijmiroshop)

---

## 🙏 Agradecimientos

- [Font Awesome](https://fontawesome.com) - Iconos
- [Chart.js](https://www.chartjs.org) - Gráficos
- [Supabase](https://supabase.com) - Backend
- [Vercel](https://vercel.com) - Hosting

---

## 📈 Roadmap

### v1.1 (Próximamente)
- [ ] Autenticación con Supabase Auth
- [ ] Notificaciones por email
- [ ] Exportar reportes a PDF
- [ ] Modo oscuro

### v2.0 (Futuro)
- [ ] Múltiples sucursales
- [ ] Integración con WhatsApp
- [ ] Sistema de roles avanzado
- [ ] API REST

---

**Hecho con ❤️ para pequeños negocios**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/TU_USUARIO/aijmiroshop)

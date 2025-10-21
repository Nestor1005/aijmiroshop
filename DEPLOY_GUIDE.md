# 🚀 GUÍA DE DESPLIEGUE: VERCEL + SUPABASE

**Sistema:** AIJMIROSHOP  
**Fecha:** 21 de Octubre, 2025  
**Backend:** Supabase (PostgreSQL)  
**Hosting:** Vercel

---

## 📋 REQUISITOS PREVIOS

1. **Cuenta de GitHub** (gratuita)
2. **Cuenta de Vercel** (gratuita) - https://vercel.com
3. **Cuenta de Supabase** (gratuita) - https://supabase.com
4. **Git instalado** en tu computadora
5. **Node.js** instalado (opcional, para desarrollo local)

---

## 🗄️ PASO 1: CONFIGURAR SUPABASE

### 1.1 Crear Proyecto en Supabase

1. Ve a https://supabase.com
2. Click en **"Start your project"** o **"New Project"**
3. Completa los datos:
   - **Organization:** Crea una nueva o usa existente
   - **Name:** `aijmiroshop` (o el nombre que prefieras)
   - **Database Password:** Genera una contraseña segura (¡GUÁRDALA!)
   - **Region:** Elige el más cercano (ej: South America - São Paulo)
   - **Pricing Plan:** Free (gratis)
4. Click en **"Create new project"**
5. Espera 2-3 minutos mientras se crea el proyecto

### 1.2 Ejecutar el Schema SQL

1. En tu proyecto de Supabase, ve a la sección **"SQL Editor"** (menú lateral)
2. Click en **"New query"**
3. Abre el archivo `supabase-schema.sql` de este proyecto
4. **Copia todo el contenido** del archivo
5. **Pega** en el editor SQL de Supabase
6. Click en **"Run"** (o presiona Ctrl+Enter)
7. Verás el mensaje: **"Success. No rows returned"**

### 1.3 Verificar las Tablas

1. Ve a **"Table Editor"** en el menú lateral
2. Deberías ver estas tablas:
   - ✅ `users` (2 filas: admin y operador)
   - ✅ `products` (3 filas de ejemplo)
   - ✅ `clients` (3 filas de ejemplo)
   - ✅ `sales` (0 filas)
   - ✅ `sale_items` (0 filas)
   - ✅ `settings` (1 fila: ticketSettings)

### 1.4 Obtener las Credenciales

1. Ve a **"Settings"** → **"API"** en el menú lateral
2. En la sección **"Project API keys"**, copia:
   - **Project URL:** `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (es largo)
3. **GUARDA ESTAS CREDENCIALES** (las necesitarás en el siguiente paso)

---

## 📦 PASO 2: SUBIR A GITHUB

### 2.1 Inicializar Git (si no lo has hecho)

Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
# Inicializar repositorio
git init

# Agregar todos los archivos
git add .

# Hacer el primer commit
git commit -m "Initial commit - AIJMIROSHOP v1.0"
```

### 2.2 Crear Repositorio en GitHub

1. Ve a https://github.com
2. Click en el **"+"** arriba a la derecha → **"New repository"**
3. Completa:
   - **Repository name:** `aijmiroshop`
   - **Description:** "Sistema de Gestión de Inventario"
   - **Visibility:** Private (recomendado) o Public
   - **NO** marques "Initialize with README" (ya tienes archivos)
4. Click en **"Create repository"**

### 2.3 Conectar y Subir

Copia los comandos que GitHub te muestra y ejecútalos:

```powershell
# Configurar el remote (reemplaza TU_USUARIO con tu nombre de usuario)
git remote add origin https://github.com/TU_USUARIO/aijmiroshop.git

# Cambiar a rama main
git branch -M main

# Subir al repositorio
git push -u origin main
```

**¡Listo!** Tu código está en GitHub.

---

## 🌐 PASO 3: DESPLEGAR EN VERCEL

### 3.1 Importar desde GitHub

1. Ve a https://vercel.com
2. Click en **"Add New..."** → **"Project"**
3. Si es tu primera vez, conecta tu cuenta de GitHub
4. Busca el repositorio **"aijmiroshop"**
5. Click en **"Import"**

### 3.2 Configurar Variables de Entorno

**MUY IMPORTANTE:** Antes de hacer deploy, configura las variables:

1. En la pantalla de configuración, despliega **"Environment Variables"**
2. Agrega estas 2 variables:

   **Variable 1:**
   - **Key:** `SUPABASE_URL`
   - **Value:** `https://xxxxxxxxxxxxx.supabase.co` (tu URL de Supabase)

   **Variable 2:**
   - **Key:** `SUPABASE_ANON_KEY`
   - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (tu anon key)

3. Asegúrate de marcar **"Production"** para cada variable

### 3.3 Hacer Deploy

1. Click en **"Deploy"**
2. Espera 1-2 minutos mientras Vercel construye y despliega tu sitio
3. Verás **"Congratulations!"** cuando esté listo
4. Click en **"Visit"** para abrir tu sitio

### 3.4 Obtener tu URL

Tu sitio estará disponible en:
```
https://aijmiroshop.vercel.app
```
(o el nombre que Vercel le asigne)

---

## ✅ PASO 4: VERIFICAR QUE TODO FUNCIONE

### 4.1 Probar el Sistema

1. Abre tu sitio en Vercel
2. Abre la **consola del navegador** (F12 → Console)
3. Deberías ver: **"✅ Supabase inicializado correctamente"**
4. Intenta hacer login:
   - Usuario: `admin`
   - Contraseña: `admin123`

### 4.2 Probar Funcionalidades

- ✅ Login como Admin y Operador
- ✅ Ver inventario (productos de ejemplo)
- ✅ Crear un producto nuevo
- ✅ Registrar una venta
- ✅ Ver el historial
- ✅ Verificar que los datos persistan al recargar la página

### 4.3 Verificar en Supabase

1. Ve a Supabase → **"Table Editor"**
2. Abre la tabla **"sales"**
3. Si hiciste una venta de prueba, debería aparecer aquí
4. Verifica también **"sale_items"** y **"products"**

---

## 🔄 PASO 5: ACTUALIZAR EL SISTEMA (FUTUROS CAMBIOS)

Cuando hagas cambios al código:

```powershell
# 1. Ver archivos modificados
git status

# 2. Agregar cambios
git add .

# 3. Hacer commit
git commit -m "Descripción de los cambios"

# 4. Subir a GitHub
git push

# Vercel desplegará automáticamente los cambios
```

---

## ⚠️ IMPORTANTE: SEGURIDAD

### Cambiar Contraseñas Predeterminadas

**ANTES DE USAR EN PRODUCCIÓN:**

1. Ve a Supabase → SQL Editor
2. Ejecuta este SQL para cambiar contraseñas:

```sql
-- Cambiar contraseña del admin
UPDATE users 
SET password = 'TU_NUEVA_CONTRASEÑA_SEGURA_ADMIN' 
WHERE username = 'admin';

-- Cambiar contraseña del operador
UPDATE users 
SET password = 'TU_NUEVA_CONTRASEÑA_SEGURA_OPERADOR' 
WHERE username = 'operador';
```

3. Usa contraseñas seguras (mínimo 12 caracteres, letras, números, símbolos)

### Implementar Encriptación (Recomendado)

Para producción real, deberías:
1. Usar bcrypt para encriptar contraseñas
2. Implementar autenticación JWT
3. Configurar RLS (Row Level Security) en Supabase más estricto

---

## 🎨 PASO 6: PERSONALIZAR DOMINIO (OPCIONAL)

### 6.1 Configurar Dominio Personalizado

Si tienes un dominio propio (ej: `mitienda.com`):

1. En Vercel, ve a tu proyecto → **"Settings"** → **"Domains"**
2. Click en **"Add"**
3. Ingresa tu dominio: `mitienda.com` o `www.mitienda.com`
4. Sigue las instrucciones para configurar DNS
5. Espera propagación (puede tardar hasta 24 horas)

---

## 📊 MONITOREO Y MÉTRICAS

### Vercel Analytics (Opcional)

1. En Vercel, ve a tu proyecto → **"Analytics"**
2. Habilita analytics para ver:
   - Número de visitas
   - Rendimiento del sitio
   - Errores en tiempo real

### Supabase Monitoring

1. En Supabase → **"Database"** → **"Database Health"**
2. Monitorea:
   - Uso de almacenamiento
   - Consultas por segundo
   - Conexiones activas

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema: "Supabase no se inicializa"

**Solución:**
1. Verifica las variables de entorno en Vercel
2. Asegúrate de que `SUPABASE_URL` y `SUPABASE_ANON_KEY` estén correctas
3. Re-despliega el proyecto en Vercel

### Problema: "Error al guardar datos"

**Solución:**
1. Ve a Supabase → SQL Editor
2. Ejecuta:
   ```sql
   SELECT * FROM users LIMIT 1;
   ```
3. Si da error, verifica que el schema se haya ejecutado correctamente

### Problema: "No aparecen los productos de ejemplo"

**Solución:**
1. Ve a Supabase → Table Editor → products
2. Si está vacía, ejecuta nuevamente la sección de datos iniciales del schema

### Problema: "El sistema sigue usando localStorage"

**Solución:**
1. Abre la consola del navegador (F12)
2. Ejecuta: `window.supabaseConfig.getMode()`
3. Si dice "localStorage", verifica:
   - Que las variables de entorno estén en Vercel
   - Que hayas hecho un nuevo deploy después de agregarlas
   - Que la URL de Supabase sea correcta

---

## 📈 LÍMITES DEL PLAN GRATUITO

### Vercel (Free)
- ✅ 100 GB de ancho de banda/mes
- ✅ Despliegues ilimitados
- ✅ SSL automático
- ✅ Analytics básicos

### Supabase (Free)
- ✅ 500 MB de almacenamiento
- ✅ 2 GB de transferencia/mes
- ✅ 50,000 usuarios activos mensuales
- ✅ 500 MB de archivos (storage)

**Para la mayoría de negocios pequeños, esto es más que suficiente.**

---

## 🎯 PRÓXIMOS PASOS

### Mejoras Recomendadas

1. **Autenticación Real:**
   - Implementar Supabase Auth
   - Usar JWT tokens
   - Encriptar contraseñas con bcrypt

2. **Backup Automático:**
   - Configurar backups diarios en Supabase
   - Exportar datos periódicamente

3. **Notificaciones:**
   - Email al admin cuando stock bajo
   - WhatsApp para confirmar ventas

4. **PWA Completa:**
   - Service Worker para offline
   - Push notifications

5. **Reportes Avanzados:**
   - Exportar a PDF
   - Dashboard en tiempo real

---

## ✅ CHECKLIST FINAL

Antes de compartir tu sitio:

- [ ] Schema SQL ejecutado en Supabase
- [ ] Tablas creadas y con datos de ejemplo
- [ ] Variables de entorno configuradas en Vercel
- [ ] Deploy exitoso en Vercel
- [ ] Login funciona correctamente
- [ ] Crear producto funciona
- [ ] Registrar venta funciona
- [ ] Datos persisten en Supabase
- [ ] **Contraseñas predeterminadas cambiadas**
- [ ] Probado en diferentes dispositivos (móvil, tablet, desktop)
- [ ] SSL activo (candado verde en navegador)

---

## 📞 SOPORTE

### Recursos Útiles

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Vercel Community:** https://github.com/vercel/vercel/discussions
- **Supabase Discord:** https://discord.supabase.com

---

## 🎉 ¡FELICIDADES!

Tu sistema AIJMIROSHOP ahora está:
- ✅ En la nube (accesible desde cualquier lugar)
- ✅ Con base de datos real (PostgreSQL)
- ✅ SSL/HTTPS automático (seguro)
- ✅ Responsive (funciona en móviles)
- ✅ Escalable (puede crecer con tu negocio)
- ✅ Gratis (mientras estés en los límites)

**URL de tu sistema:** https://tu-proyecto.vercel.app

---

**Documento generado automáticamente**  
**AIJMIROSHOP Deploy Guide v1.0**  
**© 2025 - Vercel + Supabase**

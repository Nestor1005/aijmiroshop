# 🚀 QUICK START - DEPLOY RÁPIDO

## ⚡ En 5 minutos al aire

### 📋 Checklist Rápido

```
[ ] Cuenta en GitHub
[ ] Cuenta en Vercel
[ ] Cuenta en Supabase
[ ] Git instalado
```

---

## 🗄️ 1. SUPABASE (3 minutos)

1. **Crear proyecto:** https://supabase.com → New Project
   - Name: `aijmiroshop`
   - Password: (genera y guarda)
   - Region: South America

2. **Ejecutar SQL:**
   - SQL Editor → New Query
   - Pega todo el contenido de `supabase-schema.sql`
   - Run

3. **Copiar credenciales:**
   - Settings → API
   - Copia: `Project URL` y `anon public key`

---

## 📦 2. GITHUB (1 minuto)

```powershell
# En PowerShell dentro de la carpeta del proyecto
git init
git add .
git commit -m "Initial commit"

# Ve a github.com → New repository → "aijmiroshop"
# Luego ejecuta (reemplaza TU_USUARIO):
git remote add origin https://github.com/TU_USUARIO/aijmiroshop.git
git branch -M main
git push -u origin main
```

---

## 🌐 3. VERCEL (1 minuto)

1. **Importar:** https://vercel.com → New Project → Import from GitHub
2. **Configurar variables:**
   ```
   SUPABASE_URL = https://xxxxx.supabase.co
   SUPABASE_ANON_KEY = eyJhbGc...
   ```
3. **Deploy** → ¡Listo!

---

## ✅ 4. VERIFICAR

Abre tu sitio → F12 (consola) → Deberías ver:
```
✅ Supabase inicializado correctamente
```

Login:
- Usuario: `admin`
- Contraseña: `admin123`

---

## 🔄 ACTUALIZAR (después de cambios)

```powershell
git add .
git commit -m "Descripción del cambio"
git push
```

Vercel despliega automáticamente 🎉

---

## 📞 AYUDA

- **Error con Supabase?** → Verifica variables de entorno en Vercel
- **No se guardan datos?** → Revisa consola del navegador (F12)
- **Guía completa:** `DEPLOY_GUIDE.md`

---

**Tu sitio estará en:** https://aijmiroshop.vercel.app

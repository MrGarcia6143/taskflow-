# 🚀 Guía de Despliegue — TaskFlow
**Stack:** Node.js + Express · Supabase · Render (backend) · Netlify (frontend) · GitHub Actions (CI/CD)
**Costo total:** $0 — todo en planes gratuitos

---

## 📋 Índice
1. [Preparar la base de datos en Supabase](#1-preparar-la-base-de-datos-en-supabase)
2. [Subir el código a GitHub](#2-subir-el-código-a-github)
3. [Desplegar el backend en Render](#3-desplegar-el-backend-en-render)
4. [Desplegar el frontend en Netlify](#4-desplegar-el-frontend-en-netlify)
5. [Configurar CI/CD con GitHub Actions](#5-configurar-cicd-con-github-actions)
6. [Verificar que todo funciona](#6-verificar-que-todo-funciona)
7. [Variables de entorno — resumen](#7-variables-de-entorno--resumen)
8. [Solución de problemas comunes](#8-solución-de-problemas-comunes)

---

## 1. Preparar la base de datos en Supabase

### 1.1 Crear la tabla `tasks`

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard) e inicia sesión.
2. Selecciona tu proyecto.
3. En el menú izquierdo, haz clic en **SQL Editor**.
4. Pega y ejecuta el siguiente SQL:

```sql
-- Crea la tabla de tareas
CREATE TABLE IF NOT EXISTS tasks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  done       boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilita Row Level Security (buena práctica)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Política: permite todo (para un proyecto de práctica)
-- En un proyecto real, aquí restringirías por usuario autenticado
CREATE POLICY "allow_all" ON tasks FOR ALL USING (true) WITH CHECK (true);
```

5. Haz clic en **Run**. Verás "Success. No rows returned."

### 1.2 Obtener las credenciales de Supabase

Necesitas dos valores:

| Variable          | Dónde encontrarla                                              |
|-------------------|---------------------------------------------------------------|
| `SUPABASE_URL`    | Proyecto → Settings → API → **Project URL**                  |
| `SUPABASE_KEY`    | Proyecto → Settings → API → **service_role** (la clave larga) |

> ⚠️ **IMPORTANTE:** Usa la clave `service_role` en el backend (servidor). NUNCA la expongas en el frontend. La clave `anon/public` es para clientes que corren en el navegador.

---

## 2. Subir el código a GitHub

```bash
# En la carpeta raíz del proyecto (taskflow/)
git init
git add .
git commit -m "feat: initial commit — TaskFlow app"
```

### 2.1 Crear repositorio en GitHub

1. Ve a [https://github.com/new](https://github.com/new)
2. Nombre: `taskflow` (o el que prefieras)
3. Visibilidad: **Public** (necesario para el plan gratuito de Render)
4. NO inicialices con README ni .gitignore (ya los tenemos)
5. Clic en **Create repository**

### 2.2 Conectar y subir

```bash
git remote add origin https://github.com/TU_USUARIO/taskflow.git
git branch -M main
git push -u origin main
```

Reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub.

---

## 3. Desplegar el backend en Render

Render es una plataforma como Heroku pero con plan gratuito permanente.

### 3.1 Crear cuenta y nuevo servicio

1. Ve a [https://render.com](https://render.com) y crea una cuenta (puedes usar tu cuenta de GitHub).
2. En el dashboard, haz clic en **New +** → **Web Service**.
3. Conecta tu cuenta de GitHub si no lo has hecho.
4. Selecciona el repositorio `taskflow`.

### 3.2 Configurar el servicio

Rellena los campos así:

| Campo              | Valor                        |
|--------------------|------------------------------|
| **Name**           | `taskflow-api`               |
| **Root Directory** | `backend`                    |
| **Runtime**        | `Node`                       |
| **Build Command**  | `npm install`                |
| **Start Command**  | `npm start`                  |
| **Instance Type**  | `Free`                       |

### 3.3 Agregar variables de entorno en Render

En la misma pantalla, baja hasta **Environment Variables** y agrega:

| Key              | Value                                    |
|------------------|------------------------------------------|
| `SUPABASE_URL`   | `https://tu-proyecto.supabase.co`        |
| `SUPABASE_KEY`   | `tu_service_role_key`                    |
| `FRONTEND_URL`   | (déjalo vacío por ahora, lo llenas después) |

> 💡 El puerto lo asigna Render automáticamente con `process.env.PORT`.

### 3.4 Desplegar

Haz clic en **Create Web Service**. Render instalará las dependencias y arrancará el servidor.

Cuando el deploy termine verás un log con:
```
✅  TaskFlow API corriendo en http://localhost:XXXX
```

**Anota la URL de tu servicio**, tiene la forma:
```
https://taskflow-api.onrender.com
```

> 📝 **Plan gratuito de Render:** el servidor "duerme" después de 15 minutos de inactividad. La primera petición tarda ~30 segundos en "despertar". Es perfecto para practicar.

---

## 4. Desplegar el frontend en Netlify

### 4.1 Actualizar la URL del backend en el frontend

Antes de desplegar, edita `frontend/app.js` y cambia:

```js
// Línea 3 — cambia esto:
const API_URL = window.ENV_API_URL || "http://localhost:3000";

// Por esto (con tu URL real de Render):
const API_URL = window.ENV_API_URL || "https://taskflow-api.onrender.com";
```

Haz commit y push:
```bash
git add .
git commit -m "config: update API URL to production backend"
git push
```

### 4.2 Desplegar en Netlify

**Opción A — Drag & Drop (más fácil para empezar):**
1. Ve a [https://app.netlify.com](https://app.netlify.com)
2. Crea una cuenta (puedes usar GitHub)
3. En el dashboard, arrastra la **carpeta `frontend/`** al área que dice "Drag and drop your site folder here"
4. ¡Listo! Te dará una URL como `https://random-name.netlify.app`

**Opción B — Conectar con GitHub (recomendada para CI/CD):**
1. En Netlify, haz clic en **Add new site** → **Import an existing project**
2. Elige **GitHub** y selecciona tu repositorio `taskflow`
3. Configura el build:

| Campo               | Valor      |
|---------------------|------------|
| **Base directory**  | `frontend` |
| **Build command**   | (vacío)    |
| **Publish directory** | `frontend` |

4. Haz clic en **Deploy site**

### 4.3 Actualizar CORS en el backend

Una vez que tengas la URL de Netlify (ej: `https://taskflow-app.netlify.app`):

1. Ve a Render → tu servicio → **Environment**
2. Edita la variable `FRONTEND_URL` con tu URL de Netlify
3. Render redesplegará automáticamente

---

## 5. Configurar CI/CD con GitHub Actions

El archivo `.github/workflows/deploy.yml` ya está incluido en el proyecto. Automáticamente:
- Se ejecuta en cada `git push` a `main`
- Instala dependencias
- Hace un health check del servidor
- Si todo pasa ✅, confirma que Render recibirá el deploy automáticamente

### 5.1 Agregar secrets en GitHub

Para que el health check funcione en el pipeline:

1. Ve a tu repo en GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Haz clic en **New repository secret** y agrega:

| Secret Name      | Value                             |
|------------------|-----------------------------------|
| `SUPABASE_URL`   | Tu URL de Supabase                |
| `SUPABASE_KEY`   | Tu service_role key               |

### 5.2 Verificar que el pipeline funciona

```bash
# Haz cualquier cambio pequeño y súbelo
echo "# TaskFlow" >> README.md
git add . && git commit -m "ci: test pipeline" && git push
```

Ve a tu repo en GitHub → pestaña **Actions** y verás el pipeline corriendo.

---

## 6. Verificar que todo funciona

### Checklist final

```
[ ] Tabla `tasks` creada en Supabase (SQL Editor muestra éxito)
[ ] Backend en Render responde en https://TU-APP.onrender.com/health
[ ] Frontend en Netlify carga la página
[ ] Puedo agregar una tarea → aparece en la lista
[ ] Puedo marcar una tarea como hecha
[ ] Puedo eliminar una tarea
[ ] GitHub Actions muestra ✅ verde en la pestaña Actions
```

### Prueba rápida del backend con curl

```bash
# Health check
curl https://TU-APP.onrender.com/health

# Crear una tarea
curl -X POST https://TU-APP.onrender.com/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Mi primera tarea de producción"}'

# Listar tareas
curl https://TU-APP.onrender.com/tasks
```

---

## 7. Variables de entorno — resumen

### Backend (en Render → Environment)

| Variable       | Descripción                              | Ejemplo                              |
|----------------|------------------------------------------|--------------------------------------|
| `SUPABASE_URL` | URL de tu proyecto Supabase              | `https://abc123.supabase.co`         |
| `SUPABASE_KEY` | Service role key de Supabase             | `eyJhbGci...`                        |
| `FRONTEND_URL` | URL de tu frontend (para CORS)           | `https://taskflow.netlify.app`       |
| `PORT`         | Puerto (Render lo inyecta automáticamente) | (no tocar)                         |

### GitHub Actions Secrets

| Secret         | Descripción                     |
|----------------|---------------------------------|
| `SUPABASE_URL` | Mismo valor que en Render       |
| `SUPABASE_KEY` | Mismo valor que en Render       |

---

## 8. Solución de problemas comunes

### ❌ "Failed to fetch" en el frontend

**Causa:** CORS mal configurado o backend dormido.

**Solución:**
1. Espera 30 segundos y recarga (Render en plan free duerme el servidor)
2. Verifica que `FRONTEND_URL` en Render coincide **exactamente** con tu URL de Netlify (con `https://` y sin barra final)

---

### ❌ "relation 'tasks' does not exist"

**Causa:** La tabla no fue creada en Supabase.

**Solución:** Repite el paso 1.1 y ejecuta el SQL.

---

### ❌ Error 401 en Supabase

**Causa:** Estás usando la clave `anon` en lugar de `service_role`.

**Solución:**
1. Ve a Supabase → Settings → API
2. Copia la clave bajo **service_role** (la larga, empieza con `eyJ...`)
3. Actualiza la variable `SUPABASE_KEY` en Render

---

### ❌ GitHub Actions falla en el health check

**Causa:** Los secrets no están configurados o el servidor tarda en arrancar.

**Solución:**
1. Verifica que agregaste `SUPABASE_URL` y `SUPABASE_KEY` en GitHub Secrets (paso 5.1)
2. El workflow espera 4 segundos — si tu máquina CI es lenta, edita `sleep 4` a `sleep 6` en el YAML

---

### ❌ Render no redespliega automáticamente

**Causa:** La rama conectada no es `main`.

**Solución:** En Render → tu servicio → Settings → verifica que **Branch** sea `main`.

---

## 🎯 ¿Qué sigue? Ideas para seguir practicando

Una vez que todo funcione, aquí tienes ideas para extender el proyecto:

- **Autenticación:** Agrega Supabase Auth para que cada usuario tenga sus propias tareas
- **Prioridades:** Agrega una columna `priority` (low/medium/high) y filtra por ella
- **Drag & drop:** Reordena las tareas arrastrándolas
- **Dark/Light mode:** Añade un toggle de tema
- **Tests:** Escribe tests con Jest para el backend
- **Custom domain:** Conecta un dominio propio gratis con Netlify

---

*Generado para el proyecto TaskFlow — una app de práctica para aprender full-stack deployment.*

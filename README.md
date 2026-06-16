# TaskFlow ◆

Una app de tareas minimalista construida para practicar el despliegue full-stack a producción de forma **completamente gratuita**.

## Stack

| Capa       | Tecnología                          |
|------------|-------------------------------------|
| Frontend   | HTML · CSS · JavaScript vanilla     |
| Backend    | Node.js · Express                   |
| Base datos | Supabase (PostgreSQL)               |
| Deploy BE  | Render (plan Free)                  |
| Deploy FE  | Netlify (plan Free)                 |
| CI/CD      | GitHub Actions                      |

## Estructura

```
taskflow/
├── backend/
│   ├── src/
│   │   └── index.js          ← servidor Express
│   ├── .github/
│   │   └── workflows/
│   │       └── deploy.yml    ← pipeline CI/CD
│   ├── .env.example          ← plantilla de variables de entorno
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── netlify.toml
├── GUIA_DESPLIEGUE.md        ← instrucciones paso a paso
└── .gitignore
```

## Desarrollo local

```bash
# Backend
cd backend
cp .env.example .env        # rellena SUPABASE_URL y SUPABASE_KEY
npm install
npm run dev                 # arranca en http://localhost:3000

# Frontend
# Abre frontend/index.html directamente en tu navegador
# O usa Live Server en VS Code
```

## Despliegue

Lee **[GUIA_DESPLIEGUE.md](./GUIA_DESPLIEGUE.md)** — tiene instrucciones paso a paso para:
- Crear la tabla en Supabase
- Desplegar el backend en Render
- Desplegar el frontend en Netlify
- Configurar GitHub Actions para CI/CD automático

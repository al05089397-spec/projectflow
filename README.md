# ProjectFlow 🚀

Sistema de gestión de proyectos full stack para equipos de desarrollo de software.

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Base de datos | SQLite (better-sqlite3) |
| Tiempo real | Socket.io |
| Autenticación | JWT (jsonwebtoken) |
| Control de versiones | Git + GitHub |

## Arquitectura

```
projectflow/
├── backend/                    # Servidor Node.js + Express
│   └── src/
│       ├── config/database.js  # Esquema SQLite e inicialización
│       ├── controllers/        # Lógica de negocio (auth, projects, tasks, users)
│       ├── middleware/auth.js  # Verificación JWT
│       ├── routes/             # Definición de endpoints REST
│       ├── socket/             # Eventos Socket.io (chat + notificaciones)
│       └── app.js              # Servidor principal
└── frontend/                   # Aplicación React
    └── src/
        ├── components/         # Componentes reutilizables
        ├── context/            # Estado global (Auth + Socket)
        ├── pages/              # Vistas principales
        ├── services/api.js     # Capa HTTP con Axios
        └── App.jsx             # Router principal
```

## Prerrequisitos

- Node.js v18 o superior
- npm v9 o superior

## Instalación y ejecución — Entorno de desarrollo

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/projectflow.git
cd projectflow
```

### 2. Configurar el backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env si deseas cambiar el puerto o el JWT secret
npm run dev
```

El servidor iniciará en: `http://localhost:3001`

### 3. Configurar el frontend (nueva terminal)

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173`

## Credenciales de demo

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Administrador | admin@projectflow.com | admin123 |
| Miembro | ana@projectflow.com | member123 |
| Miembro | luis@projectflow.com | member123 |

## Endpoints de la API

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/auth/register | Registrar nuevo usuario |
| POST | /api/auth/login | Iniciar sesión |
| GET | /api/auth/me | Perfil del usuario autenticado |

### Proyectos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/projects | Listar proyectos del usuario |
| GET | /api/projects/:id | Obtener proyecto por ID |
| POST | /api/projects | Crear proyecto |
| PUT | /api/projects/:id | Actualizar proyecto |
| DELETE | /api/projects/:id | Eliminar proyecto |
| POST | /api/projects/:id/members | Agregar miembro |

### Tareas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/projects/:id/tasks | Listar tareas del proyecto |
| POST | /api/projects/:id/tasks | Crear tarea |
| PUT | /api/tasks/:id | Actualizar tarea |
| DELETE | /api/tasks/:id | Eliminar tarea |
| PATCH | /api/tasks/:id/status | Cambiar estado (Kanban) |

### Usuarios
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/users | Listar usuarios |
| GET | /api/users/:id | Obtener usuario por ID |
| PUT | /api/users/:id | Actualizar usuario |
| DELETE | /api/users/:id | Eliminar usuario (solo admin) |

## Eventos Socket.io

| Evento (emit) | Descripción |
|---------------|-------------|
| join_project | Unirse a sala de chat del proyecto |
| send_message | Enviar mensaje de chat |
| task_assigned | Notificar asignación de tarea |
| task_status_changed | Notificar cambio de estado en Kanban |
| typing / stop_typing | Indicador de escritura |

| Evento (on) | Descripción |
|-------------|-------------|
| chat_history | Historial de mensajes al unirse |
| new_message | Nuevo mensaje recibido |
| notification | Notificación general |
| board_updated | Tablero Kanban actualizado |
| user_typing | Usuario escribiendo |

## Funcionalidades

- ✅ Registro e inicio de sesión con JWT
- ✅ Dashboard con estadísticas de proyectos
- ✅ CRUD completo de proyectos
- ✅ Tablero Kanban con 3 estados: Pendiente / En progreso / Completada
- ✅ CRUD completo de tareas con prioridad, asignación y fecha límite
- ✅ Chat en tiempo real por proyecto (Socket.io)
- ✅ Notificaciones instantáneas al asignar tareas o cambiar estados
- ✅ Indicador de escritura en chat
- ✅ Gestión de usuarios con roles (admin / miembro)
- ✅ Diseño responsivo

## Despliegue en producción

### Backend (Railway / Render)
1. Subir el código a GitHub
2. Conectar el repositorio en Railway o Render
3. Configurar variables de entorno: `JWT_SECRET`, `NODE_ENV=production`, `FRONTEND_URL`
4. El servidor inicia automáticamente con `npm start`

### Frontend (Vercel / Netlify)
1. Conectar el repositorio
2. Directorio raíz: `frontend`
3. Comando de build: `npm run build`
4. Directorio de salida: `dist`
5. Configurar variable de entorno `VITE_API_URL` con la URL del backend

## Flujo de ramas Git (Feature Branching)

```
main                  ← rama de producción
├── develop           ← integración
│   ├── feature/auth
│   ├── feature/projects-crud
│   ├── feature/kanban-board
│   └── feature/socket-chat
```

```bash
# Crear rama para nueva feature
git checkout -b feature/nombre-de-feature

# Commits descriptivos
git commit -m "feat: agregar chat en tiempo real con Socket.io"
git commit -m "fix: corregir validación de formulario de tarea"
git commit -m "docs: actualizar README con instrucciones de deploy"
```

---

Desarrollado como proyecto académico — Desarrollo Integral de Software  
Universidad TecMilenio · 2026

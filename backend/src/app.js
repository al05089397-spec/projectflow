// app.js
// Servidor principal de ProjectFlow
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { initDatabase } = require('./config/database');
const { initSocket } = require('./socket/socketHandler');

// Rutas
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);

// Configuración de Socket.io con CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});

// ─── MIDDLEWARES ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── RUTAS DE LA API ──────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/tasks', taskRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), app: 'ProjectFlow API' });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.path} no encontrada` });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ─── INICIALIZACIÓN ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

initDatabase();
initSocket(io);

server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║        🚀 ProjectFlow API             ║
  ║   Puerto: ${PORT}                        ║
  ║   Entorno: ${process.env.NODE_ENV || 'development'}              ║
  ╚═══════════════════════════════════════╝

  📡 API:      http://localhost:${PORT}/api
  ❤️  Health:  http://localhost:${PORT}/api/health

  👤 Admin demo: admin@projectflow.com / admin123
  👤 Member demo: ana@projectflow.com / member123
  `);
});

module.exports = { app, server };

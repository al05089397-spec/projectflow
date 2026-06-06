require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3004;
const JWT_SECRET = process.env.JWT_SECRET || 'projectflow_secret_2026';

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', methods: ['GET', 'POST'] }
});

const rooms = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Token requerido'));
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.user.email}`);

  socket.on('join:project', (projectId) => {
    socket.join(`project:${projectId}`);
    if (!rooms.has(projectId)) rooms.set(projectId, new Set());
    rooms.get(projectId).add(socket.user.id);
    io.to(`project:${projectId}`).emit('user:joined', { user: socket.user, projectId });
  });

  socket.on('leave:project', (projectId) => {
    socket.leave(`project:${projectId}`);
    if (rooms.has(projectId)) rooms.get(projectId).delete(socket.user.id);
  });

  socket.on('chat:message', (data) => {
    io.to(`project:${data.projectId}`).emit('chat:message', {
      id: Date.now(),
      user: socket.user,
      message: data.message,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('task:updated', (data) => {
    socket.to(`project:${data.projectId}`).emit('task:updated', data);
  });

  socket.on('notification', (data) => {
    io.to(`project:${data.projectId}`).emit('notification', {
      ...data,
      from: socket.user,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log(`Usuario desconectado: ${socket.user.email}`);
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'notifications-service', timestamp: new Date().toISOString() });
});

server.listen(PORT, () => {
  console.log(`Notifications Service corriendo en puerto ${PORT}`);
});

module.exports = app;
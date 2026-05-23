// socket/socketHandler.js
// Manejo de eventos Socket.io: chat en tiempo real y notificaciones
const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');

/**
 * Inicializa todos los eventos de Socket.io
 * @param {Server} io - instancia de Socket.io
 */
function initSocket(io) {
  // Middleware de autenticación para Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Token requerido'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Usuario conectado: ${socket.user.name} (${socket.id})`);

    // ─── CHAT ─────────────────────────────────────────────────────────────────

    /**
     * Unirse a la sala de chat de un proyecto
     */
    socket.on('join_project', (projectId) => {
      socket.join(`project_${projectId}`);
      console.log(`👥 ${socket.user.name} unido al proyecto ${projectId}`);

      // Cargar historial de mensajes (últimos 50)
      const db = getDb();
      const messages = db.prepare(`
        SELECT m.*, u.name AS user_name
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.project_id = ?
        ORDER BY m.created_at DESC
        LIMIT 50
      `).all(projectId).reverse();

      socket.emit('chat_history', messages);
    });

    /**
     * Salir de la sala de chat de un proyecto
     */
    socket.on('leave_project', (projectId) => {
      socket.leave(`project_${projectId}`);
    });

    /**
     * Nuevo mensaje de chat
     */
    socket.on('send_message', ({ projectId, content }) => {
      if (!content || !content.trim()) return;

      const db = getDb();

      // Guardar mensaje en BD
      const result = db.prepare(
        'INSERT INTO messages (content, project_id, user_id) VALUES (?, ?, ?)'
      ).run(content.trim(), projectId, socket.user.id);

      const message = db.prepare(`
        SELECT m.*, u.name AS user_name
        FROM messages m JOIN users u ON m.user_id = u.id
        WHERE m.id = ?
      `).get(result.lastInsertRowid);

      // Emitir a todos en la sala del proyecto
      io.to(`project_${projectId}`).emit('new_message', message);
    });

    // ─── NOTIFICACIONES ───────────────────────────────────────────────────────

    /**
     * Notificación: tarea asignada a un usuario
     */
    socket.on('task_assigned', ({ taskId, assignedToId, taskTitle, projectName }) => {
      // Emitir notificación al usuario asignado
      io.to(`user_${assignedToId}`).emit('notification', {
        type: 'task_assigned',
        message: `Se te asignó la tarea: "${taskTitle}" en ${projectName}`,
        taskId,
        timestamp: new Date().toISOString()
      });
    });

    /**
     * Notificación: estado de tarea actualizado
     */
    socket.on('task_status_changed', ({ projectId, taskTitle, newStatus, changedBy }) => {
      const statusLabels = {
        pending: 'Pendiente',
        in_progress: 'En Progreso',
        completed: 'Completada'
      };

      // Broadcast a todos los miembros del proyecto
      socket.to(`project_${projectId}`).emit('notification', {
        type: 'task_updated',
        message: `${changedBy} movió "${taskTitle}" a ${statusLabels[newStatus] || newStatus}`,
        timestamp: new Date().toISOString()
      });

      // También emitir actualización del tablero Kanban
      socket.to(`project_${projectId}`).emit('board_updated', { taskTitle, newStatus });
    });

    /**
     * Indicador de "escribiendo..." en el chat
     */
    socket.on('typing', ({ projectId }) => {
      socket.to(`project_${projectId}`).emit('user_typing', {
        userId: socket.user.id,
        userName: socket.user.name
      });
    });

    socket.on('stop_typing', ({ projectId }) => {
      socket.to(`project_${projectId}`).emit('user_stop_typing', {
        userId: socket.user.id
      });
    });

    // ─── SALA PERSONAL ────────────────────────────────────────────────────────

    /**
     * Unirse a sala personal para notificaciones directas
     */
    socket.on('join_user_room', () => {
      socket.join(`user_${socket.user.id}`);
    });

    // ─── DESCONEXIÓN ──────────────────────────────────────────────────────────

    socket.on('disconnect', () => {
      console.log(`❌ Usuario desconectado: ${socket.user.name}`);
    });
  });
}

module.exports = { initSocket };

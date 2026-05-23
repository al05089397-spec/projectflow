// controllers/taskController.js
// CRUD completo para tareas
const { getDb } = require('../config/database');

/**
 * GET /api/projects/:projectId/tasks
 * Lista todas las tareas de un proyecto
 */
function getTasks(req, res) {
  try {
    const { projectId } = req.params;
    const db = getDb();

    const tasks = db.prepare(`
      SELECT t.*, 
             u.name AS assigned_to_name,
             u.email AS assigned_to_email
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id = ?
      ORDER BY 
        CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        t.created_at DESC
    `).all(projectId);

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
}

/**
 * POST /api/projects/:projectId/tasks
 * Crea una nueva tarea en un proyecto
 */
function createTask(req, res) {
  try {
    const { projectId } = req.params;
    const { title, description, status = 'pending', priority = 'medium', assigned_to, due_date } = req.body;
    const db = getDb();

    if (!title) return res.status(400).json({ error: 'El título de la tarea es requerido' });

    const result = db.prepare(`
      INSERT INTO tasks (title, description, status, priority, project_id, assigned_to, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, description || '', status, priority, projectId, assigned_to || null, due_date || null);

    const task = db.prepare(`
      SELECT t.*, u.name AS assigned_to_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(task);
  } catch (err) {
    console.error('Error en createTask:', err);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
}

/**
 * PUT /api/tasks/:id
 * Actualiza una tarea (título, estado, prioridad, asignado, etc.)
 */
function updateTask(req, res) {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assigned_to, due_date } = req.body;
    const db = getDb();

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

    db.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, status = ?, priority = ?,
          assigned_to = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title || task.title,
      description !== undefined ? description : task.description,
      status || task.status,
      priority || task.priority,
      assigned_to !== undefined ? assigned_to : task.assigned_to,
      due_date !== undefined ? due_date : task.due_date,
      id
    );

    const updated = db.prepare(`
      SELECT t.*, u.name AS assigned_to_name
      FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ?
    `).get(id);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar tarea' });
  }
}

/**
 * DELETE /api/tasks/:id
 * Elimina una tarea
 */
function deleteTask(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.json({ message: 'Tarea eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
}

/**
 * PATCH /api/tasks/:id/status
 * Actualiza solo el estado de una tarea (para el Kanban drag & drop)
 */
function updateTaskStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = getDb();

    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    db.prepare('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, id);

    const task = db.prepare(`
      SELECT t.*, u.name AS assigned_to_name
      FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ?
    `).get(id);

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
}

module.exports = { getTasks, createTask, updateTask, deleteTask, updateTaskStatus };

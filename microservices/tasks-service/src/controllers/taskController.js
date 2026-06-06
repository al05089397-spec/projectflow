const { getDb } = require('../config/database');

const getTasks = (req, res) => {
  const db = getDb();
  const { projectId } = req.params;
  const tasks = projectId
    ? db.prepare('SELECT * FROM tasks WHERE project_id = ?').all(projectId)
    : db.prepare('SELECT * FROM tasks WHERE assigned_to = ? OR created_by = ?').all(req.user.id, req.user.id);
  res.json(tasks);
};

const getTask = (req, res) => {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
  res.json(task);
};

const createTask = (req, res) => {
  const { title, description, status, priority, project_id, assigned_to, due_date } = req.body;
  if (!title || !project_id) return res.status(400).json({ error: 'Título y proyecto son requeridos' });
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO tasks (title, description, status, priority, project_id, assigned_to, created_by, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(title, description || '', status || 'todo', priority || 'medium', project_id, assigned_to || null, req.user.id, due_date || null);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(task);
};

const updateTask = (req, res) => {
  const { title, description, status, priority, assigned_to, due_date } = req.body;
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
  db.prepare(
    'UPDATE tasks SET title=?, description=?, status=?, priority=?, assigned_to=?, due_date=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).run(title||task.title, description||task.description, status||task.status, priority||task.priority, assigned_to||task.assigned_to, due_date||task.due_date, req.params.id);
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id));
};

const deleteTask = (req, res) => {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Tarea eliminada' });
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask };
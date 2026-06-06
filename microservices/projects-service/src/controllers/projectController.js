const { getDb } = require('../config/database');

const getProjects = (req, res) => {
  const db = getDb();
  const projects = db.prepare(`
    SELECT p.*, pm.role as user_role
    FROM projects p
    LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
    WHERE p.owner_id = ? OR pm.user_id = ?
  `).all(req.user.id, req.user.id, req.user.id);
  res.json(projects);
};

const getProject = (req, res) => {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
  res.json(project);
};

const createProject = (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es requerido' });

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)'
  ).run(name, description || '', req.user.id);

  db.prepare(
    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
  ).run(result.lastInsertRowid, req.user.id, 'owner');

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(project);
};

const updateProject = (req, res) => {
  const { name, description, status } = req.body;
  const db = getDb();

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

  db.prepare(
    'UPDATE projects SET name = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(name || project.name, description || project.description, status || project.status, req.params.id);

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json(updated);
};

const deleteProject = (req, res) => {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

  db.prepare('DELETE FROM project_members WHERE project_id = ?').run(req.params.id);
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ message: 'Proyecto eliminado' });
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject };
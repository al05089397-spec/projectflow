// controllers/projectController.js
// CRUD completo para proyectos
const { getDb } = require('../config/database');

/**
 * GET /api/projects
 * Lista todos los proyectos donde el usuario es miembro o dueño
 */
function getProjects(req, res) {
  try {
    const db = getDb();
    const userId = req.user.id;

    const projects = db.prepare(`
      SELECT p.*, 
             u.name AS owner_name,
             COUNT(DISTINCT t.id) AS task_count,
             COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) AS completed_tasks,
             COUNT(DISTINCT pm.user_id) AS member_count
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.owner_id = ? OR pm.user_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all(userId, userId);

    res.json(projects);
  } catch (err) {
    console.error('Error en getProjects:', err);
    res.status(500).json({ error: 'Error al obtener proyectos' });
  }
}

/**
 * GET /api/projects/:id
 * Obtiene un proyecto por ID con sus miembros
 */
function getProjectById(req, res) {
  try {
    const db = getDb();
    const { id } = req.params;

    const project = db.prepare(`
      SELECT p.*, u.name AS owner_name
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `).get(id);

    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    // Obtener miembros
    const members = db.prepare(`
      SELECT u.id, u.name, u.email, u.role
      FROM users u
      JOIN project_members pm ON u.id = pm.user_id
      WHERE pm.project_id = ?
    `).all(id);

    res.json({ ...project, members });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener proyecto' });
  }
}

/**
 * POST /api/projects
 * Crea un nuevo proyecto
 */
function createProject(req, res) {
  try {
    const { name, description, status = 'active' } = req.body;
    const db = getDb();

    if (!name) return res.status(400).json({ error: 'El nombre del proyecto es requerido' });

    const result = db.prepare(
      'INSERT INTO projects (name, description, status, owner_id) VALUES (?, ?, ?, ?)'
    ).run(name, description || '', status, req.user.id);

    // Agregar al creador como miembro automáticamente
    db.prepare('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)')
      .run(result.lastInsertRowid, req.user.id);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(project);
  } catch (err) {
    console.error('Error en createProject:', err);
    res.status(500).json({ error: 'Error al crear proyecto' });
  }
}

/**
 * PUT /api/projects/:id
 * Actualiza un proyecto existente
 */
function updateProject(req, res) {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;
    const db = getDb();

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    // Solo el dueño o admin puede editar
    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sin permisos para editar este proyecto' });
    }

    db.prepare(`
      UPDATE projects 
      SET name = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || project.name,
      description !== undefined ? description : project.description,
      status || project.status,
      id
    );

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar proyecto' });
  }
}

/**
 * DELETE /api/projects/:id
 * Elimina un proyecto (cascada en tareas y mensajes)
 */
function deleteProject(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sin permisos para eliminar este proyecto' });
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    res.json({ message: 'Proyecto eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar proyecto' });
  }
}

/**
 * POST /api/projects/:id/members
 * Agrega un miembro al proyecto
 */
function addMember(req, res) {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const db = getDb();

    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)')
      .run(id, userId);

    res.json({ message: 'Miembro agregado', user });
  } catch (err) {
    res.status(500).json({ error: 'Error al agregar miembro' });
  }
}

module.exports = { getProjects, getProjectById, createProject, updateProject, deleteProject, addMember };

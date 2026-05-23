// controllers/userController.js
// CRUD de usuarios (acceso admin)
const bcrypt = require('bcryptjs');
const { getDb } = require('../config/database');

/**
 * GET /api/users
 * Lista todos los usuarios (admin) o usuarios disponibles para asignar
 */
function getUsers(req, res) {
  try {
    const db = getDb();
    const users = db.prepare(
      'SELECT id, name, email, role, created_at FROM users ORDER BY name ASC'
    ).all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
}

/**
 * GET /api/users/:id
 * Obtiene un usuario por ID
 */
function getUserById(req, res) {
  try {
    const db = getDb();
    const user = db.prepare(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?'
    ).get(req.params.id);

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
}

/**
 * PUT /api/users/:id
 * Actualiza un usuario (solo admin o el propio usuario)
 */
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;
    const db = getDb();

    // Solo admin puede cambiar roles, o el propio usuario puede editar sus datos
    if (parseInt(id) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sin permisos para editar este usuario' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    let newPassword = user.password;
    if (password) {
      newPassword = await bcrypt.hash(password, 10);
    }

    // Solo admin puede cambiar el rol
    const newRole = (req.user.role === 'admin' && role) ? role : user.role;

    db.prepare(`
      UPDATE users SET name = ?, email = ?, password = ?, role = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name || user.name, email || user.email, newPassword, newRole, id);

    const updated = db.prepare(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?'
    ).get(id);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
}

/**
 * DELETE /api/users/:id
 * Elimina un usuario (solo admin)
 */
function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();

    // No se puede eliminar a sí mismo
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
}

module.exports = { getUsers, getUserById, updateUser, deleteUser };

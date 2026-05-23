// controllers/authController.js
// Controlador de autenticación: registro e inicio de sesión
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');

/**
 * POST /api/auth/register
 * Registra un nuevo usuario
 */
async function register(req, res) {
  try {
    const { name, email, password, role = 'member' } = req.body;

    // Validaciones
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const db = getDb();

    // Verificar que el email no exista
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const result = db.prepare(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
    ).run(name, email, hashedPassword, role);

    const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?')
      .get(result.lastInsertRowid);

    // Generar token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Error en register:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * POST /api/auth/login
 * Inicia sesión y retorna token JWT
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * GET /api/auth/me
 * Retorna el perfil del usuario autenticado
 */
function me(req, res) {
  try {
    const db = getDb();
    const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?')
      .get(req.user.id);

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { register, login, me };

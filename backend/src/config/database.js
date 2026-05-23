// config/database.js
// Configuración y esquema de la base de datos SQLite
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../projectflow.db');

let db;

/**
 * Inicializa la conexión a la base de datos y crea las tablas si no existen
 */
function initDatabase() {
  db = new Database(DB_PATH);

  // Habilitar foreign keys
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Crear tablas
  db.exec(`
    -- Tabla de usuarios
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      email       TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      role        TEXT    NOT NULL DEFAULT 'member' CHECK(role IN ('admin', 'member')),
      avatar      TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de proyectos
    CREATE TABLE IF NOT EXISTS projects (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      description TEXT,
      status      TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'paused')),
      owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de miembros por proyecto
    CREATE TABLE IF NOT EXISTS project_members (
      project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (project_id, user_id)
    );

    -- Tabla de tareas
    CREATE TABLE IF NOT EXISTS tasks (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      title        TEXT    NOT NULL,
      description  TEXT,
      status       TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
      priority     TEXT    NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
      project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      assigned_to  INTEGER REFERENCES users(id) ON DELETE SET NULL,
      due_date     DATE,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de mensajes de chat
    CREATE TABLE IF NOT EXISTS messages (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      content     TEXT    NOT NULL,
      project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Datos de demostración (solo si la tabla está vacía)
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    seedDatabase();
  }

  console.log('✅ Base de datos inicializada correctamente');
  return db;
}

/**
 * Inserta datos de demostración
 */
function seedDatabase() {
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('admin123', 10);
  const hashMember = bcrypt.hashSync('member123', 10);

  db.prepare(`
    INSERT INTO users (name, email, password, role) VALUES
    ('Admin ProjectFlow', 'admin@projectflow.com', ?, 'admin'),
    ('Ana García', 'ana@projectflow.com', ?, 'member'),
    ('Luis Martínez', 'luis@projectflow.com', ?, 'member')
  `).run(hash, hashMember, hashMember);

  db.prepare(`
    INSERT INTO projects (name, description, status, owner_id) VALUES
    ('App Móvil v2.0', 'Rediseño completo de la aplicación móvil con nuevo sistema de pagos', 'active', 1),
    ('API Gateway', 'Implementación del API Gateway centralizado para todos los microservicios', 'active', 1),
    ('Dashboard Analytics', 'Panel de análisis de datos en tiempo real para el equipo de negocio', 'paused', 1)
  `).run();

  db.prepare(`
    INSERT INTO project_members (project_id, user_id) VALUES
    (1, 1), (1, 2), (1, 3),
    (2, 1), (2, 2),
    (3, 1), (3, 3)
  `).run();

  db.prepare(`
    INSERT INTO tasks (title, description, status, priority, project_id, assigned_to) VALUES
    ('Diseño de pantallas principales', 'Wireframes y mockups en Figma', 'completed', 'high', 1, 2),
    ('Integración con pasarela de pagos', 'Stripe y PayPal', 'in_progress', 'high', 1, 3),
    ('Pruebas de usabilidad', 'Testing con usuarios reales', 'pending', 'medium', 1, 2),
    ('Configurar Kong Gateway', 'Instalación y configuración base', 'in_progress', 'high', 2, 1),
    ('Documentar endpoints', 'Swagger/OpenAPI para todos los servicios', 'pending', 'medium', 2, 2),
    ('Diseñar esquema de datos', 'Modelo de datos para el dashboard', 'pending', 'high', 3, 3)
  `).run();

  console.log('🌱 Datos de demostración insertados');
}

function getDb() {
  if (!db) throw new Error('Base de datos no inicializada');
  return db;
}

module.exports = { initDatabase, getDb };

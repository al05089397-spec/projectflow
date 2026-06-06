const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../auth.db');

let db;

function initDatabase() {
  db = new Database(DB_PATH);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  const admin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@projectflow.com');
  if (!admin) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`).run('Admin', 'admin@projectflow.com', hash, 'admin');
    const hash2 = bcrypt.hashSync('member123', 10);
    db.prepare(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`).run('Ana López', 'ana@projectflow.com', hash2, 'member');
  }

  console.log('Auth DB lista');
  return db;
}

function getDb() {
  if (!db) initDatabase();
  return db;
}

module.exports = { initDatabase, getDb };

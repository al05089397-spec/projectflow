require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./config/database');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.use('/api/tasks', taskRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'tasks-service', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.path} no encontrada` });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

initDatabase();

app.listen(PORT, () => {
  console.log(`Tasks Service corriendo en puerto ${PORT}`);
});

module.exports = app;
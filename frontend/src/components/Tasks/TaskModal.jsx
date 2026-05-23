// components/Tasks/TaskModal.jsx
import { useState, useEffect } from 'react';
import { tasksAPI } from '../../services/api';

export default function TaskModal({ task, projectId, defaultStatus, users, onClose, onSaved, socket, projectName, currentUser }) {
  const [form, setForm] = useState({
    title: '', description: '', status: defaultStatus || 'pending',
    priority: 'medium', assigned_to: '', due_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!task;

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title, description: task.description || '',
        status: task.status, priority: task.priority,
        assigned_to: task.assigned_to || '',
        due_date: task.due_date ? task.due_date.split('T')[0] : ''
      });
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('El título es requerido');
    setLoading(true); setError('');

    try {
      const payload = { ...form, assigned_to: form.assigned_to || null };
      if (isEdit) {
        await tasksAPI.update(task.id, payload);
      } else {
        const res = await tasksAPI.create(projectId, payload);
        // Notificar al usuario asignado via socket
        if (form.assigned_to && socket) {
          socket.emit('task_assigned', {
            taskId: res.data.id,
            assignedToId: parseInt(form.assigned_to),
            taskTitle: form.title,
            projectName
          });
        }
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const f = (field, val) => setForm(p => ({ ...p, [field]: val }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Editar tarea' : 'Nueva tarea'}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label>Título *</label>
            <input className="input" value={form.title} onChange={e => f('title', e.target.value)} placeholder="¿Qué hay que hacer?" />
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <textarea className="input" value={form.description} onChange={e => f('description', e.target.value)} placeholder="Detalles opcionales..." style={{ minHeight: 70 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Estado</label>
              <select className="input" value={form.status} onChange={e => f('status', e.target.value)}>
                <option value="pending">⏳ Pendiente</option>
                <option value="in_progress">🔄 En progreso</option>
                <option value="completed">✅ Completada</option>
              </select>
            </div>
            <div className="form-group">
              <label>Prioridad</label>
              <select className="input" value={form.priority} onChange={e => f('priority', e.target.value)}>
                <option value="high">🔴 Alta</option>
                <option value="medium">🟡 Media</option>
                <option value="low">🟢 Baja</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Asignar a</label>
              <select className="input" value={form.assigned_to} onChange={e => f('assigned_to', e.target.value)}>
                <option value="">Sin asignar</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Fecha límite</label>
              <input className="input" type="date" value={form.due_date} onChange={e => f('due_date', e.target.value)} />
            </div>
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>⚠️ {error}</p>}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {isEdit ? 'Guardar cambios' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

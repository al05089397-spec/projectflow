// components/Projects/ProjectModal.jsx
import { useState, useEffect } from 'react';
import { projectsAPI } from '../../services/api';

export default function ProjectModal({ project, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', description: '', status: 'active' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!project;

  useEffect(() => {
    if (project) setForm({ name: project.name, description: project.description || '', status: project.status });
  }, [project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('El nombre es requerido');
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        await projectsAPI.update(project.id, form);
      } else {
        await projectsAPI.create(form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Editar proyecto' : 'Nuevo proyecto'}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="form-group">
            <label>Nombre *</label>
            <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nombre del proyecto" />
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <textarea className="input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="¿De qué trata este proyecto?" />
          </div>
          <div className="form-group">
            <label>Estado</label>
            <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="active">Activo</option>
              <option value="paused">Pausado</option>
              <option value="completed">Completado</option>
            </select>
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>⚠️ {error}</p>}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {isEdit ? 'Guardar cambios' : 'Crear proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

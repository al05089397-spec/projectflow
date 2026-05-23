// pages/UsersPage.jsx
// Gestión de usuarios — solo admin
import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'member', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/dashboard'); return; }
    usersAPI.getAll()
      .then(r => setUsers(r.data))
      .finally(() => setLoading(false));
  }, []);

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, role: u.role, password: '' });
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = { name: form.name, email: form.email, role: form.role };
      if (form.password) payload.password = form.password;
      await usersAPI.update(editUser.id, payload);
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...payload } : u));
      setEditUser(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await usersAPI.delete(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Gestión de usuarios</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{users.length} usuarios registrados</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {users.map(u => (
          <div key={u.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' }}>
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{u.name} {u.id === user?.id && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(tú)</span>}</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{u.email}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span className={`badge ${u.role === 'admin' ? 'badge-in_progress' : 'badge-pending'}`}>
                {u.role === 'admin' ? 'Admin' : 'Miembro'}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(u)} className="btn btn-secondary btn-sm">✏️ Editar</button>
                {u.id !== user?.id && (
                  <button onClick={() => handleDelete(u.id)} className="btn btn-danger btn-sm">🗑️</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de edición */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar usuario</h3>
              <button onClick={() => setEditUser(null)} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Nombre</label>
                <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="member">Miembro</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="form-group">
                <label>Nueva contraseña (opcional)</label>
                <input className="input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Dejar vacío para no cambiar" />
              </div>
              {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>⚠️ {error}</p>}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditUser(null)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

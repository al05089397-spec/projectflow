// pages/DashboardPage.jsx
// Vista principal con stats, gráficas, buscador y filtros
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProjectModal from '../components/Projects/ProjectModal';

const STATUS_LABEL = { active: 'Activo', completed: 'Completado', paused: 'Pausado' };
const PRIORITY_COLORS = { active: 'badge-active', completed: 'badge-completed', paused: 'badge-paused' };

// ─── Gráfica Dona ─────────────────────────────────────────────────────────────
function DonutChart({ pending, inProgress, completed, total }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || total === 0) return;
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const R = 80, r = 52;

    const segments = [
      { value: pending,    color: '#8b949e' },
      { value: inProgress, color: '#58a6ff' },
      { value: completed,  color: '#3fb950' },
    ].filter(s => s.value > 0);

    let progress = 0;
    const duration = 900;
    const start = performance.now();

    const draw = (now) => {
      progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let startAngle = -Math.PI / 2;
      segments.forEach(seg => {
        const fullSlice = (seg.value / total) * 2 * Math.PI;
        const slice = fullSlice * ease;
        ctx.shadowColor = seg.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, startAngle, startAngle + slice);
        ctx.closePath();
        ctx.fillStyle = seg.color;
        ctx.fill();
        startAngle += fullSlice;
      });

      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.fillStyle = '#21262d';
      ctx.fill();

      if (ease > 0.5) {
        ctx.fillStyle = '#e6edf3';
        ctx.font = 'bold 22px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(total, cx, cy - 8);
        ctx.font = '11px Plus Jakarta Sans, sans-serif';
        ctx.fillStyle = '#8b949e';
        ctx.fillText('tareas', cx, cy + 12);
      }

      if (progress < 1) animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [pending, inProgress, completed, total]);

  if (total === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
      Sin tareas aún
    </div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
      <canvas ref={canvasRef} width={200} height={200} style={{ flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { label: 'Pendiente',   value: pending,    color: '#8b949e', pct: total ? Math.round(pending/total*100) : 0 },
          { label: 'En progreso', value: inProgress, color: '#58a6ff', pct: total ? Math.round(inProgress/total*100) : 0 },
          { label: 'Completada',  value: completed,  color: '#3fb950', pct: total ? Math.round(completed/total*100) : 0 },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0, boxShadow: `0 0 6px ${item.color}` }} />
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.label}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {item.value} <span style={{ fontSize: '0.75rem', color: item.color, fontWeight: 600 }}>{item.pct}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Barras por proyecto ──────────────────────────────────────────────────────
function ProjectBars({ projects }) {
  if (projects.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {projects.map(p => {
        const total = p.task_count || 0;
        const done = p.completed_tasks || 0;
        const inProg = Math.max(0, total - done > 0 ? Math.ceil((total - done) / 2) : 0);
        const pending = total - done - inProg;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        return (
          <div key={p.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: pct === 100 ? 'var(--success)' : 'var(--accent)' }}>{pct}%</span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: 'var(--bg-base)', overflow: 'hidden', display: 'flex' }}>
              {done > 0 && total > 0 && <div style={{ width: `${(done/total)*100}%`, background: '#3fb950', transition: 'width 0.8s ease', boxShadow: '0 0 6px #3fb950' }} />}
              {inProg > 0 && total > 0 && <div style={{ width: `${(inProg/total)*100}%`, background: '#58a6ff' }} />}
              {pending > 0 && total > 0 && <div style={{ width: `${(pending/total)*100}%`, background: '#30363d' }} />}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 5 }}>
              <span style={{ fontSize: '0.7rem', color: '#3fb950' }}>✓ {done} completadas</span>
              <span style={{ fontSize: '0.7rem', color: '#58a6ff' }}>⟳ {inProg} en progreso</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>○ {pending} pendientes</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Contador animado ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, color }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 800;
    const startTime = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(ease * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <div style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{display}</div>;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();
  const navigate = useNavigate();

  const loadProjects = async () => {
    try {
      const res = await projectsAPI.getAll();
      setProjects(res.data);
    } catch (err) {
      console.error('Error cargando proyectos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar este proyecto? Se eliminarán todas sus tareas.')) return;
    try {
      await projectsAPI.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditProject(null);
    loadProjects();
  };

  // Stats globales
  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    tasks: projects.reduce((s, p) => s + (p.task_count || 0), 0),
    done: projects.reduce((s, p) => s + (p.completed_tasks || 0), 0),
  };

  // Datos dona
  const taskStats = {
    completed: stats.done,
    inProgress: projects.reduce((s, p) => s + (p.task_count > p.completed_tasks ? Math.ceil((p.task_count - p.completed_tasks) / 2) : 0), 0),
    pending: 0,
  };
  taskStats.pending = Math.max(0, stats.tasks - taskStats.completed - taskStats.inProgress);

  // Filtrado y búsqueda en tiempo real
  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        (p.description || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return (
    <div style={styles.center}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
  );

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Hola, <strong>{user?.name}</strong> — {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Nuevo proyecto</button>
      </div>

      {/* Stats con contador animado */}
      <div style={styles.statsGrid}>
        {[
          { label: 'Proyectos',     value: stats.total,  icon: '📁', color: 'var(--accent)' },
          { label: 'Activos',       value: stats.active, icon: '🟢', color: 'var(--success)' },
          { label: 'Tareas totales',value: stats.tasks,  icon: '📋', color: 'var(--info)' },
          { label: 'Completadas',   value: stats.done,   icon: '✅', color: 'var(--success)' },
        ].map(s => (
          <div key={s.label} className="card" style={styles.statCard}>
            <div style={{ fontSize: '1.6rem' }}>{s.icon}</div>
            <div>
              <AnimatedNumber value={s.value} color={s.color} />
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficas */}
      {projects.length > 0 && (
        <div style={styles.chartsGrid}>
          <div className="card" style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Distribución de tareas</h3>
            <DonutChart pending={taskStats.pending} inProgress={taskStats.inProgress} completed={taskStats.completed} total={stats.tasks} />
          </div>
          <div className="card" style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Progreso por proyecto</h3>
            <ProjectBars projects={projects} />
          </div>
        </div>
      )}

      {/* Buscador y filtros */}
      <div style={styles.searchRow}>
        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            className="input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar proyectos por nombre o descripción..."
            style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, color: 'var(--text-primary)', fontSize: '0.9rem' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', padding: '0 8px' }}>✕</button>
          )}
        </div>
        <div style={styles.filterRow}>
          {[
            { key: 'all',       label: 'Todos' },
            { key: 'active',    label: 'Activos' },
            { key: 'paused',    label: 'Pausados' },
            { key: 'completed', label: 'Completados' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="btn btn-sm"
              style={{
                background: filter === f.key ? 'var(--accent-dim)' : 'transparent',
                color: filter === f.key ? 'var(--accent)' : 'var(--text-secondary)',
                border: `1px solid ${filter === f.key ? 'var(--accent)' : 'var(--border)'}`,
                transition: 'all 0.2s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resultado búsqueda */}
      {search && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 12 }}>
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "<strong style={{ color: 'var(--text-secondary)' }}>{search}</strong>"
        </p>
      )}

      {/* Proyectos */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          {filter === 'all' ? 'Mis proyectos' : `Proyectos ${STATUS_LABEL[filter]?.toLowerCase() || filter}`}
          <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400 }}>({filtered.length})</span>
        </h2>

        {filtered.length === 0 ? (
          <div style={styles.empty}>
            <span style={{ fontSize: '3rem' }}>{search ? '🔍' : '📁'}</span>
            <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>
              {search ? `No se encontraron proyectos para "${search}"` : 'No tienes proyectos aún. ¡Crea el primero!'}
            </p>
            {!search && (
              <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ marginTop: 16 }}>
                + Crear proyecto
              </button>
            )}
          </div>
        ) : (
          <div style={styles.projectGrid}>
            {filtered.map(p => {
              const progress = p.task_count > 0 ? Math.round((p.completed_tasks / p.task_count) * 100) : 0;
              return (
                <div key={p.id} className="card card-hover" style={styles.projectCard} onClick={() => navigate(`/projects/${p.id}`)}>
                  <div style={styles.cardHeader}>
                    <div style={styles.cardTitleRow}>
                      <h3 style={styles.projectName}>{p.name}</h3>
                      <span className={`badge ${PRIORITY_COLORS[p.status] || ''}`}>{STATUS_LABEL[p.status]}</span>
                    </div>
                    {p.description && <p style={styles.projectDesc}>{p.description}</p>}
                  </div>
                  <div style={styles.progressArea}>
                    <div style={styles.progressBar}>
                      <div style={{ ...styles.progressFill, width: `${progress}%` }} />
                    </div>
                    <span style={styles.progressText}>{progress}%</span>
                  </div>
                  <div style={styles.cardFooter}>
                    <div style={styles.cardMeta}>
                      <span>📋 {p.task_count}</span>
                      <span>👥 {p.member_count}</span>
                    </div>
                    {(user?.role === 'admin' || p.owner_id === user?.id) && (
                      <div style={styles.cardActions} onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setEditProject(p); setShowModal(true); }}>✏️</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={e => handleDelete(e, p.id)}>🗑️</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <ProjectModal project={editProject} onClose={() => { setShowModal(false); setEditProject(null); }} onSaved={handleSaved} />
      )}
    </div>
  );
}

const styles = {
  page: { padding: '28px 32px', maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontSize: '1.8rem', fontWeight: 800 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 },
  statCard: { display: 'flex', alignItems: 'center', gap: 16 },
  chartsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 },
  chartCard: { padding: '24px' },
  chartTitle: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 },
  searchRow: { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' },
  searchBox: { display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 14px', flex: 1, minWidth: 220, transition: 'border-color 0.2s' },
  searchIcon: { fontSize: '0.9rem', color: 'var(--text-muted)' },
  filterRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  section: { marginTop: 8 },
  sectionTitle: { marginBottom: 20, color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  projectGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
  projectCard: { display: 'flex', flexDirection: 'column', gap: 16, transition: 'all 0.2s' },
  cardHeader: { flex: 1 },
  cardTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  projectName: { fontSize: '1rem', fontWeight: 700 },
  projectDesc: { fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  progressArea: { display: 'flex', alignItems: 'center', gap: 10 },
  progressBar: { flex: 1, height: 6, background: 'var(--bg-base)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'var(--accent)', borderRadius: 3, transition: 'width 0.5s ease' },
  progressText: { fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: 32, textAlign: 'right' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardMeta: { display: 'flex', gap: 16, fontSize: '0.82rem', color: 'var(--text-secondary)' },
  cardActions: { display: 'flex', gap: 4 },
  empty: { textAlign: 'center', padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' },
};

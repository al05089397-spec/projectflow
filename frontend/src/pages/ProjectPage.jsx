// pages/ProjectPage.jsx
// Vista detalle: Kanban (neon) + Lista + Gantt + Chat en tiempo real
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, tasksAPI, usersAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/Tasks/TaskModal';

// ─── Paleta neon por estado ───────────────────────────────────────────────────
const NEON = {
  pending:     { color: '#FFE500', bg: 'rgba(255,229,0,0.05)',  border: 'rgba(255,229,0,0.22)', col: 'rgba(255,229,0,0.25)', sub: 'rgba(255,229,0,0.12)' },
  in_progress: { color: '#00D4FF', bg: 'rgba(0,212,255,0.05)',  border: 'rgba(0,212,255,0.22)', col: 'rgba(0,212,255,0.25)', sub: 'rgba(0,212,255,0.12)' },
  completed:   { color: '#39FF14', bg: 'rgba(57,255,20,0.03)',  border: 'rgba(57,255,20,0.18)', col: 'rgba(57,255,20,0.22)', sub: 'rgba(57,255,20,0.10)' },
};

const COLUMNS = [
  { key: 'pending',     label: '⏳ Pendiente' },
  { key: 'in_progress', label: '🔄 En progreso' },
  { key: 'completed',   label: '✅ Completada' },
];

const PRIORITY_CLASS = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
const PRIORITY_LABEL = { high: 'Alta', medium: 'Media', low: 'Baja' };
const STATUS_LABEL   = { pending: 'Pendiente', in_progress: 'En progreso', completed: 'Completada' };

// ─── GANTT ────────────────────────────────────────────────────────────────────
function GanttChart({ tasks }) {
  const withDates = tasks.filter(t => t.due_date);
  if (withDates.length === 0) return (
    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📅</div>
      <p>Ninguna tarea tiene fecha límite.</p>
      <p style={{ fontSize: '0.82rem', marginTop: 8 }}>Edita las tareas y agrega fechas para ver el Gantt.</p>
    </div>
  );
  const dates = withDates.map(t => new Date(t.due_date));
  const minDate = new Date(Math.min(...dates)); minDate.setDate(minDate.getDate() - 3);
  const maxDate = new Date(Math.max(...dates)); maxDate.setDate(maxDate.getDate() + 3);
  const totalDays = Math.ceil((maxDate - minDate) / 86400000);
  const dayColumns = Array.from({ length: totalDays + 1 }, (_, i) => { const d = new Date(minDate); d.setDate(d.getDate() + i); return d; });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const getOffset = date => { const d = new Date(date); d.setHours(0,0,0,0); return Math.max(0, Math.ceil((d - minDate) / 86400000)); };
  const colW = 44, labelW = 180, rowH = 48;

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
      <div style={{ minWidth: labelW + dayColumns.length * colW }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 2 }}>
          <div style={{ width: labelW, flexShrink: 0, padding: '10px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>TAREA</div>
          {dayColumns.map((d, i) => {
            const isToday = d.toDateString() === today.toDateString();
            return <div key={i} style={{ width: colW, flexShrink: 0, textAlign: 'center', padding: '6px 2px', fontSize: '0.65rem', fontWeight: isToday ? 800 : 400, color: isToday ? '#00D4FF' : 'var(--text-muted)', background: isToday ? 'rgba(0,212,255,0.06)' : 'transparent', borderLeft: `1px solid ${isToday ? '#00D4FF' : 'var(--border)'}` }}>
              <div>{d.getDate()}</div><div style={{ fontSize: '0.58rem', opacity: 0.7 }}>{d.toLocaleDateString('es-MX',{month:'short'})}</div>
            </div>;
          })}
        </div>
        {withDates.map((task, idx) => {
          const dueOff = getOffset(task.due_date);
          const startOff = Math.max(0, dueOff - 3);
          const barW = Math.max(1, dueOff - startOff);
          const neon = NEON[task.status] || NEON.pending;
          return (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', height: rowH }}>
              <div style={{ width: labelW, flexShrink: 0, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: neon.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{task.title}</span>
              </div>
              <div style={{ position: 'relative', display: 'flex', flex: 1, height: '100%', alignItems: 'center' }}>
                {dayColumns.map((d, i) => {
                  const isTodayCol = d.toDateString() === today.toDateString();
                  return <div key={i} style={{ width: colW, flexShrink: 0, height: '100%', background: isTodayCol ? 'rgba(0,212,255,0.05)' : 'transparent', borderLeft: `1px solid ${isTodayCol ? '#00D4FF' : 'var(--border)'}` }} />;
                })}
                <div style={{ position: 'absolute', left: startOff * colW + 2, width: barW * colW - 4, height: 26, background: `linear-gradient(90deg,${neon.color}99,${neon.color})`, borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 8, boxShadow: `0 0 10px ${neon.color}44`, zIndex: 1, minWidth: 8 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0d1117', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{barW > 1 ? task.title : ''}</span>
                </div>
                <div style={{ position: 'absolute', left: dueOff * colW + colW / 2 - 1, top: 6, bottom: 6, width: 2, background: neon.color, borderRadius: 1, zIndex: 2 }} />
              </div>
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: 20, padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
          {Object.entries(NEON).map(([k, n]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 7, background: n.color, borderRadius: 3 }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{STATUS_LABEL[k]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LISTA ────────────────────────────────────────────────────────────────────
function ListView({ tasks, onEdit, onDelete, onStatusChange }) {
  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Tarea','Estado','Prioridad','Asignado','Fecha límite',''].map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Sin tareas</td></tr>}
          {tasks.map((task, idx) => {
            const neon = NEON[task.status] || NEON.pending;
            return (
              <tr key={task.id} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <td style={{ padding: '11px 14px', borderLeft: `3px solid ${neon.color}` }}>
                  <div style={{ fontWeight: 600, fontSize: '0.87rem', color: 'var(--text-primary)' }}>{task.title}</div>
                  {task.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{task.description}</div>}
                </td>
                <td style={{ padding: '11px 14px' }}>
                  <select value={task.status} onChange={e => onStatusChange(task.id, e.target.value)} className="input" style={{ fontSize: '0.75rem', padding: '4px 8px', width: 'auto' }}>
                    {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label.replace(/[^\w\s]/g,'').trim()}</option>)}
                  </select>
                </td>
                <td style={{ padding: '11px 14px' }}><span className={`badge ${PRIORITY_CLASS[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span></td>
                <td style={{ padding: '11px 14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{task.assigned_to_name || '—'}</td>
                <td style={{ padding: '11px 14px', fontSize: '0.8rem', color: task.due_date ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{task.due_date ? new Date(task.due_date).toLocaleDateString('es-MX') : '—'}</td>
                <td style={{ padding: '11px 14px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => onEdit(task)} className="btn btn-ghost btn-sm">✏️</button>
                    <button onClick={() => onDelete(task.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>🗑️</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);
  const [showChat, setShowChat] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban');
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const chatEndRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    Promise.all([projectsAPI.getById(id), tasksAPI.getByProject(id), usersAPI.getAll()])
      .then(([pRes, tRes, uRes]) => { setProject(pRes.data); setTasks(tRes.data); setUsers(uRes.data); })
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_project', id);
    socket.on('chat_history', msgs => setMessages(msgs));
    socket.on('new_message', msg => setMessages(prev => [...prev, msg]));
    socket.on('user_typing', ({ userName }) => setTypingUsers(prev => prev.includes(userName) ? prev : [...prev, userName]));
    socket.on('user_stop_typing', () => setTypingUsers([]));
    socket.on('board_updated', () => tasksAPI.getByProject(id).then(r => setTasks(r.data)));
    return () => {
      socket.emit('leave_project', id);
      ['chat_history','new_message','user_typing','user_stop_typing','board_updated'].forEach(e => socket.off(e));
    };
  }, [socket, id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = e => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;
    socket.emit('send_message', { projectId: id, content: chatInput });
    setChatInput('');
    socket.emit('stop_typing', { projectId: id });
  };

  const handleTyping = e => {
    setChatInput(e.target.value);
    if (!socket) return;
    socket.emit('typing', { projectId: id });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket.emit('stop_typing', { projectId: id }), 1500);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;
    try {
      await tasksAPI.updateStatus(taskId, newStatus);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      socket?.emit('task_status_changed', { projectId: id, taskTitle: task.title, newStatus, changedBy: user.name });
    } catch (err) { console.error(err); }
  };

  const handleDeleteTask = async taskId => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    await tasksAPI.delete(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleTaskSaved = async () => {
    const res = await tasksAPI.getByProject(id);
    setTasks(res.data);
    setShowTaskModal(false);
    setEditTask(null);
  };

  // Stats
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Drag & drop
  const onDragStart = (e, taskId) => { setDraggedTaskId(taskId); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(taskId)); };
  const onDragEnd = () => { setDraggedTaskId(null); setDragOverCol(null); };
  const onDragOver = (e, colKey) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverCol(colKey); };
  const onDragLeave = () => setDragOverCol(null);
  const onDrop = (e, colKey) => { e.preventDefault(); if (draggedTaskId) handleStatusChange(draggedTaskId, colKey); setDraggedTaskId(null); setDragOverCol(null); };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>;

  return (
    <div style={S.page}>
      {/* ── HEADER CON BORDE GRADIENTE NEON ─────────────────────────── */}
      <div style={{ position: 'relative', borderRadius: 14, padding: 1.5, background: 'linear-gradient(135deg,#FFE500,#00D4FF,#39FF14)', flexShrink: 0 }}>
        <div style={{ background: '#161b22', borderRadius: 13, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-sm">← Volver</button>
                <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{project?.name}</h1>
                <span className={`badge ${project?.status === 'active' ? 'badge-active' : project?.status === 'paused' ? 'badge-paused' : 'badge-completed'}`}>
                  {project?.status === 'active' ? 'Activo' : project?.status === 'paused' ? 'Pausado' : 'Completado'}
                </span>
              </div>
              {project?.description && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12 }}>{project.description}</p>}
              {/* Barra de progreso con gradiente neon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 220, height: 6, background: '#0d1117', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#FFE500,#00D4FF,#39FF14)', borderRadius: 3, transition: 'width 0.5s ease' }} />
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#00D4FF' }}>{progress}%</span>
              </div>
            </div>
            {/* Stats neon */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
              {[
                { label: 'Total',       value: total,      color: 'var(--text-primary)' },
                { label: 'Pendientes',  value: pending,    color: '#FFE500' },
                { label: 'En progreso', value: inProgress, color: '#00D4FF' },
                { label: 'Completadas', value: completed,  color: '#39FF14' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', background: '#0d1117', borderRadius: 10, padding: '8px 14px', border: '1px solid #30363d' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Acciones */}
            <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start' }}>
              <button onClick={() => setShowChat(!showChat)} className="btn btn-secondary btn-sm">{showChat ? '📋 Sin chat' : '💬 Chat'}</button>
              <button onClick={() => { setActiveColumn('pending'); setShowTaskModal(true); }} className="btn btn-primary btn-sm">+ Tarea</button>
            </div>
          </div>

          {/* Toggle vistas */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' }}>
            {[{ key: 'kanban', icon: '⬜', label: 'Kanban' }, { key: 'list', icon: '☰', label: 'Lista' }, { key: 'gantt', icon: '📊', label: 'Gantt' }].map(v => {
              const active = view === v.key;
              return (
                <button key={v.key} onClick={() => setView(v.key)} style={{ padding: '5px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'var(--font-main)', transition: 'all 0.2s', background: active ? 'rgba(0,212,255,0.1)' : 'transparent', color: active ? '#00D4FF' : 'var(--text-secondary)', border: `1px solid ${active ? '#00D4FF' : 'var(--border)'}` }}>
                  {v.icon} {v.label}
                </button>
              );
            })}
            {view === 'kanban' && <span style={{ fontSize: '0.7rem', color: '#484f58', fontStyle: 'italic', marginLeft: 4 }}>💡 Arrastra las tarjetas para moverlas</span>}
          </div>
        </div>
      </div>

      {/* ── CONTENIDO ────────────────────────────────────────────────── */}
      <div style={{ ...S.content, gridTemplateColumns: showChat ? '1fr 300px' : '1fr' }}>
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

          {/* KANBAN NEON */}
          {view === 'kanban' && (
            <div style={S.board}>
              {COLUMNS.map(col => {
                const n = NEON[col.key];
                const colTasks = tasks.filter(t => t.status === col.key);
                const isOver = dragOverCol === col.key;
                return (
                  <div key={col.key}
                    onDragOver={e => onDragOver(e, col.key)}
                    onDragLeave={onDragLeave}
                    onDrop={e => onDrop(e, col.key)}
                    style={{ background: '#161b22', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: `1px solid ${isOver ? n.color : n.col}`, transition: 'all 0.15s', boxShadow: isOver ? `0 0 20px ${n.color}22` : 'none' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: `1px solid ${n.sub}` }}>
                      <span style={{ color: n.color, fontWeight: 700, fontSize: '0.85rem' }}>{col.label}</span>
                      <span style={{ background: n.sub, color: n.color, borderRadius: 12, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700 }}>{colTasks.length}</span>
                    </div>
                    {isOver && <div style={{ margin: '6px 10px', padding: '6px', background: `${n.color}14`, border: `1px dashed ${n.color}`, borderRadius: 8, textAlign: 'center', fontSize: '0.75rem', color: n.color, fontWeight: 600 }}>Soltar aquí</div>}
                    <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1 }}>
                      {colTasks.map(task => (
                        <div key={task.id} draggable onDragStart={e => onDragStart(e, task.id)} onDragEnd={onDragEnd}
                          style={{ background: n.bg, border: `1px solid ${n.border}`, borderLeft: `4px solid ${n.color}`, borderRadius: 10, padding: '12px', display: 'flex', flexDirection: 'column', gap: 7, cursor: 'grab', userSelect: 'none', opacity: draggedTaskId === task.id ? 0.4 : 1, transition: 'opacity 0.15s' }}>
                          <div style={{ textAlign: 'center', fontSize: '0.6rem', color: '#484f58', letterSpacing: 2 }}>⠿⠿</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className={`badge ${PRIORITY_CLASS[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => { setEditTask(task); setShowTaskModal(true); }} style={S.taskBtn}>✏️</button>
                              <button onClick={() => handleDeleteTask(task.id)} style={{ ...S.taskBtn, color: 'var(--danger)' }}>🗑️</button>
                            </div>
                          </div>
                          <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{task.title}</p>
                          {task.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.description}</p>}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                            {task.assigned_to_name && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <div style={{ width: 20, height: 20, borderRadius: '50%', background: n.sub, color: n.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>{task.assigned_to_name.charAt(0)}</div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{task.assigned_to_name}</span>
                              </div>
                            )}
                            {task.due_date && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📅 {new Date(task.due_date).toLocaleDateString('es-MX')}</span>}
                          </div>
                          <select value={task.status} onChange={e => handleStatusChange(task.id, e.target.value)} className="input" style={{ fontSize: '0.75rem', padding: '4px 8px', marginTop: 4 }}>
                            {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label.replace(/[^\w\s]/g,'').trim()}</option>)}
                          </select>
                        </div>
                      ))}
                      <button onClick={() => { setActiveColumn(col.key); setShowTaskModal(true); }}
                        style={{ background: 'none', border: `1px dashed ${n.border}`, borderRadius: 8, color: `${n.color}66`, padding: '7px', cursor: 'pointer', fontSize: '0.8rem', marginTop: 2 }}>
                        + Agregar tarea
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* LISTA */}
          {view === 'list' && (
            <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
              <ListView tasks={tasks} onEdit={t => { setEditTask(t); setShowTaskModal(true); }} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} />
            </div>
          )}

          {/* GANTT */}
          {view === 'gantt' && (
            <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                📊 DIAGRAMA DE GANTT — {tasks.filter(t => t.due_date).length} de {tasks.length} tareas con fecha
              </div>
              <GanttChart tasks={tasks} />
            </div>
          )}
        </div>

        {/* CHAT */}
        {showChat && (
          <div style={S.chatPanel}>
            <div style={S.chatHeader}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>💬 Chat</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{project?.member_count || 0} miembros</span>
            </div>
            <div style={S.messages}>
              {messages.length === 0 && <p style={S.noMessages}>Sin mensajes aún. ¡Sé el primero!</p>}
              {messages.map(msg => (
                <div key={msg.id} style={{ ...S.message, alignSelf: msg.user_id === user?.id ? 'flex-end' : 'flex-start', background: msg.user_id === user?.id ? 'var(--accent-dim)' : 'var(--bg-elevated)', borderColor: msg.user_id === user?.id ? 'rgba(0,212,255,0.2)' : 'var(--border)' }}>
                  {msg.user_id !== user?.id && <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)', marginBottom: 2, display: 'block' }}>{msg.user_name}</span>}
                  <p style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>{msg.content}</p>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 3, display: 'block', textAlign: 'right' }}>{new Date(msg.created_at).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}</span>
                </div>
              ))}
              {typingUsers.length > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '3px 6px' }}>{typingUsers.join(', ')} está escribiendo...</div>}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendMessage} style={S.chatForm}>
              <input className="input" value={chatInput} onChange={handleTyping} placeholder="Escribe un mensaje..." style={{ borderRadius: 'var(--radius-md) 0 0 var(--radius-md)', fontSize: '0.83rem' }} />
              <button type="submit" className="btn btn-primary" style={{ borderRadius: '0 var(--radius-md) var(--radius-md) 0', padding: '10px 14px' }}>➤</button>
            </form>
          </div>
        )}
      </div>

      {showTaskModal && (
        <TaskModal task={editTask} projectId={id} defaultStatus={activeColumn} users={users}
          onClose={() => { setShowTaskModal(false); setEditTask(null); setActiveColumn(null); }}
          onSaved={handleTaskSaved} socket={socket} projectName={project?.name} currentUser={user} />
      )}
    </div>
  );
}

const S = {
  page: { padding: '16px 24px', height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: 14 },
  content: { display: 'grid', gap: 14, flex: 1, overflow: 'hidden', minHeight: 0 },
  board: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, overflowY: 'auto', paddingBottom: 8, height: '100%' },
  taskBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', padding: '2px' },
  chatPanel: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  chatHeader: { padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  messages: { flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: 6 },
  noMessages: { textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 20 },
  message: { maxWidth: '88%', padding: '7px 10px', borderRadius: 'var(--radius-md)', border: '1px solid' },
  chatForm: { display: 'flex', padding: '10px', borderTop: '1px solid var(--border)', flexShrink: 0 },
};

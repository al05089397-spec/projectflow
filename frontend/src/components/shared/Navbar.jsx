// components/shared/Navbar.jsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { connected, notifications, unreadCount, markAllRead } = useSocket();
  const [showNotifs, setShowNotifs] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  const handleNotifClick = () => {
    setShowNotifs(!showNotifs);
    if (!showNotifs) markAllRead();
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <Link to="/dashboard" style={styles.logo}>
          <span style={styles.logoIcon}>⬡</span>
          <span style={styles.logoText}>ProjectFlow</span>
        </Link>

        <div style={styles.navLinks}>
          <Link to="/dashboard" style={{ ...styles.navLink, ...(isActive('/dashboard') ? styles.navLinkActive : {}) }}>
            Dashboard
          </Link>
          {user?.role === 'admin' && (
            <Link to="/users" style={{ ...styles.navLink, ...(isActive('/users') ? styles.navLinkActive : {}) }}>
              Usuarios
            </Link>
          )}
        </div>
      </div>

      <div style={styles.right}>
        {/* Indicador de conexión */}
        <div style={styles.connStatus} title={connected ? 'Conectado' : 'Desconectado'}>
          <span style={{ ...styles.connDot, background: connected ? 'var(--success)' : 'var(--danger)' }} />
          <span style={styles.connText}>{connected ? 'En línea' : 'Sin conexión'}</span>
        </div>

        {/* Notificaciones */}
        <div style={{ position: 'relative' }}>
          <button onClick={handleNotifClick} style={styles.iconBtn} title="Notificaciones">
            🔔
            {unreadCount > 0 && (
              <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {showNotifs && (
            <div style={styles.notifPanel}>
              <div style={styles.notifHeader}>
                <span style={{ fontWeight: 700 }}>Notificaciones</span>
                <button onClick={() => setShowNotifs(false)} style={styles.closeBtn}>✕</button>
              </div>
              {notifications.length === 0 ? (
                <p style={styles.notifEmpty}>Sin notificaciones</p>
              ) : (
                <div style={styles.notifList}>
                  {notifications.slice(0, 10).map(n => (
                    <div key={n.id} style={{ ...styles.notifItem, opacity: n.read ? 0.6 : 1 }}>
                      <span style={styles.notifDot}>●</span>
                      <div>
                        <p style={{ fontSize: '0.85rem' }}>{n.message}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {new Date(n.timestamp).toLocaleTimeString('es-MX')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Usuario */}
        <div style={styles.userInfo}>
          <div style={styles.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
          <div style={styles.userDetails}>
            <span style={styles.userName}>{user?.name}</span>
            <span style={styles.userRole}>{user?.role === 'admin' ? 'Administrador' : 'Miembro'}</span>
          </div>
        </div>

        <button onClick={logout} className="btn btn-ghost btn-sm" title="Cerrar sesión">
          Salir
        </button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px', height: 60,
    background: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  left: { display: 'flex', alignItems: 'center', gap: 32 },
  logo: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' },
  logoIcon: { fontSize: '1.4rem', color: 'var(--accent)' },
  logoText: { fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' },
  navLinks: { display: 'flex', gap: 4 },
  navLink: { padding: '6px 14px', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' },
  navLinkActive: { background: 'var(--accent-dim)', color: 'var(--accent)' },
  right: { display: 'flex', alignItems: 'center', gap: 16 },
  connStatus: { display: 'flex', alignItems: 'center', gap: 6 },
  connDot: { width: 8, height: 8, borderRadius: '50%', display: 'block' },
  connText: { fontSize: '0.78rem', color: 'var(--text-muted)' },
  iconBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '1.1rem', padding: '6px', borderRadius: 'var(--radius-md)',
    position: 'relative', color: 'var(--text-secondary)',
    transition: 'background 0.2s',
  },
  badge: {
    position: 'absolute', top: 0, right: 0,
    background: 'var(--danger)', color: 'white',
    borderRadius: '10px', fontSize: '0.65rem', fontWeight: 700,
    padding: '1px 5px', minWidth: 16, textAlign: 'center',
  },
  notifPanel: {
    position: 'absolute', top: '110%', right: 0,
    width: 320, background: 'var(--bg-surface)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)', zIndex: 200, overflow: 'hidden',
  },
  notifHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', borderBottom: '1px solid var(--border)',
  },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' },
  notifEmpty: { padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' },
  notifList: { maxHeight: 320, overflowY: 'auto' },
  notifItem: {
    display: 'flex', gap: 10, padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
    transition: 'background 0.2s',
  },
  notifDot: { color: 'var(--accent)', fontSize: '0.6rem', marginTop: 4, flexShrink: 0 },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: {
    width: 34, height: 34, borderRadius: '50%',
    background: 'var(--accent-dim)', border: '1px solid var(--accent)',
    color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '0.9rem',
  },
  userDetails: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: '0.87rem', fontWeight: 600 },
  userRole: { fontSize: '0.72rem', color: 'var(--text-muted)' },
};

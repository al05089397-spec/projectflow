// pages/AuthPage.jsx
// Página de login y registro
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones frontend
    if (mode === 'register' && form.name.trim().length < 2) {
      return setError('El nombre debe tener al menos 2 caracteres');
    }
    if (!form.email.includes('@')) {
      return setError('Ingresa un email válido');
    }
    if (form.password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres');
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Panel izquierdo — branding */}
      <div style={styles.branding}>
        <div style={styles.brandContent}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>⬡</span>
            <span style={styles.logoText}>ProjectFlow</span>
          </div>
          <h1 style={styles.tagline}>El flujo de<br />tus proyectos,<br />en tiempo real.</h1>
          <p style={styles.brandDesc}>
            Gestiona proyectos, asigna tareas y comunícate con tu equipo 
            — todo en un solo lugar.
          </p>
          <div style={styles.features}>
            {['Tablero Kanban', 'Chat en tiempo real', 'Notificaciones instantáneas', 'Gestión de equipos'].map(f => (
              <div key={f} style={styles.featureItem}>
                <span style={styles.check}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div style={styles.formPanel}>
        <div style={styles.formContainer}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>
              {mode === 'login' ? 'Bienvenido de vuelta' : 'Crear cuenta'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
              {mode === 'login'
                ? 'Ingresa tus credenciales para continuar'
                : 'Únete al equipo de ProjectFlow'}
            </p>
          </div>

          {/* Demo credentials hint */}
          {mode === 'login' && (
            <div style={styles.demoHint}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Demo: <code style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>admin@projectflow.com</code> / <code style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>admin123</code>
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {mode === 'register' && (
              <div className="form-group">
                <label>Nombre completo</label>
                <input
                  className="input"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="form-group">
              <label>Email</label>
              <input
                className="input"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input
                className="input"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <div style={styles.errorBox}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ justifyContent: 'center', marginTop: 8, padding: '12px' }}
            >
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Procesando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>

          <p style={styles.switchText}>
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            {' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              style={styles.switchBtn}
            >
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
  },
  branding: {
    flex: 1,
    background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    '@media (maxWidth: 768px)': { display: 'none' }
  },
  brandContent: { maxWidth: 400 },
  logo: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 },
  logoIcon: { fontSize: '2rem', color: 'var(--accent)' },
  logoText: { fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' },
  tagline: { fontSize: '2.8rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 20, color: 'var(--text-primary)' },
  brandDesc: { color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7, marginBottom: 32 },
  features: { display: 'flex', flexDirection: 'column', gap: 12 },
  featureItem: { color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 10 },
  check: { color: 'var(--accent)', fontSize: '1rem', fontWeight: 700 },
  formPanel: {
    width: '100%',
    maxWidth: 480,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 24px',
  },
  formContainer: { width: '100%' },
  formHeader: { marginBottom: 28 },
  formTitle: { fontSize: '1.7rem', fontWeight: 800 },
  demoHint: {
    background: 'var(--accent-dim)',
    border: '1px solid rgba(0,212,255,0.2)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 14px',
    marginBottom: 20,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  errorBox: {
    background: 'rgba(248,81,73,0.1)',
    border: '1px solid rgba(248,81,73,0.3)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 14px',
    color: 'var(--danger)',
    fontSize: '0.87rem',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  switchText: { textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 24 },
  switchBtn: {
    background: 'none', border: 'none',
    color: 'var(--accent)', cursor: 'pointer',
    fontWeight: 600, fontSize: '0.9rem',
    fontFamily: 'var(--font-main)',
    padding: 0,
  }
};

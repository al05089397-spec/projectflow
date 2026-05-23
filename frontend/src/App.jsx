// App.jsx — Router principal de ProjectFlow
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/shared/Navbar';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ProjectPage from './pages/ProjectPage';
import UsersPage from './pages/UsersPage';

// Ruta protegida: redirige a login si no hay sesión
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '2rem' }}>⬡</span>
        <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: '0.9rem' }}>Cargando ProjectFlow...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

// Layout con Navbar
function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><DashboardPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/projects/:id" element={
        <ProtectedRoute>
          <AppLayout><ProjectPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute>
          <AppLayout><UsersPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import PacienteApp from './pages/PacienteApp';
import CuidadorApp from './pages/CuidadorApp';

function RequireAuth({ children, perfil }: { children: React.ReactNode; perfil?: string }) {
  const { user, token } = useAuth();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (perfil && user.perfil !== perfil) {
    return <Navigate to={user.perfil === 'CUIDADOR' ? '/cuidador' : '/paciente'} replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { user, token } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          token && user
            ? <Navigate to={user.perfil === 'CUIDADOR' ? '/cuidador' : '/paciente'} replace />
            : <Login />
        }
      />
      <Route
        path="/paciente/*"
        element={
          <RequireAuth perfil="PACIENTE">
            <PacienteApp />
          </RequireAuth>
        }
      />
      <Route
        path="/cuidador/*"
        element={
          <RequireAuth perfil="CUIDADOR">
            <CuidadorApp />
          </RequireAuth>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface MenuItem {
  label: string;
  path: string;
  icon: string;
}

const menuCuidador: MenuItem[] = [
  { label: 'Dashboard', path: '/cuidador', icon: '◼' },
  { label: 'Alertas', path: '/cuidador/alertas', icon: '🔔' },
  { label: 'Histórico', path: '/cuidador/historico', icon: '📋' },
  { label: 'Medicamentos', path: '/cuidador/medicamentos', icon: '💊' },
  { label: 'Configurações', path: '/cuidador/configuracoes', icon: '⚙️' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        background: 'var(--verde-escuro)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'var(--verde-claro)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 700, color: '#fff',
          }}>S+</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>Saúde+</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Cuidador</div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {menuCuidador.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/cuidador'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 12px',
              borderRadius: '8px',
              marginBottom: '4px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
              background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: '16px', width: 20, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginBottom: '2px' }}>
          {user?.nome}
        </div>
        <button
          onClick={logout}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '12px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Sair
        </button>
      </div>
    </aside>
  );
}

import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  alertCount?: number;
}

const DashIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
    <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
  </svg>
);
const BellIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const HistoryIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const PillIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="9" width="18" height="6" rx="3" stroke="currentColor" strokeWidth="1.8" transform="rotate(-35 12 12)"/>
    <path d="M7.8 7.3L16.2 15.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const SettingsIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const menuItems = [
  { label: 'Dashboard',     path: '/cuidador',               icon: <DashIcon />,     isAlerts: false },
  { label: 'Alertas',       path: '/cuidador/alertas',       icon: <BellIcon />,     isAlerts: true  },
  { label: 'Histórico',     path: '/cuidador/historico',     icon: <HistoryIcon />,  isAlerts: false },
  { label: 'Medicamentos',  path: '/cuidador/medicamentos',  icon: <PillIcon />,     isAlerts: false },
  { label: 'Configurações', path: '/cuidador/configuracoes', icon: <SettingsIcon />, isAlerts: false },
];

export default function Sidebar({ open, onClose, alertCount = 0 }: SidebarProps) {
  const { user, logout } = useAuth();
  const initials = user?.nome
    ? user.nome.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0]).join('')
    : '?';

  return (
    <>
      {open && <div className="dsh-scrim" onClick={onClose} />}

      <aside className={`dsh-sidebar${open ? ' dsh-sidebar--open' : ''}`}>
        {/* Logo */}
        <div className="dsh-sidebar-logo">
          <div className="dsh-logo-mark">S+</div>
          <div className="dsh-logo-text">
            <span>Saúde<strong>+</strong></span>
            <span className="dsh-logo-sub">Cuidador</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="dsh-sidebar-nav">
          {menuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/cuidador'}
              className={({ isActive }) =>
                `dsh-nav-item${isActive ? ' dsh-nav-item--active' : ''}`
              }
              onClick={onClose}
            >
              <span className="dsh-nav-icon">{item.icon}</span>
              {item.label}
              {item.isAlerts && alertCount > 0 && (
                <span className="dsh-nav-badge">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="dsh-sidebar-foot">
          <div className="dsh-sidebar-avatar">{initials.toUpperCase()}</div>
          <div className="dsh-sidebar-userinfo">
            <span className="dsh-sidebar-username">
              {user?.nome?.split(' ')[0] ?? 'Cuidador'}
            </span>
            <span className="dsh-sidebar-role">Cuidadora</span>
          </div>
          <button
            className="dsh-sidebar-logout-btn"
            onClick={logout}
            title="Sair"
          >
            <LogoutIcon />
          </button>
        </div>
      </aside>
    </>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatAbby from '../components/paciente/ChatAbby';
import Remedios from '../components/paciente/Remedios';
import Historico from '../components/paciente/Historico';
import CodigoVinculo from '../components/paciente/CodigoVinculo';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';

type Tab = 'chat' | 'remedios' | 'historico' | 'perfil';

const NavIcons = {
  chat: (active: boolean) => (
    <svg width={22} height={22} viewBox="0 0 24 24" fill={active ? '#0d4a3a' : 'none'} stroke={active ? '#0d4a3a' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  remedios: (active: boolean) => (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? '#0d4a3a' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
      <line x1="12" y1="15" x2="12" y2="19"/>
      <line x1="10" y1="17" x2="14" y2="17"/>
    </svg>
  ),
  historico: (active: boolean) => (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? '#0d4a3a' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  perfil: (active: boolean) => (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? '#0d4a3a' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

const tabs: { key: Tab; label: string }[] = [
  { key: 'chat',      label: 'Abby'      },
  { key: 'remedios',  label: 'Remédios'  },
  { key: 'historico', label: 'Histórico' },
  { key: 'perfil',    label: 'Perfil'    },
];

export default function PacienteApp() {
  const [tab, setTab] = useState<Tab>('chat');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cinza-fundo)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="saude-header" style={{
        background: 'linear-gradient(135deg, #0d4a3a 0%, #13674e 55%, #1a8a6a 100%)',
        padding: '18px 18px 16px',
        flexShrink: 0,
        overflow: 'hidden',
        position: 'sticky' as const,
        top: 0,
        zIndex: 50,
      }}>
        {/* radial glows */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(600px 200px at 110% -30%, rgba(34,197,94,.35), transparent 60%), radial-gradient(400px 160px at -10% 120%, rgba(255,255,255,.08), transparent 60%)',
        }} />

        {/* Top row: brand + (desktop: greeting center) + logout */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'rgba(255,255,255,.14)',
              border: '1px solid rgba(255,255,255,.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <path d="M12 20.5s-7.5-4.5-9.5-9.5C1 7 4 3.5 7.5 3.5c2 0 3.5 1 4.5 2.5 1-1.5 2.5-2.5 4.5-2.5 3.5 0 6.5 3.5 5 7.5-2 5-9.5 9.5-9.5 9.5z" fill="#fff"/>
              </svg>
            </div>
            <div style={{
              fontWeight: 700, fontSize: '18px', letterSpacing: '-.01em',
              color: '#fff', display: 'flex', alignItems: 'baseline', gap: '2px',
            }}>
              Saúde<span style={{ color: '#86efac', fontWeight: 800 }}>+</span>
            </div>
          </div>

          {/* Desktop center greeting */}
          {tab === 'chat' && (
            <div className="saude-greeting-desktop">
              Olá, {user?.nome?.split(' ')[0]}{' '}
              <span className="abby-wave" style={{ animation: 'abby-wave 2.4s ease-in-out 1s 2' }}>👋</span>
              <span style={{ opacity: .75, fontWeight: 400 }}> · Como você está se sentindo hoje?</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, color: '#fff',
              background: 'rgba(255,255,255,.12)',
              border: '1px solid rgba(255,255,255,.2)',
              padding: '7px 12px', borderRadius: '999px', cursor: 'pointer',
            }}
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
              <path d="M15 17l5-5-5-5M20 12H9M12 3H5a2 2 0 00-2 2v14a2 2 0 002 2h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sair
          </button>
        </div>

        {/* Mobile greeting — hidden on desktop */}
        {tab === 'chat' && (
          <div className="saude-greeting-mobile" style={{ marginTop: '14px', position: 'relative', zIndex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, letterSpacing: '-.02em', color: '#fff' }}>
              Olá, {user?.nome?.split(' ')[0]}{' '}
              <span className="abby-wave" style={{ animation: 'abby-wave 2.4s ease-in-out 1s 2' }}>👋</span>
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '13px', opacity: .8, color: '#fff' }}>
              Como você está se sentindo hoje?
            </p>
          </div>
        )}
      </header>

      {/* Content */}
      <main style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: tab === 'chat' ? '0' : '20px 16px',
        paddingBottom: tab === 'chat' ? '0' : '80px',
        overflow: tab === 'chat' ? 'hidden' : 'auto',
      }}>
        {tab === 'chat'      && (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', paddingBottom: 68 }}>
            <ChatAbby />
          </div>
        )}
        {tab === 'remedios'  && <Remedios />}
        {tab === 'historico' && <Historico />}
        {tab === 'perfil'    && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Perfil</h2>
            <CodigoVinculo />
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              border: '1px solid var(--cinza-borda)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>Conta</div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--cinza-texto)' }}>Nome</div>
                <div style={{ fontWeight: 500 }}>{user?.nome}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--cinza-texto)' }}>E-mail</div>
                <div style={{ fontWeight: 500 }}>{user?.email}</div>
              </div>
            </div>
            <Button onClick={handleLogout} variant="danger">Sair da conta</Button>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#fff',
        boxShadow: '0 -2px 8px rgba(0,0,0,.05)',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        zIndex: 50,
      }}>
        {tabs.map(t => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '10px 8px 12px',
                border: 'none',
                background: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(13,74,58,.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {/* gradient top indicator */}
              <span style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: active ? 28 : 0,
                height: 3,
                borderRadius: '0 0 3px 3px',
                background: 'linear-gradient(90deg, #22c55e, #0d4a3a)',
                transition: 'width 0.2s cubic-bezier(.4,0,.2,1)',
              }} />

              {/* icon + badge wrapper */}
              <span style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: active ? 'translateY(-1px)' : 'none',
                transition: 'transform 0.15s',
              }}>
                {NavIcons[t.key](active)}
                {t.key === 'chat' && (
                  <span style={{
                    position: 'absolute',
                    top: -4,
                    right: -6,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#22c55e',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                    border: '2px solid #fff',
                  }}>1</span>
                )}
              </span>

              <span style={{
                fontSize: '11px',
                fontWeight: active ? 600 : 400,
                color: active ? '#0d4a3a' : '#94a3b8',
                transition: 'color 0.15s',
              }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

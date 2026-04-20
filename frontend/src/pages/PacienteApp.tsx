import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatAbby from '../components/paciente/ChatAbby';
import Remedios from '../components/paciente/Remedios';
import Historico from '../components/paciente/Historico';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'chat' | 'remedios' | 'historico';

const tabs: { key: Tab; icon: string; label: string }[] = [
  { key: 'chat', icon: '💬', label: 'Chat Abby' },
  { key: 'remedios', icon: '💊', label: 'Remédios' },
  { key: 'historico', icon: '📋', label: 'Histórico' },
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
      <header style={{
        background: 'var(--verde-escuro)',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            background: 'var(--verde-claro)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, color: '#fff', fontSize: '14px',
          }}>S+</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '15px' }}>Saúde+</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Olá, {user?.nome?.split(' ')[0]}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer' }}
        >
          Sair
        </button>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: '20px 16px', paddingBottom: '80px' }}>
        {tab === 'chat' && <ChatAbby />}
        {tab === 'remedios' && <Remedios />}
        {tab === 'historico' && <Historico />}
      </main>

      {/* Bottom Nav */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#fff',
        borderTop: '1px solid var(--cinza-borda)',
        display: 'flex',
        zIndex: 50,
      }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              background: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              color: tab === t.key ? 'var(--verde-escuro)' : 'var(--cinza-texto)',
              fontSize: '11px',
              fontWeight: tab === t.key ? 600 : 400,
              cursor: 'pointer',
              borderTop: tab === t.key ? '2px solid var(--verde-escuro)' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: '22px' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

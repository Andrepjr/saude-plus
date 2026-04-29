import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { VinculoProvider, useVinculo } from '../contexts/VinculoContext';
import { useAuth } from '../contexts/AuthContext';
import type { Alerta } from '../types';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import Dashboard from '../components/cuidador/Dashboard';
import Alertas from '../components/cuidador/Alertas';
import HistoricoCuidador from '../components/cuidador/Historico';
import MedicamentosCuidador from '../components/cuidador/Medicamentos';
import Configuracoes from '../components/cuidador/Configuracoes';
import SeletorPaciente from '../components/cuidador/SeletorPaciente';

// ── Icons ──────────────────────────────────────────────────────────────────
const MenuIcon = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const ShareIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const SparkleIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-5.74L4 10l5.91-1.74L12 2z"/>
  </svg>
);
const SearchIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="8" stroke="#94a3b8" strokeWidth="2"/>
    <path d="M21 21l-4.35-4.35" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ── Route title map ────────────────────────────────────────────────────────
const routeTitles: Record<string, string> = {
  '/cuidador':               'Dashboard',
  '/cuidador/alertas':       'Alertas',
  '/cuidador/historico':     'Histórico',
  '/cuidador/medicamentos':  'Medicamentos',
  '/cuidador/configuracoes': 'Configurações',
};

// ── Empty state ────────────────────────────────────────────────────────────
function EmptyStateSemPaciente() {
  const navigate = useNavigate();
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', gap: '20px', textAlign: 'center',
    }}>
      <span style={{ fontSize: '64px' }}>🔗</span>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--texto-principal)', marginBottom: '8px' }}>
          Vincule seu primeiro paciente
        </h2>
        <p style={{ color: 'var(--cinza-texto)', fontSize: '15px', maxWidth: '360px' }}>
          Para começar a monitorar, peça ao paciente que gere um código de vínculo no aplicativo dele.
        </p>
      </div>
      <button
        onClick={() => navigate('/cuidador/configuracoes')}
        style={{
          padding: '12px 28px', borderRadius: '12px', border: 'none',
          background: 'var(--verde-escuro)', color: '#fff',
          fontWeight: 600, fontSize: '15px', cursor: 'pointer',
        }}
      >
        Ir para Configurações →
      </button>
    </div>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────
function CuidadorLayout() {
  const { pacientes, carregando, pacienteSelecionado } = useVinculo();
  const { user } = useAuth();
  const location = useLocation();
  const naConfiguracoes = location.pathname.includes('/configuracoes');

  const [navOpen, setNavOpen]         = useState(false);
  const [analyzeKey, setAnalyzeKey]   = useState(0);
  const [alertCount, setAlertCount]   = useState(0);
  const [patientStatus, setPatientStatus] = useState<'ok' | 'atencao' | 'critico'>('ok');
  const [analyzing, setAnalyzing]     = useState(false);

  // Fetch alert count + patient status whenever patient changes
  useEffect(() => {
    if (!pacienteSelecionado?.id) {
      setAlertCount(0);
      setPatientStatus('ok');
      return;
    }
    api.get('/alertas', { params: { pacienteId: pacienteSelecionado.id } })
      .then(res => {
        const als: Alerta[] = res.data;
        setAlertCount(als.length);
        if (als.some(a => a.severidade === 'CRITICA')) {
          setPatientStatus('critico');
        } else if (als.some(a => a.severidade === 'ALTA' || a.severidade === 'MEDIA')) {
          setPatientStatus('atencao');
        } else {
          setPatientStatus('ok');
        }
      })
      .catch(() => {});
  }, [pacienteSelecionado?.id]);

  const pageTitle = routeTitles[location.pathname] ?? 'Dashboard';

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  function handleCompartilhar() {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
  }

  function handleAnalyze() {
    setAnalyzing(true);
    setAnalyzeKey(k => k + 1);
    setTimeout(() => setAnalyzing(false), 3000);
  }

  return (
    <div className="dsh-shell">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} alertCount={alertCount} />

      <div className="dsh-main">
        {/* ── Topbar ─────────────────────────────────── */}
        <header className="dsh-topbar">
          {/* Left: hamburger + title + action buttons */}
          <div className="dsh-topbar-left" style={{ gap: 10, flexShrink: 0 }}>
            <button
              className="dsh-hamburger"
              onClick={() => setNavOpen(v => !v)}
              aria-label="Menu"
            >
              <MenuIcon />
            </button>

            <div className="dsh-topbar-title-group">
              <span className="dsh-topbar-title">Painel de saúde</span>
              <span className="dsh-topbar-sub-text">
                Visão geral dos sinais vitais e medicação do paciente vinculado.
              </span>
            </div>

            <div className="dsh-topbar-btns">
              <button className="dsh-btn-share" onClick={handleCompartilhar}>
                <ShareIcon /> Compartilhar
              </button>
              <button
                className="dsh-btn-analyze"
                onClick={handleAnalyze}
                disabled={analyzing}
              >
                <SparkleIcon />
                {analyzing ? 'Analisando…' : 'Pedir análise da Abby'}
              </button>
            </div>
          </div>

          {/* Right: search + meta */}
          <div className="dsh-topbar-right" style={{ flexShrink: 0, gap: 12 }}>
            <div className="dsh-topbar-search">
              <SearchIcon />
              <input
                className="dsh-search-input"
                placeholder="Buscar paciente, medicamento..."
              />
            </div>
            <div className="dsh-topbar-meta">
              <span className="dsh-topbar-date">{today}</span>
              <span className="dsh-topbar-email">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* ── Content ────────────────────────────────── */}
        <div className="dsh-content">
          {!carregando && pacientes.length === 0 && !naConfiguracoes ? (
            <EmptyStateSemPaciente />
          ) : (
            <>
              {!naConfiguracoes && (
                <SeletorPaciente patientStatus={patientStatus} />
              )}
              <Routes>
                <Route
                  index
                  element={
                    <Dashboard
                      analyzeKey={analyzeKey}
                      analyzing={analyzing}
                      pageTitle={pageTitle}
                    />
                  }
                />
                <Route path="alertas"       element={<Alertas />} />
                <Route path="historico"     element={<HistoricoCuidador />} />
                <Route path="medicamentos"  element={<MedicamentosCuidador />} />
                <Route path="configuracoes" element={<Configuracoes />} />
                <Route path="*"             element={<Navigate to="/cuidador" replace />} />
              </Routes>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CuidadorApp() {
  return (
    <VinculoProvider>
      <CuidadorLayout />
    </VinculoProvider>
  );
}

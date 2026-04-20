import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { VinculoProvider, useVinculo } from '../contexts/VinculoContext';
import Sidebar from '../components/layout/Sidebar';
import Dashboard from '../components/cuidador/Dashboard';
import Alertas from '../components/cuidador/Alertas';
import HistoricoCuidador from '../components/cuidador/Historico';
import MedicamentosCuidador from '../components/cuidador/Medicamentos';
import Configuracoes from '../components/cuidador/Configuracoes';
import SeletorPaciente from '../components/cuidador/SeletorPaciente';

function EmptyStateSemPaciente() {
  const navigate = useNavigate();
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '20px',
      textAlign: 'center',
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
          padding: '12px 28px',
          borderRadius: '12px',
          border: 'none',
          background: 'var(--verde-escuro)',
          color: '#fff',
          fontWeight: 600,
          fontSize: '15px',
          cursor: 'pointer',
        }}
      >
        Ir para Configurações →
      </button>
    </div>
  );
}

function CuidadorLayout() {
  const { pacientes, carregando } = useVinculo();
  const location = useLocation();
  const naConfiguracoes = location.pathname.includes('/configuracoes');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        marginLeft: 'var(--sidebar-width)',
        flex: 1,
        padding: '32px',
        background: 'var(--cinza-fundo)',
        minHeight: '100vh',
      }}>
        {!carregando && pacientes.length === 0 && !naConfiguracoes ? (
          <EmptyStateSemPaciente />
        ) : (
          <>
            {!naConfiguracoes && <SeletorPaciente />}
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="alertas" element={<Alertas />} />
              <Route path="historico" element={<HistoricoCuidador />} />
              <Route path="medicamentos" element={<MedicamentosCuidador />} />
              <Route path="configuracoes" element={<Configuracoes />} />
              <Route path="*" element={<Navigate to="/cuidador" replace />} />
            </Routes>
          </>
        )}
      </main>
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

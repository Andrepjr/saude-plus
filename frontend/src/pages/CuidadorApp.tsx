import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Dashboard from '../components/cuidador/Dashboard';
import Alertas from '../components/cuidador/Alertas';
import HistoricoCuidador from '../components/cuidador/Historico';
import MedicamentosCuidador from '../components/cuidador/Medicamentos';
import Configuracoes from '../components/cuidador/Configuracoes';

export default function CuidadorApp() {
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
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="alertas" element={<Alertas />} />
          <Route path="historico" element={<HistoricoCuidador />} />
          <Route path="medicamentos" element={<MedicamentosCuidador />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="*" element={<Navigate to="/cuidador" replace />} />
        </Routes>
      </main>
    </div>
  );
}

import { useVinculo } from '../../contexts/VinculoContext';
import type { PacienteVinculado } from '../../types';

export default function SeletorPaciente() {
  const { pacientes, pacienteSelecionado, setPacienteSelecionado, carregando } = useVinculo();

  if (carregando) return null;

  if (pacientes.length === 0) return null; // handled by empty state in layout

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: '#fff',
      border: '1px solid var(--cinza-borda)',
      borderRadius: '12px',
      padding: '10px 16px',
      marginBottom: '24px',
    }}>
      <span style={{ fontSize: '18px' }}>👤</span>
      <span style={{ fontSize: '13px', color: 'var(--cinza-texto)', fontWeight: 500, whiteSpace: 'nowrap' }}>
        Paciente:
      </span>

      {pacientes.length === 1 ? (
        <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--texto-principal)' }}>
          {pacienteSelecionado?.nome}
        </span>
      ) : (
        <select
          value={pacienteSelecionado?.id ?? ''}
          onChange={e => {
            const p = pacientes.find((p: PacienteVinculado) => p.id === Number(e.target.value));
            if (p) setPacienteSelecionado(p);
          }}
          style={{
            border: 'none',
            fontWeight: 600,
            fontSize: '15px',
            color: 'var(--texto-principal)',
            background: 'transparent',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {pacientes.map((p: PacienteVinculado) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
      )}

      <span style={{
        marginLeft: 'auto',
        fontSize: '11px',
        color: 'var(--cinza-texto)',
      }}>
        {pacienteSelecionado?.email}
      </span>
    </div>
  );
}

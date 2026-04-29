import { useVinculo } from '../../contexts/VinculoContext';
import type { PacienteVinculado } from '../../types';

interface Props {
  patientStatus?: 'ok' | 'atencao' | 'critico';
}

export default function SeletorPaciente({ patientStatus = 'ok' }: Props) {
  const { pacientes, pacienteSelecionado, setPacienteSelecionado, carregando } = useVinculo();

  if (carregando || pacientes.length === 0) return null;

  const inicial = pacienteSelecionado?.nome?.[0]?.toUpperCase() ?? '?';

  const badgeLabel: Record<string, string> = {
    atencao: 'ATENÇÃO',
    critico: 'CRÍTICO',
  };

  return (
    <div className="dsh-selector-card">
      <div className="dsh-selector-left">
        <div className="dsh-selector-avatar">{inicial}</div>
        <div className="dsh-selector-info">
          <div className="dsh-selector-name-row">
            {pacientes.length === 1 ? (
              <span className="dsh-selector-name">{pacienteSelecionado?.nome}</span>
            ) : (
              <span className="dsh-selector-name">
                <select
                  value={pacienteSelecionado?.id ?? ''}
                  onChange={e => {
                    const p = pacientes.find((p: PacienteVinculado) => p.id === Number(e.target.value));
                    if (p) setPacienteSelecionado(p);
                  }}
                >
                  {pacientes.map((p: PacienteVinculado) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </span>
            )}
            {patientStatus !== 'ok' && (
              <span className={`dsh-selector-status dsh-selector-status--${patientStatus}`}>
                {badgeLabel[patientStatus]}
              </span>
            )}
          </div>
          <div className="dsh-selector-email">{pacienteSelecionado?.email}</div>
        </div>
      </div>

      <div className="dsh-selector-right">
        <span className="dsh-selector-dot" />
        <span>Monitorando</span>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import type { RegistroSaude } from '../../types';
import api from '../../services/api';
import Card from '../common/Card';
import Header from '../layout/Header';

const statusColor: Record<string, string> = {
  NORMAL: '#16a34a', ALTA: '#f97316', BAIXA: '#3b82f6', CRITICA: '#ef4444',
};
const statusBg: Record<string, string> = {
  NORMAL: '#dcfce7', ALTA: '#ffedd5', BAIXA: '#dbeafe', CRITICA: '#fee2e2',
};

export default function HistoricoCuidador() {
  const [registros, setRegistros] = useState<RegistroSaude[]>([]);
  const [filtro, setFiltro] = useState<'TODOS' | 'GLICOSE' | 'PRESSAO'>('TODOS');
  const [dias, setDias] = useState(7);

  useEffect(() => {
    const tipo = filtro !== 'TODOS' ? `&tipo=${filtro}` : '';
    api.get(`/saude?dias=${dias}${tipo}`).then(res => setRegistros(res.data));
  }, [filtro, dias]);

  return (
    <div>
      <Header title="Histórico" subtitle="Registros de glicose e pressão arterial" />
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['TODOS', 'GLICOSE', 'PRESSAO'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{
              padding: '6px 14px', borderRadius: '20px',
              border: '1px solid var(--cinza-borda)',
              background: filtro === f ? 'var(--verde-escuro)' : '#fff',
              color: filtro === f ? '#fff' : 'var(--cinza-texto)',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            }}>
              {f === 'TODOS' ? 'Todos' : f === 'GLICOSE' ? 'Glicose' : 'Pressão'}
            </button>
          ))}
        </div>
        <select
          value={dias}
          onChange={e => setDias(Number(e.target.value))}
          style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--cinza-borda)', fontSize: '13px', background: '#fff' }}
        >
          <option value={7}>Últimos 7 dias</option>
          <option value={15}>Últimos 15 dias</option>
          <option value={30}>Últimos 30 dias</option>
        </select>
      </div>

      {registros.length === 0 ? (
        <Card>
          <p style={{ textAlign: 'center', color: 'var(--cinza-texto)', padding: '40px 0' }}>
            Nenhum registro no período selecionado.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {registros.map(r => (
            <Card key={r.id} style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '22px' }}>{r.tipo === 'GLICOSE' ? '🩸' : '❤️'}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.tipo === 'GLICOSE' ? 'Glicose' : 'Pressão Arterial'}</div>
                    <div style={{ color: 'var(--cinza-texto)', fontSize: '13px' }}>
                      {new Date(r.dataHora).toLocaleString('pt-BR')} · {r.fonte === 'CHAT' ? 'via Chat' : 'Manual'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 700, fontSize: '18px' }}>
                    {r.valor} {r.tipo === 'GLICOSE' ? 'mg/dL' : 'mmHg'}
                  </span>
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: statusBg[r.status], color: statusColor[r.status],
                  }}>
                    {r.status}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

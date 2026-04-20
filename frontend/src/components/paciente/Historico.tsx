import { useState, useEffect } from 'react';
import type { RegistroSaude } from '../../types';
import api from '../../services/api';
import Card from '../common/Card';

const statusColor: Record<string, string> = {
  NORMAL: '#16a34a',
  ALTA: '#f97316',
  BAIXA: '#3b82f6',
  CRITICA: '#ef4444',
};

const statusBg: Record<string, string> = {
  NORMAL: '#dcfce7',
  ALTA: '#ffedd5',
  BAIXA: '#dbeafe',
  CRITICA: '#fee2e2',
};

function formatDate(d: string) {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function Historico() {
  const [registros, setRegistros] = useState<RegistroSaude[]>([]);
  const [filtro, setFiltro] = useState<'TODOS' | 'GLICOSE' | 'PRESSAO'>('TODOS');

  useEffect(() => {
    const tipo = filtro !== 'TODOS' ? `?tipo=${filtro}&dias=30` : '?dias=30';
    api.get(`/saude${tipo}`).then(res => setRegistros(res.data));
  }, [filtro]);

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Histórico de Saúde</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['TODOS', 'GLICOSE', 'PRESSAO'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid var(--cinza-borda)',
                background: filtro === f ? 'var(--verde-escuro)' : '#fff',
                color: filtro === f ? '#fff' : 'var(--cinza-texto)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {f === 'TODOS' ? 'Todos' : f === 'GLICOSE' ? 'Glicose' : 'Pressão'}
            </button>
          ))}
        </div>
      </div>

      {registros.length === 0 ? (
        <Card>
          <p style={{ textAlign: 'center', color: 'var(--cinza-texto)', padding: '32px 0' }}>
            Nenhum registro nos últimos 30 dias.
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
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>
                      {r.tipo === 'GLICOSE' ? 'Glicose' : 'Pressão Arterial'}
                    </div>
                    <div style={{ color: 'var(--cinza-texto)', fontSize: '13px' }}>
                      {formatDate(r.dataHora)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 700, fontSize: '18px' }}>
                    {r.valor} {r.tipo === 'GLICOSE' ? 'mg/dL' : 'mmHg'}
                  </span>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: statusBg[r.status],
                    color: statusColor[r.status],
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

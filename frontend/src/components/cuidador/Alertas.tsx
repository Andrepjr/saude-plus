import { useState, useEffect } from 'react';
import type { Alerta } from '../../types';
import api from '../../services/api';
import Card from '../common/Card';
import Header from '../layout/Header';

const severidadeLabel: Record<string, string> = {
  CRITICA: 'Crítico',
  ALTA: 'Alto',
  MEDIA: 'Médio',
  NORMAL: 'Normal',
};

const severidadeBg: Record<string, string> = {
  CRITICA: '#fee2e2',
  ALTA: '#ffedd5',
  MEDIA: '#fef9c3',
  NORMAL: '#dcfce7',
};

const severidadeColor: Record<string, string> = {
  CRITICA: '#ef4444',
  ALTA: '#f97316',
  MEDIA: '#ca8a04',
  NORMAL: '#16a34a',
};

const tipoIcon: Record<string, string> = {
  GLICOSE: '🩸',
  PRESSAO: '❤️',
  MEDICAMENTO: '💊',
};

export default function Alertas() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);

  useEffect(() => {
    api.get('/alertas').then(res => setAlertas(res.data));
  }, []);

  return (
    <div>
      <Header title="Alertas" subtitle="Notificações de saúde das últimas 24 horas" />
      {alertas.length === 0 ? (
        <Card>
          <p style={{ textAlign: 'center', color: 'var(--cinza-texto)', padding: '48px 0', fontSize: '15px' }}>
            ✅ Nenhum alerta no momento. Tudo parece bem!
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {alertas.map((a, i) => (
            <Card key={i} style={{ padding: '16px 20px', borderLeft: `4px solid ${severidadeColor[a.severidade]}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '28px' }}>{tipoIcon[a.tipo]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>{a.mensagem}</div>
                  <div style={{ color: 'var(--cinza-texto)', fontSize: '13px', marginTop: '2px' }}>
                    {new Date(a.dataHora).toLocaleString('pt-BR')}
                  </div>
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: severidadeBg[a.severidade],
                  color: severidadeColor[a.severidade],
                }}>
                  {severidadeLabel[a.severidade]}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

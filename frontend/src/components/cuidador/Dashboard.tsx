import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { RegistroSaude, MedicamentoStatus, Alerta } from '../../types';
import api from '../../services/api';
import Card from '../common/Card';
import Header from '../layout/Header';

const statusColor: Record<string, string> = {
  NORMAL: '#16a34a',
  ALTA: '#f97316',
  BAIXA: '#3b82f6',
  CRITICA: '#ef4444',
};

function StatCard({ icon, label, value, unit, status }: {
  icon: string; label: string; value: string; unit?: string; status?: string;
}) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cinza-texto)', fontSize: '14px' }}>
        <span>{icon}</span> {label}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: status ? statusColor[status] : 'var(--texto-principal)' }}>
        {value}
        {unit && <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--cinza-texto)', marginLeft: '4px' }}>{unit}</span>}
      </div>
      {status && (
        <span style={{
          alignSelf: 'flex-start',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600,
          background: statusColor[status] + '20',
          color: statusColor[status],
        }}>{status}</span>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const [glicoseHoje, setGlicoseHoje] = useState<{ valor: string; status: string } | null>(null);
  const [pressaoHoje, setPressaoHoje] = useState<{ valor: string; status: string } | null>(null);
  const [glicose7d, setGlicose7d] = useState<RegistroSaude[]>([]);
  const [medicamentos, setMedicamentos] = useState<MedicamentoStatus[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [analise, setAnalise] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/saude/ultimos'),
      api.get('/saude?tipo=GLICOSE&dias=7'),
      api.get('/medicamentos/status-dia'),
      api.get('/alertas'),
      api.get('/alertas/analise-ia'),
    ]).then(([ultimos, g7d, meds, als, ia]) => {
      const u = ultimos.data;
      if (u.GLICOSE) setGlicoseHoje({ valor: u.GLICOSE.valor, status: u.GLICOSE.status });
      if (u.PRESSAO) setPressaoHoje({ valor: u.PRESSAO.valor, status: u.PRESSAO.status });
      setGlicose7d(g7d.data.slice().reverse());
      setMedicamentos(meds.data);
      setAlertas(als.data.slice(0, 5));
      setAnalise(ia.data.analise);
    });
  }, []);

  const totalMeds = medicamentos.length;
  const tomados = medicamentos.filter(m => m.tomado).length;

  const chartData = glicose7d.map(r => ({
    hora: new Date(r.dataHora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    valor: Number(r.valor),
  }));

  return (
    <div>
      <Header title="Dashboard" subtitle={`Hoje, ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`} />

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard
          icon="🩸"
          label="Glicose hoje"
          value={glicoseHoje?.valor || '—'}
          unit={glicoseHoje ? 'mg/dL' : undefined}
          status={glicoseHoje?.status}
        />
        <StatCard
          icon="❤️"
          label="Pressão hoje"
          value={pressaoHoje?.valor || '—'}
          unit={pressaoHoje ? 'mmHg' : undefined}
          status={pressaoHoje?.status}
        />
        <StatCard
          icon="💊"
          label="Medicamentos tomados"
          value={`${tomados}/${totalMeds}`}
          status={tomados === totalMeds && totalMeds > 0 ? 'NORMAL' : totalMeds > 0 ? 'ALTA' : undefined}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* Gráfico Glicose 7d */}
        <Card title="Glicose — últimos 7 dias" style={{ gridColumn: '1 / -1' }}>
          {chartData.length === 0 ? (
            <p style={{ color: 'var(--cinza-texto)', textAlign: 'center', padding: '40px 0' }}>Sem dados ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cinza-borda)" />
                <XAxis dataKey="hora" tick={{ fontSize: 12 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [`${v} mg/dL`, 'Glicose']} />
                <Line type="monotone" dataKey="valor" stroke="var(--verde-medio)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Tabela de medicamentos */}
        <Card title="Medicamentos do dia">
          {medicamentos.length === 0 ? (
            <p style={{ color: 'var(--cinza-texto)', fontSize: '14px' }}>Nenhum medicamento.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--cinza-borda)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 0', color: 'var(--cinza-texto)', fontWeight: 500 }}>Remédio</th>
                  <th style={{ textAlign: 'center', padding: '6px 0', color: 'var(--cinza-texto)', fontWeight: 500 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {medicamentos.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--cinza-borda)' }}>
                    <td style={{ padding: '8px 0' }}>
                      <div style={{ fontWeight: 500 }}>{m.nome}</div>
                      {m.dosagem && <div style={{ color: 'var(--cinza-texto)', fontSize: '12px' }}>{m.dosagem}</div>}
                    </td>
                    <td style={{ padding: '8px 0', textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                        background: m.tomado ? '#dcfce7' : '#fef9c3',
                        color: m.tomado ? '#16a34a' : '#854d0e',
                      }}>
                        {m.tomado ? '✓' : '⏳'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Alertas recentes */}
        <Card title="Alertas recentes">
          {alertas.length === 0 ? (
            <p style={{ color: 'var(--cinza-texto)', fontSize: '14px' }}>Nenhum alerta.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alertas.map((a, i) => (
                <div key={i} style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: a.severidade === 'CRITICA' ? '#fee2e2' : a.severidade === 'ALTA' ? '#ffedd5' : '#fef9c3',
                  borderLeft: `3px solid ${statusColor[a.severidade] || '#eab308'}`,
                  fontSize: '13px',
                }}>
                  <div style={{ fontWeight: 600 }}>{a.mensagem}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Análise IA */}
      {analise && (
        <Card title="Análise da IA — Abby" style={{ marginTop: '16px' }}>
          <div style={{
            background: 'var(--verde-bg)',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '28px' }}>🤖</span>
            <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--texto-principal)' }}>{analise}</p>
          </div>
        </Card>
      )}
    </div>
  );
}

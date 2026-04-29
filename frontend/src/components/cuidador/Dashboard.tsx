import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea,
} from 'recharts';
import type { RegistroSaude, MedicamentoStatus, Alerta } from '../../types';
import api from '../../services/api';
import { useVinculo } from '../../contexts/VinculoContext';

// ── Status colors ──────────────────────────────────────────────────────────
const statusColor: Record<string, string> = {
  NORMAL:  '#16a34a',
  ALTA:    '#ea580c',
  BAIXA:   '#2563eb',
  CRITICA: '#dc2626',
};
const statusBg: Record<string, string> = {
  NORMAL:  '#dcfce7',
  ALTA:    '#fff7ed',
  BAIXA:   '#eff6ff',
  CRITICA: '#fef2f2',
};

// ── Icons ──────────────────────────────────────────────────────────────────
const InfoIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
    <circle cx="12" cy="12" r="10" stroke="#94a3b8" strokeWidth="2"/>
    <path d="M12 8v4M12 16h.01" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const ExportIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const CheckIcon = () => (
  <svg width={11} height={11} viewBox="0 0 24 24" fill="none">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ClockIcon = () => (
  <svg width={11} height={11} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ── Trend helpers ──────────────────────────────────────────────────────────
function glucoseTrend(valor: string, status: string): string {
  const v = Number(valor);
  if (status === 'ALTA') {
    const pct = Math.round(((v - 140) / 140) * 100);
    return `↑ ${pct}% acima da meta · faixa 70–140 mg/dL`;
  }
  if (status === 'BAIXA') {
    const pct = Math.round(((70 - v) / 70) * 100);
    return `↓ ${pct}% abaixo da meta · faixa 70–140 mg/dL`;
  }
  if (status === 'CRITICA') return '⚠ Valor crítico · oriente o paciente a consultar médico';
  return '✓ Dentro da meta · faixa 70–140 mg/dL';
}

function bpTrend(status: string): string {
  if (status === 'NORMAL')  return '✓ Dentro da faixa normal · referência 120/80';
  if (status === 'ALTA')    return '↑ Pressão elevada · recomenda consulta médica';
  if (status === 'CRITICA') return '⚠ Pressão crítica · atenção imediata';
  if (status === 'BAIXA')   return '↓ Pressão baixa · repouso e hidratação indicados';
  return '';
}

// ── Metric card ────────────────────────────────────────────────────────────
function MetricCard({ label, value, unit, status, icon, trend }: {
  label: string; value: string; unit?: string;
  status?: string; icon: string; trend?: string;
}) {
  const color = status ? statusColor[status] ?? '#94a3b8' : '#94a3b8';
  const bg    = status ? statusBg[status]    ?? '#f1f5f9' : '#f1f5f9';

  return (
    <div className="dsh-metric-card">
      <div className="dsh-metric-accent" style={{ background: color }} />
      <div className="dsh-metric-icon" style={{ background: bg }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div className="dsh-metric-info">
        <div className="dsh-metric-label">{label}</div>
        <div className="dsh-metric-value">
          {value}
          {unit && <span className="dsh-metric-unit">{unit}</span>}
        </div>
        {status && (
          <span className="dsh-metric-badge" style={{ background: bg, color }}>
            {status}
          </span>
        )}
        {trend && <div className="dsh-metric-trend">{trend}</div>}
      </div>
    </div>
  );
}

// ── Med ring card ──────────────────────────────────────────────────────────
function MedRingCard({ tomados, total }: { tomados: number; total: number }) {
  const pct     = total > 0 ? tomados / total : 0;
  const color   = pct === 1 && total > 0 ? '#16a34a' : total > 0 ? '#ea580c' : '#94a3b8';
  const bg      = pct === 1 && total > 0 ? '#dcfce7' : total > 0 ? '#fff7ed' : '#f1f5f9';
  const label   = pct === 1 && total > 0 ? 'NO PRAZO' : total > 0 ? 'PENDENTE' : 'SEM DADOS';
  const r       = 26;
  const circ    = 2 * Math.PI * r;
  const dash    = pct * circ;
  const pending = total - tomados;

  return (
    <div className="dsh-metric-card">
      <div className="dsh-metric-accent" style={{ background: color }} />
      <svg width={68} height={68} viewBox="0 0 68 68" style={{ flexShrink: 0, marginLeft: 4 }}>
        <circle cx={34} cy={34} r={r} fill="none" stroke="#f1f5f9" strokeWidth={7} />
        {total > 0 && (
          <circle
            cx={34} cy={34} r={r} fill="none"
            stroke={color} strokeWidth={7}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            transform="rotate(-90 34 34)"
          />
        )}
        <text x={34} y={36} textAnchor="middle" fontSize={12} fontWeight={700} fill="#0f172a">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <div className="dsh-metric-info">
        <div className="dsh-metric-label">MEDICAMENTOS</div>
        <div className="dsh-metric-value" style={{ fontSize: 20 }}>
          {tomados} de {total}
        </div>
        <span className="dsh-metric-badge" style={{ background: bg, color }}>{label}</span>
        {total > 0 && (
          <div className="dsh-metric-trend">
            tomados hoje · {pending > 0 ? `${pending} pendente${pending > 1 ? 's' : ''}` : 'todos tomados'}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Glucose chart legend ───────────────────────────────────────────────────
function ChartLegend() {
  return (
    <div className="dsh-chart-legend">
      <div className="dsh-chart-legend-item">
        <div className="dsh-chart-legend-swatch" style={{ background: '#dcfce7', border: '1px solid #86efac' }} />
        <span>Zona Segura</span>
      </div>
      <div className="dsh-chart-legend-item">
        <div className="dsh-chart-legend-dot" />
        <span>Glicose</span>
      </div>
    </div>
  );
}

// ── BP card ────────────────────────────────────────────────────────────────
function BPCard({ valor, status }: { valor: string; status: string }) {
  const parts = valor.split('/').map(Number);
  const sis   = parts[0] || 0;
  const dia   = parts[1] || 0;
  const sisPct = Math.min(100, Math.max(0, ((sis - 60) / 140) * 100));
  const diaPct = Math.min(100, Math.max(0, ((dia - 40) / 90) * 100));

  return (
    <>
      <div className="dsh-bp-section">
        <div className="dsh-bp-label">SISTÓLICA · MÉDIA</div>
        <div className="dsh-bp-val">
          {sis} <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 400 }}>mmHg</span>
        </div>
        <div className="dsh-bp-bar-track">
          <div className="dsh-bp-bar-fill" style={{ width: `${sisPct}%`, background: '#1e40af' }} />
        </div>
      </div>
      <div className="dsh-bp-section">
        <div className="dsh-bp-label">DIASTÓLICA · MÉDIA</div>
        <div className="dsh-bp-val">
          {dia} <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 400 }}>mmHg</span>
        </div>
        <div className="dsh-bp-bar-track">
          <div className="dsh-bp-bar-fill" style={{ width: `${diaPct}%`, background: '#16a34a' }} />
        </div>
      </div>
      <span
        className="dsh-metric-badge"
        style={{
          background: statusBg[status] ?? '#f1f5f9',
          color: statusColor[status] ?? '#94a3b8',
          padding: '3px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600,
        }}
      >
        {status}
      </span>
      <div className="dsh-bp-info-box">
        <InfoIcon />
        <span>
          Referência: <strong>120/80 mmHg</strong> (Normal).{' '}
          {bpTrend(status)}
        </span>
      </div>
    </>
  );
}

// ── Alert severity icon ────────────────────────────────────────────────────
function SeverityIcon({ severidade }: { severidade: string }) {
  const color =
    severidade === 'CRITICA' ? '#dc2626' :
    severidade === 'ALTA'    ? '#ea580c' :
    severidade === 'MEDIA'   ? '#ca8a04' : '#16a34a';

  return (
    <div
      className="dsh-alert-severity"
      style={{ background: color + '18', border: `1.5px solid ${color}` }}
    >
      <svg width={9} height={9} viewBox="0 0 24 24" fill={color}>
        <circle cx={12} cy={12} r={10} />
      </svg>
    </div>
  );
}

// ── Alert description from tipo + timestamp ────────────────────────────────
function alertDesc(a: Alerta): string {
  const tipoLabel: Record<string, string> = {
    GLICOSE:    'Nível de glicose',
    PRESSAO:    'Pressão arterial',
    MEDICAMENTO:'Medicamento',
  };
  const quando = new Date(a.dataHora).toLocaleString('pt-BR', {
    weekday: 'long', hour: '2-digit', minute: '2-digit',
  });
  return `${tipoLabel[a.tipo] ?? a.tipo} · registrado ${quando}.`;
}

// ── Day abbreviations ──────────────────────────────────────────────────────
const DAY_ABBR = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

// ── Dashboard ──────────────────────────────────────────────────────────────
interface DashboardProps {
  analyzeKey?: number;
  analyzing?: boolean;
  pageTitle?: string;
}

export default function Dashboard({ analyzeKey = 0, analyzing = false }: DashboardProps) {
  const { pacienteSelecionado } = useVinculo();
  const pid = pacienteSelecionado?.id;

  const [glicoseHoje,  setGlicoseHoje]  = useState<{ valor: string; status: string } | null>(null);
  const [pressaoHoje,  setPressaoHoje]  = useState<{ valor: string; status: string } | null>(null);
  const [glicose7d,    setGlicose7d]    = useState<RegistroSaude[]>([]);
  const [medicamentos, setMedicamentos] = useState<MedicamentoStatus[]>([]);
  const [alertas,      setAlertas]      = useState<Alerta[]>([]);
  const [analise,      setAnalise]      = useState('');
  const [lidasSet,     setLinhasSet]    = useState<Set<number>>(new Set());

  // Main data fetch
  useEffect(() => {
    if (!pid) return;
    const p = { pacienteId: pid };
    Promise.all([
      api.get('/saude/ultimos',            { params: p }),
      api.get('/saude',                    { params: { tipo: 'GLICOSE', dias: 7, ...p } }),
      api.get('/medicamentos/status-dia',  { params: p }),
      api.get('/alertas',                  { params: p }),
      api.get('/alertas/analise-ia',       { params: p }),
    ]).then(([ultimos, g7d, meds, als, ia]) => {
      const u = ultimos.data;
      if (u.GLICOSE) setGlicoseHoje({ valor: u.GLICOSE.valor, status: u.GLICOSE.status });
      if (u.PRESSAO) setPressaoHoje({ valor: u.PRESSAO.valor, status: u.PRESSAO.status });
      setGlicose7d(g7d.data.slice().reverse());
      setMedicamentos(meds.data);
      setAlertas(als.data.slice(0, 5));
      setAnalise(ia.data.analise);
    });
  }, [pid]);

  // Analysis re-fetch on demand
  useEffect(() => {
    if (!pid || analyzeKey === 0) return;
    api.get('/alertas/analise-ia', { params: { pacienteId: pid } })
      .then(res => setAnalise(res.data.analise))
      .catch(() => {});
  }, [pid, analyzeKey]);

  const totalMeds = medicamentos.length;
  const tomados   = medicamentos.filter(m => m.tomado).length;
  const pendentes = totalMeds - tomados;

  const chartData = glicose7d.map(r => ({
    hora:  DAY_ABBR[new Date(r.dataHora).getDay()],
    valor: Number(r.valor),
  }));

  function exportarCSV() {
    const header = 'Medicamento,Dosagem,Horários,Status';
    const rows   = medicamentos.map(m =>
      `"${m.nome}","${m.dosagem ?? '-'}","${m.horarios.join(' / ')}","${m.tomado ? 'Tomado' : 'Pendente'}"`
    );
    const csv  = [header, ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `medicamentos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function marcarLida(i: number) {
    setLinhasSet(s => new Set(s).add(i));
  }

  return (
    <div>
      {/* ── Metric cards ───────────────────────────── */}
      <div className="dsh-metrics">
        <MetricCard
          icon="🩸"
          label="GLICOSE"
          value={glicoseHoje?.valor || '—'}
          unit={glicoseHoje ? 'mg/dL' : undefined}
          status={glicoseHoje?.status}
          trend={glicoseHoje ? glucoseTrend(glicoseHoje.valor, glicoseHoje.status) : undefined}
        />
        <MetricCard
          icon="❤️"
          label="PRESSÃO"
          value={pressaoHoje?.valor || '—'}
          unit={pressaoHoje ? 'mmHg' : undefined}
          status={pressaoHoje?.status}
          trend={pressaoHoje ? bpTrend(pressaoHoje.status) : undefined}
        />
        <MedRingCard tomados={tomados} total={totalMeds} />
      </div>

      {/* ── Row 2: glucose chart + BP ──────────────── */}
      <div className="dsh-row2">
        {/* Glucose chart */}
        <div className="dsh-panel">
          <div className="dsh-panel-header">
            <div>
              <div className="dsh-panel-title">Glicose — últimos 7 dias</div>
              <div className="dsh-panel-subtitle">Tendência semanal · meta 70–140 mg/dL</div>
            </div>
          </div>
          <ChartLegend />
          {chartData.length === 0 ? (
            <div className="dsh-empty">Sem dados de glicose ainda.</div>
          ) : (
            <ResponsiveContainer width="100%" height={195}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="glicGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <ReferenceArea
                  y1={70} y2={140}
                  fill="#16a34a" fillOpacity={0.07}
                  ifOverflow="extendDomain"
                />
                <XAxis
                  dataKey="hora"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10, border: 'none',
                    boxShadow: '0 4px 16px rgba(0,0,0,.1)', fontSize: 13,
                  }}
                  formatter={(v: number) => [`${v} mg/dL`, 'Glicose']}
                />
                <Area
                  type="monotone" dataKey="valor"
                  stroke="#16a34a" strokeWidth={2.5}
                  fill="url(#glicGrad)"
                  dot={{ r: 4, fill: '#16a34a', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* BP card */}
        <div className="dsh-panel">
          <div className="dsh-panel-header">
            <div>
              <div className="dsh-panel-title">Pressão arterial</div>
              <div className="dsh-panel-subtitle">Última leitura registrada</div>
            </div>
          </div>
          {pressaoHoje ? (
            <BPCard valor={pressaoHoje.valor} status={pressaoHoje.status} />
          ) : (
            <div className="dsh-empty">Sem dados de pressão ainda.</div>
          )}
        </div>
      </div>

      {/* ── Row 3: meds table + alerts ─────────────── */}
      <div className="dsh-row3">
        {/* Meds table */}
        <div className="dsh-panel">
          <div className="dsh-panel-header">
            <div>
              <div className="dsh-panel-title">Status dos medicamentos · hoje</div>
              <div className="dsh-panel-subtitle">
                {tomados} tomados{pendentes > 0 ? `, ${pendentes} pendente${pendentes > 1 ? 's' : ''}` : ''}
              </div>
            </div>
            <button className="dsh-btn-export" onClick={exportarCSV}>
              <ExportIcon /> Exportar
            </button>
          </div>
          {medicamentos.length === 0 ? (
            <div className="dsh-empty">Nenhum medicamento cadastrado.</div>
          ) : (
            <table className="dsh-med-table">
              <thead>
                <tr>
                  <th>MEDICAMENTO</th>
                  <th>HORÁRIO</th>
                  <th style={{ textAlign: 'right' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {medicamentos.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div className="dsh-med-name">{m.nome}</div>
                      {m.dosagem && <div className="dsh-med-dose">{m.dosagem}</div>}
                    </td>
                    <td style={{ color: '#64748b', fontSize: 13 }}>
                      {m.horarios.length > 0 ? m.horarios.join(', ') : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {m.tomado ? (
                        <span className="dsh-med-status-ok"><CheckIcon /> Tomado</span>
                      ) : (
                        <span className="dsh-med-status-pending"><ClockIcon /> Pendente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Alerts */}
        <div className="dsh-panel">
          <div className="dsh-panel-header">
            <div>
              <div className="dsh-panel-title">Alertas recentes</div>
              <div className="dsh-panel-subtitle">Últimas 24h</div>
            </div>
            <button className="dsh-panel-link">Ver todos</button>
          </div>
          {alertas.length === 0 ? (
            <div className="dsh-empty">Nenhum alerta recente.</div>
          ) : (
            <div>
              {alertas.map((a, i) => {
                const color = statusColor[a.severidade] ?? '#ca8a04';
                const isLida = lidasSet.has(i);
                return (
                  <div
                    key={i}
                    className={`dsh-alert-item${isLida ? ' dsh-alert-item--lida' : ''}`}
                    style={{
                      background: (statusBg[a.severidade] ?? '#fef9c3'),
                      borderLeft: `3px solid ${color}`,
                    }}
                  >
                    <SeverityIcon severidade={a.severidade} />
                    <div className="dsh-alert-content">
                      <div className="dsh-alert-title">{a.mensagem}</div>
                      <div className="dsh-alert-desc">{alertDesc(a)}</div>
                      {!isLida && (
                        <button className="dsh-alert-action" onClick={() => marcarLida(i)}>
                          Marcar como lida
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── AI analysis card ───────────────────────── */}
      {(analise || analyzing) && (
        <div className="dsh-ai-card">
          <div className="dsh-ai-orb" />
          <div className="dsh-ai-body">
            <div className="dsh-ai-eyebrow">Análise da IA</div>
            <div className="dsh-ai-title">Abby — Assistente de Saúde</div>
            {analyzing ? (
              <div className="dsh-analyzing">
                <div className="dsh-analyzing-dot" />
                <div className="dsh-analyzing-dot" />
                <div className="dsh-analyzing-dot" />
                <span>Analisando sinais vitais do paciente…</span>
              </div>
            ) : (
              <p className="dsh-ai-text">{analise}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

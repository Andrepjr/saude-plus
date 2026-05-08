import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea,
} from 'recharts';
import type { RegistroSaude, MedicamentoStatus, Alerta } from '../../types';
import api from '../../services/api';
import { useVinculo } from '../../contexts/VinculoContext';

// ── Status tokens (reference palette) ────────────────────────────────────────
const statusColor: Record<string, string> = {
  NORMAL:  '#0a7a49',
  ALTA:    '#92400e',
  BAIXA:   '#1e40af',
  CRITICA: '#991b1b',
};
const statusBg: Record<string, string> = {
  NORMAL:  'rgba(34,197,94,.12)',
  ALTA:    '#fff4d6',
  BAIXA:   '#dbeafe',
  CRITICA: '#fee2e2',
};
const cardMod: Record<string, string> = {
  NORMAL:  'dsh-metric-card--ok',
  ALTA:    'dsh-metric-card--warn',
  BAIXA:   'dsh-metric-card--warn',
  CRITICA: 'dsh-metric-card--crit',
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const ExportIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const CheckIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ClockIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const PillIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="9" width="18" height="6" rx="3" stroke="currentColor"
      strokeWidth="1.8" transform="rotate(-35 12 12)"/>
    <path d="M7.8 7.3L16.2 15.7" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round"/>
  </svg>
);
const InfoIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="2"/>
    <path d="M12 8v4M12 16h.01" stroke="#3b82f6" strokeWidth="2"
      strokeLinecap="round"/>
  </svg>
);
const SparkleIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="#fff">
    <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-5.74L4 10l5.91-1.74L12 2z"/>
  </svg>
);

// ── Trend helpers ─────────────────────────────────────────────────────────────
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
  if (status === 'CRITICA') return '⚠ Valor crítico · consultar médico imediatamente';
  return '✓ Dentro da meta · faixa 70–140 mg/dL';
}

function bpTrend(status: string): string {
  if (status === 'NORMAL')  return '✓ Dentro da faixa normal';
  if (status === 'ALTA')    return '↑ Pressão elevada · recomenda consulta médica';
  if (status === 'CRITICA') return '⚠ Pressão crítica · atenção imediata';
  if (status === 'BAIXA')   return '↓ Pressão baixa · repouso e hidratação';
  return '';
}

// ── MetricCard (column layout matching reference) ──────────────────────────────
function MetricCard({ label, value, unit, status, icon, trend }: {
  label: string; value: string; unit?: string;
  status?: string; icon: string; trend?: string;
}) {
  const color = status ? statusColor[status] ?? '#6b7680' : '#6b7680';
  const bg    = status ? statusBg[status]    ?? '#f4f6f8' : '#f4f6f8';
  const mod   = status ? cardMod[status]     ?? '' : '';

  return (
    <div className={`dsh-metric-card ${mod}`}>
      <div className="dsh-metric-head">
        <div>
          <div className="dsh-metric-label">{label}</div>
          {status && (
            <span className="dsh-metric-badge" style={{ background: bg, color }}>
              {status}
            </span>
          )}
        </div>
        <div className="dsh-metric-icon-wrap" style={{ background: bg }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
        </div>
      </div>
      <div className="dsh-metric-value">
        {value}
        {unit && <span className="dsh-metric-unit">&thinsp;{unit}</span>}
      </div>
      {trend && <div className="dsh-metric-trend">{trend}</div>}
    </div>
  );
}

// ── MedRingCard (column layout) ───────────────────────────────────────────────
function MedRingCard({ tomados, total }: { tomados: number; total: number }) {
  const pct     = total > 0 ? tomados / total : 0;
  const color   = pct === 1 && total > 0 ? '#0a7a49' : total > 0 ? '#92400e' : '#6b7680';
  const bg      = pct === 1 && total > 0 ? 'rgba(34,197,94,.12)' : total > 0 ? '#fff4d6' : '#f4f6f8';
  const label   = pct === 1 && total > 0 ? 'NO PRAZO' : total > 0 ? 'PENDENTE' : 'SEM DADOS';
  const mod     = pct === 1 && total > 0 ? 'dsh-metric-card--ok' : total > 0 ? 'dsh-metric-card--warn' : '';
  const r       = 24;
  const circ    = 2 * Math.PI * r;
  const dash    = pct * circ;
  const pending = total - tomados;

  return (
    <div className={`dsh-metric-card ${mod}`}>
      <div className="dsh-metric-head">
        <div>
          <div className="dsh-metric-label">MEDICAMENTOS</div>
          <span className="dsh-metric-badge" style={{ background: bg, color }}>{label}</span>
        </div>
        <div className="dsh-metric-ring-wrap">
          <svg width={56} height={56} viewBox="0 0 56 56">
            <circle cx={28} cy={28} r={r} fill="none" stroke="#e9ecef" strokeWidth={6}/>
            {total > 0 && (
              <circle
                cx={28} cy={28} r={r} fill="none"
                stroke={color} strokeWidth={6}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeLinecap="round"
                transform="rotate(-90 28 28)"
              />
            )}
            <text x={28} y={32} textAnchor="middle" fontSize={11} fontWeight={700}
              fill="#0f1b18">
              {Math.round(pct * 100)}%
            </text>
          </svg>
        </div>
      </div>
      <div className="dsh-metric-value" style={{ fontSize: 28 }}>
        {tomados}
        <span className="dsh-metric-unit"> de {total}</span>
      </div>
      <div className="dsh-metric-trend">
        {total > 0
          ? `tomados hoje · ${pending > 0
              ? `${pending} pendente${pending > 1 ? 's' : ''}`
              : 'todos tomados'}`
          : 'Nenhum medicamento cadastrado'}
      </div>
    </div>
  );
}

// ── Chart legend ──────────────────────────────────────────────────────────────
function ChartLegend() {
  return (
    <div className="dsh-chart-legend">
      <span className="dsh-legend-dot dsh-legend-dot--zone">Zona Segura</span>
      <span className="dsh-legend-dot dsh-legend-dot--line">Glicose</span>
    </div>
  );
}

// ── BPCard (reference design) ──────────────────────────────────────────────────
function BPCard({ valor, status }: { valor: string; status: string }) {
  const parts  = valor.split('/').map(Number);
  const sis    = parts[0] || 0;
  const dia    = parts[1] || 0;
  const sisPct = Math.min(96, Math.max(4, ((sis - 60) / 140) * 100));
  const diaPct = Math.min(96, Math.max(4, ((dia - 40) / 90) * 100));
  // normal reference marker at 120 systolic
  const normPct = Math.min(96, Math.max(4, ((120 - 60) / 140) * 100));

  return (
    <div className="dsh-bp-block">
      <div className="dsh-bp-row">
        <div className="dsh-bp-row-head">
          <span className="dsh-bp-label">SISTÓLICA · MÉDIA</span>
          <span className="dsh-bp-val">
            {sis}<span className="dsh-bp-unit"> mmHg</span>
          </span>
        </div>
        <div className="dsh-bp-bar-track">
          <div className="dsh-bp-bar-fill dsh-bp-bar-fill--sys"
            style={{ width: `${sisPct}%` }}/>
          <div className="dsh-bp-marker" style={{ left: `${normPct}%` }}/>
        </div>
      </div>

      <div className="dsh-bp-row">
        <div className="dsh-bp-row-head">
          <span className="dsh-bp-label">DIASTÓLICA · MÉDIA</span>
          <span className="dsh-bp-val">
            {dia}<span className="dsh-bp-unit"> mmHg</span>
          </span>
        </div>
        <div className="dsh-bp-bar-track">
          <div className="dsh-bp-bar-fill dsh-bp-bar-fill--dia"
            style={{ width: `${diaPct}%` }}/>
        </div>
      </div>

      <span className="dsh-metric-badge" style={{
        background: statusBg[status] ?? '#f4f6f8',
        color: statusColor[status] ?? '#6b7680',
        padding: '3px 10px', borderRadius: 999,
        fontSize: 12, fontWeight: 700,
      }}>
        {status}
      </span>

      <div className="dsh-bp-ref">
        <InfoIcon />
        <span>
          Referência: <strong>120/80 mmHg</strong> (Normal). {bpTrend(status)}
        </span>
      </div>
    </div>
  );
}

// ── Alert icon ────────────────────────────────────────────────────────────────
function AlertIconWrap({ severidade }: { severidade: string }) {
  const isCrit = severidade === 'CRITICA';
  const isWarn = severidade === 'ALTA' || severidade === 'MEDIA';
  const bg    = isCrit ? '#fee2e2' : isWarn ? '#fff4d6' : 'rgba(34,197,94,.12)';
  const color = isCrit ? '#ef4444' : isWarn ? '#f59e0b' : '#22c55e';
  return (
    <div className="dsh-alert-icon-wrap" style={{ background: bg, color }}>
      {isCrit ? '⚠' : isWarn ? '!' : '✓'}
    </div>
  );
}

function alertDesc(a: Alerta): string {
  const tipoLabel: Record<string, string> = {
    GLICOSE:     'Nível de glicose',
    PRESSAO:     'Pressão arterial',
    MEDICAMENTO: 'Medicamento',
  };
  const quando = new Date(a.dataHora).toLocaleString('pt-BR', {
    weekday: 'long', hour: '2-digit', minute: '2-digit',
  });
  return `${tipoLabel[a.tipo] ?? a.tipo} · registrado ${quando}.`;
}

function alertTime(a: Alerta): string {
  return new Date(a.dataHora).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Day abbreviations (Sunday = 0) ────────────────────────────────────────────
const DAY_ABBR = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

// ── Dashboard ─────────────────────────────────────────────────────────────────
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
      api.get('/saude/ultimos',           { params: p }),
      api.get('/saude',                   { params: { tipo: 'GLICOSE', dias: 7, ...p } }),
      api.get('/medicamentos/status-dia', { params: p }),
      api.get('/alertas',                 { params: p }),
      api.get('/alertas/analise-ia',      { params: p }),
    ]).then(([ultimos, g7d, meds, als, ia]) => {
      const u = ultimos.data;
      if (u.GLICOSE) setGlicoseHoje({ valor: u.GLICOSE.valor, status: u.GLICOSE.status });
      if (u.PRESSAO) setPressaoHoje({ valor: u.PRESSAO.valor, status: u.PRESSAO.status });
      setGlicose7d(g7d.data);
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

  // Fix: build a proper 7-day window, aggregate multiple readings per day by average
  const now = new Date();
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i)); // i=0 is 6 days ago, i=6 is today
    const dayKey = d.toISOString().split('T')[0]; // YYYY-MM-DD
    const dayRecords = glicose7d.filter(r =>
      new Date(r.dataHora).toISOString().split('T')[0] === dayKey
    );
    const valor = dayRecords.length > 0
      ? Math.round(dayRecords.reduce((s, r) => s + Number(r.valor), 0) / dayRecords.length)
      : null;
    return { dia: DAY_ABBR[d.getDay()], valor };
  });

  const hasChartData = chartData.some(d => d.valor !== null);

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
          label="PRESSÃO ARTERIAL"
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
            <ChartLegend />
          </div>

          {!hasChartData ? (
            <div className="dsh-empty">Sem dados de glicose ainda.</div>
          ) : (
            <div className="dsh-chart-host">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="glicGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.22}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" vertical={false}/>
                  {/* Zona Segura: 70–140 mg/dL */}
                  <ReferenceArea
                    y1={70} y2={140}
                    fill="#22c55e" fillOpacity={0.08}
                    stroke="#22c55e" strokeOpacity={0.25}
                    strokeDasharray="4 4"
                    ifOverflow="extendDomain"
                  />
                  <XAxis
                    dataKey="dia"
                    tick={{ fontSize: 11, fill: '#9aa3aa', fontWeight: 500 }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    domain={[40, 220]}
                    tick={{ fontSize: 11, fill: '#9aa3aa' }}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e9ecef',
                      boxShadow: '0 6px 20px rgba(13,74,58,.1)',
                      fontSize: 13,
                      fontFamily: 'inherit',
                    }}
                    formatter={(v: unknown) =>
                      v !== null && v !== undefined
                        ? [`${v} mg/dL`, 'Glicose']
                        : ['Sem dado', 'Glicose']
                    }
                    labelFormatter={(label: any) => label}
                  />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    fill="url(#glicGrad)"
                    dot={{ r: 4, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#0d4a3a', stroke: '#fff', strokeWidth: 2 }}
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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
                {tomados} tomados{pendentes > 0
                  ? `, ${pendentes} pendente${pendentes > 1 ? 's' : ''}`
                  : ''}
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
                      <div className="dsh-med-cell">
                        <div className="dsh-med-icon-wrap">
                          <PillIcon />
                        </div>
                        <div>
                          <div className="dsh-med-name">{m.nome}</div>
                          {m.dosagem && <div className="dsh-med-dose">{m.dosagem}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      {m.horarios.length > 0
                        ? m.horarios.map((h, hi) => (
                            <span key={hi} className="dsh-time-pill">{h}</span>
                          ))
                        : <span style={{ color: '#9aa3aa', fontSize: 13 }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {m.tomado ? (
                        <span className="dsh-med-status-ok">
                          <CheckIcon /> Tomado
                        </span>
                      ) : (
                        <span className="dsh-med-status-pending">
                          <ClockIcon /> Pendente
                        </span>
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
            <div className="dsh-alert-list">
              {alertas.map((a, i) => {
                const isCrit = a.severidade === 'CRITICA';
                const isWarn = a.severidade === 'ALTA' || a.severidade === 'MEDIA';
                const isLida = lidasSet.has(i);
                const alertMod = isCrit
                  ? 'dsh-alert--crit'
                  : isWarn
                  ? 'dsh-alert--warn'
                  : 'dsh-alert--ok';
                return (
                  <div
                    key={i}
                    className={`dsh-alert-item ${alertMod}${isLida ? ' dsh-alert-item--lida' : ''}`}
                  >
                    <AlertIconWrap severidade={a.severidade} />
                    <div className="dsh-alert-content">
                      <div className="dsh-alert-title">{a.mensagem}</div>
                      <div className="dsh-alert-desc">{alertDesc(a)}</div>
                      <div className="dsh-alert-foot">
                        <span className="dsh-alert-time">🕐 {alertTime(a)}</span>
                        {!isLida && (
                          <button
                            className="dsh-alert-action"
                            onClick={() => marcarLida(i)}
                          >
                            Marcar como lida
                          </button>
                        )}
                      </div>
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
          <div className="dsh-abby-orb">
            <SparkleIcon />
          </div>
          <div className="dsh-ai-body">
            <div className="dsh-ai-head">
              <div className="dsh-ai-title">Abby — Assistente de Saúde</div>
              <span className="dsh-ai-tag">IA</span>
            </div>
            {analyzing ? (
              <div className="dsh-analyzing">
                <div className="dsh-analyzing-dot"/>
                <div className="dsh-analyzing-dot"/>
                <div className="dsh-analyzing-dot"/>
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

import { useState, useEffect, useMemo, useRef } from 'react';
import type { MedicamentoStatus } from '../../types';
import api from '../../services/api';

// ── Icons ──────────────────────────────────────────────────────────────
const PillBigIcon = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <rect x="3.5" y="9" width="17" height="6" rx="3" stroke="#1a8a6a" strokeWidth="2" transform="rotate(-35 12 12)"/>
    <path d="M7.8 7.3L16.2 15.7" stroke="#1a8a6a" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const EditIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <path d="M16 3l5 5-12 12H4v-5L16 3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 6l5 5" stroke="currentColor" strokeWidth="1.8"/>
  </svg>
);
const TrashIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <path d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const ClockIcon = ({ s = 12, c = 'currentColor' }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="2"/>
    <path d="M12 7v5l3 2" stroke={c} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const CheckIcon = ({ s = 12, c = 'currentColor' }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M5 12l5 5L20 7" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const PlusIcon = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);
const XIcon = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const SparkleIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z" fill="#86efac"/>
  </svg>
);

// ── Helpers ─────────────────────────────────────────────────────────────
function formatToday() {
  const d = new Date();
  const days = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  return `${days[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]}`;
}

// ── Progress card ────────────────────────────────────────────────────────
function ProgressCard({ taken, total }: { taken: number; total: number }) {
  const pct = total > 0 ? Math.round((taken / total) * 100) : 0;
  return (
    <div className="rem-progress-card">
      <div className="rem-progress-row">
        <div>
          <div className="rem-progress-label">Progresso de hoje</div>
          <div className="rem-progress-title">
            <strong>{taken} de {total}</strong> doses tomadas
          </div>
        </div>
        <div className="rem-progress-count">
          {pct}<span className="rem-denom">%</span>
        </div>
      </div>
      <div className="rem-progress-bar">
        <div className="rem-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Time chip ────────────────────────────────────────────────────────────
function TimeChip({ time, taken, onClick }: { time: string; taken: boolean; onClick: () => void }) {
  return (
    <button className={`rem-time-chip ${taken ? 'taken' : 'pending'}`} onClick={onClick} title={taken ? 'Tomado — clique para desmarcar' : 'Pendente — clique para marcar'}>
      {taken
        ? <span className="rem-chip-check"><CheckIcon s={11} c="#22c55e" /></span>
        : <ClockIcon s={11} />}
      {time}
    </button>
  );
}

// ── Med card ─────────────────────────────────────────────────────────────
function MedCard({
  med,
  onMarkNext,
  onEdit,
  onDelete,
  onToggleHorario,
}: {
  med: MedicamentoStatus;
  onMarkNext: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleHorario: (h: string) => void;
}) {
  const allTaken = med.horarios.length > 0 && med.horarios.every(h => med.horariosStatus[h]);
  const nextPending = med.horarios.find(h => !med.horariosStatus[h]);
  const state = allTaken ? 'done' : 'pending';

  return (
    <div className={`rem-med-card ${state}`}>
      <div className="rem-med-head">
        <div className="rem-med-head-left">
          <div className="rem-med-icon"><PillBigIcon /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 className="rem-med-title">{med.nome}</h3>
            {med.dosagem && (
              <p className="rem-med-dose">{med.dosagem}</p>
            )}
          </div>
        </div>
        <div className="rem-med-actions">
          <button className="rem-icon-btn" onClick={onEdit} aria-label="Editar">
            <EditIcon />
          </button>
          <button className="rem-icon-btn del" onClick={onDelete} aria-label="Excluir">
            <TrashIcon />
          </button>
        </div>
      </div>

      {med.horarios.length > 0 && (
        <div className="rem-time-chips">
          {med.horarios.map(h => (
            <TimeChip key={h} time={h} taken={!!med.horariosStatus[h]} onClick={() => onToggleHorario(h)} />
          ))}
        </div>
      )}

      {!allTaken && nextPending && (
        <div className="rem-next-dose">
          <ClockIcon s={12} c="#1a8a6a" />
          <span>Próxima dose às <strong>{nextPending}</strong></span>
        </div>
      )}

      {allTaken ? (
        <button className="rem-med-action taken" disabled>
          <span className="rem-check-circle"><CheckIcon s={11} c="#fff" /></span>
          Medicação Tomada
        </button>
      ) : (
        <button className="rem-med-action take" onClick={onMarkNext}>
          <CheckIcon s={14} c="#fff" />
          Marcar como Tomado
        </button>
      )}
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────
function MedModal({
  open,
  med,
  onClose,
  onSave,
  loading,
}: {
  open: boolean;
  med: MedicamentoStatus | null;
  onClose: () => void;
  onSave: (nome: string, dosagem: string, times: string[]) => void;
  loading: boolean;
}) {
  const [nome, setNome] = useState('');
  const [dosagem, setDosagem] = useState('');
  const [times, setTimes] = useState<string[]>(['08:00']);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (med) {
        setNome(med.nome);
        setDosagem(med.dosagem || '');
        setTimes(med.horarios.length > 0 ? [...med.horarios] : ['08:00']);
      } else {
        setNome(''); setDosagem(''); setTimes(['08:00']);
      }
      setTimeout(() => firstInputRef.current?.focus(), 60);
    }
  }, [open, med]);

  const updateTime = (i: number, v: string) => setTimes(t => t.map((x, idx) => idx === i ? v : x));
  const removeTime = (i: number) => setTimes(t => t.length > 1 ? t.filter((_, idx) => idx !== i) : t);
  const addTime = () => setTimes(t => [...t, '12:00']);

  function handleSave() {
    if (!nome.trim()) return;
    onSave(nome.trim(), dosagem.trim(), times.filter(Boolean));
  }

  return (
    <div className={`rem-modal-backdrop ${open ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rem-modal" role="dialog" aria-modal="true">
        <div className="rem-modal-header">
          <div>
            <h2 className="rem-modal-title">{med ? 'Editar medicamento' : 'Adicionar medicamento'}</h2>
            <p className="rem-modal-sub">Configure nome, dosagem e horários</p>
          </div>
          <button className="rem-modal-close" onClick={onClose} aria-label="Fechar"><XIcon /></button>
        </div>
        <div className="rem-modal-body">
          <div className="rem-field">
            <label className="rem-field-label">Nome do medicamento</label>
            <input
              ref={firstInputRef}
              className="rem-field-input"
              placeholder="Ex: Metformina"
              value={nome}
              onChange={e => setNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>
          <div className="rem-field">
            <label className="rem-field-label">Dosagem</label>
            <input
              className="rem-field-input"
              placeholder="Ex: 500mg"
              value={dosagem}
              onChange={e => setDosagem(e.target.value)}
            />
          </div>
          <div className="rem-field">
            <label className="rem-field-label">Horários</label>
            <div className="rem-time-inputs">
              {times.map((t, i) => (
                <div key={i} className="rem-time-input-wrap">
                  <ClockIcon s={13} c="#1a8a6a" />
                  <input
                    type="time"
                    className="rem-time-input"
                    value={t}
                    onChange={e => updateTime(i, e.target.value)}
                  />
                  <button className="rem-time-remove" onClick={() => removeTime(i)} aria-label="Remover">
                    <XIcon s={14} />
                  </button>
                </div>
              ))}
              <button className="rem-btn-add-time" onClick={addTime}>
                <PlusIcon s={12} /> Adicionar horário
              </button>
            </div>
          </div>
        </div>
        <div className="rem-modal-footer">
          <button className="rem-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="rem-btn-save" onClick={handleSave} disabled={loading || !nome.trim()}>
            {loading ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function Remedios() {
  const [medicamentos, setMedicamentos] = useState<MedicamentoStatus[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<MedicamentoStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  function showToast(msg: string) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  }

  async function carregar() {
    const res = await api.get('/medicamentos/status-dia');
    setMedicamentos(res.data);
  }

  useEffect(() => { carregar(); }, []);

  const totals = useMemo(() => {
    let total = 0, taken = 0;
    medicamentos.forEach(m => m.horarios.forEach(h => {
      total++;
      if (m.horariosStatus[h]) taken++;
    }));
    return { total, taken };
  }, [medicamentos]);

  async function handleSave(nome: string, dosagem: string, times: string[]) {
    setLoading(true);
    try {
      if (editingMed) {
        await api.put(`/medicamentos/${editingMed.id}`, { nome, dosagem, horarios: times, ativo: true });
        showToast('Medicamento atualizado');
      } else {
        await api.post('/medicamentos', { nome, dosagem, horarios: times });
        showToast('Medicamento adicionado');
      }
      setModalOpen(false);
      setEditingMed(null);
      await carregar();
    } finally {
      setLoading(false);
    }
  }

  async function remover(med: MedicamentoStatus) {
    if (!confirm(`Excluir ${med.nome}?`)) return;
    await api.delete(`/medicamentos/${med.id}`);
    showToast('Medicamento removido');
    await carregar();
  }

  async function marcarTomado(med: MedicamentoStatus, horario: string) {
    await api.post('/medicamentos/tomada', {
      medicamentoId: med.id,
      horarioPrevisto: horario,
      tomado: !med.horariosStatus[horario],
    });
    await carregar();
  }

  function markNext(med: MedicamentoStatus) {
    const nextPending = med.horarios.find(h => !med.horariosStatus[h]);
    if (nextPending) {
      marcarTomado(med, nextPending);
      showToast(`${med.nome} registrada ✓`);
    }
  }

  function openAdd() {
    setEditingMed(null);
    setModalOpen(true);
  }

  function openEdit(med: MedicamentoStatus) {
    setEditingMed(med);
    setModalOpen(true);
  }

  return (
    <div className="rem-main">
      <div className="rem-content">
        {/* Page header */}
        <div className="rem-page-head">
          <div>
            <h1 className="rem-page-title">Meus Remédios</h1>
            <p className="rem-page-sub">{formatToday()}</p>
          </div>
          <button className="rem-btn-primary" onClick={openAdd}>
            <PlusIcon s={16} /> Adicionar
          </button>
        </div>

        {/* Progress */}
        <ProgressCard taken={totals.taken} total={totals.total} />

        {/* Med grid */}
        {medicamentos.length === 0 ? (
          <div className="rem-empty">
            <div className="rem-empty-icon"><PillBigIcon /></div>
            <div className="rem-empty-title">Nenhum medicamento cadastrado</div>
            <div className="rem-empty-sub">Adicione seu primeiro medicamento para começar a acompanhar sua rotina.</div>
            <button className="rem-btn-primary" onClick={openAdd} style={{ marginTop: 4 }}>
              <PlusIcon s={16} /> Adicionar medicamento
            </button>
          </div>
        ) : (
          <div className="rem-med-grid">
            {medicamentos.map(med => (
              <MedCard
                key={med.id}
                med={med}
                onMarkNext={() => markNext(med)}
                onEdit={() => openEdit(med)}
                onDelete={() => remover(med)}
                onToggleHorario={h => marcarTomado(med, h)}
              />
            ))}
          </div>
        )}
      </div>

      <MedModal
        open={modalOpen}
        med={editingMed}
        onClose={() => { setModalOpen(false); setEditingMed(null); }}
        onSave={handleSave}
        loading={loading}
      />

      <div className={`rem-toast ${toast ? 'show' : ''}`}>
        <SparkleIcon />
        {toast}
      </div>
    </div>
  );
}

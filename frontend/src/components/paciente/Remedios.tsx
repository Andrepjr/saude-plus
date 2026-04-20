import { useState, useEffect } from 'react';
import type { MedicamentoStatus } from '../../types';
import api from '../../services/api';
import Button from '../common/Button';
import Input from '../common/Input';
import Card from '../common/Card';

function StatusBadge({ tomado }: { tomado: boolean }) {
  return (
    <span style={{
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600,
      background: tomado ? '#dcfce7' : '#fef9c3',
      color: tomado ? '#16a34a' : '#854d0e',
    }}>
      {tomado ? '✓ Tomado' : '⏳ Pendente'}
    </span>
  );
}

export default function Remedios() {
  const [medicamentos, setMedicamentos] = useState<MedicamentoStatus[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: '', dosagem: '', horarios: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', dosagem: '', horarios: '' });
  const [loading, setLoading] = useState(false);

  async function carregar() {
    const res = await api.get('/medicamentos/status-dia');
    setMedicamentos(res.data);
  }

  useEffect(() => { carregar(); }, []);

  async function salvar() {
    if (!form.nome.trim()) return;
    setLoading(true);
    try {
      const horarios = form.horarios
        ? form.horarios.split(',').map(h => h.trim()).filter(Boolean)
        : [];
      await api.post('/medicamentos', { nome: form.nome, dosagem: form.dosagem, horarios });
      setForm({ nome: '', dosagem: '', horarios: '' });
      setShowForm(false);
      await carregar();
    } finally {
      setLoading(false);
    }
  }

  function iniciarEdicao(med: MedicamentoStatus) {
    setEditingId(med.id);
    setEditForm({
      nome: med.nome,
      dosagem: med.dosagem || '',
      horarios: med.horarios.join(', '),
    });
  }

  async function salvarEdicao(med: MedicamentoStatus) {
    setLoading(true);
    try {
      const horarios = editForm.horarios
        ? editForm.horarios.split(',').map(h => h.trim()).filter(Boolean)
        : [];
      await api.put(`/medicamentos/${med.id}`, {
        nome: editForm.nome,
        dosagem: editForm.dosagem,
        horarios,
        ativo: true,
      });
      setEditingId(null);
      await carregar();
    } finally {
      setLoading(false);
    }
  }

  async function remover(id: number) {
    if (!confirm('Remover este medicamento?')) return;
    await api.delete(`/medicamentos/${id}`);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Meus Remédios</h2>
        <Button onClick={() => setShowForm(!showForm)} variant="primary" size="sm">
          {showForm ? 'Cancelar' : '+ Adicionar'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Novo Medicamento</h3>
            <Input
              label="Nome do remédio *"
              value={form.nome}
              onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
              placeholder="Ex: Metformina"
            />
            <Input
              label="Dosagem"
              value={form.dosagem}
              onChange={e => setForm(p => ({ ...p, dosagem: e.target.value }))}
              placeholder="Ex: 500mg"
            />
            <Input
              label="Horários (separados por vírgula)"
              value={form.horarios}
              onChange={e => setForm(p => ({ ...p, horarios: e.target.value }))}
              placeholder="Ex: 08:00, 14:00, 20:00"
            />
            <Button onClick={salvar} loading={loading}>Salvar</Button>
          </div>
        </Card>
      )}

      {medicamentos.length === 0 ? (
        <Card>
          <p style={{ textAlign: 'center', color: 'var(--cinza-texto)', padding: '32px 0' }}>
            Nenhum medicamento cadastrado ainda.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {medicamentos.map(med => (
            <Card key={med.id}>
              {editingId === med.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Input label="Nome" value={editForm.nome} onChange={e => setEditForm(p => ({ ...p, nome: e.target.value }))} />
                  <Input label="Dosagem" value={editForm.dosagem} onChange={e => setEditForm(p => ({ ...p, dosagem: e.target.value }))} />
                  <Input label="Horários (separados por vírgula)" value={editForm.horarios} onChange={e => setEditForm(p => ({ ...p, horarios: e.target.value }))} placeholder="Ex: 08:00, 20:00" />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button onClick={() => salvarEdicao(med)} loading={loading} size="sm">Salvar</Button>
                    <Button onClick={() => setEditingId(null)} variant="secondary" size="sm">Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '16px' }}>{med.nome}</div>
                    {med.dosagem && (
                      <div style={{ color: 'var(--cinza-texto)', fontSize: '14px', marginTop: '2px' }}>{med.dosagem}</div>
                    )}
                    {med.horarios.length > 0 && (
                      <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {med.horarios.map(h => (
                          <button
                            key={h}
                            onClick={() => marcarTomado(med, h)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              border: `1px solid ${med.horariosStatus[h] ? 'var(--verde-claro)' : '#d1d5db'}`,
                              background: med.horariosStatus[h] ? 'var(--verde-bg)' : '#fff',
                              color: med.horariosStatus[h] ? 'var(--verde-escuro)' : 'var(--cinza-texto)',
                              fontSize: '13px',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            ⏰ {h}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <StatusBadge tomado={med.tomado} />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => iniciarEdicao(med)}
                        title="Editar"
                        style={{
                          padding: '5px 9px', borderRadius: '8px',
                          border: '1px solid #e5e7eb', background: '#f9fafb',
                          cursor: 'pointer', fontSize: '14px', color: '#6b7280',
                        }}
                      >✏️</button>
                      <button
                        onClick={() => remover(med.id)}
                        title="Remover"
                        style={{
                          padding: '5px 9px', borderRadius: '8px',
                          border: '1px solid #fee2e2', background: '#fff5f5',
                          cursor: 'pointer', fontSize: '14px', color: '#dc2626',
                        }}
                      >🗑️</button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

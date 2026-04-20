import { useState, useEffect } from 'react';
import type { Medicamento } from '../../types';
import api from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Header from '../layout/Header';

export default function MedicamentosCuidador() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: '', dosagem: '', horarios: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', dosagem: '', horarios: '' });
  const [loading, setLoading] = useState(false);

  async function carregar() {
    const res = await api.get('/medicamentos');
    setMedicamentos(res.data);
  }

  useEffect(() => { carregar(); }, []);

  async function salvar() {
    if (!form.nome.trim()) return;
    setLoading(true);
    try {
      const horarios = form.horarios.split(',').map(h => h.trim()).filter(Boolean);
      await api.post('/medicamentos', { nome: form.nome, dosagem: form.dosagem, horarios });
      setForm({ nome: '', dosagem: '', horarios: '' });
      setShowForm(false);
      await carregar();
    } finally {
      setLoading(false);
    }
  }

  function iniciarEdicao(m: Medicamento) {
    setEditingId(m.id);
    setEditForm({ nome: m.nome, dosagem: m.dosagem || '', horarios: m.horarios.join(', ') });
  }

  async function salvarEdicao(m: Medicamento) {
    setLoading(true);
    try {
      const horarios = editForm.horarios.split(',').map(h => h.trim()).filter(Boolean);
      await api.put(`/medicamentos/${m.id}`, {
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

  return (
    <div>
      <Header title="Medicamentos" subtitle="Gerenciar medicamentos do paciente" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          {showForm ? 'Cancelar' : '+ Novo Medicamento'}
        </Button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Novo Medicamento</h3>
            <Input label="Nome *" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Metformina" />
            <Input label="Dosagem" value={form.dosagem} onChange={e => setForm(p => ({ ...p, dosagem: e.target.value }))} placeholder="Ex: 500mg" />
            <Input label="Horários (separados por vírgula)" value={form.horarios} onChange={e => setForm(p => ({ ...p, horarios: e.target.value }))} placeholder="Ex: 08:00, 20:00" />
            <Button onClick={salvar} loading={loading}>Salvar</Button>
          </div>
        </Card>
      )}

      {medicamentos.length === 0 ? (
        <Card>
          <p style={{ textAlign: 'center', color: 'var(--cinza-texto)', padding: '40px 0' }}>
            Nenhum medicamento cadastrado.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {medicamentos.map(m => (
            <Card key={m.id} style={{ padding: '14px 18px' }}>
              {editingId === m.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Input label="Nome" value={editForm.nome} onChange={e => setEditForm(p => ({ ...p, nome: e.target.value }))} />
                  <Input label="Dosagem" value={editForm.dosagem} onChange={e => setEditForm(p => ({ ...p, dosagem: e.target.value }))} />
                  <Input label="Horários (separados por vírgula)" value={editForm.horarios} onChange={e => setEditForm(p => ({ ...p, horarios: e.target.value }))} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button onClick={() => salvarEdicao(m)} loading={loading} size="sm">Salvar</Button>
                    <Button onClick={() => setEditingId(null)} variant="secondary" size="sm">Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>💊 {m.nome}</div>
                    {m.dosagem && <div style={{ color: 'var(--cinza-texto)', fontSize: '13px' }}>{m.dosagem}</div>}
                    {m.horarios.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                        {m.horarios.map(h => (
                          <span key={h} style={{
                            padding: '2px 8px', borderRadius: '12px',
                            background: 'var(--verde-bg)', color: 'var(--verde-escuro)',
                            fontSize: '12px', fontWeight: 500,
                          }}>⏰ {h}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => iniciarEdicao(m)}
                      title="Editar"
                      style={{
                        padding: '6px 10px', borderRadius: '8px',
                        border: '1px solid #e5e7eb', background: '#f9fafb',
                        cursor: 'pointer', fontSize: '14px', color: '#6b7280',
                      }}
                    >✏️</button>
                    <button
                      onClick={() => remover(m.id)}
                      title="Remover"
                      style={{
                        padding: '6px 10px', borderRadius: '8px',
                        border: '1px solid #fee2e2', background: '#fff5f5',
                        cursor: 'pointer', fontSize: '14px', color: '#dc2626',
                      }}
                    >🗑️</button>
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

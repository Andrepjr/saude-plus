import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useVinculo } from '../../contexts/VinculoContext';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Header from '../layout/Header';
import type { PacienteVinculado } from '../../types';
import api from '../../services/api';

export default function Configuracoes() {
  const { user, logout } = useAuth();
  const { pacientes, pacienteSelecionado, setPacienteSelecionado, recarregar } = useVinculo();
  const navigate = useNavigate();

  const [codigo, setCodigo] = useState('');
  const [vinculando, setVinculando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erroVinculo, setErroVinculo] = useState('');

  function handleLogout() {
    logout();
    navigate('/login');
  }

  async function vincular() {
    if (codigo.trim().length !== 6) {
      setErroVinculo('O código deve ter exatamente 6 dígitos.');
      return;
    }
    setVinculando(true);
    setSucesso('');
    setErroVinculo('');
    try {
      const res = await api.post('/vinculos/vincular', { codigo: codigo.trim() });
      setSucesso(res.data.message);
      setCodigo('');
      await recarregar();
    } catch (err: any) {
      setErroVinculo(err.response?.data?.error || 'Erro ao vincular. Tente novamente.');
    } finally {
      setVinculando(false);
    }
  }

  async function desvincular(p: PacienteVinculado) {
    if (!confirm(`Remover vínculo com ${p.nome}?`)) return;
    try {
      await api.delete(`/vinculos/pacientes/${p.id}`);
      if (pacienteSelecionado?.id === p.id) setPacienteSelecionado(null);
      await recarregar();
    } catch {
      alert('Erro ao remover vínculo.');
    }
  }

  return (
    <div>
      <Header title="Configurações" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>

        {/* Conta */}
        <Card title="Conta">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--cinza-texto)' }}>Nome</div>
              <div style={{ fontWeight: 500 }}>{user?.nome}</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--cinza-texto)' }}>E-mail</div>
              <div style={{ fontWeight: 500 }}>{user?.email}</div>
            </div>
          </div>
        </Card>

        {/* Vincular paciente */}
        <Card title="Vincular Paciente">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '14px', color: 'var(--cinza-texto)', margin: 0 }}>
              Peça ao paciente que gere um código na aba <strong>Perfil</strong> do aplicativo dele e digite abaixo.
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="Código do paciente (6 dígitos)"
                  value={codigo}
                  onChange={e => {
                    setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setErroVinculo('');
                    setSucesso('');
                  }}
                  placeholder="Ex: 482951"
                  maxLength={6}
                />
              </div>
              <Button onClick={vincular} loading={vinculando} disabled={codigo.length !== 6}>
                Vincular
              </Button>
            </div>

            {sucesso && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px',
                background: '#f0fdf4', color: '#16a34a',
                fontSize: '14px', border: '1px solid #bbf7d0',
              }}>
                ✅ {sucesso}
              </div>
            )}
            {erroVinculo && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px',
                background: '#fef2f2', color: '#dc2626',
                fontSize: '14px', border: '1px solid #fecaca',
              }}>
                {erroVinculo}
              </div>
            )}
          </div>
        </Card>

        {/* Pacientes vinculados */}
        {pacientes.length > 0 && (
          <Card title="Pacientes Vinculados">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pacientes.map((p: PacienteVinculado) => (
                <div key={p.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: pacienteSelecionado?.id === p.id ? 'var(--verde-bg)' : '#fafafa',
                  border: `1px solid ${pacienteSelecionado?.id === p.id ? 'var(--verde-claro)' : 'var(--cinza-borda)'}`,
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>👤 {p.nome}</div>
                    <div style={{ color: 'var(--cinza-texto)', fontSize: '12px' }}>{p.email}</div>
                  </div>
                  <button
                    onClick={() => desvincular(p)}
                    title="Remover vínculo"
                    style={{
                      padding: '5px 9px', borderRadius: '8px',
                      border: '1px solid #fee2e2', background: '#fff5f5',
                      cursor: 'pointer', fontSize: '13px', color: '#dc2626',
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Sessão */}
        <Card title="Sessão">
          <Button onClick={handleLogout} variant="danger">Sair da conta</Button>
        </Card>

      </div>
    </div>
  );
}

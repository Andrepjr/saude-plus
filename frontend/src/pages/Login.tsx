import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

type Modo = 'login' | 'register';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState<Modo>('login');
  const [form, setForm] = useState({ nome: '', email: '', senha: '', perfil: 'PACIENTE' });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      if (modo === 'login') {
        await login(form.email, form.senha);
      } else {
        await register(form.nome, form.email, form.senha, form.perfil);
      }
      const perfil = JSON.parse(localStorage.getItem('saude_user') || '{}').perfil;
      navigate(perfil === 'CUIDADOR' ? '/cuidador' : '/paciente');
    } catch (err: any) {
      setErro(err.response?.data?.error || 'Erro ao entrar. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--verde-escuro) 0%, var(--verde-medio) 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '16px',
            background: 'var(--verde-escuro)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '28px', fontWeight: 800, color: '#fff',
          }}>S+</div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--texto-principal)', marginBottom: '4px' }}>
            Saúde+
          </h1>
          <p style={{ color: 'var(--cinza-texto)', fontSize: '14px' }}>
            Monitoramento de saúde para idosos
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--cinza-fundo)',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '28px',
        }}>
          {(['login', 'register'] as Modo[]).map(m => (
            <button
              key={m}
              onClick={() => { setModo(m); setErro(''); }}
              style={{
                flex: 1,
                padding: '9px',
                border: 'none',
                borderRadius: '8px',
                background: modo === m ? '#fff' : 'transparent',
                color: modo === m ? 'var(--verde-escuro)' : 'var(--cinza-texto)',
                fontWeight: modo === m ? 600 : 400,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: modo === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {m === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {modo === 'register' && (
            <>
              <Input
                label="Nome completo"
                value={form.nome}
                onChange={e => set('nome', e.target.value)}
                placeholder="Seu nome"
                required
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Perfil</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[{ value: 'PACIENTE', icon: '👴', label: 'Paciente' }, { value: 'CUIDADOR', icon: '👩‍⚕️', label: 'Cuidador' }].map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => set('perfil', p.value)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '10px',
                        border: `2px solid ${form.perfil === p.value ? 'var(--verde-medio)' : 'var(--cinza-borda)'}`,
                        background: form.perfil === p.value ? 'var(--verde-bg)' : '#fff',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: form.perfil === p.value ? 'var(--verde-escuro)' : 'var(--cinza-texto)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>{p.icon}</span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="seu@email.com"
            required
          />
          <Input
            label="Senha"
            type="password"
            value={form.senha}
            onChange={e => set('senha', e.target.value)}
            placeholder="••••••••"
            required
          />
          {erro && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#fee2e2',
              color: '#dc2626',
              fontSize: '14px',
            }}>
              {erro}
            </div>
          )}
          <Button type="submit" loading={loading} size="lg" style={{ width: '100%', marginTop: '4px' }}>
            {modo === 'login' ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>
      </div>
    </div>
  );
}

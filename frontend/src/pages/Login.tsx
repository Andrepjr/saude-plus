import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/common/Input';
import loginHero from '../assets/login-hero.jpg';

type Modo = 'login' | 'register';

const VERDE = '#1a5c45';
const VERDE_HOVER = '#154d3a';

function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const fn = () => setWidth(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return width;
}

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState<Modo>('login');
  const [form, setForm] = useState({ nome: '', email: '', senha: '', perfil: 'CUIDADOR' });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  const w = useWindowWidth();
  const isMobile = w < 768;   // stacked layout
  const isSmall  = w < 480;   // extra compact

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

  function trocarModo() {
    setModo(m => m === 'login' ? 'register' : 'login');
    setErro('');
    setForm({ nome: '', email: '', senha: '', perfil: 'CUIDADOR' });
  }

  // ── valores responsivos ────────────────────────────────────────────────────
  const heroPadding   = isSmall ? '20px 20px' : isMobile ? '24px 28px' : '48px';
  const heroTitleSize = isSmall ? '22px'       : isMobile ? '26px'      : '40px';
  const formPadding   = isSmall ? '24px 20px'  : isMobile ? '32px 28px' : '48px 64px';
  const formTitleSize = isSmall ? '22px'        : isMobile ? '24px'      : '28px';
  const formGapHead   = isSmall ? '20px'        : '32px';

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      minHeight: '100vh',
      fontFamily: 'inherit',
    }}>

      {/* ── Banner / Hero ────────────────────────────────────────────────── */}
      <div style={{
        // desktop: 50% width fixo | mobile: largura total, altura 35vh
        ...(isMobile
          ? { width: '100%', height: isSmall ? '30vh' : '35vh', flexShrink: 0 }
          : { flex: '0 0 50%' }
        ),
        position: 'relative',
        backgroundImage: `url(${loginHero})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        padding: heroPadding,
        overflow: 'hidden',
      }}>
        {/* Overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(26, 92, 69, 0.83)',
        }} />

        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column', height: '100%',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: isSmall ? 32 : 38, height: isSmall ? 32 : 38,
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: isSmall ? '14px' : '16px', fontWeight: 800, color: '#fff',
              border: '1px solid rgba(255,255,255,0.25)',
            }}>S+</div>
            <span style={{
              color: '#fff', fontWeight: 700,
              fontSize: isSmall ? '15px' : '17px',
            }}>Saúde+</span>
          </div>

          {/* Título + subtítulo — só visível se tiver espaço suficiente */}
          <div style={{
            flex: 1,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            // no mobile compacto esconde o subtítulo longo
          }}>
            <h1 style={{
              color: '#fff',
              fontSize: heroTitleSize,
              fontWeight: 800,
              lineHeight: 1.2,
              margin: isMobile ? '12px 0 8px' : '0 0 20px',
              letterSpacing: '-0.3px',
            }}>
              Acompanhe a saúde de quem você ama
            </h1>
            {/* Subtítulo oculto em telas muito pequenas */}
            {!isSmall && (
              <p style={{
                color: 'rgba(255,255,255,0.82)',
                fontSize: isMobile ? '14px' : '15.5px',
                lineHeight: 1.6,
                margin: 0,
                maxWidth: '380px',
              }}>
                Monitore glicose, pressão e medicamentos em tempo real.
                Receba alertas inteligentes quando algo precisar de atenção.
              </p>
            )}
          </div>

          {/* Ícones — ocultos no banner mobile para não poluir */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: '20px' }}>
              {[
                { emoji: '❤️', label: 'Saúde' },
                { emoji: '📊', label: 'Relatórios' },
                { emoji: '💊', label: 'Medicamentos' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '9px',
                    background: 'rgba(255,255,255,0.14)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px',
                  }}>{item.emoji}</div>
                  <span style={{ color: 'rgba(255,255,255,0.78)', fontSize: '13px', fontWeight: 500 }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Formulário ───────────────────────────────────────────────────── */}
      <div style={{
        ...(isMobile ? { flex: 1, width: '100%' } : { flex: '0 0 50%' }),
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isMobile ? 'flex-start' : 'center',
        alignItems: 'center',
        padding: formPadding,
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: isMobile ? '100%' : '380px' }}>

          {/* Cabeçalho */}
          <div style={{ marginBottom: formGapHead }}>
            <h2 style={{
              fontSize: formTitleSize, fontWeight: 700, color: '#111827',
              margin: '0 0 6px',
            }}>
              {modo === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
            </h2>
            <p style={{ color: '#6b7280', fontSize: isSmall ? '13px' : '15px', margin: 0 }}>
              {modo === 'login'
                ? 'Acesse o painel do cuidador'
                : 'Comece a monitorar a saúde de quem você ama'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {modo === 'register' && (
              <>
                <Input
                  label="Nome completo"
                  value={form.nome}
                  onChange={e => set('nome', e.target.value)}
                  placeholder="Seu nome completo"
                  autoComplete="name"
                  required
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>Perfil</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {[
                      { value: 'PACIENTE', emoji: '👴', label: 'Paciente' },
                      { value: 'CUIDADOR', emoji: '👩‍⚕️', label: 'Cuidador' },
                    ].map(p => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => set('perfil', p.value)}
                        style={{
                          flex: 1, padding: '10px 8px',
                          borderRadius: '10px',
                          border: `2px solid ${form.perfil === p.value ? VERDE : '#e5e7eb'}`,
                          background: form.perfil === p.value ? '#f0fdf4' : '#fafafa',
                          cursor: 'pointer',
                          fontSize: '13px', fontWeight: 500,
                          color: form.perfil === p.value ? VERDE : '#6b7280',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontSize: '20px' }}>{p.emoji}</span>
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
              autoComplete={modo === 'login' ? 'email' : 'off'}
              required
            />
            <Input
              label="Senha"
              type="password"
              value={form.senha}
              onChange={e => set('senha', e.target.value)}
              placeholder="••••••••"
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
              required
            />

            {erro && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px',
                background: '#fef2f2', color: '#dc2626',
                fontSize: '14px', border: '1px solid #fecaca',
              }}>
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{
                width: '100%',
                padding: isSmall ? '12px' : '13px',
                borderRadius: '12px',
                border: 'none',
                background: loading ? '#9ca3af' : btnHover ? VERDE_HOVER : VERDE,
                color: '#fff',
                fontSize: isSmall ? '14px' : '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'background 0.18s',
                marginTop: '4px',
              }}
            >
              {loading ? 'Aguarde...' : (
                <>
                  {modo === 'login' ? 'Entrar' : 'Criar conta'}
                  <span style={{ fontSize: '17px', lineHeight: 1 }}>→</span>
                </>
              )}
            </button>
          </form>

          {/* Divisor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            <span style={{ color: '#9ca3af', fontSize: '13px' }}>ou</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>

          {/* Alternar modo */}
          <button
            onClick={trocarModo}
            style={{
              width: '100%',
              padding: isSmall ? '11px' : '12px',
              borderRadius: '12px',
              border: '1.5px solid #e5e7eb',
              background: '#fff',
              color: VERDE,
              fontSize: isSmall ? '13px' : '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {modo === 'login' ? 'Criar conta de cuidador' : '← Já tenho conta — Entrar'}
          </button>

          {/* Rodapé */}
          {modo === 'login' && (
            <p style={{
              textAlign: 'center', color: '#9ca3af',
              fontSize: '13px', marginTop: '24px', lineHeight: 1.6,
            }}>
              É paciente? Baixe o app{' '}
              <strong style={{ color: '#374151' }}>Saúde+</strong> na{' '}
              <span style={{ color: VERDE, fontWeight: 500 }}>App Store</span>
              {' '}ou{' '}
              <span style={{ color: VERDE, fontWeight: 500 }}>Google Play</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

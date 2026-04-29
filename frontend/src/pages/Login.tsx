import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import loginHero from '../assets/login-hero.jpg';

type Modo = 'login' | 'register';

// ── Icons ──────────────────────────────────────────────────────────────
const HeartIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <path d="M12 20.5s-7.5-4.5-9.5-9.5C1 7 4 3.5 7.5 3.5c2 0 3.5 1 4.5 2.5 1-1.5 2.5-2.5 4.5-2.5 3.5 0 6.5 3.5 5 7.5-2 5-9.5 9.5-9.5 9.5z" fill="#fff"/>
  </svg>
);
const MailIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const LockIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <rect x="4" y="10" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8"/>
  </svg>
);
const UserIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const EyeIcon = () => (
  <svg width={17} height={17} viewBox="0 0 24 24" fill="none">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width={17} height={17} viewBox="0 0 24 24" fill="none">
    <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.5 5.1A10 10 0 0112 5c6.5 0 10 7 10 7a15 15 0 01-3 3.5M6 7.5A14 14 0 002 12s3.5 7 10 7c1.7 0 3.2-.4 4.5-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const ArrowIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const PulseIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <path d="M3 12h4l2-5 4 10 2-5h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ChartIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const PillIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="9" width="18" height="6" rx="3" stroke="#fff" strokeWidth="2" transform="rotate(-35 12 12)"/>
    <path d="M7.8 7.3L16.2 15.7" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const SmileIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M8 14c1.2 1.3 2.5 2 4 2s2.8-.7 4-2M9 10v.01M15 10v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const InfoIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 11v5M12 7.5v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ── Main component ─────────────────────────────────────────────────────
export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [modo, setModo]     = useState<Modo>('login');
  const [form, setForm]     = useState({ nome: '', email: '', senha: '', perfil: 'PACIENTE' });
  const [erro, setErro]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
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
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setErro(axiosErr.response?.data?.error || 'Erro ao entrar. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  }

  function trocarModo() {
    setModo(m => m === 'login' ? 'register' : 'login');
    setErro('');
    setForm({ nome: '', email: '', senha: '', perfil: 'PACIENTE' });
    setShowPw(false);
  }

  return (
    <div className="lgn-shell">

      {/* ── Left panel ────────────────────────────────────────────── */}
      <aside
        className="lgn-left"
        style={{ backgroundImage: `url(${loginHero})` }}
      >
        {/* Green gradient overlay */}
        <div className="lgn-overlay" />
        {/* Decorative blobs */}
        <div className="lgn-blob lgn-blob-a" />
        <div className="lgn-blob lgn-blob-b" />
        <div className="lgn-blob lgn-blob-c" />
        {/* Dot grid */}
        <div className="lgn-dots" />

        <div className="lgn-left-content">
          {/* Logo */}
          <div className="lgn-logo">
            <div className="lgn-logo-mark"><HeartIcon /></div>
            <div className="lgn-logo-text">Saúde<span className="lgn-plus">+</span></div>
          </div>

          {/* Hero */}
          <div className="lgn-hero">
            <span className="lgn-eyebrow">
              <span className="lgn-eyebrow-dot" />
              Monitoramento de Saúde
            </span>
            <h1>
              Acompanhe a saúde de{' '}
              <span className="lgn-accent">quem você ama</span>
            </h1>
            <p>
              Monitore glicose, pressão e medicamentos em tempo real. Receba
              alertas inteligentes quando algo precisar de atenção.
            </p>
          </div>

          {/* Feature badges */}
          <div className="lgn-badges">
            {[
              { icon: <PulseIcon />, label: 'Saúde',        sub: 'Glicose · pressão' },
              { icon: <ChartIcon />, label: 'Relatórios',   sub: 'Tendências semanais' },
              { icon: <PillIcon />,  label: 'Medicamentos', sub: 'Lembretes e doses' },
            ].map(b => (
              <div key={b.label} className="lgn-badge">
                <div className="lgn-badge-icon">{b.icon}</div>
                <div className="lgn-badge-label">
                  <span>{b.label}</span>
                  <span className="lgn-badge-sub">{b.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footnote */}
          <div className="lgn-footnote">
            <span>✓ Certificado LGPD</span>
            <span className="lgn-fn-dot" />
            <span>✓ Dados criptografados</span>
            <span className="lgn-fn-dot" />
            <span>Desde 2024</span>
          </div>
        </div>
      </aside>

      {/* ── Right panel ───────────────────────────────────────────── */}
      <main className="lgn-right">
        {/* Top bar */}
        <div className="lgn-right-top">
          <span>{modo === 'login' ? 'Novo por aqui?' : 'Já tem conta?'}</span>
          <button className="lgn-top-link" onClick={trocarModo}>
            {modo === 'login' ? 'Criar conta' : 'Entrar'}
          </button>
        </div>

        {/* Centered form */}
        <div className="lgn-form-wrap">
          <form className="lgn-form" onSubmit={handleSubmit} noValidate>

            <div className="lgn-form-header">
              <h1 className="lgn-form-title">
                {modo === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
              </h1>
              <p className="lgn-form-sub">
                {modo === 'login'
                  ? 'Acesse sua conta'
                  : 'Comece a monitorar a saúde de quem você ama'}
              </p>
            </div>

            {/* Register-only fields */}
            {modo === 'register' && (
              <>
                <div className="lgn-field">
                  <label className="lgn-field-label" htmlFor="nome">Nome completo</label>
                  <div className="lgn-input-wrap">
                    <span className="lgn-input-icon"><UserIcon /></span>
                    <input
                      id="nome"
                      className="lgn-input"
                      placeholder="Seu nome completo"
                      value={form.nome}
                      onChange={e => set('nome', e.target.value)}
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                <div className="lgn-field">
                  <label className="lgn-field-label">Perfil</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[
                      { value: 'PACIENTE', emoji: '👴', label: 'Paciente' },
                      { value: 'CUIDADOR', emoji: '👩‍⚕️', label: 'Cuidador' },
                    ].map(p => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => set('perfil', p.value)}
                        className={`lgn-perfil-btn${form.perfil === p.value ? ' active' : ''}`}
                      >
                        <span style={{ fontSize: 20 }}>{p.emoji}</span>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="lgn-field">
              <div className="lgn-field-label-row">
                <label className="lgn-field-label" htmlFor="email">E-mail</label>
              </div>
              <div className="lgn-input-wrap">
                <span className="lgn-input-icon"><MailIcon /></span>
                <input
                  id="email"
                  type="email"
                  className="lgn-input"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  autoComplete={modo === 'login' ? 'email' : 'off'}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="lgn-field">
              <div className="lgn-field-label-row">
                <label className="lgn-field-label" htmlFor="senha">Senha</label>
              </div>
              <div className="lgn-input-wrap">
                <span className="lgn-input-icon"><LockIcon /></span>
                <input
                  id="senha"
                  type={showPw ? 'text' : 'password'}
                  className="lgn-input"
                  placeholder="••••••••"
                  value={form.senha}
                  onChange={e => set('senha', e.target.value)}
                  autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  className="lgn-input-action"
                  onClick={() => setShowPw(v => !v)}
                  aria-label="Mostrar/ocultar senha"
                >
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Error */}
            {erro && (
              <div className="lgn-error">
                <InfoIcon /> {erro}
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="lgn-btn lgn-btn-primary" disabled={loading}>
              {loading
                ? <><span className="lgn-spinner" /> Aguarde…</>
                : <>{modo === 'login' ? 'Entrar' : 'Criar conta'} <span className="lgn-arrow"><ArrowIcon /></span></>
              }
            </button>

            {/* Divider */}
            <div className="lgn-divider">ou</div>

            {/* Toggle mode */}
            <button type="button" className="lgn-btn lgn-btn-secondary" onClick={trocarModo}>
              {modo === 'login'
                ? <>Criar conta <span className="lgn-arrow"><ArrowIcon /></span></>
                : <>← Já tenho conta — Entrar</>
              }
            </button>

            {/* Footer note (login only) */}
            {modo === 'login' && (
              <div className="lgn-footer-note">
                <div className="lgn-footer-note-icon"><SmileIcon /></div>
                <div>
                  <strong style={{ color: '#0f1b18', fontWeight: 600 }}>É paciente?</strong>{' '}
                  Baixe o app <strong style={{ color: '#0f1b18' }}>Saúde+</strong> na App Store ou Google Play.
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="lgn-legal">
          Ao entrar você concorda com nossos <a href="#">Termos</a> e{' '}
          <a href="#">Política de Privacidade</a>.
        </div>
      </main>
    </div>
  );
}

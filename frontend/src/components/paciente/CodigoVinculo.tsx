import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';

export default function CodigoVinculo() {
  const [codigo, setCodigo] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function gerar() {
    setLoading(true);
    try {
      const res = await api.post('/vinculos/gerar-codigo');
      setCodigo(res.data.codigo);
      setSecondsLeft(600);
      clearTimer();
      timerRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearTimer();
            setCodigo(null);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => () => clearTimer(), []);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const quaseExpirando = secondsLeft > 0 && secondsLeft < 60;

  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>🔗 Código de Vínculo</div>
          <p style={{ color: 'var(--cinza-texto)', fontSize: '14px', margin: 0 }}>
            Gere um código e mostre ao seu cuidador para que ele possa acompanhar sua saúde.
          </p>
        </div>

        {codigo ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{
              fontSize: '48px',
              fontWeight: 800,
              letterSpacing: '10px',
              color: 'var(--verde-escuro)',
              background: 'var(--verde-bg)',
              padding: '24px 36px',
              borderRadius: '16px',
              border: '2px solid var(--verde-claro)',
              fontFamily: 'monospace',
              textAlign: 'center',
            }}>
              {codigo}
            </div>
            <div style={{
              fontSize: '14px',
              color: quaseExpirando ? '#dc2626' : 'var(--cinza-texto)',
              fontWeight: quaseExpirando ? 600 : 400,
            }}>
              {quaseExpirando ? '⚠️' : '⏱️'} Expira em {mm}:{ss}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--cinza-texto)', textAlign: 'center', margin: 0 }}>
              Peça ao seu cuidador para digitar este código nas Configurações do aplicativo dele.
            </p>
            <Button onClick={gerar} loading={loading} variant="secondary" size="sm">
              Gerar novo código
            </Button>
          </div>
        ) : (
          <Button onClick={gerar} loading={loading} variant="primary">
            Gerar código de vínculo
          </Button>
        )}
      </div>
    </Card>
  );
}

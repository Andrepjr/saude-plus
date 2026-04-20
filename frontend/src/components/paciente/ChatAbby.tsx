import { useState, useEffect, useRef } from 'react';
import type { MensagemChat } from '../../types';
import api from '../../services/api';
import Button from '../common/Button';

export default function ChatAbby() {
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/chat/historico').then(res => {
      if (res.data.length === 0) {
        setMensagens([{
          role: 'assistant',
          content: 'Olá! Sou a Abby, sua assistente de saúde 💚 Como você está se sentindo hoje? Pode me contar sua glicose ou pressão arterial.',
        }]);
      } else {
        setMensagens(res.data);
      }
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  async function enviar() {
    if (!input.trim() || loading) return;
    const texto = input.trim();
    setInput('');
    setMensagens(prev => [...prev, { role: 'user', content: texto }]);
    setLoading(true);
    try {
      const res = await api.post('/chat/message', { mensagem: texto });
      setMensagens(prev => [...prev, { role: 'assistant', content: res.data.resposta }]);
    } catch {
      setMensagens(prev => [...prev, { role: 'assistant', content: 'Desculpe, tive um problema. Tente novamente.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '680px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{
        background: 'var(--verde-escuro)',
        padding: '16px 20px',
        borderRadius: '12px 12px 0 0',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'var(--verde-claro)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px',
        }}>🤖</div>
        <div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: '16px' }}>Abby</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Assistente de Saúde</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Online</span>
        </div>
      </div>

      {/* Mensagens */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        background: '#f8fffe',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minHeight: '400px',
        maxHeight: '520px',
      }}>
        {mensagens.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--verde-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', marginRight: '8px', flexShrink: 0, marginTop: '2px',
              }}>🤖</div>
            )}
            <div style={{
              maxWidth: '72%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
              background: msg.role === 'user' ? 'var(--verde-medio)' : '#fff',
              color: msg.role === 'user' ? '#fff' : 'var(--texto-principal)',
              fontSize: '15px',
              lineHeight: '1.5',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              border: msg.role === 'assistant' ? '1px solid var(--cinza-borda)' : 'none',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--verde-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🤖</div>
            <div style={{ padding: '10px 16px', borderRadius: '4px 16px 16px 16px', background: '#fff', border: '1px solid var(--cinza-borda)', color: 'var(--cinza-texto)', fontSize: '20px', letterSpacing: '4px' }}>
              <span>•••</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px',
        background: '#fff',
        borderRadius: '0 0 12px 12px',
        border: '1px solid var(--cinza-borda)',
        borderTop: 'none',
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-end',
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
          placeholder="Digite sua mensagem... (ex: minha glicose está 130)"
          rows={1}
          style={{
            flex: 1,
            border: '1px solid var(--cinza-borda)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '15px',
            resize: 'none',
            outline: 'none',
            maxHeight: '100px',
            overflowY: 'auto',
          }}
        />
        <Button onClick={enviar} loading={loading} disabled={!input.trim()}>
          Enviar
        </Button>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import type { MensagemChat } from '../../types';
import api from '../../services/api';

// ── Web Speech API typing ─────────────────────────────────────────────
interface ISpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void) | null;
  onend:    (() => void) | null;
  onerror:  ((e: { error: string }) => void) | null;
}
function getSpeechRecognition(): (new () => ISpeechRecognition) | null {
  const w = window as Record<string, unknown>;
  return (w['SpeechRecognition'] || w['webkitSpeechRecognition'] || null) as (new () => ISpeechRecognition) | null;
}

// ── SVG icons ─────────────────────────────────────────────────────────
const SendIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <path d="M5 12l14-7-5 14-3-6-6-1z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);
const MicIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <rect x="9" y="3" width="6" height="12" rx="3" fill="currentColor"/>
    <path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const InfoIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 11v5M12 7.5v.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);
const DropIcon = () => (
  <svg width={11} height={11} viewBox="0 0 24 24" fill="none">
    <path d="M12 3c3 4.5 6 8 6 11a6 6 0 01-12 0c0-3 3-6.5 6-11z" fill="currentColor"/>
  </svg>
);
const SpeakerIcon = ({ active }: { active: boolean }) => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/>
    {active
      ? <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      : <path d="M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    }
  </svg>
);

// ── Abby robot avatar SVG ─────────────────────────────────────────────
function AbbyRobot({ size = 52 }: { size?: number }) {
  const s = size * 0.62;
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.15))' }}>
      <circle cx="20" cy="5" r="2" fill="#fff"/>
      <line x1="20" y1="7" x2="20" y2="11" stroke="#fff" strokeWidth="1.8"/>
      <rect x="7" y="11" width="26" height="22" rx="8" fill="#fff" fillOpacity=".95"/>
      <circle cx="15" cy="21" r="2.2" fill="#0d4a3a"/>
      <circle cx="25" cy="21" r="2.2" fill="#0d4a3a"/>
      <circle cx="15.7" cy="20.3" r=".6" fill="#fff"/>
      <circle cx="25.7" cy="20.3" r=".6" fill="#fff"/>
      <path d="M15 26c1.5 1.5 3.2 2.2 5 2.2s3.5-.7 5-2.2" stroke="#0d4a3a" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
      <rect x="4" y="18" width="3" height="6" rx="1.5" fill="#fff" fillOpacity=".7"/>
      <rect x="33" y="18" width="3" height="6" rx="1.5" fill="#fff" fillOpacity=".7"/>
    </svg>
  );
}

function AbbyMiniAvatar() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '10px', flexShrink: 0,
      background: 'linear-gradient(135deg, #22c55e 0%, #0d4a3a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 6px rgba(26,138,106,.3)',
    }}>
      <AbbyRobot size={28} />
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="abby-msg-group" style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '85%', alignSelf: 'flex-start', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <AbbyMiniAvatar />
        <div style={{
          padding: '11px 14px', borderRadius: '16px', borderBottomLeftRadius: '6px',
          background: '#fff', border: '1px solid rgba(13,74,58,.06)',
          boxShadow: '0 1px 2px rgba(13,74,58,.04), 0 2px 8px rgba(13,74,58,.05)',
        }}>
          <div style={{ display: 'flex', gap: 3, alignItems: 'center', padding: '4px 2px' }}>
            <span className="abby-typing-dot" />
            <span className="abby-typing-dot" />
            <span className="abby-typing-dot" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Quick chips ───────────────────────────────────────────────────────
const QUICK_CHIPS = [
  { label: 'Minha glicose',    text: 'Como está minha glicose?' },
  { label: '💊 Remédios de hoje', text: 'Quais meus remédios de hoje?' },
  { label: '❤️ Pressão arterial', text: 'Como está minha pressão arterial?' },
];

// ── Main component ────────────────────────────────────────────────────
export default function ChatAbby() {
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // TTS state
  const [playingText, setPlayingText] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // STT state
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const srSupported = !!getSpeechRecognition();

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Cleanup on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      recognitionRef.current?.abort();
    };
  }, []);

  // ── Load history ────────────────────────────────────────────────────
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
  }, [mensagens, loading]);

  // ── TTS ─────────────────────────────────────────────────────────────
  async function speakText(text: string) {
    // Toggle off if same text is already playing/loading
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playingText === text) {
      setPlayingText(null);
      return;
    }

    setPlayingText(text);
    try {
      const res = await api.post('/tts', { text }, { responseType: 'arraybuffer' });
      const blob = new Blob([res.data], { type: 'audio/mpeg' });
      const url  = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setPlayingText(null);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setPlayingText(null);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      await audio.play().catch(() => {
        // autoplay blocked — user can click the speaker button to replay
        setPlayingText(null);
      });
    } catch {
      setPlayingText(null);
    }
  }

  // ── STT ─────────────────────────────────────────────────────────────
  function toggleMic() {
    if (recording) {
      recognitionRef.current?.stop();
      return;
    }

    const SR = getSpeechRecognition();
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      if (textareaRef.current) {
        textareaRef.current.style.height = '22px';
        textareaRef.current.style.height = Math.min(120, textareaRef.current.scrollHeight) + 'px';
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== 'aborted') console.error('STT error:', e.error);
      setRecording(false);
    };

    recognition.onend = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  // ── Send message ─────────────────────────────────────────────────────
  function nowTime() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  async function enviar(texto?: string) {
    const msg = (texto ?? input).trim();
    if (!msg || loading) return;

    // Stop recording if active
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
    }

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '22px';
    const time = nowTime();
    setMensagens(prev => [...prev, { role: 'user', content: msg, createdAt: time } as MensagemChat]);
    setLoading(true);
    try {
      const res = await api.post('/chat/message', { mensagem: msg });
      const resposta: string = res.data.resposta;
      setMensagens(prev => [...prev, { role: 'assistant', content: resposta, createdAt: nowTime() } as MensagemChat]);
      speakText(resposta); // auto-play Abby's response
    } catch {
      setMensagens(prev => [...prev, { role: 'assistant', content: 'Desculpe, tive um problema. Tente novamente.' } as MensagemChat]);
    } finally {
      setLoading(false);
    }
  }

  function autosize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = '22px';
    e.target.style.height = Math.min(120, e.target.scrollHeight) + 'px';
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8f9fa' }}>
    <div className="abby-inner" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

      {/* ── Abby card ─────────────────────────────────────────────── */}
      <div className="abby-section-pad" style={{ padding: '12px 14px 0', flexShrink: 0 }}>
        <div style={{
          position: 'relative',
          borderRadius: '18px',
          padding: '14px',
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'linear-gradient(135deg, rgba(255,255,255,.97) 0%, rgba(232,247,239,.88) 100%)',
          border: '1px solid rgba(26,138,106,.12)',
          boxShadow: '0 6px 20px rgba(13,74,58,.08), 0 2px 6px rgba(13,74,58,.05)',
        }}>
          {/* Avatar */}
          <div style={{
            width: 52, height: 52, borderRadius: '16px', flexShrink: 0,
            background: 'linear-gradient(135deg, #22c55e 0%, #0d4a3a 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(26,138,106,.35), inset 0 1px 0 rgba(255,255,255,.25)',
          }}>
            <AbbyRobot size={52} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '-.01em', color: '#0a2e25' }}>
                Abby
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '11px', fontWeight: 600, color: '#0a7a49',
                background: 'rgba(34,197,94,.12)',
                border: '1px solid rgba(34,197,94,.25)',
                padding: '3px 8px 3px 7px', borderRadius: '999px',
              }}>
                <span className="abby-online-dot" />
                Online
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#6b7680', marginTop: '2px' }}>
              Assistente de Saúde · responde em segundos
            </div>
          </div>

          {/* Info button */}
          <button
            onClick={() => {}}
            aria-label="Sobre a Abby"
            style={{
              width: 36, height: 36, borderRadius: '12px', flexShrink: 0,
              background: 'rgba(13,74,58,.06)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0d4a3a', transition: 'background .15s ease',
            }}
          >
            <InfoIcon />
          </button>
        </div>
      </div>

      {/* ── Chat messages ─────────────────────────────────────────── */}
      <div
        className="abby-chat abby-section-pad"
        style={{
          flex: 1, minHeight: 0, overflowY: 'auto',
          padding: '16px 14px 12px',
          background: '#f8f9fa',
          display: 'flex', flexDirection: 'column', gap: '14px',
          scrollBehavior: 'smooth',
        }}
      >
        {/* Day separator */}
        <div style={{ alignSelf: 'center' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontSize: '11px', color: '#6b7680', fontWeight: 500,
            padding: '4px 10px',
            background: 'rgba(13,74,58,.04)', borderRadius: '999px',
          }}>
            Hoje · {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {mensagens.map((msg, i) => {
          const isBot = msg.role === 'assistant';
          const prevSameRole = i > 0 && mensagens[i - 1].role === msg.role;
          const time = msg.createdAt ? String(msg.createdAt).slice(11, 16) || String(msg.createdAt) : undefined;
          const isPlaying = playingText === msg.content;

          if (isBot) {
            return (
              <div
                key={i}
                className="abby-msg-group"
                style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '85%', alignSelf: 'flex-start', alignItems: 'flex-start' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  {!prevSameRole
                    ? <AbbyMiniAvatar />
                    : <div style={{ width: 28, flexShrink: 0, visibility: 'hidden' }}/>
                  }
                  <div style={{
                    padding: '11px 14px',
                    background: '#fff', color: '#0f1b18',
                    border: '1px solid rgba(13,74,58,.06)',
                    borderRadius: '16px', borderBottomLeftRadius: '6px',
                    boxShadow: '0 1px 2px rgba(13,74,58,.04), 0 2px 8px rgba(13,74,58,.05)',
                    fontSize: '14.5px', lineHeight: '1.45', letterSpacing: '-.005em',
                    wordWrap: 'break-word', whiteSpace: 'pre-wrap',
                  }}>
                    {msg.content}
                  </div>
                </div>

                {/* Timestamp + speaker button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 36 }}>
                  {time && (
                    <span style={{ fontSize: '10.5px', color: '#6b7680', fontWeight: 500 }}>{time}</span>
                  )}
                  <button
                    className={`abby-speak-btn${isPlaying ? ' playing' : ''}`}
                    onClick={() => speakText(msg.content)}
                    title={isPlaying ? 'Parar' : 'Ouvir'}
                    aria-label={isPlaying ? 'Parar áudio' : 'Ouvir mensagem'}
                  >
                    <SpeakerIcon active={isPlaying} />
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={i}
              className="abby-msg-group"
              style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '85%', alignSelf: 'flex-end', alignItems: 'flex-end' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: 'row-reverse' }}>
                <div style={{
                  padding: '11px 14px',
                  background: 'linear-gradient(135deg, #1a8a6a 0%, #0d4a3a 100%)',
                  color: '#fff',
                  borderRadius: '16px', borderBottomRightRadius: '6px',
                  boxShadow: '0 2px 8px rgba(13,74,58,.2)',
                  fontSize: '14.5px', lineHeight: '1.45', letterSpacing: '-.005em',
                  wordWrap: 'break-word', whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </div>
              </div>
              {time && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '10.5px', color: '#6b7680', fontWeight: 500 }}>
                  <span>{time}</span>
                  <span style={{ color: '#22c55e', fontSize: 11 }}>✓✓</span>
                </div>
              )}
            </div>
          );
        })}

        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ── Input area ────────────────────────────────────────────── */}
      <div className="abby-section-pad" style={{
        flexShrink: 0,
        padding: '10px 12px 10px',
        background: 'linear-gradient(180deg, rgba(248,249,250,0) 0%, #f8f9fa 30%)',
        borderTop: 'none',
      }}>
        {/* Quick chips */}
        <div style={{
          display: 'flex', gap: '6px', marginBottom: '8px',
          overflowX: 'auto', paddingBottom: '2px',
          scrollbarWidth: 'none',
        }}>
          {QUICK_CHIPS.map(c => (
            <button
              key={c.text}
              className="abby-chip"
              onClick={() => enviar(c.text)}
              style={{
                flexShrink: 0,
                fontSize: '12px', fontWeight: 500,
                padding: '6px 10px', borderRadius: '999px',
                background: 'rgba(13,74,58,.05)', color: '#0d4a3a',
                border: '1px solid rgba(13,74,58,.08)',
                cursor: 'pointer', transition: 'all .15s ease',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              {c.label.startsWith('Minha') && <DropIcon />}
              {c.label}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div
          className="abby-input-bar"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#fff',
            border: inputFocused ? '1px solid rgba(34,197,94,.5)' : '1px solid rgba(13,74,58,.08)',
            borderRadius: '22px',
            padding: '6px 6px 6px 14px',
            boxShadow: inputFocused
              ? '0 0 0 4px rgba(34,197,94,.1)'
              : '0 1px 2px rgba(13,74,58,.04), 0 2px 8px rgba(13,74,58,.05)',
            transition: 'border-color .15s ease, box-shadow .15s ease',
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={autosize}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
            placeholder={recording ? 'Ouvindo...' : 'Digite sua mensagem...'}
            rows={1}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: '14.5px', color: '#0f1b18',
              padding: '8px 0', resize: 'none', lineHeight: '1.4',
              maxHeight: '120px', minHeight: '22px',
              fontFamily: "'Inter', sans-serif",
            }}
          />

          {/* Mic button */}
          <button
            className={`abby-mic-btn${recording ? ' recording' : ''}`}
            onClick={toggleMic}
            aria-label={recording ? 'Parar gravação' : 'Gravar áudio'}
            title={!srSupported ? 'Microfone não suportado neste navegador' : recording ? 'Parar' : 'Falar'}
            disabled={!srSupported}
            style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              border: 'none', cursor: srSupported ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: recording ? '#fee2e2' : 'rgba(13,74,58,.06)',
              color: recording ? '#dc2626' : '#0d4a3a',
              transition: 'background .15s ease, color .15s ease',
              opacity: srSupported ? 1 : 0.4,
            }}
          >
            <MicIcon />
          </button>

          {/* Send button */}
          <button
            className="abby-send-btn"
            onClick={() => enviar()}
            disabled={!input.trim() || loading}
            aria-label="Enviar"
            style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              border: 'none', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #22c55e 0%, #1a8a6a 100%)',
              color: '#fff',
              boxShadow: !input.trim() || loading ? 'none' : '0 2px 8px rgba(26,138,106,.35)',
              opacity: !input.trim() || loading ? 0.35 : 1,
              transition: 'opacity .15s ease, transform .1s ease',
            }}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}

import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--texto-principal)' }}>
          {label}
        </label>
      )}
      <input
        style={{
          padding: '10px 14px',
          borderRadius: '8px',
          border: `1px solid ${error ? 'var(--alerta-critico)' : 'var(--cinza-borda)'}`,
          fontSize: '15px',
          outline: 'none',
          transition: 'border-color 0.2s',
          background: '#fff',
          ...style,
        }}
        {...props}
      />
      {error && <span style={{ fontSize: '13px', color: 'var(--alerta-critico)' }}>{error}</span>}
    </div>
  );
}

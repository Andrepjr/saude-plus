import { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  title?: string;
}

export default function Card({ children, style, title }: CardProps) {
  return (
    <div
      style={{
        background: 'var(--cinza-card)',
        borderRadius: '12px',
        border: '1px solid var(--cinza-borda)',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        ...style,
      }}
    >
      {title && (
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--cinza-texto)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

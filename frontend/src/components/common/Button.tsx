import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

const styles: Record<string, string> = {
  base: `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s;
    cursor: pointer;
  `,
};

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--verde-medio)', color: '#fff' },
    secondary: { background: 'var(--verde-bg)', color: 'var(--verde-escuro)', border: '1px solid var(--verde-claro)' },
    danger: { background: '#fee2e2', color: '#dc2626' },
    ghost: { background: 'transparent', color: 'var(--cinza-texto)' },
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: '13px' },
    md: { padding: '10px 20px', fontSize: '15px' },
    lg: { padding: '14px 28px', fontSize: '16px' },
  };

  return (
    <button
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 500,
        transition: 'all 0.2s',
        opacity: disabled || loading ? 0.6 : 1,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {loading ? '...' : children}
    </button>
  );
}

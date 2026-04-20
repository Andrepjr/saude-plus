interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--texto-principal)' }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ fontSize: '14px', color: 'var(--cinza-texto)', marginTop: '4px' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

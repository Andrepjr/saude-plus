import { useAuth } from '../../contexts/AuthContext';
import Card from '../common/Card';
import Button from '../common/Button';
import Header from '../layout/Header';

export default function Configuracoes() {
  const { user, logout } = useAuth();

  return (
    <div>
      <Header title="Configurações" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
        <Card title="Conta">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--cinza-texto)' }}>Nome</div>
              <div style={{ fontWeight: 500 }}>{user?.nome}</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--cinza-texto)' }}>E-mail</div>
              <div style={{ fontWeight: 500 }}>{user?.email}</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--cinza-texto)' }}>Perfil</div>
              <div style={{ fontWeight: 500 }}>{user?.perfil}</div>
            </div>
          </div>
        </Card>
        <Card title="Sessão">
          <Button onClick={logout} variant="danger">Sair da conta</Button>
        </Card>
      </div>
    </div>
  );
}

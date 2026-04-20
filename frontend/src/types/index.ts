export type Perfil = 'PACIENTE' | 'CUIDADOR';

export interface User {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

export type StatusSaude = 'NORMAL' | 'ALTA' | 'BAIXA' | 'CRITICA';
export type TipoSaude = 'GLICOSE' | 'PRESSAO';

export interface RegistroSaude {
  id: number;
  tipo: TipoSaude;
  valor: string;
  dataHora: string;
  status: StatusSaude;
  fonte: 'CHAT' | 'MANUAL';
}

export interface Medicamento {
  id: number;
  nome: string;
  dosagem?: string;
  horarios: string[];
  ativo: boolean;
}

export interface MedicamentoStatus extends Medicamento {
  tomado: boolean;
  horarioPrevisto?: string;
  dataHora?: string;
}

export interface MensagemChat {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export interface Alerta {
  tipo: 'GLICOSE' | 'PRESSAO' | 'MEDICAMENTO';
  mensagem: string;
  dataHora: string;
  severidade: 'CRITICA' | 'ALTA' | 'MEDIA' | 'NORMAL';
}

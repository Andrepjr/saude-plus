import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, AuthState } from '../types';
import api from '../services/api';

interface AuthContextType extends AuthState {
  login: (email: string, senha: string) => Promise<void>;
  register: (nome: string, email: string, senha: string, perfil: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('saude_token');
    const savedUser = localStorage.getItem('saude_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  async function login(email: string, senha: string) {
    const res = await api.post('/auth/login', { email, senha });
    const { token: t, user: u } = res.data;
    localStorage.setItem('saude_token', t);
    localStorage.setItem('saude_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  }

  async function register(nome: string, email: string, senha: string, perfil: string) {
    const res = await api.post('/auth/register', { nome, email, senha, perfil });
    const { token: t, user: u } = res.data;
    localStorage.setItem('saude_token', t);
    localStorage.setItem('saude_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  }

  function logout() {
    localStorage.removeItem('saude_token');
    localStorage.removeItem('saude_user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

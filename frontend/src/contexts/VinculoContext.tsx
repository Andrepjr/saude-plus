import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { PacienteVinculado } from '../types';
import api from '../services/api';

interface VinculoContextType {
  pacientes: PacienteVinculado[];
  pacienteSelecionado: PacienteVinculado | null;
  carregando: boolean;
  setPacienteSelecionado: (p: PacienteVinculado | null) => void;
  recarregar: () => Promise<void>;
}

const VinculoContext = createContext<VinculoContextType | null>(null);

export function VinculoProvider({ children }: { children: ReactNode }) {
  const [pacientes, setPacientes] = useState<PacienteVinculado[]>([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<PacienteVinculado | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    try {
      const res = await api.get('/vinculos/pacientes');
      const lista: PacienteVinculado[] = res.data;
      setPacientes(lista);
      // Mantém seleção atual se o paciente ainda existir; senão seleciona o primeiro
      setPacienteSelecionado(prev => {
        if (prev && lista.find(p => p.id === prev.id)) return prev;
        return lista[0] ?? null;
      });
    } catch {
      // silently fail — auth error handled by interceptor
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  return (
    <VinculoContext.Provider value={{ pacientes, pacienteSelecionado, carregando, setPacienteSelecionado, recarregar: carregar }}>
      {children}
    </VinculoContext.Provider>
  );
}

export function useVinculo() {
  const ctx = useContext(VinculoContext);
  if (!ctx) throw new Error('useVinculo deve ser usado dentro de VinculoProvider');
  return ctx;
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { USUARIOS_MOCK, SECRETARIAS_MOCK } from '@/services/mockData';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const [selectedUserId, setSelectedUserId] = useState(USUARIOS_MOCK[0].idUsuario);

  // Redirección si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async () => {
    try {
      await login(selectedUserId);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error al ingresar:', error);
    }
  };

  const selectedUser = USUARIOS_MOCK.find(u => u.idUsuario === selectedUserId);
  const selectedSecretaria = SECRETARIAS_MOCK.find(s => s.idSecretaria === selectedUser?.idSecretaria);

  return (
    <div className="min-h-screen bg-gov-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-300">
        
        {/* CABECERA */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-gov-blue-100 rounded-full flex items-center justify-center text-gov-blue-700 shadow-inner">
            <Building2 size={40} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gov-gray-900">Alcaldía de Medellín</h1>
            <p className="text-[10px] text-gov-gray-500 uppercase font-black tracking-widest mt-1">
              Distrito de Ciencia, Tecnología e Innovación
            </p>
          </div>
          
          <div className="w-full h-px bg-gov-gray-100 mt-2" />
          
          <h2 className="text-lg font-semibold text-gov-gray-900 flex items-center gap-2">
            <ShieldCheck size={20} className="text-gov-blue-600" />
            Acceso al Sistema CRM PQRSD
          </h2>
        </div>

        {/* INPUTS / SELECTOR */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="user-select" className="text-xs font-bold text-gov-gray-500 uppercase tracking-tight">
              Seleccionar funcionario de prueba
            </label>
            <select
              id="user-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-gov-gray-50 border border-gov-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gov-gray-900 focus:ring-2 focus:ring-gov-blue-500 outline-none transition-all"
            >
              {USUARIOS_MOCK.map((u) => (
                <option key={u.idUsuario} value={u.idUsuario}>
                  {u.nombreCompleto} — {u.cargo}
                </option>
              ))}
            </select>
            
            {/* BADGE DE SECRETARÍA DINÁMICO */}
            {selectedSecretaria && (
              <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-gov-gray-50 border border-gov-gray-100 rounded-lg">
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: selectedSecretaria.colorIdentificador }}
                />
                <span className="text-[11px] font-bold text-gov-gray-700 uppercase">
                  {selectedSecretaria.nombre}
                </span>
              </div>
            )}
          </div>

          <div className="bg-gov-gold-100/50 border border-gov-gold-500/20 rounded-xl p-3 flex gap-3">
            <AlertTriangle size={24} className="text-gov-gold-500 shrink-0" />
            <p className="text-[10px] text-gov-gray-700 font-medium leading-tight">
              <span className="font-bold text-gov-gray-900 uppercase block mb-1">Modo Piloto</span>
              Las credenciales reales se integrarán con el Directorio Activo (AD) de la Alcaldía en la fase de producción.
            </p>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-gov-blue-700 hover:bg-gov-blue-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-gov-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Validando identidad...
              </>
            ) : (
              'Ingresar al Sistema'
            )}
          </button>
        </div>

        {/* PIE DE PÁGINA */}
        <div className="pt-4 border-t border-gov-gray-100 text-center space-y-1">
          <p className="text-[10px] text-gov-gray-500 font-medium">
            Desarrollado para Medellín Distrito Especial por el equipo OmegaHack 2026
          </p>
          <p className="text-[10px] text-gov-gray-700 font-black uppercase tracking-tighter">
            Secretaría de Desarrollo Económico
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Loader2, ShieldCheck, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithCredentials, isAuthenticated, isLoading, loginError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Redirección si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !password.trim()) {
      setLocalError('Por favor completa todos los campos');
      return;
    }

    try {
      await loginWithCredentials(email, password);
      router.push('/dashboard');
    } catch {
      // El error ya lo maneja el store (loginError)
    }
  };

  const displayError = localError || loginError;

  return (
    <div className="min-h-screen bg-gov-blue-900 flex items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #001E4E 0%, #003DA5 50%, #0057B8 100%)' }}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md space-y-6 animate-in fade-in zoom-in duration-300">
        
        {/* CABECERA */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 bg-gov-blue-100 rounded-full flex items-center justify-center text-gov-blue-700 shadow-inner">
            <Building2 size={32} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gov-gray-900">Alcaldía de Medellín</h1>
            <p className="text-[9px] text-gov-gray-500 uppercase font-black tracking-widest mt-0.5">
              Distrito de Ciencia, Tecnología e Innovación
            </p>
          </div>
          
          <div className="w-full h-px bg-gov-gray-100" />
          
          <h2 className="text-base font-semibold text-gov-gray-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-gov-blue-600" />
            Acceso al Sistema CRM PQRSD
          </h2>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="text-[10px] font-bold text-gov-gray-500 uppercase tracking-tight">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gov-gray-400" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@correo.com"
                autoComplete="email"
                className="w-full bg-gov-gray-50 border border-gov-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-gov-gray-900 focus:ring-2 focus:ring-gov-blue-500 outline-none transition-all placeholder:text-gov-gray-400"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="login-password" className="text-[10px] font-bold text-gov-gray-500 uppercase tracking-tight">
              Contraseña
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gov-gray-400" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-gov-gray-50 border border-gov-gray-200 rounded-xl pl-10 pr-12 py-3 text-sm font-medium text-gov-gray-900 focus:ring-2 focus:ring-gov-blue-500 outline-none transition-all placeholder:text-gov-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gov-gray-400 hover:text-gov-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* ERROR */}
          {displayError && (
            <div className="bg-sem-red-bg border border-sem-red/20 rounded-lg p-3 text-xs font-bold text-sem-red animate-in fade-in slide-in-from-top-1 duration-200">
              {displayError}
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gov-blue-700 hover:bg-gov-blue-900 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-gov-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Validando identidad...
              </>
            ) : (
              'Ingresar al Sistema'
            )}
          </button>
        </form>

        {/* CREDENCIALES DE PRUEBA */}
        <div className="bg-gov-gray-50 rounded-xl p-4 space-y-2 border border-gov-gray-100">
          <p className="text-[10px] font-black text-gov-gray-500 uppercase tracking-wider">Cuentas de prueba</p>
          <div className="space-y-1.5 text-[11px] text-gov-gray-600">
            <div className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-gov-gray-100">
              <div>
                <span className="font-bold text-gov-gray-900">Modo Demo (Mock):</span>
                <br />test@rr.com / test1234
              </div>
              <span className="text-[9px] bg-gov-gold-100 text-gov-gold-600 px-2 py-0.5 rounded-full font-bold uppercase">Demo</span>
            </div>
            <div className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-gov-blue-100">
              <div>
                <span className="font-bold text-gov-gray-900">Modo Producción (DuckDB):</span>
                <br />Admin con credenciales reales
              </div>
              <span className="text-[9px] bg-gov-blue-100 text-gov-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">Live</span>
            </div>
          </div>
        </div>

        {/* PIE DE PÁGINA */}
        <div className="pt-2 border-t border-gov-gray-100 text-center space-y-0.5">
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

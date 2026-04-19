'use client';

import { useState } from 'react';
import { useEmailSender } from '@/hooks/useEmailSender';
import { useAuthStore } from '@/store/authStore';
import { generarNumeroRadicado } from '@/lib/radicado';
import { addBusinessDays, formatISO } from 'date-fns';
import {
  Mail, Send, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import type { TipoSolicitud, ConfirmacionEmailPayload } from '@/types';

export default function NuevoTicketSimulator() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState<TipoSolicitud>('Peticion');
  const [resultado, setResultado] = useState<{ radicado: string; simulado: boolean } | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const { enviarConfirmacion, isSendingConfirmacion, error: apiError, limpiarError } = useEmailSender();

  async function handleSimular() {
    setLocalError(null);
    limpiarError();

    // 1. Validaciones básicas de UI
    if (!nombre.trim()) {
      setLocalError('El nombre es obligatorio');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('Formato de email inválido');
      return;
    }
    
    // 2. Obtener datos del usuario autenticado
    const usuario = useAuthStore.getState().usuario;
    if (!usuario) {
      setLocalError('No hay sesión activa para realizar la simulación');
      return;
    }
    
    // 3. Generar radicado y fecha límite
    const radicado = generarNumeroRadicado(usuario.idSecretaria);
    const fechaLimite = formatISO(addBusinessDays(new Date(), 15));
    
    // 4. Construir payload
    const payload: ConfirmacionEmailPayload = {
      idTicket: `TKT-DEMO-${Date.now()}`,
      numeroRadicado: radicado,
      emailCiudadano: email.trim(),
      nombreCiudadano: nombre.trim(),
      tipoSolicitud: tipo,
      secretariaNombre: usuario.secretariaNombre,
      fechaLimiteRespuesta: fechaLimite,
    };
    
    // 5. Enviar
    const result = await enviarConfirmacion(payload);
    
    // 6. Mostrar resultado
    if (result?.success) {
      setResultado({ radicado, simulado: result.simulado });
      // Limpiar formulario para próxima demo
      setNombre('');
      setEmail('');
    }
  }

  return (
    <div className="w-full">
      {/* CABECERA (Toggle) */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer
          bg-gradient-to-r from-[#003DA5] via-[#0057B8] to-[#00A3E0]
          hover:opacity-90 transition-opacity select-none ${isExpanded ? 'rounded-b-none' : ''}`}
      >
        <div className="flex items-center gap-2">
          <Mail className="text-white w-4 h-4" />
          <span className="text-white font-semibold text-sm">Simular Ingreso de Ticket</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">DEMO</span>
          {isExpanded ? <ChevronUp className="text-white/70 w-4 h-4" /> : <ChevronDown className="text-white/70 w-4 h-4" />}
        </div>
      </div>

      {/* CUERPO */}
      {isExpanded && (
        <div className="border border-[#0057B8]/20 border-t-0 rounded-b-xl bg-[#F4F6F9]/50 dark:bg-dark-surface/80 p-4 space-y-3 shadow-inner">
          {/* Aviso informativo */}
          <div className="bg-[#FDF3D0] dark:bg-dark-accent/10 border border-[#D4A017]/30 dark:border-dark-cyan/20 rounded-lg p-2 flex gap-2 items-start">
            <span className="text-xs">⚙️</span>
            <p className="text-xs text-[#3D4A5C] dark:text-dark-muted">
              Panel exclusivo para demos. En producción los tickets ingresan automáticamente desde el backend FastAPI + DuckDB.
            </p>
          </div>

          {/* Formulario */}
          <div className="space-y-3">
            <div>
              <input 
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Pedro Antonio Restrepo García"
                className="w-full text-sm border border-[#E8ECF2] dark:border-dark-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0057B8] bg-white dark:bg-dark-surface dark:text-white shadow-sm"
              />
            </div>
            <div>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ciudadano@gmail.com"
                className="w-full text-sm border border-[#E8ECF2] dark:border-dark-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0057B8] bg-white dark:bg-dark-surface dark:text-white shadow-sm"
              />
            </div>
            <div>
              <select 
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoSolicitud)}
                className="w-full text-sm border border-[#E8ECF2] dark:border-dark-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0057B8] bg-white dark:bg-dark-surface dark:text-white shadow-sm"
              >
                <option value="Peticion" className="dark:bg-dark-surface">Petición</option>
                <option value="Queja" className="dark:bg-dark-surface">Queja</option>
                <option value="Reclamo" className="dark:bg-dark-surface">Reclamo</option>
                <option value="Sugerencia" className="dark:bg-dark-surface">Sugerencia</option>
                <option value="Denuncia" className="dark:bg-dark-surface">Denuncia</option>
              </select>
            </div>

            {/* Resultado o Errores */}
            {(localError || apiError) && (
              <div className="bg-[#FEF2F2] dark:bg-red-900/10 border border-[#DC2626]/30 dark:border-red-900/20 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="text-[#DC2626] dark:text-sem-red w-4 h-4" />
                <p className="text-xs text-[#DC2626] dark:text-sem-red font-medium">{localError || apiError}</p>
              </div>
            )}

            {resultado && (
              <div className="bg-[#ECFDF5] dark:bg-green-900/10 border border-[#00875A]/30 dark:border-green-900/20 rounded-xl p-3 space-y-2 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-[#00875A] dark:text-sem-green w-5 h-5" />
                  <span className="text-sm font-semibold text-[#00875A] dark:text-sem-green">Ticket registrado exitosamente</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-mono bg-[#001E4E] text-[#00A3E0] px-3 py-1 rounded-lg text-xs border border-white/10">
                    {resultado.radicado}
                  </div>
                  {resultado.simulado ? (
                    <span className="text-[#D4A017] text-[10px] font-bold">✉️ EMAIL SIMULADO</span>
                  ) : (
                    <span className="text-[#00875A] text-[10px] font-bold">✉️ EMAIL ENVIADO</span>
                  )}
                </div>
                {!resultado.simulado && (
                  <p className="text-[10px] text-[#00875A] dark:text-sem-green/80">Se ha enviado una notificación de radicado a la bandeja del ciudadano.</p>
                )}
              </div>
            )}

            {/* Botón */}
            <button
              onClick={handleSimular}
              disabled={isSendingConfirmacion || !nombre.trim() || !email.trim()}
              className={`w-full bg-[#003DA5] hover:bg-[#001E4E] text-white text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none`}
            >
              {isSendingConfirmacion ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Registrar y Enviar Confirmación</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

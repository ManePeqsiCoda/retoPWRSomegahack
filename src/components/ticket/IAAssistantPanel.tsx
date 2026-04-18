'use client';

import { useState } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  X, 
  Loader2, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { useIAAssistant } from '@/hooks/useIAAssistant';
import { Ticket } from '@/types';
import { cn } from '@/lib/utils';

interface IAAssistantPanelProps {
  ticket: Ticket;
  onRespuestaGenerada: (texto: string) => void;
  iaHabilitada: boolean;
}

export default function IAAssistantPanel({
  ticket,
  onRespuestaGenerada,
  iaHabilitada
}: IAAssistantPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    instruccion,
    setInstruccion,
    isGenerating,
    textoEnStream,
    error,
    tokensUsados,
    regenerar,
    cancelar,
    sugerenciasRapidas
  } = useIAAssistant({ ticket, onRespuestaGenerada });

  return (
    <div className="w-full transition-all duration-300">
      {/* CABECERA (Trigger) */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center justify-between p-3 cursor-pointer transition-all shadow-sm",
          isExpanded 
            ? "bg-gradient-to-r from-gov-blue-900 via-gov-blue-800 to-gov-blue-700 rounded-t-xl" 
            : "bg-gradient-to-r from-gov-blue-900 to-gov-blue-800 rounded-xl hover:scale-[1.01] active:scale-[0.99]"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-1.5 rounded-lg">
            <Sparkles size={16} className={cn("text-gov-cyan-400", isGenerating && "animate-pulse")} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-bold text-white tracking-wide">Asistente IA · GovTech Co-pilot</span>
            <span className="text-[9px] bg-gov-cyan-400/20 text-gov-cyan-300 px-2 py-0.5 rounded-full border border-gov-cyan-400/30 uppercase font-black tracking-tighter">
              Powered by OpenRouter
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {isGenerating && <Loader2 size={16} className="text-gov-cyan-400 animate-spin" />}
          {isExpanded ? (
            <ChevronUp size={18} className="text-white/60" />
          ) : (
            <ChevronDown size={18} className="text-white/60" />
          )}
        </div>
      </div>

      {/* CUERPO DEL PANEL */}
      {isExpanded && (
        <div className="border border-gov-blue-700/30 border-t-0 rounded-b-xl bg-white p-5 space-y-5 animate-in slide-in-from-top-2 duration-200">
          
          {!iaHabilitada ? (
            <div className="bg-gov-gold-100/50 border border-gov-gold-500/20 rounded-xl p-4 flex gap-3">
              <Info size={20} className="text-gov-gold-500 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-gov-gray-900 uppercase">Configuración requerida</p>
                <p className="text-xs text-gov-gray-700 leading-normal">
                  Asistente IA no configurado. Asegúrate de añadir <code className="bg-gov-gold-200/50 px-1 rounded text-gov-gold-700">OPENROUTER_API_KEY</code> al archivo .env.local para desbloquear esta función.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* 1. SUGERENCIAS RÁPIDAS */}
              <div>
                <p className="text-[10px] font-bold text-gov-gray-400 uppercase tracking-widest mb-3">Acciones rápidas e institucionales:</p>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-gov-gray-200 scrollbar-track-transparent">
                  {sugerenciasRapidas.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInstruccion(sug.instruccion)}
                      className="flex-shrink-0 text-[11px] font-bold px-3 py-2 rounded-lg border border-gov-blue-100 text-gov-gray-600 hover:bg-gov-blue-50 hover:border-gov-blue-500 hover:text-gov-blue-700 transition-all bg-white shadow-sm"
                    >
                      {sug.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. INPUT DE INSTRUCCIÓN */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gov-gray-400 uppercase tracking-widest">O escribe una instrucción personalizada:</p>
                <textarea
                  rows={3}
                  value={instruccion}
                  onChange={(e) => setInstruccion(e.target.value)}
                  className="w-full text-sm border border-gov-gray-200 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-gov-blue-500 bg-gov-gray-50/30 shadow-inner placeholder:text-gov-gray-400 leading-relaxed"
                  placeholder="Ej: Hazla más formal. Menciona la Ley 1755. Sé más amable en el cierre..."
                />
              </div>

              {/* 3. BARRA DE ACCIONES */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-[10px] font-bold text-gov-gray-400 uppercase tracking-tighter">
                  {instruccion.length} caracteres de instrucción
                </div>
                
                <div className="flex gap-2">
                  {isGenerating ? (
                    <button
                      onClick={cancelar}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-sem-red border border-sem-red/20 hover:bg-sem-red-bg transition-colors"
                    >
                      <X size={14} />
                      Cancelar
                    </button>
                  ) : null}

                  <button
                    onClick={regenerar}
                    disabled={isGenerating || instruccion.trim().length < 5}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-gov-blue-700/10",
                      (isGenerating || instruccion.trim().length < 5)
                        ? "bg-gov-gray-200 text-gov-gray-400 cursor-not-allowed shadow-none"
                        : "bg-gov-blue-700 text-white hover:bg-gov-blue-900"
                    )}
                  >
                    <Zap size={14} className={cn(!isGenerating && instruccion.trim().length >= 5 && "text-gov-cyan-400")} />
                    Generar con IA
                  </button>
                </div>
              </div>

              {/* 4. ÁREA DE STREAMING */}
              {isGenerating && (
                <div className="mt-4 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-gov-blue-600 uppercase tracking-widest flex items-center gap-2">
                      <span className="flex w-1.5 h-1.5 bg-gov-blue-500 rounded-full animate-ping" />
                      Procesando con Llama 3...
                    </span>
                    <span className="text-[10px] font-mono text-gov-gray-400 uppercase tracking-tighter">
                      Est: {tokensUsados} tokens
                    </span>
                  </div>
                  <div className="bg-gov-blue-50/50 border border-gov-blue-200 rounded-xl p-4 max-h-60 overflow-y-auto shadow-inner bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                    <p className="text-sm text-gov-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                      {textoEnStream}
                      <span className="inline-block w-2.5 h-4 bg-gov-blue-700 ml-1 animate-pulse align-middle" />
                    </p>
                  </div>
                </div>
              )}

              {/* 5. MENSAJE POST-GENERACIÓN */}
              {error && (
                <div className="mt-2 bg-sem-red-bg border border-sem-red/20 text-sem-red text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2">
                  <X size={14} />
                  {error}
                </div>
              )}

              {!isGenerating && textoEnStream && !error && (
                <div className="mt-2 bg-sem-green-bg border border-sem-green/20 text-sem-green text-[11px] font-bold px-4 py-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-left duration-500 shadow-sm">
                  <CheckCircle2 size={16} />
                  <div className="flex flex-col">
                    <span>¡Respuesta generada exitosamente!</span>
                    <span className="font-medium opacity-80">El texto ha sido plasmado en el editor oficial para tu revisión final.</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* KEYFRAMES ADICIONALES */}
      <style jsx global>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-cursor-blink {
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </div>
  );
}

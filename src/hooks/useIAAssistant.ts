'use client';

import { useState, useCallback, useRef } from 'react';
import { Ticket } from '@/types';
import { useAuthStore } from '@/store/authStore';

interface UseIAAssistantProps {
  ticket: Ticket;
  onRespuestaGenerada: (texto: string) => void;
}

export interface SugerenciaRapida {
  label: string;
  instruccion: string;
}

const SUGERENCIAS: SugerenciaRapida[] = [
  { label: '📝 Más formal',     instruccion: 'Reescribe el borrador con un tono más formal e institucional' },
  { label: '✂️ Más conciso',    instruccion: 'Mantén la misma información pero reduce el texto a la mitad' },
  { label: '💡 Con normativa',  instruccion: 'Añade referencias a la normativa colombiana aplicable (Ley 1755 de 2015)' },
  { label: '🔄 Desde cero',     instruccion: 'Genera una respuesta completamente nueva basada solo en la solicitud del ciudadano' },
  { label: '🤝 Más empático',   instruccion: 'Reescribe con un tono más empático y cercano al ciudadano, sin perder la formalidad' },
];

/**
 * Hook useIAAssistant
 * Gestiona la interacción con la API de Regeneración de IA mediante Streaming.
 */
export function useIAAssistant({ ticket, onRespuestaGenerada }: UseIAAssistantProps) {
  const [instruccion, setInstruccion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [textoEnStream, setTextoEnStream] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tokensUsados, setTokensUsados] = useState(0);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const { usuario } = useAuthStore(); // Usamos 'usuario' según nuestra implementación real del store

  const cancelar = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    // Si ya teníamos algo de texto, lo guardamos como la respuesta actual al cancelar
    if (textoEnStream) {
      onRespuestaGenerada(textoEnStream);
    }
  }, [textoEnStream, onRespuestaGenerada]);

  const regenerar = useCallback(async () => {
    if (!instruccion.trim()) return;

    setIsGenerating(true);
    setTextoEnStream('');
    setError(null);
    setTokensUsados(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/ia/regenerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contenidoRaw: ticket.contenidoRaw,
          resumenIa: ticket.resumenIa,
          respuestaActual: ticket.respuestaSugerida ?? '',
          instruccionFuncionario: instruccion,
          secretariaNombre: usuario?.secretariaNombre || 'Alcaldía de Medellín',
          tipoSolicitud: ticket.tipoSolicitud,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error al conectar con el servidor de IA');
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let textoAcumulado = '';

      if (!reader) throw new Error('No se pudo inicializar el lector de datos de la IA');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              onRespuestaGenerada(textoAcumulado);
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                textoAcumulado += parsed.text;
                setTextoEnStream(textoAcumulado);
                // Estimación aproximada para el dashboard de tokens
                setTokensUsados(Math.ceil(textoAcumulado.length / 4));
              }
              if (parsed.error) throw new Error(parsed.error);
            } catch {
              // Los fallos de parseo de micro-chunks se ignoran para no romper la UX del stream
            }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Generación de IA cancelada por el funcionario.');
      } else {
        const message = err instanceof Error ? err.message : 'Error desconocido en el servicio de IA';
        setError(message);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [instruccion, ticket, usuario, onRespuestaGenerada]);

  return {
    instruccion,
    setInstruccion,
    isGenerating,
    textoEnStream,
    error,
    tokensUsados,
    regenerar,
    cancelar,
    sugerenciasRapidas: SUGERENCIAS,
  };
}

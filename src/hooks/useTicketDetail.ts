import { useState, useEffect, useCallback, useRef } from 'react';
import { useIdSecretariaActivo, useAuthStore } from '@/store/authStore';
import { getTicketById, actualizarRespuesta } from '@/services/ticketService';
import { enriquecerTicketConUrgencia } from '@/lib/urgency';
import { TicketConUrgencia } from '@/types';
import { SECRETARIAS_MOCK } from '@/services/mockData';

interface UseTicketDetailReturn {
  ticket: TicketConUrgencia | null;
  isLoading: boolean;
  error: string | null;
  respuestaActual: string;
  isSubmitting: boolean;
  submitSuccess: boolean;
  hasUnsavedChanges: boolean;
  resumenCargando: boolean;
  resumenError: string | null;

  setRespuestaActual: (texto: string) => void;
  submitRespuesta: () => Promise<void>;
  resetRespuesta: () => void;
}

export function useTicketDetail(idTicket: string): UseTicketDetailReturn {
  const [ticket, setTicket] = useState<TicketConUrgencia | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [respuestaActual, setRespuestaActual] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [resumenCargando, setResumenCargando] = useState(false);
  const [resumenError, setResumenError] = useState<string | null>(null);

  const idSecretariaActivo = useIdSecretariaActivo();
  const usuario = useAuthStore((s) => s.usuario);
  const iaHabilitada = process.env.NEXT_PUBLIC_IA_HABILITADA === 'true';
  const resumenFetchGen = useRef(0);

  // 1. Carga inicial del ticket
  useEffect(() => {
    async function loadTicket() {
      if (!idTicket || !idSecretariaActivo) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await getTicketById(idTicket, idSecretariaActivo);

        if (response.error) {
          if (response.error === 'ACCESO_DENEGADO') {
            setError('No tienes permisos para ver este ticket');
          } else if (response.error === 'NOT_FOUND') {
            setError('El ticket solicitado no existe');
          } else {
            setError(response.error);
          }
          setTicket(null);
        } else if (response.data) {
          const enriched = enriquecerTicketConUrgencia(response.data);
          setTicket(enriched);
          // Inicializa respuesta con la sugerencia de la IA
          setRespuestaActual(enriched.respuestaSugerida ?? '');
        }
      } catch {
        setError('Error inesperado al cargar el ticket');
      } finally {
        setIsLoading(false);
      }
    }

    loadTicket();
  }, [idTicket, idSecretariaActivo]);

  // Resumen ejecutivo GovTech vía gateway (mismo criterio que el panel IA)
  useEffect(() => {
    if (!ticket || !iaHabilitada || !usuario) {
      setResumenCargando(false);
      setResumenError(null);
      return;
    }

    const gen = ++resumenFetchGen.current;
    const ac = new AbortController();

    setResumenCargando(true);
    setResumenError(null);

    const secretariaNombre =
      SECRETARIAS_MOCK.find((s) => s.idSecretaria === ticket.idSecretaria)?.nombre ||
      'Alcaldía de Medellín';

    (async () => {
      try {
        const res = await fetch('/api/ia/resumen-ejecutivo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: ac.signal,
          body: JSON.stringify({
            contenidoRaw: ticket.contenidoRaw,
            tipoSolicitud: ticket.tipoSolicitud,
            secretariaNombre,
            idTicket: ticket.idTicket,
            duckclawUserId: usuario.idUsuario ?? '',
            duckclawUsername: usuario.nombreCompleto ?? 'Usuario',
          }),
        });

        const data = (await res.json()) as { error?: string; detail?: string; text?: string };

        if (gen !== resumenFetchGen.current) return;

        if (!res.ok) {
          setResumenError(data.detail || data.error || `Error ${res.status}`);
          return;
        }

        const t = (data.text ?? '').trim();
        if (t) {
          setTicket((curr) => (curr ? { ...curr, resumenIa: t } : null));
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        if (gen !== resumenFetchGen.current) return;
        setResumenError(e instanceof Error ? e.message : 'Error al generar resumen');
      } finally {
        if (gen === resumenFetchGen.current) {
          setResumenCargando(false);
        }
      }
    })();

    return () => {
      ac.abort();
    };
    // Solo campos fuente del ticket — no incluir `resumenIa` ni el objeto `ticket` completo para no re-disparar al fusionar el resumen del gateway.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ticket/usuario coherentes con esta lista primitiva en cada ejecución
  }, [
    ticket?.idTicket,
    ticket?.contenidoRaw,
    ticket?.tipoSolicitud,
    ticket?.idSecretaria,
    iaHabilitada,
    usuario?.idUsuario,
    usuario?.nombreCompleto,
  ]);

  // 2. Acción de enviar respuesta
  const submitRespuesta = async () => {
    if (!ticket || !idSecretariaActivo) return;

    setError(null);

    // Validaciones de negocio
    const trimmedRespuesta = respuestaActual.trim();
    if (trimmedRespuesta.length === 0) {
      setError('La respuesta no puede estar vacía');
      return;
    }

    if (trimmedRespuesta.length < 50) {
      setError('La respuesta debe tener al menos 50 caracteres para ser válida');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await actualizarRespuesta(idTicket, trimmedRespuesta, idSecretariaActivo);

      if (response.error) {
        setError(response.error);
      } else {
        setSubmitSuccess(true);
        // Resetear estado de cambios guardados (asumiendo que el "original" ahora es lo enviado)
        // En una app real, actualizaríamos el objeto ticket localmente
        setTicket(curr => curr ? { ...curr, respuestaSugerida: trimmedRespuesta } : null);
        
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 3000);
      }
    } catch {
      setError('Error al procesar el envío de la respuesta');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Resetear cambios
  const resetRespuesta = useCallback(() => {
    if (ticket) {
      setRespuestaActual(ticket.respuestaSugerida ?? '');
    }
  }, [ticket]);

  // 4. Detección de cambios sin guardar
  const hasUnsavedChanges = respuestaActual !== (ticket?.respuestaSugerida ?? '');

  return {
    ticket,
    isLoading,
    error,
    respuestaActual,
    isSubmitting,
    submitSuccess,
    hasUnsavedChanges,
    resumenCargando,
    resumenError,
    setRespuestaActual,
    submitRespuesta,
    resetRespuesta,
  };
}

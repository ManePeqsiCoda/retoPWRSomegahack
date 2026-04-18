import { useState, useEffect, useCallback } from 'react';
import { useIdSecretariaActivo } from '@/store/authStore';
import { getTicketById, actualizarRespuesta } from '@/services/ticketService';
import { enriquecerTicketConUrgencia } from '@/lib/urgency';
import { TicketConUrgencia } from '@/types';

interface UseTicketDetailReturn {
  ticket: TicketConUrgencia | null;
  isLoading: boolean;
  error: string | null;
  respuestaActual: string;
  isSubmitting: boolean;
  submitSuccess: boolean;
  hasUnsavedChanges: boolean;
  
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

  const idSecretariaActivo = useIdSecretariaActivo();

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
    setRespuestaActual,
    submitRespuesta,
    resetRespuesta,
  };
}

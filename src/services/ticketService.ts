import { 
  TICKETS_MOCK, 
  SECRETARIAS_MOCK, 
  DELAY_SIMULADO_MS 
} from './mockData';
import { 
  Ticket, 
  TicketsFilter, 
  ApiResponse, 
  Secretaria,
  TicketEstado 
} from '@/types';

/**
 * REGLA DE NEGOCIO CRÍTICA (RBAC):
 * Solo retorna tickets cuyo idSecretaria === idSecretariaUsuario.
 */
export async function getTicketsBySecretaria(
  idSecretariaUsuario: string,
  filters?: TicketsFilter
): Promise<ApiResponse<Ticket[]>> {
  try {
    // ----------------------------------------------------------------------
    // HANDOVER AL BACKEND:
    // Elimina este bloque mockeado e implementa el llamado fetch al Gateway
    // Ejemplo de endpoint esperado:
    // GET /api/tickets?idSecretaria={idSecretariaUsuario}&estado={estado}...
    // ----------------------------------------------------------------------
    await new Promise(resolve => setTimeout(resolve, DELAY_SIMULADO_MS));

    let tickets = TICKETS_MOCK.filter(t => t.idSecretaria === idSecretariaUsuario);

    if (filters) {
      if (filters.estado && filters.estado !== 'Todos') {
        tickets = tickets.filter(t => t.estado === filters.estado);
      }
      if (filters.tipoSolicitud && filters.tipoSolicitud !== 'Todos') {
        tickets = tickets.filter(t => t.tipoSolicitud === filters.tipoSolicitud);
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        tickets = tickets.filter(t => 
          t.nombreCiudadano.toLowerCase().includes(query) || 
          t.contenidoRaw.toLowerCase().includes(query)
        );
      }
    }

    return {
      data: tickets,
      total: tickets.length,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      data: [],
      total: 0,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Obtiene el detalle de un ticket específico validando el acceso.
 */
export async function getTicketById(
  idTicket: string,
  idSecretariaUsuario: string
): Promise<ApiResponse<Ticket | null>> {
  try {
    // ----------------------------------------------------------------------
    // HANDOVER AL BACKEND:
    // Sustituye todo este bloque por un llamado fetch real
    // Ejemplo: GET /api/tickets/{idTicket}?idSecretariaUsuario={idSecretariaUsuario}
    // IMPORTANTE: El backend DEBE asegurar que ese ticket corresponde a esa secretaría.
    // Si no, retornar 403 o { error: 'ACCESO_DENEGADO' }
    // ----------------------------------------------------------------------
    await new Promise(resolve => setTimeout(resolve, DELAY_SIMULADO_MS));
    
    const ticket = TICKETS_MOCK.find(t => t.idTicket === idTicket);

    if (!ticket) {
      return { data: null, total: 0, timestamp: new Date().toISOString(), error: 'NOT_FOUND' };
    }

    // REGLA DE SEGURIDAD (RBAC): Prevenir acceso a tickets de otras secretarías
    if (ticket.idSecretaria !== idSecretariaUsuario) {
      return { 
        data: null, 
        total: 0, 
        timestamp: new Date().toISOString(), 
        error: 'ACCESO_DENEGADO' 
      };
    }

    return { data: ticket, total: 1, timestamp: new Date().toISOString() };

  } catch (error) {
    return {
      data: null,
      total: 0,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Error en el servidor'
    };
  }
}

/**
 * Envía la respuesta oficial a una solicitud PQRSD.
 */
export async function actualizarRespuesta(
  idTicket: string,
  respuestaFinal: string,
  idSecretariaUsuario: string
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    // ----------------------------------------------------------------------
    // HANDOVER AL BACKEND:
    // Reemplazar este mock por una mutación en base de datos.
    // Ejemplo:
    // PUT /api/tickets/{idTicket}/responder
    // Body: { respuestaFinal, idSecretariaUsuario }
    // En BD: SET respuesta_sugerida = respuestaFinal, estado = 'Resuelto'
    // ----------------------------------------------------------------------
    await new Promise(resolve => setTimeout(resolve, DELAY_SIMULADO_MS));
    
    const ticket = TICKETS_MOCK.find(t => t.idTicket === idTicket);
    if (!ticket || ticket.idSecretaria !== idSecretariaUsuario) {
      throw new Error('No tienes permisos para responder este ticket');
    }

    return { 
      data: { success: true }, 
      total: 1, 
      timestamp: new Date().toISOString() 
    };

  } catch (error) {
    return {
      data: { success: false },
      total: 0,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Error al procesar respuesta'
    };
  }
}

/**
 * Obtiene el catálogo de secretarías del Distrito.
 */
export async function getSecretarias(): Promise<ApiResponse<Secretaria[]>> {
  try {
    // ----------------------------------------------------------------------
    // HANDOVER AL BACKEND:
    // Conectar catálogo real desde tabla "secretarias"
    // GET /api/secretarias -> [{ idSecretaria, nombre, colorIdentificador }]
    // ----------------------------------------------------------------------
    await new Promise(resolve => setTimeout(resolve, DELAY_SIMULADO_MS));
    return {
      data: SECRETARIAS_MOCK,
      total: SECRETARIAS_MOCK.length,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      data: [],
      total: 0,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Error de conexión'
    };
  }
}

/**
 * Actualiza el estado de un ticket (PATCH simulado).
 * En producción, esto enviaría un PUT/PATCH /api/tickets/{id} al backend.
 */
export async function actualizarEstadoTicket(idTicket: string, nuevoEstado: TicketEstado): Promise<void> {
  // Simular latencia de red
  await new Promise(resolve => setTimeout(resolve, 300));

  const ticketIndex = TICKETS_MOCK.findIndex(t => t.idTicket === idTicket);
  if (ticketIndex !== -1) {
    TICKETS_MOCK[ticketIndex].estado = nuevoEstado;
    console.log(`[MockDB] Ticket ${idTicket} actualizado a ${nuevoEstado}`);
  } else {
    throw new Error('Ticket no encontrado');
  }
}


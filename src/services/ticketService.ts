import {
  TICKETS_MOCK,
  SECRETARIAS_MOCK,
  DELAY_SIMULADO_MS,
} from './mockData';
import {
  Ticket,
  TicketsFilter,
  ApiResponse,
  Secretaria,
  TicketEstado,
} from '@/types';
import { DataMode } from '@/store/authStore';

// ──────────────────────────────────────────────────
// CAPA LIVE: llamadas a los API Routes internos
// ──────────────────────────────────────────────────

async function liveGetTickets(
  idSecretaria: string,
  filters?: TicketsFilter
): Promise<ApiResponse<Ticket[]>> {
  const params = new URLSearchParams();
  params.set('idSecretaria', idSecretaria);
  if (filters?.estado && filters.estado !== 'Todos') params.set('estado', filters.estado);
  if (filters?.tipoSolicitud && filters.tipoSolicitud !== 'Todos') params.set('tipo', filters.tipoSolicitud);
  if (filters?.searchQuery) params.set('search', filters.searchQuery);

  const res = await fetch(`/api/tickets?${params.toString()}`);
  const json = await res.json();

  if (!res.ok) {
    return { data: [], total: 0, timestamp: new Date().toISOString(), error: json.error || 'Error de red' };
  }

  return json;
}

async function liveGetTicketById(
  idTicket: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _idSecretaria: string
): Promise<ApiResponse<Ticket | null>> {
  const res = await fetch(`/api/tickets/${idTicket}`);
  const json = await res.json();

  if (!res.ok) {
    return {
      data: null,
      total: 0,
      timestamp: new Date().toISOString(),
      error: json.error || 'NOT_FOUND',
    };
  }

  return json;
}

async function liveActualizarRespuesta(
  idTicket: string,
  respuestaFinal: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _idSecretaria: string
): Promise<ApiResponse<{ success: boolean }>> {
  const res = await fetch(`/api/tickets/${idTicket}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      respuestaSugerida: respuestaFinal,
      estado: 'Resuelto',
    }),
  });

  const json = await res.json();
  return {
    data: { success: res.ok },
    total: res.ok ? 1 : 0,
    timestamp: new Date().toISOString(),
    error: res.ok ? undefined : json.error,
  };
}

async function liveActualizarEstado(
  idTicket: string,
  nuevoEstado: TicketEstado
): Promise<void> {
  const res = await fetch(`/api/tickets/${idTicket}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado: nuevoEstado }),
  });

  if (!res.ok) throw new Error('Error al actualizar estado');
}

// ──────────────────────────────────────────────────
// CAPA MOCK: datos locales (original)
// ──────────────────────────────────────────────────

async function mockGetTickets(
  idSecretaria: string,
  filters?: TicketsFilter
): Promise<ApiResponse<Ticket[]>> {
  await new Promise(resolve => setTimeout(resolve, DELAY_SIMULADO_MS));

  let tickets = TICKETS_MOCK.filter(t => t.idSecretaria === idSecretaria);

  if (filters) {
    if (filters.estado && filters.estado !== 'Todos') {
      tickets = tickets.filter(t => t.estado === filters.estado);
    }
    if (filters.tipoSolicitud && filters.tipoSolicitud !== 'Todos') {
      tickets = tickets.filter(t => t.tipoSolicitud === filters.tipoSolicitud);
    }
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      tickets = tickets.filter(
        t =>
          t.nombreCiudadano.toLowerCase().includes(q) ||
          t.contenidoRaw.toLowerCase().includes(q)
      );
    }
  }

  return { data: tickets, total: tickets.length, timestamp: new Date().toISOString() };
}

async function mockGetTicketById(
  idTicket: string,
  idSecretaria: string
): Promise<ApiResponse<Ticket | null>> {
  await new Promise(resolve => setTimeout(resolve, DELAY_SIMULADO_MS));

  const ticket = TICKETS_MOCK.find(t => t.idTicket === idTicket);
  if (!ticket) {
    return { data: null, total: 0, timestamp: new Date().toISOString(), error: 'NOT_FOUND' };
  }
  if (ticket.idSecretaria !== idSecretaria) {
    return { data: null, total: 0, timestamp: new Date().toISOString(), error: 'ACCESO_DENEGADO' };
  }
  return { data: ticket, total: 1, timestamp: new Date().toISOString() };
}

async function mockActualizarRespuesta(
  idTicket: string,
  respuestaFinal: string,
  idSecretaria: string
): Promise<ApiResponse<{ success: boolean }>> {
  await new Promise(resolve => setTimeout(resolve, DELAY_SIMULADO_MS));

  const ticket = TICKETS_MOCK.find(t => t.idTicket === idTicket);
  if (!ticket || ticket.idSecretaria !== idSecretaria) {
    throw new Error('No tienes permisos para responder este ticket');
  }

  return { data: { success: true }, total: 1, timestamp: new Date().toISOString() };
}

async function mockActualizarEstado(idTicket: string, nuevoEstado: TicketEstado): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const idx = TICKETS_MOCK.findIndex(t => t.idTicket === idTicket);
  if (idx !== -1) {
    TICKETS_MOCK[idx].estado = nuevoEstado;
  } else {
    throw new Error('Ticket no encontrado');
  }
}

// ──────────────────────────────────────────────────
// FUNCIONES PÚBLICAS — Despachan según DataMode
// ──────────────────────────────────────────────────

let _currentDataMode: DataMode = 'mock';

/** Configura el modo de datos para las próximas llamadas al servicio. */
export function setServiceDataMode(mode: DataMode) {
  _currentDataMode = mode;
}

export async function getTicketsBySecretaria(
  idSecretaria: string,
  filters?: TicketsFilter
): Promise<ApiResponse<Ticket[]>> {
  return _currentDataMode === 'live'
    ? liveGetTickets(idSecretaria, filters)
    : mockGetTickets(idSecretaria, filters);
}

export async function getTicketById(
  idTicket: string,
  idSecretaria: string
): Promise<ApiResponse<Ticket | null>> {
  return _currentDataMode === 'live'
    ? liveGetTicketById(idTicket, idSecretaria)
    : mockGetTicketById(idTicket, idSecretaria);
}

export async function actualizarRespuesta(
  idTicket: string,
  respuestaFinal: string,
  idSecretaria: string
): Promise<ApiResponse<{ success: boolean }>> {
  return _currentDataMode === 'live'
    ? liveActualizarRespuesta(idTicket, respuestaFinal, idSecretaria)
    : mockActualizarRespuesta(idTicket, respuestaFinal, idSecretaria);
}

export async function getSecretarias(): Promise<ApiResponse<Secretaria[]>> {
  // Secretarías always from mock (static catalog)
  return {
    data: SECRETARIAS_MOCK,
    total: SECRETARIAS_MOCK.length,
    timestamp: new Date().toISOString(),
  };
}

export async function actualizarEstadoTicket(
  idTicket: string,
  nuevoEstado: TicketEstado
): Promise<void> {
  return _currentDataMode === 'live'
    ? liveActualizarEstado(idTicket, nuevoEstado)
    : mockActualizarEstado(idTicket, nuevoEstado);
}

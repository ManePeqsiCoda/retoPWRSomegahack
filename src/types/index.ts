/** 
 * TIPOS DE UNIÓN Y ENUMERACIONES (The Lexicon)
 */

/** Estados posibles de un ticket PQRSD según la normativa colombiana */
export type TicketEstado = 'Pendiente' | 'En_Revision' | 'Resuelto';

/** Tipos de solicitud PQRSD */
export type TipoSolicitud = 'Peticion' | 'Queja' | 'Reclamo' | 'Sugerencia' | 'Denuncia';

/** Canal de ingreso del PQRSD */
export type CanalOrigen = 'WhatsApp' | 'Email' | 'Twitter' | 'Facebook' | 'Presencial' | 'Web';

/** Nivel de urgencia calculado por el frontend (NO viene del backend) */
export type NivelUrgencia = 'seguro' | 'atencion' | 'critico';


/** 
 * INTERFACE PRINCIPAL: Ticket
 * 
 * Mapeo del esquema DuckDB (snake_case) a camelCase para el frontend.
 * DB fields: id_ticket, tipo_solicitud, id_secretaria, fecha_creacion, 
 *            fecha_limite, estado, contenido_raw, resumen_ia, respuesta_sugerida,
 *            canal_origen, nombre_ciudadano
 */
export interface Ticket {
  /** Identificador único del ticket. PK en DuckDB (UUID or String) */
  idTicket: string;
  
  /** Categoría de la solicitud según normatividad */
  tipoSolicitud: TipoSolicitud;
  
  /** FK a la tabla secretarias en DuckDB */
  idSecretaria: string;
  
  /** ISO 8601 string. Viene de DuckDB como TIMESTAMP */
  fechaCreacion: string;
  
  /** ISO 8601 string. Deadline legal: fechaCreacion + 15 días hábiles */
  fechaLimite: string;
  
  /** Estado actual en el ciclo de vida del PQRSD */
  estado: TicketEstado;
  
  /** Texto raw tal como llegó del canal de origen (WhatsApp, email, etc.) */
  contenidoRaw: string;
  
  /** Resumen generado por IA del backend (es null si el procesamiento está pendiente) */
  resumenIa: string | null;
  
  /** Borrador de respuesta sugerido por la IA del backend según precedentes */
  respuestaSugerida: string | null;
  
  /** Plataforma por la cual se capturó el PQRSD */
  canalOrigen: CanalOrigen;
  
  /** Nombre del remitente o ciudadano que interpone la solicitud */
  nombreCiudadano: string;
}


/**
 * Ticket enriquecido por el frontend con campos calculados.
 * NUNCA se persiste en el backend. Es solo para la UI.
 */
export interface TicketConUrgencia extends Ticket {
  /** Días hábiles restantes calculados por el frontend utilizando date-fns */
  diasRestantes: number;
  
  /** Clasificación visual de urgencia según los días restantes */
  nivelUrgencia: NivelUrgencia;
}


/** 
 * INTERFACE: Secretaria
 * Definición de las dependencias administrativas del Distrito.
 */
export interface Secretaria {
  idSecretaria: string;
  nombre: string;
  /** Color HEX institucional para identificar visualmente la secretaría en la UI */
  colorIdentificador: string;
}


/** 
 * INTERFACE: Usuario (Funcionario Público)
 * Representa al usuario autenticado en la plataforma.
 */
export interface Usuario {
  idUsuario: string;
  nombreCompleto: string;
  cargo: string;
  /** FK a secretarias. Define el scope de datos que el usuario puede ver (RBAC) */
  idSecretaria: string;
  secretariaNombre: string;
  /** Rol del usuario para permisos adicionales */
  rol: 'admin' | 'funcionario';
  /** Iniciales para el avatar (ej: "CA" para "Carlos Arturo") */
  initials: string;
}


/**
 * INTERFACES DE API (The Communication Contract)
 */

/** Estructura estándar de respuesta para servicios de datos */
export interface ApiResponse<T> {
  data: T;
  total: number;
  /** Timestamp de la respuesta en formato ISO 8601 */
  timestamp: string;
  /** Mensaje de error descriptivo en caso de falla */
  error?: string;
}


/** Estructura para la gestión de filtros en la bandeja de entrada */
export interface TicketsFilter {
  estado?: TicketEstado | 'Todos';
  tipoSolicitud?: TipoSolicitud | 'Todos';
  nivelUrgencia?: NivelUrgencia | 'Todos';
  searchQuery?: string;
}

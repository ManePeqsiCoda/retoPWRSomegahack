/**
 * DDL pqrsd_crm (alineado con db/pqrsd_crm_schema.sql y la spec).
 * Una sentencia por elemento: el db-writer ejecuta una query por mensaje en cola.
 */
export const PQRS_CRM_DDL_STATEMENTS: readonly string[] = [
  'CREATE SCHEMA IF NOT EXISTS pqrsd_crm;',
  `CREATE TABLE IF NOT EXISTS pqrsd_crm.tickets (
  id_ticket VARCHAR PRIMARY KEY,
  tipo_solicitud VARCHAR NOT NULL,
  id_secretaria VARCHAR NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL,
  fecha_limite TIMESTAMP NOT NULL,
  estado VARCHAR NOT NULL,
  contenido_raw VARCHAR NOT NULL,
  resumen_ia VARCHAR,
  respuesta_sugerida VARCHAR,
  canal_origen VARCHAR NOT NULL,
  nombre_ciudadano VARCHAR NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);`,
  'CREATE INDEX IF NOT EXISTS idx_pqrsd_crm_tickets_sec_est ON pqrsd_crm.tickets (id_secretaria, estado);',
];

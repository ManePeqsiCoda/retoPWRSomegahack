-- CRM GovTech PQRSD — esquema en la misma bóveda que PQRSD-Assistant (spec: specs/features/CRM PQRSD persistencia DuckDB.md)
CREATE SCHEMA IF NOT EXISTS pqrsd_crm;

CREATE TABLE IF NOT EXISTS pqrsd_crm.tickets (
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
);

CREATE INDEX IF NOT EXISTS idx_pqrsd_crm_tickets_sec_est
  ON pqrsd_crm.tickets (id_secretaria, estado);

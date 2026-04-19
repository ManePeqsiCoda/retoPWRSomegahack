-- CRM GovTech PQRSD — misma bóveda que PQRSD-Assistant (DUCKCLAW_PQRSD_ASSISTANT_DB_PATH)
CREATE SCHEMA IF NOT EXISTS pqrsd_crm;

CREATE TABLE IF NOT EXISTS pqrsd_crm.tickets (
  id_ticket VARCHAR PRIMARY KEY,
  numero_radicado VARCHAR NOT NULL,
  id_secretaria VARCHAR NOT NULL DEFAULT 'sec-salud',
  nombre_ciudadano VARCHAR NOT NULL DEFAULT 'Ciudadano Anónimo',
  documento_ciudadano VARCHAR,
  email_ciudadano VARCHAR,
  telefono_ciudadano VARCHAR,
  tipo_solicitud VARCHAR NOT NULL DEFAULT 'Peticion',
  asunto VARCHAR DEFAULT 'Solicitud PQRSD',
  contenido_raw TEXT NOT NULL,
  resumen_ia TEXT,
  respuesta_sugerida TEXT,
  estado VARCHAR NOT NULL DEFAULT 'Pendiente',
  canal_origen VARCHAR NOT NULL DEFAULT 'Email',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_limite TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pqrsd_crm_tickets_sec_est
  ON pqrsd_crm.tickets (id_secretaria, estado);

CREATE TABLE IF NOT EXISTS pqrsd_crm.secretarias (
  id_secretaria VARCHAR PRIMARY KEY,
  nombre VARCHAR NOT NULL,
  color_identificador VARCHAR NOT NULL DEFAULT '#0057B8'
);

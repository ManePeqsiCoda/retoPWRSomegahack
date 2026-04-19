import { Pool } from 'pg';

/**
 * MotherDuck PostgreSQL Wire Protocol Client
 * 
 * En Vercel serverless, NO podemos usar el binario nativo de DuckDB.
 * MotherDuck expone un endpoint PostgreSQL compatible que funciona
 * con cualquier driver `pg` estándar — ideal para serverless.
 * 
 * Endpoint: pg.us-east-1-aws.motherduck.com:5432
 * Auth: token de acceso como password
 */

const MOTHERDUCK_PG_HOST = 'pg.us-east-1-aws.motherduck.com';
const MOTHERDUCK_PG_PORT = 5432;

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;

  const token = process.env.MOTHERDUCK_TOKEN;
  const database = process.env.MOTHERDUCK_DB || 'crm-pqrsd';

  if (!token) {
    throw new Error(
      '[MotherDuck] MOTHERDUCK_TOKEN no está configurado. ' +
      'Agrega esta variable de entorno en .env.local y en Vercel Dashboard.'
    );
  }

  pool = new Pool({
    host: MOTHERDUCK_PG_HOST,
    port: MOTHERDUCK_PG_PORT,
    database: database,
    user: 'motherduck',
    password: token,
    ssl: { rejectUnauthorized: true },
    max: 3,                    // Pool pequeño para serverless
    idleTimeoutMillis: 10000,  // Cerrar conexiones inactivas rápido
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('[MotherDuck] Error inesperado en pool:', err);
    pool = null;
  });

  return pool;
}

/**
 * Ejecuta una query SQL contra MotherDuck.
 * Retorna las filas directamente.
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const p = getPool();
  const result = await p.query(sql, params);
  return result.rows as unknown as T[];
}

/**
 * Ejecuta una query que retorna una sola fila (o null).
 */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/**
 * Ejecuta una query de mutación (INSERT, UPDATE, DELETE).
 * Retorna el número de filas afectadas.
 */
export async function execute(
  sql: string,
  params?: unknown[]
): Promise<number> {
  const p = getPool();
  const result = await p.query(sql, params);
  return result.rowCount ?? 0;
}

/**
 * Inicializa el schema de la base de datos.
 * Se ejecuta una sola vez al primer request del API.
 */
let schemaInitialized = false;

export async function ensureSchema(): Promise<void> {
  if (schemaInitialized) return;

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id_ticket         VARCHAR PRIMARY KEY,
        numero_radicado   VARCHAR NOT NULL,
        id_secretaria     VARCHAR NOT NULL DEFAULT 'sec-salud',
        nombre_ciudadano  VARCHAR NOT NULL DEFAULT 'Ciudadano Anónimo',
        documento_ciudadano VARCHAR,
        email_ciudadano   VARCHAR,
        telefono_ciudadano VARCHAR,
        tipo_solicitud    VARCHAR NOT NULL DEFAULT 'Peticion',
        asunto            VARCHAR DEFAULT 'Solicitud PQRSD',
        contenido_raw     TEXT NOT NULL,
        resumen_ia        TEXT,
        respuesta_sugerida TEXT,
        estado            VARCHAR NOT NULL DEFAULT 'Pendiente',
        canal_origen      VARCHAR NOT NULL DEFAULT 'Email',
        fecha_creacion    TIMESTAMP DEFAULT now(),
        fecha_limite      TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT now()
      )
    `);

    // Evolución de Schema: Añadir columnas si el tabla ya existía
    try {
      // DuckDB no tiene "ADD COLUMN IF NOT EXISTS" nativo en un solo paso estable
      // Intentamos añadirlas; si ya existen, DuckDB fallará y capturamos el error
      await query('ALTER TABLE tickets ADD COLUMN documento_ciudadano VARCHAR');
      console.log('[MotherDuck] ✅ Columna documento_ciudadano añadida');
    } catch (e) {
      // Ignorar si la columna ya existe
    }

    try {
      await query('ALTER TABLE tickets ADD COLUMN telefono_ciudadano VARCHAR');
      console.log('[MotherDuck] ✅ Columna telefono_ciudadano añadida');
    } catch (e) {
      // Ignorar si la columna ya existe
    }

    await query(`
      CREATE TABLE IF NOT EXISTS secretarias (
        id_secretaria       VARCHAR PRIMARY KEY,
        nombre              VARCHAR NOT NULL,
        color_identificador VARCHAR NOT NULL DEFAULT '#0057B8'
      )
    `);

    // Insertar secretarías si no existen
    const existingSecretarias = await query('SELECT COUNT(*) as cnt FROM secretarias');
    const count = Number((existingSecretarias[0] as Record<string, unknown>)?.cnt ?? 0);
    
    if (count === 0) {
      await query(`
        INSERT INTO secretarias (id_secretaria, nombre, color_identificador) VALUES
          ('sec-salud',      'Secretaría de Salud',                '#0057B8'),
          ('sec-educacion',  'Secretaría de Educación',            '#00875A'),
          ('sec-movilidad',  'Secretaría de Movilidad',            '#D97706'),
          ('sec-cultura',    'Secretaría de Cultura',              '#7C3AED'),
          ('sec-desarrollo', 'Secretaría de Desarrollo Económico', '#DC2626')
      `);
      console.log('[MotherDuck] ✅ Secretarías insertadas');
    }

    schemaInitialized = true;
    console.log('[MotherDuck] ✅ Schema verificado/creado correctamente');
  } catch (err) {
    console.error('[MotherDuck] ❌ Error al crear schema:', err);
    throw err;
  }
}

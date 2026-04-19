import { NextRequest, NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/motherduck';
import { mapRowToTicket } from '@/lib/ticketMapper';

/**
 * GET /api/tickets — Lista todos los tickets.
 * Soporta filtros por query params: estado, tipo, search, idSecretaria
 */
export async function GET(req: NextRequest) {
  try {
    await ensureSchema();

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');
    const search = searchParams.get('search');
    const idSecretaria = searchParams.get('idSecretaria');

    let sql = 'SELECT * FROM tickets WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (idSecretaria && idSecretaria !== 'all') {
      sql += ` AND id_secretaria = $${paramIndex++}`;
      params.push(idSecretaria);
    }
    if (estado && estado !== 'Todos') {
      sql += ` AND estado = $${paramIndex++}`;
      params.push(estado);
    }
    if (tipo && tipo !== 'Todos') {
      sql += ` AND tipo_solicitud = $${paramIndex++}`;
      params.push(tipo);
    }
    if (search) {
      sql += ` AND (LOWER(nombre_ciudadano) LIKE $${paramIndex} OR LOWER(contenido_raw) LIKE $${paramIndex})`;
      params.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }

    sql += ' ORDER BY fecha_creacion DESC';

    const rows = await query(sql, params);

    // Mapear snake_case → camelCase para el frontend
    const tickets = rows.map(mapRowToTicket);

    return NextResponse.json({
      data: tickets,
      total: tickets.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API /tickets GET]', error);
    return NextResponse.json(
      { data: [], total: 0, timestamp: new Date().toISOString(), error: 'Error al consultar tickets' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickets — Crea un nuevo ticket.
 */
export async function POST(req: NextRequest) {
  try {
    await ensureSchema();

    const body = await req.json();
    const {
      idTicket,
      numeroRadicado,
      idSecretaria = 'sec-salud',
      nombreCiudadano = 'Ciudadano Anónimo',
      emailCiudadano = null,
      tipoSolicitud = 'Peticion',
      asunto = 'Solicitud PQRSD',
      contenidoRaw,
      resumenIa = null,
      respuestaSugerida = null,
      estado = 'Pendiente',
      canalOrigen = 'Email',
      fechaCreacion,
      fechaLimite,
    } = body;

    if (!contenidoRaw || !idTicket || !numeroRadicado) {
      return NextResponse.json(
        { error: 'Campos obligatorios: idTicket, numeroRadicado, contenidoRaw' },
        { status: 400 }
      );
    }

    const now = fechaCreacion || new Date().toISOString();
    const limit = fechaLimite || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

    await query(
      `INSERT INTO tickets (
        id_ticket, numero_radicado, id_secretaria, nombre_ciudadano,
        email_ciudadano, tipo_solicitud, asunto, contenido_raw,
        resumen_ia, respuesta_sugerida, estado, canal_origen,
        fecha_creacion, fecha_limite, fecha_actualizacion
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,now())`,
      [
        idTicket, numeroRadicado, idSecretaria, nombreCiudadano,
        emailCiudadano, tipoSolicitud, asunto, contenidoRaw,
        resumenIa, respuestaSugerida, estado, canalOrigen,
        now, limit,
      ]
    );

    return NextResponse.json({
      data: { idTicket, numeroRadicado },
      total: 1,
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('[API /tickets POST]', error);
    return NextResponse.json(
      { error: 'Error al crear ticket', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}


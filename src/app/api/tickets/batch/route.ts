import { NextRequest, NextResponse } from 'next/server';
import { query, ensureSchema } from '@/lib/motherduck';
import { generarNumeroRadicado } from '@/lib/radicado';
import { sendConfirmationEmail } from '@/services/emailService';

interface ManualTicketInput {
  idSecretaria?: string;
  nombreCiudadano?: string;
  emailCiudadano?: string;
  telefono?: string;
  tipoSolicitud?: string;
  asunto?: string;
  contenidoRaw: string;
}

export async function POST(req: NextRequest) {
  try {
    const { tickets }: { tickets: ManualTicketInput[] } = await req.json();

    if (!Array.isArray(tickets) || tickets.length === 0) {
      return NextResponse.json({ error: 'Se requiere un array de tickets' }, { status: 400 });
    }

    await ensureSchema();

    const results = [];

    for (const t of tickets) {
      // Generar metadatos para cada ticket
      const idTicket = `tk-manual-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const numeroRadicado = generarNumeroRadicado(t.idSecretaria || 'sec-salud');
      const fechaCreacion = new Date().toISOString();
      const fechaLimite = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
      const nombreCiudadano = t.nombreCiudadano?.trim() || 'Ciudadano Anónimo';

      await query(
        `INSERT INTO tickets (
          id_ticket, numero_radicado, id_secretaria, nombre_ciudadano,
          email_ciudadano, telefono_ciudadano, tipo_solicitud, asunto, contenido_raw,
          estado, canal_origen, fecha_creacion, fecha_limite
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          idTicket,
          numeroRadicado,
          t.idSecretaria || 'sec-salud',
          nombreCiudadano,
          t.emailCiudadano?.trim() || null,
          t.telefono?.trim() || null,
          t.tipoSolicitud || 'Peticion',
          t.asunto || 'Radicación Manual (Físico)',
          t.contenidoRaw,
          'Pendiente',
          'Presencial',
          fechaCreacion,
          fechaLimite
        ]
      );
      
      // 3. Enviar correo de confirmación si el ciudadano proporcionó email
      const emailCiudadano = t.emailCiudadano?.trim();
      if (emailCiudadano && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCiudadano)) {
        try {
          await sendConfirmationEmail(
            emailCiudadano,
            numeroRadicado,
            nombreCiudadano,
            t.contenidoRaw,
            idTicket
          );
          console.log(`[Batch-Email] ✅ Confirmación enviada a ${emailCiudadano}`);
        } catch (mailErr) {
          console.error(`[Batch-Email] ❌ Fallo al enviar a ${emailCiudadano}:`, mailErr);
        }
      }
      
      results.push({ idTicket, numeroRadicado });
    }

    console.log(`[Batch-Insert] ✅ ${results.length} tickets manuales creados`);

    return NextResponse.json({ 
      success: true, 
      created: results.length, 
      data: results 
    });

  } catch (error) {
    console.error('[Batch-Insert-Error]', error);
    return NextResponse.json({ 
      error: 'Error al procesar el lote de tickets',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}

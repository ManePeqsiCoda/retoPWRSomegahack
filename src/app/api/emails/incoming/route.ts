import { NextRequest, NextResponse } from 'next/server';
import { generarNumeroRadicado } from '@/lib/radicado';
import { analyzeAndSelectTemplate } from '@/services/iaTemplateService';
import { sendConfirmationEmail } from '@/services/emailService';
import { TICKETS_MOCK } from '@/services/mockData';
import { Ticket } from '@/types';

/**
 * API ENDPOINT: Ingesta de Correos Electrónicos
 * Simula el webhook que recibiría un CRM de un proveedor de email (ej. SendGrid, Mailgun, AWS SES).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { remitente, nombre, asunto, cuerpo } = body;

    if (!remitente || !cuerpo) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (remitente, cuerpo)' }, { status: 400 });
    }

    // 1. ASIGNACIÓN DE SECRETARÍA (Simulada para la demo)
    // En producción, esto se haría basado en el destinatario (ej. salud@medellin.gov.co)
    const idSecretaria = 'sec-salud'; 

    // 2. GENERACIÓN DE RADICADO ÚNICO
    const numeroRadicado = generarNumeroRadicado(idSecretaria);
    const idTicket = `tk-${Date.now()}`;

    // 3. CLASIFICACIÓN POR IA GovTech
    // Seleccionamos la mejor plantilla basada en el contenido
    const { plantilla, score, esBasura } = await analyzeAndSelectTemplate(cuerpo, asunto || '');
    
    if (esBasura) {
      console.log(`[IA-Ingesta] 🗑️ Correo detectado como BASURA/SPAM. Ignorando.`);
      return NextResponse.json({ 
        success: false, 
        error: 'El contenido no parece ser una solicitud PQRSD válida.',
        esBasura: true 
      });
    }

    console.log(`[IA-Ingesta] Clasificación completada. Plantilla: ${plantilla?.titulo} (Score: ${score})`);

    // 4. PERSISTENCIA EN DUCKDB (Mock)
    const nuevoTicket: Ticket = {
      idTicket,
      numeroRadicado,
      idSecretaria,
      nombreCiudadano: nombre || 'Ciudadano Anónimo',
      emailCiudadano: remitente,
      tipoSolicitud: plantilla?.categoria ?? 'Peticion', // Asignado por la IA
      asunto: asunto || 'Sin asunto',
      contenidoRaw: cuerpo,
      resumenIa: null,
      respuestaSugerida: plantilla?.contenido ?? null, // La IA deja el borrador listo para el humano
      estado: 'Pendiente',
      fechaCreacion: new Date().toISOString(),
      fechaLimite: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 días
      canalOrigen: 'Email',
    };

    // Guardamos en nuestro mock persistente en memoria (mientras dure la sesión de dev)
    TICKETS_MOCK.unshift(nuevoTicket);
    console.log(`[Database] PQRSD registrado exitosamente: ${numeroRadicado}`);

    // 5. AUTORESPUESTA SMTP (Confirmación al Ciudadano)
    // Ahora enviamos también el contenido original
    const emailResult = await sendConfirmationEmail(remitente, numeroRadicado, nombre, cuerpo);

    return NextResponse.json({
      success: true,
      idTicket,
      numeroRadicado,
      ia: {
        templateSelected: plantilla?.titulo,
        score
      },
      email: {
        sent: emailResult.success,
        messageId: emailResult.messageId
      }
    });

  } catch (error) {
    console.error('[Ingesta-Error]', error);
    return NextResponse.json({ 
      error: 'Error interno al procesar el correo',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}

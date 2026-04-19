import { NextRequest, NextResponse } from 'next/server';
import { generarNumeroRadicado } from '@/lib/radicado';
import { procesarCorreoConIA } from '@/services/iaTemplateService';
import { sendConfirmationEmail } from '@/services/emailService';
import { TICKETS_MOCK } from '@/services/mockData';
import { Ticket } from '@/types';

/**
 * API ENDPOINT: Ingesta de Correos Electrónicos
 * Sistema inteligente de decisión IA: Basura -> Datos Faltantes -> Registro Exitoso
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { remitente, nombre, asunto, cuerpo } = body;

    if (!remitente || !cuerpo) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (remitente, cuerpo)' }, { status: 400 });
    }

    // 1. ANÁLISIS INTEGRAL CON IA
    const analisis = await procesarCorreoConIA(cuerpo, asunto || '', nombre || 'Ciudadano');

    // ESCENARIO A: BASURA / SPAM
    if (analisis.esBasura) {
      console.log(`[IA-Ingesta] 🗑️ Basura detectada. Ignorando.`);
      return NextResponse.json({ success: false, error: 'Contenido no válido', esBasura: true });
    }

    // 2. GENERACIÓN DE RESPUESTA Y RADICADO
    const idSecretaria = 'sec-salud'; // Default para demo
    const numeroRadicado = analisis.faltanDatos ? 'PENDIENTE-DATOS' : generarNumeroRadicado(idSecretaria);
    const idTicket = `tk-${Date.now()}`;

    // ESCENARIO B: FALTAN DATOS (Nombre/Cédula)
    if (analisis.faltanDatos) {
      console.log(`[IA-Ingesta] ⚠️ Faltan datos: ${analisis.datosFaltantes.join(', ')}`);
      
      // Enviamos correo pidiendo los datos (usamos el mismo servicio pero con el texto de la IA)
      await sendConfirmationEmail(
        remitente, 
        'SIN RADICAR', 
        nombre || 'Ciudadano', 
        analisis.respuestaGenerada
      );

      return NextResponse.json({ 
        success: true, 
        mensaje: 'Se solicitó información adicional al ciudadano',
        faltanDatos: true,
        datosFaltantes: analisis.datosFaltantes
      });
    }

    // ESCENARIO C: TODO CORRECTO -> REGISTRO Y RESPUESTA HUMANA
    const nuevoTicket: Ticket = {
      idTicket,
      numeroRadicado,
      idSecretaria,
      nombreCiudadano: nombre || 'Ciudadano Anónimo',
      emailCiudadano: remitente,
      tipoSolicitud: analisis.categoriaSugerida,
      asunto: asunto || 'Sin asunto',
      contenidoRaw: cuerpo,
      resumenIa: null,
      respuestaSugerida: analisis.respuestaGenerada, // La IA escribe la respuesta humana aquí
      estado: 'Pendiente',
      fechaCreacion: new Date().toISOString(),
      fechaLimite: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      canalOrigen: 'Email',
    };

    TICKETS_MOCK.unshift(nuevoTicket);
    console.log(`[Database] PQRSD registrado exitosamente: ${numeroRadicado}`);

    // Enviamos la respuesta humana personalizada
    const emailResult = await sendConfirmationEmail(
      remitente, 
      numeroRadicado, 
      nombre, 
      analisis.respuestaGenerada
    );

    return NextResponse.json({
      success: true,
      idTicket,
      numeroRadicado,
      ia: {
        templateSelected: 'Generación Dinámica LLM',
        categoria: analisis.categoriaSugerida
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

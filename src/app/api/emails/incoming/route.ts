import { NextRequest, NextResponse } from 'next/server';
import { generarNumeroRadicado } from '@/lib/radicado';
import { procesarCorreoConIA } from '@/services/iaTemplateService';
import { sendConfirmationEmail } from '@/services/emailService';
import { TICKETS_MOCK, MEMORIA_HILOS_MOCK } from '@/services/mockData';
import { Ticket } from '@/types';

/**
 * API ENDPOINT: Ingesta de Correos Electrónicos
 * Sistema con Memoria de Continuidad: Detecta si es una respuesta a una solicitud anterior.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { remitente, nombre, asunto, cuerpo } = body;

    if (!remitente || !cuerpo) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // 1. BUSCAR CONTINUIDAD (¿El ciudadano está respondiendo a una petición de datos anterior?)
    const contextoAnterior = MEMORIA_HILOS_MOCK[remitente];
    if (contextoAnterior) {
      console.log(`[IA-Continuidad] 🧵 Detectado hilo anterior para: ${remitente}`);
    }

    // 2. ANÁLISIS CON IA (Enviando contexto si existe)
    const analisis = await procesarCorreoConIA(
      cuerpo, 
      asunto || '', 
      nombre || 'Ciudadano', 
      contextoAnterior
    );

    // ESCENARIO A: BASURA
    if (analisis.esBasura) {
      return NextResponse.json({ success: false, error: 'Contenido no válido', esBasura: true });
    }

    // ESCENARIO B: SIGUEN FALTANDO DATOS
    if (analisis.faltanDatos) {
      // Guardamos (o actualizamos) en la memoria para el próximo correo
      MEMORIA_HILOS_MOCK[remitente] = {
        asunto: asunto || contextoAnterior?.asunto || 'Solicitud Pendiente',
        cuerpoOriginal: contextoAnterior ? `${contextoAnterior.cuerpoOriginal}\n${cuerpo}` : cuerpo,
        fecha: new Date()
      };

      await sendConfirmationEmail(
        remitente, 
        'EN TRÁMITE', 
        nombre || 'Ciudadano', 
        analisis.respuestaGenerada
      );

      return NextResponse.json({ 
        success: true, 
        mensaje: 'Continuidad mantenida: Se solicitan datos restantes',
        faltanDatos: true 
      });
    }

    // ESCENARIO C: ÉXITO (Datos completos)
    // 1. Generar radicado real
    const idSecretaria = 'sec-salud';
    const numeroRadicado = generarNumeroRadicado(idSecretaria);
    const idTicket = `tk-${Date.now()}`;

    // 2. Crear ticket con el contenido fusionado (Historial + Nuevo)
    const contenidoFinal = contextoAnterior 
      ? `--- SOLICITUD INICIAL ---\n${contextoAnterior.cuerpoOriginal}\n\n--- DATOS COMPLETADOS ---\n${cuerpo}`
      : cuerpo;

    const nuevoTicket: Ticket = {
      idTicket,
      numeroRadicado,
      idSecretaria,
      nombreCiudadano: nombre || 'Ciudadano Anónimo',
      emailCiudadano: remitente,
      tipoSolicitud: analisis.categoriaSugerida,
      asunto: asunto || contextoAnterior?.asunto || 'Sin asunto',
      contenidoRaw: contenidoFinal,
      resumenIa: null,
      respuestaSugerida: analisis.respuestaGenerada,
      estado: 'Pendiente',
      fechaCreacion: new Date().toISOString(),
      fechaLimite: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      canalOrigen: 'Email',
    };

    TICKETS_MOCK.unshift(nuevoTicket);
    
    // 3. LIMPIAR MEMORIA (La conversación ha concluido con un radicado)
    delete MEMORIA_HILOS_MOCK[remitente];
    console.log(`[IA-Continuidad] ✅ Hilo cerrado y ticket creado: ${numeroRadicado}`);

    // 4. Enviar respuesta humana final
    await sendConfirmationEmail(remitente, numeroRadicado, nombre, analisis.respuestaGenerada);

    return NextResponse.json({ success: true, numeroRadicado });

  } catch (error) {
    console.error('[Ingesta-Error]', error);
    return NextResponse.json({ 
      error: 'Error interno al procesar el correo',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}

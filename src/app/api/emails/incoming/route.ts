import { NextRequest, NextResponse } from 'next/server';
import { generarNumeroRadicado } from '@/lib/radicado';
import { procesarCorreoConIA } from '@/services/iaTemplateService';
import { sendConfirmationEmail } from '@/services/emailService';
import { TICKETS_MOCK, MEMORIA_HILOS_MOCK } from '@/services/mockData';
import { Ticket } from '@/types';
import { query, ensureSchema } from '@/lib/motherduck';

/**
 * API ENDPOINT: Ingesta de Correos Electrónicos
 * Sistema con Memoria de Continuidad: Detecta si es una respuesta a una solicitud anterior.
 * 
 * Persiste tickets tanto en MOCK (memoria) como en MotherDuck (cloud DB).
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

    // 2. GENERACIÓN DE RESPUESTA Y RADICADO
    const idSecretaria = 'sec-salud'; // Default para demo
    const idTicket = `tk-${Date.now()}`;
    const nombreParaTicket = (analisis.nombreExtraido && analisis.nombreExtraido !== 'No encontrado') 
      ? analisis.nombreExtraido 
      : (nombre || 'Ciudadano Anónimo');

    // ESCENARIO B: FALTAN DATOS (Nombre/Cédula)
    if (analisis.faltanDatos) {
      console.log(`[IA-Ingesta] ⚠️ Faltan datos: ${analisis.datosFaltantes.join(', ')}`);
      
      // Enviamos correo pidiendo los datos
      await sendConfirmationEmail(
        remitente, 
        'EN TRÁMITE', 
        nombreParaTicket, 
        analisis.respuestaGenerada
      );

      return NextResponse.json({ 
        success: true, 
        mensaje: 'Continuidad mantenida: Se solicitan datos restantes',
        faltanDatos: true 
      });
    }

    // ESCENARIO C: ÉXITO (Datos completos)
    const numeroRadicadoReal = generarNumeroRadicado(idSecretaria);
    const contenidoFinal = contextoAnterior 
      ? `--- SOLICITUD INICIAL ---\n${contextoAnterior.cuerpoOriginal}\n\n--- DATOS COMPLETADOS ---\n${cuerpo}`
      : cuerpo;

    const nuevoTicket: Ticket = {
      idTicket,
      numeroRadicado: numeroRadicadoReal,
      idSecretaria,
      nombreCiudadano: nombreParaTicket,
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

    // PERSISTIR EN MOCK (para usuario de prueba)
    TICKETS_MOCK.unshift(nuevoTicket);

    // PERSISTIR EN MOTHERDUCK (para usuario admin / datos reales)
    try {
      await ensureSchema();
      await query(
        `INSERT INTO tickets (
          id_ticket, numero_radicado, id_secretaria, nombre_ciudadano,
          email_ciudadano, tipo_solicitud, asunto, contenido_raw,
          resumen_ia, respuesta_sugerida, estado, canal_origen,
          fecha_creacion, fecha_limite, fecha_actualizacion
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,now())`,
        [
          nuevoTicket.idTicket, nuevoTicket.numeroRadicado, nuevoTicket.idSecretaria,
          nuevoTicket.nombreCiudadano, nuevoTicket.emailCiudadano, nuevoTicket.tipoSolicitud,
          nuevoTicket.asunto, nuevoTicket.contenidoRaw, nuevoTicket.resumenIa,
          nuevoTicket.respuestaSugerida, nuevoTicket.estado, nuevoTicket.canalOrigen,
          nuevoTicket.fechaCreacion, nuevoTicket.fechaLimite,
        ]
      );
      console.log(`[MotherDuck] ✅ Ticket ${idTicket} persistido en la nube`);
    } catch (dbErr) {
      // Si falla MotherDuck, el ticket sigue existiendo en MOCK
      console.error('[MotherDuck] ⚠️ No se pudo persistir en DB (el ticket existe en mock):', dbErr);
    }
    
    // LIMPIAR MEMORIA (La conversación ha concluido con un radicado)
    delete MEMORIA_HILOS_MOCK[remitente];
    console.log(`[IA-Continuidad] ✅ Hilo cerrado y ticket creado: ${numeroRadicadoReal}`);

    // Enviar respuesta humana final con link de seguimiento
    await sendConfirmationEmail(
      remitente, 
      numeroRadicadoReal, 
      nombreParaTicket, 
      analisis.respuestaGenerada,
      idTicket  // ← Para generar el link de seguimiento
    );

    return NextResponse.json({ success: true, numeroRadicado: numeroRadicadoReal, idTicket });

  } catch (error) {
    console.error('[Ingesta-Error]', error);
    return NextResponse.json({ 
      error: 'Error interno al procesar el correo',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { generarNumeroRadicado } from '@/lib/radicado';
import { procesarCorreoConIA } from '@/services/iaTemplateService';
import { sendConfirmationEmail } from '@/services/emailService';
import { MEMORIA_HILOS_MOCK } from '@/services/mockData';
import { Ticket } from '@/types';
import { query, ensureSchema } from '@/lib/motherduck';
import { extraerEmail } from '@/lib/utils';

/**
 * API ENDPOINT: Ingesta de Correos Electrónicos
 * Sistema con Memoria de Continuidad: Detecta si es una respuesta a una solicitud anterior.
 * 
 * Persiste tickets tanto en MOCK (memoria) como en MotherDuck (cloud DB).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { remitente: remitenteRaw, nombre, asunto, cuerpo } = body;
    const remitente = extraerEmail(remitenteRaw || '');

    // --- FILTRO DE SEGURIDAD Y RELEVANCIA ---
    const dominiosBloqueados = ['instagram.com', 'facebookmail.com', 'twitter.com', 'linkedin.com', 'pinterest.com'];
    const keywordsBloqueadas = ['noreply', 'no-reply', 'notification', 'alert', 'newsletter', 'donotreply'];
    
    const esIrrelevante = 
      dominiosBloqueados.some(dom => remitente.toLowerCase().endsWith(dom)) ||
      keywordsBloqueadas.some(key => remitente.toLowerCase().includes(key)) ||
      (asunto && keywordsBloqueadas.some(key => asunto.toLowerCase().includes(key)));

    if (esIrrelevante) {
      console.log(`[Filtro-Spam] 🚫 Correo ignorado de: ${remitente}`);
      return NextResponse.json({ 
        success: false, 
        error: 'El remitente o contenido no parece ser una solicitud ciudadana válida (posible sistema automatizado).' 
      }, { status: 200 }); // Status 200 para que el webhook no reintente
    }

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

    // PERSISTIR EN MOTHERDUCK (para usuario admin / datos reales)
    try {
      await ensureSchema();

      // Deduplicación: Verificar si en el último minuto ya entró un ticket igual (previene reintentos de webhooks como Zapier/Make)
      const duplicateCheck = await query<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM tickets 
         WHERE email_ciudadano = $1 
         AND asunto = $2 
         AND fecha_creacion > now() - interval '2 minutes'`,
        [nuevoTicket.emailCiudadano, nuevoTicket.asunto]
      );
      
      const count = Number(duplicateCheck[0]?.cnt || 0);
      if (count > 0) {
        console.log(`[MotherDuck] ⚠️ Ticket duplicado detectado para ${remitente}, ignorando.`);
        return NextResponse.json({ success: true, duplicated: true, message: 'Ticket ya procesado recientemente' });
      }

      await query(
        `INSERT INTO tickets (
          id_ticket, numero_radicado, id_secretaria, nombre_ciudadano,
          email_ciudadano, documento_ciudadano, telefono_ciudadano, tipo_solicitud, asunto, contenido_raw,
          resumen_ia, respuesta_sugerida, estado, canal_origen,
          fecha_creacion, fecha_limite, fecha_actualizacion
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,now())`,
        [
          nuevoTicket.idTicket, nuevoTicket.numeroRadicado, nuevoTicket.idSecretaria,
          nuevoTicket.nombreCiudadano, nuevoTicket.emailCiudadano, null, null, nuevoTicket.tipoSolicitud,
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

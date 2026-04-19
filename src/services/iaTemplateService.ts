import { TipoSolicitud } from '@/types';

export interface PlantillaRespuesta {
  id: string;
  titulo: string;
  categoria: TipoSolicitud;
  contenido: string;
}

export const PLANTILLAS_PREESCRITAS: PlantillaRespuesta[] = [
  {
    id: 'plan-001',
    titulo: 'Mantenimiento Vial (Huecos/Deterioro)',
    categoria: 'Peticion',
    contenido: 'Estimado ciudadano, hemos recibido su reporte sobre el estado de la malla vial. Le informamos que su solicitud ha sido remitida al equipo de infraestructura para ser incluida en el plan de bacheo y mantenimiento priorizado del distrito. Estaremos monitoreando el avance del reporte.',
  },
  {
    id: 'plan-002',
    titulo: 'Salud Pública (Citas/Atención)',
    categoria: 'Queja',
    contenido: 'Lamentamos los inconvenientes presentados en su atención de salud. Su caso ha sido escalado al área de Auditoría de Servicios de Salud para verificar los tiempos de respuesta del prestador y asegurar que se cumpla con la calidad de atención requerida por la ley.',
  },
  {
    id: 'plan-003',
    titulo: 'Información General / Trámites',
    categoria: 'Sugerencia',
    contenido: 'Gracias por su comunicación. Le informamos que para el trámite mencionado, puede acceder a la ventanilla única virtual en el portal de la Alcaldía o dirigirse de manera presencial a cualquier MasCerca del distrito en horario de 8:00 AM a 5:00 PM.',
  },
  {
    id: 'plan-004',
    titulo: 'Reclamo Tributario (Impuestos)',
    categoria: 'Reclamo',
    contenido: 'Hemos recibido su inconformidad respecto a la liquidación de impuestos. Se ha iniciado una revisión técnica en la Secretaría de Hacienda. En los próximos días hábiles recibirá una respuesta detallada tras validar los registros en nuestro sistema catastral.',
  },
];


import { callAiModel } from './aiService';

export interface ResultadoProcesamientoIA {
  esBasura: boolean;
  faltanDatos: boolean;
  datosFaltantes: string[];
  nombreExtraido: string;
  respuestaGenerada: string;
  categoriaSugerida: TipoSolicitud;
}

/**
 * Motor de decisión inteligente basado en modelos de lenguaje (LLM).
 * Utiliza OpenRouter para analizar, extraer datos y redactar respuestas.
 */
export async function procesarCorreoConIA(
  contenidoRaw: string,
  asunto: string,
  nombreRemitente: string,
  contextoAnterior?: { asunto: string, cuerpoOriginal: string }
): Promise<ResultadoProcesamientoIA> {
  
  const systemPrompt = `
    Eres el Agente de Triaje Inteligente de la Alcaldía de Medellín. 
    Tu objetivo es analizar correos electrónicos entrantes y tomar decisiones de radicación.
    
    INSTRUCCIONES CRÍTICAS:
    1. Determina si el correo es basura (spam, publicidad, mensajes sin sentido).
    2. EXTRACCIÓN DE IDENTIDAD: Ignora el nombre del remitente del email (${nombreRemitente}). 
       Busca dentro del CUERPO DEL CORREO quién dice ser el ciudadano (ej. "Mi nombre es...", "Cordial saludo, soy...", o la firma al final).
       Si no encuentras un nombre claro dentro del cuerpo, márcalo como dato faltante.
    3. Busca la Cédula de Ciudadanía (ID). Acepta cualquier formato (con puntos, espacios, etc.).
    4. Clasifica la solicitud: Peticion, Queja, Reclamo, Sugerencia, Denuncia.
    5. Genera una respuesta:
       - Si faltan datos: Solicita los datos faltantes amablemente.
       - Si es válido: Redacta una respuesta humana y empática usando el NOMBRE EXTRAÍDO DEL CUERPO. Menciona el plazo de 15 días hábiles.
    
    DEBES RESPONDER EXCLUSIVAMENTE EN FORMATO JSON:
    {
      "esBasura": boolean,
      "faltanDatos": boolean,
      "datosFaltantes": string[],
      "nombreExtraido": "Nombre Real Encontrado o 'No encontrado'",
      "respuestaGenerada": string,
      "categoriaSugerida": "Peticion" | "Queja" | "Reclamo" | "Sugerencia" | "Denuncia"
    }
  `;

  const userPrompt = `
    DATOS DEL REMITENTE: ${nombreRemitente}
    ASUNTO: ${asunto}
    ${contextoAnterior ? `HISTORIAL PREVIO: ${contextoAnterior.asunto} - ${contextoAnterior.cuerpoOriginal}` : ''}
    
    CONTENIDO DEL CORREO:
    "${contenidoRaw}"
  `;

  try {
    const aiResponse = await callAiModel(systemPrompt, userPrompt);
    
    if (!aiResponse) {
      throw new Error('No se recibió respuesta del modelo de IA');
    }

    // Limpiar posibles etiquetas de markdown del JSON
    const jsonStr = aiResponse.replace(/```json|```/g, '').trim();
    const result = JSON.parse(jsonStr) as ResultadoProcesamientoIA;

    return result;

  } catch (error) {
    console.error('[IA-PROCESSOR] Fallo en la llamada a IA, usando fallback básico:', error);
    
    // Fallback de emergencia si la IA falla (para que el sistema no se rompa)
    return {
      esBasura: false,
      faltanDatos: true,
      datosFaltantes: ['Identificación (Cédula)', 'Nombre completo'],
      nombreExtraido: 'No encontrado',
      respuestaGenerada: 'Cordial saludo. Hemos recibido su mensaje. Sin embargo, para proceder, requerimos que nos proporcione su nombre completo y número de documento. Gracias.',
      categoriaSugerida: 'Peticion'
    };
  }
}

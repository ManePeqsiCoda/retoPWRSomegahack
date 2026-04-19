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

export interface ResultadoProcesamientoIA {
  esBasura: boolean;
  faltanDatos: boolean;
  datosFaltantes: string[];
  respuestaGenerada: string;
  categoriaSugerida: TipoSolicitud;
}

/**
 * Motor de decisión IA para correos entrantes.
 * Simula un modelo de lenguaje (LLM) que analiza el contexto completo.
 */
export async function procesarCorreoConIA(
  contenidoRaw: string,
  asunto: string,
  nombreRemitente: string,
  contextoAnterior?: { asunto: string, cuerpoOriginal: string }
): Promise<ResultadoProcesamientoIA> {
  // Fusionar contexto si existe (Continuidad)
  const textoParaAnalizar = contextoAnterior 
    ? `HISTORIAL: ${contextoAnterior.asunto} - ${contextoAnterior.cuerpoOriginal}\nNUEVO MENSAJE: ${contenidoRaw}`
    : contenidoRaw;

  const contentLower = (asunto + " " + textoParaAnalizar).toLowerCase();
  
  // 1. DETECCIÓN DE BASURA
  const esBasura = !contextoAnterior && (contenidoRaw.length < 15 || 
                  /comprar|viagra|cripto|oferta única|test prueba/i.test(contentLower));
  
  if (esBasura) {
    return { 
      esBasura: true, 
      faltanDatos: false, 
      datosFaltantes: [], 
      respuestaGenerada: '', 
      categoriaSugerida: 'Peticion' 
    };
  }

  // 2. EXTRACCIÓN DE DATOS
  const tieneCedula = /\b\d{7,10}\b/.test(textoParaAnalizar);
  const tieneNombre = nombreRemitente.split(' ').length >= 2 || textoParaAnalizar.includes('atentamente');
  
  const datosFaltantes = [];
  if (!tieneCedula) datosFaltantes.push('Número de identificación (Cédula)');
  if (!tieneNombre) datosFaltantes.push('Nombre completo');

  const faltanDatos = datosFaltantes.length > 0;

  // 3. GENERACIÓN DE RESPUESTA
  let respuestaGenerada = "";
  let categoria: TipoSolicitud = 'Peticion';

  if (contentLower.includes('hueco') || contentLower.includes('calle')) categoria = 'Queja';
  else if (contentLower.includes('salud') || contentLower.includes('hospital')) categoria = 'Peticion';

  if (faltanDatos) {
    respuestaGenerada = `
      Cordial saludo, ciudadano(a). 
      Hemos recibido su mensaje respecto a "${asunto || (contextoAnterior?.asunto) || 'su solicitud'}", pero para poder radicarlo oficialmente, aún necesitamos:
      
      ${datosFaltantes.map(d => `- ${d}`).join('\n')}
      
      Por favor, proporciónenos estos datos respondiendo a este correo.
    `;
  } else {
    // Si venimos de un contexto anterior, la respuesta debe ser de agradecimiento por completar los datos
    const intro = contextoAnterior 
      ? `Gracias por completar su información, ${nombreRemitente}.`
      : `Estimado(a) ${nombreRemitente}, espero que este mensaje le encuentre bien.`;

    respuestaGenerada = `
      ${intro}
      
      He procesado su solicitud sobre "${asunto || (contextoAnterior?.asunto) || 'su caso'}". Su radicación se ha completado exitosamente tras validar su identidad.
      
      Le recordamos que, conforme a la Ley 1755 de 2015, el Distrito de Medellín dispone de un plazo máximo de 15 días hábiles para emitir una respuesta de fondo.
      
      Atentamente,
      IA de Atención Ciudadana - Alcaldía de Medellín
    `;
  }

  return {
    esBasura,
    faltanDatos,
    datosFaltantes,
    respuestaGenerada: respuestaGenerada.trim(),
    categoriaSugerida: categoria
  };
}

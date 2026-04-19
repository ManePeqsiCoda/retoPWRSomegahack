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
  nombreRemitente: string
): Promise<ResultadoProcesamientoIA> {
  const contentLower = (asunto + " " + contenidoRaw).toLowerCase();
  
  // 1. DETECCIÓN DE BASURA (Mejorada)
  const esBasura = contenidoRaw.length < 15 || 
                  /comprar|viagra|cripto|oferta única|test prueba/i.test(contentLower);
  
  if (esBasura) {
    return { 
      esBasura: true, 
      faltanDatos: false, 
      datosFaltantes: [], 
      respuestaGenerada: '', 
      categoriaSugerida: 'Peticion' 
    };
  }

  // 2. EXTRACCIÓN DE DATOS (Simulada con Regex/IA)
  // Buscamos patrones de números de 7 a 10 dígitos (Cédula en Colombia)
  const tieneCedula = /\b\d{7,10}\b/.test(contenidoRaw);
  const tieneNombre = nombreRemitente.split(' ').length >= 2 || contenidoRaw.includes('atentamente');
  
  const datosFaltantes = [];
  if (!tieneCedula) datosFaltantes.push('Número de identificación (Cédula)');
  if (!tieneNombre) datosFaltantes.push('Nombre completo');

  const faltanDatos = datosFaltantes.length > 0;

  // 3. GENERACIÓN DE RESPUESTA PERSONALIZADA (Simulación de LLM)
  let respuestaGenerada = "";
  let categoria: TipoSolicitud = 'Peticion';

  if (contentLower.includes('hueco') || contentLower.includes('calle')) categoria = 'Queja';
  else if (contentLower.includes('salud') || contentLower.includes('hospital')) categoria = 'Peticion';

  if (faltanDatos) {
    respuestaGenerada = `
      Cordial saludo, ciudadano(a). 
      Hemos recibido su mensaje respecto a "${asunto || 'su solicitud'}", pero para poder radicarlo oficialmente en nuestro sistema de la Alcaldía de Medellín, necesitamos que nos proporcione los siguientes datos:
      
      ${datosFaltantes.map(d => `- ${d}`).join('\n')}
      
      Una vez nos envíe esta información, procederemos con la generación de su número de radicado.
      Quedamos atentos para servirle.
    `;
  } else {
    // Respuesta personalizada y humana
    respuestaGenerada = `
      Estimado(a) ${nombreRemitente}, espero que este mensaje le encuentre bien.
      
      He analizado detenidamente su solicitud respecto a "${asunto || 'su caso'}" y entiendo perfectamente la situación que nos describe sobre "${contenidoRaw.substring(0, 50)}...". 
      
      Quiero informarle que su caso ha sido remitido a la dependencia correspondiente para su atención inmediata. Tenga la seguridad de que trabajaremos para darle una solución efectiva. 
      
      Le recordamos que, conforme a la Ley 1755 de 2015, el Distrito de Medellín dispone de un plazo máximo de 15 días hábiles para emitir una respuesta de fondo a su solicitud. Estaremos en contacto con usted muy pronto.
      
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

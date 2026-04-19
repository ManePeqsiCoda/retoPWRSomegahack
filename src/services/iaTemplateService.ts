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

/**
 * Simula el análisis de IA para seleccionar la mejor plantilla.
 * En producción, esto llamaría a OpenRouter o un modelo local (Llama3/Trinity).
 */
export async function analyzeAndSelectTemplate(
  contenidoRaw: string,
  asunto: string
): Promise<{ plantilla: PlantillaRespuesta; score: number }> {
  const contentLower = (asunto + " " + contenidoRaw).toLowerCase();

  // Lógica de "IA" simulada basada en keywords
  if (contentLower.includes('hueco') || contentLower.includes('vial') || contentLower.includes('calle')) {
    return { plantilla: PLANTILLAS_PREESCRITAS[0], score: 0.95 };
  }
  
  if (contentLower.includes('salud') || contentLower.includes('hospital') || contentLower.includes('cita')) {
    return { plantilla: PLANTILLAS_PREESCRITAS[1], score: 0.92 };
  }

  if (contentLower.includes('impuesto') || contentLower.includes('pago') || contentLower.includes('cobro')) {
    return { plantilla: PLANTILLAS_PREESCRITAS[3], score: 0.88 };
  }

  // Fallback a información general
  return { plantilla: PLANTILLAS_PREESCRITAS[2], score: 0.5 };
}

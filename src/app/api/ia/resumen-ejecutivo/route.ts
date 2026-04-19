import { NextRequest, NextResponse } from 'next/server';
import {
  crmGatewayUserId,
  gatewayBaseUrl,
  postPqrsAssistantChat,
  responseTextFromGatewayPayload,
} from '@/lib/duckclaw-gateway';

interface ResumenEjecutivoBody {
  contenidoRaw: string;
  tipoSolicitud: string;
  secretariaNombre: string;
  idTicket: string;
  duckclawUserId: string;
  duckclawUsername: string;
}

/** Quita prefijos tipo etiqueta de subagente al inicio del resumen. */
function stripExecutiveSummaryNoise(raw: string): string {
  let t = (raw || '').trim();
  if (!t) return t;
  t = t.replace(/^(?:PQRSD-Assistant|[\w][\w\s-]*)\s+\d+\s*[\r\n]+/im, '');
  t = t.replace(/^\s*#{1,6}\s*[^\n]+\n+/m, '');
  return t.trim();
}

function buildResumenEjecutivoMessage(body: ResumenEjecutivoBody): string {
  return [
    '[Modo: resumen ejecutivo CRM GovTech para funcionario público — solo lectura]',
    'Produce un resumen ejecutivo en español (Colombia), 2 a 4 oraciones como máximo.',
    'Audiencia: funcionario que gestiona PQRSD. Tono neutro e institucional.',
    `Secretaría: ${body.secretariaNombre}`,
    `Tipo de solicitud: ${body.tipoSolicitud}`,
    '',
    '--- Texto de la solicitud del ciudadano ---',
    body.contenidoRaw,
    '',
    'Restricciones:',
    '- No redactes carta de respuesta al ciudadano ni uses "Respetado/a ciudadano/a".',
    '- Sin título "RESPUESTA OFICIAL", sin bloques Radicado:/Fecha:/Asunto:.',
    '- Sin listas numeradas largas; prosa continua o dos párrafos cortos como máximo.',
    '- No incluyas frases meta tipo "Basándome en" o "Aquí tienes". Entrega solo el resumen.',
    '- Evita invocar herramientas externas si el texto del ciudadano ya es suficiente.',
  ].join('\n');
}

/**
 * Proxy: resumen ejecutivo para el panel "Análisis de IA GovTech" vía PQRSD-Assistant.
 */
export async function POST(request: NextRequest) {
  try {
    const base = gatewayBaseUrl();
    if (!base) {
      return NextResponse.json(
        { error: 'DUCKCLAW_GATEWAY_URL o NEXT_PUBLIC_API_URL no configurada' },
        { status: 500 }
      );
    }

    const body = (await request.json()) as ResumenEjecutivoBody;

    if (!body.contenidoRaw?.trim() || !body.secretariaNombre?.trim()) {
      return NextResponse.json({ error: 'Faltan contenido o secretaría' }, { status: 400 });
    }

    const idTicket = (body.idTicket || 'ticket-unknown').trim();
    const uid = crmGatewayUserId(body.duckclawUserId ?? '');
    const username = (body.duckclawUsername || 'Usuario').trim() || 'Usuario';

    const chatRequest = {
      message: buildResumenEjecutivoMessage(body),
      chat_id: `crm-resumen-${idTicket}`,
      user_id: uid,
      username,
      chat_type: 'private',
      tenant_id: 'PQRS',
      stream: false,
    };

    const { ok, status, rawText, payload } = await postPqrsAssistantChat(base, chatRequest);

    if (!ok) {
      const detail =
        (typeof payload.detail === 'string' && payload.detail) ||
        (typeof payload.message === 'string' && payload.message) ||
        rawText.slice(0, 400);
      return NextResponse.json(
        { error: `Gateway ${status}`, detail },
        { status: status >= 400 && status < 600 ? status : 502 }
      );
    }

    if (rawText.trim() && Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: 'Respuesta inválida del gateway', detail: rawText.slice(0, 500) },
        { status: 502 }
      );
    }

    const responseText = responseTextFromGatewayPayload(payload);

    if (!responseText.trim()) {
      return NextResponse.json(
        { error: 'El gateway no devolvió texto en `response`', detail: payload },
        { status: 502 }
      );
    }

    const text = stripExecutiveSummaryNoise(responseText);
    const elapsedMs =
      typeof payload.elapsed_ms === 'number' ? payload.elapsed_ms : undefined;
    const usageTokens = payload.usage_tokens;
    const usageOk =
      usageTokens &&
      typeof usageTokens === 'object' &&
      usageTokens !== null &&
      typeof (usageTokens as { total_tokens?: unknown }).total_tokens === 'number'
        ? (usageTokens as { total_tokens: number; input_tokens?: number; output_tokens?: number })
        : undefined;

    return NextResponse.json({
      text: text || responseText.trim(),
      ...(elapsedMs !== undefined ? { elapsed_ms: elapsedMs } : {}),
      ...(usageOk ? { usage_tokens: usageOk } : {}),
    });
  } catch (err: unknown) {
    console.error('[IA_RESUMEN_EJECUTIVO]:', err);
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error del servidor', detail: message }, { status: 500 });
  }
}

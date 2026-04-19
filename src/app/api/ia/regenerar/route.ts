import { NextRequest, NextResponse } from 'next/server';
import {
  crmGatewayUserId,
  gatewayBaseUrl,
  postPqrsAssistantChat,
  responseTextFromGatewayPayload,
} from '@/lib/duckclaw-gateway';

interface RegenerarRequestBody {
  contenidoRaw: string;
  resumenIa: string | null;
  respuestaActual: string;
  instruccionFuncionario: string;
  secretariaNombre: string;
  tipoSolicitud: string;
  idTicket: string;
  /** Desde Zustand — debe existir en whitelist del gateway (tenant PQRS) */
  duckclawUserId: string;
  duckclawUsername: string;
}

/**
 * Deja solo el texto apto para pegar en el oficio: sin prefacio del modelo ni secciones meta al final.
 * Quita líneas de título tipo "RESPUESTA OFICIAL - SECRETARÍA …" y metadatos de radicado previos al saludo.
 */
function extractCrmOfficialPqrsText(raw: string): string {
  let t = (raw || '').trim();
  if (!t) return t;
  t = t.replace(/^(?:PQRSD-Assistant|[\w][\w\s-]*)\s+\d+\s*[\r\n]+/im, '');
  const startM = /\bRESPUESTA OFICIAL\b/i.exec(t);
  if (startM && typeof startM.index === 'number') {
    t = t.slice(startM.index);
  }
  // Quitar la línea completa "RESPUESTA OFICIAL …" (con o sin guiones / dependencia)
  t = t.replace(/^\s*RESPUESTA OFICIAL[^\n]*\n+/i, '');
  // Bloques opcionales de metadatos antes del saludo institucional
  t = t.replace(
    /^(?:Radicado\s*:[^\n]*\n+|Fecha\s*:[^\n]*\n+|Asunto\s*:[^\n]*\n+)+/i,
    ''
  );
  t = t.replace(/^\s*\n+/, '');
  const caractHr = /\n---\s*\n\s*Características de esta redacción/im.exec(t);
  if (caractHr) {
    t = t.slice(0, caractHr.index).trim();
  } else {
    const caract = /\nCaracterísticas de esta redacción\s*:/im.exec(t);
    if (caract) {
      t = t.slice(0, caract.index).trim();
    }
  }
  t = t.replace(/\n---\s*$/m, '').trim();
  return t;
}

function buildCrmUserMessage(body: RegenerarRequestBody): string {
  return [
    '[Modo: redacción de respuesta institucional CRM para funcionario público]',
    'Ayuda a redactar o ajustar la comunicación oficial de respuesta al ciudadano (PQRSD), en español de Colombia.',
    `Secretaría: ${body.secretariaNombre}`,
    `Tipo de solicitud: ${body.tipoSolicitud}`,
    '',
    '--- Contenido de la solicitud del ciudadano ---',
    body.contenidoRaw,
    body.resumenIa ? `\nResumen:\n${body.resumenIa}` : '',
    body.respuestaActual ? `\nBorrador actual:\n${body.respuestaActual}` : '',
    '',
    '--- Instrucción del funcionario ---',
    body.instruccionFuncionario,
    '',
    'Entrega el texto de la carta o respuesta formal. Tono institucional, uso de "Usted".',
    'Encabezado sugerido: "Respetado/a ciudadano/a:". Cierra mencionando la dependencia cuando aplique.',
    '',
    'Salida: empieza con el saludo al ciudadano ("Respetado/a ciudadano/a:"). Sin línea de título "RESPUESTA OFICIAL - …", sin bloque Radicado:/Fecha:/Asunto: salvo que el funcionario lo pida. Sin párrafos introductorios del asistente. Sin sección "Características de esta redacción" ni listas meta al final.',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Proxy hacia DuckClaw `POST /api/v1/agent/PQRSD-Assistant/chat`.
 * Sustituye el flujo OpenRouter; la respuesta se devuelve como JSON `{ text }` para el hook.
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

    const body = (await request.json()) as RegenerarRequestBody;

    if (!body.contenidoRaw || !body.instruccionFuncionario || !body.secretariaNombre) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const idTicket = (body.idTicket || 'ticket-unknown').trim();
    const uid = crmGatewayUserId(body.duckclawUserId ?? '');
    const username = (body.duckclawUsername || 'Usuario').trim() || 'Usuario';

    const chatRequest = {
      message: buildCrmUserMessage(body),
      chat_id: `crm-ticket-${idTicket}`,
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

    const text = extractCrmOfficialPqrsText(responseText);
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
    console.error('[IA_REGENERAR_DUCKCLAW]:', err);
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error del servidor', detail: message }, { status: 500 });
  }
}

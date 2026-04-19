/**
 * Cliente mínimo para proxies Next.js → DuckClaw API Gateway (worker PQRSD-Assistant, tenant PQRS).
 */

export type GatewayChatPayload = Record<string, unknown>;

export function gatewayBaseUrl(): string | null {
  const raw =
    process.env.DUCKCLAW_GATEWAY_URL?.trim() ||
    process.env.NEXT_PUBLIC_DUCKCLAW_GATEWAY_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    '';
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

/** user_id efectivo hacia el gateway (whitelist); override en dev vía env. */
export function crmGatewayUserId(duckclawUserId: string): string {
  return (
    process.env.DUCKCLAW_GATEWAY_USER_ID_OVERRIDE?.trim() ||
    (duckclawUserId || '').trim() ||
    'crm-anonymous'
  );
}

export function responseTextFromGatewayPayload(payload: GatewayChatPayload): string {
  const r = payload.response;
  const t = payload.text;
  if (typeof r === 'string') return r;
  if (typeof t === 'string') return t;
  return '';
}

export async function postPqrsAssistantChat(
  base: string,
  chatRequest: Record<string, unknown>
): Promise<{ ok: boolean; status: number; rawText: string; payload: GatewayChatPayload }> {
  const url = `${base}/api/v1/agent/${encodeURIComponent('PQRSD-Assistant')}/chat`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': 'PQRS' },
    body: JSON.stringify(chatRequest),
    cache: 'no-store',
  });
  const rawText = await res.text();
  let payload: GatewayChatPayload = {};
  try {
    payload = rawText ? (JSON.parse(rawText) as GatewayChatPayload) : {};
  } catch {
    payload = {};
  }
  return { ok: res.ok, status: res.status, rawText, payload };
}

import { NextRequest } from 'next/server';

interface RegenerarRequestBody {
  contenidoRaw: string;
  resumenIa: string | null;
  respuestaActual: string;
  instruccionFuncionario: string;
  secretariaNombre: string;
  tipoSolicitud: string;
}

/**
 * API Route: REGENERAR RESPUESTA PQRSD (Streaming)
 * Actúa como un proxy seguro para la API de OpenRouter.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validar API Key
    if (!process.env.OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OPENROUTER_API_KEY no configurada' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body: RegenerarRequestBody = await request.json();
    
    if (!body.contenidoRaw || !body.instruccionFuncionario || !body.secretariaNombre) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const SYSTEM_PROMPT = `
Eres un asistente experto en redacción de comunicaciones oficiales de la Alcaldía de Medellín. 
Tu rol es ayudar a redactar respuestas formales a PQRSDs.
CONTEXTO: Representas a la ${body.secretariaNombre}.
Tono: Formal, respetuoso, empático y claro.
Encabezado: "Respetado/a ciudadano/a:"
Cierre: "Atentamente, [Nombre del funcionario] - ${body.secretariaNombre} - Alcaldía de Medellín"
Idioma: Español de Colombia. Uso de "Usted".
Devuelve SOLO el texto de la carta.
`.trim();

    const userPrompt = `
SOLICITUD: ${body.contenidoRaw}
${body.resumenIa ? `RESUMEN IA: ${body.resumenIa}` : ''}
${body.respuestaActual ? `BORRADOR ACTUAL: ${body.respuestaActual}` : ''}
INSTRUCCIÓN: ${body.instruccionFuncionario}
`.trim();

    const model = process.env.NEXT_PUBLIC_OPENROUTER_MODEL || "arcee-ai/trinity-large-preview:free";

    // 3. Llamada directa a OpenRouter con fetch (Desactivamos cache para asegurar frescura)
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      cache: 'no-store',
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "CRM PQRSD Medellín",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenRouter Error]:', errorText);
      return new Response(
        JSON.stringify({ error: `Error de OpenRouter: ${response.statusText}`, detail: errorText }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Transformar el stream de OpenRouter al formato esperado por nuestro hook ({ text: '...' })
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const transformStream = new ReadableStream({
      async start(controller) {
        if (!response.body) return;
        const reader = response.body.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const rawData = line.slice(6).trim();
                
                if (rawData === '[DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  continue;
                }

                try {
                  const json = JSON.parse(rawData);
                  const content = json.choices?.[0]?.delta?.content || "";
                  if (content) {
                    const payload = JSON.stringify({ text: content });
                    controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
                  }
                } catch {
                  // Ignorar errores de parseo de micro-chunks
                }
              }
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(transformStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (_error: unknown) {
    console.error('[IA_REGENERAR_ERROR]:', _error);
    const errorMessage = _error instanceof Error ? _error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: 'Error del servidor', detail: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

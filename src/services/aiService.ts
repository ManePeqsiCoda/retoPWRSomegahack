/**
 * Servicio centralizado para llamadas a modelos de IA (OpenRouter / Gateway)
 */
export async function callAiModel(
  systemPrompt: string, 
  userPrompt: string,
  temperature: number = 0.3
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.NEXT_PUBLIC_OPENROUTER_MODEL || 'arcee-ai/trinity-large-preview:free';

  if (!apiKey) {
    console.error('[AI-SERVICE] Error: OPENROUTER_API_KEY no configurada');
    return '';
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'CRM PQRSD Medellín',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1000,
        temperature,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn(`[AI-SERVICE] OpenRouter error: ${res.status} - ${err.slice(0, 100)}`);
      return '';
    }

    const data = await res.json() as { 
      choices?: { 
        message?: { 
          content?: string 
        } 
      }[] 
    };
    return data.choices?.[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('[AI-SERVICE] Error de red:', error);
    return '';
  }
}

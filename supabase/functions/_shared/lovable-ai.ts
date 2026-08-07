// Shared helper for calling Lovable AI from edge functions.
const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
export const DEFAULT_MODEL = 'google/gemini-3.6-flash';

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class AiGatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Calls Lovable AI and returns the assistant text. Throws AiGatewayError on failure. */
export async function callLovableAi(
  messages: AiMessage[],
  options: { model?: string; maxTokens?: number } = {},
): Promise<string> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) throw new AiGatewayError(503, 'AI is not configured for this project.');

  const res = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Lovable-API-Key': apiKey,
      'X-Lovable-AIG-SDK': 'fetch',
    },
    body: JSON.stringify({
      model: options.model ?? DEFAULT_MODEL,
      messages,
      max_tokens: options.maxTokens ?? 1200,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`AI gateway failed [${res.status}]: ${body}`);
    if (res.status === 429) throw new AiGatewayError(429, 'AI is busy right now. Try again in a moment.');
    if (res.status === 402) throw new AiGatewayError(402, 'AI credits are exhausted for this workspace.');
    throw new AiGatewayError(res.status, 'AI request failed.');
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || text.trim() === '') {
    throw new AiGatewayError(502, 'AI returned an empty response.');
  }
  return text.trim();
}

/** Extracts the first JSON object/array from a model response, tolerating code fences. */
export function parseJsonFromModel<T>(text: string): T | null {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.search(/[[{]/);
  if (start === -1) return null;
  const opening = cleaned[start];
  const closing = opening === '{' ? '}' : ']';
  const end = cleaned.lastIndexOf(closing);
  if (end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

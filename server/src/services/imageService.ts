import { StyleMode } from '../types/image.types';

/**
 * Style-specific prompt enrichment. Each mode appends descriptive tokens
 * that steer the model toward the requested aesthetic.
 */
const STYLE_PROMPT: Record<StyleMode, string> = {
  [StyleMode.ANIME]: 'anime style, vibrant colors, clean detailed line art',
  [StyleMode.REALISTIC]: 'photorealistic, ultra detailed, natural lighting, 4k',
  [StyleMode.CINEMATIC]: 'cinematic lighting, dramatic composition, film still, depth of field',
};

export interface GeneratedImage {
  url: string;
  provider: string;
}

/** Shape of the OpenAI images endpoint response (only the fields we read). */
interface OpenAIImageResponse {
  data: Array<{ url?: string; b64_json?: string }>;
}

/**
 * Generate an image for a prompt + style.
 *
 * Provider selection:
 *  - If OPENAI_API_KEY is set, the server calls OpenAI securely (key stays
 *    server-side, never exposed to the browser).
 *  - Otherwise it falls back to Pollinations, a keyless provider, so the
 *    feature works out of the box with no configuration.
 */
export async function generateImage(
  prompt: string,
  style: StyleMode,
): Promise<GeneratedImage> {
  const styledPrompt = `${prompt}, ${STYLE_PROMPT[style]}`;
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey && apiKey.trim().length > 0) {
    return generateWithOpenAI(styledPrompt, apiKey);
  }
  return generateWithPollinations(styledPrompt);
}

/** Keyless provider — constructs an on-demand generation URL. */
function generateWithPollinations(prompt: string): GeneratedImage {
  const encoded = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 1_000_000);
  const url =
    `https://image.pollinations.ai/prompt/${encoded}` +
    `?width=1024&height=1024&nologo=true&seed=${seed}`;
  return { url, provider: 'pollinations' };
}

/** Keyed provider — server-to-server call to OpenAI's image endpoint. */
async function generateWithOpenAI(prompt: string, apiKey: string): Promise<GeneratedImage> {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024' }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Image provider error (${response.status}): ${detail}`);
  }

  const json = (await response.json()) as OpenAIImageResponse;
  const url = json.data[0]?.url;
  if (!url) {
    throw new Error('Image provider returned no URL');
  }
  return { url, provider: 'openai' };
}

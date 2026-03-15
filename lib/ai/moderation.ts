import OpenAI from 'openai';

export interface ModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
}

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

/**
 * Check user-generated text against OpenAI's moderation API.
 * Returns { flagged: false } if the API key is not configured (non-blocking).
 * Cost: FREE — OpenAI charges nothing for the moderation API.
 */
export async function moderateText(text: string): Promise<ModerationResult> {
  const client = getOpenAI();
  if (!client) return { flagged: false, categories: {} };

  try {
    const response = await client.moderations.create({
      model: 'omni-moderation-latest',
      input: text,
    });

    const result = response.results[0];
    if (!result) return { flagged: false, categories: {} };

    return {
      flagged: result.flagged,
      categories: result.categories as unknown as Record<string, boolean>,
    };
  } catch (err) {
    // Moderation failures are non-fatal — log and allow content through
    console.error('Content moderation error:', err);
    return { flagged: false, categories: {} };
  }
}

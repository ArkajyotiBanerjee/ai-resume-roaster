import { GoogleGenAI } from '@google/genai';

const ROAST_SYSTEM_PROMPT = `You are an expert resume reviewer with a humorous but constructive professional roasting persona. Be candid and witty without being insulting, discriminatory, or demeaning. Focus only on the quality of the resume and give practical advice that helps the candidate improve it.`;

const ROAST_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    overallScore: { type: 'number', minimum: 0, maximum: 100 },
    roasts: {
      type: 'array',
      minItems: 3,
      maxItems: 4,
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          comment: { type: 'string' },
        },
        required: ['title', 'comment'],
        additionalProperties: false,
      },
    },
    suggestions: {
      type: 'array',
      minItems: 3,
      maxItems: 4,
      items: { type: 'string' },
    },
  },
  required: ['overallScore', 'roasts', 'suggestions'],
  additionalProperties: false,
};

export class GeminiRoastError extends Error {
  constructor(message, code = 'GEMINI_ERROR') {
    super(message);
    this.name = 'GeminiRoastError';
    this.code = code;
  }
}

function extractJson(content) {
  try {
    return JSON.parse(content.trim());
  } catch {
    throw new GeminiRoastError('Gemini returned malformed JSON.', 'MALFORMED_RESPONSE');
  }
}

function validateRoastOutput(output) {
  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    throw new GeminiRoastError('Gemini returned an invalid roast structure.', 'INVALID_RESPONSE');
  }

  const { overallScore, roasts, suggestions } = output;
  const outputKeys = Object.keys(output);

  if (
    outputKeys.length !== 3
    || !['overallScore', 'roasts', 'suggestions'].every((key) => outputKeys.includes(key))
    || typeof overallScore !== 'number'
    || !Number.isFinite(overallScore)
    || overallScore < 0
    || overallScore > 100
  ) {
    throw new GeminiRoastError('Gemini returned an invalid overall score.', 'INVALID_RESPONSE');
  }

  if (!Array.isArray(roasts) || !roasts.every((roast) => (
    roast
    && typeof roast === 'object'
    && !Array.isArray(roast)
    && Object.keys(roast).length === 2
    && Object.prototype.hasOwnProperty.call(roast, 'title')
    && Object.prototype.hasOwnProperty.call(roast, 'comment')
    && typeof roast.title === 'string'
    && roast.title.trim().length > 0
    && typeof roast.comment === 'string'
    && roast.comment.trim().length > 0
  ))) {
    throw new GeminiRoastError('Gemini returned invalid roast entries.', 'INVALID_RESPONSE');
  }

  if (!Array.isArray(suggestions) || !suggestions.every((suggestion) => (
    typeof suggestion === 'string' && suggestion.trim().length > 0
  ))) {
    throw new GeminiRoastError('Gemini returned invalid suggestions.', 'INVALID_RESPONSE');
  }

  return {
    overallScore,
    roasts: roasts.map(({ title, comment }) => ({ title: title.trim(), comment: comment.trim() })),
    suggestions: suggestions.map((suggestion) => suggestion.trim()),
  };
}

/**
 * Generates and validates a structured resume roast. This module is server-only:
 * GEMINI_API_KEY is read only when the server processes a request.
 */
export async function generateResumeRoast(resumeText) {
  if (!process.env.GEMINI_API_KEY) {
    throw new GeminiRoastError('Gemini API is not configured.', 'MISSING_API_KEY');
  }

  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `RESUME CONTEXT:
${resumeText}

SPECIFIC INSTRUCTIONS:
Identify the most important weaknesses in this resume and provide specific, actionable feedback.

Keep the response concise:
- Provide exactly 3 to 4 roast entries.
- Provide exactly 3 to 4 actionable suggestions.
- Keep each roast comment under approximately 80 words.
- Keep each suggestion under approximately 30 words.
- Do not repeat the same weakness.
- Do not invent experience or facts not present in the resume.
- Keep the tone humorous but constructive.

OUTPUT FORMAT:
Return strict JSON only with no markdown or extra text.
The response must contain exactly:
{
  "overallScore": number from 0 to 100,
  "roasts": [
    {
      "title": "short title",
      "comment": "concise constructive roast"
    }
  ],
  "suggestions": [
    "concise actionable suggestion"
  ]
}`;

  let response;
  try {
    response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: ROAST_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseJsonSchema: ROAST_RESPONSE_SCHEMA,
        maxOutputTokens: 2048,
      },
    });
  } catch (error) {
    throw new GeminiRoastError(
      'Gemini could not generate a roast at this time.',
      'API_ERROR',
    );
  }



  if (typeof response.text !== 'string' || !response.text.trim()) {
    throw new GeminiRoastError('Gemini returned no text response.', 'INVALID_RESPONSE');
  }

  return validateRoastOutput(extractJson(response.text));
}

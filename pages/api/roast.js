import { requireAuth } from '../../lib/auth';
import prisma from '../../lib/db';
import { GeminiRoastError, generateResumeRoast } from '../../lib/gemini';

const MAX_RESUME_TEXT_LENGTH = 100000;

export default async function handler(req, res) {
  const session = await requireAuth(req, res);
  if (!session) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { resumeText } = req.body || {};
  if (typeof resumeText !== 'string' || !resumeText.trim()) {
    return res.status(400).json({ error: 'A non-empty resumeText field is required.' });
  }

  const normalizedResumeText = resumeText.trim();
  if (normalizedResumeText.length > MAX_RESUME_TEXT_LENGTH) {
    return res.status(413).json({ error: 'Resume text exceeds the 100,000 character limit.' });
  }

  if (!session.user.id) {
    return res.status(500).json({ error: 'Authenticated user is missing an identifier.' });
  }

  let roastResult;
  try {
    roastResult = await generateResumeRoast(normalizedResumeText);
  } catch (error) {
    if (error instanceof GeminiRoastError) {
      if (error.code === 'MISSING_API_KEY') {
        return res.status(503).json({ error: error.message });
      }

      if (error.code === 'MALFORMED_RESPONSE' || error.code === 'INVALID_RESPONSE') {
        return res.status(502).json({ error: error.message });
      }

      return res.status(502).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Unexpected error while generating roast.' });
  }

  try {
    const roast = await prisma.roast.create({
      data: {
        userId: session.user.id,
        resumeText: normalizedResumeText,
        roastOutput: roastResult,
      },
    });

    return res.status(201).json({
      success: true,
      roast: {
        id: roast.id,
        overallScore: roastResult.overallScore,
        roasts: roastResult.roasts,
        suggestions: roastResult.suggestions,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save roast result.' });
  }
}

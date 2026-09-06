import { IncomingForm } from 'formidable';
import { requireAuth } from '../../lib/auth';
import { parsePDF } from '../../lib/pdfParser';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // 1. Reject unauthenticated requests
  const session = await requireAuth(req, res);
  if (!session) return; 

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Parse the multipart form
  const form = new IncomingForm({
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB limit
    allowEmptyFiles: false,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      if (err.httpCode === 413 || err.message.includes('bigger than maxFileSize') || err.message.includes('exceeds')) {
         return res.status(413).json({ error: 'File size exceeds 5MB limit.' });
      }
      return res.status(400).json({ error: `File upload failed: ${err.message}` });
    }

    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded. Expected field name "file".' });
    }

    // 3. Validate application/pdf
    if (uploadedFile.mimetype !== 'application/pdf') {
      try { await fs.promises.unlink(uploadedFile.filepath); } catch(e) {}
      return res.status(415).json({ error: 'Invalid file type. Only PDF files are accepted.' });
    }

    try {
      // 4. Parse the PDF
      const extractedText = await parsePDF(uploadedFile.filepath);

      // Clean up temporary file
      try { await fs.promises.unlink(uploadedFile.filepath); } catch(e) {}

      // 5. Reject empty/unusable extracted text
      if (!extractedText || extractedText.trim().length === 0) {
        return res.status(422).json({ error: 'The uploaded PDF contains no extractable text.' });
      }

      // 6. Return clean JSON
      return res.status(200).json({
        success: true,
        text: extractedText,
      });

    } catch (parseError) {
      // Ensure cleanup if parsing throws
      try { await fs.promises.unlink(uploadedFile.filepath); } catch(e) {}
      return res.status(500).json({ error: parseError.message });
    }
  });
}

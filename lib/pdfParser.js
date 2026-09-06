import fs from 'fs';
import pdf from 'pdf-parse';

export async function parsePDF(filePath) {
  try {
    const dataBuffer = await fs.promises.readFile(filePath);
    const data = await pdf(dataBuffer);
    
    if (!data || !data.text || data.text.trim().length === 0) {
      throw new Error("No readable text found in PDF.");
    }
    
    return data.text.trim();
  } catch (error) {
    throw new Error(`PDF Parsing failed: ${error.message}`);
  }
}

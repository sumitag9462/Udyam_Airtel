import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import OcrProvider from './OcrProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class MockOcrProvider extends OcrProvider {
  constructor() {
    super();
    this.cache = {};
    const candidatePaths = [
      path.resolve(process.cwd(), 'data/kyc_extracted_raw.json'),
      path.resolve(process.cwd(), '../data/kyc_extracted_raw.json'),
      path.resolve(process.cwd(), '../../data/kyc_extracted_raw.json'),
      path.resolve(__dirname, '../../../../data/kyc_extracted_raw.json'),
    ];
    for (const rawPath of candidatePaths) {
      if (fs.existsSync(rawPath)) {
        try {
          this.cache = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
          if (Object.keys(this.cache).length > 0) break;
        } catch {
          // ignore
        }
      }
    }
  }

  async extractText(input, _language = 'eng') {
    let filename = '';
    if (typeof input === 'string') {
      filename = path.basename(input);
    } else if (input?.filename) {
      filename = input.filename;
    }

    if (filename && this.cache[filename]) {
      return {
        text: this.cache[filename],
        confidence: 95,
        words: [],
      };
    }

    // Default mock response
    return {
      text: typeof input === 'string' ? input : 'Sample OCR specimen extracted text',
      confidence: 90,
      words: [],
    };
  }
}

import Tesseract from 'tesseract.js';
import OcrProvider from './OcrProvider.js';
import logger from '../../config/logger.js';

export default class TesseractOcrProvider extends OcrProvider {
  constructor() {
    super();
    this.worker = null;
  }

  async getWorker() {
    if (!this.worker) {
      this.worker = await Tesseract.createWorker('eng');
    }
    return this.worker;
  }

  async extractText(input, _language = 'eng') {
    try {
      const worker = await this.getWorker();
      const { data } = await worker.recognize(input);
      return {
        text: data.text || '',
        confidence: data.confidence || 0,
        words: (data.words || []).map((w) => ({
          text: w.text,
          confidence: w.confidence,
        })),
      };
    } catch (err) {
      logger.error({ err }, 'Tesseract OCR recognition error');
      throw err;
    }
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

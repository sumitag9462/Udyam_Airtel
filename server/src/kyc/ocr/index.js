import MockOcrProvider from './MockOcrProvider.js';
import TesseractOcrProvider from './TesseractOcrProvider.js';

let instance = null;

export function getOcrProvider(type = process.env.OCR_PROVIDER || 'mock') {
  if (!instance) {
    if (type === 'tesseract') {
      instance = new TesseractOcrProvider();
    } else {
      instance = new MockOcrProvider();
    }
  }
  return instance;
}

export function setOcrProvider(provider) {
  instance = provider;
}

export default getOcrProvider;

export default class OcrProvider {
  /**
   * Extract text and metadata from an image buffer or file path.
   * @param {Buffer|string} input - File path or buffer
   * @param {string} [language='eng']
   * @returns {Promise<{ text: string, confidence: number }>}
   */
  async extractText(_input, _language = 'eng') {
    throw new Error('extractText() must be implemented by subclass');
  }
}

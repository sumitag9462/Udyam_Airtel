/**
 * Abstract LLM Provider Interface
 */
export default class LLMProvider {
  /**
   * Process a conversation turn and return assistant response with tool calls.
   * @param {Array<{ role: string, content: string }>} messages
   * @param {Array<object>} tools
   * @param {object} context
   * @returns {Promise<{ text: string, toolCalls: Array<{ name: string, args: object }> }>}
   */
  async generateResponse(_messages, _tools, _context) {
    throw new Error('generateResponse() must be implemented by subclass');
  }
}

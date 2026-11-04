import MockProvider from './MockProvider.js';
import AnthropicProvider from './AnthropicProvider.js';
import { config } from '../../config/env.js';

let cachedProvider = null;

export function getLLMProvider() {
  if (cachedProvider) return cachedProvider;

  if (config.LLM_PROVIDER === 'anthropic' && config.ANTHROPIC_API_KEY) {
    cachedProvider = new AnthropicProvider();
  } else {
    cachedProvider = new MockProvider();
  }

  return cachedProvider;
}

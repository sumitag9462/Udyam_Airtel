import Anthropic from '@anthropic-ai/sdk';
import LLMProvider from './LLMProvider.js';
import MockProvider from './MockProvider.js';
import { ADVISOR_SYSTEM_PROMPT } from '../prompts.js';
import { ADVISOR_TOOLS } from '../tools.js';
import { config } from '../../config/env.js';
import logger from '../../config/logger.js';

export default class AnthropicProvider extends LLMProvider {
  constructor() {
    super();
    this.fallbackMock = new MockProvider();
    if (config.ANTHROPIC_API_KEY) {
      try {
        this.client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
      } catch (err) {
        logger.warn({ err }, 'Failed to initialize Anthropic client, using fallback');
        this.client = null;
      }
    }
  }

  async generateResponse(messages, tools = ADVISOR_TOOLS, context = {}) {
    if (!this.client || !config.ANTHROPIC_API_KEY) {
      return this.fallbackMock.generateResponse(messages, tools, context);
    }

    try {
      // Map messages to Anthropic format
      const formattedMessages = messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content || m.text || '',
      }));

      const model = config.LLM_MODEL || 'claude-3-5-sonnet-20241022';
      const response = await this.client.messages.create({
        model,
        max_tokens: 1024,
        system: ADVISOR_SYSTEM_PROMPT,
        messages: formattedMessages,
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.input_schema,
        })),
      });

      let text = '';
      const toolCalls = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          text += block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            name: block.name,
            args: block.input,
          });
        }
      }

      return { text, toolCalls };
    } catch (err) {
      logger.error({ err }, 'Anthropic API call failed — falling back to deterministic MockProvider');
      return this.fallbackMock.generateResponse(messages, tools, context);
    }
  }
}

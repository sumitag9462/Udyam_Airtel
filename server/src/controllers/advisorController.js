import { z } from 'zod';
import { processAdvisorMessage } from '../advisor/orchestrator.js';
import { Conversation } from '../models/index.js';
import AppError from '../utils/AppError.js';

const chatSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1, 'Message cannot be empty'),
  language: z.string().optional().default('en'),
});

export async function handleAdvisorChat(req, res, next) {
  try {
    const { conversationId, message, language } = chatSchema.parse(req.body);
    const userId = req.user._id;

    const result = await processAdvisorMessage({
      conversationId,
      userId,
      messageText: message,
      language,
    });

    res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetConversation(req, res, next) {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }

    // Role scoping: Owner can only view their own conversation
    if (req.user.role === 'owner' && conversation.userId.toString() !== req.user._id.toString()) {
      throw new AppError('Forbidden: Access denied to this conversation', 403, 'FORBIDDEN');
    }

    res.status(200).json({
      ok: true,
      data: { conversation },
    });
  } catch (err) {
    next(err);
  }
}

import { z } from 'zod';
import { processAdvisorMessage } from '../advisor/orchestrator.js';
import { Conversation } from '../models/index.js';
import AppError from '../utils/AppError.js';

const chatSchema = z.object({
  conversationId: z.string().nullish(),
  sessionSecret: z.string().nullish(),
  message: z.string().min(1, 'Message cannot be empty'),
  language: z.string().optional().default('en'),
});

export async function handleAdvisorChat(req, res, next) {
  try {
    const { conversationId, sessionSecret, message, language } = chatSchema.parse(req.body);
    const headerSecret = req.headers['x-session-secret'];
    const effectiveSecret = sessionSecret || headerSecret;
    const userId = req.user?._id;

    const result = await processAdvisorMessage({
      conversationId,
      userId,
      messageText: message,
      language,
      sessionSecret: effectiveSecret,
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

    const headerSecret = req.headers['x-session-secret'];

    // If authenticated user
    if (req.user) {
      if (req.user.role === 'owner') {
        if (conversation.userId && conversation.userId.toString() !== req.user._id.toString()) {
          throw new AppError('Forbidden: Access denied to this conversation', 403, 'FORBIDDEN');
        }
        if (!conversation.userId && conversation.sessionSecret && headerSecret !== conversation.sessionSecret) {
          throw new AppError('Forbidden: Access denied to this conversation', 403, 'FORBIDDEN');
        }
      }
      // advisor and admin can view any conversation
    } else {
      // Guest access requires matching sessionSecret
      if (conversation.userId) {
        throw new AppError('Authentication required to access this conversation', 401, 'UNAUTHORIZED');
      }
      if (!conversation.sessionSecret || headerSecret !== conversation.sessionSecret) {
        throw new AppError('Forbidden: Invalid session secret', 403, 'FORBIDDEN');
      }
    }

    res.status(200).json({
      ok: true,
      data: { conversation },
    });
  } catch (err) {
    next(err);
  }
}

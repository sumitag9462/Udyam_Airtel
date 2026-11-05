import crypto from 'node:crypto';
import { Conversation, Lead, Product } from '../models/index.js';
import { getLLMProvider } from './llm/index.js';
import { executeToolCall } from './tools.js';
import { guardResponse } from './guard.js';
import { determineNextState, isReadyForRecommendation } from './stateMachine.js';
import { buildBundles } from '../rules/index.js';
import { config } from '../config/env.js';
import logger from '../config/logger.js';

/**
 * Orchestrate a conversational turn with the Udyam One advisor.
 */
export async function processAdvisorMessage({
  conversationId,
  userId,
  messageText,
  language = 'en',
  sessionSecret,
}) {
  let conversation;

  if (conversationId) {
    conversation = await Conversation.findById(conversationId);
    if (conversation) {
      // Ownership and session isolation check
      if (conversation.userId) {
        if (!userId || conversation.userId.toString() !== userId.toString()) {
          const err = new Error('Forbidden: Access denied to this conversation');
          err.statusCode = 403;
          err.code = 'FORBIDDEN';
          throw err;
        }
      } else {
        // Guest conversation: verify sessionSecret if set
        if (conversation.sessionSecret && sessionSecret && sessionSecret !== conversation.sessionSecret) {
          const err = new Error('Forbidden: Invalid session secret');
          err.statusCode = 403;
          err.code = 'FORBIDDEN';
          throw err;
        }
        // If user is authenticated, claim this conversation
        if (userId) {
          conversation.userId = userId;
          if (conversation.leadId) {
            await Lead.findByIdAndUpdate(conversation.leadId, { ownerUserId: userId });
          }
        }
      }
    }
  }

  // If no conversation found or provided, create new one
  if (!conversation) {
    const generatedSecret = crypto.randomBytes(16).toString('hex');
    // Ensure user has an associated lead
    let lead = null;
    if (userId) {
      lead = await Lead.findOne({ ownerUserId: userId });
    }
    if (!lead) {
      lead = await Lead.create({
        leadId: `LEAD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        origin: 'live',
        ...(userId ? { ownerUserId: userId } : {}),
        businessName: 'Prospective Business',
        businessType: 'General SMB',
        segment: 'micro',
        city: 'Delhi',
        cityTier: 1,
        state: 'Delhi',
        preferredLanguage: language,
        employeeCount: 1,
        numSites: 1,
        hasGstin: false,
        hasUdyam: false,
        leadSource: 'Website form',
        stageReached: 'Contacted',
        stageOrdinal: 1,
        stageDates: { contacted: new Date() },
      });
    }

    conversation = await Conversation.create({
      leadId: lead._id,
      ...(userId ? { userId } : {}),
      sessionSecret: generatedSecret,
      language,
      state: 'GREETING',
      questionCount: 0,
      profile: {},
      messages: [],
      provider: config.LLM_PROVIDER === 'anthropic' ? 'anthropic' : 'mock',
      status: 'active',
    });
  }

  // 1. Append user message
  conversation.messages.push({
    role: 'user',
    text: messageText,
    createdAt: new Date(),
  });

  const provider = getLLMProvider();

  // Prepare context
  const context = {
    conversationId: conversation._id.toString(),
    leadId: conversation.leadId?.toString(),
    userId: userId ? userId.toString() : null,
    state: conversation.state,
    profile: conversation.profile?.toObject?.() || conversation.profile || {},
    questionCount: conversation.questionCount,
  };

  // 2. Format history for LLM
  const historyForLlm = conversation.messages.map((m) => ({
    role: m.role,
    content: m.text,
  }));

  // 3. Generate response and tool calls
  const { text: rawAssistantText, toolCalls = [] } = await provider.generateResponse(
    historyForLlm,
    undefined,
    context
  );

  let executedTiers = null;
  const executedToolRecords = [];

  // 4. Execute tool calls
  for (const call of toolCalls) {
    try {
      const result = await executeToolCall(call.name, call.args, context);
      executedToolRecords.push({
        toolName: call.name,
        args: call.args,
        result,
      });

      if (call.name === 'save_profile') {
        const updates = call.args;
        conversation.profile = {
          ...conversation.profile,
          ...updates,
        };
        // Also update lead record
        await Lead.findByIdAndUpdate(conversation.leadId, {
          businessType: conversation.profile.businessType || 'General SMB',
          segment: conversation.profile.segment || 'micro',
          city: conversation.profile.city || 'Delhi',
          employeeCount: conversation.profile.employeeCount || 1,
          numSites: conversation.profile.numSites || 1,
          hasGstin: Boolean(conversation.profile.hasGstin),
        });
      }

      if (call.name === 'build_bundle' && result.tiers) {
        executedTiers = result.tiers;
      }

      if (call.name === 'request_handoff') {
        conversation.status = 'handed_off';
      }
    } catch (err) {
      logger.error({ err, toolName: call.name }, 'Tool execution error');
    }
  }

  // If ready for recommendation but tiers were not explicitly produced by tool
  const currentProfile = conversation.profile?.toObject?.() || conversation.profile || {};
  if (!executedTiers && isReadyForRecommendation(currentProfile, conversation.questionCount + 1)) {
    const products = await Product.find({ isActive: true }).lean();
    const bundleRes = buildBundles(currentProfile, products, { mode: config.PRICING_MODE });
    if (bundleRes.tiers) {
      executedTiers = bundleRes.tiers;
    }
  }

  // 5. Enforce response guard (rejects raw currency/codes, substitutes placeholders)
  let sanitizedText;
  try {
    sanitizedText = guardResponse(rawAssistantText, {
      tiers: executedTiers,
      profile: currentProfile,
    });
  } catch (err) {
    logger.warn({ err }, 'Response guard tripped, falling back to safe deterministic template');
    if (executedTiers) {
      sanitizedText =
        conversation.language === 'hi'
          ? `Aapke business ke liye humne 3 plan tayyar kiye hain: Starter (₹${executedTiers[0]?.monthlyTotal}/mahina), Standard (₹${executedTiers[1]?.monthlyTotal}/mahina), aur Resilient (₹${executedTiers[2]?.monthlyTotal}/mahina).`
          : `Based on your profile, here are 3 recommended plans: Starter (₹${executedTiers[0]?.monthlyTotal}/month), Standard (₹${executedTiers[1]?.monthlyTotal}/month), and Resilient (₹${executedTiers[2]?.monthlyTotal}/month).`;
    } else {
      sanitizedText =
        conversation.language === 'hi'
          ? 'Kripya apne business ke baare mein aur jaankari dein taaki hum sahi plan suggest kar sakein.'
          : 'Could you please share a few more details about your business so we can calculate the best plan for you?';
    }
  }

  // 6. State progression
  const nextState = determineNextState(
    conversation.state,
    currentProfile,
    conversation.questionCount + 1
  );
  conversation.state = nextState;
  conversation.questionCount += 1;

  // Append assistant reply
  conversation.messages.push({
    role: 'assistant',
    text: sanitizedText,
    toolCalls: executedToolRecords,
    guardAction: 'substitute_placeholders',
    createdAt: new Date(),
  });

  await conversation.save();

  return {
    conversationId: conversation._id.toString(),
    sessionSecret: conversation.sessionSecret,
    reply: sanitizedText,
    state: conversation.state,
    questionCount: conversation.questionCount,
    profile: currentProfile,
    tiers: executedTiers,
    handoffRequested: conversation.status === 'handed_off',
  };
}

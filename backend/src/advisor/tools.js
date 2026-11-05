import {
  getEligibleProducts,
  buildBundles,
  explainRemoval,
  previewScenario,
} from '../rules/index.js';
import { Product, Quote, Lead } from '../models/index.js';
import { config } from '../config/env.js';
import logger from '../config/logger.js';

/**
 * Tool definitions in Anthropic tool spec format
 */
export const ADVISOR_TOOLS = [
  {
    name: 'save_profile',
    description: 'Save or update the business profile extracted from the user conversation.',
    input_schema: {
      type: 'object',
      properties: {
        businessName: { type: 'string', description: 'Name of the business' },
        businessType: { type: 'string', description: 'Business category or trade (e.g. CA / Law office, Kirana)' },
        segment: { type: 'string', enum: ['prof', 'micro', 'multi', 'mfg'] },
        employeeCount: { type: 'integer', minimum: 1, description: 'Number of employees' },
        numSites: { type: 'integer', minimum: 1, description: 'Number of business physical locations / branches' },
        city: { type: 'string', description: 'City where business is located' },
        cityTier: { type: 'integer', enum: [1, 2] },
        currentInternet: { type: 'string', description: 'Current internet type (Mobile hotspot, Broadband, Leased line, etc.)' },
        currentProvider: { type: 'string', description: 'Current service provider' },
        monthlyTelecomSpend: { type: 'number', description: 'Current monthly spend on internet / telecom' },
        budgetMonthly: { type: 'number', description: 'Target monthly budget for connectivity' },
        hasGstin: { type: 'boolean', description: 'Whether the business holds a GSTIN registration' },
        gstin: { type: 'string', description: '15-character GSTIN if provided' },
        hasUdyam: { type: 'boolean', description: 'Whether the business holds a Udyam registration' },
        mustHaves: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key capabilities needed (backup_internet, static_ip, cctv, pos, email, security)',
        },
        contactRole: { type: 'string', description: 'Role of contact person (Owner, Manager, Admin)' },
      },
    },
  },
  {
    name: 'get_eligible_products',
    description: 'Fetch all Airtel products that this business profile is eligible for based on rules engine.',
    input_schema: {
      type: 'object',
      properties: {
        profile: { type: 'object', description: 'The business profile to evaluate' },
      },
      required: ['profile'],
    },
  },
  {
    name: 'build_bundle',
    description: 'Run authoritative rules engine to calculate Starter, Standard, and Resilient tiers for profile.',
    input_schema: {
      type: 'object',
      properties: {
        profile: { type: 'object', description: 'The business profile' },
        tierLabel: { type: 'string', enum: ['starter', 'standard', 'resilient'] },
      },
      required: ['profile'],
    },
  },
  {
    name: 'explain_removal',
    description: 'Evaluate rule-based impact of removing a product from a quote.',
    input_schema: {
      type: 'object',
      properties: {
        quoteId: { type: 'string', description: 'Quote ID' },
        productId: { type: 'string', description: 'Product ID to remove' },
      },
      required: ['quoteId', 'productId'],
    },
  },
  {
    name: 'preview_scenario',
    description: 'Run a simulated business preview scenario (fibre cut, budget cut, second site).',
    input_schema: {
      type: 'object',
      properties: {
        quoteId: { type: 'string', description: 'Quote ID' },
        scenario: { type: 'string', enum: ['link_failure', 'budget_cut', 'second_site'] },
      },
      required: ['quoteId', 'scenario'],
    },
  },
  {
    name: 'request_handoff',
    description: 'Route conversation to human advisor when complex requirements exceed automated self-serve.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Reason for human advisor escalation' },
      },
      required: ['reason'],
    },
  },
];

/**
 * Execute tool call with server-side rules engine and database.
 */
export async function executeToolCall(toolName, args, conversationContext = {}) {
  logger.info({ toolName, args }, 'Executing advisor tool call');

  switch (toolName) {
    case 'save_profile': {
      return { success: true, updatedProfile: args };
    }

    case 'get_eligible_products': {
      const products = await Product.find({ isActive: true }).lean();
      const eligible = getEligibleProducts(args.profile, products);
      return { eligibleProducts: eligible };
    }

    case 'build_bundle': {
      const products = await Product.find({ isActive: true }).lean();
      const res = buildBundles(args.profile, products, { mode: config.PRICING_MODE });
      return res;
    }

    case 'explain_removal': {
      const quote = await Quote.findOne({ quoteId: args.quoteId }).lean();
      if (!quote) throw new Error(`Quote ${args.quoteId} not found`);
      const explanation = explainRemoval(quote, args.productId, quote.profileSnapshot);
      return { explanation };
    }

    case 'preview_scenario': {
      const quote = await Quote.findOne({ quoteId: args.quoteId }).lean();
      if (!quote) throw new Error(`Quote ${args.quoteId} not found`);
      const products = await Product.find({ isActive: true }).lean();
      const preview = previewScenario(quote, args.scenario, quote.profileSnapshot, products);
      return { preview };
    }

    case 'request_handoff': {
      if (conversationContext.leadId) {
        await Lead.findByIdAndUpdate(conversationContext.leadId, {
          advisorStatus: 'open',
          notes: [{ text: `Human handoff requested: ${args.reason}`, createdAt: new Date() }],
        });
      }
      return { handoffRequested: true, reason: args.reason };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

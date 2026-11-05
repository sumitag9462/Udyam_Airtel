import { config } from './env.js';

export const ROLES = Object.freeze({
  OWNER: 'owner',
  ADVISOR: 'advisor',
  PARTNER: 'partner',
  ADMIN: 'admin',
});

export const STAGES = Object.freeze([
  'lead',
  'contacted',
  'needs_assessed',
  'quote_accepted',
  'kyc_complete',
  'activated',
]);

export const STAGE_ORDINALS = Object.freeze(
  Object.fromEntries(STAGES.map((stage, index) => [stage, index]))
);

export const ORDER_STATUSES = Object.freeze([
  'QUOTE_ACCEPTED',
  'KYC_PENDING',
  'KYC_ACTION_NEEDED',
  'KYC_IN_REVIEW',
  'KYC_VERIFIED',
  'FEASIBILITY_CHECK',
  'INSTALL_SCHEDULED',
  'INSTALLED',
  'ACTIVATED',
  'ON_HOLD',
  'CANCELLED',
]);

export const ORDER_TRANSITIONS = Object.freeze({
  QUOTE_ACCEPTED: ['KYC_PENDING', 'CANCELLED'],
  KYC_PENDING: ['KYC_ACTION_NEEDED', 'KYC_IN_REVIEW', 'KYC_VERIFIED', 'CANCELLED'],
  KYC_ACTION_NEEDED: ['KYC_PENDING', 'KYC_IN_REVIEW', 'CANCELLED'],
  KYC_IN_REVIEW: ['KYC_VERIFIED', 'KYC_ACTION_NEEDED', 'CANCELLED'],
  KYC_VERIFIED: ['FEASIBILITY_CHECK', 'CANCELLED'],
  FEASIBILITY_CHECK: ['INSTALL_SCHEDULED', 'ON_HOLD', 'CANCELLED'],
  INSTALL_SCHEDULED: ['INSTALLED', 'ON_HOLD', 'CANCELLED'],
  INSTALLED: ['ACTIVATED'],
  ACTIVATED: [],
  ON_HOLD: ['FEASIBILITY_CHECK', 'INSTALL_SCHEDULED', 'CANCELLED'],
  CANCELLED: [],
});

export const KYC_STATUSES = Object.freeze([
  'draft',
  'extracting',
  'action_needed',
  'in_review',
  'verified',
  'rejected',
  'withdrawn',
]);

export const ADVISOR_STATUSES = Object.freeze([
  'open',
  'abandoned',
  'handoff_requested',
  'no_valid_bundle',
  'kyc_blocked',
  'ordered',
]);

export const QUOTE_STATUSES = Object.freeze(['draft', 'accepted', 'expired', 'superseded']);

export const SEGMENTS = Object.freeze(['micro', 'prof', 'multi', 'mfg']);

export const SELF_SERVE_SEGMENTS = Object.freeze(
  config.SELF_SERVE_SEGMENTS.split(',').map((s) => s.trim())
);

export const RATE_LIMITS = Object.freeze({
  global: { windowMs: 15 * 60 * 1000, max: 300 },
  auth: { windowMs: 15 * 60 * 1000, max: 15 },
  otp: { windowMs: 15 * 60 * 1000, max: 5 },
  kyc: { windowMs: 15 * 60 * 1000, max: 20 },
  upload: { windowMs: 15 * 60 * 1000, max: 10 },
  llm: { windowMs: 60 * 1000, max: 10 },
});

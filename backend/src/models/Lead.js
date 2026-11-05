import mongoose from 'mongoose';
import { ADVISOR_STATUSES, SEGMENTS } from '../config/constants.js';

const leadSchema = new mongoose.Schema(
  {
    leadId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    origin: {
      type: String,
      enum: ['seed', 'live'],
      default: 'live',
      index: true,
    },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    createdDate: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Business profile
    businessName: { type: String, required: true, trim: true },
    businessType: { type: String, required: true, trim: true },
    segment: { type: String, enum: SEGMENTS, required: true, index: true },
    city: { type: String, required: true, trim: true, index: true },
    cityTier: { type: Number, required: true, enum: [1, 2] },
    state: { type: String, required: true, trim: true },
    preferredLanguage: { type: String, required: true, trim: true },
    employeeCount: { type: Number, required: true },
    numSites: { type: Number, required: true },
    turnoverBand: { type: String, trim: true },
    hasGstin: { type: Boolean, required: true },
    gstin: { type: String, trim: true, uppercase: true, index: true },
    hasUdyam: { type: Boolean, required: true },
    udyamNumber: { type: String, trim: true, uppercase: true, index: true },
    currentInternet: { type: String, trim: true },
    currentProvider: { type: String, trim: true },
    monthlyTelecomSpend: { type: Number },
    productsOfInterest: { type: [String], default: [] },
    contactName: { type: String, trim: true },
    contactRole: { type: String, trim: true },

    // Funnel & progression
    leadSource: { type: String, required: true, trim: true, index: true },
    stageReached: { type: String, required: true, trim: true },
    stageOrdinal: { type: Number, required: true, min: 0, max: 5, index: true },
    stageDates: {
      contacted: { type: Date },
      needsAssessed: { type: Date },
      quoteAccepted: { type: Date },
      kycComplete: { type: Date },
      activated: { type: Date },
    },
    outcome: { type: String, trim: true, index: true },
    dropReason: { type: String, trim: true },
    daysLeadToActivation: { type: Number },
    followUpCalls: { type: Number, default: 0 },

    // Bundle & commercial
    bundle: [
      {
        productId: { type: String, required: true },
        qty: { type: Number, required: true },
      },
    ],
    monthlyBundleValue: { type: Number },
    oneTimeSetup: { type: Number },
    contractMonths: { type: Number },
    churned6m: { type: Boolean },
    nps: { type: Number },
    acquisitionCost: { type: Number },

    // Back-office / Advisor status
    advisorStatus: {
      type: String,
      enum: ADVISOR_STATUSES,
      default: 'open',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedPartnerOrg: {
      type: String,
      trim: true,
      index: true,
    },
    notes: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    nextFollowUpDate: { type: Date },

    // Propensity scoring
    propensity: {
      score: { type: Number, min: 0, max: 100, index: true },
      reasons: { type: [String], default: [] },
      modelVersion: { type: String },
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

// Compound indexes for lead queue and reporting
leadSchema.index({ origin: 1, advisorStatus: 1, 'propensity.score': -1 });
leadSchema.index({ stageOrdinal: 1, outcome: 1 });

export const Lead = mongoose.model('Lead', leadSchema);

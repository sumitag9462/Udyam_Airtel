import mongoose from 'mongoose';
import { QUOTE_STATUSES } from '../config/constants.js';

const quoteSchema = new mongoose.Schema(
  {
    quoteId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: false,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true,
    },
    profileSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    tierLabel: {
      type: String,
      enum: ['starter', 'standard', 'resilient', 'custom'],
      required: true,
    },
    lineItems: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        unit: { type: String, required: true },
        qty: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        setupFee: { type: Number, required: true },
        lineMonthly: { type: Number, required: true },
        lineSetup: { type: Number, required: true },
      },
    ],
    monthlyTotal: {
      type: Number,
      required: true,
    },
    setupTotal: {
      type: Number,
      required: true,
    },
    contractMonths: {
      type: Number,
      required: true,
    },
    firstYearTotal: {
      type: Number,
      required: true,
    },
    pricingMode: {
      type: String,
      enum: ['min', 'mid', 'max'],
      default: 'min',
    },
    rulesVersion: {
      type: String,
      required: true,
    },
    priceHash: {
      type: String,
      required: true,
    },
    indicativeOnly: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: QUOTE_STATUSES,
      default: 'draft',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    acceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

export const Quote = mongoose.model('Quote', quoteSchema);

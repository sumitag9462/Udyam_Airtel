import mongoose from 'mongoose';
import { KYC_STATUSES } from '../config/constants.js';

const kycCaseSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    quoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
      required: false,
      index: true,
    },
    consentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consent',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    udyamNumber: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    status: {
      type: String,
      enum: KYC_STATUSES,
      default: 'draft',
      index: true,
    },
    extractedValues: {
      legalName: { type: String },
      tradeName: { type: String },
      signatoryName: { type: String },
      address: { type: String },
      pincode: { type: String },
      city: { type: String },
      state: { type: String },
      addressProofDate: { type: Date },
      userConfirmed: { type: Boolean, default: false },
    },
    checks: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        severity: { type: String, enum: ['fail', 'review', 'warn', 'info'], required: true },
        result: { type: String, enum: ['pass', 'fail', 'review', 'warn', 'info'], required: true },
        message: { type: String, required: true },
        fixAction: { type: String },
        evidence: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    decisionNote: {
      type: String,
    },
    decidedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

export const KycCase = mongoose.model('KycCase', kycCaseSchema);

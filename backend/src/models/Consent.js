import mongoose from 'mongoose';

const consentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    noticeVersion: {
      type: String,
      required: true,
    },
    purposes: {
      type: [String],
      required: true,
    },
    documentTypes: {
      type: [String],
      required: true,
    },
    givenAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    withdrawnAt: {
      type: Date,
    },
    ipHash: {
      type: String,
      required: true,
    },
    userAgentHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

export const Consent = mongoose.model('Consent', consentSchema);

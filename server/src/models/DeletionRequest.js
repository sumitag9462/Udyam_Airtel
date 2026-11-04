import mongoose from 'mongoose';

const deletionRequestSchema = new mongoose.Schema(
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
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      default: 'Requested under DPDP Act 2023 Section 12 (Right to Erasure)',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected'],
      default: 'pending',
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    acknowledgedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    retentionNote: {
      type: String,
      default: 'Statutory compliance data (telecom CDRs, tax records) retained under mandatory regulatory timelines.',
    },
  },
  {
    timestamps: true,
  }
);

export const DeletionRequest = mongoose.model('DeletionRequest', deletionRequestSchema);

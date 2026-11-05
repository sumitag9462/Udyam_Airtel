import mongoose from 'mongoose';

export const EVENT_TYPES = [
  'session_started',
  'profile_complete',
  'quote_viewed',
  'quote_accepted',
  'consent_given',
  'kyc_flagged',
  'kyc_verified',
  'order_created',
  'help_requested',
];

const eventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: EVENT_TYPES,
      required: true,
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    at: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: false,
  }
);

eventSchema.index({ type: 1, createdAt: -1 });

export const Event = mongoose.model('Event', eventSchema);

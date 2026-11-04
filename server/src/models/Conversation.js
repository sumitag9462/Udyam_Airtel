import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    language: {
      type: String,
      default: 'en',
    },
    state: {
      type: String,
      required: true,
      default: 'GREETING',
    },
    questionCount: {
      type: Number,
      default: 0,
    },
    profile: {
      businessType: { type: String },
      segment: { type: String },
      employeeCount: { type: Number },
      numSites: { type: Number },
      city: { type: String },
      cityTier: { type: Number },
      currentInternet: { type: String },
      monthlyTelecomSpend: { type: Number },
      budgetMonthly: { type: Number },
      mustHaves: { type: [String], default: [] },
      mobileLines: { type: Number },
      devices: { type: Number },
      cameras: { type: Number },
      hasGstin: { type: Boolean },
      gstin: { type: String },
      language: { type: String },
    },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
        text: { type: String, required: true },
        ui: { type: mongoose.Schema.Types.Mixed },
        toolCalls: [
          {
            toolName: { type: String },
            args: { type: mongoose.Schema.Types.Mixed },
            result: { type: mongoose.Schema.Types.Mixed },
          },
        ],
        guardAction: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    lastToolResults: {
      type: mongoose.Schema.Types.Mixed,
    },
    provider: {
      type: String,
      enum: ['anthropic', 'mock'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'handed_off', 'abandoned'],
      default: 'active',
      index: true,
    },
    summary: {
      type: String,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

export const Conversation = mongoose.model('Conversation', conversationSchema);

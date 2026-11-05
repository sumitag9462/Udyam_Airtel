import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: ['sms', 'whatsapp', 'email'],
      required: true,
    },
    toMasked: {
      type: String,
      required: true,
      trim: true,
    },
    template: {
      type: String,
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    simulated: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

export const Notification = mongoose.model('Notification', notificationSchema);

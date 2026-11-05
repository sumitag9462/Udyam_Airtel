import mongoose from 'mongoose';

const otpChallengeSchema = new mongoose.Schema(
  {
    phoneHash: {
      type: String,
      required: true,
      index: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

export const OtpChallenge = mongoose.model('OtpChallenge', otpChallengeSchema);

import mongoose from 'mongoose';

const cityTierSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    tier: {
      type: Number,
      required: true,
      enum: [1, 2],
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

export const CityTier = mongoose.model('CityTier', cityTierSchema);

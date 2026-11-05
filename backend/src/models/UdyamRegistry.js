import mongoose from 'mongoose';

const udyamRegistrySchema = new mongoose.Schema(
  {
    udyamNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    enterpriseName: {
      type: String,
      required: true,
      trim: true,
    },
    enterpriseType: {
      type: String,
      trim: true,
    },
    majorActivity: {
      type: String,
      trim: true,
    },
    nicDescription: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfRegistration: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

export const UdyamRegistry = mongoose.model('UdyamRegistry', udyamRegistrySchema);

import mongoose from 'mongoose';

const gstinRegistrySchema = new mongoose.Schema(
  {
    gstin: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    legalName: {
      type: String,
      required: true,
      trim: true,
    },
    tradeName: {
      type: String,
      trim: true,
    },
    constitution: {
      type: String,
      trim: true,
    },
    principalPlaceOfBusiness: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    registrationDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'Cancelled', 'Suspended'],
      index: true,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

export const GstinRegistry = mongoose.model('GstinRegistry', gstinRegistrySchema);

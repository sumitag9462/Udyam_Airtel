import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    priceMinInrPerMonth: {
      type: Number,
      required: true,
    },
    priceMaxInrPerMonth: {
      type: Number,
      required: true,
    },
    oneTimeSetupInr: {
      type: Number,
      required: true,
    },
    minContractMonths: {
      type: Number,
      required: true,
    },
    availableCityTiers: {
      type: [Number],
      required: true,
    },
    minEmployees: {
      type: Number,
      required: true,
    },
    minSites: {
      type: Number,
      required: true,
    },
    requiresGstin: {
      type: Boolean,
      required: true,
    },
    requiresOneOf: {
      type: [String],
      default: [],
    },
    typicalInstallDays: {
      type: Number,
      required: true,
    },
    targetSegments: {
      type: [String],
      required: true,
    },
    rulesVersion: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

export const Product = mongoose.model('Product', productSchema);

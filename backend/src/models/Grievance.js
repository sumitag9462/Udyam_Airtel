import mongoose from 'mongoose';

const grievanceSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    category: {
      type: String,
      enum: ['consent_withdrawal', 'data_correction', 'erasure', 'service_delay', 'billing', 'other'],
      required: true,
    },
    details: {
      type: String,
      required: true,
      trim: true,
    },
    contactPhoneMasked: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['received', 'under_investigation', 'resolved'],
      default: 'received',
      index: true,
    },
    officerAssigned: {
      type: String,
      default: 'Data Protection Officer (DPO) / Nodal Officer, Airtel Business',
    },
    resolution: {
      type: String,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Grievance = mongoose.model('Grievance', grievanceSchema);

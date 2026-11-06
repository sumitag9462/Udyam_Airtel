import mongoose from 'mongoose';
import { ORDER_STATUSES } from '../config/constants.js';

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    quoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
      required: true,
      index: true,
    },
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
    kycCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KycCase',
      index: true,
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'QUOTE_ACCEPTED',
      index: true,
    },
    timeline: [
      {
        status: { type: String, enum: ORDER_STATUSES, required: true },
        at: { type: Date, default: Date.now, required: true },
        simulated: { type: Boolean, default: false },
        note: { type: String },
      },
    ],
    pendingActions: [
      {
        action: { type: String, required: true },
        message: { type: String, required: true },
        actionType: { type: String, enum: ['reupload', 'confirm_value', 'pay', 'slot_select'] },
      },
    ],
    estimatedActivation: {
      type: Date,
      required: true,
    },
    estimatedActivationReason: {
      type: String,
    },
    feasibility: {
      result: { type: String, enum: ['passed', 'failed', 'pending'], default: 'pending' },
      reason: { type: String },
      checkedAt: { type: Date },
      alternativeOffered: { type: Boolean, default: false },
    },
    selectedSlot: {
      slotDate: { type: Date },
      timeWindow: { type: String },
      confirmedAt: { type: Date },
    },
    assignedPartner: {
      type: String,
      trim: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eSignRecord: {
      quoteHash: { type: String },
      signedAt: { type: Date },
      otpVerified: { type: Boolean },
    },
    paymentRecord: {
      amountInr: { type: Number },
      status: { type: String, enum: ['success', 'failed', 'pending'] },
      paidAt: { type: Date },
      simulated: { type: Boolean, default: true },
    },
    telemetry: {
      opticalSignalDbm: { type: Number, default: -19.4 },
      lightLossDb: { type: Number, default: 0.8 },
      snrDb: { type: Number, default: 34.5 },
      lastTechnicianNote: { type: String },
      lastUpdated: { type: Date },
    },
    history: [
      {
        status: { type: String },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

export const Order = mongoose.model('Order', orderSchema);

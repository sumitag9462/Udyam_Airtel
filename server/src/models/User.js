import mongoose from 'mongoose';
import { ROLES } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      index: true,
    },
    phoneHash: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
    phoneLast4: {
      type: String,
      maxlength: 4,
    },
    email: {
      type: String,
      sparse: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    partnerOrg: {
      type: String,
      trim: true,
      index: true,
    },
    language: {
      type: String,
      default: 'en',
    },
    lastLoginAt: {
      type: Date,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

export const User = mongoose.model('User', userSchema);

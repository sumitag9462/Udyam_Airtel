import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    kycCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KycCase',
      required: true,
      index: true,
    },
    docType: {
      type: String,
      enum: ['gst_certificate', 'udyam_certificate', 'signatory_id', 'address_proof'],
      required: true,
      index: true,
    },
    storageKey: {
      type: String,
      required: true,
      unique: true,
    },
    mime: {
      type: String,
      required: true,
      enum: ['image/jpeg', 'image/png', 'application/pdf'],
    },
    sizeBytes: {
      type: Number,
      required: true,
    },
    sha256: {
      type: String,
      required: true,
      index: true,
    },
    extracted: {
      fields: { type: mongoose.Schema.Types.Mixed },
      confidence: { type: Map, of: Number },
    },
    quality: {
      width: { type: Number },
      height: { type: Number },
      blurScore: { type: Number },
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    deleteAfter: {
      type: Date,
      index: { expires: 0 }, // TTL index
    },
    legalHold: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

export const Document = mongoose.model('Document', documentSchema);

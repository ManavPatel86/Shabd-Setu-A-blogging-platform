import mongoose from "mongoose";

const verificationTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    email: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    purpose: {
      type: String,
      enum: ["password-reset"],
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
    },
    lastSentAt: {
      type: Date,
    },
    resendCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
verificationTokenSchema.index({ userId: 1, purpose: 1 });
verificationTokenSchema.index({ email: 1, purpose: 1 });

const VerificationToken = mongoose.model(
  "VerificationToken",
  verificationTokenSchema
);

export default VerificationToken;

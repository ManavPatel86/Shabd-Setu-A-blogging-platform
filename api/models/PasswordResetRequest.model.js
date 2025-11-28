import mongoose from "mongoose";

const passwordResetRequestSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    requestedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

const PasswordResetRequest = mongoose.model(
  "PasswordResetRequest",
  passwordResetRequestSchema
);

export default PasswordResetRequest;

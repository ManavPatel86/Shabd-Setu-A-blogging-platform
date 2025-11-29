import mongoose from 'mongoose';

const OtpCodeSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  lastSentAt: { type: Date, default: Date.now },
  resendCount: { type: Number, default: 0 },
  attempts: { type: Number, default: 0 },
  pendingUser: {
    username: { type: String },
    name: { type: String },
    passwordHash: { type: String },
    role: { type: String, default: 'user' },
    avatar: { type: String }
  }
});

// TTL index will remove document after expiresAt
OtpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpCode = mongoose.model('OtpCode', OtpCodeSchema);
export default OtpCode;

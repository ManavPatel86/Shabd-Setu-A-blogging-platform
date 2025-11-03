import mongoose from 'mongoose';

const OtpCodeSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true },
  lastSentAt: { type: Date, default: Date.now },
  attempts: { type: Number, default: 0 } // number of verify attempts
});

// TTL index will remove document after expiresAt
OtpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpCode = mongoose.model('OtpCode', OtpCodeSchema);
export default OtpCode;

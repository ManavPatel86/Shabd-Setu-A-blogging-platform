// /api/models/report.model.js
// MongoDB model for blog reports

import mongoose from 'mongoose';

const { Schema } = mongoose;

const reportSchema = new Schema({
  reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  blogId: { type: Schema.Types.ObjectId, ref: 'Blog', required: true },
  reason: { type: String, trim: true, default: '' }, // e.g. Hate speech, Spam, etc.
  type: { type: String, enum: ['Hate speech', 'Spam', 'Harassment', 'NSFW', 'Fake Info', 'Other'], required: true },
  status: { type: String, enum: ['pending', 'resolved', 'safe', 'removed', 'banned'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

reportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Report = mongoose.model('Report', reportSchema, 'reports');

export default Report;
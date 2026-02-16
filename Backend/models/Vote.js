import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  pollId: {
    type: String,
    required: true,
    ref: 'Poll',
    index: true
  },
  optionId: {
    type: String,
    required: true,
    index: true
  },
  fingerprint: {
    type: String,
    required: true,
    index: true
  },
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  userAgent: {
    type: String,
    required: true
  },
  votedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

voteSchema.index({ pollId: 1, fingerprint: 1 }, { unique: true });
voteSchema.index({ pollId: 1, ipAddress: 1, votedAt: -1 });
voteSchema.index({ pollId: 1, optionId: 1 });

export default mongoose.model('Vote', voteSchema);
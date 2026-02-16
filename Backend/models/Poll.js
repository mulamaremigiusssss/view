import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  }
}, { _id: false });

const pollSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  options: {
    type: [optionSchema],
    validate: {
      validator: function(arr) {
        return arr.length >= 2 && arr.length <= 10;
      },
      message: 'Poll must have between 2 and 10 options'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

pollSchema.index({ createdAt: -1 });

export default mongoose.model('Poll', pollSchema);
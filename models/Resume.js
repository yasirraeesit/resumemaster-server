import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  data: {
    type: Object,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Resume = mongoose.model('Resume', resumeSchema);
export default Resume;

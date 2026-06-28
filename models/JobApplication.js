import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  salary: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['wishlist', 'applied', 'interviewing', 'offered', 'rejected'],
    default: 'wishlist'
  },
  date: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  },
  notes: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    trim: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  coverLetterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
export default JobApplication;

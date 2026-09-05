import mongoose, { Document, Schema } from 'mongoose';

export interface ITrainingEnrollment extends Document {
  userId: mongoose.Types.ObjectId;
  programId: mongoose.Types.ObjectId;
  status: 'nominated' | 'approved' | 'rejected' | 'attended' | 'completed' | 'certified' | 'withdrawn';
  nominatedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  nominationDate: Date;
  approvalDate?: Date;
  completionDate?: Date;
  feedback?: { rating: number; comments: string; learningOutcome: string };
  certificateUrl?: string;
  certificateId?: mongoose.Types.ObjectId;
  attemptsCount: number;
  lastFailedAttemptAt?: Date;
  lastPassedAttemptAt?: Date;
  rejectionReason?: string;
}

const trainingEnrollmentSchema = new Schema<ITrainingEnrollment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    programId: { type: Schema.Types.ObjectId, ref: 'TrainingProgram', required: true },
    status: {
      type: String,
      enum: ['nominated', 'approved', 'rejected', 'attended', 'completed', 'certified', 'withdrawn'],
      default: 'nominated',
    },
    nominatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    nominationDate: { type: Date, default: Date.now },
    approvalDate: Date,
    completionDate: Date,
    feedback: { rating: Number, comments: String, learningOutcome: String },
    certificateUrl: String,
    certificateId: { type: Schema.Types.ObjectId, ref: 'Certificate' },
    attemptsCount: { type: Number, default: 0 },
    lastFailedAttemptAt: Date,
    lastPassedAttemptAt: Date,
    rejectionReason: String,
  },
  { timestamps: true }
);

export default mongoose.model<ITrainingEnrollment>('TrainingEnrollment', trainingEnrollmentSchema);

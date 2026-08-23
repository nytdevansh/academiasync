import mongoose, { Document, Schema } from 'mongoose';

export interface ITrainingEnrollment extends Document {
  userId: mongoose.Types.ObjectId;
  programId: mongoose.Types.ObjectId;
  status: 'nominated' | 'approved' | 'rejected' | 'attended' | 'completed' | 'withdrawn';
  nominatedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  nominationDate: Date;
  approvalDate?: Date;
  completionDate?: Date;
  feedback?: { rating: number; comments: string; learningOutcome: string };
  certificateUrl?: string;
  rejectionReason?: string;
}

const trainingEnrollmentSchema = new Schema<ITrainingEnrollment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    programId: { type: Schema.Types.ObjectId, ref: 'TrainingProgram', required: true },
    status: { type: String, enum: ['nominated', 'approved', 'rejected', 'attended', 'completed', 'withdrawn'], default: 'nominated' },
    nominatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    nominationDate: { type: Date, default: Date.now },
    approvalDate: Date,
    completionDate: Date,
    feedback: { rating: Number, comments: String, learningOutcome: String },
    certificateUrl: String,
    rejectionReason: String,
  },
  { timestamps: true }
);

export default mongoose.model<ITrainingEnrollment>('TrainingEnrollment', trainingEnrollmentSchema);

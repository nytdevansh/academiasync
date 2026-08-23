import mongoose, { Document, Schema } from 'mongoose';

export interface IAppraisal extends Document {
  userId: mongoose.Types.ObjectId;
  cycleId: mongoose.Types.ObjectId;
  selfAssessment: {
    criteria: { criterionId: mongoose.Types.ObjectId; score: number; remarks?: string }[];
    submittedAt?: Date;
    status: 'draft' | 'submitted';
  };
  reviewerAssessment?: {
    reviewerId: mongoose.Types.ObjectId;
    criteria: { criterionId: mongoose.Types.ObjectId; score: number; remarks?: string }[];
    overallRemarks: string;
    submittedAt: Date;
  };
  finalScore?: number;
  status: 'draft' | 'self_submitted' | 'under_review' | 'completed';
}

const criterionScoreSchema = new Schema({ criterionId: Schema.Types.ObjectId, score: Number, remarks: String }, { _id: false });

const appraisalSchema = new Schema<IAppraisal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cycleId: { type: Schema.Types.ObjectId, ref: 'AppraisalCycle', required: true },
    selfAssessment: {
      criteria: [criterionScoreSchema],
      submittedAt: Date,
      status: { type: String, enum: ['draft', 'submitted'], default: 'draft' },
    },
    reviewerAssessment: {
      reviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
      criteria: [criterionScoreSchema],
      overallRemarks: String,
      submittedAt: Date,
    },
    finalScore: Number,
    status: { type: String, enum: ['draft', 'self_submitted', 'under_review', 'completed'], default: 'draft' },
  },
  { timestamps: true }
);

export default mongoose.model<IAppraisal>('Appraisal', appraisalSchema);

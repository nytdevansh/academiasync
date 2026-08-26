import mongoose, { Document, Schema } from 'mongoose';

export type AssessmentResponseStatus = 'in_progress' | 'submitted' | 'reviewed';

export interface IAssessmentAnswer {
  questionId: mongoose.Types.ObjectId;
  answer: any;
  score?: number;
  feedback?: string;
}

export interface IAssessmentResponse extends Document {
  assessmentId: mongoose.Types.ObjectId;
  facultyId: mongoose.Types.ObjectId;
  attemptNumber: number;
  answers: IAssessmentAnswer[];
  totalScore: number;
  maxScore: number;
  status: AssessmentResponseStatus;
  startedAt?: Date;
  submittedAt?: Date;
  timeTakenSeconds?: number;
  reviewerNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const assessmentAnswerSchema = new Schema<IAssessmentAnswer>(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    answer: { type: Schema.Types.Mixed },
    score: { type: Number, default: 0, min: 0 },
    feedback: { type: String, trim: true },
  },
  { _id: false }
);

const assessmentResponseSchema = new Schema<IAssessmentResponse>(
  {
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
      index: true,
    },
    facultyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    attemptNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
    answers: [assessmentAnswerSchema],
    totalScore: { type: Number, default: 0, min: 0 },
    maxScore: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'reviewed'],
      default: 'submitted',
      index: true,
    },
    startedAt: { type: Date },
    submittedAt: { type: Date },
    timeTakenSeconds: { type: Number, default: 0 },
    reviewerNotes: { type: String, trim: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

// Enforce uniqueness per assessment, user, and attempt
assessmentResponseSchema.index(
  { assessmentId: 1, facultyId: 1, attemptNumber: 1 },
  { unique: true }
);
assessmentResponseSchema.index({ assessmentId: 1, status: 1 });
assessmentResponseSchema.index({ facultyId: 1, createdAt: -1 });

export default mongoose.model<IAssessmentResponse>('AssessmentResponse', assessmentResponseSchema);

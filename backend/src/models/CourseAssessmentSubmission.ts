import mongoose, { Document, Schema } from 'mongoose';

export interface IAssessmentAnswer {
  questionIndex: number;
  selectedOption?: number;
  answerText?: string;
  fileUrl?: string;
  score?: number;
  feedback?: string;
}

export interface ICourseAssessmentSubmission extends Document {
  assessmentId: mongoose.Types.ObjectId;
  programId: mongoose.Types.ObjectId;
  enrollmentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  answers: IAssessmentAnswer[];
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  passed: boolean;
  status: 'submitted' | 'graded';
  gradedBy?: mongoose.Types.ObjectId | string;
  submittedAt: Date;
  gradedAt?: Date;
}

const assessmentAnswerSchema = new Schema<IAssessmentAnswer>(
  {
    questionIndex: { type: Number, required: true },
    selectedOption: Number,
    answerText: String,
    fileUrl: String,
    score: { type: Number, default: 0 },
    feedback: String,
  },
  { _id: false }
);

const courseAssessmentSubmissionSchema = new Schema<ICourseAssessmentSubmission>(
  {
    assessmentId: { type: Schema.Types.ObjectId, ref: 'CourseAssessment', required: true },
    programId: { type: Schema.Types.ObjectId, ref: 'TrainingProgram', required: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'TrainingEnrollment', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [assessmentAnswerSchema],
    totalScore: { type: Number, default: 0 },
    maxPossibleScore: { type: Number, default: 100 },
    percentageScore: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
    gradedBy: { type: Schema.Types.Mixed },
    submittedAt: { type: Date, default: Date.now },
    gradedAt: Date,
  },
  { timestamps: true }
);

courseAssessmentSubmissionSchema.index({ enrollmentId: 1 }, { unique: true });
courseAssessmentSubmissionSchema.index({ programId: 1, userId: 1 });

export default mongoose.model<ICourseAssessmentSubmission>('CourseAssessmentSubmission', courseAssessmentSubmissionSchema);

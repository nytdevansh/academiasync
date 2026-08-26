import mongoose, { Document, Schema } from 'mongoose';

export interface IAssessmentQuestion {
  prompt: string;
  type: 'mcq' | 'short_answer' | 'file_upload';
  options?: string[];
  correctAnswer?: number; // 0-based index for MCQ
  maxScore: number;
  rubricGuide?: string;
}

export interface ICourseAssessment extends Document {
  programId: mongoose.Types.ObjectId;
  title: string;
  instructions?: string;
  passingScore: number; // percentage (e.g. 60)
  timeLimitMinutes?: number;
  questions: IAssessmentQuestion[];
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
}

const assessmentQuestionSchema = new Schema<IAssessmentQuestion>(
  {
    prompt: { type: String, required: true },
    type: { type: String, enum: ['mcq', 'short_answer', 'file_upload'], default: 'mcq' },
    options: [String],
    correctAnswer: Number,
    maxScore: { type: Number, default: 10 },
    rubricGuide: String,
  },
  { _id: true }
);

const courseAssessmentSchema = new Schema<ICourseAssessment>(
  {
    programId: { type: Schema.Types.ObjectId, ref: 'TrainingProgram', required: true, unique: true },
    title: { type: String, required: true },
    instructions: String,
    passingScore: { type: Number, default: 60, min: 0, max: 100 },
    timeLimitMinutes: { type: Number, default: 45 },
    questions: [assessmentQuestionSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ICourseAssessment>('CourseAssessment', courseAssessmentSchema);

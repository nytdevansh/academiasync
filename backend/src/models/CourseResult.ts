import mongoose, { Document, Schema } from 'mongoose';

export interface ICourseAnswer {
  questionIndex: number;
  prompt?: string;
  type?: 'mcq' | 'short_answer' | 'file_upload';
  selectedOption?: number;
  answerText?: string;
  fileUrl?: string;
  score: number;
  maxScore: number;
  feedback?: string;
  isCorrect?: boolean;
}

export interface ICourseResult extends Document {
  enrollmentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  assessmentId: mongoose.Types.ObjectId;
  attemptNumber: number;
  score: number; // percentage (0–100)
  totalScore: number;
  maxPossibleScore: number;
  passingScore: number;
  passed: boolean | null; // null if pending manual grading; true/false once graded
  status: 'pending' | 'graded';
  gradedBy?: mongoose.Types.ObjectId | string;
  gradedAt?: Date;
  answers: ICourseAnswer[];
  certificateId?: mongoose.Types.ObjectId;
  timeSpentSeconds?: number;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const courseAnswerSchema = new Schema<ICourseAnswer>(
  {
    questionIndex: { type: Number, required: true },
    prompt: String,
    type: { type: String, enum: ['mcq', 'short_answer', 'file_upload'], default: 'mcq' },
    selectedOption: Number,
    answerText: { type: String, maxlength: 2000 },
    fileUrl: String,
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 10 },
    feedback: String,
    isCorrect: Boolean,
  },
  { _id: false }
);

const courseResultSchema = new Schema<ICourseResult>(
  {
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'TrainingEnrollment', required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'TrainingProgram', required: true, index: true },
    assessmentId: { type: Schema.Types.ObjectId, ref: 'CourseAssessment', required: true },
    attemptNumber: { type: Number, required: true },
    score: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    maxPossibleScore: { type: Number, default: 0 },
    passingScore: { type: Number, default: 60 },
    passed: { type: Boolean, default: null },
    status: { type: String, enum: ['pending', 'graded'], default: 'graded' },
    gradedBy: { type: Schema.Types.Mixed },
    gradedAt: Date,
    answers: [courseAnswerSchema],
    certificateId: { type: Schema.Types.ObjectId, ref: 'Certificate' },
    timeSpentSeconds: Number,
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Unique index: exactly one result record per attempt number within an enrollment
courseResultSchema.index({ enrollmentId: 1, attemptNumber: 1 }, { unique: true });
courseResultSchema.index({ teacherId: 1, courseId: 1 });
courseResultSchema.index({ courseId: 1, completedAt: -1 });

export default mongoose.model<ICourseResult>('CourseResult', courseResultSchema);

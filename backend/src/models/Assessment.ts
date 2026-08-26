import mongoose, { Document, Schema } from 'mongoose';

export type AssessmentQuestionType = 'mcq' | 'text' | 'rating' | 'boolean';
export type AssessmentScopeType = 'department' | 'individual' | 'role' | 'all';
export type AssessmentStatus = 'draft' | 'published' | 'closed';

export interface IAssessmentQuestion {
  _id?: mongoose.Types.ObjectId;
  prompt: string;
  type: AssessmentQuestionType;
  options?: string[];
  correctAnswer?: any; // number index or string for mcq, boolean for boolean
  points?: number;
  rubricGuide?: string;
  competencyId?: mongoose.Types.ObjectId;
}

export interface IAssessmentTargetScope {
  type: AssessmentScopeType;
  targetIds?: mongoose.Types.ObjectId[];
}

export interface IAssessmentSettings {
  isGraded: boolean;
  isAnonymous: boolean;
  allowRetake: boolean;
  maxAttempts?: number;
  timeLimitMinutes?: number;
  dueDate?: Date;
}

export interface IAssessment extends Document {
  title: string;
  description?: string;
  topic: string;
  createdBy: mongoose.Types.ObjectId;
  createdByRole: 'hod' | 'dean' | 'administrator';
  targetScope: IAssessmentTargetScope;
  questions: IAssessmentQuestion[];
  settings: IAssessmentSettings;
  status: AssessmentStatus;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const assessmentQuestionSchema = new Schema<IAssessmentQuestion>(
  {
    prompt: { type: String, required: true },
    type: {
      type: String,
      enum: ['mcq', 'text', 'rating', 'boolean'],
      required: true,
      default: 'mcq',
    },
    options: [{ type: String }],
    correctAnswer: { type: Schema.Types.Mixed },
    points: { type: Number, default: 1, min: 0 },
    rubricGuide: { type: String },
    competencyId: { type: Schema.Types.ObjectId, ref: 'SkillArea' },
  },
  { _id: true }
);

const assessmentSchema = new Schema<IAssessment>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    topic: { type: String, required: true, trim: true, default: 'General' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByRole: {
      type: String,
      enum: ['hod', 'dean', 'administrator'],
      required: true,
    },
    targetScope: {
      type: {
        type: String,
        enum: ['department', 'individual', 'role', 'all'],
        required: true,
        default: 'all',
      },
      targetIds: [{ type: Schema.Types.ObjectId }],
    },
    questions: [assessmentQuestionSchema],
    settings: {
      isGraded: { type: Boolean, default: true },
      isAnonymous: { type: Boolean, default: false },
      allowRetake: { type: Boolean, default: false },
      maxAttempts: { type: Number, default: 1, min: 1 },
      timeLimitMinutes: { type: Number, min: 1 },
      dueDate: { type: Date },
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed'],
      default: 'draft',
      index: true,
    },
    isTemplate: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

assessmentSchema.index({ createdBy: 1, status: 1 });
assessmentSchema.index({ 'targetScope.type': 1 });
assessmentSchema.index({ topic: 1 });

export default mongoose.model<IAssessment>('Assessment', assessmentSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface ICourseModule {
  _id?: mongoose.Types.ObjectId;
  title: string;
  order: number;
  type: 'video' | 'document' | 'link' | 'quiz';
  contentUrl: string;
  durationMinutes?: number;
  isRequired: boolean;
  description?: string;
}

export interface ICourseContent extends Document {
  programId: mongoose.Types.ObjectId;
  externalCourseUrl?: string;
  externalLmsProvider?: string; // e.g. 'Coursera', 'NPTEL', 'SWAYAM', 'edX', 'Internal'
  modules: ICourseModule[];
  passingAttendancePercentage: number;
  createdBy: mongoose.Types.ObjectId;
}

const courseModuleSchema = new Schema<ICourseModule>(
  {
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
    type: { type: String, enum: ['video', 'document', 'link', 'quiz'], default: 'document' },
    contentUrl: { type: String, required: true },
    durationMinutes: { type: Number, default: 30 },
    isRequired: { type: Boolean, default: true },
    description: String,
  },
  { _id: true }
);

const courseContentSchema = new Schema<ICourseContent>(
  {
    programId: { type: Schema.Types.ObjectId, ref: 'TrainingProgram', required: true, unique: true },
    externalCourseUrl: String,
    externalLmsProvider: { type: String, default: 'Internal' },
    modules: [courseModuleSchema],
    passingAttendancePercentage: { type: Number, default: 75, min: 0, max: 100 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ICourseContent>('CourseContent', courseContentSchema);

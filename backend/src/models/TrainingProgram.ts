import mongoose, { Document, Schema } from 'mongoose';

export interface ITrainingProgram extends Document {
  title: string;
  type: 'FDP' | 'Workshop' | 'Seminar' | 'Conference' | 'MOOC' | 'Other';
  description: string;
  organizer: string;
  venue?: string;
  mode: 'online' | 'offline' | 'hybrid';
  startDate: Date;
  endDate: Date;
  capacity?: number;
  registrationDeadline?: Date;
  targetDepartments: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  tags: string[];
  // Aggregate effectiveness — updated on each enrollment completion
  effectiveness: {
    avgImprovementDelta: number; // avg (scoreAfter - scoreBefore) across recommendations
    avgFacultyRating: number;    // avg enrollment.feedback.rating
    completionRate: number;      // completed / total enrolled (0–100)
    totalCompletions: number;
    lastUpdated?: Date;
  };
}

const trainingProgramSchema = new Schema<ITrainingProgram>(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ['FDP', 'Workshop', 'Seminar', 'Conference', 'MOOC', 'Other'], required: true },
    description: { type: String, required: true },
    organizer: { type: String, required: true },
    venue: String,
    mode: { type: String, enum: ['online', 'offline', 'hybrid'], default: 'offline' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    capacity: Number,
    registrationDeadline: Date,
    targetDepartments: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    tags: [String],
    effectiveness: {
      avgImprovementDelta: { type: Number, default: 0 },
      avgFacultyRating:    { type: Number, default: 0 },
      completionRate:      { type: Number, default: 0 },
      totalCompletions:    { type: Number, default: 0 },
      lastUpdated:         Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITrainingProgram>('TrainingProgram', trainingProgramSchema);

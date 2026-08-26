import mongoose, { Document, Schema } from 'mongoose';

export interface IModuleProgress extends Document {
  userId: mongoose.Types.ObjectId;
  programId: mongoose.Types.ObjectId;
  moduleId: string;
  completedAt: Date;
  secondsWatched?: number;
}

const moduleProgressSchema = new Schema<IModuleProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    programId: { type: Schema.Types.ObjectId, ref: 'TrainingProgram', required: true },
    moduleId: { type: String, required: true },
    completedAt: { type: Date, default: Date.now },
    secondsWatched: { type: Number, default: 0 },
  },
  { timestamps: true }
);

moduleProgressSchema.index({ userId: 1, programId: 1, moduleId: 1 }, { unique: true });
moduleProgressSchema.index({ userId: 1, programId: 1 });

export default mongoose.model<IModuleProgress>('ModuleProgress', moduleProgressSchema);

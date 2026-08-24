import mongoose, { Document, Schema } from 'mongoose';

export interface ITrainingRecommendation extends Document {
  facultyId: mongoose.Types.ObjectId;
  programId?: mongoose.Types.ObjectId;       // optional: link to an existing TrainingProgram
  skillAreaId?: mongoose.Types.ObjectId;     // the competency gap this addresses
  recommendedBy: mongoose.Types.ObjectId;    // HOD / Dean / Admin user
  recommendedDate: Date;
  reason: string;                            // e.g. "Research score below target — needs academic writing FDP"
  dueDate: Date;
  status: 'pending' | 'enrolled' | 'completed' | 'overdue' | 'ignored';
  // Competency snapshot for before/after delta reporting
  scoreBeforeRecommendation?: number;
  scoreAfterCompletion?: number;
  improvementDelta?: number;                 // scoreAfter - scoreBefore (computed on completion)
  // Traceability
  enrollmentId?: mongoose.Types.ObjectId;    // linked TrainingEnrollment once faculty nominates
  notes?: string;
  declineReason?: string;
  declinedAt?: Date;
}

const trainingRecommendationSchema = new Schema<ITrainingRecommendation>(
  {
    facultyId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    programId:       { type: Schema.Types.ObjectId, ref: 'TrainingProgram' },
    skillAreaId:     { type: Schema.Types.ObjectId, ref: 'SkillArea' },
    recommendedBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recommendedDate: { type: Date, default: Date.now },
    reason:          { type: String, required: true },
    dueDate:         { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'enrolled', 'completed', 'overdue', 'ignored'],
      default: 'pending',
    },
    scoreBeforeRecommendation: { type: Number, min: 0, max: 100 },
    scoreAfterCompletion:      { type: Number, min: 0, max: 100 },
    improvementDelta:          { type: Number },
    enrollmentId:  { type: Schema.Types.ObjectId, ref: 'TrainingEnrollment' },
    notes:         String,
    declineReason: String,
    declinedAt:    Date,
  },
  { timestamps: true }
);

trainingRecommendationSchema.index({ facultyId: 1, status: 1 });
trainingRecommendationSchema.index({ recommendedBy: 1 });
trainingRecommendationSchema.index({ dueDate: 1, status: 1 }); // for the overdue cron query
trainingRecommendationSchema.index({ skillAreaId: 1 });

export default mongoose.model<ITrainingRecommendation>('TrainingRecommendation', trainingRecommendationSchema);

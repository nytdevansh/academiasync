import mongoose, { Document, Schema } from 'mongoose';

export interface ICompetencyRecord extends Document {
  userId: mongoose.Types.ObjectId;
  skillArea: mongoose.Types.ObjectId;
  currentLevel: 'beginner' | 'developing' | 'proficient' | 'advanced' | 'expert';
  targetLevel: 'beginner' | 'developing' | 'proficient' | 'advanced' | 'expert';
  lastAssessedDate?: Date;
  assessedBy?: mongoose.Types.ObjectId;
  gapsIdentified?: string[];
  notes?: string;
}

const competencyRecordSchema = new Schema<ICompetencyRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    skillArea: { type: Schema.Types.ObjectId, ref: 'SkillArea', required: true },
    currentLevel: { type: String, enum: ['beginner', 'developing', 'proficient', 'advanced', 'expert'], required: true },
    targetLevel: { type: String, enum: ['beginner', 'developing', 'proficient', 'advanced', 'expert'], required: true },
    lastAssessedDate: Date,
    assessedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    gapsIdentified: [String],
    notes: String,
  },
  { timestamps: true }
);

competencyRecordSchema.index({ userId: 1, skillArea: 1 }, { unique: true });

export default mongoose.model<ICompetencyRecord>('CompetencyRecord', competencyRecordSchema);

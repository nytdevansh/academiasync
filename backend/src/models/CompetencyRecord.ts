import mongoose, { Document, Schema } from 'mongoose';

export interface IAssessmentEntry {
  source: 'self' | 'hod' | 'peer' | 'student';
  score: number; // 0–100
  date: Date;
  notes?: string;
  assessedBy?: mongoose.Types.ObjectId;
  rubricScores?: { criterion: string; score: number; maxScore: number }[];
}

export interface ICompetencyRecord extends Document {
  userId: mongoose.Types.ObjectId;
  skillArea: mongoose.Types.ObjectId;
  // Assessment history — one record per user/skill, many dated entries inside
  assessments: IAssessmentEntry[];
  currentScore: number;  // computed: weighted average of latest assessment per source
  trend: 'improving' | 'flat' | 'declining'; // computed across last 2 entries
  // Legacy fields (kept for backward compat & still used for level-based views)
  currentLevel: 'beginner' | 'developing' | 'proficient' | 'advanced' | 'expert';
  targetLevel: 'beginner' | 'developing' | 'proficient' | 'advanced' | 'expert';
  lastAssessedDate?: Date;
  assessedBy?: mongoose.Types.ObjectId;
  gapsIdentified?: string[];
  notes?: string;
}

const rubricScoreSchema = new Schema(
  { criterion: String, score: Number, maxScore: Number },
  { _id: false }
);

const assessmentEntrySchema = new Schema<IAssessmentEntry>(
  {
    source:      { type: String, enum: ['self', 'hod', 'peer', 'student'], required: true },
    score:       { type: Number, min: 0, max: 100, required: true },
    date:        { type: Date, default: Date.now },
    notes:       String,
    assessedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
    rubricScores: [rubricScoreSchema],
  },
  { _id: true }
);

const competencyRecordSchema = new Schema<ICompetencyRecord>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    skillArea: { type: Schema.Types.ObjectId, ref: 'SkillArea', required: true },
    assessments:   { type: [assessmentEntrySchema], default: [] },
    currentScore:  { type: Number, default: 0, min: 0, max: 100 },
    trend:         { type: String, enum: ['improving', 'flat', 'declining'], default: 'flat' },
    currentLevel:  { type: String, enum: ['beginner', 'developing', 'proficient', 'advanced', 'expert'], default: 'beginner' },
    targetLevel:   { type: String, enum: ['beginner', 'developing', 'proficient', 'advanced', 'expert'], default: 'proficient' },
    lastAssessedDate: Date,
    assessedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
    gapsIdentified: [String],
    notes: String,
  },
  { timestamps: true }
);

// One record per user+skill; assessments are sub-documents inside
competencyRecordSchema.index({ userId: 1, skillArea: 1 }, { unique: true });
competencyRecordSchema.index({ userId: 1 });

// Helper: derive currentLevel from numeric score
export const scoreTolevel = (score: number): ICompetencyRecord['currentLevel'] => {
  if (score >= 85) return 'expert';
  if (score >= 70) return 'advanced';
  if (score >= 50) return 'proficient';
  if (score >= 25) return 'developing';
  return 'beginner';
};

export default mongoose.model<ICompetencyRecord>('CompetencyRecord', competencyRecordSchema);

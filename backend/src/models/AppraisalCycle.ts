import mongoose, { Document, Schema } from 'mongoose';

export interface IAppraisalCycle extends Document {
  title: string;
  academicYear: string;
  startDate: Date;
  endDate: Date;
  submissionDeadline: Date;
  criteria: { name: string; description: string; maxScore: number; weight: number }[];
  targetDepartments: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  status: 'draft' | 'active' | 'closed';
}

const appraisalCycleSchema = new Schema<IAppraisalCycle>(
  {
    title: { type: String, required: true },
    academicYear: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    submissionDeadline: { type: Date, required: true },
    criteria: [
      {
        name: { type: String, required: true },
        description: { type: String },
        maxScore: { type: Number, required: true },
        weight: { type: Number, required: true }, // percentage
      },
    ],
    targetDepartments: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'active', 'closed'], default: 'draft' },
  },
  { timestamps: true }
);

export default mongoose.model<IAppraisalCycle>('AppraisalCycle', appraisalCycleSchema);

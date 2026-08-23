import mongoose, { Document, Schema } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  code: string;
  department: mongoose.Types.ObjectId;
  credits: number;
  description?: string;
  isActive: boolean;
}

const subjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, uppercase: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    credits: { type: Number, default: 3 },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISubject>('Subject', subjectSchema);

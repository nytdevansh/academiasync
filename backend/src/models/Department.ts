import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: string;
  hodRef?: mongoose.Types.ObjectId;
  description?: string;
  isActive: boolean;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    hodRef: { type: Schema.Types.ObjectId, ref: 'User' },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IDepartment>('Department', departmentSchema);

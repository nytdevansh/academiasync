import mongoose, { Document, Schema } from 'mongoose';

export interface ISkillArea extends Document {
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
  order: number;
}

const skillAreaSchema = new Schema<ISkillArea>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    category: { type: String, default: 'General' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ISkillArea>('SkillArea', skillAreaSchema);

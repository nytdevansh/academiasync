import mongoose, { Document, Schema } from 'mongoose';

export interface INotice extends Omit<Document, 'isNew'> {
  title: string;
  category: 'FACULTY' | 'APPRAISAL' | 'RESEARCH' | 'ACADEMIC' | 'QUALITY' | 'STUDENT' | 'GENERAL';
  author: string;
  content?: string;
  isActive: boolean;
  isNew: boolean;
  createdAt: Date;
}

const noticeSchema = new Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['FACULTY', 'APPRAISAL', 'RESEARCH', 'ACADEMIC', 'QUALITY', 'STUDENT', 'GENERAL'],
      default: 'GENERAL',
    },
    author: { type: String, required: true },
    content: { type: String },
    isActive: { type: Boolean, default: true },
    isNew: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<INotice>('Notice', noticeSchema);

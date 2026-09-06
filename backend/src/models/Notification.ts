import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'training' | 'appraisal' | 'deadline' | 'system' | 'renewal';
  title: string;
  message: string;
  dueDate?: Date;
  status: 'unread' | 'read' | 'archived';
  relatedEntityType?: string;
  relatedEntityId?: mongoose.Types.ObjectId;
  emailStatus?: 'sent' | 'failed' | 'skipped';
  emailDispatchedAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['training', 'appraisal', 'deadline', 'system', 'renewal'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    dueDate: { type: Date },
    status: { type: String, enum: ['unread', 'read', 'archived'], default: 'unread' },
    relatedEntityType: { type: String },
    relatedEntityId: { type: Schema.Types.ObjectId },
    emailStatus: { type: String, enum: ['sent', 'failed', 'skipped'], default: 'skipped' },
    emailDispatchedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>('Notification', notificationSchema);

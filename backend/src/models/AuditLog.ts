import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export';
  entityType: string;
  entityId?: mongoose.Types.ObjectId;
  description: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['create', 'update', 'delete', 'login', 'logout', 'export'], required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId },
    description: { type: String, required: true },
    previousValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now },
  }
);

// Index for efficient filtering
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, timestamp: -1 });
auditLogSchema.index({ action: 1 });

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendanceSession {
  sessionDate: Date;
  sessionTitle: string;
  present: boolean;
  markedBy?: mongoose.Types.ObjectId;
  markedAt?: Date;
  notes?: string;
}

export interface IAttendanceRecord extends Document {
  programId: mongoose.Types.ObjectId;
  enrollmentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sessions: IAttendanceSession[];
  attendancePercentage: number;
  isSatisfied: boolean; // e.g. attendancePercentage >= threshold (default 75%)
}

const attendanceSessionSchema = new Schema<IAttendanceSession>(
  {
    sessionDate: { type: Date, required: true },
    sessionTitle: { type: String, default: 'General Session' },
    present: { type: Boolean, default: false },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    markedAt: { type: Date, default: Date.now },
    notes: String,
  },
  { _id: true }
);

const attendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    programId: { type: Schema.Types.ObjectId, ref: 'TrainingProgram', required: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'TrainingEnrollment', required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sessions: [attendanceSessionSchema],
    attendancePercentage: { type: Number, default: 0, min: 0, max: 100 },
    isSatisfied: { type: Boolean, default: false },
  },
  { timestamps: true }
);

attendanceRecordSchema.index({ programId: 1, userId: 1 });
attendanceRecordSchema.index({ userId: 1 });

export default mongoose.model<IAttendanceRecord>('AttendanceRecord', attendanceRecordSchema);

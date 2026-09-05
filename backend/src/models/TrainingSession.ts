import mongoose, { Document, Schema } from 'mongoose';

export interface ISessionAttendee {
  userId: mongoose.Types.ObjectId;
  enrollmentId?: mongoose.Types.ObjectId;
  present: boolean;
  markedAt?: Date;
  notes?: string;
}

export interface ITrainingSession extends Document {
  programId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  scheduledDate: Date;
  startTime?: string;
  endTime?: string;
  venueOrLink?: string;
  organiserId?: mongoose.Types.ObjectId | null;
  organiserAssignedAt?: Date | null;
  attendanceMarkedAt?: Date | null;
  attendanceMarkedBy?: mongoose.Types.ObjectId | null;
  status: 'scheduled' | 'organiser_assigned' | 'attendance_marked' | 'cancelled';
  attendees: ISessionAttendee[];
  createdAt: Date;
  updatedAt: Date;
}

const sessionAttendeeSchema = new Schema<ISessionAttendee>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'TrainingEnrollment' },
    present: { type: Boolean, default: false },
    markedAt: { type: Date },
    notes: { type: String },
  },
  { _id: true }
);

const trainingSessionSchema = new Schema<ITrainingSession>(
  {
    programId: { type: Schema.Types.ObjectId, ref: 'TrainingProgram', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    scheduledDate: { type: Date, required: true },
    startTime: { type: String },
    endTime: { type: String },
    venueOrLink: { type: String },
    organiserId: { type: Schema.Types.ObjectId, ref: 'User', index: true, default: null },
    organiserAssignedAt: { type: Date, default: null },
    attendanceMarkedAt: { type: Date, default: null },
    attendanceMarkedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
      type: String,
      enum: ['scheduled', 'organiser_assigned', 'attendance_marked', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    attendees: [sessionAttendeeSchema],
  },
  { timestamps: true }
);

trainingSessionSchema.index({ programId: 1, scheduledDate: 1 });
trainingSessionSchema.index({ programId: 1, status: 1 });

export default mongoose.model<ITrainingSession>('TrainingSession', trainingSessionSchema);

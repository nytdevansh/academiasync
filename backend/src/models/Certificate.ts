import mongoose, { Document, Schema } from 'mongoose';

export interface ICertificateMetadata {
  teacherName: string;
  courseTitle: string;
  departmentName: string;
  departmentCode: string;
  issuerName: string;
}

export interface ICertificate extends Document {
  certificateNumber: string;
  teacherId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  enrollmentId: mongoose.Types.ObjectId;
  resultId: mongoose.Types.ObjectId;
  issuedDate: Date;
  expiryDate: Date;
  status: 'valid' | 'revoked';
  supersedes?: mongoose.Types.ObjectId;
  revokedAt?: Date;
  revokedBy?: mongoose.Types.ObjectId;
  revokedReason?: string;
  verificationToken: string;
  metadata: ICertificateMetadata;
  remindersSent: number[];
  createdAt: Date;
  updatedAt: Date;
  isValid: boolean;
}

const certificateSchema = new Schema<ICertificate>(
  {
    certificateNumber: { type: String, required: true, unique: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'TrainingProgram', required: true, index: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'TrainingEnrollment', required: true, index: true },
    resultId: { type: Schema.Types.ObjectId, ref: 'CourseResult', required: true },
    issuedDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    status: { type: String, enum: ['valid', 'revoked'], default: 'valid' },
    supersedes: { type: Schema.Types.ObjectId, ref: 'Certificate' },
    revokedAt: Date,
    revokedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    revokedReason: String,
    verificationToken: { type: String, required: true, unique: true, index: true },
    metadata: {
      teacherName: { type: String, required: true },
      courseTitle: { type: String, required: true },
      departmentName: { type: String, default: 'General' },
      departmentCode: { type: String, default: 'GEN' },
      issuerName: { type: String, default: 'AcademiaSync Institute' },
    },
    remindersSent: { type: [Number], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property for computed runtime validity
certificateSchema.virtual('isValid').get(function (this: ICertificate) {
  return this.status === 'valid' && (!this.expiryDate || new Date(this.expiryDate).getTime() > Date.now());
});

certificateSchema.index({ teacherId: 1, courseId: 1 });
certificateSchema.index({ issuedDate: -1 });

export default mongoose.model<ICertificate>('Certificate', certificateSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IFacultyProfile extends Document {
  userId: mongoose.Types.ObjectId;
  bio?: string;
  qualifications: { degree: string; institution: string; year: number; specialization: string }[];
  experience: { institution: string; role: string; fromYear: number; toYear?: number; isCurrent: boolean }[];
  certifications: { name: string; issuingBody: string; issueDate: Date; expiryDate?: Date; certificateUrl?: string }[];
  accomplishments: { title: string; description: string; date: Date; category: string }[];
  subjectsTaught: mongoose.Types.ObjectId[];
  researchAreas: string[];
  profileCompleteness: number;
  profilePhotoUrl?: string;
}

const facultyProfileSchema = new Schema<IFacultyProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bio: String,
    qualifications: [{
      degree: { type: String, required: true },
      institution: { type: String, required: true },
      year: { type: Number, required: true },
      specialization: { type: String, required: true },
    }],
    experience: [{
      institution: { type: String, required: true },
      role: { type: String, required: true },
      fromYear: { type: Number, required: true },
      toYear: Number,
      isCurrent: { type: Boolean, default: false },
    }],
    certifications: [{
      name: { type: String, required: true },
      issuingBody: { type: String, required: true },
      issueDate: { type: Date, required: true },
      expiryDate: Date,
      certificateUrl: String,
    }],
    accomplishments: [{
      title: { type: String, required: true },
      description: String,
      date: Date,
      category: { type: String, default: 'General' },
    }],
    subjectsTaught: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    researchAreas: [String],
    profileCompleteness: { type: Number, default: 0, min: 0, max: 100 },
    profilePhotoUrl: String,
  },
  { timestamps: true }
);

export default mongoose.model<IFacultyProfile>('FacultyProfile', facultyProfileSchema);

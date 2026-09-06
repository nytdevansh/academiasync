import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'faculty_member' | 'hod' | 'dean' | 'hr' | 'administrator';
  department?: mongoose.Types.ObjectId;
  status: 'active' | 'inactive' | 'suspended';
  emailPreferences?: {
    training: boolean;
    appraisal: boolean;
    broadcasts: boolean;
    system: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['faculty_member', 'hod', 'dean', 'hr', 'administrator'],
      required: true,
    },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    emailPreferences: {
      training: { type: Boolean, default: true },
      appraisal: { type: Boolean, default: true },
      broadcasts: { type: Boolean, default: true },
      system: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', userSchema);

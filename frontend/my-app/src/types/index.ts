// ── Shared TypeScript types for AcademiaSync FES ──────────────────────────────

export type UserRole = 'faculty_member' | 'hod' | 'dean' | 'hr' | 'administrator';
export type TrainingStatus = 'nominated' | 'approved' | 'rejected' | 'attended' | 'completed' | 'withdrawn';
export type AppraisalStatus = 'draft' | 'self_submitted' | 'under_review' | 'completed';
export type CompetencyLevel = 'beginner' | 'developing' | 'proficient' | 'advanced' | 'expert';
export type TrainingType = 'FDP' | 'Workshop' | 'Seminar' | 'Conference' | 'MOOC' | 'Other';
export type TrainingMode = 'online' | 'offline' | 'hybrid';
export type NotificationStatus = 'unread' | 'read' | 'archived';
export type CycleStatus = 'draft' | 'active' | 'closed';

export interface Department {
  _id: string;
  name: string;
  code: string;
  hodRef?: User;
  description?: string;
  isActive: boolean;
}

export interface Subject {
  _id: string;
  name: string;
  code: string;
  department: Department;
  credits: number;
  description?: string;
  isActive: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: Department;
  status: 'active' | 'inactive' | 'suspended';
  createdAt?: string;
}

export interface Qualification {
  _id?: string;
  degree: string;
  institution: string;
  year: number;
  specialization: string;
}
export interface Experience {
  _id?: string;
  institution: string;
  role: string;
  fromYear: number;
  toYear?: number;
  isCurrent: boolean;
}
export interface Certification {
  _id?: string;
  name: string;
  issuingBody: string;
  issueDate: string;
  expiryDate?: string;
  certificateUrl?: string;
}
export interface Accomplishment {
  _id?: string;
  title: string;
  description: string;
  date: string;
  category: string;
}

export interface FacultyProfile {
  _id: string;
  userId: User;
  qualifications: Qualification[];
  experience: Experience[];
  certifications: Certification[];
  accomplishments: Accomplishment[];
  subjectsTaught: Subject[];
  researchAreas: string[];
  profileCompleteness: number;
  bio?: string;
  profilePhotoUrl?: string;
}

export interface TrainingProgram {
  _id: string;
  title: string;
  type: TrainingType;
  description: string;
  organizer: string;
  venue?: string;
  mode: TrainingMode;
  startDate: string;
  endDate: string;
  capacity?: number;
  registrationDeadline?: string;
  targetDepartments: Department[];
  createdBy: User;
  isActive: boolean;
  tags: string[];
}

export interface TrainingEnrollment {
  _id: string;
  userId: User;
  programId: TrainingProgram;
  status: TrainingStatus;
  nominatedBy?: User;
  approvedBy?: User;
  nominationDate: string;
  approvalDate?: string;
  completionDate?: string;
  feedback?: { rating: number; comments: string; learningOutcome: string };
  certificateUrl?: string;
  rejectionReason?: string;
}

export interface SkillArea {
  _id: string;
  name: string;
  description?: string;
  category: string;
  order: number;
  isActive: boolean;
}

export interface CompetencyRecord {
  _id: string;
  userId: User;
  skillArea: SkillArea;
  currentLevel: CompetencyLevel;
  targetLevel: CompetencyLevel;
  lastAssessedDate?: string;
  assessedBy?: User;
  gapsIdentified?: string[];
  notes?: string;
}

export interface AppraisalCriterion {
  _id?: string;
  name: string;
  description?: string;
  maxScore: number;
  weight: number;
}

export interface AppraisalCycle {
  _id: string;
  title: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  criteria: AppraisalCriterion[];
  targetDepartments: Department[];
  createdBy: User;
  status: CycleStatus;
}

export interface Appraisal {
  _id: string;
  userId: User;
  cycleId: AppraisalCycle;
  selfAssessment: {
    criteria: { criterionId: string; score: number; remarks: string }[];
    submittedAt?: string;
    status: 'draft' | 'submitted';
  };
  reviewerAssessment?: {
    reviewerId: User;
    criteria: { criterionId: string; score: number; remarks: string }[];
    overallRemarks: string;
    submittedAt: string;
  };
  finalScore?: number;
  status: AppraisalStatus;
}

export interface Notification {
  _id: string;
  userId: string;
  type: 'training' | 'appraisal' | 'deadline' | 'system' | 'renewal';
  title: string;
  message: string;
  dueDate?: string;
  status: NotificationStatus;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  userId: User;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export';
  entityType: string;
  entityId?: string;
  description: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
  page?: number;
  totalPages?: number;
  unreadCount?: number;
}

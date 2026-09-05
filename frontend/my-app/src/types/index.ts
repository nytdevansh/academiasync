// ── Shared TypeScript types for AcademiaSync FES ──────────────────────────────

export type UserRole = 'faculty_member' | 'hod' | 'dean' | 'hr' | 'administrator';
export type TrainingStatus = 'nominated' | 'approved' | 'rejected' | 'attended' | 'completed' | 'certified' | 'withdrawn';
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
  hasScheduledSessions?: boolean;
}

export interface ISessionAttendee {
  _id?: string;
  userId: User;
  enrollmentId?: string;
  present: boolean;
  markedAt?: string;
  notes?: string;
}

export interface TrainingSession {
  _id: string;
  programId: TrainingProgram | string;
  title: string;
  description?: string;
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  venueOrLink?: string;
  organiserId?: User | null;
  organiserAssignedAt?: string | null;
  attendanceMarkedAt?: string | null;
  attendanceMarkedBy?: User | null;
  status: 'scheduled' | 'organiser_assigned' | 'attendance_marked' | 'cancelled';
  attendees: ISessionAttendee[];
  totalAttendees?: number;
  presentCount?: number;
  createdAt?: string;
  updatedAt?: string;
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

// ── Custom Assessment & Survey Engine Types ──────────────────────────────────
export type AssessmentQuestionType = 'mcq' | 'text' | 'rating' | 'boolean';
export type AssessmentScopeType = 'department' | 'individual' | 'role' | 'all';
export type AssessmentStatus = 'draft' | 'published' | 'closed';
export type AssessmentResponseStatus = 'in_progress' | 'submitted' | 'reviewed';

export interface AssessmentQuestion {
  _id?: string;
  prompt: string;
  type: AssessmentQuestionType;
  options?: string[];
  correctAnswer?: any;
  points?: number;
  rubricGuide?: string;
  competencyId?: string | SkillArea;
}

export interface AssessmentTargetScope {
  type: AssessmentScopeType;
  targetIds?: (Department | User | string)[];
}

export interface AssessmentSettings {
  isGraded: boolean;
  isAnonymous: boolean;
  allowRetake: boolean;
  maxAttempts?: number;
  timeLimitMinutes?: number;
  dueDate?: string;
}

export interface Assessment {
  _id: string;
  title: string;
  description?: string;
  topic: string;
  createdBy: User;
  createdByRole: 'hod' | 'dean' | 'administrator';
  targetScope: AssessmentTargetScope;
  questions: AssessmentQuestion[];
  settings: AssessmentSettings;
  status: AssessmentStatus;
  isTemplate: boolean;
  totalSubmissions?: number;
  mySubmission?: {
    responseId: string;
    attemptNumber: number;
    status: AssessmentResponseStatus;
    totalScore: number;
    maxScore: number;
    submittedAt: string;
  } | null;
  myResponses?: AssessmentResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentAnswer {
  questionId: string;
  answer: any;
  score?: number;
  feedback?: string;
}

export interface AssessmentResponse {
  _id: string;
  assessmentId: string | Assessment;
  facultyId: string | User;
  faculty?: User | { name: string; email: string; department?: any; role?: string };
  attemptNumber: number;
  answers: AssessmentAnswer[];
  totalScore: number;
  maxScore: number;
  status: AssessmentResponseStatus;
  startedAt?: string;
  submittedAt?: string;
  timeTakenSeconds?: number;
  reviewerNotes?: string;
  reviewedBy?: User;
  reviewedAt?: string;
  createdAt: string;
}

export interface AssessmentAnalytics {
  totalResponses: number;
  averageScore: number;
  averageScorePct: number;
  scoreDistribution: { range: string; count: number }[];
  questionStats: {
    questionNumber: number;
    prompt: string;
    type: AssessmentQuestionType;
    correctCount?: number;
    incorrectCount?: number;
    accuracyPct?: number;
    averageRating?: number;
    distribution?: Record<number, number>;
    submittedResponsesCount?: number;
  }[];
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

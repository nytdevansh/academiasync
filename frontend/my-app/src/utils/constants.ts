const getApiBase = () => {
  const envUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');
  // If base url doesn't end with /api/v1, append /api/v1 cleanly
  if (!envUrl.endsWith('/api/v1')) {
    return `${envUrl}/api/v1`;
  }
  return envUrl;
};

export const API_BASE = getApiBase();

export const ROLES = {
  FACULTY: 'faculty_member',
  HOD: 'hod',
  DEAN: 'dean',
  HR: 'hr',
  ADMIN: 'administrator',
} as const;

export const ROLE_LABELS: Record<string, string> = {
  faculty_member: 'Faculty Member',
  hod: 'Head of Department',
  dean: 'Dean',
  hr: 'HR Manager',
  administrator: 'Administrator',
};

export const ROLE_COLORS: Record<string, string> = {
  faculty_member: 'badge-info',
  hod: 'badge-violet',
  dean: 'badge-gold',
  hr: 'badge-warning',
  administrator: 'badge-danger',
};

export const COMPETENCY_LEVELS = ['beginner', 'developing', 'proficient', 'advanced', 'expert'] as const;
export const COMPETENCY_LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner', developing: 'Developing', proficient: 'Proficient',
  advanced: 'Advanced', expert: 'Expert',
};
export const COMPETENCY_LEVEL_COLORS: Record<string, string> = {
  beginner: 'badge-danger', developing: 'badge-warning', proficient: 'badge-info',
  advanced: 'badge-violet', expert: 'badge-success',
};
export const COMPETENCY_LEVEL_PERCENT: Record<string, number> = {
  beginner: 10, developing: 30, proficient: 55, advanced: 80, expert: 100,
};

export const TRAINING_TYPES = ['FDP', 'Workshop', 'Seminar', 'Conference', 'MOOC', 'Other'];
export const TRAINING_MODES = ['online', 'offline', 'hybrid'];

export const TRAINING_STATUS_LABELS: Record<string, string> = {
  nominated: 'Pending Approval', approved: 'Approved', rejected: 'Rejected',
  attended: 'Attended', completed: 'Completed', withdrawn: 'Withdrawn',
};
export const TRAINING_STATUS_COLORS: Record<string, string> = {
  nominated: 'badge-warning', approved: 'badge-info', rejected: 'badge-danger',
  attended: 'badge-violet', completed: 'badge-success', withdrawn: 'badge-muted',
};

export const RECOMMENDATION_STATUS_LABELS: Record<string, string> = {
  pending:   'Action Required',
  enrolled:  'Enrolled',
  completed: 'Completed',
  overdue:   'Overdue',
  ignored:   'Ignored',
};
export const RECOMMENDATION_STATUS_COLORS: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'muted'> = {
  pending:   'warning',
  enrolled:  'info',
  completed: 'success',
  overdue:   'danger',
  ignored:   'muted',
};

export const APPRAISAL_STATUS_LABELS: Record<string, string> = {
  draft: 'Not Started', self_submitted: 'Self-Assessment Submitted',
  under_review: 'Under Review', completed: 'Completed',
};
export const APPRAISAL_STATUS_COLORS: Record<string, string> = {
  draft: 'badge-muted', self_submitted: 'badge-info',
  under_review: 'badge-warning', completed: 'badge-success',
};

export const ASSESSMENT_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', published: 'Published', closed: 'Closed',
};
export const ASSESSMENT_STATUS_COLORS: Record<string, 'muted' | 'success' | 'danger' | 'info' | 'warning'> = {
  draft: 'muted', published: 'success', closed: 'danger',
};

export const ASSESSMENT_TOPICS = [
  'General',
  'AI & Pedagogy',
  'Infrastructure & Curriculum',
  'Research & Ethics',
  'Classroom Tech',
  'Outcome-Based Education',
  'Accreditation & Compliance',
];

// Role-based navigation config
export const NAV_SECTIONS = {
  faculty_member: [
    { label: 'Main', items: [
      { path: '/dashboard', icon: 'LayoutDashboard', label: 'Dashboard' },
      { path: '/profile', icon: 'UserCircle', label: 'My Profile' },
      { path: '/notifications', icon: 'Bell', label: 'Notifications' },
      { path: '/certificates', icon: 'Award', label: 'My Credentials' },
      { path: '/assessments', icon: 'CheckSquare', label: 'Assessments & Surveys' },
      { path: '/training/catalog', icon: 'GraduationCap', label: 'Training Catalog' },
      { path: '/training/my-enrollments', icon: 'BookOpen', label: 'My Enrollments' },
      { path: '/competency', icon: 'BarChart2', label: 'My Competency' },
      { path: '/appraisals', icon: 'ClipboardList', label: 'Appraisals' },
    ]},
  ],
  hod: [
    { label: 'Main', items: [
      { path: '/dashboard', icon: 'LayoutDashboard', label: 'Dashboard' },
      { path: '/profile', icon: 'UserCircle', label: 'My Profile' },
      { path: '/notifications', icon: 'Bell', label: 'Notifications' },
      { path: '/certificates', icon: 'Award', label: 'My Credentials' },
      { path: '/competency', icon: 'BarChart2', label: 'My Competency' },
      { path: '/appraisals', icon: 'ClipboardList', label: 'My Appraisal' },
    ]},
    { label: 'Department', items: [
      { path: '/assessments', icon: 'CheckSquare', label: 'Dept. Assessments' },
      { path: '/training/approvals', icon: 'CheckSquare', label: 'Training Approvals' },
      { path: '/training/grading', icon: 'CheckSquare', label: 'Course Grading' },
      { path: '/training/catalog', icon: 'GraduationCap', label: 'Training Catalog' },
      { path: '/curriculum/subjects', icon: 'BookOpen', label: 'Curriculum Subjects' },
      { path: '/recommendations', icon: 'Sparkles', label: 'Recommendations' },
      { path: '/competency/gap-analysis', icon: 'TrendingUp', label: 'Gap Analysis' },
      { path: '/appraisals/department', icon: 'ClipboardList', label: 'Dept. Appraisals' },
    ]},
    { label: 'Reports', items: [
      { path: '/reports', icon: 'BarChart2', label: 'Reports' },
    ]},
  ],
  dean: [
    { label: 'Overview', items: [
      { path: '/dashboard', icon: 'LayoutDashboard', label: 'Dashboard' },
      { path: '/profile', icon: 'UserCircle', label: 'My Profile' },
      { path: '/notifications', icon: 'Bell', label: 'Notifications' },
      { path: '/certificates', icon: 'Award', label: 'My Credentials' },
      { path: '/appraisals', icon: 'ClipboardList', label: 'My Appraisal' },
    ]},
    { label: 'Institution', items: [
      { path: '/assessments', icon: 'CheckSquare', label: 'Assessments & Surveys' },
      { path: '/training/catalog', icon: 'GraduationCap', label: 'Training Programs' },
      { path: '/training/approvals', icon: 'CheckSquare', label: 'Training Approvals' },
      { path: '/training/grading', icon: 'CheckSquare', label: 'Course Grading' },
      { path: '/curriculum/subjects', icon: 'BookOpen', label: 'Curriculum Subjects' },
      { path: '/recommendations', icon: 'Sparkles', label: 'Recommendations' },
      { path: '/competency/gap-analysis', icon: 'TrendingUp', label: 'Competency Analysis' },
      { path: '/appraisals/department', icon: 'ClipboardList', label: 'Reviewer Appraisals' },
    ]},
    { label: 'Analytics', items: [
      { path: '/reports', icon: 'BarChart2', label: 'Reports & Analytics' },
    ]},
  ],
  hr: [
    { label: 'Main', items: [
      { path: '/dashboard', icon: 'LayoutDashboard', label: 'Dashboard' },
      { path: '/profile', icon: 'UserCircle', label: 'My Profile' },
      { path: '/notifications', icon: 'Bell', label: 'Notifications' },
      { path: '/certificates', icon: 'Award', label: 'My Credentials' },
      { path: '/assessments', icon: 'CheckSquare', label: 'Surveys & Feedback' },
      { path: '/reports', icon: 'BarChart2', label: 'Reports' },
    ]},
  ],
  administrator: [
    { label: 'Main', items: [
      { path: '/dashboard', icon: 'LayoutDashboard', label: 'Dashboard' },
      { path: '/profile', icon: 'UserCircle', label: 'My Profile' },
      { path: '/notifications', icon: 'Bell', label: 'Notifications' },
      { path: '/certificates', icon: 'Award', label: 'My Credentials' },
    ]},
    { label: 'Management', items: [
      { path: '/admin/users', icon: 'Users', label: 'Users' },
      { path: '/admin/departments', icon: 'Building2', label: 'Departments' },
      { path: '/curriculum/subjects', icon: 'BookOpen', label: 'Curriculum Subjects' },
      { path: '/assessments', icon: 'CheckSquare', label: 'Assessments & Surveys' },
      { path: '/training/catalog', icon: 'GraduationCap', label: 'Training Programs' },
      { path: '/training/approvals', icon: 'CheckSquare', label: 'Approvals' },
      { path: '/training/grading', icon: 'CheckSquare', label: 'Course Grading' },
      { path: '/recommendations', icon: 'Sparkles', label: 'Recommendations' },
      { path: '/appraisals/cycles', icon: 'ClipboardList', label: 'Appraisal Cycles' },
      { path: '/appraisals/department', icon: 'ClipboardList', label: 'Reviewer Appraisals' },
      { path: '/competency/gap-analysis', icon: 'TrendingUp', label: 'Competency' },
    ]},
    { label: 'Analytics & Audit', items: [
      { path: '/reports', icon: 'BarChart2', label: 'Reports' },
      { path: '/admin/audit', icon: 'ShieldCheck', label: 'Audit Log' },
    ]},
  ],
};


export const CHART_COLORS = ['#2563EB', '#0F766E', '#14B8A6', '#D97706', '#16A34A', '#8B5CF6', '#F43F5E'];

export const DEMO_CREDENTIALS = [
  { email: 'admin@academiasync.edu', password: 'Admin@123', role: 'Administrator' },
  { email: 'hod.cse@academiasync.edu', password: 'Hod@123', role: 'HOD (CSE)' },
  { email: 'dean@academiasync.edu', password: 'Dean@123', role: 'Dean' },
  { email: 'hr@academiasync.edu', password: 'Hr@123', role: 'HR' },
  { email: 'faculty@academiasync.edu', password: 'Faculty@123', role: 'Faculty' },
];

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { PublicLayout } from './components/layout/PublicLayout';

// Public Campus Pages
import { HomePage } from './pages/public/HomePage';
import { AcademicsPage } from './pages/public/AcademicsPage';
import { FacultyDirectoryPage } from './pages/public/FacultyDirectoryPage';
import { StudentsPage } from './pages/public/StudentsPage';
import { DepartmentsPage } from './pages/public/DepartmentsPage';
import { NoticesPage } from './pages/public/NoticesPage';
import { ContactPage } from './pages/public/ContactPage';
import { PrivacyPolicyPage } from './pages/public/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/public/TermsOfServicePage';
import { CertificateVerificationPage } from './pages/public/CertificateVerificationPage';
import { LoginPage } from './pages/auth/LoginPage';

// Shared Protected Portal Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { EditProfilePage } from './pages/profile/EditProfilePage';
import { MyCertificatesPage } from './pages/certificates/MyCertificatesPage';
import { TrainingCatalogPage } from './pages/training/TrainingCatalogPage';
import { MyEnrollmentsPage, HODApprovalsPage } from './pages/training/TrainingPages';
import { CourseLearningPage } from './pages/training/CourseLearningPage';
import { CourseGradingPage } from './pages/training/CourseGradingPage';
import { SessionAttendancePage } from './pages/training/SessionAttendancePage';
import { CompetencyPage } from './pages/competency/CompetencyPage';
import { DepartmentGapAnalysisPage } from './pages/competency/DepartmentGapAnalysisPage';
import { AppraisalListPage } from './pages/appraisal/AppraisalPages';
import { AppraisalCycleBuilderPage } from './pages/appraisal/AppraisalCycleBuilderPage';
import { ReviewerAssessmentPage } from './pages/appraisal/ReviewerAssessmentPage';
import { SubjectManagementPage } from './pages/curriculum/SubjectManagementPage';
import { RecommendationsPage } from './pages/recommendations/RecommendationsPage';
import { AssessmentListPage } from './pages/assessments/AssessmentListPage';
import { TakeAssessmentPage } from './pages/assessments/TakeAssessmentPage';
import { AssessmentAnalyticsPage } from './pages/assessments/AssessmentAnalyticsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { UserManagementPage, AuditLogPage } from './pages/admin/AdminPages';
import { DepartmentManagementPage } from './pages/admin/DepartmentManagementPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { NotFoundPage } from './pages/NotFoundPage';

const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Public Campus Website Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/academics" element={<AcademicsPage />} />
          <Route path="/faculty" element={<FacultyDirectoryPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/notices" element={<NoticesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
        </Route>

        {/* Public Cryptographic Certificate Verification */}
        <Route path="/verify/:token" element={<CertificateVerificationPage />} />

        {/* Authentication */}
        <Route path="/login" element={<LoginPage />} />

        {/* Internal Faculty & Administrative Portal Routes */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/certificates" element={<MyCertificatesPage />} />

          <Route path="/training/catalog" element={<TrainingCatalogPage />} />
          <Route path="/training/my-enrollments" element={<MyEnrollmentsPage />} />
          <Route path="/training/programs/:id/sessions" element={<SessionAttendancePage />} />
          <Route path="/training/sessions/:sessionId" element={<SessionAttendancePage />} />
          <Route path="/training/:id/learn" element={<CourseLearningPage />} />
          <Route path="/training/grading" element={<ProtectedRoute allowedRoles={['hod', 'dean', 'administrator', 'faculty_member']}><CourseGradingPage /></ProtectedRoute>} />
          <Route path="/training/approvals" element={<ProtectedRoute allowedRoles={['hod', 'dean', 'administrator']}><HODApprovalsPage /></ProtectedRoute>} />

          <Route path="/assessments" element={<AssessmentListPage />} />
          <Route path="/assessments/:id/take" element={<TakeAssessmentPage />} />
          <Route path="/assessments/:id/results" element={<TakeAssessmentPage />} />
          <Route path="/assessments/:id/analytics" element={<ProtectedRoute allowedRoles={['hod', 'dean', 'hr', 'administrator']}><AssessmentAnalyticsPage /></ProtectedRoute>} />

          <Route path="/competency" element={<CompetencyPage />} />
          <Route path="/competency/gap-analysis" element={<ProtectedRoute allowedRoles={['hod', 'dean', 'administrator']}><DepartmentGapAnalysisPage /></ProtectedRoute>} />

          <Route path="/appraisals" element={<AppraisalListPage />} />
          <Route path="/appraisals/department" element={<ProtectedRoute allowedRoles={['hod', 'dean', 'administrator']}><ReviewerAssessmentPage /></ProtectedRoute>} />
          <Route path="/appraisals/cycles" element={<ProtectedRoute allowedRoles={['administrator']}><AppraisalCycleBuilderPage /></ProtectedRoute>} />

          <Route path="/curriculum/subjects" element={<ProtectedRoute allowedRoles={['hod', 'dean', 'administrator']}><SubjectManagementPage /></ProtectedRoute>} />
          <Route path="/recommendations" element={<ProtectedRoute allowedRoles={['hod', 'dean', 'administrator']}><RecommendationsPage /></ProtectedRoute>} />

          <Route path="/reports" element={<ProtectedRoute allowedRoles={['hod', 'dean', 'hr', 'administrator']}><ReportsPage /></ProtectedRoute>} />

          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['administrator']}><UserManagementPage /></ProtectedRoute>} />
          <Route path="/admin/departments" element={<ProtectedRoute allowedRoles={['administrator']}><DepartmentManagementPage /></ProtectedRoute>} />
          <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={['administrator']}><AuditLogPage /></ProtectedRoute>} />
        </Route>

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;


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
import { LoginPage } from './pages/auth/LoginPage';

// Shared Protected Portal Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { EditProfilePage } from './pages/profile/EditProfilePage';
import { TrainingCatalogPage } from './pages/training/TrainingCatalogPage';
import { MyEnrollmentsPage, HODApprovalsPage } from './pages/training/TrainingPages';
import { CompetencyPage } from './pages/competency/CompetencyPage';
import { AppraisalListPage } from './pages/appraisal/AppraisalPages';
import { ReportsPage } from './pages/reports/ReportsPage';
import { UserManagementPage, AuditLogPage } from './pages/admin/AdminPages';
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
        </Route>

        {/* Authentication */}
        <Route path="/login" element={<LoginPage />} />

        {/* Internal Faculty & Administrative Portal Routes */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />

          <Route path="/training/catalog" element={<TrainingCatalogPage />} />
          <Route path="/training/my-enrollments" element={<MyEnrollmentsPage />} />
          <Route path="/training/approvals" element={<ProtectedRoute allowedRoles={['hod', 'dean', 'administrator']}><HODApprovalsPage /></ProtectedRoute>} />

          <Route path="/competency" element={<CompetencyPage />} />
          <Route path="/competency/gap-analysis" element={<ProtectedRoute allowedRoles={['hod', 'dean', 'administrator']}><CompetencyPage /></ProtectedRoute>} />

          <Route path="/appraisals" element={<AppraisalListPage />} />
          <Route path="/appraisals/department" element={<ProtectedRoute allowedRoles={['hod', 'dean', 'administrator']}><AppraisalListPage /></ProtectedRoute>} />
          <Route path="/appraisals/cycles" element={<ProtectedRoute allowedRoles={['administrator']}><AppraisalListPage /></ProtectedRoute>} />

          <Route path="/reports" element={<ProtectedRoute allowedRoles={['hod', 'dean', 'hr', 'administrator']}><ReportsPage /></ProtectedRoute>} />

          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['administrator']}><UserManagementPage /></ProtectedRoute>} />
          <Route path="/admin/departments" element={<ProtectedRoute allowedRoles={['administrator']}><UserManagementPage /></ProtectedRoute>} />
          <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={['administrator']}><AuditLogPage /></ProtectedRoute>} />
        </Route>

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;


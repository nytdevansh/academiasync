
import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { EditProfilePage } from '../pages/profile/EditProfilePage';
import { TrainingCatalogPage } from '../pages/training/TrainingCatalogPage';
import { MyEnrollmentsPage, HODApprovalsPage } from '../pages/training/TrainingPages';
import { CompetencyPage } from '../pages/competency/CompetencyPage';
import { AppraisalListPage } from '../pages/appraisal/AppraisalPages';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { UserManagementPage, AuditLogPage } from '../pages/admin/AdminPages';
import { NotFoundPage } from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  {
    path: '/',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'profile/edit', element: <EditProfilePage /> },
      { path: 'training/catalog', element: <TrainingCatalogPage /> },
      { path: 'training/my-enrollments', element: <MyEnrollmentsPage /> },
      { path: 'training/approvals', element: <ProtectedRoute allowedRoles={['hod', 'dean', 'administrator']}><HODApprovalsPage /></ProtectedRoute> },
      { path: 'competency', element: <CompetencyPage /> },
      { path: 'competency/gap-analysis', element: <ProtectedRoute allowedRoles={['hod', 'dean', 'administrator']}><CompetencyPage /></ProtectedRoute> },
      { path: 'appraisals', element: <AppraisalListPage /> },
      { path: 'appraisals/department', element: <ProtectedRoute allowedRoles={['hod', 'dean', 'administrator']}><AppraisalListPage /></ProtectedRoute> },
      { path: 'appraisals/cycles', element: <ProtectedRoute allowedRoles={['administrator']}><AppraisalListPage /></ProtectedRoute> },
      { path: 'reports', element: <ProtectedRoute allowedRoles={['hod', 'dean', 'hr', 'administrator']}><ReportsPage /></ProtectedRoute> },
      { path: 'admin/users', element: <ProtectedRoute allowedRoles={['administrator']}><UserManagementPage /></ProtectedRoute> },
      { path: 'admin/departments', element: <ProtectedRoute allowedRoles={['administrator']}><UserManagementPage /></ProtectedRoute> },
      { path: 'admin/audit', element: <ProtectedRoute allowedRoles={['administrator']}><AuditLogPage /></ProtectedRoute> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

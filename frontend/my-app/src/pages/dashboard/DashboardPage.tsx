import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FacultyDashboard } from './FacultyDashboard';
import { HODDashboard } from './HODDashboard';
import { DeanDashboard, AdminDashboard } from './DeanAdminDashboard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export const DashboardPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner text="Loading..." />;
  if (!user) return null;

  switch (user.role) {
    case 'faculty_member': return <FacultyDashboard />;
    case 'hod':            return <HODDashboard />;
    case 'dean':           return <DeanDashboard />;
    case 'hr':             return <DeanDashboard />;  // HR sees dean-level view
    case 'administrator':  return <AdminDashboard />;
    default:               return <FacultyDashboard />;
  }
};

import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Faculty Enhancement Dashboard',
  '/profile': 'My Faculty Profile',
  '/profile/edit': 'Edit Faculty Profile',
  '/training/catalog': 'Training & FDP Catalog',
  '/training/my-enrollments': 'My Training Enrollments',
  '/training/approvals': 'Training Nominations & Approvals',
  '/competency': 'Competency & Skill Matrix',
  '/competency/gap-analysis': 'Department Competency Gap Analysis',
  '/appraisals': 'Faculty Performance Appraisals',
  '/appraisals/department': 'Department Appraisal Reviews',
  '/appraisals/cycles': 'Appraisal Cycles Configuration',
  '/reports': 'Institutional Reports & Analytics',
  '/curriculum/subjects': 'Curriculum & Subject Catalog',
  '/recommendations': 'Faculty Recommendations & Compliance',
  '/admin/users': 'User Management & Access Control',
  '/admin/departments': 'Academic Departments',
  '/admin/audit': 'System Audit Logs',
};

export const Layout: React.FC = () => {
  const { pathname } = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const title = PAGE_TITLES[pathname] || 'Faculty Enhancement System';

  // Automatically close mobile sidebar on route navigation
  React.useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Responsive Sidebar (Stationary on lg+, Slide-over drawer on mobile/tablet) */}
      <Sidebar open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      {/* Main Content Area: Zero left margin on mobile, 256px on lg+ */}
      <div className="flex-1 lg:ml-64 ml-0 flex flex-col min-h-screen w-full min-w-0">
        <TopBar title={title} onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
          <Outlet />
        </main>
      </div>
    </div>
  );
};


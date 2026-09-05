import React from 'react';
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
  const title = PAGE_TITLES[pathname] || 'Faculty Enhancement System';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <TopBar title={title} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
          <Outlet />
        </main>
      </div>
    </div>
  );
};


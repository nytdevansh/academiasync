import React, { useEffect, useState } from 'react';
import { Building2, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { getAllDepartments } from '../../api/departments';
import type { Department } from '../../types';

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllDepartments()
      .then((res) => {
        if (res.success && res.data) {
          setDepartments(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-fadeIn">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Building2 className="w-3.5 h-3.5" /> University Faculties & Schools
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Academic Departments & Centers of Excellence
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Accredited academic divisions delivering innovative curricula, state-of-the-art laboratory infrastructure, and faculty research.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading academic departments..." />
      ) : departments.length === 0 ? (
        <EmptyState title="No active departments found" description="Institutional departments will appear here once configured." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => {
            const hodName = dept.hodRef && typeof dept.hodRef === 'object' ? (dept.hodRef as any).name : 'Academic Deanery Assigned';
            return (
              <Card key={dept._id || dept.code} hover className="flex flex-col justify-between space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                      {dept.code}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{dept.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    {dept.description || 'Multidisciplinary academic programs, curriculum mapping, and faculty development.'}
                  </p>
                  
                  <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div><span className="font-semibold text-slate-900">Head of Dept:</span> {hodName}</div>
                    <div><span className="font-semibold text-slate-900">Status:</span> Active Institutional Directory</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                  <span>Academic Department</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

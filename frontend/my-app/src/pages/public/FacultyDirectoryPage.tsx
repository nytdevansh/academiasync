import React, { useEffect, useState } from 'react';
import { Mail, GraduationCap } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/ui/SearchBar';
import { Avatar } from '../../components/ui/Avatar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { getPublicFacultyDirectory } from '../../api/users';
import { getAllDepartments } from '../../api/departments';
import { ROLE_LABELS } from '../../utils/constants';

export const FacultyDirectoryPage: React.FC = () => {
  const [facultyMembers, setFacultyMembers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  useEffect(() => {
    Promise.all([getPublicFacultyDirectory(), getAllDepartments()])
      .then(([fRes, dRes]) => {
        if (fRes.success && fRes.data) {
          setFacultyMembers(fRes.data);
        }
        if (dRes.success && dRes.data) {
          setDepartments(dRes.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = facultyMembers.filter((f) => {
    const deptObj = f.department && typeof f.department === 'object' ? f.department : null;
    const deptName = deptObj ? deptObj.name : '';
    const deptCode = deptObj ? deptObj.code : '';
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase()) ||
      deptName.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || deptCode === selectedDept || deptName === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-fadeIn">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <GraduationCap className="w-3.5 h-3.5" /> University Faculty Directory
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Distinguished Faculty & Researchers
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Meet our educators, domain experts, and scholars driving impactful research and student mentorship.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="w-full md:w-80">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name or research topic..." />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedDept('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedDept === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Departments
          </button>
          {departments.map((d) => (
            <button
              key={d._id || d.code}
              onClick={() => setSelectedDept(d.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedDept === d.code
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {d.code}
            </button>
          ))}
        </div>
      </div>

      {/* Faculty Cards Grid */}
      {loading ? (
        <LoadingSpinner text="Loading faculty directory..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No faculty members found"
          description={
            search || selectedDept !== 'ALL'
              ? 'No faculty matched your filter criteria.'
              : 'Registered faculty members will appear here once added to departments.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((faculty) => {
            const deptObj = faculty.department && typeof faculty.department === 'object' ? faculty.department : null;
            const deptName = deptObj ? deptObj.name : 'University Administration';

            return (
              <Card key={faculty._id || faculty.email} hover className="flex flex-col justify-between space-y-5">
                <div>
                  <div className="flex items-start gap-4">
                    <Avatar name={faculty.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 truncate">{faculty.name}</h3>
                      <p className="text-xs font-semibold text-blue-600 mt-0.5">
                        {ROLE_LABELS[faculty.role] || faculty.role}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{deptName}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{faculty.email}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Institutional Faculty</span>
                  <Badge variant="teal">Verified Member</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

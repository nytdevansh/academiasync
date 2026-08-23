import React from 'react';
import { Building2, Users, BookOpen, Award, ArrowRight, Laptop, Cpu, Cog, Compass, Briefcase, Atom } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const DepartmentsPage: React.FC = () => {
  const departments = [
    {
      code: 'CSE',
      name: 'Computer Science & Engineering',
      hod: 'Dr. Alan Turing',
      facultyCount: 42,
      labs: 8,
      icon: <Laptop className="w-6 h-6 text-blue-600" />,
      desc: 'Advancing computational frontiers in AI, machine learning, distributed systems, cybersecurity, and data engineering.',
    },
    {
      code: 'ECE',
      name: 'Electronics & Communication Engineering',
      hod: 'Dr. Nikola Tesla',
      facultyCount: 36,
      labs: 7,
      icon: <Cpu className="w-6 h-6 text-teal-600" />,
      desc: 'Spearheading innovations in VLSI design, semiconductor devices, embedded systems, and wireless communications.',
    },
    {
      code: 'MECH',
      name: 'Mechanical Engineering',
      hod: 'Dr. Henry Ford',
      facultyCount: 30,
      labs: 9,
      icon: <Cog className="w-6 h-6 text-indigo-600" />,
      desc: 'Focusing on advanced robotics, thermal-fluid dynamics, electric mobility, and additive manufacturing.',
    },
    {
      code: 'CIVIL',
      name: 'Civil & Environmental Engineering',
      hod: 'Dr. John Smeaton',
      facultyCount: 25,
      labs: 6,
      icon: <Compass className="w-6 h-6 text-amber-600" />,
      desc: 'Pioneering resilient infrastructure, smart cities modeling, earthquake engineering, and environmental stewardship.',
    },
    {
      code: 'MBA',
      name: 'School of Management Studies',
      hod: 'Dr. Peter Drucker',
      facultyCount: 28,
      labs: 4,
      icon: <Briefcase className="w-6 h-6 text-rose-600" />,
      desc: 'Developing transformative business leaders through analytics, financial engineering, strategy, and entrepreneurship.',
    },
    {
      code: 'PHY/CHEM/MATH',
      name: 'Department of Applied Sciences',
      hod: 'Dr. Marie Curie',
      facultyCount: 34,
      labs: 8,
      icon: <Atom className="w-6 h-6 text-emerald-600" />,
      desc: 'Foundational scientific research in quantum materials, computational mathematics, and green chemical synthesis.',
    },
  ];

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
          Six multidisciplinary departments delivering innovative curricula, cutting-edge labs, and active research programs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <Card key={dept.code} hover className="flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  {dept.icon}
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                  {dept.code}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{dept.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">{dept.desc}</p>
              
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div><span className="font-semibold text-slate-900">Head of Dept:</span> {dept.hod}</div>
                <div><span className="font-semibold text-slate-900">Faculty Strength:</span> {dept.facultyCount} Professors & Researchers</div>
                <div><span className="font-semibold text-slate-900">Specialized Labs:</span> {dept.labs} Research Centers</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>View Department Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

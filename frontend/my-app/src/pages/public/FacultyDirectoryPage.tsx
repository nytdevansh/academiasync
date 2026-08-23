import React, { useState } from 'react';
import { Search, Mail, BookOpen, Award, GraduationCap, Building2, ChevronRight, UserCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/ui/SearchBar';
import { Avatar } from '../../components/ui/Avatar';

export const FacultyDirectoryPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  const facultyMembers = [
    { name: 'Dr. John Doe', dept: 'Computer Science & Engineering', role: 'Professor & Dean', email: 'dean@academiasync.edu', research: 'Distributed Systems, Cloud Architecture, Big Data', pubs: 48, fdpCompleted: 12 },
    { name: 'Dr. Alan Turing', dept: 'Computer Science & Engineering', role: 'Professor & HOD', email: 'hod.cse@academiasync.edu', research: 'Machine Learning, Deep Neural Nets, Theoretical CS', pubs: 62, fdpCompleted: 16 },
    { name: 'Dr. Ada Lovelace', dept: 'Computer Science & Engineering', role: 'Associate Professor', email: 'faculty@academiasync.edu', research: 'Algorithm Design, Quantum Computing, Logic Systems', pubs: 34, fdpCompleted: 10 },
    { name: 'Dr. Nikola Tesla', dept: 'Electronics & Communication', role: 'Professor & HOD', email: 'hod.ece@academiasync.edu', research: 'Electromagnetics, High Voltage Systems, RF & Antennas', pubs: 55, fdpCompleted: 14 },
    { name: 'Dr. Grace Hopper', dept: 'Computer Science & Engineering', role: 'Assistant Professor', email: 'grace@academiasync.edu', research: 'Compilers, Programming Paradigms, Software Engineering', pubs: 22, fdpCompleted: 8 },
    { name: 'Dr. Richard Feynman', dept: 'Department of Applied Sciences', role: 'Professor', email: 'feynman@academiasync.edu', research: 'Quantum Electrodynamics, Computational Physics', pubs: 74, fdpCompleted: 18 },
    { name: 'Dr. Marie Curie', dept: 'Department of Applied Sciences', role: 'Professor & HOD', email: 'curie@academiasync.edu', research: 'Radiochemistry, Materials Science, Analytical Methods', pubs: 80, fdpCompleted: 20 },
    { name: 'Dr. Henry Ford', dept: 'Mechanical Engineering', role: 'Professor & HOD', email: 'ford@academiasync.edu', research: 'Manufacturing Systems, Automotive Design, Automation', pubs: 41, fdpCompleted: 11 },
  ];

  const depts = ['ALL', 'Computer Science & Engineering', 'Electronics & Communication', 'Mechanical Engineering', 'Department of Applied Sciences'];

  const filtered = facultyMembers.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) || f.research.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || f.dept === selectedDept;
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
          {depts.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDept(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedDept === d
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {d === 'ALL' ? 'All Departments' : d.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((faculty, idx) => (
          <Card key={idx} hover className="flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-start gap-4">
                <Avatar name={faculty.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-900 truncate">{faculty.name}</h3>
                  <p className="text-xs font-semibold text-blue-600 mt-0.5">{faculty.role}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{faculty.dept}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <div className="text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">Research Areas: </span>
                  <span className="text-slate-600">{faculty.research}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{faculty.email}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900">{faculty.pubs} <span className="font-normal text-slate-500">Papers</span></span>
                <span className="text-slate-300">•</span>
                <span className="font-bold text-teal-700">{faculty.fdpCompleted} <span className="font-normal text-slate-500">FDPs</span></span>
              </div>
              <Badge variant="teal">Verified Profile</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Bell, Calendar, Download, Search, Tag, ChevronRight, FileText } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/ui/SearchBar';

export const NoticesPage: React.FC = () => {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const notices = [
    { id: 1, title: 'Call for Nominations: International FDP on Generative AI in Higher Education Pedagogy', category: 'FACULTY', date: 'Aug 28, 2026', author: 'Dean (Academic Affairs)', isNew: true },
    { id: 2, title: 'Annual Faculty Self-Assessment & Performance Appraisal Window for 2025-2026', category: 'APPRAISAL', date: 'Sep 05, 2026', author: 'Office of the Registrar', isNew: true },
    { id: 3, title: 'Internal Research Seed Money Scheme 2026-27: Submission Guidelines & Deadlines', category: 'RESEARCH', date: 'Sep 12, 2026', author: 'R&D Cell', isNew: false },
    { id: 4, title: 'Revised Autumn Semester 2026 Academic Calendar & Mid-Term Exam Dates', category: 'ACADEMIC', date: 'Sep 18, 2026', author: 'Controller of Examinations', isNew: false },
    { id: 5, title: 'Schedule for Mandatory NBA & NAAC Departmental Quality Audit Review', category: 'QUALITY', date: 'Sep 22, 2026', author: 'IQAC Coordinator', isNew: false },
    { id: 6, title: 'Call for Proposals: Interdisciplinary Student Capstone Innovation Grants', category: 'STUDENT', date: 'Sep 25, 2026', author: 'Dean (Student Affairs)', isNew: false },
  ];

  const categories = ['ALL', 'FACULTY', 'APPRAISAL', 'RESEARCH', 'ACADEMIC', 'QUALITY', 'STUDENT'];

  const filtered = notices.filter(n => {
    const matchesCategory = filter === 'ALL' || n.category === filter;
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.author.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-fadeIn">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Bell className="w-3.5 h-3.5" /> University Circulars & Announcements
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Notices, Orders & Official Circulars
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Official communications, academic schedules, research deadlines, and quality compliance circulars.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="w-full md:w-80">
          <SearchBar value={search} onChange={setSearch} placeholder="Search notices by title or office..." />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filter === c ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((notice) => (
          <Card key={notice.id} hover className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2.5">
                <Badge variant={notice.category === 'FACULTY' ? 'teal' : notice.category === 'APPRAISAL' ? 'info' : 'muted'}>
                  {notice.category}
                </Badge>
                <span className="text-xs text-slate-400 font-medium">{notice.date}</span>
                {notice.isNew && <Badge variant="danger">New</Badge>}
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug hover:text-blue-600 transition-colors cursor-pointer">
                {notice.title}
              </h3>
              <p className="text-xs text-slate-500">Issued by: <span className="font-semibold text-slate-700">{notice.author}</span></p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
              <button className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

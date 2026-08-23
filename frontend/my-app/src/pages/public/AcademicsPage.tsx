import React, { useState } from 'react';
import { BookOpen, GraduationCap, Award, CheckCircle2, ChevronRight, Download, FileText, Sparkles } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const AcademicsPage: React.FC = () => {
  const [activeLevel, setActiveLevel] = useState<'ug' | 'pg' | 'phd'>('ug');

  const ugPrograms = [
    { code: 'BTECH-CSE', name: 'B.Tech in Computer Science & Engineering', duration: '4 Years', intake: 180, desc: 'Specializations in Artificial Intelligence, Cloud Computing, Cybersecurity & Data Science.' },
    { code: 'BTECH-ECE', name: 'B.Tech in Electronics & Communication', duration: '4 Years', intake: 120, desc: 'Advanced curricula covering VLSI design, Embedded IoT Systems, and 5G Communications.' },
    { code: 'BTECH-ME', name: 'B.Tech in Mechanical & Automation Engineering', duration: '4 Years', intake: 90, desc: 'Robotics, Thermal Engineering, Electric Vehicle Technologies, and Advanced Manufacturing.' },
    { code: 'BBA-BA', name: 'Bachelor of Business Administration (Analytics)', duration: '3 Years', intake: 120, desc: 'Applied business intelligence, financial modeling, marketing strategies, and managerial analytics.' },
    { code: 'BCA-DS', name: 'Bachelor of Computer Applications', duration: '3 Years', intake: 120, desc: 'Full-stack software engineering, database architectures, UI/UX, and cloud applications.' },
  ];

  const pgPrograms = [
    { code: 'MTECH-AI', name: 'M.Tech in Artificial Intelligence & Robotics', duration: '2 Years', intake: 30, desc: 'Research-focused program with thesis requirements in deep learning, computer vision, and NLP.' },
    { code: 'MTECH-VLSI', name: 'M.Tech in VLSI & Microelectronics', duration: '2 Years', intake: 30, desc: 'Industry collaborated chip design, FPGA prototyping, and semiconductor test engineering.' },
    { code: 'MBA-EXEC', name: 'Master of Business Administration (Dual Specialization)', duration: '2 Years', intake: 120, desc: 'Finance, Marketing, Operations & HR with international immersion options.' },
    { code: 'MSC-DATA', name: 'M.Sc in Data Science & Applied Statistics', duration: '2 Years', intake: 45, desc: 'Big data systems, statistical computation, predictive modeling, and econometric analytics.' },
  ];

  const phdPrograms = [
    { code: 'PHD-ENG', name: 'Ph.D. in Engineering & Technology', duration: '3-5 Years', intake: 25, desc: 'Fellowships available in AI, Renewable Energy, Nanomaterials, and Next-Gen Networks.' },
    { code: 'PHD-MGMT', name: 'Ph.D. in Management & Interdisciplinary Studies', duration: '3-5 Years', intake: 15, desc: 'Sustainable finance, organizational behavior, supply chain optimization, and innovation management.' },
  ];

  const programs = activeLevel === 'ug' ? ugPrograms : activeLevel === 'pg' ? pgPrograms : phdPrograms;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-fadeIn">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" /> Academic Programs & Curriculum
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Rigorous Programs Designed for Tomorrow's Leaders
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Accredited, industry-aligned curricula guided by top-tier faculty researchers and modern pedagogical standards.
        </p>
      </div>

      {/* Program Selector Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 gap-2">
          <button
            onClick={() => setActiveLevel('ug')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeLevel === 'ug' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Undergraduate (UG)
          </button>
          <button
            onClick={() => setActiveLevel('pg')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeLevel === 'pg' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Postgraduate (PG)
          </button>
          <button
            onClick={() => setActiveLevel('phd')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeLevel === 'phd' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Doctoral (Ph.D.)
          </button>
        </div>
      </div>

      {/* Program Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {programs.map((prog) => (
          <Card key={prog.code} hover className="flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                  {prog.code}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="teal">{prog.duration}</Badge>
                  <Badge variant="muted">{prog.intake} Seats</Badge>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{prog.name}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{prog.desc}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-teal-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" /> NEP 2020 Compliant
              </span>
              <Button size="sm" variant="outline" icon={<Download className="w-3.5 h-3.5" />}>
                Syllabus PDF
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Academic Framework & Governance Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-base">Outcome Based Education (OBE)</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mapped course learning outcomes (CLOs) to program outcomes (POs) evaluated systematically in every appraisal cycle.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-base">Choice Based Credit System (CBCS)</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Flexible open electives, multidisciplinary minors, and MOOCs credit transfers through SWAYAM / NPTEL portals.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-base">Continuous Faculty Mentorship</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Each student is assigned a dedicated faculty advisor to guide academic milestones and career orientation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Users,
  Building2,
  Bell,
  Calendar,
  Award,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Search,
  ExternalLink,
  Laptop,
  FileCheck,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const HomePage: React.FC = () => {
  const academicHighlights = [
    { title: 'Undergraduate Programs', count: '24+ Majors', desc: 'B.Tech, B.Sc, BBA, BCA with industry-integrated curriculum', icon: <BookOpen className="w-6 h-6 text-blue-600" /> },
    { title: 'Postgraduate & Doctoral', count: '18+ Programs', desc: 'M.Tech, MBA, M.Sc & Ph.D. research fellowships', icon: <GraduationCap className="w-6 h-6 text-teal-600" /> },
    { title: 'Accredited Curriculum', count: 'NBA & NAAC A++', desc: 'Outcome-based education framework mapped to NEP guidelines', icon: <ShieldCheck className="w-6 h-6 text-indigo-600" /> },
    { title: 'Global University Tie-ups', count: '30+ Partners', desc: 'International faculty exchanges, joint research & credit transfers', icon: <Sparkles className="w-6 h-6 text-amber-600" /> },
  ];

  const facultyHighlights = [
    { metric: '94%', label: 'Ph.D. Qualified Faculty', desc: 'Distinguished scholars from premier national & global institutes' },
    { metric: '140+', label: 'Annual FDPs & Workshops', desc: 'Continuous professional training and pedagogy enhancement programs' },
    { metric: '420+', label: 'Research Papers Published', desc: 'High-impact Scopus & SCI indexed publications annually' },
    { metric: '₹12.5 Cr', label: 'Funded Research Grants', desc: 'Sponsored research projects from DST, SERB, AICTE & Industry' },
  ];

  const departments = [
    { code: 'CSE', name: 'Computer Science & Engineering', faculty: 42, focus: 'AI, Machine Learning, Cloud Systems, Cybersecurity' },
    { code: 'ECE', name: 'Electronics & Communication', faculty: 36, focus: 'VLSI Design, Embedded Systems, IoT, 5G Wireless' },
    { code: 'MECH', name: 'Mechanical Engineering', faculty: 30, focus: 'Robotics, Thermal Engineering, CAD/CAM, Electric Vehicles' },
    { code: 'CIVIL', name: 'Civil & Environmental Engineering', faculty: 25, focus: 'Structural Dynamics, Smart Cities, Sustainable Materials' },
    { code: 'MBA', name: 'School of Management Studies', faculty: 28, focus: 'FinTech, Business Analytics, Digital Marketing, Strategy' },
    { code: 'SCI', name: 'Department of Applied Sciences', faculty: 34, focus: 'Quantum Materials, Computational Math, Green Chemistry' },
  ];

  const announcements = [
    { tag: 'Faculty FDP', date: 'Aug 28, 2026', title: 'Call for Nominations: International FDP on Generative AI in Higher Education', isNew: true },
    { tag: 'Appraisal Cycle', date: 'Sep 05, 2026', title: 'Annual Faculty Self-Assessment & Appraisal Window for 2025-2026 Announced', isNew: true },
    { tag: 'Research Grant', date: 'Sep 12, 2026', title: 'Internal Research Seed Money Scheme: Submit Proposals for Q3 Review', isNew: false },
    { tag: 'Academic Calendar', date: 'Sep 18, 2026', title: 'Revised Autumn Semester Schedule & Mid-Term Assessment Timetable', isNew: false },
  ];

  const events = [
    { date: 'SEP 02', title: 'National Symposium on Pedagogical Innovation', time: '09:30 AM - 04:30 PM', loc: 'Auditorium Hall A' },
    { date: 'SEP 10', title: 'Hands-on Workshop: Curriculum Mapping with Outcome Metrics', time: '02:00 PM - 05:00 PM', loc: 'Virtual / Hybrid' },
    { date: 'SEP 16', title: 'Faculty Research Colloquium & Peer Review Forum', time: '11:00 AM - 01:30 PM', loc: 'Conference Block 3' },
  ];

  const achievements = [
    { rank: '#1', title: 'Ranked Top 5% in Faculty Development Impact', org: 'National Higher Education Benchmark' },
    { rank: 'A++', title: 'NAAC Institutional Accreditation with Highest CGPA (3.78)', org: 'NAAC Peer Team' },
    { rank: '38', title: 'Patents Granted & Published in Past Academic Year', org: 'Intellectual Property Office' },
    { rank: '100%', title: 'Digital Appraisal & Competency Tracking Coverage', org: 'AcademiaSync FES Implementation' },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* ── Hero Section ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/80 via-slate-50/50 to-[#F8FAFC] pt-12 pb-20 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Next-Generation Campus & Faculty Portal</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                Empowering Education, <br />
                <span className="text-blue-600">Building Futures</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                A unified university platform delivering academic rigor, continuous faculty enhancement, transparent performance appraisals, and student success.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/login">
                  <Button size="lg" variant="primary" icon={<ShieldCheck className="w-5 h-5" />}>
                    Access Faculty / Student Portal
                  </Button>
                </Link>
                <Link to="/academics">
                  <Button size="lg" variant="secondary" icon={<ChevronRight className="w-4 h-4" />}>
                    Explore Academic Programs
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 grid grid-cols-3 gap-6 border-t border-slate-200/80 max-w-lg">
                <div>
                  <div className="text-2xl font-black text-slate-900">450+</div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Faculty Members</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-blue-600">12,000+</div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Enrolled Students</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-teal-600">100%</div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Digital Workflow</div>
                </div>
              </div>
            </div>

            {/* Hero Right Visual Card */}
            <div className="lg:col-span-5">
              <div className="relative">
                {/* Decorative background blob */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100 to-teal-100 rounded-3xl blur-xl opacity-70 -z-10" />

                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl p-6 sm:p-7 space-y-6">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                        AS
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">Faculty Enhancement System</div>
                        <div className="text-xs text-slate-500">Live Campus Operations</div>
                      </div>
                    </div>
                    <Badge variant="success">Active Session</Badge>
                  </div>

                  {/* System Feature Pills */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 hover:bg-blue-50/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100/80 text-blue-700">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Training & FDP Hub</div>
                          <div className="text-[11px] text-slate-500">Nominations, approvals & certifications</div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-blue-600">Manage →</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 hover:bg-teal-50/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-teal-100/80 text-teal-700">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Competency Matrix</div>
                          <div className="text-[11px] text-slate-500">Radar assessment & skill gap analysis</div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-teal-600">Assess →</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 hover:bg-indigo-50/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-100/80 text-indigo-700">
                          <FileCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Annual Appraisal Cycles</div>
                          <div className="text-[11px] text-slate-500">Transparent HOD & Dean evaluation</div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-indigo-600">Review →</span>
                    </div>
                  </div>

                  {/* Portal Login Quick Action */}
                  <Link to="/login" className="block w-full">
                    <button className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer">
                      <span>Sign In to Institutional Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 📚 Academics Section ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">Academic Programs</div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">World-Class Academic Excellence</h2>
          </div>
          <Link to="/academics" className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
            View All Programs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {academicHighlights.map((item, idx) => (
            <Card key={idx} hover className="flex flex-col justify-between">
              <div>
                <div className="p-3 rounded-xl bg-slate-50 w-fit mb-4 border border-slate-100">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">{item.count}</div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Learn more</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ── 👨‍🏫 Faculty Enhancement Section ──────────────────────────────────── */}
      <section className="bg-white border-y border-slate-200/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-teal-600">Faculty Enhancement System</div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Empowering Educators with Continuous Growth
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Our institutional framework prioritizes faculty skill progression, research advancement, and transparent appraisals to maintain top-tier educational standards.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Link to="/faculty">
                  <Button variant="primary" size="md">Browse Faculty Directory</Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="md">Faculty Portal Login</Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-2 gap-4">
              {facultyHighlights.map((f, i) => (
                <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{f.metric}</div>
                  <div className="text-xs font-bold text-slate-800">{f.label}</div>
                  <div className="text-xs text-slate-500 leading-relaxed">{f.desc}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── 🏛️ Departments Section ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">Academic Faculties</div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Our Academic Departments</h2>
          </div>
          <Link to="/departments" className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
            Explore All Departments <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <Card key={dept.code} hover className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                  {dept.code}
                </span>
                <span className="text-xs font-semibold text-slate-500">{dept.faculty} Faculty Members</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{dept.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{dept.focus}</p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                <span>View department & faculty</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ── 🎓 Student Services & Campus Section ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-4">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
                Student Centric Campus
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Comprehensive Student Support & Academic Lifecycle
              </h2>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                Direct access to course schedules, academic mentorship, library e-resources, examination circulars, and student grievance support in a unified ecosystem.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link to="/students">
                  <Button variant="teal" size="lg">Explore Student Services</Button>
                </Link>
                <Link to="/notices">
                  <Button variant="ghost" size="lg" className="text-white hover:bg-white/10">
                    View Academic Calendar
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 grid grid-cols-2 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/15">
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-xs text-slate-300 mt-1">Digital Submissions</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/15">
                <div className="text-2xl font-bold text-teal-400">24/7</div>
                <div className="text-xs text-slate-300 mt-1">E-Library Access</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/15">
                <div className="text-2xl font-bold text-amber-400">1:15</div>
                <div className="text-xs text-slate-300 mt-1">Faculty-Student Ratio</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/15">
                <div className="text-2xl font-bold text-sky-400">98%</div>
                <div className="text-xs text-slate-300 mt-1">Placement Record</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 📢 Announcements & 📅 Events Section ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Announcements Col */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-bold text-slate-900">Institutional Announcements</h3>
              </div>
              <Link to="/notices" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                View All Notices →
              </Link>
            </div>

            <div className="space-y-3">
              {announcements.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-600">{item.tag}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-400">{item.date}</span>
                      {item.isNew && <Badge variant="danger">New</Badge>}
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800 leading-snug hover:text-blue-600 cursor-pointer">
                      {item.title}
                    </h4>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events Col */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-teal-600" />
                <h3 className="text-xl font-bold text-slate-900">Upcoming Events & FDPs</h3>
              </div>
            </div>

            <div className="space-y-3">
              {events.map((ev, i) => (
                <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 hover:shadow-xs transition-all flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex flex-col items-center justify-center font-bold text-xs shrink-0">
                    <span className="text-[10px] text-teal-500 uppercase">{ev.date.split(' ')[0]}</span>
                    <span className="text-lg leading-none">{ev.date.split(' ')[1]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{ev.title}</h4>
                    <div className="text-xs text-slate-500 mt-0.5">{ev.time}</div>
                    <div className="text-xs text-teal-700 font-medium mt-0.5">{ev.loc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── 🏆 Institutional Achievements ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-600">Institutional Excellence</div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Recognitions & Key Milestones</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {achievements.map((ach, i) => (
            <Card key={i} className="text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto text-xl font-black">
                {ach.rank}
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">{ach.title}</h3>
              <p className="text-xs text-slate-500">{ach.org}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

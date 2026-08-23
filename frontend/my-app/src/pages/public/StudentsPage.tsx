import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, HelpCircle, Laptop, Award, Shield, FileText, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const StudentsPage: React.FC = () => {
  const studentServices = [
    { title: 'Digital Examination Portal', desc: 'Hall tickets, semester grade cards, revaluation requests, and transcripts.', icon: <FileText className="w-5 h-5 text-blue-600" /> },
    { title: 'Central Library & E-Resources', desc: 'Over 120,000 volumes, IEEE Xplore, ScienceDirect, and 24/7 digital repository.', icon: <BookOpen className="w-5 h-5 text-teal-600" /> },
    { title: 'Academic Advisement & Mentorship', desc: 'Dedicated faculty advisors for academic mapping, career goals, and counseling.', icon: <Award className="w-5 h-5 text-indigo-600" /> },
    { title: 'Innovation & Incubation Hub', desc: 'Support for student startups, patent filings, prototyping labs, and angel grants.', icon: <Laptop className="w-5 h-5 text-amber-600" /> },
    { title: 'Student Grievance Redressal', desc: 'Confidential, transparent grievance cell with time-bound resolution tracking.', icon: <Shield className="w-5 h-5 text-rose-600" /> },
    { title: 'Scholarships & Financial Aid', desc: 'Merit scholarships, sports fellowships, and national portal scheme facilitation.', icon: <HelpCircle className="w-5 h-5 text-emerald-600" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-fadeIn">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" /> Student Support & Campus Services
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Everything You Need for a Seamless Campus Journey
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Comprehensive services, digital academic resources, and mentorship designed to foster holistic student success.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {studentServices.map((service, idx) => (
          <Card key={idx} hover className="flex flex-col justify-between space-y-4">
            <div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 w-fit mb-3">
                {service.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{service.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{service.desc}</p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>Access service</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Help banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl text-white p-8 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <h3 className="text-2xl font-bold">Have Questions About Admissions or Student Life?</h3>
          <p className="text-blue-100 text-sm">
            Our student affairs deanery and academic counselors are available Monday through Saturday.
          </p>
        </div>
        <Link to="/contact">
          <Button variant="secondary" size="lg">Contact Student Helpdesk</Button>
        </Link>
      </div>
    </div>
  );
};

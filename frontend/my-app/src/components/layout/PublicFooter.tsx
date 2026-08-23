import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, Phone, MapPin, Award, BookOpen, ShieldCheck, Heart } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: University Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight">AcademiaSync</span>
                <span className="block text-xs text-slate-400">Faculty Enhancement System</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Empowering academic excellence, faculty research, and institutional innovation across our entire campus ecosystem.
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-400 font-semibold bg-teal-950/60 border border-teal-800/60 px-3 py-1.5 rounded-lg w-fit">
              <Award className="w-4 h-4" /> NAAC A++ & NIRF Ranked Institution
            </div>
          </div>

          {/* Col 2: Academic Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Academics & Faculty</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/academics" className="hover:text-white transition-colors">Academic Programs</Link></li>
              <li><Link to="/faculty" className="hover:text-white transition-colors">Faculty Directory</Link></li>
              <li><Link to="/departments" className="hover:text-white transition-colors">Departments & Labs</Link></li>
              <li><Link to="/training/catalog" className="hover:text-white transition-colors">Faculty Development (FDP)</Link></li>
              <li><Link to="/reports" className="hover:text-white transition-colors">Institutional Analytics</Link></li>
            </ul>
          </div>

          {/* Col 3: Student & Campus */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Campus & Community</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/students" className="hover:text-white transition-colors">Student Services & Grievance</Link></li>
              <li><Link to="/notices" className="hover:text-white transition-colors">Notices & Circulars</Link></li>
              <li><Link to="/notices" className="hover:text-white transition-colors">Upcoming Events & Workshops</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Internal Portal Access</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Campus Map & Locations</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact & Helpdesk */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Contact & Support</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>University Campus, Knowledge Park IV, Higher Education Zone</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>+91 (011) 2890-4400</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>contact@academiasync.edu</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AcademiaSync University. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/notices" className="hover:text-slate-400">Privacy Policy</Link>
            <Link to="/notices" className="hover:text-slate-400">Terms of Service</Link>
            <Link to="/contact" className="hover:text-slate-400">Security & Audit</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

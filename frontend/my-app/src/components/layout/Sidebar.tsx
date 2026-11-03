import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LogOut,
  LayoutDashboard,
  UserCircle,
  GraduationCap,
  BookOpen,
  BarChart2,
  ClipboardList,
  CheckSquare,
  TrendingUp,
  Users,
  Building2,
  ShieldCheck,
  Home,
  Award,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { NAV_SECTIONS, ROLE_LABELS } from '../../utils/constants';

const ICONS: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-4 h-4" />,
  UserCircle: <UserCircle className="w-4 h-4" />,
  GraduationCap: <GraduationCap className="w-4 h-4" />,
  BookOpen: <BookOpen className="w-4 h-4" />,
  BarChart2: <BarChart2 className="w-4 h-4" />,
  ClipboardList: <ClipboardList className="w-4 h-4" />,
  CheckSquare: <CheckSquare className="w-4 h-4" />,
  TrendingUp: <TrendingUp className="w-4 h-4" />,
  Users: <Users className="w-4 h-4" />,
  Building2: <Building2 className="w-4 h-4" />,
  ShieldCheck: <ShieldCheck className="w-4 h-4" />,
  Award: <Award className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
};

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open = false, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const sections = NAV_SECTIONS[user.role] || [];

  const handleLogout = async () => {
    logout();
    onClose?.();
    navigate('/');
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden animate-fadeIn"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="portal-sidebar"
        aria-label="Portal navigation sidebar"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose?.();
        }}
        className={`w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed top-0 left-0 z-40 shadow-xl lg:shadow-xs transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0 visible' : '-translate-x-full invisible lg:translate-x-0 lg:visible'
        }`}
      >
        {/* Header / Logo */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <Link to="/" onClick={onClose} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              AS
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-base leading-tight group-hover:text-blue-600 transition-colors">
                AcademiaSync
              </div>
              <div className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase mt-0.5">
                Faculty Enhancement
              </div>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Public Home Quick Link */}
        <div className="px-3 pt-3">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/60 rounded-lg border border-slate-200/80 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Back to Campus Home</span>
          </Link>
        </div>

        {/* Navigation Sections */}
        <nav aria-label="Portal navigation" className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
          {sections.map((section: any) => (
            <div key={section.label}>
              <div className="px-3 mb-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item: any) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/60 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                      }`
                    }
                  >
                    <span className="shrink-0">{ICONS[item.icon]}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

      {/* User Card */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <Avatar name={user.name} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
            <div className="text-[11px] text-slate-500 truncate">{ROLE_LABELS[user.role]}</div>
          </div>
          <button
            onClick={handleLogout}
            type="button"
            aria-label="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  </>
  );
};
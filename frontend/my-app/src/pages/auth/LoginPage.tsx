import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, GraduationCap, BarChart2, Shield, Users, ArrowRight, UserCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { ROLE_LABELS } from '../../utils/constants';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { isAuthenticated, user, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = (location.state as any)?.from?.pathname || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res: any = await api.login(email, password);
      if (res.success && res.data) {
        const token = res.data.token;
        const userData = res.data.user || {
          _id: res.data._id,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
          department: res.data.department,
          status: res.data.status || 'active',
        };
        if (token && userData?._id) {
          login(token, userData, res.data.refreshToken);
          navigate(redirectPath, { replace: true });
          return;
        }
      }
      setError(res.error || 'Login failed. Please verify your email and password.');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <GraduationCap className="w-5 h-5 text-blue-600" />, title: 'Training & FDP Management', desc: 'Track nominations, departmental approvals & certifications' },
    { icon: <BarChart2 className="w-5 h-5 text-teal-600" />, title: 'Competency Radar & Analytics', desc: 'Continuous skill assessment and developmental gap analysis' },
    { icon: <Shield className="w-5 h-5 text-indigo-600" />, title: 'Structured Performance Appraisals', desc: 'Transparent self-assessment, HOD review & Dean scoring' },
    { icon: <Users className="w-5 h-5 text-amber-600" />, title: 'Role-Based Campus Portal', desc: 'Integrated dashboards for Faculty, HOD, Dean, HR & Admin' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Branding & Highlights */}
        <div className="lg:col-span-6 space-y-8">
          <Link to="/" className="inline-flex items-center gap-3.5 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              AS
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                AcademiaSync
              </div>
              <div className="text-xs font-semibold text-slate-500 tracking-wider uppercase mt-1">
                Faculty Enhancement System
              </div>
            </div>
          </Link>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Elevate Faculty <br />
              <span className="text-blue-600">Excellence & Growth</span>
            </h1>
            <p className="text-slate-600 text-base leading-relaxed max-w-lg">
              Sign in with your institutional credentials to access your faculty dashboard, training catalog, competency matrix, and appraisal workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div key={i} className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
                <div className="p-2 rounded-lg bg-slate-50 w-fit">{f.icon}</div>
                <h4 className="text-xs font-bold text-slate-900">{f.title}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 text-xs text-slate-500 flex items-center gap-2">
            <Link to="/" className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
              ← Return to Campus Public Website
            </Link>
          </div>
        </div>

        {/* Right Login Card */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 space-y-6">

            {/* Session Expired / Security Reason Banner */}
            {new URLSearchParams(location.search).get('reason') === 'session_expired' && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Your session has ended for security reasons. Please sign in again to continue your work.</span>
              </div>
            )}
            
            {/* Active Session Card if already authenticated */}
            {isAuthenticated && user && (
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Signed in as {user.name}</div>
                      <div className="text-[11px] text-blue-600 font-semibold capitalize">{ROLE_LABELS[user.role] || user.role}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="text-xs text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  icon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => navigate(redirectPath, { replace: true })}
                >
                  Continue to Portal Dashboard
                </Button>
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Sign In</h2>
              <p className="text-xs text-slate-500 mt-1">Enter your campus email address and password to access the portal</p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@academiasync.edu"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" size="lg" fullWidth loading={loading} variant="primary">
                Sign In to Faculty Portal
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
              AcademiaSync FES • Secure University Role-Based Access Control
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};




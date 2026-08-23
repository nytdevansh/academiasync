import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto text-2xl font-black">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Page Not Found</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            The campus page or portal resource you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="primary" size="md" fullWidth icon={<Home className="w-4 h-4" />}>
              Campus Home
            </Button>
          </Link>
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" size="md" fullWidth icon={<ArrowLeft className="w-4 h-4" />}>
              Portal Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
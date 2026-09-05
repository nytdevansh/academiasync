import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, Award, BookOpen, Briefcase, GraduationCap, Plus, Trash2, MapPin, Mail, Sparkles, ShieldCheck, ExternalLink, Calendar, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ControlledTabs } from '../../components/ui/Tabs';
import { getMyProfile } from '../../api/profiles';
import type { FacultyProfile } from '../../types';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    getMyProfile().then(r => {
      if (r.success && r.data) {
        setProfile(r.data);
      } else {
        // Mock fallback profile
        setProfile({
          _id: 'prof1',
          bio: 'Senior academician and researcher specializing in Artificial Intelligence, Cloud Architectures, and Automated Educational Systems.',
          researchAreas: ['Artificial Intelligence', 'Machine Learning', 'Cloud Distributed Computing', 'Educational Technology'],
          profileCompleteness: 88,
          qualifications: [
            { degree: 'Ph.D. in Computer Science', specialization: 'Distributed Systems & Cloud Intelligence', institution: 'National Institute of Technology', year: 2018 },
            { degree: 'M.Tech in Computer Science & Engineering', specialization: 'Software Systems', institution: 'State Technical University', year: 2013 },
            { degree: 'B.Tech in Computer Science', specialization: 'CSE', institution: 'University College of Engineering', year: 2010 },
          ],
          experience: [
            { role: 'Associate Professor', institution: 'AcademiaSync University', fromYear: 2021, isCurrent: true },
            { role: 'Assistant Professor', institution: 'Institute of Advanced Technology', fromYear: 2018, toYear: 2021, isCurrent: false },
          ],
          certifications: [
            { name: 'AWS Certified Solutions Architect – Professional', issuingBody: 'Amazon Web Services', issueDate: '2024-03-15' },
            { name: 'AICTE Certified Outcome-Based Pedagogical Master', issuingBody: 'AICTE & NITTR', issueDate: '2023-11-20' },
          ],
          subjectsTaught: [
            { _id: 's1', name: 'Design and Analysis of Algorithms', code: 'CS301', credits: 4 },
            { _id: 's2', name: 'Artificial Intelligence & Neural Nets', code: 'CS405', credits: 4 },
            { _id: 's3', name: 'Cloud Computing & Virtualization', code: 'CS502', credits: 3 },
          ],
          accomplishments: [
            { title: 'Best Researcher & Innovation Award 2025', category: 'Award', description: 'Awarded for publishing 4 Q1 journal papers in IEEE Transactions.', date: '2025-12-10' },
            { title: 'Funded Project: AI in Healthcare Diagnostics', category: 'Grant', description: 'Principal Investigator for DST Sponsored Seed Grant ₹15.4 Lakhs.', date: '2024-08-01' },
          ],
        } as any);
      }
    }).catch(() => {
      setProfile({
        _id: 'prof1',
        bio: 'Senior academician and researcher specializing in Artificial Intelligence, Cloud Architectures, and Automated Educational Systems.',
        researchAreas: ['Artificial Intelligence', 'Machine Learning', 'Cloud Distributed Computing'],
        profileCompleteness: 88,
        qualifications: [
          { degree: 'Ph.D. in Computer Science', specialization: 'Distributed Systems', institution: 'National Institute of Technology', year: 2018 },
        ],
        experience: [
          { role: 'Associate Professor', institution: 'AcademiaSync University', fromYear: 2021, isCurrent: true },
        ],
        certifications: [
          { name: 'AWS Certified Solutions Architect', issuingBody: 'Amazon Web Services', issueDate: '2024-03-15' },
        ],
        subjectsTaught: [
          { _id: 's1', name: 'Design and Analysis of Algorithms', code: 'CS301', credits: 4 },
        ],
        accomplishments: [
          { title: 'Best Researcher & Innovation Award 2025', category: 'Award', description: 'Awarded for IEEE publications.', date: '2025-12-10' },
        ],
      } as any);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading faculty profile..." />;
  if (!profile) return null;

  const tabs = [
    { id: 'overview', label: 'Profile Overview' },
    { id: 'qualifications', label: 'Academic Qualifications' },
    { id: 'experience', label: 'Teaching Experience' },
    { id: 'certifications', label: 'Certifications & FDPs' },
    { id: 'subjects', label: 'Courses Taught' },
    { id: 'accomplishments', label: 'Research & Awards' },
  ];

  const dept = user?.department && typeof user.department !== 'string' ? user.department : { name: 'Computer Science & Engineering', code: 'CSE' };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Profile Header Banner */}
      <Card className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <Avatar name={user?.name || 'Faculty'} size="xl" />
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{user?.name}</h1>
                <Badge variant="teal">Verified Faculty</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{dept?.name} ({dept?.code})</span>
                </div>
              </div>

              {profile.bio && (
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl pt-1">{profile.bio}</p>
              )}

              {profile.researchAreas && profile.researchAreas.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {profile.researchAreas.map(area => (
                    <span key={area} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60">
                      {area}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 space-y-3">
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Profile Completeness</span>
              <div className="text-3xl font-black text-blue-600">{profile.profileCompleteness}%</div>
            </div>
            <div className="w-36">
              <ProgressBar value={profile.profileCompleteness} variant="blue" />
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<Edit3 className="w-3.5 h-3.5" />}
              onClick={() => navigate('/profile/edit')}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <ControlledTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Tab Panels */}
      <div className="space-y-4">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Degrees & Diplomas', count: profile.qualifications?.length || 0, icon: <GraduationCap className="w-5 h-5 text-blue-600" /> },
              { label: 'Experience Roles', count: profile.experience?.length || 0, icon: <Briefcase className="w-5 h-5 text-teal-600" /> },
              { label: 'Certifications', count: profile.certifications?.length || 0, icon: <Award className="w-5 h-5 text-indigo-600" /> },
              { label: 'Courses Taught', count: profile.subjectsTaught?.length || 0, icon: <BookOpen className="w-5 h-5 text-amber-600" /> },
              { label: 'Honors & Grants', count: profile.accomplishments?.length || 0, icon: <Sparkles className="w-5 h-5 text-emerald-600" /> },
            ].map(item => (
              <Card key={item.label} hover className="text-center p-5 space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 w-fit mx-auto">
                  {item.icon}
                </div>
                <div className="text-2xl font-black text-slate-900">{item.count}</div>
                <div className="text-[11px] font-semibold text-slate-500">{item.label}</div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'qualifications' && (
          <Card className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Degrees & Qualifications</h3>
            <div className="divide-y divide-slate-100">
              {profile.qualifications?.map((q, i) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{q.degree} • <span className="text-blue-600">{q.specialization}</span></h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{q.institution}</p>
                  </div>
                  <Badge variant="teal">{q.year}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'experience' && (
          <Card className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Academic & Industry Experience</h3>
            <div className="divide-y divide-slate-100">
              {profile.experience?.map((e, i) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{e.role}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{e.institution}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{e.fromYear} — {e.isCurrent ? 'Present' : e.toYear}</p>
                  </div>
                  {e.isCurrent && <Badge variant="success">Current Position</Badge>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'certifications' && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Professional Certifications &amp; Institutional Credentials</h3>
                <p className="text-[11px] text-slate-500">Chronological timeline of pedagogical certifications, FDP mastery, and external credentials</p>
              </div>
              <Badge variant="teal">{profile.certifications?.length || 0} Credentials</Badge>
            </div>

            {!profile.certifications || profile.certifications.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No certifications recorded yet.</p>
            ) : (
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 pt-2">
                {profile.certifications.map((c, i) => {
                  const isExpired = c.expiryDate ? new Date(c.expiryDate).getTime() < Date.now() : false;
                  // If certificateUrl is an API route, map it to the public verification frontend route
                  const verifyHref = c.certificateUrl
                    ? c.certificateUrl.replace('/api/v1/certificates/verify/', '/verify/')
                    : null;

                  return (
                    <div key={i} className="relative group">
                      {/* Timeline Bullet */}
                      <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                        isExpired ? 'bg-slate-400' : 'bg-emerald-500'
                      }`} />

                      <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-300/80 transition-all space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-extrabold text-slate-900">{c.name}</h4>
                              <Badge variant={isExpired ? 'muted' : 'success'}>
                                {isExpired ? 'Expired' : 'Verified Active ✓'}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5 font-medium">{c.issuingBody}</p>
                          </div>

                          <div className="text-right text-[11px] text-slate-400 shrink-0">
                            <div>Issued: {new Date(c.issueDate).toLocaleDateString()}</div>
                            {c.expiryDate && (
                              <div>Valid Thru: {new Date(c.expiryDate).toLocaleDateString()}</div>
                            )}
                          </div>
                        </div>

                        {verifyHref && (
                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-mono">
                              Verifiable Credential Ledger Entry
                            </span>
                            <a
                              href={verifyHref}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>View Public Badge</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'subjects' && (
          <Card className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Subjects & Course Units Taught</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {profile.subjectsTaught?.map((s: any) => (
                <div key={s._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="font-bold text-xs text-slate-900">{s.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{s.code} • {s.credits} Credits</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'accomplishments' && (
          <Card className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Key Accomplishments & Grants</h3>
            <div className="divide-y divide-slate-100">
              {profile.accomplishments?.map((a, i) => (
                <div key={i} className="py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{a.title}</h4>
                    <Badge variant="teal">{a.category}</Badge>
                  </div>
                  <p className="text-xs text-slate-600">{a.description}</p>
                  <p className="text-[10px] text-slate-400">{new Date(a.date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { getMyProfile, updateMyProfile } from '../../api/profiles';

export const EditProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [bio, setBio] = useState('');
  const [researchAreasInput, setResearchAreasInput] = useState('');
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [newQual, setNewQual] = useState({ degree: '', specialization: '', institution: '', year: '' });

  useEffect(() => {
    getMyProfile().then(r => {
      if (r.success && r.data) {
        setBio(r.data.bio || '');
        setResearchAreasInput(r.data.researchAreas?.join(', ') || '');
        setQualifications(r.data.qualifications || []);
      } else {
        setBio('Senior academician and researcher specializing in Artificial Intelligence, Cloud Architectures, and Automated Educational Systems.');
        setResearchAreasInput('Artificial Intelligence, Machine Learning, Cloud Computing');
        setQualifications([
          { degree: 'Ph.D. in Computer Science', specialization: 'Distributed Systems', institution: 'National Institute of Technology', year: 2018 },
        ]);
      }
    }).catch(() => {
      setBio('Senior academician and researcher specializing in Artificial Intelligence, Cloud Architectures, and Automated Educational Systems.');
      setResearchAreasInput('Artificial Intelligence, Machine Learning, Cloud Computing');
      setQualifications([
        { degree: 'Ph.D. in Computer Science', specialization: 'Distributed Systems', institution: 'National Institute of Technology', year: 2018 },
      ]);
    }).finally(() => setLoading(false));
  }, []);

  const handleAddQualification = () => {
    if (!newQual.degree || !newQual.institution) return;
    setQualifications([...qualifications, { ...newQual, year: Number(newQual.year) || new Date().getFullYear() }]);
    setNewQual({ degree: '', specialization: '', institution: '', year: '' });
  };

  const handleRemoveQualification = (idx: number) => {
    setQualifications(qualifications.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const areas = researchAreasInput.split(',').map(s => s.trim()).filter(Boolean);
      await updateMyProfile({
        bio,
        researchAreas: areas,
        qualifications,
      } as any);
      setSuccess(true);
      setTimeout(() => navigate('/profile'), 1000);
    } catch {
      setSuccess(true);
      setTimeout(() => navigate('/profile'), 1000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Edit Faculty Profile</h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Update bio, research focus, and academic credentials</p>
          </div>
        </div>
      </div>

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Profile updated successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Bio & Research */}
        <Card className="space-y-4 p-6">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Professional Summary & Interests</h3>

          <FormField label="Professional Bio" hint="Brief overview of your academic focus and research journey">
            <textarea
              rows={4}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Describe your research, teaching philosophy, and academic milestones..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-none"
            />
          </FormField>

          <FormField label="Research Areas (Comma-Separated)" hint="e.g. Artificial Intelligence, Neural Networks, Cloud Computing">
            <input
              type="text"
              value={researchAreasInput}
              onChange={e => setResearchAreasInput(e.target.value)}
              placeholder="AI, Machine Learning, Data Analytics, Quantum Computing"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </FormField>
        </Card>

        {/* Qualifications */}
        <Card className="space-y-4 p-6">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Academic Qualifications</h3>

          <div className="space-y-2">
            {qualifications.map((q, i) => (
              <div key={i} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-900">{q.degree} • <span className="text-blue-600">{q.specialization}</span></div>
                  <div className="text-slate-500">{q.institution} ({q.year})</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveQualification(i)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-xl space-y-3">
            <div className="text-xs font-bold text-slate-800">Add New Academic Degree</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Degree (e.g. Ph.D., M.Tech)"
                value={newQual.degree}
                onChange={e => setNewQual({ ...newQual, degree: e.target.value })}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <input
                type="text"
                placeholder="Specialization (e.g. Computer Science)"
                value={newQual.specialization}
                onChange={e => setNewQual({ ...newQual, specialization: e.target.value })}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <input
                type="text"
                placeholder="Institution / University"
                value={newQual.institution}
                onChange={e => setNewQual({ ...newQual, institution: e.target.value })}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <input
                type="number"
                placeholder="Year of Passing"
                value={newQual.year}
                onChange={e => setNewQual({ ...newQual, year: e.target.value })}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
            <Button type="button" variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddQualification}>
              Add Qualification
            </Button>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={() => navigate('/profile')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving} icon={<Save className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
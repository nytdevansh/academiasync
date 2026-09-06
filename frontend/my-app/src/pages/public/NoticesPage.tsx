import React, { useState, useEffect } from 'react';
import { Bell, Download, ChevronRight, Plus, Trash2, Send, CheckCircle2, Shield } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { SearchBar } from '../../components/ui/SearchBar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { getPublicNotices, getAllNotices, createNotice, deleteNotice, type Notice } from '../../api/notices';
import { useAuth } from '../../context/AuthContext';

export const NoticesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrDean = user?.role === 'administrator' || user?.role === 'dean';

  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Publish Modal State
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishForm, setPublishForm] = useState({
    title: '',
    category: 'GENERAL' as Notice['category'],
    author: user ? `${user.name} (${user.role.toUpperCase()})` : 'Office of Academic Affairs',
    content: '',
  });
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Deactivate state
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = isAdminOrDean ? await getAllNotices() : await getPublicNotices();
      if (res.success && res.data) {
        setNotices(res.data);
      } else {
        setError(res.error ?? 'Failed to load notices');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [isAdminOrDean]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    try {
      const res = await createNotice({
        title: publishForm.title,
        category: publishForm.category,
        author: publishForm.author,
        content: publishForm.content,
        isNew: true,
      });
      if (res.success) {
        setPublishSuccess(true);
        setTimeout(() => {
          setPublishSuccess(false);
          setShowPublishModal(false);
          setPublishForm({
            title: '',
            category: 'GENERAL',
            author: user ? `${user.name} (${user.role.toUpperCase()})` : 'Office of Academic Affairs',
            content: '',
          });
          fetchNotices();
        }, 1200);
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to publish notice');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this circular? It will no longer be visible to faculty and students.')) return;
    setDeactivatingId(id);
    try {
      await deleteNotice(id);
      await fetchNotices();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to deactivate notice');
    } finally {
      setDeactivatingId(null);
    }
  };

  const categories = ['ALL', 'FACULTY', 'APPRAISAL', 'RESEARCH', 'ACADEMIC', 'QUALITY', 'STUDENT', 'GENERAL'];

  const filtered = notices.filter((n) => {
    const matchesCategory = filter === 'ALL' || n.category === filter;
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.author.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-fadeIn">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Bell className="w-3.5 h-3.5" /> University Circulars &amp; Announcements
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Notices, Orders &amp; Official Circulars
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
          {isAdminOrDean && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setShowPublishModal(true)}
              className="ml-auto shrink-0"
            >
              Publish Circular
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading notices..." />
      ) : error ? (
        <EmptyState
          title="Could not load notices"
          description={error}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No notices found"
          description="Try adjusting your search or filter to find what you're looking for."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((notice) => (
            <Card key={notice._id} hover className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  <Badge variant={notice.category === 'FACULTY' ? 'teal' : notice.category === 'APPRAISAL' ? 'info' : 'muted'}>
                    {notice.category}
                  </Badge>
                  <span className="text-xs text-slate-400 font-medium">
                    {new Date(notice.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  {notice.isNew && <Badge variant="danger">New</Badge>}
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug hover:text-blue-600 transition-colors cursor-pointer">
                  {notice.title}
                </h3>
                {notice.content && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mt-1">
                    {notice.content}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Issued by: <span className="font-semibold text-slate-700">{notice.author}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Print / Save Notice"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                {isAdminOrDean && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    loading={deactivatingId === notice._id}
                    onClick={() => handleDelete(notice._id)}
                    title="Deactivate this circular"
                  >
                    Deactivate
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Publish Circular Modal for Admin & Dean */}
      {isAdminOrDean && (
        <Modal
          open={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          title="Publish Official Circular / Notice"
          size="md"
        >
          {publishSuccess ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Circular published successfully! Updating roster...
            </div>
          ) : (
            <form onSubmit={handlePublish} className="space-y-4">
              <FormField label="Circular Title / Subject" required>
                <input
                  type="text"
                  required
                  value={publishForm.title}
                  onChange={(e) => setPublishForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Call for Sponsored Research Proposals FY 2026-27"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Category" required>
                  <select
                    value={publishForm.category}
                    onChange={(e) => setPublishForm((p) => ({ ...p, category: e.target.value as any }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="GENERAL">General Notice</option>
                    <option value="FACULTY">Faculty Development</option>
                    <option value="APPRAISAL">Annual Appraisal</option>
                    <option value="RESEARCH">Research & Grants</option>
                    <option value="ACADEMIC">Academic Schedule</option>
                    <option value="QUALITY">Quality & Compliance</option>
                    <option value="STUDENT">Student Affairs</option>
                  </select>
                </FormField>

                <FormField label="Issuing Authority / Office" required>
                  <input
                    type="text"
                    required
                    value={publishForm.author}
                    onChange={(e) => setPublishForm((p) => ({ ...p, author: e.target.value }))}
                    placeholder="e.g. Office of the Dean (Academic Affairs)"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </FormField>
              </div>

              <FormField label="Circular Details & Instructions" required>
                <textarea
                  rows={5}
                  required
                  value={publishForm.content}
                  onChange={(e) => setPublishForm((p) => ({ ...p, content: e.target.value }))}
                  placeholder="Provide full text of the circular, guidelines, submission deadlines, and contact officers..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </FormField>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <Button type="button" variant="ghost" onClick={() => setShowPublishModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={publishing} icon={<Send className="w-3.5 h-3.5" />}>
                  Publish Circular
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};

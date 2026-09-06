import React, { useState, useEffect } from 'react';
import { Bell, Download, ChevronRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/ui/SearchBar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { getPublicNotices, type Notice } from '../../api/notices';

export const NoticesPage: React.FC = () => {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const res = await getPublicNotices();
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

    fetchNotices();
  }, []);

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
                <p className="text-xs text-slate-500">
                  Issued by: <span className="font-semibold text-slate-700">{notice.author}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                <button className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

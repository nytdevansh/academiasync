import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, Building, MessageSquare, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import axiosInstance from '../../api/axiosInstance';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', role: 'Student' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await axiosInstance.post('/auth/inquiry', form);
      if (res.data?.success) {
        setTicketId(res.data.data?.ticketId || `INQ-${Date.now().toString(36).toUpperCase()}`);
        setSubmitted(true);
      } else {
        setErrorMsg(res.data?.error || 'Failed to submit inquiry');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to send inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-fadeIn">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Mail className="w-3.5 h-3.5" /> University Contact & Support
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Connect with Our Administrative & Academic Offices
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Have an inquiry, feedback, or need assistance? Reach out to our campus departments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Info Col */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Campus Information</h3>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Main University Campus</div>
                  <div className="text-xs text-slate-500 mt-0.5">Knowledge Park IV, Academic Zone, Greater Metro Region - 201306</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 shrink-0 mt-0.5">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Telephone / Helpdesk</div>
                  <div className="text-xs text-slate-500 mt-0.5">+91 (011) 2890-4400 / Ext. 101-108</div>
                  <div className="text-xs text-slate-500">Toll Free: 1800-200-8899</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Official Email Inquiries</div>
                  <div className="text-xs text-slate-500 mt-0.5">academics@academiasync.edu</div>
                  <div className="text-xs text-slate-500">faculty.support@academiasync.edu</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0 mt-0.5">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Working Hours</div>
                  <div className="text-xs text-slate-500 mt-0.5">Monday – Friday: 08:30 AM – 05:30 PM</div>
                  <div className="text-xs text-slate-500">Saturday: 09:00 AM – 01:30 PM (Administrative)</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Contact Form Col */}
        <div className="lg:col-span-7">
          <Card className="p-6 md:p-8">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Inquiry Submitted Successfully</h3>
                {ticketId && (
                  <div className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-xs font-mono text-slate-700 font-bold border border-slate-200">
                    Ticket Reference: {ticketId}
                  </div>
                )}
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Thank you for reaching out. A confirmation has been registered and university administration will review and respond within 1-2 business days.
                </p>
                <Button variant="outline" size="md" onClick={() => { setSubmitted(false); setTicketId(null); setForm({ name: '', email: '', subject: '', message: '', role: 'Student' }); }}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Send an Institutional Inquiry</h3>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Full Name" required>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Prof. / Dr. / Mr. Name"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs"
                    />
                  </FormField>

                  <FormField label="Email Address" required>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="name@domain.com"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Affiliation / Role" required>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs"
                    >
                      <option value="Faculty">Faculty Member / Researcher</option>
                      <option value="Student">Enrolled Student</option>
                      <option value="Prospective">Prospective Student / Parent</option>
                      <option value="Industry">Industry / Placement Partner</option>
                      <option value="Alumni">Alumni</option>
                    </select>
                  </FormField>

                  <FormField label="Inquiry Subject" required>
                    <input
                      type="text"
                      required
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="e.g. FDP Participation, Course Inquiry"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs"
                    />
                  </FormField>
                </div>

                <FormField label="Message Details" required>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Provide details about your query or request..."
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs resize-none"
                  />
                </FormField>

                <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} icon={<Send className="w-4 h-4" />}>
                  Submit Official Inquiry
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

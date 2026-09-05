import React, { useEffect, useState } from 'react';
import {
  Award,
  ShieldCheck,
  Calendar,
  Building2,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { getMyCertificates, revokeCertificate, type IssuedCertificate } from '../../api/certificates';
import { CertificateModal } from '../../components/certificates/CertificateModal';
import { useAuth } from '../../context/AuthContext';

export const MyCertificatesPage: React.FC = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<IssuedCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<IssuedCertificate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Admin Revocation modal state
  const [revokingCert, setRevokingCert] = useState<IssuedCertificate | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  const fetchCertificates = async () => {
    try {
      const res = await getMyCertificates();
      if (res.success && res.data) {
        setCertificates(res.data);
      }
    } catch (err) {
      console.error('Failed to load certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleCopyLink = async (cert: IssuedCertificate) => {
    const url = `${window.location.origin}/verify/${cert.verificationToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(cert._id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // Fallback
    }
  };

  const handleRevokeConfirm = async () => {
    if (!revokingCert || !revokeReason.trim()) return;
    setRevoking(true);
    try {
      await revokeCertificate(revokingCert._id, revokeReason.trim());
      setRevokingCert(null);
      setRevokeReason('');
      await fetchCertificates();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Revocation failed');
    } finally {
      setRevoking(false);
    }
  };

  if (loading) return <LoadingSpinner text="Retrieving your institutional credentials..." />;

  const isAdmin = user?.role === 'administrator';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-5 h-5 text-amber-500" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Credentials &amp; Certifications</h1>
          </div>
          <p className="text-xs font-medium text-slate-500">
            Official cryptographically verifiable institutional badges and certificates of mastery
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="teal">{certificates.length} Issued Credentials</Badge>
        </div>
      </div>

      {certificates.length === 0 ? (
        <EmptyState
          title="No Certificates Issued Yet"
          description="Complete course programs, fulfill attendance benchmarks, and pass required assessments to earn official institutional certificates."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {certificates.map((cert) => {
            const isRevoked = cert.status === 'revoked';
            const isExpired = cert.expiryDate ? new Date(cert.expiryDate).getTime() < Date.now() : false;
            const isValid = !isRevoked && !isExpired;

            return (
              <Card
                key={cert._id}
                className={`p-6 space-y-5 border-2 transition-all relative overflow-hidden ${
                  isValid
                    ? 'border-amber-400/40 hover:border-amber-400 shadow-sm bg-gradient-to-br from-white via-amber-50/10 to-white'
                    : 'border-slate-200 bg-slate-50/70'
                }`}
              >
                {/* Status Indicator Stripe */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isValid ? 'bg-amber-500' : isRevoked ? 'bg-rose-500' : 'bg-slate-400'
                  }`}
                />

                {/* Header */}
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        isValid
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">
                        {cert.metadata?.courseTitle || cert.courseId?.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{cert.metadata?.department || 'Faculty Enhancement'}</span>
                      </p>
                    </div>
                  </div>
                  <Badge variant={isValid ? 'success' : isRevoked ? 'danger' : 'muted'}>
                    {isValid ? 'VALID' : isRevoked ? 'REVOKED' : 'EXPIRED'}
                  </Badge>
                </div>

                {/* Serial & Dates */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Serial Number:</span>
                    <span className="font-mono font-bold text-slate-900">{cert.certificateNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Issued Date:</span>
                    <span className="text-slate-800">{new Date(cert.issuedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Valid Until:</span>
                    <span className="text-slate-800">
                      {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'Perpetual'}
                    </span>
                  </div>
                  {cert.supersedes && (
                    <div className="pt-1 text-[10px] text-amber-700 font-medium">
                      * Re-certification: Supersedes prior credential {cert.supersedes.certificateNumber}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Button variant="primary" size="sm" onClick={() => setSelectedCert(cert)}>
                      <Award className="w-3.5 h-3.5 mr-1.5" />
                      View Certificate
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleCopyLink(cert)}>
                      {copiedId === cert._id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {copiedId === cert._id ? 'Copied' : 'Share Link'}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`/verify/${cert.verificationToken}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                    >
                      <span>Public Badge</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {isAdmin && isValid && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setRevokingCert(cert);
                          setRevokeReason('');
                        }}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Visual Certificate Modal */}
      <CertificateModal
        certificate={selectedCert}
        open={!!selectedCert}
        onClose={() => setSelectedCert(null)}
      />

      {/* Admin Revocation Modal */}
      <Modal
        open={!!revokingCert}
        onClose={() => setRevokingCert(null)}
        title="Revoke Official Credential"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setRevokingCert(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={revoking}
              disabled={!revokeReason.trim()}
              onClick={handleRevokeConfirm}
            >
              Confirm Revocation
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <span className="font-bold">Warning:</span> Revoking Certificate{' '}
              <strong>{revokingCert?.certificateNumber}</strong> will immediately invalidate the public verification badge
              and log an immutable institutional audit record.
            </div>
          </div>

          <FormField label="Revocation Justification (Required)" hint="Document why this credential is being revoked">
            <textarea
              rows={3}
              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="e.g. Administrative error, re-issuance supersession, or credential audit failure..."
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Award,
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { getPublicCertificate, type PublicVerificationData } from '../../api/certificates';

export const CertificateVerificationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicVerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Verification token is missing in URL.');
      setLoading(false);
      return;
    }

    getPublicCertificate(token)
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError('Unverifiable or invalid certificate token.');
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Invalid or unverified certificate token.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto w-full space-y-6">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>AcademiaSync Campus</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              AS
            </div>
            <span className="font-extrabold text-sm text-slate-900 tracking-tight">AcademiaSync</span>
          </div>
        </div>

        {loading ? (
          <Card className="p-12 text-center space-y-4">
            <LoadingSpinner text="Cryptographically verifying institutional credential..." />
            <p className="text-xs text-slate-400">Validating AES-256-GCM authentication tag and digital signature...</p>
          </Card>
        ) : error || !data ? (
          <Card className="p-8 text-center space-y-4 border-2 border-rose-200 bg-rose-50/50">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Credential Verification Failed</h2>
            <p className="text-xs text-rose-700 max-w-sm mx-auto">
              {error || 'This token could not be cryptographically authenticated against our institutional ledger.'}
            </p>
            <div className="pt-2">
              <Link to="/">
                <Button variant="outline" size="sm">
                  Return to Home
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card className="p-8 space-y-6 border-2 border-emerald-400/40 shadow-xl bg-white relative overflow-hidden">
            {/* Top Verified Banner */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />

            <div className="text-center space-y-3 pt-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <div>
                <Badge variant={data.status === 'VALID' ? 'success' : data.status === 'REVOKED' ? 'danger' : 'warning'}>
                  {data.status === 'VALID'
                    ? 'OFFICIALLY VERIFIED CREDENTIAL'
                    : data.status === 'REVOKED'
                    ? 'CREDENTIAL REVOKED'
                    : 'CREDENTIAL EXPIRED'}
                </Badge>
                <h1 className="text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">
                  Authentic Faculty Credential
                </h1>
                <p className="text-xs text-slate-500">
                  Issued by AcademiaSync Institute for Faculty Enhancement
                </p>
              </div>
            </div>

            {/* Recipient Dossier */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Certified Faculty Member
                </span>
                <div className="text-lg font-bold text-slate-900">{data.teacherName}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Department of {data.department}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Completed Program of Study
                </span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{data.courseTitle}</div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Issued On</span>
                  <div className="font-semibold text-slate-800">
                    {new Date(data.issuedDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Validity Through</span>
                  <div className="font-semibold text-slate-800">
                    {data.expiryDate
                      ? new Date(data.expiryDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Perpetual'}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Credential Serial Number:</span>
                <span className="font-mono font-bold text-slate-900">{data.certificateNumber}</span>
              </div>
            </div>

            {data.status === 'REVOKED' && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Revocation Notice</span>
                </div>
                <p>This credential was officially revoked on {data.revokedAt ? new Date(data.revokedAt).toLocaleDateString() : 'an administrative date'}.</p>
                {data.revokedReason && <p className="italic">Reason: "{data.revokedReason}"</p>}
              </div>
            )}

            {/* Privacy & Trust Guarantee */}
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 text-[11px] text-blue-950 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Institutional Privacy Notice:</strong> Numerical assessment scores, percentage marks, and individual answer sheets are strictly confidential faculty records and intentionally excluded from public badges.
              </div>
            </div>

            <div className="text-center pt-2">
              <Link to="/login">
                <Button variant="outline" size="sm" className="w-full">
                  Sign in to AcademiaSync Portal
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>

      <div className="text-center text-[11px] text-slate-400 mt-8">
        &copy; {new Date().getFullYear()} AcademiaSync Faculty Enhancement System • Cryptographic Badge Engine
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Award,
  Download,
  Printer,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Building2,
  X,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { IssuedCertificate } from '../../api/certificates';

interface CertificateModalProps {
  certificate: IssuedCertificate | null;
  open: boolean;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ certificate, open, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!certificate) return null;

  const verificationUrl = `${window.location.origin}/verify/${certificate.verificationToken}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const teacherName = certificate.metadata?.teacherName || 'Faculty Member';
  const courseTitle = certificate.metadata?.courseTitle || certificate.courseId?.title || 'Advanced Faculty Program';
  const department = certificate.metadata?.department || 'Academic Affairs';
  const issuedDate = new Date(certificate.issuedDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const expiryDate = certificate.expiryDate
    ? new Date(certificate.expiryDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Perpetual';

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Institutional Credential & Certificate"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full print:hidden">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
              {copied ? 'Link Copied!' : 'Copy Verification Link'}
            </Button>
            <a href={`/verify/${certificate.verificationToken}`} target="_blank" rel="noreferrer">
              <Button variant="ghost" size="sm">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Public Badge View
              </Button>
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print / Save as PDF
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      }
    >
      {/* Printable Certificate Canvas */}
      <div className="p-2 sm:p-6 bg-slate-100/60 rounded-2xl print:p-0 print:bg-white">
        <div
          id="institutional-certificate-canvas"
          className="relative bg-white text-slate-900 border-8 border-double border-amber-500/80 rounded-2xl shadow-xl p-8 sm:p-12 overflow-hidden print:border-4 print:shadow-none print:m-0"
          style={{ minHeight: '520px' }}
        >
          {/* Subtle Watermark Seal */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
            <Award className="w-96 h-96 text-amber-900" />
          </div>

          {/* Corner Ornaments */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-600/70" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-600/70" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-600/70" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-600/70" />

          {/* Certificate Header */}
          <div className="text-center space-y-2 relative z-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30 mb-1">
              <Award className="w-8 h-8" />
            </div>
            <div className="font-serif tracking-widest text-amber-800 text-xs sm:text-sm font-bold uppercase">
              AcademiaSync Institute for Faculty Enhancement
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Certificate of Completion & Mastery
            </h1>
            <p className="text-xs text-slate-500 tracking-wider uppercase font-medium">
              Official Institutional Pedagogical &amp; Research Credential
            </p>
          </div>

          {/* Recipient Statement */}
          <div className="text-center my-8 space-y-3 relative z-10">
            <p className="text-xs sm:text-sm text-slate-500 italic font-serif">This is proudly presented to</p>
            <div className="text-xl sm:text-3xl font-extrabold text-blue-900 underline decoration-amber-400 decoration-2 underline-offset-8">
              {teacherName}
            </div>
            <p className="text-xs text-slate-600 max-w-lg mx-auto pt-2 leading-relaxed">
              in recognition of successfully completing all curricular modules, fulfilling rigorous assessment benchmarks,
              and demonstrating distinguished pedagogical competency in
            </p>
            <div className="text-base sm:text-xl font-bold text-slate-900 px-4 py-2 bg-amber-50/70 rounded-xl border border-amber-200/60 inline-block max-w-xl mx-auto shadow-2xs">
              {courseTitle}
            </div>
          </div>

          {/* Certificate Meta & Signatures */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-200/80 text-center relative z-10 items-end">
            {/* Signature 1 */}
            <div className="space-y-1">
              <div className="font-serif italic text-sm text-slate-700 font-semibold border-b border-slate-300 pb-1 w-40 mx-auto">
                Prof. M. K. Sharma
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Dean of Academic Affairs
              </div>
            </div>

            {/* Middle Stamp / Verification Badge */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-300 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Institutional Credential
              </div>
              <div className="text-[10px] font-mono text-slate-500 font-medium">
                ID: {certificate.certificateNumber}
              </div>
              <div className="text-[9px] text-slate-400">
                Issued: {issuedDate} • Valid Thru: {expiryDate}
              </div>
            </div>

            {/* Signature 2 */}
            <div className="space-y-1">
              <div className="font-serif italic text-sm text-slate-700 font-semibold border-b border-slate-300 pb-1 w-40 mx-auto">
                Dr. S. R. Ramanujan
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Director of Faculty Enhancement
              </div>
            </div>
          </div>

          {/* Cryptographic verification footer */}
          <div className="mt-8 pt-3 border-t border-dashed border-slate-200 text-center text-[10px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 relative z-10">
            <span>Department of {department}</span>
            <span className="font-mono text-[9px] text-slate-500">
              Verify at: {window.location.host}/verify/{certificate.verificationToken.slice(0, 16)}...
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

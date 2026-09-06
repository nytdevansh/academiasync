import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  FileText,
  Database,
  Eye,
  CheckCircle2,
  AlertCircle,
  Printer,
  Search,
  Building2,
  UserCheck,
  Award,
  Mail,
  ExternalLink,
  Calendar,
  ChevronRight,
  HelpCircle,
  KeyRound,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface PolicySection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const PrivacyPolicyPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const sections: PolicySection[] = [
    {
      id: 'intro',
      title: '1. Institutional Scope & Commitment',
      icon: <Building2 className="w-5 h-5 text-blue-600" />,
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base">
          <p>
            Welcome to <strong>AcademiaSync University</strong> (&ldquo;University&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;).
            This Institutional Privacy Policy establishes our solemn commitment to safeguarding the personal, academic, and professional
            data of our faculty members, department heads, deans, academic researchers, evaluators, and campus community who access the
            <strong> AcademiaSync Faculty Enhancement System (FES)</strong>.
          </p>
          <p>
            This policy applies to all electronic records, automated appraisal workflows, Continuing Professional Development (CPD) programs,
            competency tracking matrices, cryptographic certificate validations, and institutional communications managed across the AcademiaSync
            platform at <code>academiasync.edu</code> and its associated subdomains.
          </p>
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-blue-900 leading-normal">
              <strong>Regulatory Compliance:</strong> AcademiaSync adheres strictly to higher education data governance standards,
              applicable national data protection statutes (including India&apos;s Digital Personal Data Protection Act and global FERPA principles),
              and statutory mandates promulgated by university regulatory bodies (NAAC, NIRF, and NBA).
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'data-collected',
      title: '2. Categories of Information We Collect',
      icon: <Database className="w-5 h-5 text-indigo-600" />,
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base">
          <p>
            To deliver career advancement tracking, faculty training programs, and annual academic appraisals, AcademiaSync processes
            the following distinct categories of information:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Institutional Identity & Profile Data
              </div>
              <ul className="text-xs sm:text-sm text-slate-600 space-y-1 list-disc pl-4">
                <li>Full legal name, institutional email address, and phone number</li>
                <li>University Employee ID, academic rank, and assigned department</li>
                <li>Biographical summary, academic degrees, and institutional credentials</li>
                <li>Role-based access privileges (Faculty, HOD, Dean, HR, Administrator)</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Award className="w-4 h-4 text-emerald-600" />
                Scholarship & Research Records
              </div>
              <ul className="text-xs sm:text-sm text-slate-600 space-y-1 list-disc pl-4">
                <li>Peer-reviewed publications, journal titles, DOIs, and citations</li>
                <li>Sponsored research grants, consultancy projects, and patent filings</li>
                <li>Conference presentations, keynote addresses, and academic honors</li>
                <li>Verified ORCID, Google Scholar, and Scopus profile identifiers</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <FileText className="w-4 h-4 text-amber-600" />
                Training & Professional Development
              </div>
              <ul className="text-xs sm:text-sm text-slate-600 space-y-1 list-disc pl-4">
                <li>Enrollment history in Faculty Development Programs (FDPs) and workshops</li>
                <li>Session attendance records, sign-in timestamps, and completion rates</li>
                <li>Assessment scores, competency test outcomes, and grading rubrics</li>
                <li>Cryptographically issued certificates and continuing education points</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Lock className="w-4 h-4 text-rose-600" />
                Annual Appraisal & Committee Reviews
              </div>
              <ul className="text-xs sm:text-sm text-slate-600 space-y-1 list-disc pl-4">
                <li>Self-appraisal submissions and teaching effectiveness self-scores</li>
                <li>Head of Department (HOD) qualitative evaluations and ratings</li>
                <li>Dean review scores, promotion recommendations, and committee remarks</li>
                <li>Appraisal cycle audit trails and final institutional appraisal outcomes</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'purpose',
      title: '3. Lawful Basis & Purpose of Data Processing',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base">
          <p>
            The University processes faculty data exclusively for legitimate educational, administrative, and institutional advancement purposes:
          </p>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 list-none pl-1">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Career Advancement & Appraisals:</strong> Processing annual performance reviews, promotion eligibility, and merit appraisals under university statutory guidelines.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Continuing Education Delivery:</strong> Administering faculty development courses, tracking attendance thresholds, and issuing accredited certificates of completion.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Accreditation Compliance:</strong> Compiling anonymized, aggregated institutional data required by external accreditation agencies (NAAC, NIRF, NBA, UGC, AICTE).</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Transactional Notifications:</strong> Dispatching urgent campus circulars, training reminders, and appraisal deadline alerts via in-app notifications and verified emails.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Audit & Security Assurance:</strong> Enforcing institutional access governance, detecting anomalous account access, and maintaining non-repudiable audit logs.</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'crypto-security',
      title: '4. Cryptographic Security & Certificate Verification Policy',
      icon: <KeyRound className="w-5 h-5 text-teal-600" />,
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base">
          <p>
            AcademiaSync incorporates state-of-the-art cryptographic mechanisms to protect faculty credential authenticity while rigorously
            preserving privacy:
          </p>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-teal-300 font-bold text-sm">
              <KeyRound className="w-4 h-4" />
              AES-256-GCM Cryptographic Token Encryption
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every course completion certificate issued by AcademiaSync is encoded with a tamper-proof AES-256-GCM URL-safe token.
              The token encapsulates an encrypted payload comprising the certificate identifier, serial number, and an authenticated
              cryptographic verification tag. Any attempt to modify, forge, or alter URL parameters triggers immediate mathematical
              verification rejection.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
              <Eye className="w-4 h-4 text-amber-700" />
              Public Verification Privacy Isolation Guarantee
            </div>
            <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
              When an employer, academic institution, or third party scans a certificate QR code or visits our public verification URL
              (<code>/verify/:token</code>), our verification gateway displays <strong>only</strong> the recipient&apos;s name, course title,
              issuing institution, completion date, and credential status (Active / Expired / Revoked).
              <strong> Numerical assessment scores, percentage marks, and individual test answer sheets are strictly confidential faculty records and intentionally excluded from public verification badges.</strong>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'data-sharing',
      title: '5. Data Sharing & Third-Party Disclosure Restrictions',
      icon: <Eye className="w-5 h-5 text-blue-600" />,
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base">
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-emerald-950 leading-normal">
              <strong>Strict Zero-Monetization Pledge:</strong> AcademiaSync University does <em>never</em> sell, rent, license, or monetize faculty, staff, or student personal information to data brokers, advertisers, or third-party marketing entities under any circumstance.
            </div>
          </div>
          <p>
            Personal data is disclosed only under the following strictly regulated conditions:
          </p>
          <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc pl-5">
            <li>
              <strong>Internal Institutional Hierarchy:</strong> Evaluative appraisal data is accessible exclusively to authorized University roles (Faculty Member, assigned Head of Department, Dean of Academic Affairs, and designated Institutional HR/Registrar officials) on a strict need-to-know basis.
            </li>
            <li>
              <strong>Transactional Communication Relays:</strong> System alerts, password resets, and training notifications are dispatched through enterprise cloud mail relays (e.g. Resend / SendGrid) operating over TLS-encrypted HTTPS connections solely for instantaneous message transmission.
            </li>
            <li>
              <strong>Legal & Statutory Compliance:</strong> Disclosure mandated by competent judicial courts, government higher education authorities, or statutory investigative commissions in accordance with prevailing law.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'security-measures',
      title: '6. Security Safeguards & Access Isolation',
      icon: <Lock className="w-5 h-5 text-rose-600" />,
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base">
          <p>
            We implement comprehensive technical, physical, and administrative safeguards designed to protect personal and academic information from unauthorized access, loss, or alteration:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <div className="font-bold text-slate-900 text-xs sm:text-sm">TLS 1.3 Encryption</div>
              <div className="text-[11px] sm:text-xs text-slate-500">All data in transit is encrypted using 256-bit TLS encryption protocols.</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <div className="font-bold text-slate-900 text-xs sm:text-sm">Session Family Revocation</div>
              <div className="text-[11px] sm:text-xs text-slate-500">SHA-256 hashed refresh tokens with instant replay attack detection.</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <div className="font-bold text-slate-900 text-xs sm:text-sm">Role-Based Access Control</div>
              <div className="text-[11px] sm:text-xs text-slate-500">Strict server-side route guards and authorization barriers for all APIs.</div>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            Passwords are cryptographically salted and hashed using industry-standard <code>bcrypt</code>. University staff and administrators never have access to plain-text passwords.
          </p>
        </div>
      ),
    },
    {
      id: 'retention',
      title: '7. Data Retention & Archival Schedules',
      icon: <Calendar className="w-5 h-5 text-indigo-600" />,
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base">
          <p>
            In conformity with University Statutory Records Retention Schedules:
          </p>
          <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc pl-5">
            <li>
              <strong>Active Academic Service Records:</strong> Maintained throughout the tenure of the faculty member and for an additional statutory period (minimum 7 years post-service) to fulfill pension, reference, and statutory accreditation audit queries.
            </li>
            <li>
              <strong>Cryptographic Certificate Logs:</strong> Preserved indefinitely to ensure alumni credentials remain perpetually verifiable by worldwide employers and academic institutions.
            </li>
            <li>
              <strong>Session & Security Audit Logs:</strong> Stored for 365 days before automated rolling purge, unless flagged as evidence in an active security inquiry.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'rights',
      title: '8. Faculty Data Rights & Grievance Procedures',
      icon: <FileText className="w-5 h-5 text-amber-600" />,
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base">
          <p>
            Every registered faculty member and user of AcademiaSync retains the following rights regarding their institutional records:
          </p>
          <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc pl-5">
            <li><strong>Right of Inspection:</strong> Review all personal profile attributes, research entries, and historical appraisal scores.</li>
            <li><strong>Right of Rectification:</strong> Request correction of inaccurate research metrics, grant figures, or typographical information via the Edit Profile portal or Department Head.</li>
            <li><strong>Right of Export:</strong> Download comprehensive PDF transcripts of professional development hours, attended workshops, and verified certificates.</li>
            <li><strong>Appraisal Appeal:</strong> Formal grievance procedures exist to dispute appraisal evaluations through the University Grievance Redressal Committee and Office of the Dean.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'contact-dpo',
      title: '9. Contact the Data Protection Officer (DPO)',
      icon: <Mail className="w-5 h-5 text-blue-600" />,
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base">
          <p>
            If you have questions, concerns, or requests concerning the processing of your personal data or wish to exercise any statutory rights, please reach out to our designated institutional privacy officer:
          </p>
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Office of the Data Protection Officer & Institutional Compliance
            </div>
            <div className="text-xs sm:text-sm text-slate-600 space-y-1">
              <div><strong>Institution:</strong> AcademiaSync University Administrative Complex</div>
              <div><strong>Location:</strong> Knowledge Park IV, Academic Zone, Greater Metro Region - 201306</div>
              <div><strong>Direct Privacy Inquiries:</strong> <a href="mailto:privacy@academiasync.edu" className="text-blue-600 hover:underline font-semibold">privacy@academiasync.edu</a></div>
              <div><strong>Institutional Helpdesk:</strong> <a href="mailto:contact@academiasync.edu" className="text-blue-600 hover:underline">contact@academiasync.edu</a> &bull; +91 (011) 2890-4400</div>
              <div><strong>Operating Hours:</strong> Monday &ndash; Friday, 09:00 &ndash; 17:00 IST</div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const filteredSections = searchQuery.trim()
    ? sections.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sections;

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10 animate-fadeIn">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" /> Institutional Data Governance &amp; Compliance
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          How AcademiaSync protects, processes, and governs faculty, researcher, and institutional data across our academic ecosystem.
        </p>

        {/* Metadata & Controls Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
          <Badge variant="teal" icon={<Calendar className="w-3 h-3" />}>
            Effective: Academic Year 2025–2026
          </Badge>
          <Badge variant="muted">Revision 2.4</Badge>
          <Badge variant="info">Doc ID: UNIV-POL-PRIV-2025</Badge>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Policy</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar TOC + Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sticky Table of Contents */}
        <aside className="lg:col-span-4 sticky top-24 space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <FileText className="w-4 h-4 text-blue-600" />
                Table of Contents
              </div>
              <span className="text-[11px] text-slate-400 font-medium">{sections.length} Sections</span>
            </div>

            {/* Quick Search inside Policy */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search policy clauses..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Nav list */}
            <nav className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {filteredSections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeSection === sec.id
                      ? 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600 pl-2.5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate pr-2">{sec.title}</span>
                  <ChevronRight className="w-3 h-3 shrink-0 text-slate-400" />
                </button>
              ))}
            </nav>

            {/* Quick Links Card */}
            <div className="pt-3 border-t border-slate-100 text-xs space-y-2 text-slate-500">
              <div className="font-semibold text-slate-700">Related Legal Documents:</div>
              <div className="space-y-1 pl-1">
                <div>
                  <Link to="/terms" className="text-blue-600 hover:underline flex items-center gap-1.5">
                    <ExternalLink className="w-3 h-3" />
                    Terms of Service (TOS)
                  </Link>
                </div>
                <div>
                  <Link to="/contact" className="text-blue-600 hover:underline flex items-center gap-1.5">
                    <HelpCircle className="w-3 h-3" />
                    Security &amp; Audit Helpdesk
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </aside>

        {/* Right Content Sections */}
        <div className="lg:col-span-8 space-y-8">
          {filteredSections.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <div className="text-sm font-bold text-slate-900">No matching policy sections found</div>
              <div className="text-xs text-slate-500">Try searching for different terms like &ldquo;certificate&rdquo;, &ldquo;appraisal&rdquo;, or &ldquo;retention&rdquo;.</div>
              <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>Clear Filter</Button>
            </Card>
          ) : (
            filteredSections.map((sec) => (
              <Card key={sec.id} id={sec.id} className="p-6 sm:p-8 space-y-4 scroll-mt-24 transition-shadow hover:shadow-md">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                    {sec.icon}
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    {sec.title}
                  </h2>
                </div>
                {sec.content}
              </Card>
            ))
          )}

          {/* Cross-Link Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-blue-500/10">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-base font-bold">Review Our Terms of Service</div>
              <div className="text-xs text-blue-100">Understand the academic integrity rules, access privileges, and certification terms governing AcademiaSync.</div>
            </div>
            <Link
              to="/terms"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-blue-700 font-bold text-xs hover:bg-blue-50 transition-colors shrink-0 shadow-sm"
            >
              <span>View Terms of Service</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

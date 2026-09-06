import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  ShieldAlert,
  FileCheck,
  BookOpen,
  UserCheck,
  Award,
  AlertTriangle,
  Printer,
  Search,
  Building2,
  Calendar,
  ChevronRight,
  HelpCircle,
  ExternalLink,
  Lock,
  CheckCircle2,
  Ban,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface TermsSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const TermsOfServicePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('acceptance');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const sections: TermsSection[] = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms & Institutional Governance',
      icon: <Scale className="w-5 h-5 text-blue-600" />,
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding institutional agreement between
            <strong> AcademiaSync University</strong> (&ldquo;University&rdquo;, &ldquo;we&rdquo;, or &ldquo;us&rdquo;) and all
            faculty members, academic researchers, department chairs, deans, administrative personnel, evaluators, and authorized
            users (&ldquo;User&rdquo;, &ldquo;you&rdquo;, or &ldquo;your&rdquo;) accessing or utilizing the
            <strong> AcademiaSync Faculty Enhancement System (FES)</strong>.
          </p>
          <p>
            By logging in, authenticating with your institutional credentials, enrolling in professional development programs, or
            submitting appraisal documentation, you acknowledge that you have read, understood, and agreed to be governed by these Terms
            and all applicable University Ordinances, Academic Senate Regulations, and Faculty Handbooks.
          </p>
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
            <Building2 className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-blue-900 leading-normal">
              <strong>Statutory Authority:</strong> AcademiaSync operates under the direct oversight of the University Academic Senate,
              the Internal Quality Assurance Cell (IQAC), and the Office of the Vice Chancellor / Dean of Academic Affairs.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'accounts',
      title: '2. Account Governance & Credential Security',
      icon: <Lock className="w-5 h-5 text-indigo-600" />,
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base">
          <p>
            Access to AcademiaSync is restricted to authenticated members of the University academic community:
          </p>
          <ul className="text-xs sm:text-sm text-slate-600 space-y-2.5 list-disc pl-5">
            <li>
              <strong>Individual Accountability:</strong> Your institutional login credentials (username, password, and session tokens) are strictly personal and non-transferable. You are individually responsible for all activities, submissions, and approvals conducted under your account.
            </li>
            <li>
              <strong>Prohibition of Proxy Logins:</strong> Sharing institutional passwords, granting unauthorized proxy access to third parties or students, or delegating administrative approval credentials to unauthorized individuals is strictly prohibited and constitutes a major disciplinary offense.
            </li>
            <li>
              <strong>Session Family Invalidation:</strong> Our platform employs active cryptographic session monitoring. If an expired or revoked refresh token is replayed across unauthorized IP addresses, the security subsystem immediately invalidates the entire session family across all devices to protect institutional integrity.
            </li>
            <li>
              <strong>Immediate Breach Notification:</strong> You must promptly notify the University Information Security Office at <a href="mailto:security@academiasync.edu" className="text-blue-600 hover:underline font-semibold">security@academiasync.edu</a> upon discovering any unauthorized compromise of your credentials.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'academic-integrity',
      title: '3. Academic Integrity & Truthful Reporting',
      icon: <FileCheck className="w-5 h-5 text-emerald-600" />,
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base">
          <p>
            AcademiaSync serves as the authoritative institutional repository for faculty performance metrics, promotion portfolios, and regulatory compliance disclosures. Rigorous honesty is mandatory:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Truthful Scholarly Records
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                All uploaded publications, citation metrics, grant amounts, book chapters, patents, and conference presentations must be accurate and verifiable. Fabricating research outputs or claiming unearned authorship violates University Research Integrity Code.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
                <Ban className="w-4 h-4 text-rose-600" />
                Attendance & Evaluation Fraud
              </div>
              <p className="text-xs sm:text-sm text-rose-900 leading-relaxed">
                Falsifying workshop attendance, marking proxy attendance for colleagues, taking assessments under false pretenses, or attempting to inflate Continuing Professional Development (CPD) hours will result in immediate cancellation of credits and disciplinary referral.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'roles',
      title: '4. Institutional Roles & Administrative Conduct',
      icon: <UserCheck className="w-5 h-5 text-blue-600" />,
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base">
          <p>
            AcademiaSync enforces strict role-based responsibilities across the academic hierarchy:
          </p>
          <ul className="text-xs sm:text-sm text-slate-600 space-y-2.5 list-none pl-1">
            <li className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Badge variant="info">Faculty Member</Badge>
                <span>Professional Development & Self-Appraisal</span>
              </div>
              <p className="text-xs text-slate-600">
                Responsible for timely completion of assigned training recommendations, maintaining up-to-date competency records, and submitting annual self-appraisals within designated institutional cycle deadlines.
              </p>
            </li>
            <li className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Badge variant="teal">Head of Department (HOD)</Badge>
                <span>Departmental Evaluation & Nominations</span>
              </div>
              <p className="text-xs text-slate-600">
                Must provide objective, unbiased, evidence-based evaluations of faculty teaching effectiveness, review self-appraisals conscientiously, and nominate faculty for development programs aligned with departmental strategic objectives.
              </p>
            </li>
            <li className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Badge variant="violet">Dean & Committee Reviewers</Badge>
                <span>Institutional Governance & Quality Standards</span>
              </div>
              <p className="text-xs text-slate-600">
                Review department recommendations, validate score distributions, verify compliance with accreditation standards, and ensure institutional parity across all academic units.
              </p>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'intellectual-property',
      title: '5. Intellectual Property Rights & Scholarly Works',
      icon: <BookOpen className="w-5 h-5 text-amber-600" />,
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base">
          <p>
            The distribution of intellectual property rights within AcademiaSync is defined as follows:
          </p>
          <ul className="text-xs sm:text-sm text-slate-600 space-y-2.5 list-disc pl-5">
            <li>
              <strong>Platform Courseware & Institutional Rubrics:</strong> All software architecture, system interfaces, assessment rubrics, institutional courseware, syllabus structures, and training workshop materials created by the University remain the exclusive intellectual property of AcademiaSync University.
            </li>
            <li>
              <strong>Faculty Scholarly Works:</strong> Faculty members retain full copyright and moral rights over their personal scholarly papers, journal publications, monographs, and research datasets uploaded for appraisal evidence, subject only to non-exclusive institutional archiving rights for accreditation audits.
            </li>
            <li>
              <strong>Automated Reports & Aggregated Analytics:</strong> Aggregated institutional statistics, department benchmark indices, NAAC/NIRF compliance exports, and accreditation summaries generated by the platform are University administrative property.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'acceptable-use',
      title: '6. Acceptable System Use & Security Restrictions',
      icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base">
          <p>
            Users must maintain professional cybersecurity standards when utilizing University information systems. You agree <strong>not</strong> to:
          </p>
          <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc pl-5">
            <li>Engage in automated scraping, spidering, data harvesting, or systematic extraction of faculty contact directories or appraisal scores.</li>
            <li>Attempt to probe, scan, or test the vulnerability of AcademiaSync servers or networks, or breach security or authentication barriers without explicit written authorization from the University Chief Information Officer.</li>
            <li>Circumvent or tamper with API rate-limiters, IP filters, or cryptographic token signing algorithms.</li>
            <li>Inject malicious payloads, SQL injection strings, cross-site scripting (XSS) vectors, or harmful executable scripts into profile fields or appraisal forms.</li>
            <li>Transmit harassing, defamatory, discriminatory, or unlawful content through campus broadcast notifications or peer review feedback.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'certifications',
      title: '7. Certificate Issuance & Cryptographic Revocation',
      icon: <Award className="w-5 h-5 text-teal-600" />,
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base">
          <p>
            Certificates issued by AcademiaSync carry official institutional accreditation weight and are subject to stringent criteria:
          </p>
          <div className="space-y-3 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Mandatory Eligibility Standards
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Issuance requires verified fulfillment of minimum attendance criteria (typically &ge;80% of scheduled workshop sessions) and obtaining a passing score on the concluding competency evaluation. Certificates are generated with unique serial numbers and encrypted AES-256-GCM verification tokens.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
              <div className="font-bold text-amber-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                Grounds for Certificate Revocation
              </div>
              <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
                The University reserves the absolute right to cryptographically revoke any certificate previously issued if subsequent investigation reveals evidence of attendance falsification, assessment dishonesty, plagiarism, or unauthorized administrative manipulation. Revoked certificates immediately register as &ldquo;Revoked&rdquo; on the public verification portal (<code>/verify/:token</code>).
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'liability',
      title: '8. Service Availability & Limitation of Liability',
      icon: <AlertCircle className="w-5 h-5 text-slate-600" />,
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base">
          <p>
            The University strives to maintain continuous, dependable platform availability with a 99.5% service uptime objective:
          </p>
          <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc pl-5">
            <li>
              <strong>Scheduled Maintenance Windows:</strong> Routine database maintenance, software deployments, and security upgrades are scheduled during off-peak weekend hours with advance notice published on the <Link to="/notices" className="text-blue-600 hover:underline">Official Notices Board</Link>.
            </li>
            <li>
              <strong>No Warranty on Force Majeure:</strong> While enterprise data backups and server clustering are in place, the University is not liable for service interruptions caused by regional power failures, third-party internet transit blackouts, or natural disasters beyond reasonable institutional control.
            </li>
            <li>
              <strong>Submission Backup Advice:</strong> Faculty members are encouraged to retain personal copies of research manuscripts and appraisal self-evaluations prior to submitting large dossiers.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'governing-law',
      title: '9. Dispute Resolution, Appeals & Governing Law',
      icon: <Scale className="w-5 h-5 text-indigo-600" />,
      content: (
        <div className="space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base">
          <p>
            Any disputes, grievances, or interpretations arising from the use of AcademiaSync FES shall be resolved through established university governance channels:
          </p>
          <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc pl-5">
            <li>
              <strong>Internal Grievance Escalation:</strong> Appraisal disputes must be submitted within 14 calendar days of score release to the University Faculty Grievance Redressal Committee and Office of the Academic Dean.
            </li>
            <li>
              <strong>University Ombudsperson:</strong> An independent university ombudsperson is available to facilitate fair, non-adversarial resolution of administrative disputes.
            </li>
            <li>
              <strong>Governing Jurisdiction:</strong> These Terms shall be governed by and construed in accordance with the laws of the national and state jurisdiction where the University campus is situated, and the competent courts of the University metropolitan district shall have exclusive jurisdiction.
            </li>
          </ul>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-600 space-y-1">
            <div className="font-bold text-slate-900">Office of University Legal Affairs &amp; Academic Senate</div>
            <div>University Administration Building, Knowledge Park IV, Academic Zone, Greater Metro Region - 201306</div>
            <div>Official Inquiries: <a href="mailto:legal@academiasync.edu" className="text-blue-600 hover:underline font-semibold">legal@academiasync.edu</a> &bull; Extension: 4402</div>
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
          <Scale className="w-3.5 h-3.5" /> Institutional Regulations &amp; Usage Governance
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Terms of Service
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          The legal framework, academic integrity expectations, and operational guidelines governing AcademiaSync FES.
        </p>

        {/* Metadata & Controls Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
          <Badge variant="teal" icon={<Calendar className="w-3 h-3" />}>
            Effective: Academic Year 2025–2026
          </Badge>
          <Badge variant="muted">Version 3.1</Badge>
          <Badge variant="info">Doc ID: UNIV-POL-TOS-2025</Badge>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Terms</span>
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
                <Scale className="w-4 h-4 text-blue-600" />
                Table of Contents
              </div>
              <span className="text-[11px] text-slate-400 font-medium">{sections.length} Sections</span>
            </div>

            {/* Quick Search inside Terms */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search terms & clauses..."
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
                  <Link to="/privacy" className="text-blue-600 hover:underline flex items-center gap-1.5">
                    <ExternalLink className="w-3 h-3" />
                    Privacy Policy
                  </Link>
                </div>
                <div>
                  <Link to="/contact" className="text-blue-600 hover:underline flex items-center gap-1.5">
                    <HelpCircle className="w-3 h-3" />
                    Contact &amp; Legal Inquiries
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
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <div className="text-sm font-bold text-slate-900">No matching terms or clauses found</div>
              <div className="text-xs text-slate-500">Try searching for keywords like &ldquo;integrity&rdquo;, &ldquo;attendance&rdquo;, &ldquo;intellectual property&rdquo;, or &ldquo;revocation&rdquo;.</div>
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
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-700 to-blue-700 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-blue-500/10">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-base font-bold">Have Questions About Your Privacy?</div>
              <div className="text-xs text-indigo-100">Review our comprehensive Privacy Policy to see how your appraisal records and cryptographic tokens are protected.</div>
            </div>
            <Link
              to="/privacy"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-blue-700 font-bold text-xs hover:bg-blue-50 transition-colors shrink-0 shadow-sm"
            >
              <span>View Privacy Policy</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

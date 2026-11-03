import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

dotenv.config();

// Models
import User from '../models/User';
import Department from '../models/Department';
import Subject from '../models/Subject';
import SkillArea from '../models/SkillArea';
import FacultyProfile from '../models/FacultyProfile';
import TrainingProgram from '../models/TrainingProgram';
import TrainingEnrollment from '../models/TrainingEnrollment';
import TrainingSession from '../models/TrainingSession';
import AppraisalCycle from '../models/AppraisalCycle';
import CompetencyRecord from '../models/CompetencyRecord';
import Assessment from '../models/Assessment';
import AssessmentResponse from '../models/AssessmentResponse';
import CourseResult from '../models/CourseResult';
import Certificate from '../models/Certificate';
import CourseAssessment from '../models/CourseAssessment';
import CourseAssessmentSubmission from '../models/CourseAssessmentSubmission';
const hash = async (pw: string) => bcrypt.hash(pw, await bcrypt.genSalt(12));

export const seedData = async () => {

  // Clear existing data
  console.log('🗑  Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}), Department.deleteMany({}), Subject.deleteMany({}),
    SkillArea.deleteMany({}), FacultyProfile.deleteMany({}),
    TrainingProgram.deleteMany({}), TrainingEnrollment.deleteMany({}),
    TrainingSession.deleteMany({}),
    AppraisalCycle.deleteMany({}), CompetencyRecord.deleteMany({}),
    Assessment.deleteMany({}), AssessmentResponse.deleteMany({}),
    CourseResult.deleteMany({}), Certificate.deleteMany({}),
    CourseAssessment.deleteMany({}), CourseAssessmentSubmission.deleteMany({}),
  ]);

  // ── Departments ──────────────────────────────────────────────────────────────
  console.log('🏛  Seeding institutional directories & departments...');
  const [adminDept, acadDept, hrDept, cse, ece, mech, civil, mba, physics, chemistry, maths, english, arts] = await Department.insertMany([
    { name: 'Central Administration & Institutional Governance', code: 'ADMIN', description: 'Central Administration, Operations & System Management' },
    { name: 'Office of Academic Affairs & Deanery', code: 'ACAD', description: 'Academic Leadership, Accreditation, Curriculum & Faculty Development' },
    { name: 'Human Resource Development', code: 'HR', description: 'Faculty Recruitment, Appraisal, Compliance & Staff Welfare' },
    { name: 'Computer Science & Engineering', code: 'CSE', description: 'Software, AI/ML, Systems' },
    { name: 'Electronics & Communication Engineering', code: 'ECE', description: 'VLSI, Embedded Systems, Communication' },
    { name: 'Mechanical Engineering', code: 'MECH', description: 'Manufacturing, Thermal, Design' },
    { name: 'Civil Engineering', code: 'CIVIL', description: 'Structures, Geotechnics, Transportation' },
    { name: 'Master of Business Administration', code: 'MBA', description: 'Management, Finance, Marketing' },
    { name: 'Physics', code: 'PHY', description: 'Applied & Theoretical Physics' },
    { name: 'Chemistry', code: 'CHEM', description: 'Organic, Inorganic, Analytical' },
    { name: 'Mathematics', code: 'MATH', description: 'Pure & Applied Mathematics' },
    { name: 'English', code: 'ENG', description: 'Communication & Literature' },
    { name: 'Fine Arts & Design', code: 'ARTS', description: 'Visual Arts, Product Design' },
  ]);

  // ── Users: Demo accounts for each supported role ────────────────────────────
  console.log('👤  Seeding demo accounts for each supported role...');
  const adminHash = await hash('Admin@123');

  const [admin] = await User.insertMany([
    {
      name: 'System Administrator',
      email: 'admin@academiasync.edu',
      passwordHash: adminHash,
      role: 'administrator',
      department: adminDept._id,
      status: 'active',
    },
  ]);
  const [hodCseHash, hodEceHash, deanHash, hrHash, facultyCseHash, facultyEceHash] = await Promise.all([
    hash('Hod@123'),
    hash('Hod@123'),
    hash('Dean@123'),
    hash('Hr@123'),
    hash('Faculty@123'),
    hash('Faculty@123'),
  ]);
  const [hodCse, hodEce, dean, hr, facultyCse, facultyEce] = await User.insertMany([
    { name: 'Dr. Alan Turing', email: 'hod.cse@academiasync.edu', passwordHash: hodCseHash, role: 'hod', department: cse._id },
    { name: 'Dr. Nikola Tesla', email: 'hod.ece@academiasync.edu', passwordHash: hodEceHash, role: 'hod', department: ece._id },
    { name: 'Dr. John Doe', email: 'dean@academiasync.edu', passwordHash: deanHash, role: 'dean', department: acadDept._id },
    { name: 'Alex Morgan', email: 'hr@academiasync.edu', passwordHash: hrHash, role: 'hr', department: hrDept._id },
    { name: 'Dr. Ada Lovelace', email: 'faculty@academiasync.edu', passwordHash: facultyCseHash, role: 'faculty_member', department: cse._id },
    { name: 'Dr. Grace Hopper', email: 'faculty2@academiasync.edu', passwordHash: facultyEceHash, role: 'faculty_member', department: ece._id },
  ]);
  await Promise.all([
    Department.updateOne({ _id: cse._id }, { hodRef: hodCse._id }),
    Department.updateOne({ _id: ece._id }, { hodRef: hodEce._id }),
  ]);

  // ── Subjects ─────────────────────────────────────────────────────────────────
  console.log('📚  Seeding subjects...');
  const subjects = await Subject.insertMany([
    // CSE
    { name: 'Data Structures & Algorithms', code: 'CS101', department: cse._id, credits: 4 },
    { name: 'Database Management Systems', code: 'CS201', department: cse._id, credits: 4 },
    { name: 'Machine Learning', code: 'CS301', department: cse._id, credits: 4 },
    { name: 'Computer Networks', code: 'CS401', department: cse._id, credits: 3 },
    { name: 'Operating Systems', code: 'CS501', department: cse._id, credits: 3 },
    { name: 'Software Engineering', code: 'CS601', department: cse._id, credits: 3 },
    // ECE
    { name: 'Digital Signal Processing', code: 'EC101', department: ece._id, credits: 4 },
    { name: 'VLSI Design', code: 'EC201', department: ece._id, credits: 4 },
    { name: 'Embedded Systems', code: 'EC301', department: ece._id, credits: 3 },
    { name: 'Wireless Communications', code: 'EC401', department: ece._id, credits: 3 },
    // MECH
    { name: 'Thermodynamics', code: 'ME101', department: mech._id, credits: 4 },
    { name: 'Fluid Mechanics', code: 'ME201', department: mech._id, credits: 4 },
    { name: 'Manufacturing Technology', code: 'ME301', department: mech._id, credits: 3 },
    // CIVIL
    { name: 'Structural Analysis', code: 'CE101', department: civil._id, credits: 4 },
    { name: 'Geotechnical Engineering', code: 'CE201', department: civil._id, credits: 3 },
    // MBA
    { name: 'Financial Management', code: 'MB101', department: mba._id, credits: 3 },
    { name: 'Marketing Management', code: 'MB201', department: mba._id, credits: 3 },
    { name: 'Human Resource Management', code: 'MB301', department: mba._id, credits: 3 },
    // MATH
    { name: 'Calculus & Differential Equations', code: 'MA101', department: maths._id, credits: 4 },
    { name: 'Linear Algebra', code: 'MA201', department: maths._id, credits: 3 },
    // PHY
    { name: 'Engineering Physics', code: 'PH101', department: physics._id, credits: 4 },
    // CHEM
    { name: 'Engineering Chemistry', code: 'CH101', department: chemistry._id, credits: 4 },
    // ENG
    { name: 'Technical Communication', code: 'EN101', department: english._id, credits: 2 },
  ]);

  // ── Skill Areas ──────────────────────────────────────────────────────────────
  console.log('🎯  Seeding skill areas...');
  const [teachSkill, resSkill, ictSkill, indSkill, admSkill] = await SkillArea.insertMany([
    { name: 'Teaching Pedagogy', description: 'Instructional design, student engagement, assessment methods', category: 'Core', order: 1 },
    { name: 'Research & Publications', description: 'Journal publications, conference papers, research grants', category: 'Academic', order: 2 },
    { name: 'ICT Skills', description: 'Digital tools, LMS, online teaching, EdTech', category: 'Technical', order: 3 },
    { name: 'Industry Collaboration', description: 'Industry projects, consultancy, MoUs', category: 'Professional', order: 4 },
    { name: 'Administration & Leadership', description: 'Committee work, mentoring, departmental administration', category: 'Leadership', order: 5 },
  ]);

  // ── Faculty Profile (Administrator) ──────────────────────────────────────────
  console.log('👨‍🏫  Seeding administrator profile...');
  await FacultyProfile.create({
    userId: admin._id,
    bio: 'Chief Administrator overseeing institutional systems, faculty governance, and security operations.',
    qualifications: [{ degree: 'M.Tech', institution: 'IIT Delhi', year: 2010, specialization: 'Information Systems' }],
    experience: [{ institution: 'AcademiaSync University', role: 'Chief Administrator', fromYear: 2015, isCurrent: true }],
    profileCompleteness: 100,
  });
  await FacultyProfile.insertMany(
    [hodCse, hodEce, facultyCse, facultyEce].map((user) => ({
      userId: user._id,
      bio: `Demo faculty profile for ${user.name}.`,
      qualifications: [],
      experience: [],
      certifications: [],
      accomplishments: [],
      subjectsTaught: [],
      researchAreas: [],
      profileCompleteness: 25,
    }))
  );

  // ── Training Programs ────────────────────────────────────────────────────────
  console.log('🎓  Seeding training programs & course assessments...');
  const [tp1, tp2, tp3, tp4] = await TrainingProgram.insertMany([
    {
      title: 'Faculty Development Program on AI & ML',
      type: 'FDP',
      description: 'Comprehensive FDP on latest AI/ML techniques for faculty members across all departments.',
      organizer: 'AICTE & IIT Madras',
      venue: 'Online',
      mode: 'online',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-09-05'),
      capacity: 50,
      registrationDeadline: new Date('2026-08-25'),
      targetDepartments: [cse._id, ece._id],
      createdBy: admin._id,
      tags: ['AI', 'ML', 'Deep Learning'],
      skillAreaIds: [resSkill._id, ictSkill._id],
      passingScore: 60,
      maxAttempts: 3,
      cooldownHours: 24,
      requiresAssessmentToCertify: true,
      certificationValidityYears: 2,
    },
    {
      title: 'Research Methodology & Academic Writing Workshop',
      type: 'Workshop',
      description: 'Hands-on workshop on research design, data analysis, and writing high-impact papers.',
      organizer: 'AcademiaSync R&D Cell',
      venue: 'Seminar Hall A',
      mode: 'offline',
      startDate: new Date('2026-09-15'),
      endDate: new Date('2026-09-16'),
      capacity: 30,
      registrationDeadline: new Date('2026-09-10'),
      targetDepartments: [],
      createdBy: admin._id,
      tags: ['Research', 'Writing', 'Publication'],
      skillAreaIds: [resSkill._id],
      passingScore: 60,
    },
    {
      title: 'NPTEL Online Certification: Data Science',
      type: 'MOOC',
      description: 'Self-paced NPTEL course on Data Science fundamentals.',
      organizer: 'NPTEL-IIT Kharagpur',
      mode: 'online',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-11-30'),
      capacity: 100,
      createdBy: admin._id,
      tags: ['Data Science', 'Python', 'NPTEL'],
      skillAreaIds: [ictSkill._id],
    },
    {
      title: 'National Conference on Emerging Technologies',
      type: 'Conference',
      description: 'Annual national conference featuring keynotes and paper presentations.',
      organizer: 'AcademiaSync University',
      venue: 'Convention Centre',
      mode: 'hybrid',
      startDate: new Date('2026-11-10'),
      endDate: new Date('2026-11-12'),
      capacity: 200,
      createdBy: admin._id,
      tags: ['Conference', 'Research', 'Networking'],
      skillAreaIds: [indSkill._id],
    },
  ]);

  // ── Course Assessment Linked to tp1 ──────────────────────────────────────────
  const courseAssessment = await CourseAssessment.create({
    programId: tp1._id,
    title: 'AI & ML Competency & Pedagogy Assessment',
    instructions: 'Complete all 3 questions to achieve verified institutional certification.',
    passingScore: 60,
    timeLimitMinutes: 30,
    createdBy: admin._id,
    isActive: true,
    questions: [
      {
        prompt: 'Which loss function is most commonly used in multi-class classification problems?',
        type: 'mcq',
        options: ['Mean Squared Error', 'Categorical Cross-Entropy', 'Hinge Loss', 'L1 Loss'],
        correctAnswer: 1,
        maxScore: 10,
      },
      {
        prompt: 'What is the primary role of dropout layers in deep neural network architectures?',
        type: 'mcq',
        options: ['Speeding up matrix multiplications', 'Preventing model overfitting', 'Increasing layer dimensions', 'Normalizing activations'],
        correctAnswer: 1,
        maxScore: 10,
      },
      {
        prompt: 'In supervised learning, what does the validation set primarily serve to evaluate?',
        type: 'mcq',
        options: ['Weight initialization gradients', 'Hyperparameter tuning and generalization error', 'Raw feature extraction performance', 'Batch normalization moving variance'],
        correctAnswer: 1,
        maxScore: 10,
      },
    ],
  });

  await TrainingProgram.findByIdAndUpdate(tp1._id, { assessmentId: courseAssessment._id });

  // ── Training Sessions (Multi-Session Schedule) ──────────────────────────────
  console.log('📅  Seeding training program scheduled sessions...');
  await TrainingProgram.findByIdAndUpdate(tp1._id, { hasScheduledSessions: true });
  await TrainingProgram.findByIdAndUpdate(tp2._id, { hasScheduledSessions: true });

  await TrainingSession.insertMany([
    {
      programId: tp1._id,
      title: 'Session 1: Transformer Architectures, Attention & Pretraining Dynamics',
      description: 'Foundations of multi-head attention, positional encodings, and pre-trained LLM pipelines.',
      scheduledDate: new Date('2026-09-16'),
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      venueOrLink: 'CSE Department Computing Lab 3',
      organiserId: null,
      status: 'scheduled',
      attendees: [],
    },
    {
      programId: tp1._id,
      title: 'Session 2: Fine-Tuning, LoRA & Prompt Engineering for Pedagogy',
      description: 'Hands-on instruction on parameter-efficient fine-tuning and curriculum-tailored prompt templates.',
      scheduledDate: new Date('2026-09-23'),
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      venueOrLink: 'CSE Department Computing Lab 3 & Hybrid Stream',
      organiserId: null,
      status: 'scheduled',
      attendees: [],
    },
    {
      programId: tp2._id,
      title: 'Session 1: High-Impact SCI & Scopus Paper Framing & Structure',
      description: 'Peer-reviewed manuscript structural standards, literature review matrices, and rebuttal strategies.',
      scheduledDate: new Date('2026-09-18'),
      startTime: '02:00 PM',
      endTime: '05:00 PM',
      venueOrLink: 'R&D Advisory Council Seminar Hall A',
      organiserId: null,
      status: 'scheduled',
      attendees: [],
    },
  ]);

  // ── Appraisal Cycle ──────────────────────────────────────────────────────────
  console.log('📊  Seeding appraisal cycle...');
  await AppraisalCycle.create({
    title: 'Annual Performance Appraisal 2025-26',
    academicYear: '2025-26',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-05-31'),
    submissionDeadline: new Date('2026-05-15'),
    criteria: [
      { name: 'Teaching Effectiveness', description: 'Quality of instruction, student feedback scores', maxScore: 40, weight: 40 },
      { name: 'Research & Publications', description: 'Journals, conferences, citations', maxScore: 30, weight: 30 },
      { name: 'Industry Interaction', description: 'Projects, consultancy, MoUs', maxScore: 15, weight: 15 },
      { name: 'Administrative Contributions', description: 'Committee work, mentoring, extracurricular', maxScore: 15, weight: 15 },
    ],
    targetDepartments: [],
    createdBy: admin._id,
    status: 'active',
  });

  // ── Custom Assessments & Surveys ─────────────────────────────────────────────
  console.log('📋  Seeding institutional assessments & surveys...');
  const qAI1 = new mongoose.Types.ObjectId();
  const qAI2 = new mongoose.Types.ObjectId();
  const qAI3 = new mongoose.Types.ObjectId();
  const qAI4 = new mongoose.Types.ObjectId();

  const qS1 = new mongoose.Types.ObjectId();
  const qS2 = new mongoose.Types.ObjectId();
  const qS3 = new mongoose.Types.ObjectId();
  const qS4 = new mongoose.Types.ObjectId();

  const qE1 = new mongoose.Types.ObjectId();
  const qE2 = new mongoose.Types.ObjectId();
  const qE3 = new mongoose.Types.ObjectId();

  await Assessment.insertMany([
    {
      title: 'AI Pedagogy & Generative AI Ethics in Higher Ed',
      description: 'Institutional assessment on modern AI tooling, syllabus integration, formative viva evaluations, and contract cheating deterrence.',
      topic: 'AI & Pedagogy',
      createdBy: admin._id,
      createdByRole: 'administrator',
      targetScope: { type: 'department', targetIds: [cse._id] },
      questions: [
        {
          _id: qAI1,
          prompt: 'What is the primary pedagogical vulnerability of unproctored coding assignments in the era of LLMs?',
          type: 'mcq',
          options: [
            'Superficial completion without underlying architectural comprehension',
            'Slower compilation times on student machines',
            'Inability to write unit tests',
            'Excessive reliance on open-source libraries',
          ],
          correctAnswer: 0,
          points: 3,
          competencyId: teachSkill._id,
        },
        {
          _id: qAI2,
          prompt: 'True or False: Formative oral vivas combined with code walk-through rubrics provide strong verification of authentic student learning.',
          type: 'boolean',
          correctAnswer: true,
          points: 2,
          competencyId: teachSkill._id,
        },
        {
          _id: qAI3,
          prompt: 'On a scale of 1 to 5, how confident do you feel designing AI-resilient assignments for your current semester subjects?',
          type: 'rating',
          points: 0,
          competencyId: ictSkill._id,
        },
        {
          _id: qAI4,
          prompt: 'Outline your department-level strategy for assessing complex student projects where AI assistants (e.g., Copilot) are explicitly permitted.',
          type: 'text',
          points: 5,
          rubricGuide: 'Evaluate based on viva integration, incremental commit history review, and design rationale defense.',
          competencyId: teachSkill._id,
        },
      ],
      settings: {
        isGraded: true,
        isAnonymous: false,
        allowRetake: true,
        maxAttempts: 2,
        timeLimitMinutes: 25,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      status: 'published',
      isTemplate: false,
    },
    {
      title: 'Curriculum Modernization & Lab Readiness Survey',
      description: 'Campus-wide anonymous faculty survey evaluating laboratory computing equipment, software licensing, and industry alignment.',
      topic: 'Infrastructure & Curriculum',
      createdBy: admin._id,
      createdByRole: 'administrator',
      targetScope: { type: 'all' },
      questions: [
        {
          _id: qS1,
          prompt: 'How adequate are current departmental computing and laboratory facilities for teaching cutting-edge syllabi?',
          type: 'rating',
          points: 0,
        },
        {
          _id: qS2,
          prompt: 'How satisfied are you with institutional turnaround times for procuring specialized software licenses and datasets?',
          type: 'rating',
          points: 0,
        },
        {
          _id: qS3,
          prompt: 'True or False: Your department has established a formal industry advisory board to review semester curriculum revisions.',
          type: 'boolean',
          correctAnswer: true,
          points: 0,
        },
        {
          _id: qS4,
          prompt: 'What specific hardware, server infrastructure, or cloud credits would most accelerate your department research and laboratory instruction?',
          type: 'text',
          points: 0,
        },
      ],
      settings: {
        isGraded: false,
        isAnonymous: true,
        allowRetake: false,
        maxAttempts: 1,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      status: 'published',
      isTemplate: false,
    },
    {
      title: 'Research Ethics, IPR & High-Impact Publishing Benchmark',
      description: 'Standardized evaluation of author contributions, plagiarism thresholds, ethical animal/human protocols, and patent disclosures.',
      topic: 'Research & Ethics',
      createdBy: admin._id,
      createdByRole: 'administrator',
      targetScope: { type: 'all' },
      questions: [
        {
          _id: qE1,
          prompt: 'Under standard IEEE and UGC guidelines, which criteria must be satisfied to qualify for journal paper co-authorship?',
          type: 'mcq',
          options: [
            'Substantial intellectual contribution to conception, experimental execution, or manuscript formulation',
            'Acquisition of department funding alone',
            'General administrative supervision of the research group',
            'Proofreading formatting styles without technical edits',
          ],
          correctAnswer: 0,
          points: 4,
          competencyId: resSkill._id,
        },
        {
          _id: qE2,
          prompt: 'True or False: Republication of substantial portions of one’s own previously published work without explicit citation is considered self-plagiarism.',
          type: 'boolean',
          correctAnswer: true,
          points: 3,
          competencyId: resSkill._id,
        },
        {
          _id: qE3,
          prompt: 'Describe the institutional process required prior to public disclosure if a research invention has patent potential.',
          type: 'text',
          points: 3,
          rubricGuide: 'Look for submission to institutional IPR cell prior to arXiv or conference publication.',
          competencyId: resSkill._id,
        },
      ],
      settings: {
        isGraded: true,
        isAnonymous: false,
        allowRetake: false,
        maxAttempts: 1,
        timeLimitMinutes: 30,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
      status: 'published',
      isTemplate: true,
    },
  ]);

  console.log('\n✅ Seed complete! Demo accounts for all supported roles and institutional master data initialized.\n');
};

const runStandalone = async () => {
  let uri = process.env.MONGO_URI || process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI;

  if (!uri) {
    const atlasPath = path.join(__dirname, '..', '..', 'atlas-credentials.env');
    if (fs.existsSync(atlasPath)) {
      dotenv.config({ path: atlasPath });
      uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    }
  }

  if (!uri) {
    uri = 'mongodb://localhost:27017/academiasync';
  }

  const targetDb = process.env.DB_NAME || 'academiasync';

  // Enforce targetDb path in connection string if not already present
  if (!uri.includes(`/${targetDb}`)) {
    if (uri.includes('?')) {
      uri = uri.replace(/\/(?:\?|$)/, `/${targetDb}?`);
    } else {
      uri = `${uri.replace(/\/$/, '')}/${targetDb}`;
    }
  }

  console.log(`🔌 Connecting to MongoDB Instance [Target DB: "${targetDb}"]...`);
  await mongoose.connect(uri, { dbName: targetDb });
  console.log(`✅ Connected to MongoDB: ${mongoose.connection.host} [Active DB: "${mongoose.connection.name}"]\n`);

  if (mongoose.connection.name === 'test') {
    console.warn(`⚠️  WARNING: Connected to "test" database instead of "${targetDb}".`);
  }

  await seedData();
  await mongoose.disconnect();
  console.log(`🏁 Finished seeding database "${targetDb}". Exiting.`);
  process.exit(0);
};

if (require.main === module || process.argv[1]?.includes('seed')) {
  runStandalone().catch(err => { console.error(err); process.exit(1); });
}

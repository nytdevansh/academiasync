import dotenv from 'dotenv';
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
import AppraisalCycle from '../models/AppraisalCycle';
import CompetencyRecord from '../models/CompetencyRecord';

const hash = async (pw: string) => bcrypt.hash(pw, await bcrypt.genSalt(10));

const seed = async () => {
  const uri = process.env.MONGODB_ATLAS_URI;
  if (!uri) { console.error('❌ MONGODB_ATLAS_URI not set in .env'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB\n');

  // Clear existing data
  console.log('🗑  Clearing existing seed data...');
  await Promise.all([
    User.deleteMany({}), Department.deleteMany({}), Subject.deleteMany({}),
    SkillArea.deleteMany({}), FacultyProfile.deleteMany({}),
    TrainingProgram.deleteMany({}), TrainingEnrollment.deleteMany({}),
    AppraisalCycle.deleteMany({}), CompetencyRecord.deleteMany({}),
  ]);

  // ── Departments ──────────────────────────────────────────────────────────────
  console.log('🏛  Seeding departments...');
  const [cse, ece, mech, civil, mba, physics, chemistry, maths, english, arts] = await Department.insertMany([
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

  // ── Users ────────────────────────────────────────────────────────────────────
  console.log('👤  Seeding users...');
  const adminHash = await hash('Admin@123');
  const hodHash   = await hash('Hod@123');
  const deanHash  = await hash('Dean@123');
  const hrHash    = await hash('Hr@123');
  const facHash   = await hash('Faculty@123');

  const [admin, hodCSE, hodECE, dean, hr, fac1, fac2, fac3, fac4] = await User.insertMany([
    { name: 'Admin User', email: 'admin@academiasync.edu', passwordHash: adminHash, role: 'administrator', status: 'active' },
    { name: 'Dr. Kavitha Ramesh', email: 'hod.cse@academiasync.edu', passwordHash: hodHash, role: 'hod', department: cse._id, status: 'active' },
    { name: 'Dr. Rajan Pillai', email: 'hod.ece@academiasync.edu', passwordHash: hodHash, role: 'hod', department: ece._id, status: 'active' },
    { name: 'Dr. Suresh Menon', email: 'dean@academiasync.edu', passwordHash: deanHash, role: 'dean', status: 'active' },
    { name: 'Priya Nair', email: 'hr@academiasync.edu', passwordHash: hrHash, role: 'hr', status: 'active' },
    { name: 'Dr. Arjun Krishnan', email: 'faculty@academiasync.edu', passwordHash: facHash, role: 'faculty_member', department: cse._id, status: 'active' },
    { name: 'Ms. Divya Thomas', email: 'faculty2@academiasync.edu', passwordHash: facHash, role: 'faculty_member', department: ece._id, status: 'active' },
    { name: 'Mr. Rahul Sharma', email: 'faculty3@academiasync.edu', passwordHash: facHash, role: 'faculty_member', department: cse._id, status: 'active' },
    { name: 'Dr. Anitha George', email: 'faculty4@academiasync.edu', passwordHash: facHash, role: 'faculty_member', department: mech._id, status: 'active' },
  ]);

  // Update HOD refs in departments
  await Department.findByIdAndUpdate(cse._id, { hodRef: hodCSE._id });
  await Department.findByIdAndUpdate(ece._id, { hodRef: hodECE._id });

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

  // ── Faculty Profiles ─────────────────────────────────────────────────────────
  console.log('👨‍🏫  Seeding faculty profiles...');
  await FacultyProfile.insertMany([
    {
      userId: fac1._id,
      bio: 'Experienced faculty in AI and Machine Learning with 8+ years of teaching and research experience.',
      qualifications: [{ degree: 'Ph.D', institution: 'IIT Madras', year: 2015, specialization: 'Artificial Intelligence' }, { degree: 'M.Tech', institution: 'NIT Trichy', year: 2010, specialization: 'Computer Science' }],
      experience: [{ institution: 'AcademiaSync University', role: 'Assistant Professor', fromYear: 2015, isCurrent: true }],
      certifications: [{ name: 'Google Cloud Professional ML Engineer', issuingBody: 'Google', issueDate: new Date('2023-06-01') }],
      accomplishments: [{ title: 'Best Paper Award', description: 'IEEE Conference on ML 2022', date: new Date('2022-11-15'), category: 'Research' }],
      subjectsTaught: [subjects[0]._id, subjects[2]._id],
      researchAreas: ['Deep Learning', 'NLP', 'Computer Vision'],
      profileCompleteness: 90,
    },
    {
      userId: fac2._id,
      bio: 'Specialist in VLSI and embedded systems with industry experience at Qualcomm.',
      qualifications: [{ degree: 'M.Tech', institution: 'IISc Bangalore', year: 2012, specialization: 'VLSI Design' }],
      experience: [{ institution: 'Qualcomm', role: 'Senior Engineer', fromYear: 2012, toYear: 2018, isCurrent: false }, { institution: 'AcademiaSync University', role: 'Assistant Professor', fromYear: 2018, isCurrent: true }],
      subjectsTaught: [subjects[7]._id, subjects[8]._id],
      researchAreas: ['VLSI', 'IoT', 'Embedded AI'],
      profileCompleteness: 75,
    },
    { userId: hodCSE._id, qualifications: [{ degree: 'Ph.D', institution: 'IIT Bombay', year: 2008, specialization: 'Systems Engineering' }], experience: [{ institution: 'AcademiaSync University', role: 'Professor & HOD', fromYear: 2008, isCurrent: true }], profileCompleteness: 85 },
    { userId: fac3._id, qualifications: [{ degree: 'M.Tech', institution: 'Anna University', year: 2018, specialization: 'Web Technologies' }], experience: [{ institution: 'AcademiaSync University', role: 'Assistant Professor', fromYear: 2019, isCurrent: true }], profileCompleteness: 50 },
    { userId: fac4._id, qualifications: [{ degree: 'Ph.D', institution: 'NIT Calicut', year: 2016, specialization: 'Thermal Engineering' }], experience: [{ institution: 'AcademiaSync University', role: 'Associate Professor', fromYear: 2016, isCurrent: true }], profileCompleteness: 80 },
  ]);

  // ── Training Programs ────────────────────────────────────────────────────────
  console.log('🎓  Seeding training programs...');
  const [tp1, tp2, tp3, tp4] = await TrainingProgram.insertMany([
    { title: 'Faculty Development Program on AI & ML', type: 'FDP', description: 'Comprehensive FDP on latest AI/ML techniques for faculty members across all departments.', organizer: 'AICTE & IIT Madras', venue: 'Online', mode: 'online', startDate: new Date('2026-09-01'), endDate: new Date('2026-09-05'), capacity: 50, registrationDeadline: new Date('2026-08-25'), targetDepartments: [], createdBy: admin._id, tags: ['AI', 'ML', 'Deep Learning'] },
    { title: 'Research Methodology & Academic Writing Workshop', type: 'Workshop', description: 'Hands-on workshop on research design, data analysis, and writing high-impact papers.', organizer: 'AcademiaSync R&D Cell', venue: 'Seminar Hall A', mode: 'offline', startDate: new Date('2026-09-15'), endDate: new Date('2026-09-16'), capacity: 30, registrationDeadline: new Date('2026-09-10'), targetDepartments: [], createdBy: admin._id, tags: ['Research', 'Writing', 'Publication'] },
    { title: 'NPTEL Online Certification: Data Science', type: 'MOOC', description: 'Self-paced NPTEL course on Data Science fundamentals.', organizer: 'NPTEL-IIT Kharagpur', mode: 'online', startDate: new Date('2026-10-01'), endDate: new Date('2026-11-30'), capacity: 100, createdBy: admin._id, tags: ['Data Science', 'Python', 'NPTEL'] },
    { title: 'National Conference on Emerging Technologies', type: 'Conference', description: 'Annual national conference featuring keynotes and paper presentations.', organizer: 'AcademiaSync University', venue: 'Convention Centre', mode: 'hybrid', startDate: new Date('2026-11-10'), endDate: new Date('2026-11-12'), capacity: 200, createdBy: admin._id, tags: ['Conference', 'Research', 'Networking'] },
  ]);

  // ── Training Enrollments ─────────────────────────────────────────────────────
  console.log('📝  Seeding enrollments...');
  await TrainingEnrollment.insertMany([
    { userId: fac1._id, programId: tp1._id, status: 'approved', nominatedBy: fac1._id, approvedBy: hodCSE._id, nominationDate: new Date('2026-08-10'), approvalDate: new Date('2026-08-12') },
    { userId: fac1._id, programId: tp2._id, status: 'completed', nominatedBy: fac1._id, approvedBy: hodCSE._id, nominationDate: new Date('2026-07-01'), completionDate: new Date('2026-07-20'), feedback: { rating: 5, comments: 'Excellent workshop!', learningOutcome: 'Learned advanced statistical methods for research.' }, certificateUrl: 'https://example.com/cert/fac1-workshop' },
    { userId: fac2._id, programId: tp1._id, status: 'nominated', nominatedBy: fac2._id, nominationDate: new Date('2026-08-15') },
    { userId: fac3._id, programId: tp3._id, status: 'approved', nominatedBy: fac3._id, approvedBy: hodCSE._id, nominationDate: new Date('2026-09-05') },
    { userId: fac4._id, programId: tp4._id, status: 'nominated', nominatedBy: fac4._id, nominationDate: new Date('2026-08-20') },
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

  // ── Competency Records ───────────────────────────────────────────────────────
  console.log('🔬  Seeding competency records...');
  await CompetencyRecord.insertMany([
    { userId: fac1._id, skillArea: teachSkill._id, currentLevel: 'advanced', targetLevel: 'expert', lastAssessedDate: new Date(), gapsIdentified: ['Active learning techniques'] },
    { userId: fac1._id, skillArea: resSkill._id, currentLevel: 'proficient', targetLevel: 'advanced', lastAssessedDate: new Date() },
    { userId: fac1._id, skillArea: ictSkill._id, currentLevel: 'expert', targetLevel: 'expert', lastAssessedDate: new Date() },
    { userId: fac2._id, skillArea: teachSkill._id, currentLevel: 'proficient', targetLevel: 'advanced', lastAssessedDate: new Date() },
    { userId: fac2._id, skillArea: indSkill._id, currentLevel: 'advanced', targetLevel: 'expert', lastAssessedDate: new Date() },
  ]);

  console.log('\n✅ Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Demo Credentials:');
  console.log('  admin@academiasync.edu    Admin@123   (Administrator)');
  console.log('  hod.cse@academiasync.edu  Hod@123     (HOD - CSE)');
  console.log('  dean@academiasync.edu     Dean@123    (Dean)');
  console.log('  hr@academiasync.edu       Hr@123      (HR)');
  console.log('  faculty@academiasync.edu  Faculty@123 (Faculty - CSE)');
  console.log('  faculty2@academiasync.edu Faculty@123 (Faculty - ECE)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });

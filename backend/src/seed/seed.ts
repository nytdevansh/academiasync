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
import Assessment from '../models/Assessment';
import AssessmentResponse from '../models/AssessmentResponse';
import CourseResult from '../models/CourseResult';
import Certificate from '../models/Certificate';
import CourseAssessment from '../models/CourseAssessment';
import CourseAssessmentSubmission from '../models/CourseAssessmentSubmission';
import { issueCertificate } from '../services/certificateService';

const hash = async (pw: string) => bcrypt.hash(pw, await bcrypt.genSalt(12));

export const seedData = async () => {

  // Clear existing data
  console.log('🗑  Clearing existing seed data...');
  await Promise.all([
    User.deleteMany({}), Department.deleteMany({}), Subject.deleteMany({}),
    SkillArea.deleteMany({}), FacultyProfile.deleteMany({}),
    TrainingProgram.deleteMany({}), TrainingEnrollment.deleteMany({}),
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

  // ── Users ────────────────────────────────────────────────────────────────────
  console.log('👤  Seeding users into designated department directories...');
  const adminHash = await hash('Admin@123');
  const hodHash   = await hash('Hod@123');
  const deanHash  = await hash('Dean@123');
  const hrHash    = await hash('Hr@123');
  const facHash   = await hash('Faculty@123');

  const [admin, hodCSE, hodECE, dean, hr, fac1, fac2, fac3, fac4] = await User.insertMany([
    { name: 'Admin User', email: 'admin@academiasync.edu', passwordHash: adminHash, role: 'administrator', department: adminDept._id, status: 'active' },
    { name: 'Dr. Kavitha Ramesh', email: 'hod.cse@academiasync.edu', passwordHash: hodHash, role: 'hod', department: cse._id, status: 'active' },
    { name: 'Dr. Rajan Pillai', email: 'hod.ece@academiasync.edu', passwordHash: hodHash, role: 'hod', department: ece._id, status: 'active' },
    { name: 'Dr. Suresh Menon', email: 'dean@academiasync.edu', passwordHash: deanHash, role: 'dean', department: acadDept._id, status: 'active' },
    { name: 'Priya Nair', email: 'hr@academiasync.edu', passwordHash: hrHash, role: 'hr', department: hrDept._id, status: 'active' },
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
      userId: admin._id,
      bio: 'Chief Administrator overseeing institutional systems, faculty governance, and security operations.',
      qualifications: [{ degree: 'M.Tech', institution: 'IIT Delhi', year: 2010, specialization: 'Information Systems' }],
      experience: [{ institution: 'AcademiaSync University', role: 'Chief Administrator', fromYear: 2015, isCurrent: true }],
      profileCompleteness: 100,
    },
    {
      userId: dean._id,
      bio: 'Dean of Academic Affairs guiding university accreditation, faculty competency, and academic policy.',
      qualifications: [{ degree: 'Ph.D', institution: 'IISc Bangalore', year: 2005, specialization: 'Computer Science' }],
      experience: [{ institution: 'AcademiaSync University', role: 'Dean of Academic Affairs', fromYear: 2012, isCurrent: true }],
      profileCompleteness: 100,
    },
    {
      userId: hr._id,
      bio: 'Head of Human Resources managing faculty development, appraisal workflows, and institutional compliance.',
      qualifications: [{ degree: 'MBA HR', institution: 'XLRI Jamshedpur', year: 2014, specialization: 'Human Resource Management' }],
      experience: [{ institution: 'AcademiaSync University', role: 'Head of HR', fromYear: 2018, isCurrent: true }],
      profileCompleteness: 95,
    },
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
    { userId: hodECE._id, qualifications: [{ degree: 'Ph.D', institution: 'IIT Madras', year: 2009, specialization: 'Telecommunications' }], experience: [{ institution: 'AcademiaSync University', role: 'Professor & HOD', fromYear: 2009, isCurrent: true }], profileCompleteness: 85 },
    { userId: fac3._id, qualifications: [{ degree: 'M.Tech', institution: 'Anna University', year: 2018, specialization: 'Web Technologies' }], experience: [{ institution: 'AcademiaSync University', role: 'Assistant Professor', fromYear: 2019, isCurrent: true }], profileCompleteness: 50 },
    { userId: fac4._id, qualifications: [{ degree: 'Ph.D', institution: 'NIT Calicut', year: 2016, specialization: 'Thermal Engineering' }], experience: [{ institution: 'AcademiaSync University', role: 'Associate Professor', fromYear: 2016, isCurrent: true }], profileCompleteness: 80 },
  ]);

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

  // ── Training Enrollments ─────────────────────────────────────────────────────
  console.log('📝  Seeding enrollments & certificates...');
  const [enr1, enr2, enr3, enr4, enr5] = await TrainingEnrollment.insertMany([
    {
      userId: fac1._id,
      programId: tp1._id,
      status: 'certified',
      nominatedBy: fac1._id,
      approvedBy: hodCSE._id,
      nominationDate: new Date('2026-08-10'),
      approvalDate: new Date('2026-08-12'),
      completionDate: new Date('2026-09-04'),
      attemptsCount: 1,
      lastPassedAttemptAt: new Date('2026-09-04'),
    },
    {
      userId: fac1._id,
      programId: tp2._id,
      status: 'completed',
      nominatedBy: fac1._id,
      approvedBy: hodCSE._id,
      nominationDate: new Date('2026-07-01'),
      completionDate: new Date('2026-07-20'),
      feedback: { rating: 5, comments: 'Excellent workshop!', learningOutcome: 'Learned advanced statistical methods for research.' },
      certificateUrl: 'https://example.com/cert/fac1-workshop',
    },
    { userId: fac2._id, programId: tp1._id, status: 'nominated', nominatedBy: fac2._id, nominationDate: new Date('2026-08-15') },
    { userId: fac3._id, programId: tp3._id, status: 'approved', nominatedBy: fac3._id, approvedBy: hodCSE._id, nominationDate: new Date('2026-09-05') },
    { userId: fac4._id, programId: tp4._id, status: 'nominated', nominatedBy: fac4._id, nominationDate: new Date('2026-08-20') },
  ]);

  // Create CourseResult and Certificate for fac1 on tp1
  const seededResult = await CourseResult.create({
    enrollmentId: enr1._id,
    teacherId: fac1._id,
    courseId: tp1._id,
    assessmentId: courseAssessment._id,
    attemptNumber: 1,
    score: 100,
    totalScore: 30,
    maxPossibleScore: 30,
    passingScore: 60,
    passed: true,
    status: 'graded',
    answers: [
      { questionIndex: 0, prompt: 'Which loss function is most commonly used in multi-class classification problems?', type: 'mcq', selectedOption: 1, score: 10, maxScore: 10, feedback: 'Correct', isCorrect: true },
      { questionIndex: 1, prompt: 'What is the primary role of dropout layers in deep neural network architectures?', type: 'mcq', selectedOption: 1, score: 10, maxScore: 10, feedback: 'Correct', isCorrect: true },
      { questionIndex: 2, prompt: 'In supervised learning, what does the validation set primarily serve to evaluate?', type: 'mcq', selectedOption: 1, score: 10, maxScore: 10, feedback: 'Correct', isCorrect: true },
    ],
    completedAt: new Date('2026-09-04'),
  });

  const seededCert = await issueCertificate({
    teacher: fac1,
    course: tp1,
    enrollmentId: enr1._id,
    resultId: seededResult._id,
    departmentName: 'Computer Science & Engineering',
    departmentCode: 'CSE',
  });

  await TrainingEnrollment.findByIdAndUpdate(enr1._id, { certificateId: seededCert._id });
  await CourseResult.findByIdAndUpdate(seededResult._id, { certificateId: seededCert._id });

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

  // ── Custom Assessments & Surveys ─────────────────────────────────────────────
  console.log('📋  Seeding custom assessments & surveys...');
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

  const [assessmentAI, assessmentSurvey, assessmentEthics] = await Assessment.insertMany([
    {
      title: 'AI Pedagogy & Generative AI Ethics in Higher Ed',
      description: 'Institutional assessment on modern AI tooling, syllabus integration, formative viva evaluations, and contract cheating deterrence.',
      topic: 'AI & Pedagogy',
      createdBy: hodCSE._id,
      createdByRole: 'hod',
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
      createdBy: dean._id,
      createdByRole: 'dean',
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

  // ── Seed Assessment Responses ────────────────────────────────────────────────
  console.log('📝  Seeding assessment responses...');
  await AssessmentResponse.insertMany([
    // fac1 response to AI Pedagogy (graded & reviewed)
    {
      assessmentId: assessmentAI._id,
      facultyId: fac1._id,
      attemptNumber: 1,
      answers: [
        { questionId: qAI1, answer: 0, score: 3 },
        { questionId: qAI2, answer: true, score: 2 },
        { questionId: qAI3, answer: 4, score: 0 },
        {
          questionId: qAI4,
          answer: 'We require students to submit recorded 3-minute code walkthroughs, followed by randomized parameter variations during live lab sessions to verify true understanding.',
          score: 5,
          feedback: 'Outstanding pedagogical framework with viva-based verification.',
        },
      ],
      totalScore: 10,
      maxScore: 10,
      status: 'reviewed',
      startedAt: new Date(Date.now() - 48 * 3600 * 1000),
      submittedAt: new Date(Date.now() - 47 * 3600 * 1000),
      timeTakenSeconds: 1120,
      reviewerNotes: 'Exemplary submission. Recommend sharing this viva rubric across the CSE department.',
      reviewedBy: hodCSE._id,
      reviewedAt: new Date(Date.now() - 24 * 3600 * 1000),
    },
    // fac3 response to AI Pedagogy (submitted, pending text review)
    {
      assessmentId: assessmentAI._id,
      facultyId: fac3._id,
      attemptNumber: 1,
      answers: [
        { questionId: qAI1, answer: 0, score: 3 },
        { questionId: qAI2, answer: true, score: 2 },
        { questionId: qAI3, answer: 3, score: 0 },
        {
          questionId: qAI4,
          answer: 'I use automated unit testing and check Git commit intervals to ensure continuous development.',
          score: 0,
        },
      ],
      totalScore: 5,
      maxScore: 10,
      status: 'submitted',
      startedAt: new Date(Date.now() - 12 * 3600 * 1000),
      submittedAt: new Date(Date.now() - 11.5 * 3600 * 1000),
      timeTakenSeconds: 980,
    },
    // fac1 response to Survey
    {
      assessmentId: assessmentSurvey._id,
      facultyId: fac1._id,
      attemptNumber: 1,
      answers: [
        { questionId: qS1, answer: 4, score: 0 },
        { questionId: qS2, answer: 3, score: 0 },
        { questionId: qS3, answer: true, score: 0 },
        {
          questionId: qS4,
          answer: 'Dedicated NVIDIA GPU workstations for deep learning labs and accelerated access to cloud compute clusters.',
          score: 0,
        },
      ],
      totalScore: 0,
      maxScore: 0,
      status: 'reviewed',
      startedAt: new Date(Date.now() - 36 * 3600 * 1000),
      submittedAt: new Date(Date.now() - 35.8 * 3600 * 1000),
      timeTakenSeconds: 420,
    },
    // fac2 response to Survey
    {
      assessmentId: assessmentSurvey._id,
      facultyId: fac2._id,
      attemptNumber: 1,
      answers: [
        { questionId: qS1, answer: 5, score: 0 },
        { questionId: qS2, answer: 4, score: 0 },
        { questionId: qS3, answer: true, score: 0 },
        {
          questionId: qS4,
          answer: 'Modern FPGA development boards (Xilinx Zynq) and Cadence VLSI layout tool licenses for ECE labs.',
          score: 0,
        },
      ],
      totalScore: 0,
      maxScore: 0,
      status: 'reviewed',
      startedAt: new Date(Date.now() - 20 * 3600 * 1000),
      submittedAt: new Date(Date.now() - 19.8 * 3600 * 1000),
      timeTakenSeconds: 380,
    },
    // fac2 response to Ethics benchmark
    {
      assessmentId: assessmentEthics._id,
      facultyId: fac2._id,
      attemptNumber: 1,
      answers: [
        { questionId: qE1, answer: 0, score: 4 },
        { questionId: qE2, answer: true, score: 3 },
        {
          questionId: qE3,
          answer: 'Invention must be submitted to the University IPR facilitation cell for prior art search and provisional patent filing before presenting at conferences or posting preprints.',
          score: 3,
          feedback: 'Accurate process description.',
        },
      ],
      totalScore: 10,
      maxScore: 10,
      status: 'reviewed',
      startedAt: new Date(Date.now() - 15 * 3600 * 1000),
      submittedAt: new Date(Date.now() - 14.5 * 3600 * 1000),
      timeTakenSeconds: 890,
      reviewerNotes: 'Flawless grasp of university patent disclosure protocols.',
      reviewedBy: admin._id,
      reviewedAt: new Date(Date.now() - 10 * 3600 * 1000),
    },
  ]);

  console.log('\n✅ Seed complete!\n');
};

const runStandalone = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI;
  if (!uri) { console.error('❌ MONGO_URI not set in .env'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB\n');
  await seedData();
  await mongoose.disconnect();
  process.exit(0);
};

if (require.main === module || process.argv[1]?.includes('seed')) {
  runStandalone().catch(err => { console.error(err); process.exit(1); });
}

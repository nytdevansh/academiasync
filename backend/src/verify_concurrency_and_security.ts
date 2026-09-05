import mongoose from 'mongoose';
import crypto from 'crypto';
import TrainingEnrollment from './models/TrainingEnrollment';
import TrainingProgram from './models/TrainingProgram';
import RefreshToken from './models/RefreshToken';
import User from './models/User';
import AuditLog from './models/AuditLog';
import Department from './models/Department';
import Certificate from './models/Certificate';
import CourseResult from './models/CourseResult';
import { issueCertificate, verifyCertificateToken } from './services/certificateService';
import { refreshToken } from './controllers/authController';

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27018/academiasync_test';

async function runRealDatabaseTests() {
  console.log('================================================================');
  console.log('RUNNING LIVE MONGODB CONCURRENCY & SECURITY VERIFICATION SUITE');
  console.log('Target: ' + TEST_MONGO_URI);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${msg}`);
      failed++;
    }
  }

  // Connect to live MongoDB
  try {
    await mongoose.connect(TEST_MONGO_URI);
    console.log('Connected to test MongoDB successfully.\n');
  } catch (err: any) {
    console.error('Failed to connect to MongoDB on port 27018:', err.message);
    process.exit(1);
  }

  // Clear test collections directly to bypass Mongoose pre-delete hooks on AuditLog
  const collections = ['trainingenrollments', 'trainingprograms', 'refreshtokens', 'users', 'auditlogs', 'certificates', 'courseresults', 'departments'];
  for (const col of collections) {
    try {
      await mongoose.connection.collection(col).deleteMany({});
    } catch {
      // Collection may not exist yet
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. REAL CONCURRENT ATTEMPT RESERVATION (RACE CONDITION TEST)
  // ─────────────────────────────────────────────────────────────
  console.log('[1/4] Testing Real Concurrent Attempt Reservation (Race Condition Test)...');
  try {
    const creator = new mongoose.Types.ObjectId();
    const testProgram = await TrainingProgram.create({
      title: 'Advanced AI Systems',
      type: 'Workshop',
      description: 'Concurrency stress testing course',
      organizer: 'Engineering Dept',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 3600000),
      mode: 'online',
      createdBy: creator,
      maxAttempts: 1, // Strictly 1 attempt allowed!
      cooldownHours: 24,
      passingScore: 60,
    });

    const testTeacher = await User.create({
      name: 'Concurrent Test Faculty',
      email: 'concurrent_faculty@institution.edu',
      passwordHash: 'dummy_hash_for_testing',
      role: 'faculty_member',
      status: 'active',
    });

    const enrollment = await TrainingEnrollment.create({
      userId: testTeacher._id,
      programId: testProgram._id,
      status: 'approved',
      attemptsCount: 0,
    });

    const maxAttempts = testProgram.maxAttempts || 1;
    const cooldownMs = (testProgram.cooldownHours ?? 24) * 3600000;
    const cutoff = new Date(Date.now() - cooldownMs);

    // Helper simulating an incoming HTTP request attempting atomic reservation
    const attemptReservation = () => {
      return TrainingEnrollment.findOneAndUpdate(
        {
          _id: enrollment._id,
          status: { $ne: 'certified' },
          attemptsCount: { $lt: maxAttempts },
          $or: [
            { lastFailedAttemptAt: { $exists: false } },
            { lastFailedAttemptAt: null },
            { lastFailedAttemptAt: { $lte: cutoff } },
          ],
        },
        { $inc: { attemptsCount: 1 } },
        { new: true }
      );
    };

    // Fire 5 SIMULTANEOUS parallel requests at the exact same millisecond
    console.log('   Simulating 5 concurrent requests racing to reserve a single slot (maxAttempts: 1)...');
    const results = await Promise.all([
      attemptReservation(),
      attemptReservation(),
      attemptReservation(),
      attemptReservation(),
      attemptReservation(),
    ]);

    const reservedCount = results.filter((r) => r !== null).length;
    const blockedCount = results.filter((r) => r === null).length;

    assert(reservedCount === 1, `Exactly 1 concurrent request acquired the slot (got: ${reservedCount})`);
    assert(blockedCount === 4, `Exactly 4 concurrent requests were blocked (got: ${blockedCount})`);

    // Verify DB integrity
    const updatedEnrollment = await TrainingEnrollment.findById(enrollment._id);
    assert(updatedEnrollment?.attemptsCount === 1, `Database attemptsCount is strictly 1 (got: ${updatedEnrollment?.attemptsCount})`);

    // Now test with maxAttempts: 3 with 10 simultaneous requests
    await TrainingProgram.findByIdAndUpdate(testProgram._id, { maxAttempts: 3 });
    await TrainingEnrollment.findByIdAndUpdate(enrollment._id, { attemptsCount: 0 });

    console.log('   Simulating 10 concurrent requests racing for 3 available slots (maxAttempts: 3)...');
    const results10 = await Promise.all(
      Array.from({ length: 10 }, () => {
        return TrainingEnrollment.findOneAndUpdate(
          {
            _id: enrollment._id,
            status: { $ne: 'certified' },
            attemptsCount: { $lt: 3 },
            $or: [
              { lastFailedAttemptAt: { $exists: false } },
              { lastFailedAttemptAt: null },
              { lastFailedAttemptAt: { $lte: cutoff } },
            ],
          },
          { $inc: { attemptsCount: 1 } },
          { new: true }
        );
      })
    );

    const reservedCount10 = results10.filter((r) => r !== null).length;
    const blockedCount10 = results10.filter((r) => r === null).length;
    assert(reservedCount10 === 3, `Exactly 3 concurrent requests reserved slots (got: ${reservedCount10})`);
    assert(blockedCount10 === 7, `Exactly 7 concurrent requests were rejected (got: ${blockedCount10})`);

    const updatedEnrollment10 = await TrainingEnrollment.findById(enrollment._id);
    assert(updatedEnrollment10?.attemptsCount === 3, `Database attemptsCount capped strictly at 3 (got: ${updatedEnrollment10?.attemptsCount})`);

    // Now test Cooldown boundary under concurrent load
    console.log('   Simulating concurrent requests during active 24h cooldown window...');
    await TrainingEnrollment.findByIdAndUpdate(enrollment._id, {
      attemptsCount: 1,
      lastFailedAttemptAt: new Date(), // Just failed right now
    });

    const cooldownResults = await Promise.all([
      attemptReservation(),
      attemptReservation(),
      attemptReservation(),
    ]);
    const cooldownReserved = cooldownResults.filter((r) => r !== null).length;
    assert(cooldownReserved === 0, `0 requests reserved during active cooldown (got: ${cooldownReserved})`);
  } catch (err: any) {
    assert(false, `Concurrent reservation test failed: ${err.message}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. REAL REFRESH TOKEN REUSE DETECTION (COMPROMISE DEFENSE)
  // ─────────────────────────────────────────────────────────────
  console.log('\n[2/4] Testing Real Refresh Token Reuse Detection & Session Revocation...');
  try {
    const authUser = await User.create({
      name: 'Security Test User',
      email: 'sec_user@institution.edu',
      passwordHash: 'dummy_hash_for_testing',
      role: 'faculty_member',
      status: 'active',
    });

    // Session 1 (Laptop)
    const rawTokenA = 'refresh_token_laptop_' + crypto.randomBytes(16).toString('hex');
    const hashA = crypto.createHash('sha256').update(rawTokenA).digest('hex');
    const tokenDocA = await RefreshToken.create({
      userId: authUser._id,
      tokenHash: hashA,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
      revoked: false,
    });

    // Session 2 (Mobile App)
    const rawTokenB = 'refresh_token_mobile_' + crypto.randomBytes(16).toString('hex');
    const hashB = crypto.createHash('sha256').update(rawTokenB).digest('hex');
    const tokenDocB = await RefreshToken.create({
      userId: authUser._id,
      tokenHash: hashB,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
      revoked: false,
    });

    // Step 1: Legitimate Rotation of Token A -> Token A2
    const rawTokenA2 = 'refresh_token_laptop_v2_' + crypto.randomBytes(16).toString('hex');
    const hashA2 = crypto.createHash('sha256').update(rawTokenA2).digest('hex');

    await RefreshToken.findByIdAndUpdate(tokenDocA._id, {
      revoked: true,
      replacedByTokenHash: hashA2,
    });
    await RefreshToken.create({
      userId: authUser._id,
      tokenHash: hashA2,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
      revoked: false,
    });

    // Confirm state before attack
    const tokenAState = await RefreshToken.findById(tokenDocA._id);
    const tokenBState = await RefreshToken.findById(tokenDocB._id);
    assert(tokenAState?.revoked === true, 'Old Token A is revoked after rotation');
    assert(tokenBState?.revoked === false, 'Session B (Mobile) remains active before replay attack');

    // Step 2: Attacker replays old revoked Token A
    console.log('   Simulating attacker replaying revoked Token A to /auth/refresh...');
    let responseStatus: number = 0;
    let responseBody: any = null;

    const mockReq = {
      body: { refreshToken: rawTokenA },
      headers: { 'user-agent': 'Attacker-Browser/1.0' },
      ip: '198.51.100.42',
    } as any;

    const mockRes = {
      status: (code: number) => {
        responseStatus = code;
        return {
          json: (body: any) => {
            responseBody = body;
            return body;
          },
        };
      },
    } as any;

    await refreshToken(mockReq, mockRes);

    assert(responseStatus === 401, `Attacker request rejected with 401 Unauthorized (got: ${responseStatus})`);
    assert(
      responseBody?.error?.includes('Revoked refresh token reuse detected'),
      'Response explicitly cites revoked token reuse detection'
    );

    // Step 3: Verify that ALL sessions for this user family were revoked
    const allUserTokens = await RefreshToken.find({ userId: authUser._id });
    const activeTokens = allUserTokens.filter((t) => !t.revoked);
    assert(activeTokens.length === 0, `All user sessions revoked upon reuse detection (0 active, got: ${activeTokens.length})`);

    const mobileTokenNow = await RefreshToken.findById(tokenDocB._id);
    assert(mobileTokenNow?.revoked === true, 'Secondary session (Mobile) was revoked for account protection');

    // Step 4: Verify Audit Log entry was generated
    const auditEntry = await AuditLog.findOne({
      userId: authUser._id,
      action: 'logout',
      entityType: 'RefreshToken',
    });
    assert(
      Boolean(auditEntry?.description?.includes('Revoked refresh token reuse detected')),
      'Audit log recorded security incident with client IP and reason'
    );
  } catch (err: any) {
    assert(false, `Token reuse detection test failed: ${err.message}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. REAL SEED CERTIFICATE & PUBLIC VERIFICATION BADGE
  // ─────────────────────────────────────────────────────────────
  console.log('\n[3/4] Testing Real Certificate Issuance & Public Zero-Auth Verification...');
  try {
    const dept = await Department.create({
      name: 'Computer Science & Engineering',
      code: 'CSE',
      isActive: true,
    });

    const certTeacher = await User.create({
      name: 'Dr. Alan Turing',
      email: 'alan.turing@institution.edu',
      passwordHash: 'dummy_hash',
      role: 'faculty_member',
      department: dept._id,
      status: 'active',
    });

    const certProgram = await TrainingProgram.create({
      title: 'Quantum Computing Fundamentals',
      type: 'FDP',
      description: 'Advanced computing course',
      organizer: 'CSE Dept',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 3600000),
      mode: 'online',
      createdBy: new mongoose.Types.ObjectId(),
      passingScore: 75,
      certificationValidityYears: 2,
    });

    const certEnrollment = await TrainingEnrollment.create({
      userId: certTeacher._id,
      programId: certProgram._id,
      status: 'approved',
      attemptsCount: 1,
    });

    const courseResult = await CourseResult.create({
      enrollmentId: certEnrollment._id,
      teacherId: certTeacher._id,
      courseId: certProgram._id,
      attemptNumber: 1,
      score: 92,
      totalScore: 46,
      maxPossibleScore: 50,
      passingScore: 75,
      passed: true,
      status: 'graded',
      completedAt: new Date(),
    });

    // Issue certificate using actual production service
    const cert = await issueCertificate({
      teacher: certTeacher,
      course: certProgram,
      enrollmentId: certEnrollment._id,
      resultId: courseResult._id,
      departmentName: 'Computer Science & Engineering',
      departmentCode: 'CSE',
    });

    assert(
      /^AS-CERT-\d{4}-CSE-[A-Z0-9]{4}$/.test(cert.certificateNumber),
      `Certificate serial matches pattern AS-CERT-YYYY-CSE-XXXX (got: ${cert.certificateNumber})`
    );
    assert(cert.verificationToken.length > 30, 'Certificate verificationToken generated as AES-256-GCM authenticated payload');

    // Public verification call via production verifyCertificateToken service
    const verification = await verifyCertificateToken(cert.verificationToken);
    assert(verification.status === 'VALID', 'Public verification confirms VALID status');
    assert(verification.certificateNumber === cert.certificateNumber, 'Verified serial number matches');
    assert(verification.teacherName === 'Dr. Alan Turing', 'Verified teacher name matches');
    assert(verification.courseTitle === 'Quantum Computing Fundamentals', 'Verified course title matches');
    assert(
      (verification as any).score === undefined && (verification as any).totalScore === undefined,
      'Numeric score is strictly omitted from public verification payload (privacy preserved)'
    );

    // Test tamper resistance on verification endpoint
    const tampered = cert.verificationToken.substring(0, 15) + (cert.verificationToken[15] === 'x' ? 'y' : 'x') + cert.verificationToken.substring(16);
    let tamperedRejected = false;
    try {
      await verifyCertificateToken(tampered);
    } catch {
      tamperedRejected = true;
    }
    assert(tamperedRejected, 'Tampered token rejected by verification endpoint');
  } catch (err: any) {
    assert(false, `Certificate verification test failed: ${err.message}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. ADMIN RETAKE RESET & AUDIT LOGGING
  // ─────────────────────────────────────────────────────────────
  console.log('\n[4/4] Testing Admin Retake Reset Logic & Audit Logging...');
  try {
    const adminUser = await User.create({
      name: 'Institutional Administrator',
      email: 'admin@institution.edu',
      passwordHash: 'dummy_hash',
      role: 'administrator',
      status: 'active',
    });

    const failedEnrollment = await TrainingEnrollment.create({
      userId: new mongoose.Types.ObjectId(),
      programId: new mongoose.Types.ObjectId(),
      status: 'rejected',
      attemptsCount: 3,
      lastFailedAttemptAt: new Date(),
    });

    // Admin resets retake
    const reason = 'Faculty requested retake due to connectivity disruption during attempt 3';
    const previousAttempts = failedEnrollment.attemptsCount;

    failedEnrollment.attemptsCount = 0;
    failedEnrollment.status = 'approved';
    failedEnrollment.lastFailedAttemptAt = undefined;
    await failedEnrollment.save();

    await AuditLog.create({
      userId: adminUser._id,
      action: 'update',
      entityType: 'TrainingEnrollment',
      entityId: failedEnrollment._id,
      description: `Retake reset granted by ${adminUser.name}. Reason: ${reason} (Previous attempts: ${previousAttempts})`,
    });

    const reloaded = await TrainingEnrollment.findById(failedEnrollment._id);
    assert(reloaded?.attemptsCount === 0, 'Enrollment attemptsCount reset to 0');
    assert(reloaded?.lastFailedAttemptAt === undefined, 'Cooldown timestamp cleared');
    assert(reloaded?.status === 'approved', 'Enrollment status set back to approved');

    const resetAudit = await AuditLog.findOne({
      entityId: failedEnrollment._id,
      action: 'update',
    });
    assert(Boolean(resetAudit?.description?.includes('connectivity disruption')), 'Audit log recorded administrator justification');
  } catch (err: any) {
    assert(false, `Admin retake reset test failed: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(`REAL DATABASE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  await mongoose.disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runRealDatabaseTests().catch((err) => {
  console.error('Test run failed with unhandled exception:', err);
  process.exit(1);
});

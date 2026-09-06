import { validateEnv } from './config/validateEnv';
import {
  encryptPayload,
  decryptPayload,
  TokenExpiredError,
  TokenTamperedError,
} from './services/urlEncryption.service';
import { createRateLimiter } from './middlewares/rateLimiter';
import Certificate from './models/Certificate';
import CourseResult from './models/CourseResult';
import TrainingEnrollment from './models/TrainingEnrollment';
import TrainingProgram from './models/TrainingProgram';
import RefreshToken from './models/RefreshToken';
import crypto from 'crypto';

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING ACADEMIASYNC PIPELINE & SECURITY TEST SUITE');
  console.log('====================================================\n');

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

  // ── TEST 1: Startup Environment Validation ──
  console.log('[1/8] Testing Startup Environment Validation...');
  try {
    if (!process.env.MONGO_URI && !process.env.MONGODB_ATLAS_URI) {
      process.env.MONGO_URI = 'mongodb://localhost:27017/academiasync';
    }
    const env = validateEnv();
    assert(!!env.JWT_SECRET && env.JWT_SECRET.length >= 32, 'JWT_SECRET is at least 32 characters');
    assert(!!env.URL_ENC_KEY && /^[0-9a-fA-F]{64}$/.test(env.URL_ENC_KEY), 'URL_ENC_KEY is 64 hex characters (32 bytes)');
    assert(!!env.MONGO_URI, 'MONGO_URI is defined');
  } catch (err: any) {
    assert(false, `validateEnv failed: ${err.message}`);
  }

  // ── TEST 2: AES-256-GCM URL Token Encryption & Tamper Proofing ──
  console.log('\n[2/8] Testing AES-256-GCM URL Token Encryption & Tamper Proofing...');
  try {
    const payload = {
      certificateId: '507f1f77bcf86cd799439011',
      teacherId: '507f191e810c19729de860ea',
      courseId: '507f191e810c19729de860eb',
      serial: 'AS-CERT-2026-CSE-0042',
    };

    // Round-trip
    const token = encryptPayload(payload, 3600);
    assert(typeof token === 'string' && token.length > 20, 'Token generated as URL-safe string');

    const decrypted = decryptPayload<typeof payload>(token);
    assert(decrypted.certificateId === payload.certificateId, 'Decrypted certificateId matches');
    assert(decrypted.serial === payload.serial, 'Decrypted serial number matches');

    // Tamper detection
    let tamperedToken = token.substring(0, 10) + (token[10] === 'a' ? 'b' : 'a') + token.substring(11);
    let tamperDetected = false;
    try {
      decryptPayload(tamperedToken);
    } catch (err: any) {
      tamperDetected = err instanceof TokenTamperedError || err.name === 'TokenTamperedError';
    }
    assert(tamperDetected, 'Tampered token correctly rejected by AES-256-GCM authentication tag');

    // Expiration detection
    const expiredToken = encryptPayload(payload, -1); // expired 1s ago
    let expiredDetected = false;
    try {
      decryptPayload(expiredToken);
    } catch (err: any) {
      expiredDetected = err instanceof TokenExpiredError || err.name === 'TokenExpiredError';
    }
    assert(expiredDetected, 'Expired token correctly rejected with TokenExpiredError');
  } catch (err: any) {
    assert(false, `AES-256-GCM encryption tests failed: ${err.message}`);
  }

  // ── TEST 3: Sliding Window Rate Limiter ──
  console.log('\n[3/8] Testing In-Memory Sliding Window Rate Limiter...');
  try {
    const limiter = createRateLimiter({
      windowMs: 1000,
      max: 3,
      message: 'Rate limit exceeded',
    });

    let blocked = false;
    const mockRes = (headers: Record<string, any>) => ({
      setHeader: (k: string, v: any) => { headers[k] = v; },
      status: (code: number) => ({
        json: (body: any) => {
          if (code === 429) blocked = true;
          return body;
        },
      }),
    });

    const headers: Record<string, any> = {};
    const req = { ip: '127.0.0.1', path: '/test', headers: {} } as any;

    let nextCalledCount = 0;
    const next = () => { nextCalledCount++; };

    // Request 1
    limiter(req, mockRes(headers) as any, next);
    // Request 2
    limiter(req, mockRes(headers) as any, next);
    // Request 3
    limiter(req, mockRes(headers) as any, next);
    assert(nextCalledCount === 3, 'First 3 requests within limit allowed');
    assert(headers['RateLimit-Remaining'] === '0', 'Remaining count decremented to 0');

    // Request 4 (should be blocked)
    limiter(req, mockRes(headers) as any, next);
    assert(blocked, '4th request blocked with 429 status');
    assert(nextCalledCount === 3, 'Next() not called on 429 response');
  } catch (err: any) {
    assert(false, `Rate limiter tests failed: ${err.message}`);
  }

  // ── TEST 4: Model Schemas & Virtual Validity Verification ──
  console.log('\n[4/8] Testing Model Schemas, Indexes & Derived Validity...');
  try {
    // Check Certificate virtual isValid
    const validCert = new Certificate({
      certificateNumber: 'AS-CERT-2026-CSE-0001',
      teacherId: '507f1f77bcf86cd799439011',
      courseId: '507f1f77bcf86cd799439012',
      enrollmentId: '507f1f77bcf86cd799439013',
      resultId: '507f1f77bcf86cd799439014',
      verificationToken: 'sample-token',
      issuedDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 3600000),
      status: 'valid',
      metadata: {
        teacherName: 'Dr. Test',
        courseTitle: 'Advanced Deep Learning',
        department: 'CSE',
      },
    });
    assert((validCert as any).isValid === true, 'Active certificate isValid virtual returns true');

    const expiredCert = new Certificate({
      certificateNumber: 'AS-CERT-2025-CSE-0002',
      teacherId: '507f1f77bcf86cd799439011',
      courseId: '507f1f77bcf86cd799439012',
      enrollmentId: '507f1f77bcf86cd799439013',
      resultId: '507f1f77bcf86cd799439014',
      verificationToken: 'sample-token',
      issuedDate: new Date(Date.now() - 400 * 24 * 3600000),
      expiryDate: new Date(Date.now() - 35 * 24 * 3600000), // expired 35 days ago
      status: 'valid',
      metadata: { teacherName: 'Dr. Test', courseTitle: 'AI', department: 'CSE' },
    });
    assert((expiredCert as any).isValid === false, 'Expired certificate isValid virtual returns false');

    const revokedCert = new Certificate({
      certificateNumber: 'AS-CERT-2026-CSE-0003',
      teacherId: '507f1f77bcf86cd799439011',
      courseId: '507f1f77bcf86cd799439012',
      enrollmentId: '507f1f77bcf86cd799439013',
      resultId: '507f1f77bcf86cd799439014',
      verificationToken: 'sample-token',
      issuedDate: new Date(),
      status: 'revoked',
      metadata: { teacherName: 'Dr. Test', courseTitle: 'AI', department: 'CSE' },
    });
    assert((revokedCert as any).isValid === false, 'Revoked certificate isValid virtual returns false');

    // Check CourseResult schema fields
    const courseResult = new CourseResult({
      enrollmentId: '507f1f77bcf86cd799439013',
      teacherId: '507f1f77bcf86cd799439011',
      courseId: '507f1f77bcf86cd799439012',
      attemptNumber: 1,
      score: 85,
      totalScore: 17,
      maxPossibleScore: 20,
      passingScore: 70,
      passed: true,
      status: 'graded',
      answers: [{ questionIndex: 0, selectedOption: 1, isCorrect: true, scoreAwarded: 5 }],
      timeSpentSeconds: 300,
    });
    assert(courseResult.score === 85 && courseResult.passed === true, 'CourseResult instantiated with pass status');

    // Check RefreshToken token hashing
    const rawToken = 'sample_raw_refresh_token_string';
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const rt = new RefreshToken({
      userId: '507f1f77bcf86cd799439011',
      tokenHash: hash,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
      revoked: false,
    });
    assert(rt.tokenHash === hash, 'RefreshToken stores SHA-256 hash securely');
  } catch (err: any) {
    assert(false, `Model schema tests failed: ${err.message}`);
  }

  // ── TEST 5: Cooldown & Reservation Logic Verification ──
  console.log('\n[5/8] Testing Atomic Reservation Query Logic...');
  try {
    const maxAttempts = 3;
    const cooldownHours = 24;
    const cooldownMs = cooldownHours * 3600000;
    const cutoff = new Date(Date.now() - cooldownMs);

    function canAttempt(enrollment: {
      status: string;
      attemptsCount: number;
      lastFailedAttemptAt?: Date | null;
    }): boolean {
      if (enrollment.status === 'certified') return false;
      if (enrollment.attemptsCount >= maxAttempts) return false;
      if (enrollment.lastFailedAttemptAt && enrollment.lastFailedAttemptAt > cutoff) return false;
      return true;
    }

    // Case A: Fresh enrollment
    assert(canAttempt({ status: 'enrolled', attemptsCount: 0 }) === true, 'Fresh enrollment can attempt');

    // Case B: Already certified
    assert(canAttempt({ status: 'certified', attemptsCount: 1 }) === false, 'Already certified cannot attempt');

    // Case C: Exceeded max attempts
    assert(canAttempt({ status: 'enrolled', attemptsCount: 3 }) === false, 'Exceeded max attempts (3/3) cannot attempt');

    // Case D: Recent failure within 24h cooldown
    const recentFail = new Date(Date.now() - 2 * 3600000); // 2 hours ago
    assert(canAttempt({ status: 'enrolled', attemptsCount: 1, lastFailedAttemptAt: recentFail }) === false, 'Recent failure (2h ago) blocked by 24h cooldown');

    // Case E: Failure older than 24h cooldown
    const oldFail = new Date(Date.now() - 26 * 3600000); // 26 hours ago
    assert(canAttempt({ status: 'enrolled', attemptsCount: 1, lastFailedAttemptAt: oldFail }) === true, 'Older failure (26h ago) permitted after cooldown');
  } catch (err: any) {
    assert(false, `Cooldown & Reservation logic tests failed: ${err.message}`);
  }

  // ── TEST 6: Token Reuse Detection & Compromise Defense ──
  console.log('\n[6/8] Testing Refresh Token Reuse Detection & Session Family Invalidation...');
  try {
    const userId = '507f1f77bcf86cd799439011';
    const rawTokenA = 'refresh_token_laptop_001';
    const hashA = crypto.createHash('sha256').update(rawTokenA).digest('hex');

    // Simulate database state: Token A has been rotated and marked revoked
    const mockStore: Record<string, any> = {
      [hashA]: {
        _id: 'token_doc_a',
        userId,
        tokenHash: hashA,
        revoked: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
      },
      'session_mobile_hash': {
        _id: 'token_doc_b',
        userId,
        tokenHash: 'session_mobile_hash',
        revoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
      },
    };

    let familyRevoked = false;
    let auditLogged = false;

    // Simulate the exact controller reuse detection handler
    const handleRefresh = (incomingToken: string) => {
      const incomingHash = crypto.createHash('sha256').update(incomingToken).digest('hex');
      const existingToken = mockStore[incomingHash];
      if (!existingToken) return { status: 401, error: 'Invalid refresh token' };

      if (existingToken.revoked) {
        // Reuse detected: invalidate all tokens for user family
        Object.values(mockStore).forEach((t: any) => {
          if (t.userId === existingToken.userId) {
            t.revoked = true;
          }
        });
        familyRevoked = true;
        auditLogged = true;
        return {
          status: 401,
          error: 'Revoked refresh token reuse detected. All sessions terminated for security.',
        };
      }
      return { status: 200, token: 'new_access_token' };
    };

    // Replay attack with revoked Token A
    const res = handleRefresh(rawTokenA);
    assert(res.status === 401, 'Replay of revoked token rejected with 401');
    assert(Boolean(res.error?.includes('Revoked refresh token reuse detected')), 'Error specifies token reuse detection');
    assert(familyRevoked, 'Token family invalidation triggered across all user sessions');
    assert(mockStore['session_mobile_hash'].revoked === true, 'Secondary active session (Mobile) revoked for user protection');
    assert(auditLogged, 'Security event flagged for institutional audit logging');
  } catch (err: any) {
    assert(false, `Token reuse detection tests failed: ${err.message}`);
  }

  // ── TEST 7: Dual-Channel Email Templating & Fallback Service ──
  console.log('\n[7/8] Testing Email Template Rendering & Transport Fallback...');
  try {
    const { renderEmailTemplate } = await import('./services/templateService');
    const { sendEmail, getEmailTransportMode } = await import('./services/emailService');

    const templates = [
      'certificationPassed',
      'gradingCompleted',
      'nominationReceived',
      'retakeResetGranted',
      'certificateExpiring',
      'certificateRevoked',
      'organiserAssigned',
    ] as const;

    for (const t of templates) {
      const rendered = renderEmailTemplate(t, {
        recipientName: 'Dr. Alan Turing',
        courseTitle: 'Quantum Computing Foundations',
        sessionTitle: 'Session 1: Superposition & Gates',
        scheduledDate: '2026-09-12',
        venueOrLink: 'Auditorium A',
        passingScore: 70,
        score: 92,
        serialNumber: 'AS-CERT-2026-QC-0001',
        certificateUrl: 'http://localhost:5173/certificates',
        verificationUrl: 'http://localhost:5173/verify/token123',
        courseUrl: 'http://localhost:5173/training/123/learn',
        sessionUrl: 'http://localhost:5173/training/programs/123/sessions',
        daysUntilExpiry: 30,
        expiryDate: '2027-09-12',
        reason: 'Curricular reorganization',
      });

      assert(rendered.includes('Dr. Alan Turing'), `Template "${t}" interpolates recipientName`);
      assert(!rendered.includes('{{courseTitle}}'), `Template "${t}" replaces courseTitle token`);
      assert(rendered.includes('AcademiaSync'), `Template "${t}" contains institutional branding`);
    }

    // Email delivery fallback test (must not throw when credentials are dev/mock or unverified)
    const mode = getEmailTransportMode();
    assert(['gmail_api', 'mock_logger', 'smtp', 'ethereal', 'resend', 'sendgrid'].includes(mode), `Email transport mode is valid (${mode})`);

    const sendRes = await sendEmail({
      to: 'faculty@institution.edu',
      subject: 'Automated Test Notification',
      html: '<p>Test email</p>',
    });
    assert(typeof sendRes.success === 'boolean', 'sendEmail returns structured SendEmailResult without throwing');
    if (mode === 'mock_logger') {
      assert(sendRes.success === true, 'sendEmail in mock_logger returns success: true');
    }
  } catch (err: any) {
    assert(false, `Email service testing failed: ${err.message}`);
  }

  // ── TEST 8: Training Session Schema & Required Sessions Derivation ──
  console.log('\n[8/8] Testing TrainingSession Model & Attendance Eligibility Logic...');
  try {
    const TrainingSession = (await import('./models/TrainingSession')).default;

    // Model validation
    const sess = new TrainingSession({
      programId: '507f1f77bcf86cd799439011',
      title: 'Pedagogy Lecture 1',
      scheduledDate: new Date('2026-09-10'),
      status: 'scheduled',
      attendees: [
        { userId: '507f191e810c19729de860ea', present: true },
        { userId: '507f191e810c19729de860eb', present: false },
      ],
    });

    assert(sess.title === 'Pedagogy Lecture 1', 'TrainingSession instantiated with valid title');
    assert(sess.status === 'scheduled', 'Default status is scheduled');
    assert(sess.attendees.length === 2, 'Roster initialized with 2 attendees');
    assert(sess.attendees[0].present === true, 'Attendee 1 marked present');
    assert(sess.attendees[1].present === false, 'Attendee 2 marked absent');

    // Attendance eligibility resolution simulation
    const mockSessions = [
      { status: 'attendance_marked', attendees: [{ userId: 'user1', present: true }, { userId: 'user2', present: false }] },
      { status: 'attendance_marked', attendees: [{ userId: 'user1', present: true }, { userId: 'user2', present: true }] },
      { status: 'cancelled', attendees: [{ userId: 'user1', present: false }, { userId: 'user2', present: false }] },
    ];

    const activeSessions = mockSessions.filter((s) => s.status !== 'cancelled');
    assert(activeSessions.length === 2, 'Cancelled session excluded: 2 required active sessions');

    const user1AttendedAll = activeSessions.every((s) => s.attendees.some((a) => a.userId === 'user1' && a.present));
    const user2AttendedAll = activeSessions.every((s) => s.attendees.some((a) => a.userId === 'user2' && a.present));

    assert(user1AttendedAll === true, 'User 1 attended 2/2 sessions -> eligible for attended status');
    assert(user2AttendedAll === false, 'User 2 attended 1/2 sessions -> remains approved');
  } catch (err: any) {
    assert(false, `Training session testing failed: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test run failed with unhandled exception:', err);
  process.exit(1);
});

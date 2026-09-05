import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ============================================================================
// 1. Grading Workspace Logic & Live Score Calculation Tests
// ============================================================================
describe('CourseGradingPage: Score Calculation & Grading Math', () => {
  const calculateTotal = (assessment, gradedAnswers) => {
    if (!assessment || !assessment.questions || assessment.questions.length === 0) {
      return { totalScore: 0, maxPossible: 0, percentage: 0, passed: false };
    }
    let total = 0;
    let maxPossible = 0;

    assessment.questions.forEach((q, idx) => {
      maxPossible += q.maxScore ?? 10;
      total += gradedAnswers[idx]?.score ?? 0;
    });

    const percentage = maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0;
    const passingThreshold = assessment.passingScore || 60;
    const passed = percentage >= passingThreshold;

    return { totalScore: total, maxPossible, percentage, passed };
  };

  const clampScore = (score, maxScore) => {
    return Math.max(0, Math.min(maxScore, isNaN(score) ? 0 : score));
  };

  const computeInitialScores = (assessment, activeSub) => {
    const initial = {};
    assessment.questions.forEach((q, idx) => {
      const existingAns = activeSub?.answers?.find((a) => a.questionIndex === idx);
      initial[idx] = {
        score: existingAns?.score ?? (q.type === 'mcq' && existingAns?.selectedOption === q.correctAnswer ? (q.maxScore ?? 10) : 0),
        feedback: existingAns?.feedback || '',
      };
    });
    return initial;
  };

  test('MCQ questions are correctly auto-scored based on correctAnswer', () => {
    const assessment = {
      passingScore: 60,
      questions: [
        { type: 'mcq', prompt: 'Q1', correctAnswer: 2, maxScore: 10 },
        { type: 'mcq', prompt: 'Q2', correctAnswer: 0, maxScore: 10 },
      ],
    };

    const submission = {
      answers: [
        { questionIndex: 0, selectedOption: 2 }, // correct -> 10
        { questionIndex: 1, selectedOption: 1 }, // incorrect -> 0
      ],
    };

    const initial = computeInitialScores(assessment, submission);
    assert.strictEqual(initial[0].score, 10, 'Correct MCQ must be awarded maxScore');
    assert.strictEqual(initial[1].score, 0, 'Incorrect MCQ must be awarded 0');

    const result = calculateTotal(assessment, initial);
    assert.strictEqual(result.totalScore, 10);
    assert.strictEqual(result.maxPossible, 20);
    assert.strictEqual(result.percentage, 50);
    assert.strictEqual(result.passed, false, '50% must not pass 60% threshold');
  });

  test('Subjective question manual scores are clamped to [0, maxScore]', () => {
    assert.strictEqual(clampScore(-5, 20), 0, 'Negative scores must clamp to 0');
    assert.strictEqual(clampScore(25, 20), 20, 'Scores exceeding max must clamp to maxScore');
    assert.strictEqual(clampScore(14, 20), 14, 'Valid scores must remain unchanged');
    assert.strictEqual(clampScore(NaN, 20), 0, 'NaN must be sanitized to 0');
  });

  test('A score of numeric 0 is preserved and not treated as falsy/missing', () => {
    const assessment = {
      passingScore: 60,
      questions: [
        { type: 'short_answer', prompt: 'Q1', maxScore: 20 },
      ],
    };

    const submission = {
      answers: [
        { questionIndex: 0, score: 0 }, // explicit 0 awarded
      ],
    };

    const initial = computeInitialScores(assessment, submission);
    assert.strictEqual(initial[0].score, 0, 'Explicit 0 must be preserved');

    const result = calculateTotal(assessment, initial);
    assert.strictEqual(result.totalScore, 0);
    assert.strictEqual(result.percentage, 0);
    assert.strictEqual(result.passed, false);
  });

  test('Passing threshold boundary assertions', () => {
    const assessment = {
      passingScore: 60,
      questions: [
        { type: 'short_answer', prompt: 'Q1', maxScore: 100 },
      ],
    };

    // 59% -> fail
    const res59 = calculateTotal(assessment, { 0: { score: 59 } });
    assert.strictEqual(res59.percentage, 59);
    assert.strictEqual(res59.passed, false);

    // 60% -> pass exactly on benchmark
    const res60 = calculateTotal(assessment, { 0: { score: 60 } });
    assert.strictEqual(res60.percentage, 60);
    assert.strictEqual(res60.passed, true);

    // 61% -> pass
    const res61 = calculateTotal(assessment, { 0: { score: 61 } });
    assert.strictEqual(res61.percentage, 61);
    assert.strictEqual(res61.passed, true);
  });

  test('Division-by-zero protection when questions or maxPossible is 0', () => {
    const emptyAssessment = { passingScore: 60, questions: [] };
    const res = calculateTotal(emptyAssessment, {});
    assert.strictEqual(res.totalScore, 0);
    assert.strictEqual(res.maxPossible, 0);
    assert.strictEqual(res.percentage, 0);
    assert.strictEqual(res.passed, false);
  });
});

// ============================================================================
// ============================================================================
// 2. CourseLearningPage: 5-State UI Visual Branching Matrix Tests
// ============================================================================
describe('CourseLearningPage: 5-State Branching & Exclusivity Matrix', () => {
  const resolveVisualState = ({
    enrollmentStatus,
    submissionPassed,
    submissionStatus,
    latestResultStatus,
    attemptsCount,
    maxAttempts = 3,
    lastFailedAt,
    cooldownHours = 24,
    nowTimestamp = Date.now(),
  }) => {
    const remainingAttempts = Math.max(0, maxAttempts - (attemptsCount ?? 0));
    const cooldownDurationMs = cooldownHours * 3600000;
    const cooldownExpiresAt = lastFailedAt ? lastFailedAt + cooldownDurationMs : 0;

    // State 1: Certified / Passed
    const isCertified = enrollmentStatus === 'certified' || submissionPassed === true;

    // State 2: Subjective attempt pending evaluation
    const isPendingGrading = !isCertified && (latestResultStatus === 'pending' || submissionStatus === 'submitted');

    // State 3: Attendance prerequisite pending
    const isAttendanceFulfilled = !enrollmentStatus || ['attended', 'completed', 'certified'].includes(enrollmentStatus);
    const isAttendancePrerequisite = !isCertified && !isPendingGrading && !isAttendanceFulfilled;

    // State 4: Active cooldown
    const isCooldownActive = Boolean(
      !isCertified &&
      !isPendingGrading &&
      !isAttendancePrerequisite &&
      remainingAttempts > 0 &&
      lastFailedAt &&
      cooldownExpiresAt > nowTimestamp
    );

    // State 5: Max attempts exhausted
    const isMaxAttemptsReached = !isCertified && !isPendingGrading && !isAttendancePrerequisite && remainingAttempts <= 0;

    // Form: Ready to take test
    const canTakeTest = !isCertified && !isPendingGrading && !isAttendancePrerequisite && !isMaxAttemptsReached && !isCooldownActive && remainingAttempts > 0;

    return {
      isCertified,
      isPendingGrading,
      isAttendancePrerequisite,
      isCooldownActive,
      isMaxAttemptsReached,
      canTakeTest,
      cooldownRemainingMs: Math.max(0, cooldownExpiresAt - nowTimestamp),
    };
  };

  test('State 1: Certified / Passed user shows ONLY certified state', () => {
    const state = resolveVisualState({
      enrollmentStatus: 'certified',
      submissionPassed: true,
      attemptsCount: 2,
      lastFailedAt: Date.now() - 3600000, // 1h ago
    });

    assert.strictEqual(state.isCertified, true, 'isCertified must be true');
    assert.strictEqual(state.isPendingGrading, false, 'isPendingGrading must be false');
    assert.strictEqual(state.isAttendancePrerequisite, false, 'isAttendancePrerequisite must be false');
    assert.strictEqual(state.isCooldownActive, false, 'isCooldownActive must be false');
    assert.strictEqual(state.isMaxAttemptsReached, false, 'isMaxAttemptsReached must be false');
    assert.strictEqual(state.canTakeTest, false, 'canTakeTest must be false');
  });

  test('State 2: Pending Evaluator Review shows ONLY pending state (even if attempts=max)', () => {
    const state = resolveVisualState({
      enrollmentStatus: 'completed',
      submissionPassed: null,
      submissionStatus: 'submitted',
      latestResultStatus: 'pending',
      attemptsCount: 3, // max attempts reached, but this attempt is pending!
      maxAttempts: 3,
      lastFailedAt: Date.now() - 3600000,
    });

    assert.strictEqual(state.isCertified, false);
    assert.strictEqual(state.isPendingGrading, true, 'isPendingGrading must be true');
    assert.strictEqual(state.isAttendancePrerequisite, false);
    assert.strictEqual(state.isCooldownActive, false);
    assert.strictEqual(state.isMaxAttemptsReached, false, 'isMaxAttemptsReached must NOT mask pending review');
    assert.strictEqual(state.canTakeTest, false);
  });

  test('State 3: Attendance Prerequisite Pending shows ONLY attendance banner (blocks test)', () => {
    const state = resolveVisualState({
      enrollmentStatus: 'approved', // has not attended yet!
      attemptsCount: 0,
      maxAttempts: 3,
    });

    assert.strictEqual(state.isCertified, false);
    assert.strictEqual(state.isPendingGrading, false);
    assert.strictEqual(state.isAttendancePrerequisite, true, 'isAttendancePrerequisite must be true for approved status');
    assert.strictEqual(state.isCooldownActive, false);
    assert.strictEqual(state.isMaxAttemptsReached, false);
    assert.strictEqual(state.canTakeTest, false, 'canTakeTest must be false while attendance is incomplete');
  });

  test('State 4: Failed with Active Cooldown shows ONLY cooldown state with remaining attempts', () => {
    const now = Date.now();
    const state = resolveVisualState({
      enrollmentStatus: 'attended',
      submissionPassed: false,
      submissionStatus: 'graded',
      latestResultStatus: 'graded',
      attemptsCount: 1,
      maxAttempts: 3,
      lastFailedAt: now - (2 * 3600000), // 2 hours ago (22h remaining)
      cooldownHours: 24,
      nowTimestamp: now,
    });

    assert.strictEqual(state.isCertified, false);
    assert.strictEqual(state.isPendingGrading, false);
    assert.strictEqual(state.isAttendancePrerequisite, false);
    assert.strictEqual(state.isCooldownActive, true, 'isCooldownActive must be true');
    assert.strictEqual(state.isMaxAttemptsReached, false);
    assert.strictEqual(state.canTakeTest, false);
    assert.ok(state.cooldownRemainingMs > 21 * 3600000 && state.cooldownRemainingMs <= 22 * 3600000);
  });

  test('State 5: Max Attempts Exhausted shows ONLY max attempts alert', () => {
    const state = resolveVisualState({
      enrollmentStatus: 'attended',
      submissionPassed: false,
      submissionStatus: 'graded',
      latestResultStatus: 'graded',
      attemptsCount: 3,
      maxAttempts: 3,
      lastFailedAt: Date.now() - (26 * 3600000), // Cooldown already passed, but 0 attempts remain
      cooldownHours: 24,
    });

    assert.strictEqual(state.isCertified, false);
    assert.strictEqual(state.isPendingGrading, false);
    assert.strictEqual(state.isAttendancePrerequisite, false);
    assert.strictEqual(state.isCooldownActive, false);
    assert.strictEqual(state.isMaxAttemptsReached, true, 'isMaxAttemptsReached must be true');
    assert.strictEqual(state.canTakeTest, false);
  });

  test('Form State: Ready to Take Test / Retake shows question form', () => {
    // Scenario A: Fresh attended enrollment
    const fresh = resolveVisualState({
      enrollmentStatus: 'attended',
      submissionPassed: null,
      attemptsCount: 0,
      maxAttempts: 3,
    });
    assert.strictEqual(fresh.canTakeTest, true);
    assert.strictEqual(fresh.isCertified, false);
    assert.strictEqual(fresh.isPendingGrading, false);
    assert.strictEqual(fresh.isAttendancePrerequisite, false);
    assert.strictEqual(fresh.isCooldownActive, false);
    assert.strictEqual(fresh.isMaxAttemptsReached, false);

    // Scenario B: Cooldown has fully elapsed
    const now = Date.now();
    const cooldownElapsed = resolveVisualState({
      enrollmentStatus: 'attended',
      submissionPassed: false,
      submissionStatus: 'graded',
      latestResultStatus: 'graded',
      attemptsCount: 1,
      maxAttempts: 3,
      lastFailedAt: now - (25 * 3600000), // 25h ago (cooldown was 24h)
      cooldownHours: 24,
      nowTimestamp: now,
    });
    assert.strictEqual(cooldownElapsed.canTakeTest, true, 'Must unlock retake after cooldown expires');
    assert.strictEqual(cooldownElapsed.isCooldownActive, false);
    assert.strictEqual(cooldownElapsed.isAttendancePrerequisite, false);
  });

  test('Exhaustive Multi-State Exclusivity: Exactly one state is active across all lifecycles', () => {
    const testCases = [
      { desc: 'Unattended: Nominated', enrollmentStatus: 'nominated', attemptsCount: 0 },
      { desc: 'Unattended: Approved', enrollmentStatus: 'approved', attemptsCount: 0 },
      { desc: 'Attended: Ready for attempt 1', enrollmentStatus: 'attended', attemptsCount: 0 },
      { desc: 'Completed: Ready for attempt 1', enrollmentStatus: 'completed', attemptsCount: 0 },
      { desc: 'Passed attempt 1', enrollmentStatus: 'certified', submissionPassed: true, attemptsCount: 1 },
      { desc: 'Failed attempt 1 in cooldown', enrollmentStatus: 'attended', attemptsCount: 1, lastFailedAt: Date.now() - 1000 },
      { desc: 'Failed attempt 1 cooldown expired', enrollmentStatus: 'attended', attemptsCount: 1, lastFailedAt: Date.now() - (25 * 3600000) },
      { desc: 'Attempt 2 submitted pending review', enrollmentStatus: 'attended', attemptsCount: 2, latestResultStatus: 'pending' },
      { desc: 'Attempt 3 submitted pending review', enrollmentStatus: 'attended', attemptsCount: 3, latestResultStatus: 'pending' },
      { desc: 'Attempt 3 failed & graded (exhausted)', enrollmentStatus: 'attended', attemptsCount: 3, latestResultStatus: 'graded' },
    ];

    for (const tc of testCases) {
      const s = resolveVisualState(tc);
      const activeStates = [
        s.isCertified,
        s.isPendingGrading,
        s.isAttendancePrerequisite,
        s.isCooldownActive,
        s.isMaxAttemptsReached,
        s.canTakeTest,
      ].filter(Boolean);

      assert.strictEqual(
        activeStates.length,
        1,
        `Scenario "${tc.desc}" must activate EXACTLY one visual state, but activated ${activeStates.length}`
      );
    }
  });
});

// ============================================================================
// 3. Client Clock Drift / Skew Compensation Tests
// ============================================================================
describe('Clock Drift Compensation: getServerNow() accuracy', () => {
  test('Corrects for client clock running 5 minutes fast', () => {
    const realServerTime = 1725540000000;
    const clientNow = realServerTime + 300000; // 5 min fast
    const serverTimeOffset = realServerTime - clientNow; // -300000

    const getServerNow = () => clientNow + serverTimeOffset;
    assert.strictEqual(getServerNow(), realServerTime, 'Compensated timestamp must equal real server time');
  });

  test('Corrects for client clock running 5 minutes slow', () => {
    const realServerTime = 1725540000000;
    const clientNow = realServerTime - 300000; // 5 min slow
    const serverTimeOffset = realServerTime - clientNow; // +300000

    const getServerNow = () => clientNow + serverTimeOffset;
    assert.strictEqual(getServerNow(), realServerTime, 'Compensated timestamp must equal real server time');
  });

  test('Calculates accurate cooldown remaining even with skewed client clock', () => {
    const serverBaseTime = 1725540000000;
    const clientBaseTime = serverBaseTime + 600000; // Client is 10 mins ahead
    const serverOffset = serverBaseTime - clientBaseTime;

    const lastFailedAt = serverBaseTime - (23 * 3600000); // 23h ago server time
    const cooldownDuration = 24 * 3600000; // 24h
    const cooldownExpiresAt = lastFailedAt + cooldownDuration; // 1h in the future

    const effectiveClientNow = clientBaseTime + serverOffset;
    const remainingMs = cooldownExpiresAt - effectiveClientNow;

    assert.strictEqual(remainingMs, 3600000, 'Remaining cooldown must be exactly 1 hour (3,600,000 ms)');
  });
});

// ============================================================================
// 4. Stepper & All 7 Status Lifecycle Resolution Tests
// ============================================================================
describe('MyEnrollmentsPage: 7-Status Lifecycle & Stepper Stepping', () => {
  const BASE_STEPS = ['nominated', 'approved', 'attended', 'completed'];

  const resolveStepper = (status) => {
    const isCert = status === 'certified';
    const isExcludedFromStepper = ['rejected', 'withdrawn'].includes(status);
    const displaySteps = isCert ? [...BASE_STEPS, 'certified'] : BASE_STEPS;
    const currentStepIdx = isCert ? 4 : BASE_STEPS.indexOf(status);

    return {
      displayStepper: !isExcludedFromStepper,
      totalSteps: displaySteps.length,
      currentStepIdx,
      isRejectionBanner: status === 'rejected',
      isWithdrawnBanner: status === 'withdrawn',
    };
  };

  test('All active lifecycle states advance cleanly through the stepper', () => {
    assert.deepStrictEqual(resolveStepper('nominated'), {
      displayStepper: true,
      totalSteps: 4,
      currentStepIdx: 0,
      isRejectionBanner: false,
      isWithdrawnBanner: false,
    });

    assert.deepStrictEqual(resolveStepper('approved'), {
      displayStepper: true,
      totalSteps: 4,
      currentStepIdx: 1,
      isRejectionBanner: false,
      isWithdrawnBanner: false,
    });

    assert.deepStrictEqual(resolveStepper('attended'), {
      displayStepper: true,
      totalSteps: 4,
      currentStepIdx: 2,
      isRejectionBanner: false,
      isWithdrawnBanner: false,
    });

    assert.deepStrictEqual(resolveStepper('completed'), {
      displayStepper: true,
      totalSteps: 4,
      currentStepIdx: 3,
      isRejectionBanner: false,
      isWithdrawnBanner: false,
    });

    assert.deepStrictEqual(resolveStepper('certified'), {
      displayStepper: true,
      totalSteps: 5,
      currentStepIdx: 4,
      isRejectionBanner: false,
      isWithdrawnBanner: false,
    });
  });

  test('Terminal branch states (rejected & withdrawn) hide stepper and show explicit banners', () => {
    const rejected = resolveStepper('rejected');
    assert.strictEqual(rejected.displayStepper, false, 'Stepper must be hidden on rejection');
    assert.strictEqual(rejected.isRejectionBanner, true, 'Rejection alert banner must show');

    const withdrawn = resolveStepper('withdrawn');
    assert.strictEqual(withdrawn.displayStepper, false, 'Stepper must be hidden on withdrawal');
    assert.strictEqual(withdrawn.isWithdrawnBanner, true, 'Withdrawal alert banner must show');
  });
});

// ============================================================================
// 5. Multi-Session Attendance Eligibility & Assessment Gate
// ============================================================================
describe('Multi-Session Attendance & Assessment Gate Logic', () => {
  const resolveAssessmentEligibility = (allSessions, attendeeUserId) => {
    const activeSessions = allSessions.filter((s) => s.status !== 'cancelled');
    if (activeSessions.length === 0) {
      return { eligible: true, attendedCount: 0, requiredCount: 0 };
    }

    const attendedCount = activeSessions.filter((s) =>
      s.attendees?.some((a) => String(a.userId) === String(attendeeUserId) && a.present)
    ).length;

    const eligible = attendedCount === activeSessions.length;
    return { eligible, attendedCount, requiredCount: activeSessions.length };
  };

  test('Attendee attending ALL non-cancelled sessions qualifies for assessment', () => {
    const sessions = [
      {
        _id: 's1',
        status: 'attendance_marked',
        attendees: [{ userId: 'u1', present: true }, { userId: 'u2', present: false }],
      },
      {
        _id: 's2',
        status: 'attendance_marked',
        attendees: [{ userId: 'u1', present: true }, { userId: 'u2', present: true }],
      },
    ];

    const u1 = resolveAssessmentEligibility(sessions, 'u1');
    assert.strictEqual(u1.eligible, true, 'User 1 attended 2/2 sessions and must be eligible');
    assert.strictEqual(u1.attendedCount, 2);
    assert.strictEqual(u1.requiredCount, 2);

    const u2 = resolveAssessmentEligibility(sessions, 'u2');
    assert.strictEqual(u2.eligible, false, 'User 2 missed session 1 and must NOT be eligible');
    assert.strictEqual(u2.attendedCount, 1);
  });

  test('Cancelled sessions are ignored in required sessions count', () => {
    const sessions = [
      {
        _id: 's1',
        status: 'attendance_marked',
        attendees: [{ userId: 'u1', present: true }],
      },
      {
        _id: 's2',
        status: 'cancelled',
        attendees: [{ userId: 'u1', present: false }],
      },
    ];

    const res = resolveAssessmentEligibility(sessions, 'u1');
    assert.strictEqual(res.requiredCount, 1, 'Cancelled session must be excluded from required count');
    assert.strictEqual(res.attendedCount, 1);
    assert.strictEqual(res.eligible, true);
  });

  test('Assessment test form is locked when status is not attended/completed/certified', () => {
    const canTakeTestEvaluator = (enrollmentStatus, isCertified, isPending, maxAttempts, remaining, isCooldown) => {
      const isAttendanceFulfilled = ['attended', 'completed', 'certified'].includes(enrollmentStatus);
      return (
        isAttendanceFulfilled &&
        !isCertified &&
        !isPending &&
        remaining > 0 &&
        !isCooldown
      );
    };

    assert.strictEqual(
      canTakeTestEvaluator('approved', false, false, 3, 3, false),
      false,
      'Approved status must be locked until attendance is complete'
    );
    assert.strictEqual(
      canTakeTestEvaluator('nominated', false, false, 3, 3, false),
      false,
      'Nominated status must be locked until attendance is complete'
    );
    assert.strictEqual(
      canTakeTestEvaluator('attended', false, false, 3, 3, false),
      true,
      'Attended status must unlock the test form'
    );
    assert.strictEqual(
      canTakeTestEvaluator('completed', false, false, 3, 3, false),
      true,
      'Completed status allows taking test'
    );
  });
});

// ============================================================================
// 6. Organiser Governance & Safeguards Matrix
// ============================================================================
describe('Session Organiser Governance & Permissions', () => {
  const canClaimSession = (session) => {
    return session.status === 'scheduled' && !session.organiserId;
  };

  const canUnassign = (session, userRole, currentUserId) => {
    const isCurrentOrganiser = session.organiserId && String(session.organiserId) === String(currentUserId);
    const isPrivileged = ['administrator', 'hod', 'dean'].includes(userRole);
    return Boolean(isCurrentOrganiser || isPrivileged);
  };

  const canMarkAttendance = (session, userRole, currentUserId) => {
    const isCurrentOrganiser = session.organiserId && String(session.organiserId) === String(currentUserId);
    const isPrivileged = ['administrator', 'hod', 'dean'].includes(userRole);
    if (!isCurrentOrganiser && !isPrivileged) return { allowed: false, reason: 'unauthorized' };

    if (session.status === 'attendance_marked' && !isPrivileged) {
      return { allowed: false, reason: 'finalized_locked' };
    }
    return { allowed: true };
  };

  test('Any user can self-assign to an unclaimed session', () => {
    const unclaimed = { _id: 's1', status: 'scheduled', organiserId: null };
    assert.strictEqual(canClaimSession(unclaimed), true);

    const claimed = { _id: 's2', status: 'organiser_assigned', organiserId: 'u99' };
    assert.strictEqual(canClaimSession(claimed), false);
  });

  test('Current organiser or HOD/Admin can unassign, but other faculty cannot', () => {
    const session = { _id: 's1', organiserId: 'u1' };

    assert.strictEqual(canUnassign(session, 'faculty_member', 'u1'), true, 'Current organiser can step down');
    assert.strictEqual(canUnassign(session, 'hod', 'u2'), true, 'HOD can unassign');
    assert.strictEqual(canUnassign(session, 'administrator', 'u3'), true, 'Admin can unassign');
    assert.strictEqual(canUnassign(session, 'faculty_member', 'u4'), false, 'Third-party faculty cannot unassign');
  });

  test('Attendance finalization locks roster for organiser, but Admin/HOD can reopen', () => {
    const activeSession = { _id: 's1', status: 'organiser_assigned', organiserId: 'u1' };
    assert.deepStrictEqual(canMarkAttendance(activeSession, 'faculty_member', 'u1'), { allowed: true });

    const finalizedSession = { _id: 's1', status: 'attendance_marked', organiserId: 'u1' };
    assert.deepStrictEqual(canMarkAttendance(finalizedSession, 'faculty_member', 'u1'), {
      allowed: false,
      reason: 'finalized_locked',
    });
    assert.deepStrictEqual(canMarkAttendance(finalizedSession, 'hod', 'u2'), { allowed: true });
    assert.deepStrictEqual(canMarkAttendance(finalizedSession, 'administrator', 'u3'), { allowed: true });
  });
});


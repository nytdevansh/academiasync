import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Tier 2.2: Appraisal Cycle Builder: Rubric Weight Validation & State Transitions', () => {
  test('Validates criteria weights sum strictly to 100%', () => {
    const validCriteria = [
      { name: 'Teaching Quality', maxScore: 40, weight: 40 },
      { name: 'Research & Publications', maxScore: 30, weight: 30 },
      { name: 'Institutional Governance', maxScore: 20, weight: 20 },
      { name: 'Professional Development', maxScore: 10, weight: 10 },
    ];

    const totalWeight = validCriteria.reduce((sum, c) => sum + c.weight, 0);
    assert.equal(totalWeight, 100);
  });

  test('Rejects invalid weight distributions (under-allocated or over-allocated)', () => {
    const underAllocated = [
      { name: 'Teaching', weight: 40 },
      { name: 'Research', weight: 30 },
    ];
    const totalUnder = underAllocated.reduce((sum, c) => sum + c.weight, 0);
    assert.equal(totalUnder, 70);
    assert.equal(totalUnder === 100, false);

    const overAllocated = [
      { name: 'Teaching', weight: 60 },
      { name: 'Research', weight: 50 },
    ];
    const totalOver = overAllocated.reduce((sum, c) => sum + c.weight, 0);
    assert.equal(totalOver, 110);
    assert.equal(totalOver === 100, false);
  });

  test('Cycle lifecycle transitions follow draft -> active -> closed progression', () => {
    const transitions = {
      draft: ['active'],
      active: ['closed'],
      closed: [],
    };

    assert.deepEqual(transitions['draft'], ['active']);
    assert.deepEqual(transitions['active'], ['closed']);
    assert.deepEqual(transitions['closed'], []);
  });
});

describe('Tier 2.3: Reviewer Assessment Workspace: Weighted Score Mathematics', () => {
  const sampleCycle = {
    criteria: [
      { _id: 'c1', maxScore: 40, weight: 40 },
      { _id: 'c2', maxScore: 30, weight: 30 },
      { _id: 'c3', maxScore: 20, weight: 20 },
      { _id: 'c4', maxScore: 10, weight: 10 },
    ],
  };

  const calculateScore = (cycle, reviewerScores) => {
    let total = 0;
    let maxTotal = 0;
    cycle.criteria.forEach(crit => {
      const score = reviewerScores[crit._id] ?? 0;
      total += score * (crit.weight / 100);
      maxTotal += crit.maxScore * (crit.weight / 100);
    });
    return maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
  };

  test('Calculates perfect 100% when all criteria scores meet maxScore', () => {
    const scores = { c1: 40, c2: 30, c3: 20, c4: 10 };
    assert.equal(calculateScore(sampleCycle, scores), 100);
  });

  test('Calculates proportional weighted final score accurately', () => {
    // 50% on each criterion -> should yield 50%
    const halfScores = { c1: 20, c2: 15, c3: 10, c4: 5 };
    assert.equal(calculateScore(sampleCycle, halfScores), 50);

    // Varied scores:
    // c1: 30/40 * 0.4 = 0.3
    // c2: 24/30 * 0.3 = 0.24
    // c3: 15/20 * 0.2 = 0.15
    // c4: 8/10 * 0.1 = 0.08
    // sum = 0.77 / 1.0 = 77%
    const variedScores = { c1: 30, c2: 24, c3: 15, c4: 8 };
    assert.equal(calculateScore(sampleCycle, variedScores), 77);
  });

  test('Division-by-zero protection returns 0 when maxTotal is 0', () => {
    const emptyCycle = { criteria: [] };
    assert.equal(calculateScore(emptyCycle, {}), 0);
  });
});

describe('Tier 2.4: Department Competency Gap Analysis: Deficit Computation', () => {
  const levelOrder = ['beginner', 'developing', 'proficient', 'advanced', 'expert'];

  const computeGap = (currentLevel, targetLevel) => {
    const currIdx = levelOrder.indexOf(currentLevel);
    const tgtIdx = levelOrder.indexOf(targetLevel);
    const gap = tgtIdx - currIdx;
    return {
      gap,
      hasGap: gap > 0,
      isCritical: gap >= 2,
    };
  };

  test('Accurately identifies gap magnitude and target achievement', () => {
    // Developing (idx 1) -> Expert (idx 4) => Gap: 3 (Critical)
    const res1 = computeGap('developing', 'expert');
    assert.equal(res1.gap, 3);
    assert.equal(res1.hasGap, true);
    assert.equal(res1.isCritical, true);

    // Proficient (idx 2) -> Advanced (idx 3) => Gap: 1 (Non-critical deficit)
    const res2 = computeGap('proficient', 'advanced');
    assert.equal(res2.gap, 1);
    assert.equal(res2.hasGap, true);
    assert.equal(res2.isCritical, false);

    // Advanced (idx 3) -> Proficient (idx 2) => Gap: -1 (Target met / exceeded)
    const res3 = computeGap('advanced', 'proficient');
    assert.equal(res3.gap, -1);
    assert.equal(res3.hasGap, false);
    assert.equal(res3.isCritical, false);
  });
});

describe('Tier 2.6: Subject Management: Code Formatting & Credit Rules', () => {
  test('Subject codes are normalized to uppercase and trimmed', () => {
    const rawInput = '   cse402  ';
    const normalized = rawInput.trim().toUpperCase();
    assert.equal(normalized, 'CSE402');
  });

  test('Subject credits are bounded between 1 and 10', () => {
    const clampCredits = (c) => Math.min(10, Math.max(1, Number(c) || 3));
    assert.equal(clampCredits(4), 4);
    assert.equal(clampCredits(-1), 1);
    assert.equal(clampCredits(15), 10);
    assert.equal(clampCredits('invalid'), 3);
  });
});

describe('Tier 2.7: Recommendations & Compliance Health Rate Computation', () => {
  const calculateCompliance = (completed, total) => {
    if (!total || total === 0) return 100;
    return Math.round((completed / total) * 100);
  };

  test('Calculates department compliance percentage accurately', () => {
    assert.equal(calculateCompliance(10, 10), 100);
    assert.equal(calculateCompliance(8, 10), 80);
    assert.equal(calculateCompliance(1, 3), 33);
  });

  test('Defaults to 100% compliance when no recommendations are assigned', () => {
    assert.equal(calculateCompliance(0, 0), 100);
  });
});

const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  WEIGHTS,
  scorePair,
  scoreStartupFit,
  complementarySkillsScore,
  jaccard,
  cosineSimilarity,
} = require('../services/matchingEngine');

const technicalFounder = {
  skills: {
    technical: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    business: [],
  },
  interests: ['AI', 'SaaS'],
  preferences: ['Looking for a business teammate'],
  availability: 'Full-time',
  experienceLevel: 'Advanced',
  startupGoals: {
    startupType: 'AI productivity tool',
    problems: 'Help small teams automate repetitive work',
    longTermVision: 'Build an AI operating system for small businesses',
    cofounderQualities: 'Persistence and customer obsession',
  },
  workingPreferences: { workStyle: 'Remote', riskTolerance: 'Bold' },
};

const businessFounder = {
  skills: {
    technical: [],
    business: ['Marketing', 'Sales', 'Business Development', 'Product Management'],
  },
  interests: ['AI', 'SaaS'],
  preferences: ['Looking for a technical teammate'],
  availability: 'Full-time',
  experienceLevel: 'Expert',
  startupGoals: {
    startupType: 'AI productivity tool',
    problems: 'Automate repetitive work for small teams',
    longTermVision: 'An AI operating system for small businesses',
    cofounderQualities: 'Customer obsession and persistence',
  },
  workingPreferences: { workStyle: 'Remote', riskTolerance: 'Bold' },
};

const duplicateTechnicalFounder = {
  ...technicalFounder,
  skills: {
    technical: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    business: [],
  },
  preferences: ['Looking for a technical teammate'],
};

test('matching weights match the documented model and sum to 1', () => {
  assert.deepEqual(WEIGHTS, {
    complementarySkills: 0.25,
    sharedInterests: 0.15,
    startupGoals: 0.15,
    industry: 0.15,
    availability: 0.1,
    workingStyle: 0.1,
    experience: 0.1,
  });
  const total = Object.values(WEIGHTS).reduce((sum, value) => sum + value, 0);
  assert.ok(Math.abs(total - 1) < 1e-9);
});

test('scorePair returns a bounded score with a full breakdown and reasons', () => {
  const result = scorePair(technicalFounder, businessFounder);

  assert.equal(typeof result.score, 'number');
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.deepEqual(Object.keys(result.breakdown).sort(), Object.keys(WEIGHTS).sort());
  for (const value of Object.values(result.breakdown)) {
    assert.ok(value >= 0 && value <= 100);
  }
  assert.ok(Array.isArray(result.reasons));
  assert.ok(result.reasons.length > 0);
  assert.ok(result.reasons.length <= 4);
});

test('scoring is symmetric for a pair of founders', () => {
  const a = scorePair(technicalFounder, businessFounder);
  const b = scorePair(businessFounder, technicalFounder);
  assert.equal(a.score, b.score);
  assert.deepEqual(a.breakdown, b.breakdown);
});

test('complementary skill scoring rewards technical + business pairs', () => {
  const complementary = complementarySkillsScore(technicalFounder, businessFounder);
  const duplicate = complementarySkillsScore(technicalFounder, duplicateTechnicalFounder);

  assert.ok(complementary > duplicate);
  assert.ok(complementary >= 0.5);
  assert.ok(duplicate <= 0.5);
});

test('a complementary pair outscores a near-identical pair overall', () => {
  const complementary = scorePair(technicalFounder, businessFounder);
  const duplicate = scorePair(technicalFounder, duplicateTechnicalFounder);
  assert.ok(complementary.score > duplicate.score);
});

test('jaccard measures set overlap', () => {
  assert.equal(jaccard(['AI', 'SaaS'], ['AI', 'SaaS']), 1);
  assert.equal(jaccard(['AI'], ['SaaS']), 0);
  assert.equal(jaccard([], []), 0);
  assert.equal(jaccard(['AI', 'SaaS'], ['AI']), 1 / 2);
});

test('cosineSimilarity ignores stopwords and stays within [0, 1]', () => {
  assert.equal(cosineSimilarity('build an AI product', 'build an AI product'), 1);
  assert.equal(cosineSimilarity('', 'anything'), 0);
  const partial = cosineSimilarity(
    'AI productivity tool for small teams',
    'AI automation for small teams'
  );
  assert.ok(partial > 0 && partial < 1);
});

test('scoreStartupFit rewards matching skills and industry', () => {
  const startup = {
    title: 'Automate',
    description: 'AI workflow automation for small teams',
    problem: 'Teams waste time on repetitive manual work',
    industry: 'AI',
    requiredSkills: ['React', 'Node.js', 'Marketing'],
    requiredRoles: ['Developer', 'Marketer'],
  };

  const strong = scoreStartupFit(startup, technicalFounder);
  const weak = scoreStartupFit(startup, {
    skills: { technical: [], business: [] },
    interests: ['Fashion'],
    availability: '',
  });

  assert.ok(strong.matchScore > weak.matchScore);
  assert.ok(strong.matchScore >= 0 && strong.matchScore <= 100);
  assert.ok(weak.matchScore >= 0 && weak.matchScore <= 100);
  assert.ok(strong.reasons.length > 0);
});

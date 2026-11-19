const config = require('../config/env');
const User = require('../models/User');
const Match = require('../models/Match');
const llmService = require('./llmService');

const WEIGHTS = {
  complementarySkills: 0.25,
  sharedInterests: 0.15,
  startupGoals: 0.15,
  industry: 0.15,
  availability: 0.1,
  workingStyle: 0.1,
  experience: 0.1,
};

const STOPWORDS = new Set(
  'the a an and or but to of in on for with at by from is are was were be been being this that these those i we you they he she it my our your their as into about over after before between during without within across can will would should could have has had do does did not no yes so than then there here what which who whom whose when where why how all any both each few more most other some such only own same very just also using use build building want wants looking look help people problem problems solve solving world startup startups idea ideas'.split(
    ' '
  )
);

const clamp01 = (value) => Math.max(0, Math.min(1, value));

function setOf(values) {
  return new Set((values || []).filter(Boolean));
}

function jaccard(aValues, bValues) {
  const a = setOf(aValues);
  const b = setOf(bValues);
  if (!a.size && !b.size) return 0;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union ? intersection / union : 0;
}

function textTokens(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

function cosineSimilarity(aText, bText) {
  const aTokens = textTokens(aText);
  const bTokens = textTokens(bText);
  if (!aTokens.length || !bTokens.length) return 0;
  const aFreq = new Map();
  const bFreq = new Map();
  aTokens.forEach((token) => aFreq.set(token, (aFreq.get(token) || 0) + 1));
  bTokens.forEach((token) => bFreq.set(token, (bFreq.get(token) || 0) + 1));
  let dot = 0;
  for (const [token, count] of aFreq) {
    if (bFreq.has(token)) dot += count * bFreq.get(token);
  }
  const aNorm = Math.sqrt([...aFreq.values()].reduce((sum, n) => sum + n * n, 0));
  const bNorm = Math.sqrt([...bFreq.values()].reduce((sum, n) => sum + n * n, 0));
  if (!aNorm || !bNorm) return 0;
  return dot / (aNorm * bNorm);
}

function domainOf(user) {
  const tech = user.skills?.technical?.length || 0;
  const biz = user.skills?.business?.length || 0;
  if (tech && !biz) return 'technical';
  if (biz && !tech) return 'business';
  if (tech && biz) return 'hybrid';
  return 'emerging';
}

/**
 * Complementary skills: rewards profiles that cover different domains rather than
 * duplicating each other. A technical founder paired with a business founder scores
 * highest; two near-identical stacks score lowest.
 */
function complementarySkillsScore(a, b) {
  const aTech = setOf(a.skills?.technical);
  const aBiz = setOf(a.skills?.business);
  const bTech = setOf(b.skills?.technical);
  const bBiz = setOf(b.skills?.business);

  const aTotal = aTech.size + aBiz.size;
  const bTotal = bTech.size + bBiz.size;
  if (!aTotal || !bTotal) return 0.15;

  const aTechShare = aTech.size / aTotal;
  const aBizShare = aBiz.size / aTotal;
  const bTechShare = bTech.size / bTotal;
  const bBizShare = bBiz.size / bTotal;

  const divergence =
    0.5 *
    (Math.abs(aTechShare - bTechShare) + Math.abs(aBizShare - bBizShare));

  const allA = new Set([...aTech, ...aBiz]);
  const allB = new Set([...bTech, ...bBiz]);
  let shared = 0;
  for (const skill of allA) if (allB.has(skill)) shared += 1;
  const unionSize = allA.size + allB.size - shared;
  const diversity = unionSize ? 1 - shared / unionSize : 0;
  const overlap = shared / Math.max(1, Math.min(allA.size, allB.size));

  let score = 0.75 * divergence + 0.25 * diversity;

  // Two founders with the exact same stack are not complementary.
  if (overlap >= 0.8) score *= 0.35;

  // Frontend + backend developers still complement each other somewhat.
  if (aTech.size && bTech.size && !aBiz.size && !bBiz.size) {
    score = Math.max(score, 0.3 * diversity);
  }

  return clamp01(score);
}

const AVAILABILITY_MATRIX = {
  'Full-time': { 'Full-time': 1, 'Part-time': 0.35, Weekends: 0.25, Flexible: 0.8 },
  'Part-time': { 'Full-time': 0.35, 'Part-time': 0.9, Weekends: 0.7, Flexible: 0.8 },
  Weekends: { 'Full-time': 0.25, 'Part-time': 0.7, Weekends: 0.9, Flexible: 0.75 },
  Flexible: { 'Full-time': 0.8, 'Part-time': 0.8, Weekends: 0.75, Flexible: 0.95 },
};

function availabilityScore(a, b) {
  if (!a.availability || !b.availability) return 0.3;
  return AVAILABILITY_MATRIX[a.availability]?.[b.availability] ?? 0.4;
}

function workingStyleScore(a, b) {
  const aPrefs = a.workingPreferences || {};
  const bPrefs = b.workingPreferences || {};

  let style = 0.5;
  if (aPrefs.workStyle && bPrefs.workStyle) {
    if (aPrefs.workStyle === bPrefs.workStyle) style = 1;
    else if (
      (aPrefs.workStyle === 'Remote' && bPrefs.workStyle === 'Hybrid') ||
      (aPrefs.workStyle === 'Hybrid' && bPrefs.workStyle === 'Remote') ||
      (aPrefs.workStyle === 'On-site' && bPrefs.workStyle === 'Hybrid') ||
      (aPrefs.workStyle === 'Hybrid' && bPrefs.workStyle === 'On-site')
    )
      style = 0.75;
    else style = 0.35;
  }

  let risk = 0.5;
  if (aPrefs.riskTolerance && bPrefs.riskTolerance) {
    if (aPrefs.riskTolerance === bPrefs.riskTolerance) risk = 1;
    else if (aPrefs.riskTolerance === 'Bold' && bPrefs.riskTolerance === 'Conservative')
      risk = 0.3;
    else if (
      aPrefs.riskTolerance === 'Conservative' &&
      bPrefs.riskTolerance === 'Bold'
    )
      risk = 0.3;
    else risk = 0.68;
  }

  return 0.5 * style + 0.5 * risk;
}

const EXPERIENCE_ORDER = { Beginner: 0, Intermediate: 1, Advanced: 2, Expert: 3 };

function experienceScore(a, b) {
  const aLevel = EXPERIENCE_ORDER[a.experienceLevel] ?? 1;
  const bLevel = EXPERIENCE_ORDER[b.experienceLevel] ?? 1;
  const diff = Math.abs(aLevel - bLevel);
  if (diff === 0) return 0.8;
  if (diff === 1) return 1;
  if (diff === 2) return 0.65;
  return 0.4;
}

function preferenceSatisfied(preference, other) {
  const tech = other.skills?.technical?.length || 0;
  const biz = other.skills?.business?.length || 0;
  switch (preference) {
    case 'Looking for a co-founder':
      return Boolean(
        (other.preferences || []).includes('Looking for a co-founder') ||
          other.category === 'Entrepreneur' ||
          (tech && biz)
      );
    case 'Looking for a technical teammate':
      return tech > 0;
    case 'Looking for a business teammate':
      return biz > 0;
    case 'Looking for a designer':
      return (
        (other.skills?.technical || []).includes('UI/UX') ||
        (other.skills?.business || []).includes('UI/UX') ||
        other.category === 'Designer'
      );
    case 'Looking for a project collaborator':
      return (tech > 0 || biz > 0);
    default:
      return false;
  }
}

function roleFitScore(a, b) {
  const scoreFor = (person, other) => {
    const prefs = person.preferences || [];
    if (!prefs.length) return 0.4;
    const satisfied = prefs.filter((pref) => preferenceSatisfied(pref, other)).length;
    return satisfied / prefs.length;
  };
  return 0.5 * scoreFor(a, b) + 0.5 * scoreFor(b, a);
}

function goalsScore(a, b) {
  const aGoals = a.startupGoals || {};
  const bGoals = b.startupGoals || {};
  const typeSimilarity = cosineSimilarity(aGoals.startupType, bGoals.startupType);
  const problemSimilarity = cosineSimilarity(aGoals.problems, bGoals.problems);
  const visionSimilarity = cosineSimilarity(aGoals.longTermVision, bGoals.longTermVision);
  const qualitySimilarity = cosineSimilarity(
    aGoals.cofounderQualities,
    bGoals.cofounderQualities
  );
  const role = roleFitScore(a, b);

  const textScore =
    0.25 * typeSimilarity +
    0.3 * problemSimilarity +
    0.2 * visionSimilarity +
    0.1 * qualitySimilarity +
    0.15 * role;

  const hasAnyGoals =
    Boolean(aGoals.startupType || aGoals.problems || aGoals.longTermVision) &&
    Boolean(bGoals.startupType || bGoals.problems || bGoals.longTermVision);

  return clamp01(hasAnyGoals ? textScore : role * 0.5);
}

function industryScore(a, b) {
  const aInterests = a.interests || [];
  const bInterests = b.interests || [];
  const interestOverlap = jaccard(aInterests, bInterests);

  const aStartupText = `${b.startupGoals?.startupType || ''} ${
    b.startupGoals?.problems || ''
  }`.toLowerCase();
  const bStartupText = `${a.startupGoals?.startupType || ''} ${
    a.startupGoals?.problems || ''
  }`.toLowerCase();

  const hits = (interests, text) => {
    if (!interests.length || !text) return 0;
    return interests.filter((interest) => text.includes(interest.toLowerCase())).length /
      interests.length;
  };

  const textAlignment = 0.5 * (hits(aInterests, aStartupText) + hits(bInterests, bStartupText));
  if (!aInterests.length && !bInterests.length) return 0.1;
  return clamp01(0.55 * interestOverlap + 0.45 * textAlignment);
}

function buildReasons(a, b, breakdown) {
  const reasons = [];
  const aDomain = domainOf(a);
  const bDomain = domainOf(b);
  const aTech = a.skills?.technical || [];
  const bBiz = b.skills?.business || [];
  const bTech = b.skills?.technical || [];
  const aBiz = a.skills?.business || [];

  if (breakdown.complementarySkills >= 50) {
    if (aDomain !== bDomain && aDomain !== 'emerging' && bDomain !== 'emerging') {
      reasons.push(
        `Your ${aDomain} background pairs well with their ${bDomain} strengths, so you can cover more ground together.`
      );
    } else if (aDomain === 'technical' || bDomain === 'technical') {
      const techSide = aTech.length ? a : b;
      const bizSide = bBiz.length ? b : a;
      const bizSkills = bizSide.skills?.business || [];
      if (techSide.skills?.technical?.length && bizSkills.length) {
        reasons.push(
          `Your technical skills (${techSide.skills.technical
            .slice(0, 3)
            .join(', ')}) complement their business expertise (${bizSkills
            .slice(0, 3)
            .join(', ')}).`
        );
      }
    }
  }

  if (breakdown.sharedInterests >= 35) {
    const shared = (a.interests || []).filter((interest) =>
      (b.interests || []).includes(interest)
    );
    if (shared.length) {
      reasons.push(`You share a passion for ${shared.slice(0, 3).join(', ')}.`);
    }
  }

  if (breakdown.industry >= 40) {
    const aligned = (a.interests || []).filter((interest) =>
      `${b.startupGoals?.startupType || ''} ${b.startupGoals?.problems || ''}`
        .toLowerCase()
        .includes(interest.toLowerCase())
    );
    if (aligned.length) {
      reasons.push(
        `Their startup focus overlaps with your interest in ${aligned.slice(0, 2).join(' and ')}.`
      );
    }
  }

  if (breakdown.startupGoals >= 45) {
    reasons.push(
      'Your startup goals and the problems you want to solve are closely aligned.'
    );
  }

  if (breakdown.availability >= 75) {
    reasons.push(
      `You are both available ${String(a.availability || 'flexibly').toLowerCase()}, making it easier to build momentum.`
    );
  }

  if (breakdown.workingStyle >= 75) {
    reasons.push('Your working styles and risk appetite are a strong match.');
  }

  if (breakdown.experience >= 90) {
    reasons.push(
      'Your experience levels complement each other, pairing fresh energy with seasoned judgment.'
    );
  }

  const prefReasons = [];
  if ((a.preferences || []).includes('Looking for a technical teammate') && bTech.length) {
    prefReasons.push('You want a technical teammate and they bring hands-on engineering skills');
  }
  if ((a.preferences || []).includes('Looking for a business teammate') && bBiz.length) {
    prefReasons.push('You want a business teammate and they bring go-to-market expertise');
  }
  if ((a.preferences || []).includes('Looking for a designer')) {
    const isDesigner =
      bTech.includes('UI/UX') ||
      (b.skills?.business || []).includes('UI/UX') ||
      b.category === 'Designer';
    if (isDesigner) prefReasons.push('They can cover the design gap you are looking for');
  }
  if (prefReasons.length) reasons.push(`${prefReasons[0]}.`);

  if (!reasons.length) {
    reasons.push(
      'Your profiles bring different but compatible strengths, and there is room to build something together.'
    );
  }

  return reasons.slice(0, 4);
}

/**
 * Scores a pair of founder profiles. Returns a 0-100 score plus normalized factor
 * breakdown and human-readable reasons. Deterministic and fully rule-based.
 */
function scorePair(a, b) {
  const factors = {
    complementarySkills: complementarySkillsScore(a, b),
    sharedInterests: jaccard(a.interests, b.interests),
    startupGoals: goalsScore(a, b),
    industry: industryScore(a, b),
    availability: availabilityScore(a, b),
    workingStyle: workingStyleScore(a, b),
    experience: experienceScore(a, b),
  };

  const rawScore = Object.keys(WEIGHTS).reduce(
    (sum, key) => sum + factors[key] * WEIGHTS[key],
    0
  );
  const score = Math.round(clamp01(rawScore) * 100);

  const breakdown = {};
  for (const [key, value] of Object.entries(factors)) {
    breakdown[key] = Math.round(clamp01(value) * 100);
  }

  return {
    score,
    breakdown,
    reasons: buildReasons(a, b, breakdown),
    raw: factors,
  };
}

function cleanUser(user) {
  if (!user) return user;
  const obj = typeof user.toObject === 'function' ? user.toObject() : user;
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
}

async function recalculateForUser(userId, { limit = 30, enhance = false } = {}) {
  const me = await User.findById(userId);
  if (!me) return [];

  const candidates = await User.find({
    _id: { $ne: me._id },
    isActive: true,
    onboardingCompleted: true,
    role: 'user',
  }).limit(500);

  const mePlain = cleanUser(me);
  const scored = candidates
    .map((candidate) => {
      const candidatePlain = cleanUser(candidate);
      return {
        candidate: candidatePlain,
        result: scorePair(mePlain, candidatePlain),
      };
    })
    .sort((x, y) => y.result.score - x.result.score)
    .slice(0, limit);

  const enhanceCount = enhance && config.llm.enabled ? Math.min(5, scored.length) : 0;
  if (enhanceCount) {
    await Promise.all(
      scored.slice(0, enhanceCount).map(async (entry) => {
        const enhanced = await llmService.enhanceMatch(mePlain, entry.candidate, entry.result);
        if (enhanced) {
          entry.result.score = Math.max(
            0,
            Math.min(100, entry.result.score + (enhanced.scoreAdjustment || 0))
          );
          entry.result.reasons = enhanced.reasons;
          entry.result.source = 'llm';
        }
      })
    );
  }

  const operations = scored.map((entry) => ({
    updateOne: {
      filter: { userId: me._id, matchedUserId: entry.candidate._id },
      update: {
        $set: {
          compatibilityScore: entry.result.score,
          breakdown: entry.result.breakdown,
          matchingReasons: entry.result.reasons,
          source: entry.result.source || 'rules',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      upsert: true,
    },
  }));

  if (operations.length) await Match.bulkWrite(operations, { ordered: false });
  await Match.deleteMany({
    userId: me._id,
    matchedUserId: { $nin: scored.map((entry) => entry.candidate._id) },
  });

  return scored;
}

async function getCompatibility(me, other) {
  const result = scorePair(cleanUser(me), cleanUser(other));
  return {
    compatibilityScore: result.score,
    breakdown: result.breakdown,
    matchingReasons: result.reasons,
  };
}

/**
 * Rule-based fit between a startup's requirements and a founder profile.
 */
function scoreStartupFit(startup, user) {
  const requiredSkills = startup.requiredSkills || [];
  const userSkills = new Set([
    ...(user.skills?.technical || []),
    ...(user.skills?.business || []),
  ]);

  let skillMatch = 0;
  const matchedSkills = [];
  if (requiredSkills.length) {
    requiredSkills.forEach((skill) => {
      if (userSkills.has(skill)) {
        skillMatch += 1;
        matchedSkills.push(skill);
      }
    });
    skillMatch /= requiredSkills.length;
  }

  const interests = user.interests || [];
  const industryMatch = interests.includes(startup.industry)
    ? 1
    : interests.some((interest) =>
        `${startup.title} ${startup.description} ${startup.problem}`
          .toLowerCase()
          .includes(interest.toLowerCase())
      )
    ? 0.5
    : 0;

  const roleCoverage = (startup.requiredRoles || []).some((role) => {
    if (role === 'Developer') return (user.skills?.technical || []).length > 0;
    if (role === 'Designer')
      return (
        (user.skills?.technical || []).includes('UI/UX') ||
        user.category === 'Designer'
      );
    if (role === 'Data / AI')
      return (
        (user.skills?.technical || []).includes('AI/ML') ||
        (user.skills?.technical || []).includes('Data Science')
      );
    if (role === 'Marketer')
      return (
        (user.skills?.business || []).includes('Marketing') ||
        (user.skills?.business || []).includes('SEO')
      );
    if (role === 'Product Manager')
      return (user.skills?.business || []).includes('Product Management');
    if (role === 'Business / Sales')
      return (
        (user.skills?.business || []).includes('Sales') ||
        (user.skills?.business || []).includes('Business Development')
      );
    return false;
  });

  const availabilityFit = user.availability ? 0.8 : 0.3;

  const score = Math.round(
    100 *
      (0.55 * skillMatch +
        0.25 * industryMatch +
        0.1 * (roleCoverage ? 1 : 0) +
        0.1 * availabilityFit)
  );

  const reasons = [];
  if (matchedSkills.length) {
    reasons.push(`Brings ${matchedSkills.slice(0, 3).join(', ')}`);
  }
  if (industryMatch === 1) reasons.push(`Interested in ${startup.industry}`);
  if (roleCoverage) reasons.push('Covers a role the team needs');
  if (user.availability) reasons.push(`Available ${user.availability.toLowerCase()}`);
  if (!reasons.length) reasons.push('Adjacent skills and interests worth exploring');

  return {
    matchScore: Math.max(0, Math.min(100, score)),
    matchedSkills,
    reasons: reasons.slice(0, 3),
  };
}

module.exports = {
  WEIGHTS,
  scorePair,
  recalculateForUser,
  getCompatibility,
  scoreStartupFit,
  complementarySkillsScore,
  jaccard,
  cosineSimilarity,
};

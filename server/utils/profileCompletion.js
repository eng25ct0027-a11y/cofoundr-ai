/**
 * Weighted profile completeness, used on the dashboard and to nudge onboarding.
 */
function calculateProfileCompletion(user) {
  if (!user) return 0;
  const goals = user.startupGoals || {};
  const prefs = user.workingPreferences || {};
  const social = user.socialLinks || {};

  const checks = [
    { value: user.name, weight: 6 },
    { value: user.profileImage, weight: 4 },
    { value: user.location, weight: 4 },
    { value: user.category, weight: 4 },
    { value: user.bio && user.bio.length >= 40, weight: 8 },
    {
      value:
        (user.skills?.technical?.length || 0) + (user.skills?.business?.length || 0) >= 3,
      weight: 18,
    },
    { value: (user.interests?.length || 0) >= 2, weight: 12 },
    { value: (user.preferences?.length || 0) >= 1, weight: 10 },
    { value: user.availability, weight: 8 },
    { value: user.experienceLevel, weight: 4 },
    {
      value:
        Boolean(goals.startupType) &&
        Boolean(goals.problems) &&
        Boolean(goals.cofounderQualities) &&
        Boolean(goals.longTermVision),
      weight: 16,
    },
    { value: Boolean(prefs.workStyle && prefs.riskTolerance), weight: 4 },
    { value: Boolean(social.linkedin || social.github || social.portfolio), weight: 2 },
  ];

  const score = checks.reduce((sum, check) => sum + (check.value ? check.weight : 0), 0);
  return Math.min(100, Math.round(score));
}

module.exports = { calculateProfileCompletion };

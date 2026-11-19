const config = require('../config/env');

function extractJson(text) {
  if (!text) return null;
  const cleaned = String(text)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function callLlm(messages, { temperature = 0.5 } = {}) {
  if (!config.llm.enabled) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.llm.timeoutMs);
  try {
    const response = await fetch(`${config.llm.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.llm.apiKey}`,
      },
      body: JSON.stringify({
        model: config.llm.model,
        messages,
        temperature,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      console.warn(`[llm] request failed with status ${response.status}`);
      return null;
    }
    const data = await response.json();
    return extractJson(data?.choices?.[0]?.message?.content);
  } catch (error) {
    console.warn(`[llm] falling back to rules: ${error.message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function compactProfile(user) {
  return {
    name: user.name,
    category: user.category,
    location: user.location,
    experienceLevel: user.experienceLevel,
    skills: user.skills,
    interests: user.interests,
    preferences: user.preferences,
    availability: user.availability,
    startupGoals: user.startupGoals,
    workingPreferences: user.workingPreferences,
  };
}

/**
 * Optional enhancement layer. The matching engine is the source of truth; the LLM
 * only rewrites explanations and may nudge a score within a small, clamped range.
 */
async function enhanceMatch(me, candidate, baseResult) {
  if (!config.llm.enabled) return null;

  const prompt = `You are CoFoundr AI, an expert startup team-matching analyst.
Compare these two founder profiles and explain their compatibility in 2-3 short, specific sentences.
Use only the provided data. Do not invent skills, locations, or achievements.
Return strict JSON: {"reasons":["..."],"scoreAdjustment":0}
scoreAdjustment must be an integer between -4 and 4.

FOUNDER A:
${JSON.stringify(compactProfile(me))}

FOUNDER B:
${JSON.stringify(compactProfile(candidate))}

RULE-BASED RESULT:
score=${baseResult.score}
breakdown=${JSON.stringify(baseResult.breakdown)}
reasons=${JSON.stringify(baseResult.reasons)}`;

  const parsed = await callLlm([
    {
      role: 'system',
      content:
        'You write concise, grounded compatibility explanations for a co-founder matching platform. Output JSON only.',
    },
    { role: 'user', content: prompt },
  ]);

  if (!parsed || !Array.isArray(parsed.reasons)) return null;
  const reasons = parsed.reasons
    .filter((reason) => typeof reason === 'string' && reason.trim().length > 10)
    .map((reason) => reason.trim())
    .slice(0, 3);
  if (!reasons.length) return null;

  const adjustment = Number(parsed.scoreAdjustment) || 0;
  return {
    reasons,
    scoreAdjustment: Math.max(-4, Math.min(4, Math.round(adjustment))),
  };
}

async function analyzeStartupIdea(startup, candidates) {
  if (!config.llm.enabled || !candidates.length) return null;

  const prompt = `You are CoFoundr AI. A startup is looking for collaborators.
Startup: ${JSON.stringify({
    title: startup.title,
    description: startup.description,
    problem: startup.problem,
    industry: startup.industry,
    requiredSkills: startup.requiredSkills,
    requiredRoles: startup.requiredRoles,
  })}

Candidate founders:
${JSON.stringify(
  candidates.map((candidate) => ({
    id: candidate._id,
    name: candidate.name,
    skills: candidate.skills,
    interests: candidate.interests,
  }))
)}

Return strict JSON: {"recommendations":[{"id":"...","reason":"one short sentence"}]}
Only recommend from the candidate list.`;

  const parsed = await callLlm([
    {
      role: 'system',
      content: 'You rank startup collaborators. Output JSON only and never invent people.',
    },
    { role: 'user', content: prompt },
  ]);
  return parsed?.recommendations || null;
}

module.exports = { enhanceMatch, analyzeStartupIdea, extractJson };

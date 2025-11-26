// /api/utils/moderation.js
// Ultra-strict, low false-positive moderation (very critical keywords only)

const DEFAULT_SUGGESTION = 'Please revise or remove the flagged content before resubmitting.';

const CATEGORY_SUGGESTIONS = {
  child_abuse: 'Remove any references to harming or exploiting minors immediately.',
  violence_threats: 'Remove threats or encouragement of violence and rewrite using non-violent language.',
  hate_speech: 'Eliminate discriminatory language and ensure the message respects protected groups.',
  extreme_adult: 'Delete explicit or exploitative sexual references and keep the content PG-13.',
  harassment_bullying: 'Avoid personal attacks; focus on constructive feedback stated respectfully.',
  sexual_content: 'Strip out explicit sexual descriptions or innuendo from the submission.',
  profanity_vulgar: 'Replace profanity with neutral wording suitable for a public audience.',
  spam_scam: 'Remove promotional or deceptive wording and add genuine, verifiable information.'
};

// 🚨 ONLY very critical and explicit words
const SEVERITY_KEYWORDS = {
  violence_threats: [
    'kill', 'murder', 'stab', 'shoot', 'bomb', 'explode', 'torture',
    'execute', 'behead', 'burn alive', 'massacre', 'assassinate',
    'suicide attack', 'genocide'
  ],

  child_abuse: [
    'child pornography', 'cp', 'pedo', 'pedophile', 'molest',
    'rape child', 'abuse child', 'exploit minor', 'underage sex'
  ],

  hate_speech: [
    'nigger', 'kike', 'chink', 'wetback', 'faggot', 'tranny',
    'ethnic cleansing', 'gas the jews', 'white power', 'superior race'
  ],

  extreme_adult: [
    'bestiality', 'zoophilia', 'scat', 'necrophilia', 'incest'
  ],

  harassment_bullying: [
    'you should die', 'kill yourself', 'kys',
    'worthless loser', 'subhuman'
  ],

  sexual_content: [
    'hardcore porn', 'explicit sex', 'deepthroat', 'xxx video'
  ],

  profanity_vulgar: [
    'fuck', 'motherfucker', 'cunt'
  ],

  spam_scam: [
    'crypto giveaway', 'wire money', 'investment scheme',
    'guaranteed returns', 'limited offer', 'free gift click'
  ]
};

// Severe categories
const SEVERE_CATEGORIES = new Set([
  'child_abuse',
  'violence_threats',
  'hate_speech',
  'extreme_adult'
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(input) {
  return input.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function checkKeyword(text, keyword) {
  const normalizedKeyword = keyword.toLowerCase();
  if (normalizedKeyword.includes(' ')) return text.includes(normalizedKeyword);
  const pattern = new RegExp(`\\b${escapeRegExp(normalizedKeyword)}\\b`, 'i');
  return pattern.test(text);
}

function detectProhibitedContent(line) {
  const normalizedLine = normalizeText(line);
  if (!normalizedLine) return { issues: [], category: null, isSevere: false, suggestion: DEFAULT_SUGGESTION };

  const matchedCategories = [];
  const issues = new Set();

  Object.entries(SEVERITY_KEYWORDS).forEach(([category, keywords]) => {
    if (keywords.some(keyword => checkKeyword(normalizedLine, keyword))) {
      matchedCategories.push(category);

      switch (category) {
        case 'violence_threats': issues.add('Violence or threats of harm'); break;
        case 'child_abuse': issues.add('Child exploitation or abuse'); break;
        case 'hate_speech': issues.add('Hate speech or discriminatory language'); break;
        case 'extreme_adult': issues.add('Illegal or extreme sexual content'); break;
        case 'harassment_bullying': issues.add('Harassment or targeted abuse'); break;
        case 'sexual_content': issues.add('Explicit sexual content'); break;
        case 'profanity_vulgar': issues.add('Profanity or vulgar language'); break;
        case 'spam_scam': issues.add('Spam or scam content'); break;
      }
    }
  });

  const category = matchedCategories[0] || null;
  const isSevere = matchedCategories.some(cat => SEVERE_CATEGORIES.has(cat));
  const suggestion = CATEGORY_SUGGESTIONS[category] || DEFAULT_SUGGESTION;

  return { issues: Array.from(issues), category, isSevere, suggestion };
}

export async function analyzeContentWithKeywords(content) {
  try {
    const lines = content.split('\n').map(l => l.trim());
    const badLines = [];
    const suggestions = new Set();

    lines.forEach((line, index) => {
      if (!line || line.length < 3) return;
      const detection = detectProhibitedContent(line);

      if (detection.issues.length > 0) {
        badLines.push({
          line: index + 1,
          text: line,
          issues: detection.issues,
          category: detection.category,
          suggestions: detection.suggestion,
          severity: detection.isSevere ? 'CRITICAL' : 'MODERATE'
        });
        suggestions.add(`Line ${index + 1}: ${detection.suggestion}`);
      }
    });

    return {
      safe: badLines.length === 0,
      badLines,
      suggestions: Array.from(suggestions),
      summary: ''
    };
  } catch {
    return { safe: true, badLines: [], suggestions: [], summary: '' };
  }
}

export async function moderateBlog(content) {
  return analyzeContentWithKeywords(content);
}

export async function moderateComment(text) {
  return analyzeContentWithKeywords(text);
}

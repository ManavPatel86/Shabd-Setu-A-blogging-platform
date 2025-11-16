// /api/utils/moderation.js
// Multi-layer moderation: keyword heuristics + Gemini summary

import axios from 'axios';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

const GOOGLE_MODEL_NAME = process.env.GOOGLE_MODERATION_MODEL || 'gemini-1.5-flash';
const DEFAULT_SUGGESTION = 'Please revise or remove the flagged content before resubmitting.';

const CATEGORY_SUGGESTIONS = {
  child_abuse: 'Remove any references to harming or exploiting minors immediately.',
  violence_threats: 'Remove threats or encouragement of violence and rewrite using non-violent language.',
  hate_speech: 'Eliminate discriminatory language and ensure the message respects protected groups.',
  extreme_adult: 'Delete explicit or exploitative sexual references and keep the content PG-13.',
  harassment_bullying: 'Avoid personal attacks; focus on constructive feedback stated respectfully.',
  sexual_content: 'Strip out explicit sexual descriptions or innuendo from the submission.',
  profanity_vulgar: 'Replace profanity with neutral wording that suits a public audience.',
  spam_scam: 'Remove promotional or deceptive wording and add genuine, verifiable information.'
};

const SEVERITY_KEYWORDS = {
  violence_threats: [
    'kill', 'murder', 'harm', 'injure', 'beat', 'stab', 'shoot', 'hang', 'poison', 'die', 'death', 'destroy',
    'rape', 'assault', 'abuse', 'hit', 'punch', 'bomb', 'explode', 'torture', 'execute', 'massacre', 'violence',
    'threat', 'attack', 'revenge', 'hurt', 'wound', 'injury'
  ],
  child_abuse: [
    'child abuse', 'harm child', 'hurt kid', 'abuse child', 'sexual abuse', 'minor', 'pedophile', 'exploitation',
    'child endangerment', 'kid danger', 'toddler harm', 'infant abuse', 'baby', 'toddler', 'infant', 'teen', 'underage'
  ],
  hate_speech: [
    'nigger', 'faggot', 'retard', 'tranny', 'kike', 'chink', 'wetback', 'camel jockey', 'sand nigger',
    'should die', 'subhuman', 'vermin', 'cockroach', 'deserve death', 'inferior race', 'white power', 'ethnic cleansing'
  ],
  extreme_adult: [
    'scat', 'bestiality', 'zoophilia', 'necrophilia', 'incest', 'child pornography', 'cp', 'lolicon', 'rape fantasy'
  ],
  harassment_bullying: [
    'loser', 'stupid', 'dumb', 'idiot', 'moron', 'bitch', 'asshole', 'jerk', 'bully', 'harass', 'worthless', 'ugly', 'freak'
  ],
  profanity_vulgar: [
    'fuck', 'shit', 'bastard', 'dick', 'cunt', 'motherfucker', 'bullshit', 'prick', 'slut', 'whore'
  ],
  sexual_content: [
    'naked', 'nude', 'porn', 'sex', 'xxx', 'nsfw', 'erotic', 'fetish', 'seduce', 'horny', 'aroused'
  ],
  spam_scam: [
    'buy now', 'click here', 'limited offer', 'wire money', 'crypto giveaway', 'investment scheme', 'guaranteed returns',
    'work from home', 'free gift', 'visit my channel', 'make $', 'bit.ly', 'tinyurl'
  ]
};

const SEVERE_CATEGORIES = new Set([
  'child_abuse',
  'violence_threats',
  'hate_speech',
  'extreme_adult'
]);

const moderationModel = initializeModel();

function initializeModel() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    return new ChatGoogleGenerativeAI({
      apiKey,
      modelName: GOOGLE_MODEL_NAME,
      temperature: 0.2,
      maxOutputTokens: 512
    });
  } catch (err) {
    console.warn('Failed to initialize moderation model:', err.message);
    return null;
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(input) {
  return input
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function checkKeyword(text, keyword) {
  const normalizedKeyword = keyword.toLowerCase();
  if (normalizedKeyword.includes(' ')) {
    return text.includes(normalizedKeyword);
  }
  const pattern = new RegExp(`\\b${escapeRegExp(normalizedKeyword)}\\b`, 'i');
  return pattern.test(text);
}

function detectProhibitedContent(line) {
  const normalizedLine = normalizeText(line);

  if (!normalizedLine) {
    return { issues: [], category: null, isSevere: false, suggestion: DEFAULT_SUGGESTION };
  }

  const matchedCategories = [];
  const issues = new Set();

  const hasViolence = SEVERITY_KEYWORDS.violence_threats.some(keyword => checkKeyword(normalizedLine, keyword));
  const mentionsChild = SEVERITY_KEYWORDS.child_abuse.some(keyword => checkKeyword(normalizedLine, keyword))
    || /\b\d{1,2}\s*(?:year|years|yr|yrs|y\/o)\b/.test(normalizedLine);

  if (hasViolence && mentionsChild) {
    matchedCategories.push('child_abuse');
    issues.add('Violence against minors');
  } else if (hasViolence) {
    matchedCategories.push('violence_threats');
    issues.add('Violence or threats of harm');
  }

  if (mentionsChild && !matchedCategories.includes('child_abuse')) {
    matchedCategories.push('child_abuse');
    issues.add('References to minors in unsafe context');
  }

  Object.entries(SEVERITY_KEYWORDS).forEach(([category, keywords]) => {
    if (matchedCategories.includes(category)) {
      return;
    }
    if (keywords.some(keyword => checkKeyword(normalizedLine, keyword))) {
      matchedCategories.push(category);
      switch (category) {
        case 'hate_speech':
          issues.add('Hate speech or discriminatory language');
          break;
        case 'extreme_adult':
          issues.add('Illegal or extreme sexual content');
          break;
        case 'harassment_bullying':
          issues.add('Harassment, bullying, or targeted insults');
          break;
        case 'sexual_content':
          issues.add('Explicit or graphic sexual content');
          break;
        case 'profanity_vulgar':
          issues.add('Profanity or vulgar language');
          break;
        case 'spam_scam':
          issues.add('Spam, scam, or deceptive solicitation');
          break;
        default:
          issues.add('Policy violation detected');
          break;
      }
    }
  });

  const category = matchedCategories[0] || null;
  const isSevere = matchedCategories.some(cat => SEVERE_CATEGORIES.has(cat));
  const suggestion = category ? (CATEGORY_SUGGESTIONS[category] || DEFAULT_SUGGESTION) : DEFAULT_SUGGESTION;

  return {
    issues: Array.from(issues),
    category,
    isSevere,
    suggestion
  };
}

const SUMMARY_FEW_SHOT = `You are the compliance assistant for a blogging platform.
Respond with three bullet points labelled Summary, Impact, and Next steps.
Keep the tone professional, avoid judgemental wording, and stay under 80 words total.

Example:
Summary:
- The comment includes a direct threat to harm another user.
Impact:
- Threats of violence violate the community safety policy and create a hostile environment.
Next steps:
- Remove the violent language and restate the concern without threats.`;

function buildIssuesBlock(badLines) {
  return badLines
    .map(line => `Line ${line.line} (${line.category || 'general'}): ${line.issues.join('; ')}\nOriginal: ${line.text}`)
    .join('\n\n');
}

function buildFallbackSummary({ badLines, type }) {
  const intro = `The ${type === 'comment' ? 'comment' : 'blog post'} cannot be published because we detected:`;
  const bulletPoints = badLines
    .map(line => `- Line ${line.line}: ${line.issues.join(', ')}`)
    .join('\n');
  const next = 'Please remove the flagged excerpts and rewrite them so they comply with the community guidelines.';
  return `${intro}\n${bulletPoints}\n\n${next}`.trim();
}

async function generateModerationSummary({ badLines, type }) {
  if (!badLines.length) {
    return '';
  }

  if (!moderationModel) {
    return buildFallbackSummary({ badLines, type });
  }

  const prompt = `${SUMMARY_FEW_SHOT}\n\nContent type: ${type}.\nFlagged excerpts:\n${buildIssuesBlock(badLines)}\n\nProduce the structured summary now.`;

  try {
    const result = await moderationModel.invoke(prompt);
    const rawContent = Array.isArray(result?.content)
      ? result.content.map(part => typeof part === 'string' ? part : part?.text || '').join(' ')
      : (result?.content ?? result?.text ?? '');

    const cleaned = String(rawContent)
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();

    if (cleaned) {
      return cleaned;
    }
  } catch (err) {
    console.warn('Failed to generate moderation summary with Gemini:', err.message);
  }

  return buildFallbackSummary({ badLines, type });
}

async function analyzeContentWithAI(content, options = {}) {
  const { type = 'blog' } = options;

  try {
    const lines = content.split('\n').map(l => l.trim());
    const badLines = [];
    const suggestions = new Set();

    lines.forEach((line, index) => {
      if (!line || line.length < 3) {
        return;
      }

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

    const flaggedIndices = new Set(badLines.map(item => item.line));

    if (moderationModel) {
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (!line || flaggedIndices.has(i + 1) || line.length < 3) {
          continue;
        }

        const prompt = `You are a strict content moderator. Analyse the following line and respond in JSON.\n\nText: "${line}"\n\nRespond with:\n{"safe": boolean, "issues": ["..."], "category": "category or null", "suggestion": "actionable fix"}`;

        try {
          const result = await moderationModel.invoke(prompt);
          const rawContent = Array.isArray(result?.content)
            ? result.content.map(part => typeof part === 'string' ? part : part?.text || '').join(' ')
            : (result?.content ?? result?.text ?? '');

          const cleaned = String(rawContent)
            .replace(/```json\n?/gi, '')
            .replace(/```\n?/g, '')
            .trim();

          if (!cleaned) {
            continue;
          }

          const parsed = JSON.parse(cleaned);
          if (!parsed.safe && Array.isArray(parsed.issues) && parsed.issues.length > 0) {
            const category = parsed.category || 'general';
            const suggestion = parsed.suggestion || CATEGORY_SUGGESTIONS[category] || DEFAULT_SUGGESTION;

            badLines.push({
              line: i + 1,
              text: line,
              issues: parsed.issues,
              category,
              suggestions: suggestion,
              severity: SEVERE_CATEGORIES.has(category) ? 'CRITICAL' : 'MODERATE'
            });
            suggestions.add(`Line ${i + 1}: ${suggestion}`);
            flaggedIndices.add(i + 1);
          }
        } catch (err) {
          console.warn(`Gemini moderation check failed for line ${i + 1}:`, err.message);
        }
      }
    }

    const safe = badLines.length === 0;
    const summary = safe ? '' : await generateModerationSummary({ badLines, type });

    return {
      safe,
      badLines,
      suggestions: Array.from(suggestions),
      summary
    };
  } catch (err) {
    console.error('Moderation error:', err.message);
    return { safe: true, badLines: [], suggestions: [], summary: '' };
  }
}

async function moderateContentViaAPI(content, type = 'blog') {
  const API_URL = process.env.AI_MODERATION_API_URL;
  const API_KEY = process.env.AI_MODERATION_API_KEY;

  if (!API_URL || !API_KEY) {
    return null;
  }

  try {
    const response = await axios.post(
      API_URL,
      { content, type },
      { headers: { Authorization: `Bearer ${API_KEY}` } }
    );
    return response.data;
  } catch (err) {
    console.error('Moderation API error:', err.message);
    return null;
  }
}

export async function moderateBlog(content) {
  const result = await analyzeContentWithAI(content, { type: 'blog' });

  if (result.safe === undefined) {
    const fallback = await moderateContentViaAPI(content, 'blog');
    return fallback || { safe: true, badLines: [], suggestions: [], summary: '' };
  }

  if (!result.safe && !result.summary) {
    result.summary = buildFallbackSummary({ badLines: result.badLines, type: 'blog' });
  }

  return result;
}

export async function moderateComment(text) {
  const result = await analyzeContentWithAI(text, { type: 'comment' });

  if (result.safe === undefined) {
    const fallback = await moderateContentViaAPI(text, 'comment');
    return fallback || { safe: true, badLines: [], suggestions: [], summary: '' };
  }

  if (!result.safe && !result.summary) {
    result.summary = buildFallbackSummary({ badLines: result.badLines, type: 'comment' });
  }

  return result;
}
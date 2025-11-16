// /api/utils/moderation.js
// Multi-layer moderation: keyword detection + AI analysis
// Returns { safe, badLines, suggestions }

import axios from 'axios';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

/**
 * Keyword-based detection for severe content violations
 * Fast, strict detection for prohibited content
 */
const SEVERITY_KEYWORDS = {
  violence_threats: [
    'kill', 'murder', 'harm', 'injure', 'beat', 'stab', 'shoot', 'hang', 'poison', 'die', 'death', 'destroy',
    'rape', 'assault', 'abuse', 'hit', 'punch', 'bomb', 'explode', 'torture', 'execute', 'massacre', 'violence',
    'threat', 'attack', 'revenge', 'hurt', 'wound', 'injury'
  ],
  child_abuse: [
    'child abuse', 'harm child', 'hurt kid', 'abuse child', 'sexual abuse', 'minor', 'pedophile', 'exploitation',
    'child endangerment', 'kid danger', 'toddler harm', 'infant abuse', 'child', 'kid', 'toddler', 'infant', 'baby', 'year old'
  ],
  hate_speech: [
    'nigger', 'faggot', 'retard', 'tranny', 'kike', 'chink', 'wetback', 'camel jockey', 'sand nigger',
    'should die', 'subhuman', 'vermin', 'cockroach', 'deserve death', 'hate', 'racist', 'discrimination'
  ],
  extreme_adult: [
    'scat', 'bestiality', 'zoophilia', 'necrophilia', 'incest', 'child pornography', 'cp', 'lolicon'
  ],
  harassment_bullying: [
    'loser', 'stupid', 'dumb', 'idiot', 'moron', 'bitch', 'asshole', 'jerk', 'bully', 'harass', 'cyberbully',
    'shame', 'humiliate', 'mock', 'ridicule', 'insult', 'degrade'
  ],
  sexual_content: [
    'porn', 'sex', 'xxx', 'nsfw', 'explicit', 'nude', 'naked', 'cock', 'pussy', 'dick', 'vagina',
    'horny', 'cum', 'fuck', 'blowjob', 'masturbate', 'orgasm'
  ],
  profanity_vulgar: [
    'motherfucker', 'mother fucker', 'damn', 'damned', 'hell', 'shit', 'shitty', 'crap', 'crappy', 'ass',
    'bastard', 'bitch', 'bitches', 'cunt', 'dickhead', 'douchebag', 'fag', 'fags', 'faggot', 'faggots',
    'goddamn', 'goddamned', 'horseshit', 'jackass', 'piss', 'pissed', 'pisser', 'pissing', 'suck', 'sucks',
    'sucked', 'sucks', 'tits', 'titties', 'whore', 'whores', 'slut', 'sluts', 'twat', 'twats', 'whorish',
    'arse', 'arsehole', 'shag', 'shagged', 'bollocks', 'git', 'bloody', 'blimey', 'sod', 'sodding'
  ],
  spam_scam: [
    'click here', 'buy now', 'limited offer', 'act now', 'cryptocurrency', 'bitcoin', 'earn money fast',
    'guaranteed income', 'work from home', 'click link'
  ]
};

/**
 * Check for prohibited content using keyword detection
 * @param {string} line - Single line of text
 * @returns {Object} - { issues: Array<string>, category: string, isSevere: boolean }
 */
function detectProhibitedContent(line) {
  // Normalize: remove punctuation, convert to lowercase, trim extra spaces
  const normalizedLine = line
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
  
  const issues = [];
  let category = null;
  let isSevere = false;

  // Helper function to check if keyword exists as complete word(s) or phrase
  const checkKeyword = (text, keyword) => {
    // Split keyword into words
    const keywordWords = keyword.split(/\s+/);
    
    if (keywordWords.length === 1) {
      // Single word - check with word boundaries
      const regex = new RegExp(`\\b${keywordWords[0]}\\b`, 'i');
      return regex.test(text);
    } else {
      // Multiple words - check as phrase with flexible spacing
      const pattern = keywordWords.join('\\s+');
      const regex = new RegExp(`\\b${pattern}\\b`, 'i');
      return regex.test(text);
    }
  };

  // Check violence/threats - especially around children
  const violenceKeywords = SEVERITY_KEYWORDS.violence_threats;
  const childKeywords = SEVERITY_KEYWORDS.child_abuse;
  
  const hasViolence = violenceKeywords.some(keyword => checkKeyword(normalizedLine, keyword));
  const mentionsChild = childKeywords.some(keyword => checkKeyword(normalizedLine, keyword))
    || /\b\d{1,2}\s*(?:years?)\b/.test(normalizedLine);
  
  if (hasViolence && mentionsChild) {
    issues.push('Violence against children');
    category = 'child_abuse';
    isSevere = true;
  } else if (hasViolence) {
    issues.push('Violence or threats detected');
    category = 'violence_threats';
    isSevere = true;
  }

  // Check for hate speech
  if (SEVERITY_KEYWORDS.hate_speech.some(keyword => checkKeyword(normalizedLine, keyword))) {
    if (!category) category = 'hate_speech';
    issues.push('Hate speech or discriminatory content');
    isSevere = true;
  }

  // Check for extreme adult content
  if (SEVERITY_KEYWORDS.extreme_adult.some(keyword => checkKeyword(normalizedLine, keyword))) {
    if (!category) category = 'extreme_adult';
    issues.push('Prohibited adult content');
    isSevere = true;
  }

  // Check for harassment/bullying
  if (SEVERITY_KEYWORDS.harassment_bullying.some(keyword => checkKeyword(normalizedLine, keyword))) {
    if (!category) category = 'harassment_bullying';
    issues.push('Harassment, bullying, or insulting content');
  }

  // Check for profanity and vulgar language
  if (SEVERITY_KEYWORDS.profanity_vulgar.some(keyword => checkKeyword(normalizedLine, keyword))) {
    if (!category) category = 'profanity_vulgar';
    issues.push('Offensive language or profanity');
  }

  // Check for sexual content
  if (SEVERITY_KEYWORDS.sexual_content.some(keyword => checkKeyword(normalizedLine, keyword))) {
    if (!category) category = 'sexual_content';
    issues.push('NSFW or explicit sexual content');
  }

  // Check for spam/scam
  if (SEVERITY_KEYWORDS.spam_scam.some(keyword => checkKeyword(normalizedLine, keyword))) {
    if (!category) category = 'spam_scam';
    issues.push('Spam, scam, or misleading content');
  }

  return { issues, category, isSevere };
}

/**
 * Analyze content with both keyword detection and AI
 */
async function analyzeContentWithAI(content) {
  try {
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    const badLines = [];
    const suggestions = [];

    // First pass: keyword-based detection (fast, strict)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line.length < 3) continue;

      const detection = detectProhibitedContent(line);
      
      if (detection.issues.length > 0) {
        badLines.push({
          line: i + 1,
          text: line,
          issues: detection.issues,
          category: detection.category,
          suggestions: 'This content violates our community guidelines and cannot be published. Please revise or remove this content.',
          severity: detection.isSevere ? 'CRITICAL' : 'MODERATE'
        });
        suggestions.push(`Line ${i + 1} [${detection.category}]: ${detection.issues.join(', ')}`);
        continue; // Skip AI check for already-flagged content
      }
    }

    // If AI API is available, do secondary check on remaining lines
    if (process.env.GOOGLE_API_KEY && badLines.length === 0) {
      const model = new ChatGoogleGenerativeAI({
        modelName: 'gemini-pro',
        apiKey: process.env.GOOGLE_API_KEY,
        temperature: 0,
      });

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line || line.length < 3) continue;

        const prompt = `You are a strict content moderator for a community platform. Analyze this line and flag ANY inappropriate, harmful, or unsuitable content.

Text: "${line}"

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "safe": boolean,
  "issues": ["issue1", "issue2"] or [],
  "category": "category_name or null",
  "suggestion": "how to fix" or ""
}

Flag content for ANY of these reasons:
- Hate speech, discrimination, racism, sexism
- Harassment, bullying, threats, intimidation
- Violence, injury threats, harm wishes
- NSFW/explicit sexual content
- Exploitation, abuse (any kind)
- Spam, scams, misleading information
- Illegal activities or content
- Self-harm, suicide references
- Misinformation or dangerous advice
- Any other harmful or inappropriate content

Be strict and flag when uncertain. Community safety is priority.`;

        try {
          const result = await model.invoke(prompt);
          let responseText = typeof result.content === 'string' 
            ? result.content 
            : result.content?.[0]?.text || result.text || '';
          
          // Clean up response if it contains markdown code blocks
          responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          
          const parsed = JSON.parse(responseText);
          
          if (!parsed.safe && parsed.issues?.length > 0) {
            badLines.push({
              line: i + 1,
              text: line,
              issues: parsed.issues,
              category: parsed.category,
              suggestions: parsed.suggestion || 'Please revise this content to comply with community guidelines.',
              severity: 'MODERATE'
            });
            if (parsed.suggestion) {
              suggestions.push(`Line ${i + 1}: ${parsed.suggestion}`);
            }
          }
        } catch (parseErr) {
          console.warn(`Failed to parse AI response for line ${i + 1}:`, parseErr.message);
        }
      }
    }

    return {
      safe: badLines.length === 0,
      badLines,
      suggestions: [...new Set(suggestions)],
    };
  } catch (err) {
    console.error('Moderation error:', err.message);
    // Fail open if AI fails (but keyword detection still worked)
    return { safe: true, badLines: [], suggestions: [] };
  }
}

/**
 * Legacy API moderation fallback
 */
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
      { headers: { 'Authorization': `Bearer ${API_KEY}` } }
    );
    return response.data;
  } catch (err) {
    console.error('Moderation API error:', err.message);
    return null;
  }
}

/**
 * Moderate a blog post
 */
export async function moderateBlog(content) {
  return await analyzeContentWithAI(content);
}

/**
 * Moderate a comment
 */
export async function moderateComment(text) {
  return await analyzeContentWithAI(text);
}
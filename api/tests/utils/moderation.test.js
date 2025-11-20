import { describe, it, expect } from '@jest/globals'

const {
  analyzeContentWithKeywords,
  moderateBlog,
  moderateComment
} = await import('../../utils/moderation.js')

describe('Moderation Utils', () => {
  describe('analyzeContentWithKeywords', () => {
    it('should return safe for clean content', async () => {
      const result = await analyzeContentWithKeywords('This is completely clean content')
      expect(result.safe).toBe(true)
      expect(result.badLines).toHaveLength(0)
      expect(result.suggestions).toHaveLength(0)
    })

    it('should detect violence threats', async () => {
      const result = await analyzeContentWithKeywords('i will kill you')
      expect(result.safe).toBe(false)
      expect(result.badLines.length).toBeGreaterThan(0)
      expect(result.badLines[0].issues).toContain('Violence or threats of harm')
      expect(result.badLines[0].category).toBe('violence_threats')
      expect(result.badLines[0].severity).toBe('CRITICAL')
    })

    it('should detect child abuse content', async () => {
      const result = await analyzeContentWithKeywords('pedo content here')
      expect(result.safe).toBe(false)
      expect(result.badLines[0].category).toBe('child_abuse')
      expect(result.badLines[0].severity).toBe('CRITICAL')
    })

    it('should detect hate speech', async () => {
      const result = await analyzeContentWithKeywords('faggot slur')
      expect(result.safe).toBe(false)
      expect(result.badLines[0].category).toBe('hate_speech')
      expect(result.badLines[0].severity).toBe('CRITICAL')
    })

    it('should detect extreme adult content', async () => {
      const result = await analyzeContentWithKeywords('bestiality content')
      expect(result.safe).toBe(false)
      expect(result.badLines[0].category).toBe('extreme_adult')
      expect(result.badLines[0].severity).toBe('CRITICAL')
    })

    it('should detect harassment', async () => {
      const result = await analyzeContentWithKeywords('you should die loser')
      expect(result.safe).toBe(false)
      expect(result.badLines[0].category).toBe('harassment_bullying')
      expect(result.badLines[0].severity).toBe('MODERATE')
    })

    it('should detect sexual content', async () => {
      const result = await analyzeContentWithKeywords('hardcore porn link')
      expect(result.safe).toBe(false)
      expect(result.badLines[0].category).toBe('sexual_content')
      expect(result.badLines[0].severity).toBe('MODERATE')
    })

    it('should detect profanity', async () => {
      const result = await analyzeContentWithKeywords('fuck this')
      expect(result.safe).toBe(false)
      expect(result.badLines[0].category).toBe('profanity_vulgar')
      expect(result.badLines[0].severity).toBe('MODERATE')
    })

    it('should detect spam', async () => {
      const result = await analyzeContentWithKeywords('crypto giveaway')
      expect(result.safe).toBe(false)
      expect(result.badLines[0].category).toBe('spam_scam')
      expect(result.badLines[0].severity).toBe('MODERATE')
    })

    it('should handle multi-line content', async () => {
      const content = 'line one clean\ni will kill you\nline three clean'
      const result = await analyzeContentWithKeywords(content)
      
      expect(result.safe).toBe(false)
      expect(result.badLines).toHaveLength(1)
      expect(result.badLines[0].line).toBe(2)
      expect(result.badLines[0].text).toBe('i will kill you')
    })

    it('should skip empty lines', async () => {
      const content = 'clean\n\nkill threat\n\n'
      const result = await analyzeContentWithKeywords(content)
      
      expect(result.badLines).toHaveLength(1)
      expect(result.badLines[0].line).toBe(3)
    })

    it('should provide suggestions for violations', async () => {
      const result = await analyzeContentWithKeywords('fuck this')
      
      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.suggestions[0]).toContain('Line ')
    })

    it('should handle empty content', async () => {
      const result = await analyzeContentWithKeywords('')
      
      expect(result.safe).toBe(true)
      expect(result.badLines).toHaveLength(0)
    })

    it('should handle content with only whitespace', async () => {
      const result = await analyzeContentWithKeywords('   \n  \n   ')
      
      expect(result.safe).toBe(true)
      expect(result.badLines).toHaveLength(0)
    })

    it('should handle very short lines', async () => {
      const result = await analyzeContentWithKeywords('a\nbc\nclean content here')
      
      expect(result.safe).toBe(true)
      expect(result.badLines).toHaveLength(0)
    })

    it('should handle multiple violations in different lines', async () => {
      const content = 'fuck this\nkill you\nmore shit'
      const result = await analyzeContentWithKeywords(content)
      
      expect(result.safe).toBe(false)
      expect(result.badLines.length).toBeGreaterThan(1)
    })

    it('should categorize correctly', async () => {
      const result = await analyzeContentWithKeywords('murder threat')
      
      expect(result.badLines[0].category).toBe('violence_threats')
      expect(result.badLines[0].issues).toBeDefined()
      expect(result.badLines[0].suggestions).toBeDefined()
    })

    it('should handle case insensitivity', async () => {
      const result = await analyzeContentWithKeywords('I WILL KILL YOU')
      
      expect(result.safe).toBe(false)
      expect(result.badLines.length).toBeGreaterThan(0)
    })

    it('should handle exceptions gracefully', async () => {
      const result = await analyzeContentWithKeywords('normal text')
      
      expect(result).toHaveProperty('safe')
      expect(result).toHaveProperty('badLines')
      expect(result).toHaveProperty('suggestions')
      expect(result).toHaveProperty('summary')
    })

    it('should handle very long content', async () => {
      const longContent = 'clean content '.repeat(100)
      const result = await analyzeContentWithKeywords(longContent)
      
      expect(result.safe).toBe(true)
    })

    it('should handle unicode characters', async () => {
      const result = await analyzeContentWithKeywords('clean émojis 🎉 content')
      
      expect(result.safe).toBe(true)
    })
  })

  describe('moderateBlog', () => {
    it('should moderate clean blog content', async () => {
      const result = await moderateBlog('This is a clean blog post')
      
      expect(result.safe).toBe(true)
      expect(result.badLines).toHaveLength(0)
    })

    it('should detect issues in blog content', async () => {
      const result = await moderateBlog('fuck this blog')
      
      expect(result.safe).toBe(false)
      expect(result.badLines.length).toBeGreaterThan(0)
    })

    it('should handle empty blog content', async () => {
      const result = await moderateBlog('')
      
      expect(result.safe).toBe(true)
    })

    it('should handle multi-paragraph blog', async () => {
      const content = 'paragraph one\n\nparagraph two\n\nkill threat here'
      const result = await moderateBlog(content)
      
      expect(result.safe).toBe(false)
      expect(result.badLines.length).toBeGreaterThan(0)
    })

    it('should provide appropriate suggestions', async () => {
      const result = await moderateBlog('murder someone')
      
      expect(result.suggestions.length).toBeGreaterThan(0)
    })
  })

  describe('moderateComment', () => {
    it('should moderate clean comment', async () => {
      const result = await moderateComment('nice post')
      
      expect(result.safe).toBe(true)
      expect(result.badLines).toHaveLength(0)
    })

    it('should detect issues in comment', async () => {
      const result = await moderateComment('fuck off')
      
      expect(result.safe).toBe(false)
      expect(result.badLines.length).toBeGreaterThan(0)
    })

    it('should handle empty comment', async () => {
      const result = await moderateComment('')
      
      expect(result.safe).toBe(true)
    })

    it('should handle multi-line comment', async () => {
      const result = await moderateComment('line one\nkill you\nline three')
      
      expect(result.safe).toBe(false)
      expect(result.badLines.length).toBeGreaterThan(0)
    })

    it('should handle comment with numbers', async () => {
      const result = await moderateComment('comment 123 456')
      
      expect(result.safe).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle content with special characters', async () => {
      const result = await analyzeContentWithKeywords('content @#$% symbols')
      
      expect(result.safe).toBe(true)
    })

    it('should handle mixed content types', async () => {
      const result = await analyzeContentWithKeywords('normal text then fuck bad word')
      
      expect(result.safe).toBe(false)
    })

    it('should handle repeated violations', async () => {
      const result = await analyzeContentWithKeywords('fuck\nfuck\nfuck')
      
      expect(result.safe).toBe(false)
      expect(result.badLines.length).toBe(3)
    })

    it('should handle punctuation around keywords', async () => {
      const result = await analyzeContentWithKeywords('kill, murder. stab!')
      
      expect(result.safe).toBe(false)
    })

    it('should handle tabs and extra whitespace', async () => {
      const result = await analyzeContentWithKeywords('\t\tkill\t\tyou\t\t')
      
      expect(result.safe).toBe(false)
    })

    it('should return default suggestion for a line that normalizes to empty (punctuation only)', async () => {
      // A line with only punctuation will be trimmed to empty by normalizeText, but length >=3
      const result = await analyzeContentWithKeywords('!!!')
      expect(result.safe).toBe(true)
      expect(result.badLines).toHaveLength(0)
      expect(result.suggestions).toHaveLength(0)
    })

    it('should also handle multiple punctuation characters normalizing to empty', async () => {
      const result = await analyzeContentWithKeywords('......')
      expect(result.safe).toBe(true)
      expect(result.badLines).toHaveLength(0)
    })

    it('should handle exceptions inside analyzer and return default safe result', async () => {
      // Passing non-string should cause split to throw and catch block to run
      // Use null to trigger the try-catch
      const result = await analyzeContentWithKeywords(null)
      expect(result.safe).toBe(true)
      expect(result.badLines).toEqual([])
    })

    it('should return category-specific suggestions (not the DEFAULT_SUGGESTION) for all severity categories', async () => {
      // The default suggestion should only be used when no category is detected.
      // This verifies that each severe category provides a specific suggestion.
      const defaultSuggestion = 'Please revise or remove the flagged content before resubmitting.'

      const sampleLines = [
        'i will kill you',                   // violence_threats
        'child pornography is illegal',      // child_abuse
        'you fucking nigger',                // hate_speech
        'bestiality is wrong',               // extreme_adult
        'you should die',                    // harassment_bullying
        'hardcore porn clips',               // sexual_content
        'fuck this',                         // profanity_vulgar
        'crypto giveaway with guaranteed returns' // spam_scam
      ]

      for (const line of sampleLines) {
        const result = await analyzeContentWithKeywords(line)
        expect(result.badLines.length).toBeGreaterThan(0)
        // suggestion is the category-specific suggestion (not the generic default)
        expect(result.badLines[0].suggestions).not.toBe(defaultSuggestion)
      }
    })
  })
})

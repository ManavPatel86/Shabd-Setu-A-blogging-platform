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
      expect(result.badLines[0].category).toBe('violence_threats')
      expect(result.badLines[0].severity).toBe('CRITICAL')
    })

    it('should detect hate speech', async () => {
      const result = await analyzeContentWithKeywords('faggot slur')
      expect(result.safe).toBe(false)
      expect(result.badLines[0].category).toBe('hate_speech')
      expect(result.badLines[0].severity).toBe('CRITICAL')
    })

    it('should detect profanity', async () => {
      const result = await analyzeContentWithKeywords('fuck this')
      expect(result.safe).toBe(false)
      expect(result.badLines[0].category).toBe('profanity_vulgar')
      expect(result.badLines[0].severity).toBe('MODERATE')
    })

    it('should handle multi-line content', async () => {
      const content = 'line one clean\ni will kill you\nline three clean'
      const result = await analyzeContentWithKeywords(content)
      
      expect(result.safe).toBe(false)
      expect(result.badLines).toHaveLength(1)
      expect(result.badLines[0].line).toBe(2)
    })

    it('should handle empty content', async () => {
      const result = await analyzeContentWithKeywords('')
      
      expect(result.safe).toBe(true)
      expect(result.badLines).toHaveLength(0)
    })

    it('should handle exceptions gracefully', async () => {
      const result = await analyzeContentWithKeywords(null)
      
      expect(result.safe).toBe(true)
      expect(result.badLines).toEqual([])
    })
  })

  describe('moderateBlog', () => {
    it('should moderate blog content', async () => {
      const result = await moderateBlog('fuck this blog')
      
      expect(result.safe).toBe(false)
      expect(result.badLines.length).toBeGreaterThan(0)
    })
  })

  describe('moderateComment', () => {
    it('should moderate comment content', async () => {
      const result = await moderateComment('fuck off')
      
      expect(result.safe).toBe(false)
      expect(result.badLines.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle mixed content with violations', async () => {
      const result = await analyzeContentWithKeywords('normal text then fuck bad word')
      
      expect(result.safe).toBe(false)
    })
  })
})

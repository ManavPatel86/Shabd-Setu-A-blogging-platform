import { describe, it, expect } from 'vitest';
import { validatePassword, PASSWORD_REQUIREMENTS } from '@/helpers/passwordValidation';

describe('passwordValidation', () => {
  describe('validatePassword', () => {
    it('should return invalid when password is undefined', () => {
      const result = validatePassword(undefined);
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Password is required.');
    });

    it('should return invalid when password is null', () => {
      const result = validatePassword(null);
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Password is required.');
    });

    it('should return invalid when password is empty string', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Password is required.');
    });

    it('should return invalid when password is less than 8 characters', () => {
      const result = validatePassword('Pass1!');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at least 8 characters');
    });

    it('should return invalid when password exceeds 64 characters', () => {
      const longPassword = 'A'.repeat(65) + 'a1!';
      const result = validatePassword(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('no more than 64 characters');
    });

    it('should return invalid when password lacks uppercase letter', () => {
      const result = validatePassword('password123!');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('1 uppercase letter');
    });

    it('should return invalid when password lacks lowercase letter', () => {
      const result = validatePassword('PASSWORD123!');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('1 lowercase letter');
    });

    it('should return invalid when password lacks number', () => {
      const result = validatePassword('Password!');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('1 number');
    });

    it('should return invalid when password lacks special character', () => {
      const result = validatePassword('Password123');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('1 special character');
    });

    it('should return invalid with multiple errors combined', () => {
      const result = validatePassword('pass');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at least 8 characters');
      expect(result.message).toContain('1 uppercase letter');
      expect(result.message).toContain('1 number');
      expect(result.message).toContain('1 special character');
    });

    it('should return valid for password meeting all requirements', () => {
      const result = validatePassword('Password123!');
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Password is valid.');
    });

    it('should accept all special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', ',', '.', '?', '"', ':', '{', '}', '|', '<', '>'];
      
      specialChars.forEach(char => {
        const result = validatePassword(`Password123${char}`);
        expect(result.isValid).toBe(true);
        expect(result.message).toBe('Password is valid.');
      });
    });

    it('should return valid for password with exactly 8 characters', () => {
      const result = validatePassword('Pass123!');
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Password is valid.');
    });

    it('should return valid for password with exactly 64 characters', () => {
      const password = 'A'.repeat(60) + 'a1!';
      const result = validatePassword(password);
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Password is valid.');
    });

    it('should return invalid when password has exactly 7 characters', () => {
      const result = validatePassword('Pass1!a');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at least 8 characters');
    });

    it('should return invalid when password has exactly 65 characters', () => {
      const password = 'A'.repeat(62) + 'a1!';
      const result = validatePassword(password);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('no more than 64 characters');
    });

    it('should return invalid with length error when both too short and missing requirements', () => {
      const result = validatePassword('abc');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at least 8 characters');
    });

    it('should return invalid with length error when too long and missing requirements', () => {
      const password = 'a'.repeat(70);
      const result = validatePassword(password);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('no more than 64 characters');
    });

    it('should handle password with multiple uppercase letters', () => {
      const result = validatePassword('PASSword123!');
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Password is valid.');
    });

    it('should handle password with multiple lowercase letters', () => {
      const result = validatePassword('Password123!');
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Password is valid.');
    });

    it('should handle password with multiple numbers', () => {
      const result = validatePassword('Password1234!');
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Password is valid.');
    });

    it('should handle password with multiple special characters', () => {
      const result = validatePassword('Password123!@#');
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Password is valid.');
    });

    it('should return invalid for password with only whitespace', () => {
      const result = validatePassword('        ');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('1 uppercase letter');
    });

    it('should handle password at boundary with multiple missing requirements', () => {
      const result = validatePassword('abcdefgh');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('1 uppercase letter');
      expect(result.message).toContain('1 number');
      expect(result.message).toContain('1 special character');
    });
  });

  describe('PASSWORD_REQUIREMENTS', () => {
    it('should export password requirements array', () => {
      expect(PASSWORD_REQUIREMENTS).toBeDefined();
      expect(Array.isArray(PASSWORD_REQUIREMENTS)).toBe(true);
      expect(PASSWORD_REQUIREMENTS.length).toBeGreaterThan(0);
    });

    it('should contain all requirement descriptions', () => {
      expect(PASSWORD_REQUIREMENTS).toContain('At least 8 characters long');
      expect(PASSWORD_REQUIREMENTS).toContain('No more than 64 characters');
      expect(PASSWORD_REQUIREMENTS).toContain('At least 1 uppercase letter (A-Z)');
      expect(PASSWORD_REQUIREMENTS).toContain('At least 1 lowercase letter (a-z)');
      expect(PASSWORD_REQUIREMENTS).toContain('At least 1 number (0-9)');
      expect(PASSWORD_REQUIREMENTS).toContain('At least 1 special character (!@#$%^&*...)');
    });
  });
});

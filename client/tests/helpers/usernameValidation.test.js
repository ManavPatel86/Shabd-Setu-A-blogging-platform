import { describe, it, expect } from 'vitest';
import {
  normalizeUsername,
  validateUsername,
  USERNAME_REQUIREMENTS_MESSAGE,
  USERNAME_RULES,
} from '@/helpers/usernameValidation';

describe('usernameValidation', () => {
  describe('normalizeUsername', () => {
    it('should return empty string for undefined', () => {
      const result = normalizeUsername(undefined);
      expect(result).toBe('');
    });

    it('should use default empty string when no argument provided', () => {
      const result = normalizeUsername();
      expect(result).toBe('');
    });

    it('should return empty string for empty string', () => {
      const result = normalizeUsername('');
      expect(result).toBe('');
    });

    it('should trim whitespace', () => {
      const result = normalizeUsername('  username  ');
      expect(result).toBe('username');
    });

    it('should convert to lowercase', () => {
      const result = normalizeUsername('USERNAME');
      expect(result).toBe('username');
    });

    it('should remove special characters', () => {
      const result = normalizeUsername('user@name!123');
      expect(result).toBe('username123');
    });

    it('should keep underscores', () => {
      const result = normalizeUsername('user_name_123');
      expect(result).toBe('user_name_123');
    });

    it('should keep numbers', () => {
      const result = normalizeUsername('user123');
      expect(result).toBe('user123');
    });

    it('should remove hyphens', () => {
      const result = normalizeUsername('user-name');
      expect(result).toBe('username');
    });

    it('should remove spaces', () => {
      const result = normalizeUsername('user name');
      expect(result).toBe('username');
    });

    it('should handle mixed case with special characters', () => {
      const result = normalizeUsername('UsEr_NaMe123!@#');
      expect(result).toBe('user_name123');
    });

    it('should handle only special characters', () => {
      const result = normalizeUsername('!@#$%^&*()');
      expect(result).toBe('');
    });

    it('should handle unicode characters', () => {
      const result = normalizeUsername('user名前');
      expect(result).toBe('user');
    });

    it('should handle emoji', () => {
      const result = normalizeUsername('user😀name');
      expect(result).toBe('username');
    });

    it('should handle consecutive underscores', () => {
      const result = normalizeUsername('user___name');
      expect(result).toBe('user___name');
    });

    it('should handle leading numbers', () => {
      const result = normalizeUsername('123username');
      expect(result).toBe('123username');
    });
  });

  describe('validateUsername', () => {
    it('should return invalid when username is undefined', () => {
      const result = validateUsername(undefined);
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Username is required.');
    });



    it('should return invalid when username is empty string', () => {
      const result = validateUsername('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Username is required.');
    });

    it('should return invalid when username is only whitespace', () => {
      const result = validateUsername('   ');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Username is required.');
    });

    it('should return invalid when username is less than 3 characters', () => {
      const result = validateUsername('ab');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Usernames must be 3-20 characters and use lowercase letters, numbers, or underscores.');
    });

    it('should return invalid when username is more than 20 characters', () => {
      const result = validateUsername('a'.repeat(21));
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Usernames must be 3-20 characters and use lowercase letters, numbers, or underscores.');
    });

    it('should normalize uppercase letters to lowercase and validate', () => {
      const result = validateUsername('UserName');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('username');
    });

    it('should remove special characters and validate remaining username', () => {
      const result = validateUsername('user@name');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('username');
    });

    it('should remove spaces and validate remaining username', () => {
      const result = validateUsername('user name');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('username');
    });

    it('should remove hyphens and validate remaining username', () => {
      const result = validateUsername('user-name');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('username');
    });

    it('should return valid for username with exactly 3 characters', () => {
      const result = validateUsername('abc');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('abc');
    });

    it('should return valid for username with exactly 20 characters', () => {
      const username = 'a'.repeat(20);
      const result = validateUsername(username);
      expect(result.isValid).toBe(true);
      expect(result.username).toBe(username);
    });

    it('should return valid for username with lowercase letters only', () => {
      const result = validateUsername('username');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('username');
    });

    it('should return valid for username with numbers', () => {
      const result = validateUsername('user123');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('user123');
    });

    it('should return valid for username with underscores', () => {
      const result = validateUsername('user_name');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('user_name');
    });

    it('should return valid for username with mixed valid characters', () => {
      const result = validateUsername('user_123_test');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('user_123_test');
    });

    it('should normalize and validate uppercase input', () => {
      const result = validateUsername('USERNAME');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('username');
    });

    it('should normalize and validate input with whitespace', () => {
      const result = validateUsername('  username  ');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('username');
    });

    it('should normalize and remove invalid characters', () => {
      const result = validateUsername('user@name!');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('username');
    });

    it('should return valid for username with only numbers', () => {
      const result = validateUsername('123456');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('123456');
    });

    it('should return valid for username with only underscores and letters', () => {
      const result = validateUsername('___user___');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('___user___');
    });

    it('should return invalid when normalized username is too short', () => {
      const result = validateUsername('a!@#$%');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Usernames must be 3-20 characters and use lowercase letters, numbers, or underscores.');
    });

    it('should return valid for username starting with underscore', () => {
      const result = validateUsername('_username');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('_username');
    });

    it('should return valid for username ending with underscore', () => {
      const result = validateUsername('username_');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('username_');
    });

    it('should return valid for username starting with number', () => {
      const result = validateUsername('123user');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('123user');
    });

    it('should return valid for username ending with number', () => {
      const result = validateUsername('user123');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('user123');
    });

    it('should normalize mixed case and validate', () => {
      const result = validateUsername('UsErNaMe123');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('username123');
    });

    it('should handle username with tab characters', () => {
      const result = validateUsername('user\tname');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('username');
    });

    it('should handle username with newline characters', () => {
      const result = validateUsername('user\nname');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('username');
    });

    it('should return invalid for username that becomes empty after normalization', () => {
      const result = validateUsername('!@#$%');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Username is required.');
    });

    it('should handle username with only valid characters at minimum length', () => {
      const result = validateUsername('a_1');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('a_1');
    });

    it('should handle username with only valid characters at maximum length', () => {
      const result = validateUsername('a'.repeat(10) + '_' + '1'.repeat(9));
      expect(result.isValid).toBe(true);
    });
  });

  describe('USERNAME_REQUIREMENTS_MESSAGE', () => {
    it('should export username requirements message', () => {
      expect(USERNAME_REQUIREMENTS_MESSAGE).toBeDefined();
      expect(typeof USERNAME_REQUIREMENTS_MESSAGE).toBe('string');
      expect(USERNAME_REQUIREMENTS_MESSAGE).toBe('Use 3-20 lowercase letters, numbers, or underscores.');
    });
  });

  describe('USERNAME_RULES', () => {
    it('should export username rules object', () => {
      expect(USERNAME_RULES).toBeDefined();
      expect(typeof USERNAME_RULES).toBe('object');
    });

    it('should have MIN_LENGTH property', () => {
      expect(USERNAME_RULES.MIN_LENGTH).toBe(3);
    });

    it('should have MAX_LENGTH property', () => {
      expect(USERNAME_RULES.MAX_LENGTH).toBe(20);
    });

    it('should have REGEX property', () => {
      expect(USERNAME_RULES.REGEX).toBeDefined();
      expect(USERNAME_RULES.REGEX).toBeInstanceOf(RegExp);
    });

    it('should have REGEX that matches valid usernames', () => {
      expect(USERNAME_RULES.REGEX.test('username')).toBe(true);
      expect(USERNAME_RULES.REGEX.test('user_123')).toBe(true);
      expect(USERNAME_RULES.REGEX.test('123')).toBe(true);
    });

    it('should have REGEX that rejects invalid usernames', () => {
      expect(USERNAME_RULES.REGEX.test('ab')).toBe(false);
      expect(USERNAME_RULES.REGEX.test('a'.repeat(21))).toBe(false);
      expect(USERNAME_RULES.REGEX.test('user@name')).toBe(false);
      expect(USERNAME_RULES.REGEX.test('User')).toBe(false);
    });
  });
});

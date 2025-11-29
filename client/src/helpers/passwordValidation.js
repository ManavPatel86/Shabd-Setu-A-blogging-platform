/**
 * Validates password strength
 * Requirements:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
const MAX_PASSWORD_LENGTH = 64;

export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: "Password is required." };
  }

  const errors = [];
  
  if (password.length < 8) {
    errors.push("at least 8 characters");
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    errors.push(`no more than ${MAX_PASSWORD_LENGTH} characters`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("1 uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("1 lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("1 number");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("1 special character");
  }

  if (errors.length > 0) {
    return { 
      isValid: false, 
      message: `Password must contain ${errors.join(", ")}.` 
    };
  }

  return { isValid: true, message: "Password is valid." };
};

export const PASSWORD_REQUIREMENTS = [
  "At least 8 characters long",
  `No more than ${MAX_PASSWORD_LENGTH} characters`,
  "At least 1 uppercase letter (A-Z)",
  "At least 1 lowercase letter (a-z)",
  "At least 1 number (0-9)",
  "At least 1 special character (!@#$%^&*...)",
];

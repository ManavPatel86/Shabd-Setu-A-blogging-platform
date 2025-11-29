const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export const normalizeUsername = (value = "") =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");

export const validateUsername = (value = "") => {
  const normalized = normalizeUsername(value);

  if (!normalized) {
    return { isValid: false, message: "Username is required." };
  }

  if (!USERNAME_REGEX.test(normalized)) {
    return {
      isValid: false,
      message: "Usernames must be 3-20 characters and use lowercase letters, numbers, or underscores.",
    };
  }

  return { isValid: true, username: normalized };
};

export const USERNAME_REQUIREMENTS_MESSAGE = "Use 3-20 lowercase letters, numbers, or underscores.";

export const USERNAME_RULES = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 20,
  REGEX: USERNAME_REGEX,
};

import VerificationToken from "../models/verificationToken.model.js";

const minutesToMs = (mins) => mins * 60 * 1000;
const DEFAULT_TTL_MINUTES = 10;

export const VERIFICATION_PURPOSES = {
  TWO_FACTOR_LOGIN: "two-factor-login",
  PASSWORD_RESET: "password-reset",
  TWO_FACTOR_TOGGLE: "two-factor-toggle",
};

const generateNumericCode = (digits = 6) => {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(min + Math.random() * (max - min)).toString();
};

export const createVerificationCode = async ({
  email,
  userId,
  purpose,
  ttlMinutes = DEFAULT_TTL_MINUTES,
  codeLength = 6,
  meta,
}) => {
  if (!email) {
    throw new Error("Email is required to create verification code.");
  }
  if (!purpose) {
    throw new Error("Purpose is required to create verification code.");
  }

  const code = generateNumericCode(codeLength);
  const expiresAt = new Date(Date.now() + minutesToMs(ttlMinutes));

  await VerificationToken.deleteMany({ email, purpose });

  const token = await VerificationToken.create({
    email,
    userId,
    purpose,
    code,
    expiresAt,
    meta,
  });

  return { token, code, expiresAt };
};

export const verifyCodeForPurpose = async ({ email, purpose, code }) => {
  if (!email || !purpose || !code) {
    const err = new Error("Email, purpose, and code are required.");
    err.code = "VERIFICATION_ARGS_MISSING";
    throw err;
  }

  const record = await VerificationToken.findOne({ email, purpose });

  if (!record) {
    const err = new Error("Verification code not found.");
    err.code = "VERIFICATION_NOT_FOUND";
    throw err;
  }

  if (record.expiresAt < new Date()) {
    await VerificationToken.deleteMany({ email, purpose });
    const err = new Error("Verification code expired.");
    err.code = "VERIFICATION_EXPIRED";
    throw err;
  }

  if (record.code !== String(code).trim()) {
    const err = new Error("Invalid verification code.");
    err.code = "VERIFICATION_INVALID";
    throw err;
  }

  await VerificationToken.deleteMany({ email, purpose });
  return record;
};

export const deleteVerificationCodes = async ({ email, purpose }) => {
  if (!email || !purpose) return;
  await VerificationToken.deleteMany({ email, purpose });
};

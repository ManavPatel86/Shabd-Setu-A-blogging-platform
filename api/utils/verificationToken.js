import VerificationToken from "../models/verificationToken.model.js";

const minutesToMs = (mins) => mins * 60 * 1000;
const DEFAULT_TTL_MINUTES = 10;
const RESEND_INTERVAL_MINUTES = Number(process.env.OTP_RESEND_INTERVAL_MINUTES) || 1;

export const VERIFICATION_PURPOSES = {
  PASSWORD_RESET: "password-reset",
};

const generateNumericCode = (digits = 6) => {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(min + Math.random() * (max - min)).toString();
};
// Export for tests to allow direct coverage of default-arg behavior
export { generateNumericCode };

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
  const now = new Date();
  const expiresAt = new Date(now.getTime() + minutesToMs(ttlMinutes));

  await VerificationToken.deleteMany({ email, purpose });

  const token = await VerificationToken.create({
    email,
    userId,
    purpose,
    code,
    expiresAt,
    meta,
    lastSentAt: now,
    resendCount: 0,
  });

  return { token, code, expiresAt };
};

export const resendVerificationCode = async ({
  email,
  purpose,
  ttlMinutes = DEFAULT_TTL_MINUTES,
  codeLength = 6,
}) => {
  if (!email || !purpose) {
    const err = new Error("Email and purpose are required to resend verification code.");
    err.code = "VERIFICATION_ARGS_MISSING";
    throw err;
  }

  const record = await VerificationToken.findOne({ email, purpose });

  if (!record) {
    const err = new Error("No reset request found for this email. Please request a new code.");
    err.code = "VERIFICATION_NOT_FOUND";
    throw err;
  }

  const now = new Date();
  const lastSentAt = record.lastSentAt ? new Date(record.lastSentAt).getTime() : null;
  if (lastSentAt && now.getTime() - lastSentAt < minutesToMs(RESEND_INTERVAL_MINUTES)) {
    const waitMs = minutesToMs(RESEND_INTERVAL_MINUTES) - (now.getTime() - lastSentAt);
    const waitSeconds = Math.ceil(waitMs / 1000);
    const err = new Error(`Resend allowed after ${waitSeconds} second(s).`);
    err.code = "RESEND_TOO_SOON";
    err.waitSeconds = waitSeconds;
    throw err;
  }

  const code = generateNumericCode(codeLength);
  const expiresAt = new Date(now.getTime() + minutesToMs(ttlMinutes));

  record.code = code;
  record.expiresAt = expiresAt;
  record.lastSentAt = now;
  record.resendCount = (record.resendCount || 0) + 1;
  await record.save();

  return { record, code, expiresAt };
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

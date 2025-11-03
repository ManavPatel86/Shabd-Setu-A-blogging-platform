import OtpCode from "../models/otpCode.model.js";

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 5);
const RESEND_INTERVAL_MINUTES = Number(process.env.OTP_RESEND_INTERVAL_MINUTES || 5);

const minutesToMs = mins => mins * 60 * 1000;

export const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createAndSendOtp = async ({ email, pendingUser, sendEmailFn }) => {
  if (!email) {
    throw new Error("Email is required to create OTP.");
  }

  if (!pendingUser) {
    throw new Error("Pending user payload is required to create OTP.");
  }

  const code = generateOtp();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + minutesToMs(OTP_EXPIRY_MINUTES));

  let otpDoc = await OtpCode.findOne({ email });

  if (!otpDoc) {
    otpDoc = new OtpCode({ email });
  }

  otpDoc.code = code;
  otpDoc.createdAt = now;
  otpDoc.expiresAt = expiresAt;
  otpDoc.lastSentAt = now;
  otpDoc.resendCount = 0;
  otpDoc.attempts = 0;
  otpDoc.pendingUser = pendingUser;

  await otpDoc.save();

  if (typeof sendEmailFn === "function") {
    await sendEmailFn({ email, code, expiresAt });
  }

  return otpDoc;
};

export const canResendOtp = (otpDoc) => {
  if (!otpDoc) return true; // no previous OTP => can send
  const now = Date.now();
  const lastSent = new Date(otpDoc.lastSentAt).getTime();
  return now - lastSent >= minutesToMs(RESEND_INTERVAL_MINUTES);
};

export const resendOtp = async ({ email, sendEmailFn }) => {
  const otpDoc = await OtpCode.findOne({ email });
  const now = new Date();

  if (!otpDoc) {
    const err = new Error("No pending verification found for this email. Please register again.");
    err.code = "OTP_NOT_FOUND";
    throw err;
  }

  if (!canResendOtp(otpDoc)) {
    const waitMs = minutesToMs(RESEND_INTERVAL_MINUTES) - (Date.now() - new Date(otpDoc.lastSentAt).getTime());
    const waitSeconds = Math.ceil(waitMs / 1000);
    const err = new Error(`Resend allowed after ${waitSeconds} second(s).`);
    err.code = "RESEND_TOO_SOON";
    err.waitSeconds = waitSeconds;
    throw err;
  }

  const code = generateOtp();
  const expiresAt = new Date(now.getTime() + minutesToMs(OTP_EXPIRY_MINUTES));
  otpDoc.code = code;
  otpDoc.createdAt = now;
  otpDoc.expiresAt = expiresAt;
  otpDoc.lastSentAt = now;
  otpDoc.resendCount = (otpDoc.resendCount || 0) + 1;

  await otpDoc.save();

  if (typeof sendEmailFn === "function") {
    await sendEmailFn({ email, code, expiresAt });
  }

  return otpDoc;
};

export const verifyOtp = async ({ email, code }) => {
  const otpDoc = await OtpCode.findOne({ email });
  if (!otpDoc) {
    const err = new Error("OTP not found or expired.");
    err.code = "OTP_NOT_FOUND";
    throw err;
  }

  if (new Date() > otpDoc.expiresAt) {
    await OtpCode.deleteMany({ email });
    const err = new Error("OTP expired. Please request a new one.");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  if (otpDoc.code !== String(code).trim()) {
    otpDoc.attempts = (otpDoc.attempts || 0) + 1;
    await otpDoc.save();
    const err = new Error("Invalid OTP code.");
    err.code = "INVALID_OTP";
    throw err;
  }

  const pendingUser = otpDoc.pendingUser;

  await OtpCode.deleteMany({ email });

  return pendingUser;
};

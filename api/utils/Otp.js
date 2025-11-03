import OtpCode from "../models/otpCode.model.js";

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 5);
const RESEND_INTERVAL_MINUTES = Number(process.env.OTP_RESEND_INTERVAL_MINUTES || 5);

const minutesToMs = mins => mins * 60 * 1000;

export const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createAndSendOtp = async ({ userId, email, sendEmailFn }) => {
  // create OTP document, send via passed sendEmailFn(email, code)
  const code = generateOtp();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + minutesToMs(OTP_EXPIRY_MINUTES));

  // delete previous otps for that user/email
  await OtpCode.deleteMany({ userId });

  const otpDoc = new OtpCode({
    userId,
    email,
    code,
    createdAt: now,
    expiresAt,
    lastSentAt: now,
    resendCount: 0
  });

  await otpDoc.save();

  // send email
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

export const resendOtp = async ({ userId, email, sendEmailFn }) => {
  // find existing OTP doc for user
  const otpDoc = await OtpCode.findOne({ userId });
  const now = new Date();

  if (!otpDoc) {
    // create new OTP
    return createAndSendOtp({ userId, email, sendEmailFn });
  }

  if (!canResendOtp(otpDoc)) {
    const waitMs = minutesToMs(RESEND_INTERVAL_MINUTES) - (Date.now() - new Date(otpDoc.lastSentAt).getTime());
    const waitSeconds = Math.ceil(waitMs / 1000);
    const waitMinutes = Math.ceil(waitSeconds / 60);
    const err = new Error(`Resend allowed after ${waitMinutes} minute(s) or ${waitSeconds} second(s)`);
    err.code = "RESEND_TOO_SOON";
    throw err;
  }

  // regenerate new code and update times/expiry/resendCount
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

export const verifyOtp = async ({ userId, email, code }) => {
  const otpDoc = await OtpCode.findOne({ userId, email });
  if (!otpDoc) {
    const err = new Error("OTP not found or expired.");
    err.code = "OTP_NOT_FOUND";
    throw err;
  }

  if (new Date() > otpDoc.expiresAt) {
    await OtpCode.deleteMany({ userId }); // cleanup
    const err = new Error("OTP expired. Please request a new one.");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  if (otpDoc.code !== String(code).trim()) {
    const err = new Error("Invalid OTP code.");
    err.code = "INVALID_OTP";
    throw err;
  }

  // success: remove OTP entries for this user
  await OtpCode.deleteMany({ userId });

  return true;
};

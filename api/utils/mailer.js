import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';
import { Verification_Email_Template} from "./EmailTemplate.js";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // upgrade with STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendOtpEmail(to, otp, purpose = 'Email verification') {
  const from = process.env.MAIL_FROM;
  const subject = `ShabdSetu - ${purpose}`;
  const text = `Your OTP is ${otp}. It is valid for ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.`;
  const html = Verification_Email_Template.replace("{verificationCode}", otp);
git 
  const info = await transporter.sendMail({ from, to, subject, text, html });
  return info;
}

export { sendOtpEmail };

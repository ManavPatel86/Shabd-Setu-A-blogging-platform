import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';
import { Verification_Email_Template} from "./EmailTemplate.js";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  secure: Number(process.env.SMTP_PORT) === 465
});

export const sendOtpEmail = async ({ to, code, expiresAt }) => {
  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to,
    subject: "ShabdSetu - Email verification code",
    html: Verification_Email_Template.replace("{verificationCode}", code)
  };

  return transporter.sendMail(mailOptions);
};



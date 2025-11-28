import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';
import { Password_Reset_Email_Template, Verification_Email_Template } from "./EmailTemplate.js";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  secure: Number(process.env.SMTP_PORT) === 465
});

const fromAddress = process.env.MAIL_FROM || process.env.FROM_EMAIL || process.env.SMTP_USER;

export const sendOtpEmail = async ({ to, code, expiresAt }) => {
  const mailOptions = {
    from: fromAddress,
    to,
    subject: "ShabdSetu - Email verification code",
    html: Verification_Email_Template.replace("{verificationCode}", code)
  };

  return transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async ({ to, code }) => {
  const mailOptions = {
    from: fromAddress,
    to,
    subject: "ShabdSetu - Password reset code",
    html: Password_Reset_Email_Template.replace("{verificationCode}", code)
  };

  return transporter.sendMail(mailOptions);
};



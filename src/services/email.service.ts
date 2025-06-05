// src/services/email.service.ts
import nodemailer from 'nodemailer';
import logger from '@/utils/logger.utils';

interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

const emailEnabled = process.env.EMAIL_SERVICE_ENABLED === 'true';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // do not fail on invalid certs if using self-signed certs in dev
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  }
});

export const sendEmail = async (options: MailOptions): Promise<void> => {
  if (!emailEnabled) {
    logger.info('Email sending is disabled. Skipping email send.');
    logger.info(`Email Details: To: ${options.to}, Subject: ${options.subject}`);
    // In a real dev scenario, you might log the HTML content or link to a file/tool like MailHog/Mailtrap.
    // console.log('HTML Content (not sent):', options.html);
    return;
  }

  try {
    const mailPayload = {
      from: process.env.SMTP_FROM_EMAIL,
      ...options,
    };
    const info = await transporter.sendMail(mailPayload);
    logger.info(`Email sent: ${info.messageId} to ${options.to}`);
  } catch (error) {
    logger.error('Error sending email:', error);
    // Depending on the criticality, you might want to throw the error
    // or handle it gracefully (e.g., retry, or just log and move on)
    // For password reset, if email fails, the user won't get the link, which is a critical failure.
    throw new Error('Failed to send email.');
  }
};

export const sendPasswordResetEmail = async (userEmail: string, resetToken: string, userName?: string | null): Promise<void> => {
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  const appName = process.env.APP_NAME || 'Our Application';
  const subject = `Password Reset Request for ${appName}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Hello ${userName || 'User'},</p>
      <p>You (or someone else) requested a password reset for your account with ${appName}.</p>
      <p>If this was you, please click the button below to reset your password. This link will expire in ${process.env.PASSWORD_RESET_TOKEN_EXPIRES_IN_HOURS || 1} hour(s).</p>
      <p style="text-align: center; margin: 20px 0;">
        <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
      </p>
      <p>If you cannot click the button, copy and paste this URL into your browser:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      <p>Thanks,<br/>The ${appName} Team</p>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject,
    html: htmlContent,
  });
};
// path: server/src/services/emailService.ts
// Email notifications via Gmail SMTP (demo) or SendGrid (production).
//
// Gmail setup:
//   1. Enable 2FA on your Google account
//   2. Generate an App Password: Google Account → Security → App Passwords
//   3. Set EMAIL_USER=yourname@gmail.com and EMAIL_PASS=<app-password> in .env
//
// SendGrid alternative (TODO for production):
//   npm install @sendgrid/mail
//   import sgMail from '@sendgrid/mail';
//   sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
//   await sgMail.send({ to, from, subject, text });

import nodemailer from 'nodemailer';

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

export async function sendComplaintCreatedEmail(
  to: string,
  complaintId: string,
  category: string,
): Promise<void> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[Email] Skipped (no credentials). Would notify ${to} about ${complaintId}`);
    return;
  }
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"NEETHIVAAN Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Complaint Received – ${complaintId}`,
      html: `
        <h2>Your complaint has been received</h2>
        <p><strong>Reference ID:</strong> ${complaintId}</p>
        <p><strong>Category:</strong> ${category}</p>
        <p>Our team will review your complaint and update you shortly.</p>
        <hr/><small>NEETHIVAAN – AI-Driven Legal Awareness Portal</small>
      `,
    });
    console.log(`[Email] Sent complaint creation notice to ${to}`);
  } catch (err) {
    console.error('[Email] Failed to send complaint created email:', err);
  }
}

export async function sendStatusUpdateEmail(
  to: string,
  complaintId: string,
  newStatus: string,
): Promise<void> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[Email] Skipped. Would notify ${to}: ${complaintId} → ${newStatus}`);
    return;
  }
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"NEETHIVAAN Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Complaint Status Updated – ${complaintId}`,
      html: `
        <h2>Status Update for Your Complaint</h2>
        <p><strong>Reference ID:</strong> ${complaintId}</p>
        <p><strong>New Status:</strong> ${newStatus}</p>
        <p>Login to the portal to view full details.</p>
        <hr/><small>NEETHIVAAN – AI-Driven Legal Awareness Portal</small>
      `,
    });
    console.log(`[Email] Sent status update notice to ${to}`);
  } catch (err) {
    console.error('[Email] Failed to send status update email:', err);
  }
}

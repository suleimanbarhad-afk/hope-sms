import nodemailer from "nodemailer";

let transporter = null;

const initTransporter = () => {
  if (transporter) return transporter;

  // If no email configured, disable silently
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn("⚠️  Email not configured (EMAIL_USER/EMAIL_PASSWORD missing)");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  return transporter;
};

/**
 * Send an email. Fails silently if email not configured.
 *
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 * @param {string} [options.text]
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const t = initTransporter();
  if (!t) {
    console.log(`📭 [Email disabled] Would send to ${to}: ${subject}`);
    return { skipped: true };
  }

  try {
    const info = await t.sendMail({
      from: `"Hope Secondary School" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || subject,
    });
    console.log(`📧 Email sent to ${to}: ${subject}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};
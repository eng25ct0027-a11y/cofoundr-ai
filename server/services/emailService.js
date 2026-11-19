const nodemailer = require('nodemailer');
const config = require('../config/env');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!config.smtp.host || !config.smtp.user) return null;
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const mailer = getTransporter();
  if (!mailer) {
    console.log('\n[email] SMTP is not configured. Preview below:');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  ${text}\n`);
    return { preview: true };
  }
  await mailer.sendMail({
    from: config.smtp.from,
    to,
    subject,
    text,
    html,
  });
  return { preview: false };
}

async function sendPasswordResetEmail(user, resetUrl) {
  return sendMail({
    to: user.email,
    subject: 'Reset your CoFoundr AI password',
    text: `Hi ${user.name},\n\nReset your password using this link (valid for 30 minutes):\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>Hi ${user.name},</p><p>Reset your CoFoundr AI password using the link below. It is valid for 30 minutes.</p><p><a href="${resetUrl}">Reset my password</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
  });
}

module.exports = { sendMail, sendPasswordResetEmail };

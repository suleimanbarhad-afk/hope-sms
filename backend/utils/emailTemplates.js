const baseTemplate = (title, bodyContent) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .header { background: #2563eb; color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; }
    .content { padding: 30px 24px; color: #334155; line-height: 1.6; }
    .content h2 { color: #1e293b; margin-top: 0; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .footer { background: #f8fafc; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
    .info-box { background: #f1f5f9; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 16px 0; border-radius: 4px; }
    .info-box p { margin: 4px 0; }
    .badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Hope Secondary School</h1>
    </div>
    <div class="content">
      <h2>${title}</h2>
      ${bodyContent}
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Hope Secondary School. All rights reserved.<br>
      This email was sent from an automated system.
    </div>
  </div>
</body>
</html>
`;

export const welcomeEmail = ({ firstName, email, password, role }) => {
  const roleLabel = role === "lecturer" ? "Lecturer" : "Student";
  return {
    subject: `Welcome to Hope Secondary School - ${roleLabel} Portal`,
    html: baseTemplate(
      `Welcome, ${firstName}!`,
      `
        <p>Your ${roleLabel.toLowerCase()} account has been created successfully.</p>
        <div class="info-box">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>
        <p>Please change your password after your first login for security.</p>
        <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/login" class="btn">Login to Portal</a>
        <p style="color: #64748b; font-size: 14px;">
          If you didn't request this, please contact the administrator.
        </p>
      `
    ),
  };
};

export const passwordResetEmail = ({ firstName, resetLink }) => ({
  subject: "Password Reset Request — Hope Secondary School",
  html: baseTemplate(
    `Password Reset`,
    `
      <p>Hi ${firstName},</p>
      <p>We received a request to reset your password. Click the button below to create a new one:</p>
      <a href="${resetLink}" class="btn">Reset Password</a>
      <p style="color: #64748b; font-size: 14px;">
        This link expires in <strong>10 minutes</strong>. If you didn't request this, you can safely ignore this email.
      </p>
      <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
        Or copy this link: <br>
        <code style="background: #f1f5f9; padding: 4px; border-radius: 3px;">${resetLink}</code>
      </p>
    `
  ),
});

export const resultPublishedEmail = ({ firstName, course, grade, totalMarks }) => ({
  subject: `New Result Published — ${course.code}`,
  html: baseTemplate(
    `Your Result is Ready`,
    `
      <p>Hi ${firstName},</p>
      <p>A new result has been published for you:</p>
      <div class="info-box">
        <p><strong>Course:</strong> ${course.code} · ${course.name}</p>
        <p><strong>Total Marks:</strong> ${totalMarks} / 100</p>
        <p><strong>Grade:</strong> <span class="badge">${grade}</span></p>
      </div>
      <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/student/results" class="btn">View All Results</a>
    `
  ),
});

export const paymentVerifiedEmail = ({ firstName, amount, reference }) => ({
  subject: `Payment Verified — $${amount}`,
  html: baseTemplate(
    `Payment Confirmed`,
    `
      <p>Hi ${firstName},</p>
      <p>Your payment has been verified and recorded:</p>
      <div class="info-box">
        <p><strong>Amount:</strong> $${amount}</p>
        <p><strong>Reference:</strong> ${reference}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/student/fees" class="btn">View Fees</a>
    `
  ),
});

export const announcementEmail = ({ firstName, title, description, priority }) => ({
  subject: `📢 ${title}`,
  html: baseTemplate(
    title,
    `
      <p>Hi ${firstName},</p>
      <div class="info-box">
        <p><strong>Priority:</strong> <span class="badge">${priority}</span></p>
      </div>
      <p>${description}</p>
      <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/student/announcements" class="btn">View Announcements</a>
    `
  ),
});
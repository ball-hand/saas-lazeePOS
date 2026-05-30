import nodemailer from 'nodemailer';

let transporter = null;

const initMailer = () => {
  const service = process.env.MAIL_SERVICE || 'gmail';
  const user = process.env.MAIL_FROM || process.env.MAIL_USER;
  const pass = process.env.MAIL_PASSWORD;

  if (!user || !pass) {
    console.warn('⚠️  Email service not configured. Password reset emails will not be sent.');
    console.warn('Set MAIL_SERVICE, MAIL_FROM, and MAIL_PASSWORD in .env');
    return null;
  }

  transporter = nodemailer.createTransport({
    service,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
};

export const sendResetPasswordEmail = async (email, resetLink) => {
  if (!transporter) {
    transporter = initMailer();
  }

  if (!transporter) {
    console.warn('Mailer not configured, skipping email send');
    return false;
  }

  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: email,
    subject: '🔑 Reset Password - LazeePOS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Password Request</h2>
        <p>Hi,</p>
        <p>Kami menerima permintaan untuk mereset password akun Anda di LazeePOS.</p>
        <p>Klik link di bawah untuk mereset password (valid selama 1 jam):</p>
        <div style="margin: 20px 0;">
          <a href="${resetLink}" style="background-color: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Atau copy link ini ke browser:</p>
        <p style="word-break: break-all; color: #666;">${resetLink}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          Jika Anda tidak meminta reset password, abaikan email ini.
          <br/>Jangan bagikan link ini kepada siapa pun.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Reset password email sent:', info.response);
    return true;
  } catch (error) {
    console.error('Failed to send reset password email:', error);
    return false;
  }
};

export const sendVerificationEmail = async (email, verificationLink) => {
  if (!transporter) {
    transporter = initMailer();
  }

  if (!transporter) {
    console.warn('Mailer not configured, skipping email send');
    return false;
  }

  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: email,
    subject: '✅ Verifikasi Email - LazeePOS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verifikasi Email</h2>
        <p>Terima kasih telah mendaftar di LazeePOS!</p>
        <p>Klik link di bawah untuk memverifikasi email Anda:</p>
        <div style="margin: 20px 0;">
          <a href="${verificationLink}" style="background-color: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verifikasi Email
          </a>
        </div>
        <p>Link berlaku selama 24 jam.</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          — Tim LazeePOS
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.response);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
};

export const sendDunningEmail = async (email, tenantName, subject, body) => {
  if (!transporter) {
    transporter = initMailer();
  }

  if (!transporter) {
    console.warn('Mailer not configured, skipping dunning email send');
    return false;
  }

  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">Payment Reminder</h2>
        <p>Pemilik Toko: <strong>${tenantName}</strong></p>
        <p>${body}</p>
        <div style="margin: 20px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://lazeepos.com'}/central/billing" 
             style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Bayar Sekarang
          </a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          — Tim LazeePOS
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Dunning email sent:', info.response);
    return true;
  } catch (error) {
    console.error('Failed to send dunning email:', error);
    return false;
  }
};

export default {
  initMailer,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendDunningEmail,
};

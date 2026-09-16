const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_USER !== 'your_email@gmail.com') {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return null;
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`[Email Mock - Not Sent to Real SMTP]: To: ${to} | Subject: ${subject}`);
      return { success: true, mocked: true };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Nexus Gaming" <noreply@nexusgaming.com>',
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Sent]: Message ID: ${info.messageId}`);
    return { success: true, info };
  } catch (error) {
    console.error(`[Email Error]: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };

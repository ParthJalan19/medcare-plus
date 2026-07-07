const nodemailer = require('nodemailer');

let transporter;

const getTransporter = async () => {
  if (transporter) return transporter;

  const hasSMTP = process.env.SMTP_HOST && process.env.SMTP_PORT;

  if (hasSMTP) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('Nodemailer: Configured using custom SMTP settings');
  } else {
    // Generate test SMTP service from ethereal.email
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass  // generated ethereal password
        }
      });
      console.log(`Nodemailer: Configured using Ethereal Test Account (${testAccount.user})`);
    } catch (err) {
      console.error('Nodemailer initialization failed, falling back to local mock logger:', err.message);
      // Fallback local mock logger
      transporter = {
        sendMail: async (mailOptions) => {
          console.log('--- LOCAL MOCK MAIL LOGGER ---');
          console.log(`To: ${mailOptions.to}`);
          console.log(`Subject: ${mailOptions.subject}`);
          console.log(`Body: ${mailOptions.text || mailOptions.html}`);
          console.log('------------------------------');
          return { messageId: 'local-mock-id', messageUrl: '#' };
        }
      };
    }
  }

  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const tx = await getTransporter();
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@medcareplus.com',
      to,
      subject,
      text,
      html
    };

    const info = await tx.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return info;
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
    return null;
  }
};

module.exports = { sendEmail };

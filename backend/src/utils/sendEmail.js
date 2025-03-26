// utils/sendEmail.js (continued)
const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // Create test account if SMTP settings not provided
  let transporter;
  
  if (process.env.SMTP_HOST && process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
    // Use configured SMTP server
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      }
    });
  } else {
    // Create a test account on ethereal.email for development
    console.log('No SMTP configuration found, using test account');
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  // Define email options
  const message = {
    from: `${process.env.FROM_NAME || 'Hot Fridge'} <${process.env.FROM_EMAIL || 'noreply@hotfridge.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  // Send email
  const info = await transporter.sendMail(message);

  // Log URL for test accounts
  if (!process.env.SMTP_HOST) {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }

  return info;
};

module.exports = sendEmail;
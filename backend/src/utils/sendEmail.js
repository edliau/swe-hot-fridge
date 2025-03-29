// utils/sendEmail.js (enhanced version)
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

  // Generate HTML content if not provided
  let htmlContent = options.html;
  
  if (!htmlContent) {
    if (options.template === 'verification') {
      htmlContent = getVerificationEmailTemplate(options.verificationUrl, options.userName);
    } else if (options.template === 'reset') {
      htmlContent = getPasswordResetTemplate(options.resetUrl, options.userName);
    } else {
      // Default simple format
      htmlContent = `<p>${options.message}</p>`;
    }
  }

  // Define email options
  const message = {
    from: `${process.env.FROM_NAME || 'Hot Fridge'} <${process.env.FROM_EMAIL || 'noreply@hotfridge.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message, // Plain text version
    html: htmlContent
  };

  // Send email
  const info = await transporter.sendMail(message);

  // Log URL for test accounts
  if (!process.env.SMTP_HOST) {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }

  return info;
};

// Email templates
const getVerificationEmailTemplate = (verificationUrl, name) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 580px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f5a9c9; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #fff; padding: 20px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; background-color: #f5a9c9; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
        .footer { margin-top: 20px; font-size: 12px; color: #888; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Hot Fridge</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Hello ${name || 'there'},</p>
          <p>Thank you for signing up with Hot Fridge. Please verify your email address by clicking the button below:</p>
          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email</a>
          </p>
          <p>If you didn't create an account with Hot Fridge, please ignore this email.</p>
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p>${verificationUrl}</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Hot Fridge. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const getPasswordResetTemplate = (resetUrl, name) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 580px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f5a9c9; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #fff; padding: 20px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; background-color: #f5a9c9; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
        .footer { margin-top: 20px; font-size: 12px; color: #888; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Hot Fridge</h1>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>Hello ${name || 'there'},</p>
          <p>You are receiving this email because you (or someone else) has requested to reset your password.</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 10 minutes.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Hot Fridge. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = sendEmail;
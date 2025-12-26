const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configure email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send verification email
const sendVerificationEmail = async (email, firstName, token) => {
  const transporter = createTransporter();
  // Generate a shorter 6-digit code from the token for easy manual entry
  const verificationCode = token.substring(0, 6).toUpperCase();

  const mailOptions = {
    from: `"Quran App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🕌 Verify Your Email - Quran App',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #2EBBC3 0%, #14b8a6 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
                      🕌 Quran App
                    </h1>
                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
                      Connect with the Quran like never before
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                      Welcome, ${firstName}! 👋
                    </h2>
                    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 24px;">
                      Thank you for joining our community! We're excited to have you start your spiritual journey with us.
                    </p>
                    <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 24px;">
                      To complete your registration and unlock all features, please enter this verification code in the app:
                    </p>

                    <!-- Verification Code Box -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <div style="display: inline-block; background: linear-gradient(135deg, #2EBBC3 0%, #14b8a6 100%); padding: 24px 48px; border-radius: 16px; box-shadow: 0 4px 12px rgba(46, 187, 195, 0.3);">
                            <p style="margin: 0 0 8px 0; color: #ffffff; font-size: 14px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                              Your Verification Code
                            </p>
                            <p style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                              ${verificationCode}
                            </p>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Instructions -->
                    <div style="margin-top: 30px; padding: 20px; background-color: #f0f9ff; border-radius: 12px; border-left: 4px solid #2EBBC3;">
                      <p style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
                        📱 How to verify:
                      </p>
                      <ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 24px;">
                        <li>Go back to the Quran App</li>
                        <li>Enter the 6-digit code shown above</li>
                        <li>Tap "Verify" to complete your registration</li>
                      </ol>
                    </div>

                    <!-- Expiry Notice -->
                    <div style="margin-top: 30px; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px;">
                      <p style="margin: 0; color: #92400e; font-size: 14px;">
                        <strong>⏰ Important:</strong> This verification code will expire in 24 hours.
                      </p>
                    </div>

                    <!-- Security Note -->
                    <p style="margin: 30px 0 0 0; color: #9ca3af; font-size: 13px; line-height: 18px;">
                      If you didn't create an account with Quran App, please ignore this email and no account will be created.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                      Need help? Contact us at support@quranapp.com
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © 2024 Quran App. All rights reserved.
                    </p>
                    <div style="margin-top: 15px;">
                      <a href="#" style="color: #2EBBC3; text-decoration: none; margin: 0 10px; font-size: 12px;">Privacy Policy</a>
                      <a href="#" style="color: #2EBBC3; text-decoration: none; margin: 0 10px; font-size: 12px;">Terms of Service</a>
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent successfully:', info.messageId);
    console.log('📧 Email sent to:', email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send welcome email after verification
const sendWelcomeEmail = async (email, firstName) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Quran App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎉 Welcome to Quran App - Your Account is Verified!',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
        <table width="100%" style="background-color: #f0f9ff; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden;">
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px;">✅ Account Verified!</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #1a1a1a; margin-top: 0;">Welcome aboard, ${firstName}! 🎉</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 24px;">
                      Your email has been successfully verified! You now have full access to all features:
                    </p>
                    <ul style="color: #4b5563; font-size: 16px; line-height: 28px;">
                      <li>📖 Complete Quran with multiple translations</li>
                      <li>🎯 Interactive quizzes to test your knowledge</li>
                      <li>📚 Islamic topics and hadiths</li>
                      <li>📊 Track your reading progress</li>
                      <li>🌙 Daily Ayah notifications</li>
                    </ul>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.FRONTEND_URL}" style="display: inline-block; background: linear-gradient(135deg, #2EBBC3 0%, #14b8a6 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 600;">
                        Start Reading Now
                      </a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send password reset email with OTP
const sendPasswordResetEmail = async (email, firstName, resetToken) => {
  const transporter = createTransporter();
  // Generate a shorter 6-digit code from the token for easy manual entry
  const resetCode = resetToken.substring(0, 6).toUpperCase();

  const mailOptions = {
    from: `"Quran App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Reset Your Password - Quran App',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
                      🔐 Quran App
                    </h1>
                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
                      Password Reset Request
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                      Hi ${firstName}, 👋
                    </h2>
                    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 24px;">
                      We received a request to reset your password for your Quran App account.
                    </p>
                    <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 24px;">
                      To reset your password, please enter this verification code in the app:
                    </p>

                    <!-- Reset Code Box -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <div style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 24px 48px; border-radius: 16px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">
                            <p style="margin: 0 0 8px 0; color: #ffffff; font-size: 14px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                              Your Reset Code
                            </p>
                            <p style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                              ${resetCode}
                            </p>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Instructions -->
                    <div style="margin-top: 30px; padding: 20px; background-color: #fef2f2; border-radius: 12px; border-left: 4px solid #ef4444;">
                      <p style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
                        📱 How to reset your password:
                      </p>
                      <ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 24px;">
                        <li>Go back to the Quran App</li>
                        <li>Enter the 6-digit code shown above</li>
                        <li>Create a new strong password</li>
                        <li>Tap "Reset Password" to confirm</li>
                      </ol>
                    </div>

                    <!-- Expiry Notice -->
                    <div style="margin-top: 30px; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px;">
                      <p style="margin: 0; color: #92400e; font-size: 14px;">
                        <strong>⏰ Important:</strong> This reset code will expire in 1 hour for security reasons.
                      </p>
                    </div>

                    <!-- Security Note -->
                    <div style="margin-top: 30px; padding: 16px; background-color: #fee2e2; border-left: 4px solid #ef4444; border-radius: 8px;">
                      <p style="margin: 0; color: #991b1b; font-size: 14px;">
                        <strong>🔒 Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged and your account is secure.
                      </p>
                    </div>

                    <!-- Additional Help -->
                    <p style="margin: 30px 0 0 0; color: #9ca3af; font-size: 13px; line-height: 18px;">
                      If you're having trouble resetting your password, please contact our support team at support@quranapp.com
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                      Need help? Contact us at support@quranapp.com
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © 2024 Quran App. All rights reserved.
                    </p>
                    <div style="margin-top: 15px;">
                      <a href="#" style="color: #ef4444; text-decoration: none; margin: 0 10px; font-size: 12px;">Privacy Policy</a>
                      <a href="#" style="color: #ef4444; text-decoration: none; margin: 0 10px; font-size: 12px;">Terms of Service</a>
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully:', info.messageId);
    console.log('📧 Email sent to:', email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
};

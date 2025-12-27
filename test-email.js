// Test Email Service
require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('📧 Testing Email Service...\n');
console.log('Email User:', process.env.EMAIL_USER);
console.log('Email Password:', process.env.EMAIL_PASSWORD ? '***configured***' : '❌ NOT SET');
console.log('');

const testEmail = async () => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  try {
    // Verify connection
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP Connection successful!');
    console.log('');

    // Send test email
    console.log('📨 Sending test email...');
    const info = await transporter.sendMail({
      from: `"Test Quran App" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: '🧪 Test Email - Quran App',
      html: `
        <h1>Test Email</h1>
        <p>If you received this email, your email service is working correctly!</p>
        <p>Timestamp: ${new Date().toLocaleString()}</p>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('');
    console.log('🎉 Email service is working properly!');
  } catch (error) {
    console.error('❌ Email service error:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('');

    if (error.code === 'EAUTH') {
      console.log('⚠️  Authentication failed! Possible reasons:');
      console.log('   1. Gmail App Password expired or revoked');
      console.log('   2. Incorrect email or password');
      console.log('   3. Gmail account blocked');
      console.log('');
      console.log('🔧 FIX:');
      console.log('   1. Go to: https://myaccount.google.com/apppasswords');
      console.log('   2. Create a new App Password');
      console.log('   3. Update EMAIL_PASSWORD in .env file');
    } else if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT') {
      console.log('⚠️  Network connection error!');
      console.log('   Check your internet connection');
    } else {
      console.log('⚠️  Unknown error occurred');
      console.log('   Full error:', error);
    }
  }
};

testEmail();

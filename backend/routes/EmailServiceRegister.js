import nodemailer from 'nodemailer';

// Create transporter for registration emails
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'infobusquick@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'BusQuick4433'
  }
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Registration Email config error:', error);
  } else {
    console.log('✓ Registration Email server ready');
  }
});

// Send registration email
export const sendRegistrationEmail = async (email, name) => {
  try {
    const info = await transporter.sendMail({
      from: '"BusQuick" <infobusquick@gmail.com>',
      to: email,
      subject: 'Welcome to BusQuick! 🚌',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .feature { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚌 Welcome to BusQuick!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}! 👋</h2>
            <p>Thank you for registering with BusQuick.</p>
            
            <div class="feature">
              <strong>🎫 Easy Booking</strong><br>Book tickets in just a few clicks
            </div>
            <div class="feature">
              <strong>💳 Secure Payments</strong><br>Pay safely with Mobile Money or Bank Transfer
            </div>
            <div class="feature">
              <strong>📧 Instant Tickets</strong><br>Receive your e-tickets immediately
            </div>
            <div class="feature">
              <strong>⏰ Trip Reminders</strong><br>Get notified 1 hour before departure
            </div>
            
            <p>Start booking your trips today!</p>
            <p>Safe travels! 🛣️</p>
          </div>
        </body>
        </html>
      `
    });
    
    console.log(`✓ Welcome email sent to ${email}`);
    console.log(`Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending registration email:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response
    });
    throw error;
  }
};

export default sendRegistrationEmail;

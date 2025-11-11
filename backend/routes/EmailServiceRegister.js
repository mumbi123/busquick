// backend/utils/sendRegistrationEmail.js
import * as Brevo from '@getbrevo/brevo';

// Initialise API client
const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.EMAIL_PASSWORD
);

/**
 * Send welcome email after registration
 * @param {string} email - recipient address
 * @param {string} name  - recipient first name
 */
export const sendRegistrationEmail = async (email, name) => {
  try {
    console.log(`Sending welcome email to: ${email}`);

    const sendSmtpEmail = {
      sender: { name: 'BusQuick', email: 'lesachama@gmail.com' },
      to: [{ email, name }],
      subject: 'Welcome to BusQuick!',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;}
            .header {background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:30px;text-align:center;}
            .content {padding:30px;background:#f9f9f9;}
            .feature {background:white;padding:15px;margin:10px 0;border-left:4px solid #667eea;}
          </style>
        </head>
        <body>
          <div class="header"><h1>Welcome to BusQuick!</h1></div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Thank you for registering with BusQuick.</p>
            <div class="feature"><strong>Easy Booking</strong><br>Book tickets in just a few clicks</div>
            <div class="feature"><strong>Secure Payments</strong><br>Pay safely with Mobile Money or Bank Transfer</div>
            <div class="feature"><strong>Instant Tickets</strong><br>Receive your e-tickets immediately</div>
            <div class="feature"><strong>Trip Reminders</strong><br>Get notified 1 hour before departure</div>
            <p>Start booking your trips today!</p>
            <p>Safe travels!</p>
          </div>
        </body>
        </html>
      `,
    };

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log(`Email sent to ${email} – MessageId: ${result.body.messageId}`);
    return { success: true, messageId: result.body.messageId };
  } catch (err) {
    console.error('Failed to send registration email:', err.message || err);
    throw err;
  }
};

export default sendRegistrationEmail;

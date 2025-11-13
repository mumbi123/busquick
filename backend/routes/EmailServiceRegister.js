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
    console.log(`📧 Sending welcome email to: ${email}`);
    
    const sendSmtpEmail = {
      sender: { name: 'BusQuick', email: 'infobusquick@gmail.com' },
      to: [{ email, name }],
      subject: 'Welcome to BusQuick! 🚌',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Welcome to BusQuick!</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f4f4f4; color: #333; }
            .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #1bb152 0%, #16a085 100%); padding: 30px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 26px; font-weight: 600; }
            .content { padding: 30px; line-height: 1.7; }
            .greeting { font-size: 18px; font-weight: 600; margin-bottom: 10px; }
            .features { display: grid; gap: 12px; margin: 20px 0; }
            .feature { display: flex; align-items: center; background: #f0fdf4; padding: 12px; border-radius: 8px; border-left: 4px solid #1bb152; }
            .feature strong { margin-left: 10px; color: #1a1a1a; }
            .btn { display: inline-block; background: #1bb152; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; text-align: center; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 13px; color: #666; }
            @media (max-width: 600px) { .content { padding: 20px; } .header { padding: 25px; } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚌 BusQuick</h1>
            </div>
            <div class="content">
              <p class="greeting">Welcome, ${name}! 👋</p>
              <p>Your account is ready. Start booking your next trip in seconds!</p>

              <div class="features">
                <div class="feature">✅ Easy Booking – One-tap reservations</div>
                <div class="feature">💳 Secure Payment – Mobile Money & Bank Transfer</div>
                <div class="feature">📧 Instant E-Tickets – In your inbox immediately</div>
                <div class="feature">⏰ Trip Reminder – 1 hour before departure</div>
              </div>

              <p style="text-align: center;">
                <a href="https://busquick-frontend-final.onrender.com/" class="btn">Continue to Book</a>
              </p>

              <p><strong>Our Office:</strong><br>
              Cairo Road, 10101, Lusaka, Zambia</p>

              <p style="margin-top: 25px; color: #555;">
                <em>The BusQuick Team</em><br>
                <strong>Travel Safe 🛣️</strong>
              </p>
            </div>
            <div class="footer">
              &copy; 2025 BusQuick. All rights reserved.<br>
              <a href="#" style="color: #1bb152; text-decoration: none;">Unsubscribe</a> • <a href="#" style="color: #1bb152; text-decoration: none;">Support</a>
            </div>
          </div>
        </body>
        </html>
      `,
      textContent: `
Welcome to BusQuick, ${name}!

Your account is ready.

Features:
- Easy booking
- Secure payment (Mobile Money & Bank)
- Instant e-tickets
- Trip reminder 1 hour before

Continue booking: https://busquick-frontend-final.onrender.com/

Address: Cairo Road, 10101, Lusaka, Zambia

The BusQuick Team
Travel Safe
      `
    };
    
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email sent to ${email} – MessageId: ${result.body.messageId}`);
    return { success: true, messageId: result.body.messageId };
  } catch (err) {
    console.error('❌ Failed to send registration email:', err.message || err);
    throw err;
  }
};

export default sendRegistrationEmail;

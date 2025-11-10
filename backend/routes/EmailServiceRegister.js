
export const sendRegistrationEmail = async (email, name) => {
  try {
    console.log(`📧 Sending welcome email to: ${email}`);
    
    const apiKey = process.env.MAILJET_API_KEY;
    const apiSecret = process.env.MAILJET_API_SECRET;
    
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    
    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: "lesachama@gmail.com",
              Name: "BusQuick"
            },
            To: [
              {
                Email: email,
                Name: name
              }
            ],
            Subject: "Welcome to BusQuick! 🚌",
            HTMLPart: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                  .content { padding: 30px; background: #f9f9f9; }
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
          }
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.ErrorMessage || 'Failed to send email');
    }

    console.log(`✅ Welcome email sent to ${email}`);
    console.log(`✅ Message ID: ${data.Messages[0].To[0].MessageID}`);
    return { success: true, messageId: data.Messages[0].To[0].MessageID };
  } catch (error) {
    console.error('❌ Error sending registration email:', error);
    console.error('❌ Error details:', error.message);
    throw error;
  }
};

console.log('✓ Email service ready (Mailjet API)');

export default sendRegistrationEmail;



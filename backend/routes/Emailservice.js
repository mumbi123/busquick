import nodemailer from 'nodemailer';

// Create transporter for booking and reminder emails
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user:'mosesmumbilesa@gmail.com',
    pass:'Culturemadeus1?.'
  }
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Booking Email config error:', error);
  } else {
    console.log('✓ Booking Email server ready');
  }
});

// Send booking confirmation with PDF
export const sendBookingConfirmation = async (bookingData, pdfBuffer) => {
  try {
    const { email, name, bookingId, origin, destination, departureDate, departureTime, seats, totalPrice, busName } = bookingData;
    
    const info = await transporter.sendMail({
      from: '"BusQuick Bookings" <infobusquick@gmail.com>',
      to: email,
      subject: `Booking Confirmed - ${bookingId} 🎫`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .label { font-weight: 600; color: #666; }
            .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="font-size: 48px;">✓</div>
            <h1>Booking Confirmed!</h1>
            <p style="margin: 0;">Booking: ${bookingId}</p>
          </div>
          
          <div class="content">
            <h2>Hello ${name}! 👋</h2>
            <p>Your bus ticket has been successfully booked and payment confirmed.</p>
            
            <div class="details">
              <h3 style="margin-top: 0; color: #11998e;">📍 Trip Details</h3>
              <div class="detail-row">
                <span class="label">From:</span>
                <span>${origin}</span>
              </div>
              <div class="detail-row">
                <span class="label">To:</span>
                <span>${destination}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date:</span>
                <span>${new Date(departureDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="label">Departure Time:</span>
                <span>${departureTime}</span>
              </div>
              <div class="detail-row">
                <span class="label">Bus:</span>
                <span>${busName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Seat(s):</span>
                <span>${Array.isArray(seats) ? seats.join(', ') : seats}</span>
              </div>
              <div class="detail-row" style="border-bottom: none; font-weight: bold; font-size: 18px; color: #11998e;">
                <span class="label">Total Paid:</span>
                <span>ZMW ${totalPrice}</span>
              </div>
            </div>
            
            <div class="alert">
              <strong>⏰ Reminder:</strong> You will receive an automatic reminder 1 hour before departure. Please arrive 30-45 minutes early.
            </div>
            
            <p><strong>📎 Your E-Ticket:</strong><br>
            Your ticket is attached as a PDF. Present this (printed or on mobile) when boarding.</p>
            
            <p>Have a safe journey! 🚌</p>
          </div>
        </body>
        </html>
      `,
      attachments: pdfBuffer ? [{
        filename: `BusQuick-Ticket-${bookingId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }] : []
    });
    
    console.log(`✓ Booking confirmation sent to ${email}`);
    console.log(`Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending booking confirmation:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response
    });
    throw error;
  }
};

// Send trip reminder
export const sendTripReminder = async (bookingData) => {
  try {
    const { email, name, bookingId, origin, destination, departureDate, departureTime, seats, busName } = bookingData;
    
    const info = await transporter.sendMail({
      from: '"BusQuick Reminders" <infobusquick@gmail.com>',
      to: email,
      subject: `⏰ Trip Reminder - Departing in 1 Hour!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .urgent-box { background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .trip-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .info-row { padding: 10px 0; border-bottom: 1px solid #eee; }
            .checklist { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .checklist-item { padding: 8px 0; border-bottom: 1px dashed #eee; }
          </style>
        </head>
        <body>
          <div class="header">
            <p style="font-size: 60px; margin: 0;">⏰</p>
            <h1>Trip Reminder</h1>
            <h2 style="margin: 10px 0;">Departing in 1 Hour!</h2>
          </div>
          
          <div class="content">
            <h2>Hello ${name}! 👋</h2>
            
            <div class="urgent-box">
              <h3 style="margin-top: 0; color: #856404;">🚨 Your Trip is Starting Soon!</h3>
              <p style="font-size: 18px; margin: 10px 0;">
                <strong>Departure Time: ${departureTime}</strong>
              </p>
              <p style="margin: 0; color: #856404;">
                Please arrive at least 30-45 minutes early
              </p>
            </div>
            
            <div class="trip-info">
              <h3 style="margin-top: 0; color: #f5576c;">📍 Trip Information</h3>
              <div class="info-row"><strong>Booking:</strong> ${bookingId}</div>
              <div class="info-row"><strong>From:</strong> ${origin}</div>
              <div class="info-row"><strong>To:</strong> ${destination}</div>
              <div class="info-row"><strong>Date:</strong> ${new Date(departureDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div class="info-row"><strong>Time:</strong> <span style="color: #f5576c; font-size: 18px;">${departureTime}</span></div>
              <div class="info-row"><strong>Bus:</strong> ${busName}</div>
              <div class="info-row" style="border-bottom: none;"><strong>Seat(s):</strong> ${Array.isArray(seats) ? seats.join(', ') : seats}</div>
            </div>
            
            <div class="checklist">
              <h3 style="margin-top: 0;">✅ Pre-Departure Checklist</h3>
              <div class="checklist-item">✓ Have your e-ticket ready (printed or on mobile)</div>
              <div class="checklist-item">✓ Bring a valid ID document</div>
              <div class="checklist-item">✓ Arrive 30-45 minutes before departure</div>
              <div class="checklist-item">✓ Check your luggage allowance</div>
              <div class="checklist-item" style="border-bottom: none;">✓ Have the booking reference handy</div>
            </div>
            
            <p>Have a safe journey! 🚌</p>
          </div>
        </body>
        </html>
      `
    });
    
    console.log(`✓ Trip reminder sent to ${email}`);
    console.log(`Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending trip reminder:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response
    });
    throw error;
  }
};

export default { sendBookingConfirmation, sendTripReminder };

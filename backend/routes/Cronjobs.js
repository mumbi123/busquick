import cron from 'node-cron';
import Booking from '../model/bookingModel.js';
import { sendTripReminder } from './emailService.js';

// Initialize cron jobs
export const initializeCronJobs = () => {
  // Run every 5 minutes to check for trips departing in 1 hour
  cron.schedule('*/5 * * * *', async () => {
    console.log('⏰ Checking for trip reminders...');
    await checkAndSendTripReminders();
  });

  console.log('✓ Cron jobs initialized - checking every 5 minutes');
};

// Check and send trip reminders
const checkAndSendTripReminders = async () => {
  try {
    const now = new Date();
    
    // Find bookings departing in 55-65 minutes (to catch 1 hour window)
    const reminderWindowStart = new Date(now.getTime() + 55 * 60 * 1000);
    const reminderWindowEnd = new Date(now.getTime() + 65 * 60 * 1000);

    const bookingsNeedingReminder = await Booking.find({
      reminderSent: { $ne: true },
      status: 'confirmed'
    }).populate('bus').populate('user', 'name email');

    // Filter bookings by departure time
    const bookingsToRemind = bookingsNeedingReminder.filter(booking => {
      if (!booking.bus || !booking.bus.date || !booking.bus.departureTime) {
        return false;
      }

      // Parse departure date and time
      const [hours, minutes] = booking.bus.departureTime.split(':');
      const departureDateTime = new Date(booking.bus.date);
      departureDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      return departureDateTime >= reminderWindowStart && departureDateTime <= reminderWindowEnd;
    });

    console.log(`Found ${bookingsToRemind.length} bookings needing reminders`);

    for (const booking of bookingsToRemind) {
      try {
        await sendTripReminder({
          email: booking.user.email,
          name: booking.user.name,
          bookingId: booking._id.toString().substring(0, 16),
          origin: booking.bus.from,
          destination: booking.bus.to,
          departureDate: booking.bus.date,
          departureTime: booking.bus.departureTime,
          seats: booking.seats,
          busName: booking.bus.name || booking.bus.companyName
        });

        // Mark reminder as sent
        booking.reminderSent = true;
        booking.reminderSentAt = new Date();
        await booking.save();

        console.log(`✓ Reminder sent for booking ${booking._id}`);
      } catch (error) {
        console.error(`Error sending reminder for ${booking._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in reminder cron job:', error);
  }
};

// Manual reminder trigger (for testing)
export const sendManualReminder = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('bus')
      .populate('user', 'name email');
    
    if (!booking) {
      throw new Error('Booking not found');
    }

    await sendTripReminder({
      email: booking.user.email,
      name: booking.user.name,
      bookingId: booking._id.toString().substring(0, 16),
      origin: booking.bus.from,
      destination: booking.bus.to,
      departureDate: booking.bus.date,
      departureTime: booking.bus.departureTime,
      seats: booking.seats,
      busName: booking.bus.name || booking.bus.companyName
    });

    booking.reminderSent = true;
    booking.reminderSentAt = new Date();
    await booking.save();

    return { success: true };
  } catch (error) {
    console.error('Error sending manual reminder:', error);
    throw error;
  }
};

export default { initializeCronJobs, sendManualReminder };

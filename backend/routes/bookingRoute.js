import express from 'express';
import Booking from '../model/bookingModel.js';
import Bus from '../model/busModel.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Route to get all bookings (admin only) or user-specific bookings - public for testing, but logic checks role
router.get('/', async (req, res) => {
  try {
    // If no auth, return empty or public message (adjust as needed)
    if (!req.userId) {
      return res.status(200).json({
        message: 'Public access: No bookings shown without login',
        data: [],
        success: true,
      });
    }

    const userId = req.userId;
    const userRole = req.userRole;

    // If user is admin, fetch all bookings
    if (userRole === 'admin') {
      const bookings = await Booking.find()
        .populate('bus')
        .populate('user', 'name email')
        .sort({ createdAt: -1 });
      
      return res.status(200).json({
        message: 'All bookings retrieved successfully', 
        data: bookings,
        success: true,
      });
    }
    
    // For regular users, fetch only their bookings
    const bookings = await Booking.find({ user: userId })
      .populate('bus')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'User bookings retrieved successfully',
      data: bookings,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      message: 'Failed to fetch bookings',
      success: false,
      error: error.message,
    });
  }
});

// Legacy/alias route - redirect to root logic (optional, can remove if not needed)
router.get('/user-bookings', async (req, res) => {
  res.redirect('/api/bookings');  // Or call the same handler function
});

// Route to book seats (protected)
router.post('/book-seat', authMiddleware, async (req, res) => {
  try {
    const { bus, seats, transactionId, totalPrice, passengerDetails, paymentMethod } = req.body;
    const userId = req.userId;

    // Validate required fields
    if (!bus || !seats || !transactionId || !totalPrice) {
      return res.status(400).json({
        message: 'Missing required fields',
        success: false,
      });
    }

    // Check if bus exists
    const busRecord = await Bus.findById(bus);
    if (!busRecord) {
      return res.status(404).json({
        message: 'Bus not found',
        success: false,
      });
    }

    // Check if any of the selected seats are already booked
    const alreadyBookedSeats = seats.filter(seat =>
      busRecord.seatsBooked.includes(seat)
    );

    if (alreadyBookedSeats.length > 0) {
      return res.status(400).json({
        message: `Seats ${alreadyBookedSeats.join(', ')} are already booked`,
        success: false,
      });
    }

    // Create a new booking document
    const newBooking = new Booking({
      user: userId,
      bus,
      seats,
      transactionId,
      totalPrice,
      passengerDetails,
      paymentMethod,
      status: 'confirmed'
    });

    // Save the new booking to the database
    await newBooking.save();

    // Update the bus's booked seats
    busRecord.seatsBooked = [...busRecord.seatsBooked, ...seats];
    await busRecord.save();

    // Populate the booking with bus details for response
    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('bus')
      .populate('user', 'name email');

    res.status(201).json({
      message: 'Booking created successfully',
      data: populatedBooking,
      success: true,
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({
      message: 'Booking failed',
      success: false,
      error: error.message,
    });
  }
});

// Route to cancel a booking (protected)
router.put('/cancel/:bookingId', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;

    // Find the booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found',
        success: false,
      });
    }

    // Check if the booking belongs to the user or user is admin
    if (booking.user.toString() !== userId && userRole !== 'admin') {
      return res.status(403).json({
        message: 'Unauthorized to cancel this booking',
        success: false,
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        message: 'Booking is already cancelled',
        success: false,
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    await booking.save();

    // Remove seats from bus's booked seats
    const busRecord = await Bus.findById(booking.bus);
    if (busRecord) {
      busRecord.seatsBooked = busRecord.seatsBooked.filter(
        seat => !booking.seats.includes(seat)
      );
      await busRecord.save();
    }

    res.status(200).json({
      message: 'Booking cancelled successfully',
      data: booking,
      success: true,
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      message: 'Failed to cancel booking',
      success: false,
      error: error.message,
    });
  }
});

// Route to delete a booking (protected)
router.delete('/delete/:bookingId', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;

    // Find the booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found',
        success: false,
      });
    }

    // Check if the booking belongs to the user or user is admin
    if (booking.user.toString() !== userId && userRole !== 'admin') {
      return res.status(403).json({
        message: 'Unauthorized to delete this booking',
        success: false,
      });
    }

    // Before deleting, deallocate seats from the associated bus
    const busRecord = await Bus.findById(booking.bus);
    if (busRecord) {
      busRecord.seatsBooked = busRecord.seatsBooked.filter(
        (seat) => !booking.seats.includes(seat)
      );
      await busRecord.save();
    }

    // Delete the booking from the database
    await Booking.deleteOne({ _id: bookingId });

    res.status(200).json({
      message: 'Booking deleted successfully',
      success: true,
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      message: 'Failed to delete booking',
      success: false,
      error: error.message,
    });
  }
});

export default router;

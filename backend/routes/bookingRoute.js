import express from 'express';
import Booking from '../model/bookingModel.js';
import Bus from '../model/busModel.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { sendBookingConfirmation } from '../services/emailService.js';

const router = express.Router();

// Get bookings (existing route)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;

    if (userRole === 'admin') {
      const bookings = await Booking.find()
        .populate('bus')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .lean();
      
      return res.status(200).json({
        message: 'All bookings retrieved successfully', 
        data: bookings,
        success: true,
      });
    }
    
    const bookings = await Booking.find({ user: userId })
      .populate('bus')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();

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

// User bookings route
router.get('/user-bookings', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    const bookings = await Booking.find({ user: userId })
      .populate('bus')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      message: 'User bookings retrieved successfully',
      data: bookings,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      message: 'Failed to fetch bookings',
      success: false,
      error: error.message,
    });
  }
});

// Book seat route with email confirmation
router.post('/book-seat', authMiddleware, async (req, res) => {
  try {
    const { bus, seats, transactionId, totalPrice, passengerDetails, paymentMethod } = req.body;
    const userId = req.userId;

    if (!bus || !seats || !transactionId || !totalPrice) {
      return res.status(400).json({
        message: 'Missing required fields',
        success: false,
      });
    }

    if (!Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        message: 'Seats must be a non-empty array',
        success: false,
      });
    }

    const busRecord = await Bus.findById(bus);
    if (!busRecord) {
      return res.status(404).json({
        message: 'Bus not found',
        success: false,
      });
    }

    const alreadyBookedSeats = seats.filter(seat =>
      busRecord.seatsBooked.includes(seat)
    );

    if (alreadyBookedSeats.length > 0) {
      return res.status(400).json({
        message: `Seats ${alreadyBookedSeats.join(', ')} are already booked`,
        success: false,
      });
    }

    const newBooking = new Booking({
      user: userId,
      bus,
      seats,
      transactionId,
      totalPrice,
      passengerDetails,
      paymentMethod,
      status: 'confirmed',
      bookingDate: new Date()
    });

    await newBooking.save();

    busRecord.seatsBooked = [...busRecord.seatsBooked, ...seats];
    await busRecord.save();

    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('bus')
      .populate('user', 'name email');

    // Send booking confirmation email (non-blocking)
    sendBookingConfirmation({
      email: populatedBooking.user.email,
      name: populatedBooking.user.name,
      bookingId: populatedBooking._id.toString().substring(0, 16),
      origin: busRecord.from,
      destination: busRecord.to,
      departureDate: busRecord.date,
      departureTime: busRecord.departureTime,
      seats: populatedBooking.seats,
      totalPrice: populatedBooking.totalPrice,
      busName: busRecord.name || busRecord.companyName
    }, null) // null for PDF buffer - we'll add PDF generation later if needed
      .then(() => console.log(`✓ Booking confirmation sent to ${populatedBooking.user.email}`))
      .catch(err => console.error('Email error:', err));

    res.status(201).json({
      message: 'Booking created successfully! Check your email for confirmation.',
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

// Cancel booking route
router.put('/cancel/:bookingId', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found',
        success: false,
      });
    }

    if (booking.user.toString() !== userId && userRole !== 'admin') {
      return res.status(403).json({
        message: 'Unauthorized to cancel this booking',
        success: false,
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        message: 'Booking is already cancelled',
        success: false,
      });
    }

    booking.status = 'cancelled';
    await booking.save();

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

// Delete booking route
router.delete('/delete/:bookingId', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found',
        success: false,
      });
    }

    if (booking.user.toString() !== userId && userRole !== 'admin') {
      return res.status(403).json({
        message: 'Unauthorized to delete this booking',
        success: false,
      });
    }

    const busRecord = await Bus.findById(booking.bus);
    if (busRecord) {
      busRecord.seatsBooked = busRecord.seatsBooked.filter(
        (seat) => !booking.seats.includes(seat)
      );
      await busRecord.save();
    }

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

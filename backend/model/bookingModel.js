import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true,
  },
  seats: {
    type: [Number], // More specific type for seats array
    required: true,
    validate: {
      validator: function(seats) {
        return seats.length > 0;
      },
      message: 'At least one seat must be selected'
    }
  }, 
  transactionId: {
    type: String,
    required: true,
    unique: true, // Ensure transaction IDs are unique
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0, // Price cannot be negative
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },
  passengerDetails: {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    emergencyPhone: {
      type: String,
      required: true,
    }
  },
  paymentMethod: {
    type: String,
    enum: ['mobile', 'bank'],
    required: true,
  },
  // Additional fields for better booking management
  bookingDate: {
    type: Date,
    default: Date.now,
  },
  cancelledAt: {
    type: Date,
  },
  cancellationReason: {
    type: String,
  }
}, {
  timestamps: true,
});

export default mongoose.model('Booking', bookingSchema);
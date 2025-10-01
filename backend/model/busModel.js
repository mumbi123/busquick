import mongoose from 'mongoose';

// Define the bus schema
const busSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true,
      default: 'Bus Company'
    },
    number: { 
      type: String, 
      required: true,
      unique: false, 
      trim: true 
    },
    capacity: {  
      type: Number, 
      required: true,
      min: 1,
      max: 100,
      default: 65
    },
    drivername: { 
      type: String, 
      required: true,
      trim: true 
    },
    from: { 
      type: String, 
      required: true,
      trim: true 
    },
    to: { 
      type: String, 
      required: true,
      trim: true 
    },
    intermediateStops: [{
      city: { type: String, required: true, trim: true },
      dropoff: { type: String, required: true, trim: true },
      arrivalTime: { type: String },
      additionalPrice: { type: Number, default: 0 }
    }],
    journeydate: { 
      type: Date, 
      required: true 
    },
    arrivaldate: { 
      type: Date, 
      required: true 
    },
    price: { 
      type: Number, 
      required: true,
      min: 0,
      default: 0
    },
    departure: { 
      type: String, 
      required: true,
      validate: {
        validator: (v) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
        message: 'Departure time must be in HH:MM format'
      }
    },
    arrival: { 
      type: String, 
      required: true,
      validate: {
        validator: (v) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
        message: 'Arrival time must be in HH:MM format'
      }
    },
    pickup: { 
      type: String, 
      required: true,
      trim: true,
      default: 'Main Station'
    },
    dropoff: { 
      type: String, 
      required: true,
      trim: true,
      default: 'Main Station'
    },
    amenities: {
      ac: { type: Boolean, default: false },
      wifi: { type: Boolean, default: false },
      tv: { type: Boolean, default: false },
      charger: { type: Boolean, default: false },
      bathroom: { type: Boolean, default: false },
      luggage: { type: Boolean, default: false }
    },
    status: { 
      type: String, 
      enum: ['Yet To Start', 'Running', 'Completed', 'Cancelled'],
      default: 'Yet To Start' 
    },
    seatsBooked: { 
      type: [String], 
      default: []
    },
    availableSeats: {
      type: Number,
      default: function() {
        return this.capacity || 50;
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isFullyBooked: {
      type: Boolean,
      default: false
    },
    parentBus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      default: null
    },
    busGroupId: {
      type: String,
      default: function() {
        return this._id.toString();
      }
    },
    isSegment: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Pre-save middleware to handle time formatting
busSchema.pre('save', function(next) {
  // Format arrival time if it's a Date object
  if (this.arrival instanceof Date) {
    const hours = this.arrival.getHours().toString().padStart(2, '0');
    const minutes = this.arrival.getMinutes().toString().padStart(2, '0');
    this.arrival = `${hours}:${minutes}`;
  }
  
  // Format departure time if it's a Date object
  if (this.departure instanceof Date) {
    const hours = this.departure.getHours().toString().padStart(2, '0');
    const minutes = this.departure.getMinutes().toString().padStart(2, '0');
    this.departure = `${hours}:${minutes}`;
  }
  
  next();
});

// Index for better performance on search queries
busSchema.index({ from: 1, to: 1, journeydate: 1, isActive: 1 });
busSchema.index({ busGroupId: 1 });

// Drop the unique index on the 'number' field if it exists
mongoose.connection.on('connected', async () => {
  try {
    const indexes = await mongoose.connection.db.collection('buses').indexes();
    const numberIndex = indexes.find(index => index.name === 'number_1');
    if (numberIndex) {
      await mongoose.connection.db.collection('buses').dropIndex('number_1');
      console.log('Dropped unique index on number field');
    }
  } catch (error) {
    console.error('Error dropping unique index on number field:', error);
  }
});

const Bus = mongoose.model('Bus', busSchema);

export default Bus;
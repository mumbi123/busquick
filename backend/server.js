import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/dbConfig.js';  // Database connection
import userRoutes from './routes/userRoute.js';
import busesRoute from './routes/busesRoute.js';
import bookingRoute from './routes/bookingRoute.js';
import priceRoute from './routes/PriceRoute.js';
import paymentRoutes from './routes/paymentRoute.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: ['http://localhost:5173','https://busquick-frontend-final.onrender.com' ] // Allow React app to connect
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());

// Route middleware
app.use('/api/users', userRoutes);
app.use('/api/buses', busesRoute);
app.use('/api/booking', bookingRoute);
app.use('/api/prices', priceRoute)
app.use('/api/bookings', bookingRoute);
app.use('/api/payment', paymentRoutes);

// Catch malformed URL errors
app.use((req, res, next) => {
  try {
    decodeURIComponent(req.path);
    next();
  } catch (e) {
    console.warn('Malformed URL intercepted:', req.url);
    res.status(400).json({ error: 'Invalid URL encoding' });
  }
});

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});

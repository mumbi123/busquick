// src/components/Summary.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../resources/Summary.css';

// Configure axios base URL
const API_BASE_URL = import.meta.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://busquick.onrender.com';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to fetch current user from backend
const fetchCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await api.get('/api/users/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch user');
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Helper function to get user ID from various sources
const getUserId = (propsUserId) => {
  if (propsUserId) return propsUserId;
  const storedUserId = localStorage.getItem('userId');
  if (storedUserId) return storedUserId;
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const parsedUser = JSON.parse(user);
      if (parsedUser.id || parsedUser._id) {
        return parsedUser.id || parsedUser._id;
      }
    } catch (e) {}
  }
  const sessionUserId = sessionStorage.getItem('userId');
  if (sessionUserId) return sessionUserId;
  return null;
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

function Summary({
  name = '',
  phone = '',
  emergencyPhone = '',
  selectedSeats = [],
  paymentMethod = 'mobile',
  busPrice = 0,
  busName = '', 
  fromCity = '',
  toCity = '',
  departureTime = '',
  arrivalTime = '',
  date = '',
  driversName = '', 
  busId = '',
  userId = '',
  handleClose = () => {},
  onBookingSuccess = () => {}
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const user = await fetchCurrentUser();
        setCurrentUser(user);
        localStorage.setItem('userId', user._id || user.id);
        localStorage.setItem('user', JSON.stringify(user));
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        setError('Failed to authenticate user. Please log in again.');
      }
    };

    const existingUserId = getUserId(userId);
    if (!existingUserId) {
      getCurrentUser();
    }
  }, [userId]);

  // Handle scroll to hide indicator
  useEffect(() => {
    const handleScroll = (e) => {
      const container = e.target;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      
      // Hide indicator after user scrolls or when near bottom
      if (scrollTop > 50 || (scrollHeight - scrollTop - clientHeight < 100)) {
        setShowScrollIndicator(false);
      }
    };

    // Auto-hide after 4 seconds
    const timer = setTimeout(() => {
      setShowScrollIndicator(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const totalAmount = selectedSeats.length * busPrice;

  const handleConfirm = async () => {
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      let finalUserId = getUserId(userId);
      
      if (!finalUserId && currentUser) {
        finalUserId = currentUser._id || currentUser.id;
      }
      
      if (!finalUserId) {
        try {
          const user = await fetchCurrentUser();
          finalUserId = user._id || user.id;
          setCurrentUser(user);
          localStorage.setItem('userId', finalUserId);
          localStorage.setItem('user', JSON.stringify(user));
        } catch (fetchError) {
          console.error('Failed to fetch user:', fetchError);
        }
      }
      
      if (!token) {
        throw new Error('Authentication token is missing. Please log in again.');
      }
      
      if (!finalUserId) {
        throw new Error('User ID is missing. Please log in again or check your session.');
      }
      
      if (!busId) {
        throw new Error('Bus ID is missing. Please select a bus first.');
      }
      
      if (!selectedSeats || selectedSeats.length === 0) {
        throw new Error('No seats selected. Please select at least one seat.');
      }
      
      if (!name || name.trim() === '') {
        throw new Error('Passenger name is required.');
      }
      
      if (!phone || phone.trim() === '') {
        throw new Error('Phone number is required.');
      }

      const bookingData = {
        user: finalUserId,
        bus: { _id: busId, name: busName, from: fromCity, to: toCity, departureTime, arrivalTime, date, driverName: driversName },
        seats: selectedSeats,
        totalPrice: totalAmount,
        passengerDetails: {
          name: name.trim(),
          phone: phone.trim(),
          emergencyPhone: emergencyPhone ? emergencyPhone.trim() : ''
        },
        paymentMethod: paymentMethod || 'mobile',
        tripDetails: {
          busName,
          fromCity,
          toCity,
          departureTime,
          arrivalTime,
          date,
          driversName,
          busPrice
        }
      };

      console.log('Navigating to payment with booking data:', bookingData);

      // Store in localStorage as a fallback
      localStorage.setItem('pendingBooking', JSON.stringify(bookingData));
      
      handleClose();
      
      // Pass booking data via navigate state
      navigate('/payment', {
        state: {
          bus: bookingData.bus,
          seats: bookingData.seats,
          totalPrice: bookingData.totalPrice,
          passengerDetails: bookingData.passengerDetails
        }
      });

    } catch (err) {
      console.error('Validation error:', err);
      let errorMessage = err.message || 'Please correct the following issues';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="summary-modal-overlay">
      <div 
        className="summary-modal-container"
        onScroll={(e) => {
          const container = e.target;
          const scrollTop = container.scrollTop;
          const scrollHeight = container.scrollHeight;
          const clientHeight = container.clientHeight;
          
          // Hide indicator after user scrolls or when near bottom
          if (scrollTop > 50 || (scrollHeight - scrollTop - clientHeight < 100)) {
            setShowScrollIndicator(false);
          }
        }}
      >
        <button className="close-button" onClick={handleClose} disabled={isLoading}>
          <i className="ri-close-line"></i>
        </button>

        {/* Scroll Indicator for Mobile */}
        {showScrollIndicator && (
          <div className="scroll-indicator">
            <i className="ri-arrow-down-line"></i>
          </div>
        )}

        <div className="summary-header">
          <h2>Booking Summary</h2>
          <div className="trip-route">
            <span className="city">{fromCity}</span>
            <i className="ri-arrow-right-line"></i>
            <span className="city">{toCity}</span>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <i className="ri-error-warning-line"></i>
            {error}
          </div>
        )}

        <div className="summary-content">
          {/* Trip Overview */}
          <div className="summary-card trip-overview">
            <div className="card-header">
              <i className="ri-bus-line"></i>
              <span>Trip Details</span>
            </div>
            <div className="trip-info">
              <div className="info-row">
                <div className="bus-info">
                  <span className="bus-name">{busName}</span>
                  <span className="date">{formatDate(date)}</span>
                </div>
                <div className="time-info">
                  <span className="time">{departureTime} - {arrivalTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Passenger & Seats */}
          <div className="summary-card passenger-seats">
            <div className="card-header">
              <i className="ri-user-line"></i>
              <span>Passenger & Seats</span>
            </div>
            <div className="passenger-info">
              <div className="info-item">
                <span className="label">Passenger</span>
                <span className="value">{name}</span>
              </div>
              <div className="info-item">
                <span className="label">Seats</span>
                <span className="value seats-list">
                  {selectedSeats.sort((a, b) => a - b).join(', ')}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Phone</span>
                <span className="value">{phone}</span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="summary-card payment-summary">
            <div className="card-header">
              <i className="ri-money-dollar-circle-line"></i>
              <span>Payment Summary</span>
            </div>
            <div className="payment-info">
              <div className="price-breakdown">
                <div className="price-item">
                  <span>{selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} × K{busPrice}</span>
                  <span>K{totalAmount}</span>
                </div>
              </div>
              <div className="total-amount">
                <span>Total Amount</span>
                <span>K{totalAmount}</span>
              </div>
              <div className="payment-method">
                <span>Payment via {paymentMethod === 'mobile' ? 'Mobile Money' : 'Bank Transfer'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="summary-actions">
          <button 
            className="cancel-btn" 
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="confirm-btn"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="ri-loader-4-line spinning"></i>
                Processing...
              </>
            ) : (
              <>
                <i className="ri-secure-payment-line"></i>
                Proceed to Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Summary;

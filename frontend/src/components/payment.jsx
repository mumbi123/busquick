// src/components/Payment.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../resources/payment.css';

const API_BASE_URL = import .meta.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://busquick.onrender.com';

// Notification Component
const Notification = ({ message, type, onTryAgain, onCancel, show }) => {
  if (!show) return null;
  
  return (
    <div className="notification-overlay">
      <div className={`notification ${type}`}>
        <div className="notification-content">
          <div className="notification-icon">
            {type === 'error' ? '' : type === 'success' ? '✅' : 'ℹ️'}
          </div>
          <p>{message}</p>
          <div className="notification-actions">
            {onTryAgain && (
              <button className="btn-try-again" onClick={onTryAgain}>
                Try Again
              </button>
            )}
            {onCancel && (
              <button className="btn-cancel" onClick={onCancel}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const loadLencoScript = () => {
  return new Promise((resolve, reject) => {
    if (window.LencoPay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://pay.lenco.co/js/v1/inline.js';
    script.async = true;
    script.onload = () => {
      if (!window.LencoPay) {
        reject(new Error('LencoPay not initialized after script load'));
      } else {
        resolve();
      }
    };
    script.onerror = () => reject(new Error('Failed to load LencoPay script'));
    document.body.appendChild(script);
  });
};

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  let initialState = location.state || {};
  if (!initialState.bus && localStorage.getItem('pendingBooking')) {
    try {
      const storedBooking = JSON.parse(localStorage.getItem('pendingBooking'));
      initialState = {
        bus: storedBooking.bus,
        seats: storedBooking.seats,
        totalPrice: storedBooking.totalPrice,
        passengerDetails: storedBooking.passengerDetails
      };
    } catch (err) {
      console.error('Error parsing pendingBooking from localStorage:', err);
    }
  }
  
  const { bus, seats, totalPrice, passengerDetails } = initialState;

  const [name, setName] = useState(passengerDetails?.name || '');
  const [phone, setPhone] = useState(passengerDetails?.phone || '');
  const [amount, setAmount] = useState(totalPrice || '');
  const [otp, setOtp] = useState('');
  const [reference, setReference] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'info'
  });

  const email = 'support@busquick.co.zm'; // Fixed email

  // Format phone number for saving (converts 0XXXXXXXXX to +260XXXXXXXXX)
  const formatPhoneForPayment = (phoneValue) => {
    if (!phoneValue) return '';
    
    const cleaned = phoneValue.replace(/[^\d+]/g, '');
    
    // If number starts with 0 and has 10 digits, convert to +260
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return '+260' + cleaned.substring(1);
    }
    
    // If number starts with 260 (without +), add the +
    if (cleaned.startsWith('260') && cleaned.length === 12) {
      return '+' + cleaned;
    }
    
    // If number already has proper format or other international format, return as is
    return cleaned.startsWith('+') ? cleaned : cleaned;
  };

  // Format phone number input (allow international format)
  const formatPhoneNumber = (value) => {
    // Remove all non-digit and non-plus characters
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // Ensure it starts with + if user adds it
    if (cleaned.startsWith('+')) {
      // Limit to 13 characters total (+XXXXXXXXXXXX)
      return cleaned.substring(0, 13);
    } else {
      // If no +, limit to 12 digits
      return cleaned.substring(0, 12);
    }
  };

  // Handle phone input change with auto-formatting
  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  // Get display hint for phone formatting
  const getPhoneHint = (phoneValue) => {
    const cleaned = phoneValue.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `Will be used as: +260${cleaned.substring(1)}`;
    }
    return '';
  };

  const showNotification = (message, type = 'info', showActions = false) => {
    setNotification({
      show: true,
      message,
      type,
      showActions
    });
  };

  const hideNotification = () => {
    setNotification({ show: false, message: '', type: 'info' });
  };

  const mapPaymentMethod = (channel) => {
    const channelMap = {
      'mobile-money': 'mobile',
      'card': 'card',
      'bank': 'bank'
    };
    return channelMap[channel] || 'mobile';
  };

  useEffect(() => {
    loadLencoScript()
      .then(() => setScriptLoaded(true))
      .catch((err) => {
        console.error('Error loading LencoPay script:', err);
        showNotification('Failed to load payment system. Please refresh the page.', 'error', true);
      });

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, []);

  const validateInputs = () => {
    // Format the phone number before validation
    const formattedPhone = formatPhoneForPayment(phone);
    const phoneRegex = /^\+260\d{9}$/;
    
    if (!phoneRegex.test(formattedPhone)) {
      return 'Please enter a valid Zambian phone number (e.g., 0977123456 or +260977123456)';
    }
    if (!name.trim()) {
      return 'Name is required';
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return 'Amount must be a valid positive number';
    }
    if (bus && (!seats?.length || !totalPrice || !passengerDetails)) {
      return 'Missing booking details. Please go back to selection.';
    }
    return null;
  };

  const initiatePayment = async () => {
    if (!scriptLoaded || !window.LencoPay) {
      showNotification('Payment system not ready. Please try again.', 'error', true);
      return;
    }

    const publicKey = import.meta.env.VITE_LENCO_PUBLIC_KEY || 'pub-060bad0d346b88a8505deb903de28a51847ee1c095fa5543';
    if (!publicKey) {
      showNotification('Payment configuration error. Please contact support.', 'error', true);
      return;
    }

    const validationError = validateInputs();
    if (validationError) {
      showNotification(validationError, 'error', true);
      return;
    }

    setLoading(true);
    hideNotification();
    setPaymentStatus('processing');

    const ref = 'ref-' + Date.now();
    setReference(ref);

    const [firstName, ...lastNameParts] = name.trim().split(' ');
    const lastName = lastNameParts.join(' ') || 'N/A';

    // Ensure phone number is properly formatted for payment
    const formattedPhone = formatPhoneForPayment(phone);

    const paymentData = {
      key: publicKey,
      reference: ref,
      email: email,
      amount: parseFloat(amount).toFixed(2),
      currency: 'ZMW',
      channels: ['card', 'mobile-money'],
      customer: {
        firstName: firstName || 'Customer',
        lastName: lastName,
        phone: formattedPhone, // Use the formatted phone number
      },
    };

    try {
      window.LencoPay.getPaid({
        ...paymentData,
        onSuccess: async (response) => {
          setLoading(false);
          await handlePaymentSuccess(response);
        },
        onClose: () => {
          setLoading(false);
          setPaymentStatus(null);
          showNotification('Payment was not completed', 'error', true);
        },
        onConfirmationPending: () => {
          setLoading(false);
          setPaymentStatus('pay-offline');
          showNotification('Please authorize the payment on your mobile phone.', 'info');
          startPolling(ref);
        },
      });
    } catch (err) {
      console.error('LencoPay.getPaid failed:', err);
      setLoading(false);
      setPaymentStatus(null);
      showNotification('Failed to open payment window. Please try again.', 'error', true);
    }
  };

  const handlePaymentSuccess = async (response) => {
    try {
      const verifyResponse = await fetch(`${API_BASE_URL}/api/payment/verify/${response.reference}`);
      const data = await verifyResponse.json();

      if (!verifyResponse.ok && verifyResponse.status !== 401) {
        throw new Error(data.error || 'Failed to verify payment');
      }

      const status = data.data?.data?.status;
      
      if (status === 'successful' || verifyResponse.status === 401) {
        await createBooking(response.reference, response.channel);
      } else if (status === 'otp-required') {
        setPaymentStatus('otp-required');
        setReference(response.reference);
        showNotification('Check your phone for the OTP.', 'info');
      } else {
        setPaymentStatus('pending');
        startPolling(response.reference);
      }
    } catch (err) {
      console.error('Verification error:', err);
      showNotification('Payment verification failed. Please try again.', 'error', true);
      setPaymentStatus(null);
    }
  };

  const createBooking = async (transactionId, channel = null) => {
    if (!bus || !seats?.length || !totalPrice || !passengerDetails) {
      showNotification('Booking data incomplete. Contact support with ref: ' + transactionId, 'error', true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('Please log in again.', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const mappedPaymentMethod = channel ? mapPaymentMethod(channel) : 'mobile';
      
      // Ensure the phone number in passenger details is properly formatted
      const updatedPassengerDetails = {
        ...passengerDetails,
        phone: formatPhoneForPayment(passengerDetails.phone || phone)
      };
      
      const bookingResponse = await axios.post(`${API_BASE_URL}/api/bookings/book-seat`, {
        bus,
        seats,
        transactionId,
        totalPrice,
        passengerDetails: updatedPassengerDetails,
        paymentMethod: mappedPaymentMethod,
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (bookingResponse.data.success) {
        const event = new CustomEvent('bookingUpdated', { detail: bookingResponse.data.data });
        window.dispatchEvent(event);
        setPaymentStatus('success');
        setReference(transactionId);
        localStorage.removeItem('pendingBooking');
        showNotification('Payment and booking successful!', 'success');
        setTimeout(() => navigate('/bookings'), 3000);
      } else {
        throw new Error(bookingResponse.data.message || 'Booking creation failed');
      }
    } catch (bookingErr) {
      console.error('Booking creation error:', bookingErr);
      showNotification(`Payment succeeded, but booking failed. Contact support with ref: ${transactionId}`, 'error', true);
    }
  };

  const submitOtp = async () => {
    if (!/^\d{4,6}$/.test(otp)) {
      showNotification('OTP must be 4-6 digits', 'error');
      return;
    }

    setLoading(true);
    hideNotification();

    try {
      const response = await fetch(`${API_BASE_URL}/api/payment/submit-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, otp }),
      });

      const data = await response.json();

      if (!response.ok && response.status !== 401) {
        throw new Error(data.error || 'Failed to submit OTP');
      }

      const collectionStatus = data.data?.data?.status;

      if (collectionStatus === 'successful') {
        await createBooking(reference);
      } else if (collectionStatus === 'pay-offline') {
        setPaymentStatus('pay-offline');
        startPolling(reference);
      } else {
        setPaymentStatus('pending');
        startPolling(reference);
      }
    } catch (err) {
      console.error('OTP submission error:', err);
      showNotification('OTP submission failed. Please try again.', 'error', true);
      setPaymentStatus('pending');
      startPolling(reference);
    } finally {
      setLoading(false);
      setOtp('');
    }
  };

  const verifyPayment = async (ref) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payment/verify/${ref}`);
      const data = await response.json();

      if (!response.ok && response.status !== 401) {
        throw new Error(data.error || 'Failed to verify payment');
      }

      const status = data.data?.data?.status;

      if (status === 'successful') {
        await createBooking(ref);
        stopPolling();
      } else if (status === 'failed') {
        setPaymentStatus(null);
        showNotification('Payment failed. Please try again.', 'error', true);
        stopPolling();
      } else if (status === 'otp-required') {
        setPaymentStatus('otp-required');
        showNotification('Check your phone for the OTP.', 'info');
        stopPolling();
      }
    } catch (err) {
      console.error('Verification error:', err);
    }
  };

  const startPolling = (ref) => {
    if (pollingInterval) return;
    const interval = setInterval(() => verifyPayment(ref), 5000);
    setPollingInterval(interval);
    
    setTimeout(() => {
      stopPolling();
      if (paymentStatus === 'pending' || paymentStatus === 'pay-offline') {
        showNotification('Payment verification timeout. Please check with support.', 'error', true);
        setPaymentStatus(null);
      }
    }, 300000);
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    initiatePayment();
  };

  const handleTryAgain = () => {
    hideNotification();
    setPaymentStatus(null);
    setLoading(false);
  };

  const handleCancel = () => {
    hideNotification();
    navigate('/');
  };

  return (
    <>
      <Notification
        message={notification.message}
        type={notification.type}
        show={notification.show}
        onTryAgain={notification.showActions ? handleTryAgain : null}
        onCancel={notification.showActions ? handleCancel : null}
      />

      <div className="payment-wrapper">
        <div className="payment-container">
          <div className="payment-header">
            <div className="amount-display">
              <span className="currency">K</span>
              <span className="amount-value">{amount}</span>
            </div>
            <h2>Complete Your Payment</h2>
          </div>

          <form onSubmit={handleSubmit} className="payment-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading || paymentStatus === 'success'}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                disabled={loading || paymentStatus === 'success'}
                placeholder="Enter phone number (e.g., 0977123456 or +260977123456)"
                required
              />
              {getPhoneHint(phone) && (
                <div className="format-hint" style={{color: '#10b981', fontSize: '12px', marginTop: '4px'}}>
                  {getPhoneHint(phone)}
                </div>
              )}
            </div>

            {paymentStatus === 'otp-required' && (
              <div className="otp-section">
                <label>Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={loading}
                  placeholder="Enter 4-6 digit OTP"
                  maxLength="6"
                  required
                />
                <button
                  type="button"
                  className="otp-submit-button"
                  onClick={submitOtp}
                  disabled={loading || !otp}
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            )}

            <button
              type="submit"
              className={`pay-button ${loading ? 'loading' : ''}`}
              disabled={
                loading || 
                !scriptLoaded || 
                paymentStatus === 'success' || 
                paymentStatus === 'otp-required' || 
                paymentStatus === 'processing'
              }
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  <span className="pay-icon"></span>
                  Pay with Lenco
                </>
                )}
            </button>
          </form>

          {paymentStatus === 'success' && (
            <div className="success-status">
              <div className="success-icon">✅</div>
              <h3>Payment Successful!</h3>
              <p>Reference: {reference}</p>
              <p>Redirecting to your bookings...</p>
            </div>
          )}

          {paymentStatus === 'pay-offline' && (
            <div className="pending-status">
              <div className="pending-icon">📱</div>
              <h3>Authorization Required</h3>
              <p>Please check your phone and authorize the payment</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Payment;

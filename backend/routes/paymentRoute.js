// backend/routes/paymentRoute.js
import express from 'express';
import axios from 'axios';

const router = express.Router();

// Store for tracking cancelled payments (in production, use Redis or database)
const cancelledPayments = new Set();

// Root endpoint for testing/info (public)
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Payment API is running! Available endpoints:',
    endpoints: [
      'GET /api/payment/verify/:reference - Verify payment status',
      'POST /api/payment/submit-otp - Submit OTP for mobile money',
      'POST /api/payment/cancel/:reference - Cancel a payment',
      'GET /api/payment/channels - Get available payment channels',
      'GET /api/payment/test - Test Lenco API connection'
    ]
  });
});

// Lenco API configuration from .env
const LENCO_CONFIG = {
  baseURL: process.env.LENCO_BASE_URL || 'https://api.lenco.co/access/v2',
  apiKey: process.env.LENCO_KEY,
  publicKey: process.env.LENCO_PUBLIC_KEY
};

// Cancel payment endpoint
router.post('/cancel/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    console.log('Cancelling payment with reference:', reference);

    if (!reference) {
      console.log('Cancellation failed: Missing reference');
      return res.status(400).json({ 
        success: false,
        error: 'Payment reference is required' 
      });
    }

    // Add to cancelled payments set
    cancelledPayments.add(reference);
    console.log('Payment marked as cancelled:', reference);

    // Optional: Try to cancel on Lenco's side if they have a cancellation endpoint
    // If Lenco doesn't have a cancel endpoint, we just track it locally
    try {
      const response = await axios.post(
        `${LENCO_CONFIG.baseURL}/collections/cancel/${reference}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${LENCO_CONFIG.apiKey || process.env.LENCO_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );
      console.log('Lenco cancellation response:', response.data);
    } catch (lencoError) {
      // If Lenco doesn't support cancellation or it fails, we still mark it cancelled locally
      console.log('Lenco cancellation not available or failed (payment still marked as cancelled locally):', lencoError.message);
    }

    res.json({
      success: true,
      message: 'Payment cancelled successfully',
      reference: reference
    });

  } catch (err) {
    console.error('Error cancelling payment:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to cancel payment',
      details: err.message
    });
  }
});

// Check if payment is cancelled
router.get('/is-cancelled/:reference', (req, res) => {
  const { reference } = req.params;
  const isCancelled = cancelledPayments.has(reference);
  
  res.json({
    success: true,
    reference: reference,
    isCancelled: isCancelled
  });
});

// Verify payment status by reference
router.get('/verify/:reference', async (req, res) => {
  try { 
    const { reference } = req.params;
    console.log('Verifying payment with reference:', reference);

    if (!reference) {
      console.log('Verification failed: Missing reference');
      return res.status(400).json({ 
        success: false,
        error: 'Payment reference is required' 
      });
    }

    // Check if payment was cancelled
    if (cancelledPayments.has(reference)) {
      console.log('Payment was cancelled:', reference);
      return res.json({
        success: true,
        message: 'Payment was cancelled by user',
        data: {
          status: 'cancelled',
          reference: reference
        },
        cancelled: true
      });
    }

    const response = await axios.get(
      `${LENCO_CONFIG.baseURL}/collections/status/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${LENCO_CONFIG.apiKey || process.env.LENCO_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log('Payment verification response status:', response.status);
    console.log('Payment verification response data:', JSON.stringify(response.data, null, 2));

    res.json({
      success: true,
      message: 'Payment status retrieved successfully',
      data: response.data,
      cancelled: false
    });

  } catch (err) {
    console.error('Error verifying payment:', {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data
    });

    let errorMessage = 'Payment verification failed. Please try again later.';
    let statusCode = 500;

    if (err.response) {
      console.log('Verification API Error Response:', JSON.stringify(err.response.data, null, 2));
      errorMessage = err.response.data?.message || 'Verification failed';
      statusCode = err.response.status;
    } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      errorMessage = 'Unable to connect to Lenco API server. Check your internet connection or Lenco status.';
      statusCode = 503;
    } else if (err.code === 'ECONNABORTED') {
      errorMessage = 'Payment verification timeout';
      statusCode = 408;
    }

    res.status(statusCode).json({ 
      success: false,
      error: errorMessage, 
      details: err.response?.data || err.message
    });
  } 
});

// Submit OTP for mobile money payments
router.post('/submit-otp', async (req, res) => {
  try {
    const { reference, otp } = req.body;
    console.log('Submitting OTP for reference:', reference, 'OTP:', otp);

    if (!reference || !otp) {
      console.log('OTP submission failed: Missing reference or OTP');
      return res.status(400).json({ 
        success: false,
        error: 'Reference and OTP are required' 
      });
    }

    // Check if payment was cancelled
    if (cancelledPayments.has(reference)) {
      console.log('Cannot submit OTP - Payment was cancelled:', reference);
      return res.status(400).json({
        success: false,
        error: 'Payment was cancelled',
        cancelled: true
      });
    }

    if (!/^\d{4,6}$/.test(otp.toString())) {
      console.log('OTP submission failed: Invalid OTP format');
      return res.status(400).json({ 
        success: false,
        error: 'OTP must be 4-6 digits' 
      });
    }

    const otpData = {
      reference: reference,
      otp: otp.toString()
    };

    console.log('Sending OTP data to Lenco API:', otpData);

    const response = await axios.post(
      `${LENCO_CONFIG.baseURL}/collections/mobile-money/otp`,
      otpData,
      {
        headers: {
          'Authorization': `Bearer ${LENCO_CONFIG.apiKey || process.env.LENCO_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log('OTP submission response status:', response.status);
    console.log('OTP submission response data:', JSON.stringify(response.data, null, 2));

    res.json({
      success: true,
      message: 'OTP submitted successfully',
      data: response.data
    });

  } catch (err) {
    console.error('Error submitting OTP:', {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data
    });

    let errorMessage = 'OTP submission failed. Please try again.';
    let statusCode = 500;

    if (err.response) {
      console.log('OTP API Error Response:', JSON.stringify(err.response.data, null, 2));
      errorMessage = err.response.data?.message || 'OTP verification failed';
      statusCode = err.response.status;
    } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      errorMessage = 'Unable to connect to Lenco API server. Check your internet connection or Lenco status.';
      statusCode = 503;
    } else if (err.code === 'ECONNABORTED') {
      errorMessage = 'OTP submission timeout';
      statusCode = 408;
    }

    res.status(statusCode).json({ 
      success: false,
      error: errorMessage, 
      details: err.response?.data || err.message
    });
  }
});

// Get available payment channels
router.get('/channels', async (req, res) => {
  try {
    console.log('Fetching available payment channels');

    const response = await axios.get(
      `${LENCO_CONFIG.baseURL}/collections/channels`,
      {
        headers: {
          'Authorization': `Bearer ${LENCO_CONFIG.apiKey || process.env.LENCO_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log('Payment channels response:', JSON.stringify(response.data, null, 2));

    res.json({
      success: true,
      message: 'Payment channels retrieved successfully',
      data: response.data
    });

  } catch (err) {
    console.error('Error fetching payment channels:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data
    });

    let errorMessage = 'Failed to fetch payment channels';
    let statusCode = err.response?.status || 500;

    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      errorMessage = 'Unable to connect to Lenco API server. Check your internet connection or Lenco status.';
      statusCode = 503;
    } else if (err.code === 'ECONNABORTED') {
      errorMessage = 'Request to fetch payment channels timed out';
      statusCode = 408;
    }

    res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      message: err.response?.data?.message || err.message
    });
  }
});

// Test API connection and configuration
router.get('/test', async (req, res) => {
  try {
    console.log('Testing Lenco API connection...');
    console.log('API Key (first 10 chars):', LENCO_CONFIG.apiKey?.substring(0, 10) + '...');
    console.log('Base URL:', LENCO_CONFIG.baseURL || 'https://api.lenco.co/access/v2');

    const response = await axios.get(
      `${LENCO_CONFIG.baseURL}/accounts`,
      {
        headers: {
          'Authorization': `Bearer ${LENCO_CONFIG.apiKey || process.env.LENCO_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log('API Test Response Status:', response.status);
    console.log('API Test Response Data:', JSON.stringify(response.data, null, 2));

    res.json({
      success: true,
      message: 'API connection successful',
      config: {
        baseURL: LENCO_CONFIG.baseURL || 'https://api.lenco.co/access/v2',
        publicKey: LENCO_CONFIG.publicKey || process.env.LENCO_PUBLIC_KEY,
        hasApiKey: !!LENCO_CONFIG.apiKey
      },
      data: response.data
    });

  } catch (err) {
    console.error('API Test Error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data
    });

    let errorMessage = 'API connection failed';
    let statusCode = err.response?.status || 500;

    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      errorMessage = 'Unable to connect to Lenco API server. Check your internet connection or Lenco status.';
      statusCode = 503;
    } else if (err.code === 'ECONNABORTED') {
      errorMessage = 'API connection test timed out';
      statusCode = 408;
    }

    res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      details: err.response?.data || err.message,
      config: {
        baseURL: LENCO_CONFIG.baseURL || 'https://api.lenco.co/access/v2',
        publicKey: LENCO_CONFIG.publicKey || process.env.LENCO_PUBLIC_KEY,
        hasApiKey: !!LENCO_CONFIG.apiKey
      }
    });
  }
});

export default router;

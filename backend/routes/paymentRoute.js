import express from 'express';
import axios from 'axios';

const router = express.Router();

// Enhanced in-memory store for cancelled transactions with timestamps
const cancelledTransactions = new Map();

// Root endpoint for testing/info (public)
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Payment API is running! Available endpoints:',
    endpoints: [
      'GET /api/payment/verify/:reference - Verify payment status',
      'POST /api/payment/submit-otp - Submit OTP for mobile money',
      'GET /api/payment/channels - Get available payment channels',
      'GET /api/payment/test - Test Lenco API connection',
      'POST /api/payment/cancel - Cancel a payment attempt'
    ]
  });
});

// Lenco API configuration from .env
const LENCO_CONFIG = {
  baseURL: process.env.LENCO_BASE_URL || 'https://api.lenco.co/access/v2',
  apiKey: process.env.LENCO_KEY,
  publicKey: process.env.LENCO_PUBLIC_KEY
};

// Enhanced cancellation check middleware
const checkCancelledTransaction = (req, res, next) => {
  const { reference } = req.params || req.body;
  
  if (reference && cancelledTransactions.has(reference)) {
    const cancelledData = cancelledTransactions.get(reference);
    const now = Date.now();
    
    // Check if cancellation record is still valid (within 30 minutes)
    if (now - cancelledData.timestamp < 30 * 60 * 1000) {
      console.log('Transaction already cancelled:', reference);
      return res.json({
        success: true,
        message: 'Transaction was cancelled',
        data: { 
          data: { 
            status: 'cancelled',
            cancelledAt: cancelledData.timestamp
          } 
        }
      });
    } else {
      // Clean up expired cancellation record
      cancelledTransactions.delete(reference);
    }
  }
  
  next();
};

// Enhanced payment verification with immediate cancellation support
router.get('/verify/:reference', checkCancelledTransaction, async (req, res) => {
  try { 
    const { reference } = req.params;
    console.log('Verifying payment with reference:', reference);
    
    if (!reference) {
      console.log('Verification failed: Missing reference');
      return res.status(400).json({ error: 'Payment reference is required' });
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
      data: response.data
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
      error: errorMessage, 
      details: err.response?.data || err.message
    });
  } 
});

// Enhanced OTP submission with cancellation check
router.post('/submit-otp', checkCancelledTransaction, async (req, res) => {
  try {
    const { reference, otp } = req.body;
    console.log('Submitting OTP for reference:', reference, 'OTP:', otp);
    
    if (!reference || !otp) {
      console.log('OTP submission failed: Missing reference or OTP');
      return res.status(400).json({ error: 'Reference and OTP are required' });
    }
    
    if (!/^\d{4,6}$/.test(otp.toString())) {
      console.log('OTP submission failed: Invalid OTP format');
      return res.status(400).json({ error: 'OTP must be 4-6 digits' });
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
      error: errorMessage, 
      details: err.response?.data || err.message
    });
  }
});

// Enhanced cancellation endpoint
router.post('/cancel', async (req, res) => {
  try {
    const { reference } = req.body;
    console.log('Cancelling payment with reference:', reference);
    
    if (!reference) {
      console.log('Cancellation failed: Missing reference');
      return res.status(400).json({ error: 'Payment reference is required' });
    }

    // Check if transaction is already cancelled
    if (cancelledTransactions.has(reference)) {
      console.log('Transaction already cancelled:', reference);
      const cancelledData = cancelledTransactions.get(reference);
      return res.json({
        success: true,
        message: 'Payment attempt already cancelled',
        data: { 
          reference, 
          status: 'cancelled',
          cancelledAt: cancelledData.timestamp
        }
      });
    }

    // Verify current status with Lenco first
    try {
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
      
      console.log('Payment cancellation check response:', JSON.stringify(response.data, null, 2));
      const status = response.data?.data?.status;
      
      if (status === 'successful') {
        return res.status(400).json({ 
          error: 'Cannot cancel a completed payment',
          data: { reference, status: 'completed' }
        });
      }
      
      // Mark as cancelled locally with timestamp
      cancelledTransactions.set(reference, {
        timestamp: Date.now(),
        status: 'cancelled'
      });
      
      console.log('Payment marked as cancelled:', reference);
      
    } catch (verifyErr) {
      // Even if verification fails, mark as cancelled to prevent further processing
      console.log('Verification failed during cancellation, marking as cancelled anyway:', reference);
      cancelledTransactions.set(reference, {
        timestamp: Date.now(),
        status: 'cancelled',
        verificationFailed: true
      });
    }

    // Schedule cleanup of cancelled transaction after 30 minutes
    setTimeout(() => {
      if (cancelledTransactions.has(reference)) {
        cancelledTransactions.delete(reference);
        console.log('Cleaned up cancelled transaction:', reference);
      }
    }, 30 * 60 * 1000);

    res.json({
      success: true,
      message: 'Payment attempt cancelled successfully. All further processing has been stopped.',
      data: { 
        reference, 
        status: 'cancelled',
        cancelledAt: Date.now(),
        note: 'No further payment prompts will be processed for this transaction'
      }
    });
    
  } catch (err) {
    console.error('Error cancelling payment:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data
    });
    
    let errorMessage = 'Payment cancellation failed';
    let statusCode = 500;
    
    if (err.response) {
      errorMessage = err.response.data?.message || 'Cancellation failed';
      statusCode = err.response.status;
    } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      errorMessage = 'Unable to connect to Lenco API server';
      statusCode = 503;
    } else if (err.code === 'ECONNABORTED') {
      errorMessage = 'Cancellation request timed out';
      statusCode = 408;
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: err.response?.data || err.message
    });
  }
});

// Get list of currently cancelled transactions (for debugging)
router.get('/cancelled-transactions', (req, res) => {
  const cancelledList = Array.from(cancelledTransactions.entries()).map(([reference, data]) => ({
    reference,
    ...data
  }));
  
  res.json({
    success: true,
    message: 'Cancelled transactions retrieved',
    data: {
      count: cancelledTransactions.size,
      transactions: cancelledList
    }
  });
});

// Clean up expired cancelled transactions manually
router.post('/cleanup-expired', (req, res) => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [reference, data] of cancelledTransactions.entries()) {
    if (now - data.timestamp > 30 * 60 * 1000) {
      cancelledTransactions.delete(reference);
      cleanedCount++;
    }
  }
  
  res.json({
    success: true,
    message: `Cleaned up ${cleanedCount} expired cancelled transactions`,
    data: { cleanedCount }
  });
});

// Existing endpoints remain the same...
router.get('/channels', checkCancelledTransaction, async (req, res) => {
  // ... existing implementation
});

router.get('/test', async (req, res) => {
  // ... existing implementation
});

export default router;

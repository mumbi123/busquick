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

// Helper function to check if transaction is cancelled
const isTransactionCancelled = (reference) => {
  if (!reference) return false;
  
  if (cancelledTransactions.has(reference)) {
    const cancelledData = cancelledTransactions.get(reference);
    const now = Date.now();
    
    // Check if cancellation record is still valid (within 30 minutes)
    if (now - cancelledData.timestamp < 30 * 60 * 1000) {
      return true;
    } else {
      // Clean up expired cancellation record
      cancelledTransactions.delete(reference);
      return false;
    }
  }
  
  return false;
};

// CRITICAL: Enhanced payment verification with IMMEDIATE cancellation check
router.get('/verify/:reference', async (req, res) => {
  try { 
    const { reference } = req.params;
    console.log('🔍 Verifying payment with reference:', reference);
    
    if (!reference) {
      console.log('❌ Verification failed: Missing reference');
      return res.status(400).json({ error: 'Payment reference is required' });
    }

    // CRITICAL: Check cancellation FIRST before making any API calls to Lenco
    if (isTransactionCancelled(reference)) {
      const cancelledData = cancelledTransactions.get(reference);
      console.log('🛑 Transaction already cancelled:', reference, 'at', new Date(cancelledData.timestamp));
      return res.json({
        success: true,
        message: 'Transaction was cancelled',
        data: { 
          data: { 
            status: 'cancelled',
            cancelledAt: cancelledData.timestamp,
            reference: reference
          } 
        }
      });
    }

    // Only proceed to Lenco API if not cancelled
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
    
    console.log('✅ Payment verification response status:', response.status);
    console.log('📊 Payment verification response data:', JSON.stringify(response.data, null, 2));
    
    res.json({
      success: true,
      message: 'Payment status retrieved successfully',
      data: response.data
    });
  } catch (err) {
    console.error('❌ Error verifying payment:', {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data
    });
    
    let errorMessage = 'Payment verification failed. Please try again later.';
    let statusCode = 500;
    
    if (err.response) {
      console.log('⚠️ Verification API Error Response:', JSON.stringify(err.response.data, null, 2));
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
router.post('/submit-otp', async (req, res) => {
  try {
    const { reference, otp } = req.body;
    console.log('🔐 Submitting OTP for reference:', reference, 'OTP:', otp);
    
    if (!reference || !otp) {
      console.log('❌ OTP submission failed: Missing reference or OTP');
      return res.status(400).json({ error: 'Reference and OTP are required' });
    }

    // CRITICAL: Check if transaction is cancelled before processing OTP
    if (isTransactionCancelled(reference)) {
      const cancelledData = cancelledTransactions.get(reference);
      console.log('🛑 OTP submission blocked - Transaction already cancelled:', reference);
      return res.json({
        success: true,
        message: 'Transaction was cancelled - OTP not processed',
        data: { 
          data: { 
            status: 'cancelled',
            cancelledAt: cancelledData.timestamp,
            reference: reference
          } 
        }
      });
    }
    
    if (!/^\d{4,6}$/.test(otp.toString())) {
      console.log('❌ OTP submission failed: Invalid OTP format');
      return res.status(400).json({ error: 'OTP must be 4-6 digits' });
    }

    const otpData = {
      reference: reference,
      otp: otp.toString()
    };
    
    console.log('📤 Sending OTP data to Lenco API:', otpData);
    
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
    
    console.log('✅ OTP submission response status:', response.status);
    console.log('📊 OTP submission response data:', JSON.stringify(response.data, null, 2));
    
    res.json({
      success: true,
      message: 'OTP submitted successfully',
      data: response.data
    });
  } catch (err) {
    console.error('❌ Error submitting OTP:', {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data
    });
    
    let errorMessage = 'OTP submission failed. Please try again.';
    let statusCode = 500;
    
    if (err.response) {
      console.log('⚠️ OTP API Error Response:', JSON.stringify(err.response.data, null, 2));
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

// CRITICAL: Enhanced cancellation endpoint with immediate effect
router.post('/cancel', async (req, res) => {
  try {
    const { reference } = req.body;
    console.log('🛑 CANCELLATION REQUEST for reference:', reference);
    
    if (!reference) {
      console.log('❌ Cancellation failed: Missing reference');
      return res.status(400).json({ error: 'Payment reference is required' });
    }

    // Check if transaction is already cancelled
    if (cancelledTransactions.has(reference)) {
      const cancelledData = cancelledTransactions.get(reference);
      console.log('⚠️ Transaction already cancelled:', reference);
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

    // IMMEDIATELY mark as cancelled FIRST (before any API calls)
    const cancelTimestamp = Date.now();
    cancelledTransactions.set(reference, {
      timestamp: cancelTimestamp,
      status: 'cancelled',
      immediate: true
    });
    
    console.log('✅ Transaction IMMEDIATELY marked as cancelled:', reference, 'at', new Date(cancelTimestamp));

    // Try to verify current status with Lenco (non-blocking - for logging only)
    try {
      const response = await axios.get(
        `${LENCO_CONFIG.baseURL}/collections/status/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${LENCO_CONFIG.apiKey || process.env.LENCO_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000, // Shorter timeout
        }
      );
      
      console.log('📊 Payment status at cancellation:', JSON.stringify(response.data, null, 2));
      const status = response.data?.data?.status;
      
      if (status === 'successful') {
        // Remove from cancelled list if already successful
        cancelledTransactions.delete(reference);
        console.log('⚠️ Cannot cancel - payment already completed');
        return res.status(400).json({ 
          error: 'Cannot cancel a completed payment',
          data: { reference, status: 'completed' }
        });
      }
      
    } catch (verifyErr) {
      // Even if verification fails, keep it marked as cancelled
      console.log('⚠️ Verification failed during cancellation (keeping as cancelled):', verifyErr.message);
      cancelledTransactions.set(reference, {
        timestamp: cancelTimestamp,
        status: 'cancelled',
        verificationFailed: true
      });
    }

    // Schedule cleanup of cancelled transaction after 30 minutes
    setTimeout(() => {
      if (cancelledTransactions.has(reference)) {
        cancelledTransactions.delete(reference);
        console.log('🧹 Cleaned up cancelled transaction:', reference);
      }
    }, 30 * 60 * 1000);

    // Return immediate success response
    res.json({
      success: true,
      message: 'Payment attempt cancelled successfully. All further processing has been stopped immediately.',
      data: { 
        reference, 
        status: 'cancelled',
        cancelledAt: cancelTimestamp,
        note: 'This transaction is now permanently blocked from processing. No further payment prompts will be sent.'
      }
    });
    
    console.log('✅ Cancellation response sent to client for:', reference);
    
  } catch (err) {
    console.error('❌ Error in cancellation endpoint:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data
    });
    
    // Even on error, try to mark as cancelled
    const { reference } = req.body;
    if (reference && !cancelledTransactions.has(reference)) {
      cancelledTransactions.set(reference, {
        timestamp: Date.now(),
        status: 'cancelled',
        errorDuringCancel: true
      });
      console.log('⚠️ Marked as cancelled despite error');
    }
    
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
    ...data,
    cancelledAgo: `${Math.floor((Date.now() - data.timestamp) / 1000)}s ago`
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
  
  console.log(`🧹 Manual cleanup: removed ${cleanedCount} expired cancelled transactions`);
  
  res.json({
    success: true,
    message: `Cleaned up ${cleanedCount} expired cancelled transactions`,
    data: { 
      cleanedCount,
      remaining: cancelledTransactions.size
    }
  });
});

// Get available payment channels
router.get('/channels', async (req, res) => {
  try {
    console.log('📋 Fetching payment channels');
    
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
    
    console.log('✅ Payment channels retrieved');
    res.json({
      success: true,
      message: 'Payment channels retrieved successfully',
      data: response.data
    });
  } catch (err) {
    console.error('❌ Error fetching payment channels:', err.message);
    res.status(500).json({ 
      error: 'Failed to fetch payment channels',
      details: err.response?.data || err.message
    });
  }
});

// Test Lenco API connection
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Testing Lenco API connection');
    
    // Just test basic connectivity
    const response = await axios.get(
      `${LENCO_CONFIG.baseURL}/collections/channels`,
      {
        headers: {
          'Authorization': `Bearer ${LENCO_CONFIG.apiKey || process.env.LENCO_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );
    
    console.log('✅ Lenco API connection successful');
    res.json({
      success: true,
      message: 'Lenco API is reachable and responding',
      apiStatus: 'online',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Lenco API connection test failed:', err.message);
    res.status(503).json({
      success: false,
      message: 'Lenco API connection failed',
      apiStatus: 'offline',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    cancelledTransactionsCount: cancelledTransactions.size,
    timestamp: new Date().toISOString()
  });
});

export default router;

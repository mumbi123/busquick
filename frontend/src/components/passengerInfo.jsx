import React, { useState, useEffect } from 'react';
import '../resources/PassengerInfo.css';

function PassengerInfo({
  name,
  setName,
  phone,
  setPhone,
  emergencyPhone,
  setEmergencyPhone,
  paymentMethod,
  setPaymentMethod,
  selectedSeats = [],
  busPrice = 0,
  errors = {},
  onSubmit,
  isSubmitting = false
}) {
  // Local state for additional form fields
  const [mobileProvider, setMobileProvider] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  // Validate form on change
  useEffect(() => {
    const hasRequiredFields =
      name.trim() && phone.trim() && emergencyPhone.trim() && paymentMethod;
    const hasPaymentDetails =
      (paymentMethod === 'mobile' && mobileProvider) ||
      (paymentMethod === 'bank' && bankAccount.trim()) ||
      !paymentMethod;

    setIsFormValid(
      hasRequiredFields && (paymentMethod ? hasPaymentDetails : true)
    );
  }, [name, phone, emergencyPhone, paymentMethod, mobileProvider, bankAccount]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid && onSubmit) {
      const formData = {
        name: name.trim(),
        phone: formatPhoneForSaving(phone.trim()),
        emergencyPhone: formatPhoneForSaving(emergencyPhone.trim()),
        paymentMethod,
        mobileProvider: paymentMethod === 'mobile' ? mobileProvider : '',
        bankAccount: paymentMethod === 'bank' ? bankAccount.trim() : '',
        selectedSeats,
        totalAmount: selectedSeats.length * busPrice
      };
      onSubmit(formData);
    }
  };

  // Format phone number for saving (converts 0XXXXXXXXX to +260XXXXXXXXX)
  const formatPhoneForSaving = (phoneValue) => {
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

  // Handle phone input change with auto-formatting preview
  const handlePhoneChange = (setter) => (e) => {
    let formatted = formatPhoneNumber(e.target.value);
    
    // Show preview of how it will be saved if starts with 0
    const cleaned = formatted.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      // Don't change the input value, just let user see what they're typing
      // The actual conversion happens on form submission
    }
    
    setter(formatted);
  };

  // Validate phone number length
  const validatePhoneLength = (phoneValue) => {
    const cleaned = phoneValue.replace(/[^\d]/g, '');
    return cleaned.length >= 10 && cleaned.length <= 12;
  };

  // Get display hint for phone formatting
  const getPhoneHint = (phoneValue) => {
    const cleaned = phoneValue.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `Will be saved as: +260${cleaned.substring(1)}`;
    }
    return '';
  };

  return (
    <div className="passenger-info-wrapper">
      <div className="passenger-info-container">
        {/* Header Section */}
        <div className="form-header">
          <div className="header-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 2V6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 2V6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 10H22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="header-content">
            <h1>Passenger Information</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="passenger-form">
          {/* Personal Information Section */}
          <div className="form-section">
            <div className="section-header">
              <h3>Personal Details</h3>
              <div className="section-divider"></div>
            </div>

            {/* Full Name - Full Width */}
            <div className="form-grid">
              <div className={`input-group ${errors.name ? 'error' : ''}`}>
                <label htmlFor="fullName" className="input-label">
                  <span className="label-text">Full Name</span>
                  <span className="required-indicator">*</span>
                </label>
                <div className="input-wrapper">
                  <input
                    id="fullName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className={`form-input ${
                      errors.name ? 'error-input' : ''
                    }`}
                    required
                    disabled={isSubmitting}
                    autoComplete="name"
                  />
                  <div className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="7"
                        r="4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                {errors.name && (
                  <div className="error-message">{errors.name}</div>
                )}
              </div>
            </div>

            {/* Phone Number - Full Width */}
            <div className="form-grid">
              <div className={`input-group ${errors.phone ? 'error' : ''}`}>
                <label htmlFor="phone" className="input-label">
                  <span className="label-text">Phone Number</span>
                  <span className="required-indicator">*</span>
                </label>
                <div className="input-wrapper">
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange(setPhone)}
                    placeholder="Enter phone number (e.g., 0977123456 or +260977123456)"
                    className={`form-input ${
                      errors.phone ? 'error-input' : ''
                    }`}
                    required
                    disabled={isSubmitting}
                    autoComplete="tel"
                    minLength="10"
                    maxLength="13"
                  />
                  <div className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7293C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1468 21.5901 20.9046 21.7335 20.6407 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.18999 12.85C3.49997 10.2412 2.44824 7.271 2.11999 4.18C2.095 3.90347 2.12787 3.62476 2.21649 3.36162C2.30512 3.09849 2.44756 2.85669 2.63476 2.65162C2.82196 2.44655 3.0498 2.28271 3.30379 2.17052C3.55777 2.05833 3.83233 2.00026 4.10999 2H7.10999C7.59344 1.99522 8.06456 2.16708 8.43538 2.48353C8.80621 2.79999 9.04207 3.23945 9.10999 3.72C9.23662 4.68007 9.47144 5.62273 9.80999 6.53C9.94454 6.88792 9.97366 7.27691 9.8939 7.65088C9.81415 8.02485 9.62886 8.36811 9.35999 8.64L8.08999 9.91C9.51355 12.4135 11.5865 14.4864 14.09 15.91L15.36 14.64C15.6319 14.3711 15.9751 14.1858 16.3491 14.1061C16.7231 14.0263 17.1121 14.0555 17.47 14.19C18.3773 14.5286 19.3199 14.7634 20.28 14.89C20.7658 14.9585 21.2094 15.1986 21.5265 15.5735C21.8437 15.9484 22.0122 16.424 22 16.92Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                {getPhoneHint(phone) && (
                  <div className="format-hint" style={{color: '#10b981', fontSize: '12px', marginTop: '4px'}}>
                    {getPhoneHint(phone)}
                  </div>
                )}
                {errors.phone && (
                  <div className="error-message">{errors.phone}</div>
                )}
              </div>
            </div>

            {/* Emergency Contact - Full Width */}
            <div className="form-grid">
              <div className={`input-group ${errors.emergencyPhone ? 'error' : ''}`}>
                <label htmlFor="emergencyPhone" className="input-label">
                  <span className="label-text">Emergency Contact Number</span>
                  <span className="required-indicator">*</span>
                </label>
                <div className="input-wrapper">
                  <input
                    id="emergencyPhone"
                    type="tel"
                    value={emergencyPhone}
                    onChange={handlePhoneChange(setEmergencyPhone)}
                    placeholder="Enter emergency contact (e.g., 0977654321 or +260977654321)"
                    className={`form-input ${
                      errors.emergencyPhone ? 'error-input' : ''
                    }`}
                    required
                    disabled={isSubmitting}
                    autoComplete="tel"
                    minLength="10"
                    maxLength="13"
                  />
                  <div className="input-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M12 6V12L16 14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                {getPhoneHint(emergencyPhone) && (
                  <div className="format-hint" style={{color: '#10b981', fontSize: '12px', marginTop: '4px'}}>
                    {getPhoneHint(emergencyPhone)}
                  </div>
                )}
                {errors.emergencyPhone && (
                  <div className="error-message">{errors.emergencyPhone}</div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Information Section */}
          <div className="form-section">
            <div className="section-header">
              <h3>Payment Methods</h3>
              <div className="section-divider"></div>
            </div>

            <div className="service-fee-info">
              <div className="payment-methods">
                <img src="/public/images/mtn.png" alt="MTN" className="payment-logo" />
                <img src="/public/images/airtel.png" alt="Airtel" className="payment-logo" />
                <img src="/public/images/bank2.png" alt="Bank" className="payment-logo" />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          {onSubmit && (
            <div className="form-actions">
              <button
                type="submit"
                className={`submit-button ${
                  !isFormValid || isSubmitting ? 'disabled' : ''
                }`}
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Confirm Booking</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default PassengerInfo;
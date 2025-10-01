import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../helpers/axiosinstance';
import { message } from 'antd';
import { useDispatch } from 'react-redux';
import { showLoading, hideLoading } from '../redux/alertsSlice';
import { FaChair, FaBusAlt, FaTools } from 'react-icons/fa';
import Summary from '../components/Summary';
import '../resources/BookNow.css';

function BookNow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Enhanced state management
  const [busDetails, setBusDetails] = useState({
    name: '',
    price: 0,
    from: '', 
    to: '',
    departure: '',
    arrival: '', 
    journeydate: '',
    drivername: '',
    capacity: 4,
    seatsBooked: []
  });
  
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [phone, setPhone] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [name, setName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mobile');
  const [mobileProvider, setMobileProvider] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [errors, setErrors] = useState({});
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMaxSeatWarning, setShowMaxSeatWarning] = useState(false);
  const [busData, setBusData] = useState(null);
  const [busDataLoading, setBusDataLoading] = useState(true);
  const [busDataError, setBusDataError] = useState(null);

  // Constants
  const maxSeats = 4;
  const maxLayoutSeats = 69;

  // Enhanced memoized calculations
  const totalAmount = useMemo(() => 
    selectedSeats.length * busDetails.price, 
    [selectedSeats.length, busDetails.price]
  );

  const isFormValid = useMemo(() => 
    name.trim() && 
    phone.trim() && 
    emergencyPhone.trim() &&  
    selectedSeats.length > 0 && 
    paymentMethod &&
    Object.keys(errors).length === 0,
    [name, phone, emergencyPhone, selectedSeats.length, paymentMethod, errors]
  );

  const routeInfo = useMemo(() => {
    if (busDetails.from && busDetails.to) {
      return `${busDetails.from} → ${busDetails.to}`;
    }
    return 'Select your seats and complete your booking';
  }, [busDetails.from, busDetails.to]);

  // Get actual bus capacity and booked seats from fetched data
  const actualBusCapacity = busData?.capacity || busDetails.capacity || 4;
  const actualBookedSeats = busData?.seatsBooked || busDetails.seatsBooked || [];
  const availableSeats = actualBusCapacity - actualBookedSeats.length;
  
  // Calculate which seats should be unavailable based on actual bus capacity
  const unavailableSeats = getUnavailableSeats(actualBusCapacity, maxLayoutSeats);

  // Clear warning after 3 seconds
  useEffect(() => {
    if (showMaxSeatWarning) {
      const timer = setTimeout(() => {
        setShowMaxSeatWarning(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showMaxSeatWarning]);

  // Format phone number for saving (converts 0XXXXXXXXX to +260XXXXXXXXX)
  const formatPhoneForSaving = (phoneValue) => {
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

  // Handle phone input change with auto-formatting preview
  const handlePhoneChange = (setter) => (e) => {
    let formatted = formatPhoneNumber(e.target.value);
    setter(formatted);
  };

  // Get display hint for phone formatting
  const getPhoneHint = (phoneValue) => {
    const cleaned = phoneValue.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `Will be saved as: +260${cleaned.substring(1)}`;
    }
    return '';
  };

  // Function to determine unavailable seats based on actual bus capacity
  function getUnavailableSeats(actualCapacity, maxSeats) {
    if (actualCapacity >= maxSeats) return [];
    
    const unavailable = [];
    const seatsToMakeUnavailable = maxSeats - actualCapacity;
    
    // If capacity is very small, mark seats starting from the highest numbers
    if (actualCapacity <= 10) {
      // For small buses, simply mark seats beyond capacity as unavailable
      for (let i = actualCapacity + 1; i <= maxSeats; i++) {
        unavailable.push(i);
      }
      return unavailable;
    }
    
    // For larger buses, use the symmetric removal pattern
    const seatGroups = [];
    
    // Regular rows (1-64)
    for (let i = 1; i <= 64; i += 4) {
      seatGroups.push([i, i+1, i+2, i+3]);
    }
    
    // Back row (65-69)
    seatGroups.push([65, 66, 67, 68, 69]);
    
    // Start from the back and work forward, removing seats symmetrically
    let removedCount = 0;
    let groupIndex = seatGroups.length - 1;
    
    while (removedCount < seatsToMakeUnavailable && groupIndex >= 0) {
      const group = seatGroups[groupIndex];
      
      if (group.length === 5) {
        // Back row - remove from outside to inside
        const removalOrder = [65, 69, 66, 68, 67];
        for (let seat of removalOrder) {
          if (removedCount < seatsToMakeUnavailable) {
            unavailable.push(seat);
            removedCount++;
          }
        }
      } else {
        // Regular row - remove from outside to inside (window seats first)
        const removalOrder = [group[0], group[3], group[1], group[2]]; // Left window, right window, left aisle, right aisle
        for (let seat of removalOrder) {
          if (removedCount < seatsToMakeUnavailable) {
            unavailable.push(seat);
            removedCount++;
          }
        }
      }
      
      groupIndex--;
    }
    
    return unavailable;
  }

  // Toggle a seat's selection with maximum seat enforcement
  const toggleSeat = (seatId) => {
    // Convert seatId to string for consistent comparison
    const seatIdStr = seatId.toString();
    
    // Check if seat is booked or unavailable
    if (actualBookedSeats.includes(seatIdStr) || unavailableSeats.includes(seatId)) {
      return; // Don't allow selection
    }
    
    if (selectedSeats.includes(seatIdStr)) {
      // Deselecting a seat - always allowed
      setSelectedSeats(selectedSeats.filter((id) => id !== seatIdStr));
      setShowMaxSeatWarning(false); // Clear warning when deselecting
    } else {
      // Selecting a seat - check maximum limit
      if (selectedSeats.length >= maxSeats) {
        // Show warning and don't allow selection
        setShowMaxSeatWarning(true);
        return;
      }
      setSelectedSeats([...selectedSeats, seatIdStr]);
    }
  };

  // Get seat class based on status
  const getSeatClass = (seatId) => {
    let classes = 'seat-cell passenger-seat';
    const seatIdStr = seatId.toString();
    
    // Priority 1: Check if seat is booked (from confirmed bookings)
    if (actualBookedSeats.includes(seatIdStr)) {
      classes += ' unavailable booked';
    }
    // Priority 2: Check if seat is unavailable due to capacity limitation
    else if (unavailableSeats.includes(seatId)) {
      classes += ' unavailable';
    }
    // Priority 3: Check if seat is currently selected by user
    else if (selectedSeats.includes(seatIdStr)) {
      classes += ' selected';
    }
    // Priority 4: Check if seat should be dimmed (max seats reached and seat not selected)
    else if (selectedSeats.length >= maxSeats) {
      classes += ' disabled-max-reached';
    }
    // Priority 5: Seat is available (within capacity and not booked)
    // Default styling applies
    
    return classes;
  };

  // Get cursor style for seat
  const getSeatCursor = (seatId) => {
    const seatIdStr = seatId.toString();
    if (actualBookedSeats.includes(seatIdStr) || unavailableSeats.includes(seatId)) {
      return { cursor: 'not-allowed' };
    }
    if (selectedSeats.length >= maxSeats && !selectedSeats.includes(seatIdStr)) {
      return { cursor: 'not-allowed' };
    }
    return { cursor: 'pointer' };
  };

  // Enhanced user authentication
  const fetchCurrentUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        message.error('Please log in to continue your booking');
        navigate('/login');
        return;
      }

      const response = await axiosInstance.get('/api/users/me');
      
      if (response.data.success) {
        const userData = response.data.data;
        setCurrentUser(userData);
        
        // Set name from user data
        setName(userData.name || '');
        
        // Enhanced local storage management
        localStorage.setItem('userId', userData._id || userData.id);
        localStorage.setItem('user', JSON.stringify(userData));
        
        message.success(`Welcome, ${userData.name}!`, 2);
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      message.error('Authentication failed. Please log in again.');
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Enhanced bus details fetching
  const fetchBusDetails = useCallback(async () => {
    if (!id) return;
    
    try {
      dispatch(showLoading());
      setBusDataLoading(true);
      setBusDataError(null);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      const response = await axiosInstance.get(`/api/buses/get-bus/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setBusDetails(response.data.data);
        setBusData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Bus not found');
      }
    } catch (error) {
      console.error('Bus fetch error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load bus details';
      message.error(errorMessage);
      setBusDataError(errorMessage);
      navigate('/');
    } finally {
      dispatch(hideLoading());
      setBusDataLoading(false);
    }
  }, [id, dispatch, navigate]);

  // Effects
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchBusDetails();
    }
  }, [currentUser, fetchBusDetails]);

  // Enhanced validation with better error messages
  const validate = useCallback(() => {
    const newErrors = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    } else if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      newErrors.name = 'Name should only contain letters and spaces';
    }

    // Phone validation with better regex
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(phone.trim()) || phone.trim().length < 10) {
      newErrors.phone = 'Please enter a valid phone number (minimum 10 digits)';
    }

    // Emergency contact validation
    if (!emergencyPhone.trim()) {
      newErrors.emergencyPhone = 'Emergency contact is required';
    } else if (!phoneRegex.test(emergencyPhone.trim()) || emergencyPhone.trim().length < 10) {
      newErrors.emergencyPhone = 'Please enter a valid emergency contact number';
    } else if (phone.trim() === emergencyPhone.trim()) {
      newErrors.emergencyPhone = 'Emergency contact must be different from your phone number';
    }

    // Seats validation
    if (selectedSeats.length === 0) {
      newErrors.seats = 'Please select at least one seat to continue';
    } else if (selectedSeats.length > 4) {
      newErrors.seats = 'Maximum 4 seats can be selected per booking';
    }

    // Payment method validation
    if (!paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, phone, emergencyPhone, selectedSeats, paymentMethod]);

  // Enhanced form submission with better UX
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Authentication check
    if (!currentUser) {
      message.error('Session expired. Please log in again.');
      navigate('/login');
      return;
    }

    // Validation
    if (!validate()) {
      // Enhanced error handling - scroll to first error
      setTimeout(() => {
        const firstError = document.querySelector('.error-input, .ant-form-item-has-error input');
        if (firstError) {
          firstError.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          firstError.focus();
        }
      }, 100);
      
      message.warning('Please correct the highlighted errors to continue');
      return;
    }

    setIsSubmitting(true);
    
    // Enhanced loading feedback
    message.loading('Processing your booking...', 0);

    // Simulate API processing with realistic delay
    setTimeout(() => {
      message.destroy(); // Clear loading message
      setIsSubmitting(false);
      setIsSummaryVisible(true);
      
      // Provide success feedback
      message.success('Booking details prepared! Please review and confirm.', 3);
    }, 1500);
  }, [currentUser, validate, navigate]);

  // Enhanced booking success handler
  const handleBookingSuccess = useCallback((bookingData) => {
    console.log('Booking successful:', bookingData);
    
    // Enhanced success feedback
    message.success({
      content: 'Booking confirmed successfully!',
      duration: 5,
      style: { marginTop: '10vh' }
    });
    
    // Reset form state
    setSelectedSeats([]);
    setPhone('');
    setEmergencyPhone('');
    setName(currentUser?.name || '');
    setPaymentMethod('mobile');
    setErrors({});
    setIsSummaryVisible(false);
    
    // Navigate with delay for better UX
    setTimeout(() => {
      navigate('/bookings', { 
        state: { 
          fromBooking: true, 
          bookingData 
        }
      });
    }, 2000);
  }, [currentUser?.name, navigate]);

  // Enhanced close handler
  const handleClose = useCallback(() => {
    setIsSummaryVisible(false);
    setIsSubmitting(false);
  }, []);

  // Enhanced input handlers with immediate validation
  const handleNameChange = useCallback((value) => {
    setName(value);
    
    // Clear name errors immediately on valid input
    if (value.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(value.trim()) && errors.name) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
  }, [errors.name]);

  const handlePhoneChangeWrapper = useCallback((value) => {
    setPhone(value);
    
    // Clear phone errors on valid input
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (phoneRegex.test(value.trim()) && value.trim().length >= 10 && errors.phone) {
      setErrors(prev => ({ ...prev, phone: undefined }));
    }
  }, [errors.phone]);

  const handleEmergencyPhoneChange = useCallback((value) => {
    setEmergencyPhone(value);
    
    // Clear emergency phone errors on valid input
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (phoneRegex.test(value.trim()) && 
        value.trim().length >= 10 && 
        value.trim() !== phone.trim() && 
        errors.emergencyPhone) {
      setErrors(prev => ({ ...prev, emergencyPhone: undefined }));
    }
  }, [errors.emergencyPhone, phone]);

  const handlePaymentMethodChange = useCallback((value) => {
    setPaymentMethod(value);
    
    // Clear payment method errors immediately
    if (value && errors.paymentMethod) {
      setErrors(prev => ({ ...prev, paymentMethod: undefined }));
    }
  }, [errors.paymentMethod]);

  // Front row: Helper / Driver (not clickable)
  const renderFrontRow = () => ( 
    <div className="seat-row front-row">
      <div className="seat-cell front-subcell">
        <FaTools className="seat-icon front-icon" />
        <div className="seat-label-front">Helper</div>
      </div>
      <div className="front-spacer" />
      <div className="seat-cell front-subcell">
        <FaBusAlt className="seat-icon front-icon" />
        <div className="seat-label-front">Driver</div>
      </div>
    </div>
  );

  // Better row rendering with aisle spacing
  const renderPassengerRowWithAisle = (seatNumbers) => (
    <div className="seat-row passenger-row">
      <div
        className={getSeatClass(seatNumbers[0])}
        style={getSeatCursor(seatNumbers[0])}
        onClick={() => toggleSeat(seatNumbers[0])}
      >
        <FaChair className="seat-icon" />
        <div className="seat-label">{seatNumbers[0]}</div>
      </div>
      <div
        className={getSeatClass(seatNumbers[1])}
        style={getSeatCursor(seatNumbers[1])}
        onClick={() => toggleSeat(seatNumbers[1])}
      >
        <FaChair className="seat-icon" />
        <div className="seat-label">{seatNumbers[1]}</div>
      </div>
      <div className="aisle-spacer" />
      <div
        className={getSeatClass(seatNumbers[2])}
        style={getSeatCursor(seatNumbers[2])}
        onClick={() => toggleSeat(seatNumbers[2])}
      >
        <FaChair className="seat-icon" />
        <div className="seat-label">{seatNumbers[2]}</div>
      </div>
      <div
        className={getSeatClass(seatNumbers[3])}
        style={getSeatCursor(seatNumbers[3])}
        onClick={() => toggleSeat(seatNumbers[3])}
      >
        <FaChair className="seat-icon" />
        <div className="seat-label">{seatNumbers[3]}</div>
      </div>
    </div>
  );

  // Simplified loading state
  if (isLoading || !currentUser) {
    return (
      <div className="book-now-container">
        <div className="booking-content">
          <div className="booking-header fade-in">
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <h2>Loading...</h2>
              <p>Please wait while we prepare your booking.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="book-now-container">
      <div className="booking-content">
        {/* Enhanced Header */}
        <div className="booking-header fade-in">
          <h1 className="booking-title">Book Your Journey</h1>
          <p className="booking-subtitle">{routeInfo}</p>
          <div className="user-info">
            <span>Welcome, {currentUser.name}!</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="top-section">
          {/* Passenger Information Section */}
          <div className="passenger-info-col slide-up">
            <div className="passenger-info-box">
              <div className="form-header">
                <div className="header-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 10H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

                  {/* Full Name */}
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
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder="Enter your full name"
                          className={`form-input ${errors.name ? 'error-input' : ''}`}
                          required
                          disabled={isSubmitting}
                          autoComplete="name"
                        />
                        <div className="input-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                      {errors.name && <div className="error-message">{errors.name}</div>}
                    </div>
                  </div>

                  {/* Phone Number */}
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
                          onChange={handlePhoneChange(handlePhoneChangeWrapper)}
                          placeholder="Enter phone number (e.g., 0977123456 or +260977123456)"
                          className={`form-input ${errors.phone ? 'error-input' : ''}`}
                          required
                          disabled={isSubmitting}
                          autoComplete="tel"
                          minLength="10"
                          maxLength="13"
                        />
                        <div className="input-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7293C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1468 21.5901 20.9046 21.7335 20.6407 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.18999 12.85C3.49997 10.2412 2.44824 7.271 2.11999 4.18C2.095 3.90347 2.12787 3.62476 2.21649 3.36162C2.30512 3.09849 2.44756 2.85669 2.63476 2.65162C2.82196 2.44655 3.0498 2.28271 3.30379 2.17052C3.55777 2.05833 3.83233 2.00026 4.10999 2H7.10999C7.59344 1.99522 8.06456 2.16708 8.43538 2.48353C8.80621 2.79999 9.04207 3.23945 9.10999 3.72C9.23662 4.68007 9.47144 5.62273 9.80999 6.53C9.94454 6.88792 9.97366 7.27691 9.8939 7.65088C9.81415 8.02485 9.62886 8.36811 9.35999 8.64L8.08999 9.91C9.51355 12.4135 11.5865 14.4864 14.09 15.91L15.36 14.64C15.6319 14.3711 15.9751 14.1858 16.3491 14.1061C16.7231 14.0263 17.1121 14.0555 17.47 14.19C18.3773 14.5286 19.3199 14.7634 20.28 14.89C20.7658 14.9585 21.2094 15.1986 21.5265 15.5735C21.8437 15.9484 22.0122 16.424 22 16.92Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                      {getPhoneHint(phone) && (
                        <div className="format-hint">{getPhoneHint(phone)}</div>
                      )}
                      {errors.phone && <div className="error-message">{errors.phone}</div>}
                    </div>
                  </div>

                  {/* Emergency Contact */}
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
                          onChange={handlePhoneChange(handleEmergencyPhoneChange)}
                          placeholder="Enter emergency contact (e.g., 0977654321 or +260977654321)"
                          className={`form-input ${errors.emergencyPhone ? 'error-input' : ''}`}
                          required
                          disabled={isSubmitting}
                          autoComplete="tel"
                          minLength="10"
                          maxLength="13"
                        />
                        <div className="input-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                      {getPhoneHint(emergencyPhone) && (
                        <div className="format-hint">{getPhoneHint(emergencyPhone)}</div>
                      )}
                      {errors.emergencyPhone && <div className="error-message">{errors.emergencyPhone}</div>}
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
                      <img src="/images/mtn.png" alt="MTN" className="payment-logo" />
                      <img src="/images/airtel.png" alt="Airtel" className="payment-logo" />
                      <img src="/images/bank2.png" alt="Bank" className="payment-logo" />
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Seat Selection Section */}
          <div className="seat-select-col slide-up">
            <div className="seat-select-wrapper">
              <h3 className="seat-select-title">Choose Your Seats</h3>
              
              {/* Seat Selection Container */}
              {busDataLoading ? (
                <div className="loading-state">
                  <p>Loading bus information...</p>
                </div>
              ) : busDataError ? (
                <div className="error-state">
                  <h3>Error Loading Bus Data</h3>
                  <p>{busDataError}</p>
                  <button onClick={() => window.location.reload()} className="retry-button">
                    Retry
                  </button>
                </div>
              ) : !busData ? (
                <div className="no-data-state">
                  <p>No bus data available</p>
                </div>
              ) : (
                <div className="seat-select-container">
                  {/* Header with seat selection info */}
                  <div className="seat-selection-header">
                    <h4>Select Your Seats</h4>
                    
                    {/* Maximum seat warning */}
                    {showMaxSeatWarning && (
                      <div className="max-seat-warning">
                        Maximum {maxSeats} seats allowed per booking. Please deselect a seat to choose a different one.
                      </div>
                    )}
                  </div>
                  
                  <div className="seat-legend">
                    <div className="legend-item">
                      <div className="legend-indicator legend-available"></div>
                      <span>Available</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-indicator legend-selected"></div>
                      <span>Selected</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-indicator legend-booked"></div>
                      <span>Booked</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-indicator legend-unavailable"></div>
                      <span>Unavailable</span>
                    </div>
                  </div>
                  
                  {renderFrontRow()}

                  {/* Render all passenger rows (1-64) */}
                  {Array.from({ length: 16 }, (_, i) => {
                    const startSeat = i * 4 + 1;
                    return (
                      <div key={`row-${i}`}>
                        {renderPassengerRowWithAisle([startSeat, startSeat + 1, startSeat + 2, startSeat + 3])}
                      </div>
                    );
                  })}

                  {/* Back row: seats 65–69 */}
                  <div className="seat-row back-row">
                    {[65, 66, 67, 68, 69].map((seatId) => (
                      <div
                        key={`back-${seatId}`}
                        className={getSeatClass(seatId)}
                        style={getSeatCursor(seatId)}
                        onClick={() => toggleSeat(seatId)}
                      >
                        <FaChair className="seat-icon" />
                        <div className="seat-label">{seatId}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {errors.seats && (
                <div className="error">{errors.seats}</div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Bottom Section */}
        <div className="bottom-section">
          <div className="selection-display fade-in">
            <h3>
              Booking Summary
              {selectedSeats.length > 0 && (
                <span className="seat-count">({selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''})</span>
              )}
            </h3>

            {selectedSeats.length > 0 ? (
              <>
                <div className="seat-tags">
                  {selectedSeats.sort((a, b) => a - b).map((seat) => (
                    <span key={seat} className="seat-tag">
                      Seat {seat}
                    </span>
                  ))}
                </div>

                {busDetails.price > 0 && (
                  <div className="total-amount-section">
                    <div className="total-amount-display">
                      <span>Total Amount:</span>
                      <span className="amount">K {totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="amount-breakdown">
                      K {busDetails.price.toLocaleString()} × {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-selection">
                <span>No seats selected yet</span>
                <small>Choose your preferred seats from the seat map above</small>
              </div>
            )}
          </div>

          {/* Enhanced Action Button */}
          <button 
            className="book-button" 
            onClick={handleSubmit} 
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="loading-spinner"></span>
                Processing Booking...
              </>
            ) : (
              <>
                Book Now
                {totalAmount > 0 && ` - K ${totalAmount.toLocaleString()}`}
              </>
            )}
          </button>

          {/* Progress indicator */}
          <div className="progress-indicator">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{
                  width: `${Math.min(100, (Object.keys(errors).length === 0 ? 100 : 60))}%`
                }}
              ></div>
            </div>
            <span className="progress-text">
              {Object.keys(errors).length === 0 ? 'Ready to book!' : 'Complete all fields'}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Summary Modal */}
      {isSummaryVisible && (
        <Summary
          name={name}
          phone={formatPhoneForSaving(phone)}
          emergencyPhone={formatPhoneForSaving(emergencyPhone)}
          selectedSeats={selectedSeats}
          paymentMethod={paymentMethod}
          busPrice={busDetails.price} 
          busName={busDetails.name}
          fromCity={busDetails.from}
          toCity={busDetails.to}
          departureTime={busDetails.departure}
          arrivalTime={busDetails.arrival}
          date={busDetails.journeydate}
          driversName={busDetails.drivername}
          busId={id}
          userId={currentUser?._id || currentUser?.id}
          totalAmount={totalAmount}
          handleClose={handleClose}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}

export default BookNow;
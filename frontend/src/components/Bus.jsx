import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import LoginModal from './LoginModal';
import '../resources/buscard.css';

const Bus = (props) => {
  const [allBuses, setAllBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);

  const currentSearchParamsRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.users); 

  // Function to get bus logo based on company name
  const getBusLogo = (busName) => {
    if (!busName || typeof busName !== 'string') {
      return null;
    }

    const normalizedName = busName.toLowerCase().trim();
    
    // Logo mappings
    const logoMappings = [
      {
        logo: '/images/powertools.png',
        names: ['powertools bus', 'powertools', 'power tools', 'power tools bus']
      },
      {
        logo: '/images/likili.png',
        names: ['likili motors', 'likili', 'likili motor']
      },
      {
        logo: '/images/ubz.png',
        names: ['united bus company zambia', 'ubz', 'u.b.z', 'united bus', 'united bus company']
      },
      {
        logo: '/images/andrich.png',
        names: ['andrich coach services', 'andrich', 'andrich coach', 'andrich coaches']
      },
      {
        logo: '/images/postbus.png',
        names: ['postbus zambia', 'postbus', 'post bus', 'post bus zambia']
      },
      {
        logo: '/images/shalom.png',
        names: ['shalom bus services', 'shalom', 'shalom bus', 'shalom buses']
      }
    ];

    // Find matching logo
    for (const mapping of logoMappings) {
      if (mapping.names.some(name => normalizedName.includes(name) || name.includes(normalizedName))) {
        return mapping.logo;
      }
    }

    return null; // No logo found
  };

  // Fetch buses with search filters
  const fetchBuses = async (searchParams = {}) => {
    console.log('--- FRONTEND DEBUG: fetchBuses called with params:', searchParams);
    
    const hasValidSearchParams =
      searchParams &&
      Object.keys(searchParams).length > 0 &&
      (searchParams.from?.trim() || searchParams.to?.trim() || searchParams.departureDate?.trim());

    if (!hasValidSearchParams) {
      console.log('--- FRONTEND DEBUG: No valid search parameters provided ---');
      setHasSearched(false);
      setAllBuses([]);
      setError('Please provide at least one search criterion (from, to, or date).');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null); 
    setHasSearched(true);

    try {
      const endpoint = '/api/buses/get-all-buses';
      const requestData = {
        from: searchParams.from?.trim() || '',
        to: searchParams.to?.trim() || '',
        departureDate: searchParams.departureDate?.trim() || '',
      };

      console.log('--- FRONTEND DEBUG: Making request to:', endpoint);
      console.log('--- FRONTEND DEBUG: Request data:', requestData);

      const headers = {
        'Content-Type': 'application/json',
      };
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.post(endpoint, requestData, { headers });

      console.log('--- FRONTEND DEBUG: Raw Response from Backend ---');
      console.log(response.data);

      if (response.data.success) {
        const uniqueBuses = response.data.data.filter(
          (bus, index, self) => index === self.findIndex((b) => b._id === bus._id)
        );

        console.log('--- FRONTEND DEBUG: Unique Buses Found ---', uniqueBuses.length);
        console.log('--- FRONTEND DEBUG: Setting buses state with:', uniqueBuses);

        setAllBuses(uniqueBuses);

        setTimeout(() => {
          console.log('--- FRONTEND DEBUG: Buses state after setting:', uniqueBuses);
        }, 100);
      } else {
        console.log('--- FRONTEND DEBUG: Backend returned error ---', response.data.message);
        setError(response.data.message);
        setAllBuses([]);
      }
    } catch (err) {
      console.error('Error fetching buses:', err);
      setError(err.response?.data?.message || 'Failed to fetch buses');
      setAllBuses([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle data fetching based on props
  useEffect(() => {
    console.log('--- FRONTEND DEBUG: useEffect triggered with props:', props);
    console.log('--- FRONTEND DEBUG: props.searchParams:', props.searchParams);

    const isBusData =
      props.data ||
      props.bus ||
      (props.id && props.busName) ||
      (props._id && props.name) ||
      (props.id && props.from && props.to) ||
      (props.busName && props.from && props.to);

    if (isBusData) {
      const busData = props.data || props.bus || props;
      console.log('--- FRONTEND DEBUG: Using direct bus data from props:', busData);

      const formattedBusData = {
        _id: busData.id || busData._id,
        name: busData.busName || busData.name,
        number: busData.number,
        from: busData.from,
        to: busData.to,
        departure: busData.departure,
        arrival: busData.arrival,
        price: busData.price,
        availableSeats: busData.availableSeats,
        capacity: busData.capacity,
        status: busData.status,
        journeydate: busData.journeyDate || busData.journeydate,
        drivername: busData.drivername || busData.driverName,
        pickup: busData.pickup,
        dropoff: busData.dropoff,
        amenities: busData.amenities,
        isFullyBooked: busData.isFullyBooked,
        isActive: busData.isActive !== false,
        bookingDisabled: busData.bookingDisabled || false,
        ...busData,
      };

      setAllBuses([formattedBusData]);
      setHasSearched(true);
      setLoading(false);
      setError(null);
      return;
    }

    const searchParamsString = JSON.stringify(props.searchParams || {});

    if (
      props.searchParams &&
      Object.keys(props.searchParams).length > 0 &&
      (props.searchParams.from?.trim() || props.searchParams.to?.trim() || props.searchParams.departureDate?.trim())
    ) {
      if (currentSearchParamsRef.current !== searchParamsString) {
        console.log('--- FRONTEND DEBUG: Search params changed, fetching buses ---');
        console.log('--- FRONTEND DEBUG: Old params:', currentSearchParamsRef.current);
        console.log('--- FRONTEND DEBUG: New params:', searchParamsString);
        currentSearchParamsRef.current = searchParamsString;
        fetchBuses(props.searchParams);
      } else {
        console.log('--- FRONTEND DEBUG: Search params unchanged, skipping fetch ---');
      }
    } else {
      console.log('--- FRONTEND DEBUG: No valid search params, resetting state ---');
      setAllBuses([]);
      setHasSearched(false);
      setError(null);
      setLoading(false);
      currentSearchParamsRef.current = null;
    }
  }, [props.searchParams, props.data, props.bus, props._id, props.id, props.busName, props.from, props.to]);

  // Client-side timeline calculations for display override
  const calculateClientTimeline = (bus) => {
    const now = new Date();
    const journeyDate = new Date(bus.journeydate);
    
    // Parse departure time
    const depTimeMatch = bus.departure?.match(/(\d{1,2}):(\d{2})/);
    if (!depTimeMatch) return { ...bus };
    
    const depHours = parseInt(depTimeMatch[1]);
    const depMins = parseInt(depTimeMatch[2]);
    const fullDeparture = new Date(journeyDate);
    fullDeparture.setHours(depHours, depMins, 0, 0);
    
    // Parse arrival time
    const arrTimeMatch = bus.arrival?.match(/(\d{1,2}):(\d{2})/);
    if (!arrTimeMatch) return { ...bus };
    
    const arrHours = parseInt(arrTimeMatch[1]);
    const arrMins = parseInt(arrTimeMatch[2]);
    const fullArrival = new Date(journeyDate);
    fullArrival.setHours(arrHours, arrMins, 0, 0);
    
    // Handle next day arrival
    if (fullArrival < fullDeparture) {
      fullArrival.setDate(fullArrival.getDate() + 1);
    }
    
    // Calculate booking close time (30 minutes before departure)
    const bookingCloseTime = new Date(fullDeparture.getTime() - 30 * 60 * 1000);
    
    // Determine warning message and display status
    let warningMessage = '';
    let displayStatus = bus.status;
    let clientBookingDisabled = bus.bookingDisabled;
    
    if (now > fullArrival) {
      displayStatus = 'Completed';
      clientBookingDisabled = true;
    } else if (now > fullDeparture) {
      displayStatus = 'Running';
      clientBookingDisabled = true;
      warningMessage = 'Bus has departed';
    } else if (now >= bookingCloseTime || bus.bookingDisabled) {
      clientBookingDisabled = true;
      warningMessage = 'Booking closed (departs soon)';
    }
    
    return {
      ...bus,
      displayStatus,
      warningMessage,
      clientBookingDisabled,
      isLowSeats: bus.availableSeats <= 5 && bus.availableSeats > 0
    };
  };

  // Utility functions (unchanged)
  const getBusName = (busData) => {
    const actualBusName = busData.name || busData.busName;
    if (actualBusName === undefined || actualBusName === null) return 'Bus Company';
    if (actualBusName === '') return 'Bus Company';
    if (typeof actualBusName === 'object' && actualBusName !== null) {
      if (actualBusName.$string) return actualBusName.$string.trim() || 'Bus Company';
      if (actualBusName.toString && typeof actualBusName.toString === 'function') {
        const nameStr = actualBusName.toString();
        if (nameStr !== '[object Object]') return nameStr.trim() || 'Bus Company';
      }
    }
    return typeof actualBusName === 'string' ? actualBusName.trim() || 'Bus Company' : 'Bus Company';
  };

  const getAvailableAmenities = (amenities) => {
    if (!amenities) return [];
    let amenitiesObj = amenities;
    if (typeof amenities === 'object' && !Array.isArray(amenities)) {
      if (amenities.toObject) amenitiesObj = amenities.toObject();
      return Object.entries(amenitiesObj)
        .filter(([key, value]) => {
          if (typeof value === 'boolean') return value;
          if (typeof value === 'string') return value.toLowerCase() === 'true';
          if (typeof value === 'number') return value === 1;
          if (typeof value === 'object' && value !== null) {
            if (value.$numberInt) return parseInt(value.$numberInt) === 1;
            if (value.$numberDouble) return parseFloat(value.$numberDouble) === 1;
          }
          return false;
        })
        .map(([key]) => key);
    }
    if (typeof amenities === 'string') {
      try {
        const parsedAmenities = JSON.parse(amenities);
        return Object.entries(parsedAmenities)
          .filter(([_, value]) => {
            if (typeof value === 'boolean') return value;
            if (typeof value === 'string') return value.toLowerCase() === 'true';
            if (typeof value === 'number') return value === 1;
            return false;
          })
          .map(([key]) => key);
      } catch (e) {
        console.error('Error parsing amenities JSON:', e);
        return [];
      }
    }
    return [];
  };

  const formatLocation = (location, defaultPrefix = '') => {
    if (location === undefined || location === null)
      return defaultPrefix ? `${defaultPrefix} Main Station` : 'Main Station';
    if (location === '') return defaultPrefix ? `${defaultPrefix} Main Station` : 'Main Station';
    if (typeof location === 'object' && location !== null) {
      if (location.$string)
        return location.$string.trim() || (defaultPrefix ? `${defaultPrefix} Main Station` : 'Main Station');
      if (location.toString && typeof location.toString === 'function') {
        const locationStr = location.toString();
        if (locationStr !== '[object Object]')
          return locationStr.trim() || (defaultPrefix ? `${defaultPrefix} Main Station` : 'Main Station');
      }
    }
    return typeof location === 'string'
      ? location.trim() || (defaultPrefix ? `${defaultPrefix} Main Station` : 'Main Station')
      : defaultPrefix
      ? `${defaultPrefix} Main Station`
      : 'Main Station';
  };

  const formatPrice = (priceValue) => {
    if (priceValue === undefined || priceValue === null) return 0;
    if (typeof priceValue === 'object' && priceValue !== null) {
      if (priceValue.$numberInt) return parseInt(priceValue.$numberInt);
      if (priceValue.$numberDecimal) return parseFloat(priceValue.$numberDecimal);
      if (priceValue.$numberDouble) return parseFloat(priceValue.$numberDouble);
    }
    return parseFloat(priceValue) || 0;
  };

  const formatCapacity = (capacityValue) => {
    if (capacityValue === undefined || capacityValue === null) return 65;
    if (typeof capacityValue === 'object' && capacityValue !== null) {
      if (capacityValue.$numberInt) return parseInt(capacityValue.$numberInt);
    }
    return parseInt(capacityValue) || 65;
  };

  const formatAvailableSeats = (seatsValue) => {
    if (seatsValue === undefined || seatsValue === null) return 0;
    if (typeof seatsValue === 'object' && seatsValue !== null) {
      if (seatsValue.$numberInt) return parseInt(seatsValue.$numberInt);
    }
    return parseInt(seatsValue) || 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    if (typeof dateString === 'object' && dateString !== null) {
      if (dateString.$date) {
        const timestamp = dateString.$date.$numberLong || dateString.$date;
        const date = new Date(parseInt(timestamp));
        return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
      }
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    if (typeof timeString === 'object' && timeString !== null) {
      if (timeString.$string) timeString = timeString.$string;
    }
    if (typeof timeString === 'string') {
      if (timeString.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) return timeString;
      try {
        const date = new Date(timeString);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        }
      } catch (e) {
        console.error('Error parsing time:', e);
      }
    }
    return timeString || '';
  };

  const calculateDuration = (depTime, arrTime) => {
    if (!depTime || !arrTime) return '';
    const parseTime = (timeStr) => {
      const match = formatTime(timeStr).match(/^(\d{1,2}):(\d{2})$/);
      if (!match) return null;
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      return hours * 60 + minutes;
    };
    const depMinutes = parseTime(depTime);
    const arrMinutes = parseTime(arrTime);
    if (depMinutes === null || arrMinutes === null) return '';
    let duration = arrMinutes - depMinutes;
    if (duration < 0) duration += 24 * 60;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  const getAmenityIcon = (amenity) => {
    const icons = { ac: '❄️', wifi: '📶', tv: '📺', charger: '⚡', bathroom: '🚹🚺', luggage: '🧳' };
    return icons[amenity?.toLowerCase()] || '✅';
  };

  const getAmenityLabel = (amenity) => {
    const labels = { ac: 'AC', wifi: 'WiFi', tv: 'TV', charger: 'Charger', bathroom: 'Bathroom', luggage: 'Luggage' };
    return labels[amenity?.toLowerCase()] || (amenity ? amenity.charAt(0).toUpperCase() + amenity.slice(1) : '');
  };

  const formatDriverName = (driverName) => {
    if (driverName === undefined || driverName === null) return '';
    if (typeof driverName === 'object' && driverName !== null) {
      if (driverName.$string) return driverName.$string.trim();
      if (driverName.toString && typeof driverName.toString === 'function') {
        const nameStr = driverName.toString();
        if (nameStr !== '[object Object]') return nameStr.trim();
      }
    }
    return typeof driverName === 'string' ? driverName.trim() : '';
  };

  const handleBooking = (busData) => {
    // Check if booking is disabled from backend or client-side calculation
    if (busData.bookingDisabled || busData.clientBookingDisabled) {
      return;
    }

    if (!user) {
      // Show login modal if user is not authenticated
      setSelectedBus(busData);
      setIsLoginModalVisible(true);
      return;
    }

    // Proceed with booking if authenticated
    const busId = busData._id || busData.id;
    const availableSeats = formatAvailableSeats(busData.availableSeats);
    if (busData.isFullyBooked || busData.status === 'Completed' || availableSeats <= 0) return;
    
    navigate(`/book-now/${busId}`, {
      state: {
        busDetails: {
          id: busId,
          name: getBusName(busData),
          number: busData.number,
          from: busData.from,
          to: busData.to,
          departure: busData.departure,
          arrival: busData.arrival,
          price: busData.price,
          availableSeats: busData.availableSeats,
          journeyDate: busData.journeydate,
          drivername: busData.drivername,
          pickup: busData.pickup,
          dropoff: busData.dropoff,
          amenities: busData.amenities,
        },
      },
    });
  };

  const handleLoginSuccess = () => {
    setIsLoginModalVisible(false);
    if (selectedBus) {
      // Proceed with booking after successful login
      handleBooking(selectedBus);
      setSelectedBus(null);
    }
  };

  const renderBookingButton = (bus) => {
    const availableSeats = formatAvailableSeats(bus.availableSeats);
    const formattedPrice = formatPrice(bus.price);
    
    if (bus.clientBookingDisabled || bus.bookingDisabled) {
      return (
        <button className="bus-card__book-button fully-booked" disabled>
          <span>⏰</span>
          Booking Closed
        </button>
      );
    }
    
    if (bus.isFullyBooked || availableSeats <= 0) {
      return (
        <button className="bus-card__book-button fully-booked" disabled>
          <span>❌</span>
          Fully Booked
        </button>
      );
    }
    
    if (bus.displayStatus?.toLowerCase() === 'completed') {
      return (
        <button className="bus-card__book-button fully-booked" disabled>
          <span>✅</span>
          Completed
        </button>
      );
    }
    
    return (
      <button className="bus-card__book-button available" onClick={() => handleBooking(bus)}>
        Book - K{formattedPrice.toFixed(2)}
      </button>
    );
  };

  // Debug logging
  console.log('--- FRONTEND DEBUG: Current component state ---');
  console.log('Loading:', loading);
  console.log('HasSearched:', hasSearched);
  console.log('AllBuses count:', allBuses.length);
  console.log('AllBuses array:', allBuses);
  console.log('Error:', error);
  console.log('Props:', props);
  console.log('User:', user);

  if (loading) {
    console.log('--- FRONTEND DEBUG: Showing loading state ---');
    return (
      <div className="bus-loading">
        <div className="loading-spinner">⏳</div>
        <p>Loading buses...</p>
      </div>
    );
  }

  if (error) {
    console.log('--- FRONTEND DEBUG: Showing error state ---', error);
    return (
      <div className="bus-error">
        <div className="error-message">
          <span>⚠️</span>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            <span>🔄</span>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!hasSearched) {
    console.log('--- FRONTEND DEBUG: No search performed, showing encouraging message ---');
    return (
      <div className="encouragement-message">
        <div className="encouragement-icon">
          <i className="ri-map-pin-line"></i>
        </div>
        <h3 className="encouragement-title">You are one search away from your destination</h3>
        <p className="encouragement-subtitle">
          Enter your travel details above to find the perfect bus for your journey. We'll show you all available options
          with real-time pricing and seat availability.
        </p>
      </div>
    );
  }

  if (hasSearched && allBuses.length === 0) {
    console.log('--- FRONTEND DEBUG: Search performed but no buses found ---');
    return (
      <div className="no-buses-message">
        <div className="no-buses-icon">🚌</div>
        <h3 className="no-buses-title">No buses found</h3>
        <p className="no-buses-subtitle">No buses match your search criteria. Try adjusting your search parameters.</p>
      </div>
    );
  }

  console.log('--- FRONTEND DEBUG: Rendering buses, count:', allBuses.length);
  console.log('--- FRONTEND DEBUG: About to render buses:', allBuses);

  return (
    <div className="bus-list-container">
      <div className="bus-results-header"></div>
      <div className="bus-list">
        {allBuses.map((bus, index) => {
          console.log(`--- FRONTEND DEBUG: Rendering bus ${index + 1}:`, bus);

          // Apply client-side timeline calculations
          const busWithTimeline = calculateClientTimeline(bus);
          
          const busId = busWithTimeline._id || busWithTimeline.id;
          const finalBusName = getBusName(busWithTimeline);
          const busLogo = getBusLogo(finalBusName);
          const availableAmenities = getAvailableAmenities(busWithTimeline.amenities);
          const formattedPickup = formatLocation(busWithTimeline.pickup, busWithTimeline.from);
          const formattedDropoff = formatLocation(busWithTimeline.dropoff, busWithTimeline.to);
          const formattedPrice = formatPrice(busWithTimeline.price);
          const formattedCapacity = formatCapacity(busWithTimeline.capacity);
          const formattedAvailableSeats = formatAvailableSeats(busWithTimeline.availableSeats);
          const formattedDriverName = formatDriverName(busWithTimeline.drivername);
          const busJourneyDate = busWithTimeline.journeydate || busWithTimeline.journeyDate;

          return (
            <div
              key={`${busId}-${index}`}
              className={`bus-card ${busWithTimeline.isFullyBooked ? 'fully-booked' : ''} ${
                busWithTimeline.displayStatus?.toLowerCase() === 'completed' ? 'completed' : ''
              }`}
            >
              {/* Warning Banner */}
              {busWithTimeline.warningMessage && (
                <div className="bus-card__timeline-warning">
                  <span>⚠️</span>
                  {busWithTimeline.warningMessage}
                </div>
              )}

              {/* Low Seats Warning */}
              {busWithTimeline.isLowSeats && !busWithTimeline.warningMessage && (
                <div className="bus-card__warning">
                  <span>⚠️</span>
                  Only {formattedAvailableSeats} seats left!
                </div>
              )}

              <div className={`bus-card__content ${busWithTimeline.warningMessage ? 'has-warning' : ''}`}>
                <div className="bus-card__main">
                  <div className="bus-card__info">
                    <div className="bus-card__name-block">
                      <div className="bus-card__company-container">
                        {busLogo ? (
                          <img 
                            src={busLogo} 
                            alt={finalBusName}
                            className="bus-card__company-logo"
                            onError={(e) => {
                              // Fallback to text if image fails to load
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <div 
                          className="bus-card__company" 
                          style={{ display: busLogo ? 'none' : 'block' }}
                        >
                          {finalBusName}
                        </div>
                      </div>
                      <div className="bus-card__bus-number">{busWithTimeline.number?.toUpperCase()}</div>
                    </div>
                    <div className="bus-card__times-row">
                      <div className="bus-card__time-column">
                        <div className="bus-card__time-value">{formatTime(busWithTimeline.departure)}</div>
                        <div className="bus-card__city-value">{busWithTimeline.from}</div>
                        <div className="bus-card__station-value">{formattedPickup}</div>
                      </div>
                      <div className="bus-card__duration-section">
                        <div className="bus-card__duration">{calculateDuration(busWithTimeline.departure, busWithTimeline.arrival)}</div>
                        <div className="bus-card__arrow-icon">→</div>
                      </div>
                      <div className="bus-card__time-column">
                        <div className="bus-card__time-value">{formatTime(busWithTimeline.arrival)}</div>
                        <div className="bus-card__city-value">{busWithTimeline.to}</div>
                        <div className="bus-card__station-value">{formattedDropoff}</div>
                      </div>
                    </div>
                  </div>
                  <div className="bus-card__right">
                    <div className="bus-card__details">
                      <div className="bus-card__status">
                        <span
                          className={`status-badge ${(busWithTimeline.displayStatus || busWithTimeline.status)?.toLowerCase().replace(/\s+/g, '-') || 'yet-to-start'}`}
                        >
                          {(busWithTimeline.displayStatus || busWithTimeline.status)?.toUpperCase() || 'YET TO START'}
                        </span>
                      </div>
                      {busJourneyDate && (
                        <div className="bus-card__detail-item">
                          <span>📅</span>
                          <span>{formatDate(busJourneyDate)}</span>
                        </div>
                      )}
                      {formattedDriverName && (
                        <div className="bus-card__detail-item">
                          <span>Driver:</span>
                          <span>{formattedDriverName}</span>
                        </div>
                      )}
                      <div className="bus-card__detail-item">
                        <span>💺</span>
                        <span>
                          {formattedAvailableSeats} / {formattedCapacity} seats
                        </span>
                      </div>
                    </div>
                    <div className="bus-card__booking">
                      {renderBookingButton(busWithTimeline)}
                    </div>
                  </div>
                </div>
                <div className="bus-card__amenities">
                  <div className="bus-card__amenities-list">
                    {availableAmenities.length > 0 ? (
                      availableAmenities.map((amenity, amenityIndex) => (
                        <div
                          key={`${amenity}-${amenityIndex}`}
                          className="bus-card__amenity-item"
                          title={getAmenityLabel(amenity)}
                        >
                          <span>{getAmenityIcon(amenity)}</span>
                          <span>{getAmenityLabel(amenity)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="bus-card__amenity-item">
                        <span>ℹ️</span>
                        <span>Standard bus service</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ); 
        })} 
      </div>
      <LoginModal
        visible={isLoginModalVisible}  
        onCancel={() => {
          setIsLoginModalVisible(false);
          setSelectedBus(null);
        }}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default Bus;
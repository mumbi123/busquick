import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../resources/buscard.css';

const Bus1 = (props) => {
  // State for data fetching
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Ref to track if we've already fetched data to prevent duplicates
  const hasFetchedRef = useRef(false);
  const currentSearchParamsRef = useRef(null);

  const navigate = useNavigate();

  // Fetch buses with search filters
  const fetchBuses = async (searchParams = {}) => {
    setLoading(true);
    setError(null); 
    setBuses([]); // Clear previous buses to prevent duplicates
    
    try {
      // If search parameters are provided, use search endpoint
      const endpoint = Object.keys(searchParams).length > 0 
        ? '/api/buses/search' 
        : '/api/buses/get-all-buses';
      
      const requestData = Object.keys(searchParams).length > 0 
        ? searchParams 
        : {};

      const response = await axios.post(endpoint, requestData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('--- FRONTEND DEBUG: Raw Response from Backend ---');
      console.log(response.data);
      
      if (response.data.success) {
        // Log the first 2 buses for debugging
        console.log('--- FRONTEND DEBUG: Processed Bus Data (first 2 entries) ---');
        response.data.data.slice(0, 2).forEach((bus, index) => {
          console.log(`Bus ${index + 1}:`, {
            id: bus._id,
            name: bus.name,
            number: bus.number,
            capacity: bus.capacity,
            driver: bus.drivername,
            route: `${bus.from} → ${bus.to}`,
            date: new Date(bus.journeydate).toLocaleDateString(),
            time: `${bus.departure} - ${bus.arrival}`,
            price: bus.price,
            pickup: bus.pickup,
            dropoff: bus.dropoff,
            amenities: bus.amenities,
            status: bus.status,
            availableSeats: bus.availableSeats,
            isFullyBooked: bus.isFullyBooked,
            isActive: bus.isActive
          });
        });

        setBuses(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('Error fetching buses:', err);
      setError(err.response?.data?.message || 'Failed to fetch buses');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    // Check if props contain bus data (for individual bus display)
    if (props.data || props.bus || (props._id && props.name)) {
      // Use props data if available (single bus display)
      const busData = props.data || props.bus || props;
      setBuses([busData]);
      return; // Exit early for single bus display
    }

    // Create a string representation of searchParams for comparison
    const searchParamsString = JSON.stringify(props.searchParams || {});
    
    // Only fetch if searchParams have actually changed or this is the first load
    if (!hasFetchedRef.current || currentSearchParamsRef.current !== searchParamsString) {
      currentSearchParamsRef.current = searchParamsString;
      hasFetchedRef.current = true;
      
      if (props.searchParams) {
        // If search parameters are provided, use them
        fetchBuses(props.searchParams);
      } else {
        // Fetch all buses if no props data (bus listing)
        fetchBuses();
      }
    }
  }, [props.searchParams]); // Keep this dependency but use refs to control execution

  // Enhanced utility functions from original Bus.jsx
  const getBusName = (busData) => {
    const actualBusName = (busData.name || busData.busName)?.toUpperCase();
    
    // Handle undefined/null cases first
    if (actualBusName === undefined || actualBusName === null) {
      return 'Bus Company';
    }
    
    // Handle empty string
    if (actualBusName === '') {
      return 'Bus Company';
    }
    
    // Handle MongoDB object format
    if (typeof actualBusName === 'object' && actualBusName !== null) {
      if (actualBusName.$string) {
        return actualBusName.$string.trim() || 'Bus Company';
      }
      // Handle other potential MongoDB formats
      if (actualBusName.toString && typeof actualBusName.toString === 'function') {
        const nameStr = actualBusName.toString();
        // Avoid [object Object] strings
        if (nameStr !== '[object Object]') {
          return nameStr.trim() || 'Bus Company';
        }
      }
    }
    
    // Handle regular string - this should catch most cases
    if (typeof actualBusName === 'string') {
      return actualBusName.trim() || 'Bus Company';
    }
    
    return 'Bus Company';
  };

  // Get available amenities - handle all possible formats
  const getAvailableAmenities = (amenities) => {
    if (!amenities) {
      return [];
    }
    
    let amenitiesObj = amenities;
    
    // Handle MongoDB object format
    if (typeof amenities === 'object' && !Array.isArray(amenities)) {
      // Check if it's a MongoDB subdocument
      if (amenities.toObject) {
        amenitiesObj = amenities.toObject();
      }
      
      // Extract available amenities
      const availableList = Object.entries(amenitiesObj)
        .filter(([key, value]) => {
          // Handle direct boolean values
          if (typeof value === 'boolean') {
            return value;
          }
          
          // Handle string representations
          if (typeof value === 'string') {
            return value.toLowerCase() === 'true';
          }
          
          // Handle number representations (1 = true, 0 = false)
          if (typeof value === 'number') {
            return value === 1;
          }
          
          // Handle MongoDB number formats
          if (typeof value === 'object' && value !== null) {
            if (value.$numberInt) {
              return parseInt(value.$numberInt) === 1;
            }
            if (value.$numberDouble) {
              return parseFloat(value.$numberDouble) === 1;
            }
          }
          
          return false;
        })
        .map(([key]) => key);
      
      return availableList;
    }
    
    // Handle stringified JSON
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

  // Format pickup and dropoff locations - handle undefined properly
  const formatLocation = (location, defaultPrefix = '') => {
    // Check for undefined/null first
    if (location === undefined || location === null) {
      return defaultPrefix ? `${defaultPrefix} Main Station` : 'Main Station';
    }
    
    // Handle empty string
    if (location === '') {
      return defaultPrefix ? `${defaultPrefix} Main Station` : 'Main Station';
    }
    
    // Handle MongoDB string format
    if (typeof location === 'object' && location !== null) {
      if (location.$string) {
        return location.$string.trim() || (defaultPrefix ? `${defaultPrefix} Main Station` : 'Main Station');
      }
      if (location.toString && typeof location.toString === 'function') {
        const locationStr = location.toString();
        // Avoid [object Object] strings
        if (locationStr !== '[object Object]') {
          return locationStr.trim() || (defaultPrefix ? `${defaultPrefix} Main Station` : 'Main Station');
        }
      }
    }
    
    // Handle regular string
    if (typeof location === 'string') {
      return location.trim() || (defaultPrefix ? `${defaultPrefix} Main Station` : 'Main Station');
    }
    
    return defaultPrefix ? `${defaultPrefix} Main Station` : 'Main Station';
  };

  // Enhanced format numerical values
  const formatPrice = (priceValue) => {
    if (priceValue === undefined || priceValue === null) return 0;
    if (typeof priceValue === 'object' && priceValue !== null) {
      if (priceValue.$numberInt) {
        return parseInt(priceValue.$numberInt);
      }
      if (priceValue.$numberDecimal) {
        return parseFloat(priceValue.$numberDecimal);
      }
      if (priceValue.$numberDouble) {
        return parseFloat(priceValue.$numberDouble);
      }
    }
    return parseFloat(priceValue) || 0;
  };

  const formatCapacity = (capacityValue) => {
    if (capacityValue === undefined || capacityValue === null) return 65; // Default capacity
    if (typeof capacityValue === 'object' && capacityValue !== null) {
      if (capacityValue.$numberInt) {
        return parseInt(capacityValue.$numberInt);
      }
    }
    return parseInt(capacityValue) || 65;
  };

  const formatAvailableSeats = (seatsValue) => {
    if (seatsValue === undefined || seatsValue === null) return 0;
    if (typeof seatsValue === 'object' && seatsValue !== null) {
      if (seatsValue.$numberInt) {
        return parseInt(seatsValue.$numberInt);
      }
    }
    return parseInt(seatsValue) || 0;
  };

  // Enhanced format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Handle MongoDB date format
    if (typeof dateString === 'object' && dateString !== null) {
      if (dateString.$date) {
        const timestamp = dateString.$date.$numberLong || dateString.$date;
        const date = new Date(parseInt(timestamp));
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  };

  // Enhanced format time
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    // Handle MongoDB string format
    if (typeof timeString === 'object' && timeString !== null) {
      if (timeString.$string) {
        timeString = timeString.$string;
      }
    }
    
    if (typeof timeString === 'string') {
      // Check if it's already in HH:MM format
      if (timeString.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
        return timeString;
      }
      
      // Try to parse as date and extract time
      try {
        const date = new Date(timeString);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        }
      } catch (e) {
        console.error('Error parsing time:', e);
      }
    }
    
    return timeString || '';
  };

  // Calculate duration between departure and arrival
  const calculateDuration = (depTime, arrTime) => {
    if (!depTime || !arrTime) return '';
    
    const parseTime = (timeStr) => {
      if (!timeStr) return null;
      const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
      if (!match) return null;
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      return hours * 60 + minutes;
    };
    
    const depMinutes = parseTime(formatTime(depTime));
    const arrMinutes = parseTime(formatTime(arrTime));
    
    if (depMinutes === null || arrMinutes === null) return '';
    
    let duration = arrMinutes - depMinutes;
    if (duration < 0) {
      duration += 24 * 60; // Add 24 hours if arrival is next day
    }
    
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    return `${hours}h ${minutes}m`;
  };

  // Get amenity icon - Updated to use Unicode symbols
  const getAmenityIcon = (amenity) => {
    const icons = {
      ac: '❄️',
      wifi: '📶',
      tv: '📺',
      charger: '🔌',
      bathroom: '🚽',
      luggage: '🧳'
    };
    return icons[amenity?.toLowerCase()] || '✅';
  };

  // Get amenity label
  const getAmenityLabel = (amenity) => {
    const labels = {
      ac: 'AC',
      wifi: 'WiFi',
      tv: 'TV',
      charger: 'Charger',
      bathroom: 'Bathroom',
      luggage: 'Luggage'
    };
    return labels[amenity?.toLowerCase()] || (amenity ? amenity.charAt(0).toUpperCase() + amenity.slice(1) : '');
  };

  // Enhanced driver name formatting
  const formatDriverName = (driverName) => {
    if (driverName === undefined || driverName === null) return '';
    
    // Handle MongoDB string format
    if (typeof driverName === 'object' && driverName !== null) {
      if (driverName.$string) {
        return driverName.$string.trim();
      }
      if (driverName.toString && typeof driverName.toString === 'function') {
        const nameStr = driverName.toString();
        // Avoid [object Object] strings
        if (nameStr !== '[object Object]') {
          return nameStr.trim();
        }
      }
    }
    
    if (typeof driverName === 'string') {
      return driverName.trim();
    }
    
    return '';
  };

  // Handle booking navigation
  const handleBookNow = (busData) => {
    const busId = busData._id || busData.id;
    const availableSeats = formatAvailableSeats(busData.availableSeats);
    
    if (busData.isFullyBooked || busData.status === 'Completed' || availableSeats <= 0) {
      return;
    }
    
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
          amenities: busData.amenities
        }
      }
    });
  };

  // Render individual bus card
  const renderBusCard = (busData, index) => {
    const busId = busData._id || busData.id;
    const finalBusName = getBusName(busData);
    const availableAmenities = getAvailableAmenities(busData.amenities);
    const formattedPickup = formatLocation(busData.pickup, busData.from);
    const formattedDropoff = formatLocation(busData.dropoff, busData.to);
    const formattedPrice = formatPrice(busData.price);
    const formattedCapacity = formatCapacity(busData.capacity);
    const formattedAvailableSeats = formatAvailableSeats(busData.availableSeats);
    const formattedDriverName = formatDriverName(busData.drivername);
    const busJourneyDate = busData.journeydate || busData.journeyDate;

    return (
      <div key={`${busId}-${index}`} className={`bus-card ${busData.isFullyBooked ? 'fully-booked' : ''} ${busData.status === 'Completed' ? 'completed' : ''}`}>
        {/* Low seats warning - positioned absolutely */}
        {formattedAvailableSeats <= 5 && formattedAvailableSeats > 0 && (
          <div className="bus-card__warning">
            <span>⚠️</span>
            Only {formattedAvailableSeats} seats left!
          </div>
        )}

        <div className="bus-card__main">
          <div className="bus-card__info">
            <div className="bus-card__name-block">
              <div className="bus-card__company">
                {finalBusName}
              </div>
              <div className="bus-card__bus-number">{busData.number?.toUpperCase()}</div>
            </div>

            <div className="bus-card__times-row">
              <div className="bus-card__time-column">
                <div className="bus-card__time-value">{formatTime(busData.departure)}</div>
                <div className="bus-card__city-value">{busData.from}</div>
                <div className="bus-card__station-value">
                  {formattedPickup}
                </div>
              </div>
              
              <div className="bus-card__duration-section">
                <div className="bus-card__duration">{calculateDuration(busData.departure, busData.arrival)}</div>
                <div className="bus-card__arrow-icon">→</div>
              </div>
              
              <div className="bus-card__time-column">
                <div className="bus-card__time-value">{formatTime(busData.arrival)}</div>
                <div className="bus-card__city-value">{busData.to}</div>
                <div className="bus-card__station-value">
                  {formattedDropoff}
                </div>
              </div>
            </div>
          </div>

          <div className="bus-card__right">
            <div className="bus-card__details">
              <div className="bus-card__status">
                <span className={`status-badge ${busData.status?.toLowerCase().replace(/\s+/g, '-') || 'yet-to-start'}`}>
                  {busData.status?.toUpperCase() || 'YET TO START'}
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
                <span>{formattedAvailableSeats} / {formattedCapacity} seats</span>
              </div>
            </div>

            <div className="bus-card__booking">
              {busData.isFullyBooked || formattedAvailableSeats <= 0 ? (
                <button className="bus-card__book-button fully-booked" disabled>
                  <span>❌</span>
                  Fully Booked
                </button>
              ) : busData.status?.toLowerCase() === 'completed' ? (
                <button className="bus-card__book-button fully-booked" disabled>
                  <span>✅</span>
                  Completed
                </button>
              ) : (
                <button 
                  className="bus-card__book-button available"
                  onClick={() => handleBookNow(busData)}
                >
                  
                  Book - K{formattedPrice.toFixed(2)}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Amenities section - at bottom */}
        <div className="bus-card__amenities">
          <div className="bus-card__amenities-list">
            {availableAmenities.length > 0 ? (
              availableAmenities.map((amenity, amenityIndex) => (
                <div key={`${amenity}-${amenityIndex}`} className="bus-card__amenity-item" title={getAmenityLabel(amenity)}>
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
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="bus-loading">
        <div className="loading-spinner">⏳</div>
        <p>Loading buses...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bus-error">
        <div className="error-message">
          <span>⚠️</span>
          <p>{error}</p>
          <button onClick={() => {
            hasFetchedRef.current = false; // Reset the fetch flag
            fetchBuses(props.searchParams || {});
          }} className="retry-button">
            <span>🔄</span>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No buses found state
  if (buses.length === 0) {
    return (
      <div className="no-buses-message">
        <div className="no-buses-icon">🚌</div>
        <h3 className="no-buses-title">No buses found</h3>
        <p className="no-buses-subtitle">
          {props.searchParams ? 
            'No buses match your search criteria. Try adjusting your search parameters.' :
            'No buses are currently available. Please try again later.'
          }
        </p>
        {props.searchParams && (
          <button onClick={() => {
            hasFetchedRef.current = false; // Reset the fetch flag
            fetchBuses();
          }} className="retry-button">
            <span>🔄</span>
            Show All Buses
          </button>
        )}
      </div>
    );
  }

  // Main render - check if we're displaying a single bus or multiple buses
  const isSingleBus = props.data || props.bus || (props._id && props.name);
  
  if (isSingleBus) {
    // Single bus display
    const busData = props.data || props.bus || props;
    return renderBusCard(busData, 0);
  }

  // Multiple buses display - just the bus cards
  return (
    <div className="bus-list">
      {buses.map((bus, index) => renderBusCard(bus, index))}
    </div>
  );
};

export default Bus1;
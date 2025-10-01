// src/components/SeatSelect.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaChair, FaBusAlt, FaTools } from 'react-icons/fa';
import '../resources/SeatSelect.css';

function SeatSelect({ 
  selectedSeats, 
  setSelectedSeats, 
  busId, // Bus ID to fetch data from database
  bookedSeats = [], // Can be passed as prop or fetched from database
  maxSeats = 4 // Maximum seats a user can select
}) {
  // State for bus data
  const [busData, setBusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMaxSeatWarning, setShowMaxSeatWarning] = useState(false);

  // Maximum possible seats in the visual layout (always 69)
  const maxLayoutSeats = 69;
  
  // Fetch bus data from API
  useEffect(() => {
    const fetchBusData = async () => {
      if (!busId) {
        setError('Bus ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Get token from localStorage (adjust based on your auth implementation)
        const token = localStorage.getItem('token');
        
        const response = await axios.get(`/api/buses/get-bus/${busId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          setBusData(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch bus data');
        }
      } catch (err) {
        console.error('Error fetching bus data:', err);
        setError(err.response?.data?.message || 'Failed to fetch bus data');
      } finally {
        setLoading(false);
      }
    };

    fetchBusData();
  }, [busId]);

  // Clear warning after 3 seconds
  useEffect(() => {
    if (showMaxSeatWarning) {
      const timer = setTimeout(() => {
        setShowMaxSeatWarning(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showMaxSeatWarning]);

  // Get actual bus capacity and booked seats from fetched data
  const actualBusCapacity = busData?.capacity || 4; // fallback if not provided
  const actualBookedSeats = busData?.seatsBooked || bookedSeats || [];
  // Calculate available seats by subtracting booked seats from capacity
  const availableSeats = actualBusCapacity - actualBookedSeats.length;
  
  // Calculate which seats should be unavailable based on actual bus capacity
  // If bus capacity is less than 69, mark excess seats as unavailable
  const unavailableSeats = getUnavailableSeats(actualBusCapacity, maxLayoutSeats);
  
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

  // Function to determine unavailable seats based on actual bus capacity
  // Marks seats beyond the bus capacity as unavailable starting from the back
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

  // Loading state
  if (loading) {
    return (
      <div className="seat-select-container">
        <div className="loading-state" style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading bus information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="seat-select-container">
        <div className="error-state" style={{ textAlign: 'center', padding: '2rem', color: '#d32f2f' }}>
          <h3>Error Loading Bus Data</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#1976d2', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No bus data
  if (!busData) {
    return (
      <div className="seat-select-container">
        <div className="no-data-state" style={{ textAlign: 'center', padding: '2rem' }}>
          <p>No bus data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="seat-select-container">
      {/* Header with seat selection info */}
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Select Your Seats</span>
          <span style={{ 
            fontSize: '0.9em', 
            fontWeight: 'normal',
            color: selectedSeats.length >= maxSeats ? '#d32f2f' : '#666'
          }}>
           
          </span>
        </h4>
        
        {/* Maximum seat warning */}
        {showMaxSeatWarning && (
          <div style={{
            backgroundColor: '#fff3cd',
            color: '#856404',
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ffeaa7',
            fontSize: '0.9em',
            marginBottom: '1rem',
            animation: 'fadeInOut 3s ease-in-out'
          }}>
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
      
      <br />
      <br />
      
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

      {/* Additional CSS for the fadeInOut animation and disabled state */}
      <style jsx>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-10px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        
        .disabled-max-reached {
          opacity: 0.4;
          pointer-events: none;
        }
        
        .disabled-max-reached:hover {
          background-color: initial !important;
          transform: none !important;
        }
      `}</style>
    </div>
  );
}

export default SeatSelect;
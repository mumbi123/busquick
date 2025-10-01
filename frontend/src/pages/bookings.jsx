import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { usePDF } from 'react-to-pdf';
import '../resources/Booking.css';


const API_BASE_URL = 'http://localhost:5173';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// PDFTicket Component (now internal)
const PDFTicket = ({ booking, onDownload }) => {
  const { toPDF, targetRef } = usePDF({ filename: 'busquick-ticket.pdf' });

  const handleDownload = async () => {
    try {
      await toPDF();
      if (onDownload) {
        onDownload();
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    let timeToFormat;
    if (timeString.includes('T')) {
      timeToFormat = new Date(timeString);
    } else {
      timeToFormat = new Date(`2000-01-01T${timeString}`);
    }
    return timeToFormat.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getBusDisplayName = (booking) => {
    if (!booking) return 'Bus Name';
    if (booking.bus?.name) {
      const number = booking.bus.number || booking.bus.busNumber || '';
      return number ? `${booking.bus.name}` : booking.bus.name;
    }
    if (booking.busName) return booking.busName;
    return 'Bus Name';
  };

  const getBusNumber = (booking) => {
    if (!booking) return '';
    return booking.bus?.number || booking.bus.busNumber || 'JIL 2025';
  };

  const getBusRoute = (booking) => {
    const from = booking.bus?.from || booking.fromCity || booking.from || 'LUSAKA';
    const to = booking.bus?.to || booking.toCity || booking.to || 'NDOLA';
    return { from: from.toUpperCase(), to: to.toUpperCase() };
  };

  const getBusDate = (booking) => {
    return booking.bus?.date || booking.bus?.journeydate || booking.date || booking.journeyDate;
  };

  const getBusTimes = (booking) => {
    const departure = booking.bus?.departureTime || booking.bus?.departure || booking.departureTime;
    const arrival = booking.bus?.arrivalTime || booking.bus?.arrival || booking.arrivalTime;
    return { departure, arrival };
  };

  const route = getBusRoute(booking);
  const times = getBusTimes(booking);
  const seatNumbers = booking.seats?.sort((a, b) => a - b) || [];
  const primarySeat = seatNumbers[0] || 1;

  return (
    <>
      <div 
        ref={targetRef} 
        style={{ 
          position: 'absolute',
          top: '-9999px',
          left: '0',
          width: '1200px',
          backgroundColor: 'white'
        }}
      >
        <div className="ticket-container">
          {/* Header */}
          <div className="ticket-header">
            <span className="company-name">BUSQUICK LOGISTICS</span>
            <span className="ticket-type">E-TICKET</span>
            <span className="thank-you">THANK YOU FOR CHOOSING US</span>
            <div className="seat-number-badge">
              <div className="seat-label">Seat No.</div>
              <div className="seat-value">W-{primarySeat}</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="ticket-body">
            {/* Left Section */}
            <div className="left-section">
              <div className="seat-number-large">W-{primarySeat}</div>
              <div className="logo-circle">
                <span className="logo-text">BUSQUICK</span>
              </div>
            </div>

            {/* Middle Section */}
            <div className="middle-section">
              {/* Bus Info */}
              <div className="bus-info">
                <div className="info-row">
                  <span className="info-label">Seat No.</span>
                  <span className="info-value">{seatNumbers.map(s => `W-${s}`).join(', ')}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">BUS:</span>
                  <span className="info-value">{getBusDisplayName(booking)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Number Plate:</span>
                  <span className="info-value">{getBusNumber(booking)}</span>
                </div>
              </div>

              {/* Journey Section */}
              <div className="journey-section">
                {/* Departure */}
                <div className="departure-info">
                  <div className="location-label">Departure</div>
                  <div className="city-name departure-city">{route.from}</div>
                  <div className="station-name">INTER-CITY</div>
                  <div className="time-display departure-time">⏰ {formatTime(times.departure)}</div>
                </div>

                {/* Bus Icon & Arrow */}
                <div className="journey-arrow">
                  <div className="bus-icon">🚌</div>
                  <div className="arrow-line">
                    <div className="arrow-head"></div>
                  </div>
                </div>

                {/* Arrival */}
                <div className="arrival-info">
                  <div className="location-label">Arrival</div>
                  <div className="city-name arrival-city">{route.to}</div>
                  <div className="station-name">BROADWAY</div>
                  <div className="time-display arrival-time">⏰ {formatTime(times.arrival)}</div>
                </div>
              </div>
            </div>

            {/* Right Section - Ticket Info */}
            <div className="right-section">
              <div className="ticket-number-section">
                <div className="ticket-label">Ticket No.</div>
                <div className="ticket-number">{booking._id?.substring(0, 11) || '441-623-900'}</div>
              </div>

              {/* QR Code Placeholder */}
              <div className="qr-code-container">
                <div className="qr-pattern"></div>
                <div className="qr-checkmark">✓</div>
              </div>

              {/* Passenger Details */}
              <div className="passenger-section">
                <div className="passenger-title">Passenger Details</div>
                <div className="passenger-detail">
                  <div className="detail-label">Name:</div>
                  <div className="detail-value">{booking.passengerDetails?.name || 'James Mwamba'}</div>
                </div>
                <div className="passenger-detail">
                  <div className="detail-label">Tel:</div>
                  <div className="detail-value">{booking.passengerDetails?.phone || '0775112829'}</div>
                </div>
              </div>
            </div>

            {/* Seat Map Section */}
            <div className="seat-map-section">
              <div className="front-label">FRONT</div>
              <div className="seat-grid">
                {Array.from({ length: 17 }, (_, row) => (
                  <div className="seat-row" key={row}>
                    {row < 16 ? (
                      <>
                        <div className={`seat ${seatNumbers.includes(row * 4 + 1) ? 'booked' : ''}`}>
                          {row * 4 + 1}
                        </div>
                        <div className={`seat ${seatNumbers.includes(row * 4 + 2) ? 'booked' : ''}`}>
                          {row * 4 + 2}
                        </div>
                        <div className="seat-aisle"></div>
                        <div className={`seat ${seatNumbers.includes(row * 4 + 3) ? 'booked' : ''}`}>
                          {row * 4 + 3}
                        </div>
                        <div className={`seat ${seatNumbers.includes(row * 4 + 4) ? 'booked' : ''}`}>
                          {row * 4 + 4}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`seat ${seatNumbers.includes(65) ? 'booked' : ''}`}>65</div>
                        <div className={`seat ${seatNumbers.includes(66) ? 'booked' : ''}`}>66</div>
                        <div className={`seat ${seatNumbers.includes(67) ? 'booked' : ''}`}>67</div>
                        <div className={`seat ${seatNumbers.includes(68) ? 'booked' : ''}`}>68</div>
                        <div className={`seat ${seatNumbers.includes(69) ? 'booked' : ''}`}>69</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="barcode-container">
                <div className="barcode-lines"></div>
              </div>
              <div className="ticket-number-bottom">
                Ticket No. {booking._id?.substring(0, 11) || '441-623-900'}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="ticket-footer">
            <div className="footer-left">
              <div className="footer-title">Thank you for choosing BUSQUICK Logistics!</div>
              <div className="footer-text">Please present the information including the bus. Have a safe journey!</div>
            </div>
            <div className="footer-right">
              <div className="footer-title">Customer Support</div>
              <div className="footer-text">Email: support@busquick.co.zm</div>
              <div className="footer-text">Tel: (260) 521700</div>
            </div>
          </div>
        </div>
      </div>

      <button
        className="download-pdf-button-compact"
        onClick={handleDownload} 
        title="Download PDF Ticket"
      >
        PDF
      </button>
    </>
  );
};

// Main Booking Component
function Booking() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
    fetchBookings();
  }, []);

  useEffect(() => {
    const handleBookingUpdate = (event) => {
      addNewBooking(event.detail);
    };

    window.addEventListener('bookingUpdated', handleBookingUpdate);
    return () => {
      window.removeEventListener('bookingUpdated', handleBookingUpdate);
    };
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const response = await api.get('/api/bookings/user-bookings', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        }
      });

      if (response.data.success) {
        setBookings(response.data.data);
      } else {
        setError('Failed to fetch bookings');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Error fetching bookings');
    } finally {
      setLoading(false);
    }
  };

  const addNewBooking = (bookingData) => {
    setBookings(prevBookings => {
      const existingBooking = prevBookings.find(booking => booking._id === bookingData._id);
      if (existingBooking) {
        return prevBookings;
      }
      return [bookingData, ...prevBookings];
    });
  };

  const cancelBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.put(`/api/bookings/cancel/${bookingId}`, {}, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        }
      });

      if (response.data.success) {
        setBookings(prevBookings =>
          prevBookings.map(booking =>
            booking._id === bookingId
              ? { ...booking, status: 'cancelled' }
              : booking
          )
        );
        alert('Booking cancelled successfully!');
      } else {
        alert('Failed to cancel booking');
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert(err.response?.data?.message || 'Error cancelling booking');
    }
  };

  const deleteBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.delete(`/api/bookings/delete/${bookingId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        }
      });

      if (response.data.success) {
        setBookings(prevBookings =>
          prevBookings.filter(booking => booking._id !== bookingId)
        );
        alert('Booking deleted successfully!');
      } else {
        alert('Failed to delete booking');
      }
    } catch (err) {
      console.error('Error deleting booking:', err);
      alert(err.response?.data?.message || 'Error deleting booking');
    }
  };

  const isTripUpcoming = (booking) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tripDate = getBusDate(booking);
    if (!tripDate) return true;
    
    const bookingDate = new Date(tripDate);
    bookingDate.setHours(0, 0, 0, 0);
    
    return bookingDate >= today;
  };

  const separateBookings = () => {
    const upcoming = bookings.filter(booking => isTripUpcoming(booking));
    const past = bookings.filter(booking => !isTripUpcoming(booking));
    
    upcoming.sort((a, b) => {
      const dateA = new Date(getBusDate(a) || 0);
      const dateB = new Date(getBusDate(b) || 0);
      return dateA - dateB;
    });
    
    past.sort((a, b) => {
      const dateA = new Date(getBusDate(a) || 0);
      const dateB = new Date(getBusDate(b) || 0);
      return dateB - dateA;
    });
    
    return { upcoming, past };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    let timeToFormat;
    if (timeString.includes('T')) {
      timeToFormat = new Date(timeString);
    } else {
      timeToFormat = new Date(`2000-01-01T${timeString}`);
    }
    return timeToFormat.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) { 
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#F44336';
      case 'completed': return '#2196F3';
      default: return '#757575';
    }
  };

  const getBusDisplayName = (booking) => {
    if (!booking) return 'Bus Name';
    if (booking.bus?.name) {
      const number = booking.bus.number || booking.bus.busNumber || '';
      return number ? `${booking.bus.name} (${number})` : booking.bus.name;
    }
    if (booking.busName) return booking.busName;
    return 'Bus Name';
  };

  const getBusRoute = (booking) => {
    const from = booking.bus?.from || booking.fromCity || booking.from || 'From';
    const to = booking.bus?.to || booking.toCity || booking.to || 'To';
    return { from, to };
  };

  const getBusDate = (booking) => {
    return booking.bus?.date || booking.bus?.journeydate || booking.date || booking.journeyDate;
  };

  const getBusTimes = (booking) => {
    const departure = booking.bus?.departureTime || booking.bus?.departure || booking.departureTime;
    const arrival = booking.bus?.arrivalTime || booking.bus?.arrival || booking.arrivalTime;
    return { departure, arrival };
  };

  const renderBookingCards = (bookingsToRender) => {
    if (bookingsToRender.length === 0) {
      return (
        <div className="no-bookings">
          <div className="no-bookings-icon">📅</div>
          <h3>No {activeTab} bookings found</h3>
          <p>
            {activeTab === 'upcoming' 
              ? 'Book your next trip to see it here!' 
              : 'Your completed and past trips will appear here.'
            }
          </p>
        </div>
      );
    }

    return (
      <div className="bookings-list">
        {bookingsToRender.map((booking) => {
          const route = getBusRoute(booking);
          const times = getBusTimes(booking);
          const busDate = getBusDate(booking);
          const isUpcoming = isTripUpcoming(booking);

          return (
            <div
              key={booking._id}
              className={`booking-card-journey ${!isUpcoming ? 'past-trip' : ''}`}
            >
              <div className="journey-number">
                {bookingsToRender.indexOf(booking) + 1}
              </div>
              
              <div className="journey-content">
                <div className="journey-header-row">
                  <div className="bus-info-section">
                    <h3 className="bus-name">{getBusDisplayName(booking)}</h3>
                    <div className="route-compact">
                      <span className="route-label">From:</span>
                      <span className="route-value">{route.from}</span>
                      <span className="route-separator">•</span>
                      <span className="route-label">To:</span>
                      <span className="route-value">{route.to}</span>
                    </div>
                  </div>

                  <div className="booking-meta-section">
                    <div className="booking-id">ID: {booking._id?.substring(0, 8)}...</div>
                    <div
                      className="booking-status-small"
                      style={{ backgroundColor: getStatusColor(booking.status) }}
                    >
                      {booking.status?.toUpperCase()}
                    </div>
                  </div>
                </div>

                {userRole === 'admin' && booking.user && (
                  <div className="user-info-journey">
                    <span className="user-label">USER:</span>
                    <span className="user-name">{booking.user.name || 'Unknown'}</span>
                    <span className="user-email">({booking.user.email || ''})</span>
                  </div>
                )}

                <div className="journey-details-grid">
                  <div className="detail-group">
                    <span className="detail-label">Seats:</span>
                    <span className="detail-value">{booking.seats?.sort((a, b) => a - b).join(', ') || 'N/A'}</span>
                  </div>
                  <div className="detail-group">
                    <span className="detail-label">Price:</span>
                    <span className="detail-value price">K{booking.totalPrice || 0}</span>
                  </div>
                  <div className="detail-group">
                    <span className="detail-label">Payment:</span>
                    <span className="detail-value">{booking.paymentMethod === 'mobile' ? 'Mobile Money' : 'Bank Transfer'}</span>
                  </div>
                  {booking.passengerDetails?.name && (
                    <div className="detail-group">
                      <span className="detail-label">Passenger:</span>
                      <span className="detail-value">{booking.passengerDetails.name}</span>
                    </div>
                  )}
                  
                  <div className="journey-actions">
                    {isUpcoming && (
                      <>
                        {booking.status === 'confirmed' && (
                          <button
                            className="action-btn cancel-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to cancel this booking?')) {
                                cancelBooking(booking._id);
                              }
                            }}
                            title="Cancel Booking"
                          >
                            Cancel
                          </button>
                        )}
                        
                        <div onClick={(e) => e.stopPropagation()}>
                          <PDFTicket 
                            booking={booking}
                            onDownload={() => {
                              console.log('PDF downloaded for booking:', booking._id);
                            }}
                          />
                        </div>
                      </>
                    )}

                    {!isUpcoming && (
                      <>
                        <div onClick={(e) => e.stopPropagation()}>
                          <PDFTicket 
                            booking={booking}
                            onDownload={() => {
                              console.log('PDF downloaded for booking:', booking._id);
                            }}
                          />
                        </div>
                        
                        <button
                          className="action-btn delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to permanently delete this booking?')) {
                              deleteBooking(booking._id);
                            }
                          }}
                          title="Delete Booking"
                        >
                          Delete
                        </button>
                      </>
                    )}

                    {booking.status === 'cancelled' && (
                      <button
                        className="action-btn delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to permanently delete this booking?')) {
                            deleteBooking(booking._id);
                          }
                        }}
                        title="Delete Booking"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="departure-badge">
                <span className="departure-label">departure time</span>
                <div className="departure-time">
                  {formatTime(times.departure)}
                </div>
                <div className="departure-date">
                  {formatDate(busDate)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="booking-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="booking-container">
        <div className="error-container">
          <div className="error">Error: {error}</div>
          <button onClick={fetchBookings} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { upcoming, past } = separateBookings();

  return (
    <div className="booking-container">
      <div className="booking-header">
        <h2>
          {userRole === 'admin' ? 'All Bookings' : userRole === 'user' ? 'My Bookings' : 'Bus Bookings'}
        </h2>
        <button onClick={fetchBookings} className="refresh-button">
          🔄 Refresh
        </button>
      </div>

      <div className="booking-tabs">
        <button 
          className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          <span className="tab-icon">🚌</span>
          Upcoming Trips
          {upcoming.length > 0 && <span className="tab-count">{upcoming.length}</span>}
        </button>
        <button 
          className={`tab-button ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          <span className="tab-icon">📜</span>
          Past Trips
          {past.length > 0 && <span className="tab-count">{past.length}</span>}
        </button>
      </div>

      {activeTab === 'upcoming' ? renderBookingCards(upcoming) : renderBookingCards(past)}
    </div>
  );
}

export default Booking;
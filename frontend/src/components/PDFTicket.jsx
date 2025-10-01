import React from 'react';
import { usePDF } from 'react-to-pdf';
import '../resources/PDFTicket.css';

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

export default PDFTicket;
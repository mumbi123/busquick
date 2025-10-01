import React, { useState } from 'react';
import './BusTicket.css';

const BusTicket = () => {
  const [booking] = useState({
    _id: '441-623-900',
    seats: [23],
    busName: 'BUSQUICK LOGISTICS',
    busNumber: 'JIL 2025',
    from: 'LUSAKA',
    to: 'NDOLA',
    departureTime: '05:00',
    arrivalTime: '11:00',
    departureLocation: 'INTER-CITY',
    arrivalLocation: 'BROADWAY',
    date: 'March 15, 2025',
    passengerDetails: {
      name: 'James Mwamba',
      phone: '0775112829',
      email: 'james.mwamba@email.com'
    }
  });

  const seatNumbers = booking.seats?.sort((a, b) => a - b) || [];
  const primarySeat = `W-${seatNumbers[0] || 1}`;

  return (
    <div className="ticket-wrapper">
      <div className="ticket-container">
        {/* Header */}
        <div className="ticket-header">
          <span className="company-name">BUSQUICK LOGISTICS</span>
          <span className="ticket-type">E-TICKET</span>
          <span className="thank-you">THANK YOU FOR CHOOSING US</span>
          <div className="seat-number-badge">
            <div className="seat-label">Seat No.</div>
            <div className="seat-value">{primarySeat}</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="ticket-body">
          {/* Left Section */}
          <div className="left-section">
            <div className="seat-number-large">{primarySeat}</div>
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
                <span className="info-value">{primarySeat}</span>
              </div>
              <div className="info-row">
                <span className="info-label">BUS:</span>
                <span className="info-value">{booking.busName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Number Plate:</span>
                <span className="info-value">{booking.busNumber}</span>
              </div>
            </div>

            {/* Journey Info */}
            <div className="journey-section">
              {/* Departure */}
              <div className="departure-info">
                <div className="location-label">Departure</div>
                <div className="city-name departure-city">{booking.from}</div>
                <div className="station-name">{booking.departureLocation}</div>
                <div className="time-display departure-time">⏰ {booking.departureTime}</div>
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
                <div className="city-name arrival-city">{booking.to}</div>
                <div className="station-name">{booking.arrivalLocation}</div>
                <div className="time-display arrival-time">⏰ {booking.arrivalTime}</div>
              </div>
            </div>
          </div>

          {/* Right Section - Ticket Info */}
          <div className="right-section">
            <div className="ticket-number-section">
              <div className="ticket-label">Ticket No.</div>
              <div className="ticket-number">{booking._id}</div>
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
                <div className="detail-value">{booking.passengerDetails.name}</div>
              </div>
              <div className="passenger-detail">
                <div className="detail-label">Tel:</div>
                <div className="detail-value">{booking.passengerDetails.phone}</div>
              </div>
            </div>
          </div>

          {/* Seat Map Section */}
          <div className="seat-map-section">
            {/* Front Label */}
            <div className="front-label">FRONT</div>

            {/* Seat Grid */}
            <div className="seat-grid">
              {Array.from({ length: 17 }, (_, row) => (
                <div key={row} className="seat-row">
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

            {/* Barcode */}
            <div className="barcode-container">
              <div className="barcode-lines"></div>
            </div>

            {/* Ticket Number Bottom */}
            <div className="ticket-number-bottom">
              Ticket No. {booking._id}
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
  );
};

export default BusTicket;



// /*
// /* Ticket Wrapper */
// .ticket-wrapper {
//   width: 100%;
//   max-width: 1800px;
//   margin: 20px auto;
//   padding: 20px;
//   font-family: 'Arial', sans-serif;
// }

// /* Ticket Container */
// .ticket-container {
//   width: 100%;
//   background-color: white;
//   border-radius: 16px;
//   overflow: hidden;
//   box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
//   border: 3px solid #4caf50;
// }

// /* Header */
// .ticket-header {
//   background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
//   padding: 12px 30px;
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
// }

// .company-name {
//   font-size: 18px;
//   font-weight: 900;
//   color: white;
//   letter-spacing: 2px;
// }

// .ticket-type {
//   font-size: 16px;
//   font-weight: 700;
//   color: white;
//   letter-spacing: 1.5px;
// }

// .thank-you {
//   font-size: 11px;
//   font-weight: 600;
//   color: white;
// }

// .seat-number-badge {
//   background: rgba(255, 255, 255, 0.3);
//   padding: 6px 14px;
//   border-radius: 8px;
//   text-align: center;
//   border: 2px solid rgba(255, 255, 255, 0.5);
// }

// .seat-label {
//   font-size: 9px;
//   color: white;
//   margin-bottom: 3px;
// }

// .seat-value {
//   font-size: 18px;
//   font-weight: 900;
//   color: white;
// }

// /* Main Body */
// .ticket-body {
//   display: flex;
//   height: 360px;
//   background: white;
// }

// /* Left Section */
// .left-section {
//   width: 180px;
//   background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
//   padding: 20px;
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   gap: 30px;
// }

// .seat-number-large {
//   font-size: 72px;
//   font-weight: 900;
//   color: white;
//   text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3);
//   letter-spacing: -2px;
// }

// .logo-circle {
//   width: 100px;
//   height: 100px;
//   background: #388e3c;
//   border-radius: 50%;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   border: 4px solid white;
//   box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
// }

// .logo-text {
//   font-size: 16px;
//   font-weight: 900;
//   color: white;
//   text-align: center;
//   line-height: 1.2;
// }

// /* Middle Section */
// .middle-section {
//   flex: 1;
//   padding: 20px 35px;
//   display: flex;
//   flex-direction: column;
//   gap: 25px;
// }

// .bus-info {
//   display: flex;
//   flex-direction: column;
//   gap: 10px;
//   padding-bottom: 15px;
//   border-bottom: 2px solid #f0f0f0;
// }

// .info-row {
//   display: flex;
//   gap: 10px;
// }

// .info-label {
//   font-size: 11px;
//   color: #666;
//   font-weight: 600;
// }

// .info-value {
//   font-size: 11px;
//   font-weight: 700;
//   color: #000;
// }

// /* Journey Section */
// .journey-section {
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   gap: 30px;
//   flex: 1;
// }

// .departure-info,
// .arrival-info {
//   flex: 1;
//   text-align: center;
// }

// .location-label {
//   font-size: 10px;
//   color: #999;
//   margin-bottom: 8px;
//   font-weight: 600;
// }

// .city-name {
//   font-size: 32px;
//   font-weight: 900;
//   margin-bottom: 5px;
// }

// .departure-city {
//   color: #4caf50;
// }

// .arrival-city {
//   color: #ff9800;
// }

// .station-name {
//   font-size: 13px;
//   color: #666;
//   margin-bottom: 8px;
//   font-weight: 600;
// }

// .time-display {
//   font-size: 16px;
//   font-weight: 700;
// }

// .departure-time {
//   color: #4caf50;
// }

// .arrival-time {
//   color: #ff9800;
// }

// /* Journey Arrow */
// .journey-arrow {
//   text-align: center;
// }

// .bus-icon {
//   font-size: 48px;
//   margin-bottom: 10px;
// }

// .arrow-line {
//   width: 80px;
//   height: 4px;
//   background: linear-gradient(90deg, #4caf50 0%, #45a049 100%);
//   position: relative;
//   margin: 0 auto;
// }

// .arrow-head {
//   position: absolute;
//   right: -8px;
//   top: 50%;
//   transform: translateY(-50%);
//   width: 0;
//   height: 0;
//   border-left: 14px solid #45a049;
//   border-top: 8px solid transparent;
//   border-bottom: 8px solid transparent;
// }

// /* Right Section */
// .right-section {
//   width: 320px;
//   padding: 20px 25px;
//   border-left: 2px dashed #ddd;
//   display: flex;
//   flex-direction: column;
//   gap: 20px;
//   background: #fafafa;
// }

// .ticket-number-section {
//   margin-bottom: 10px;
// }

// .ticket-label {
//   font-size: 10px;
//   color: #999;
//   margin-bottom: 5px;
//   font-weight: 600;
// }

// .ticket-number {
//   font-size: 14px;
//   font-weight: 700;
//   color: #000;
// }

// /* QR Code */
// .qr-code-container {
//   width: 140px;
//   height: 140px;
//   background: white;
//   border: 2px solid #e0e0e0;
//   border-radius: 8px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   margin: 0 auto;
//   position: relative;
//   overflow: hidden;
// }

// .qr-pattern {
//   width: 100%;
//   height: 100%;
//   background: 
//     repeating-linear-gradient(90deg, #000 0px, #000 3px, #fff 3px, #fff 6px),
//     repeating-linear-gradient(0deg, #000 0px, #000 3px, #fff 3px, #fff 6px);
//   opacity: 0.8;
// }

// .qr-checkmark {
//   position: absolute;
//   top: 50%;
//   left: 50%;
//   transform: translate(-50%, -50%);
//   width: 40px;
//   height: 40px;
//   background: #4caf50;
//   border-radius: 50%;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   color: white;
//   font-size: 20px;
//   font-weight: 700;
// }

// /* Passenger Section */
// .passenger-section {
//   margin-top: 10px;
// }

// .passenger-title {
//   font-size: 12px;
//   font-weight: 700;
//   color: #4caf50;
//   margin-bottom: 10px;
// }

// .passenger-detail {
//   margin-bottom: 8px;
// }

// .detail-label {
//   font-size: 10px;
//   color: #999;
//   margin-bottom: 3px;
//   font-weight: 600;
// }

// .detail-value {
//   font-size: 12px;
//   font-weight: 700;
//   color: #000;
// }

// /* Seat Map Section */
// .seat-map-section {
//   width: 280px;
//   background: #f5f5f5;
//   border-left: 2px solid #e0e0e0;
//   padding: 15px;
//   display: flex;
//   flex-direction: column;
//   gap: 12px;
// }

// .front-label {
//   font-size: 12px;
//   font-weight: 700;
//   color: white;
//   background: #ff9800;
//   padding: 6px 0;
//   border-radius: 6px;
//   text-align: center;
//   letter-spacing: 1px;
// }

// /* Seat Grid */
// .seat-grid {
//   display: flex;
//   flex-direction: column;
//   gap: 4px;
//   align-items: center;
//   flex: 1;
//   overflow-y: auto;
// }

// .seat-row {
//   display: flex;
//   gap: 4px;
// }

// .seat {
//   width: 20px;
//   height: 20px;
//   background: #e0e0e0;
//   border-radius: 4px;
//   border: 1px solid #999;
//   font-size: 9px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   color: #333;
//   font-weight: 700;
// }

// .seat.booked {
//   background: #4caf50;
//   color: white;
// }

// .seat-aisle {
//   width: 8px;
// }

// /* Barcode */
// .barcode-container {
//   height: 40px;
//   background: white;
//   border: 1px solid #ddd;
//   border-radius: 4px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   overflow: hidden;
// }

// .barcode-lines {
//   width: 90%;
//   height: 70%;
//   background: repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px);
// }

// .ticket-number-bottom {
//   font-size: 10px;
//   font-weight: 700;
//   color: #666;
//   text-align: center;
// }

// /* Footer */
// .ticket-footer {
//   background: white;
//   padding: 12px 30px;
//   display: flex;
//   justify-content: space-between;
//   border-top: 2px solid #e0e0e0;
//   font-size: 10px;
//   color: #666;
// }

// .footer-left,
// .footer-right {
//   line-height: 1.6;
// }

// .footer-right {
//   text-align: right;
// }

// .footer-title {
//   font-weight: 700;
//   margin-bottom: 3px;
// }

// .footer-text {
//   margin-bottom: 2px;
// }
// */

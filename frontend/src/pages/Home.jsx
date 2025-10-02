import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { message } from 'antd';
import { showLoading, hideLoading } from '../redux/alertsSlice';
import Bus from '../components/Bus';
import BusSearch from '../components/BusSearch';
import TopTraveled from '../components/topTraveled';
import Reviews from '../components/reviews';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';
import '../resources/home.css';

function Home() {
  const { user } = useSelector((state) => state.users);
  const dispatch = useDispatch();
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchParams, setSearchParams] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [dateRange, setDateRange] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [sortBy, setSortBy] = useState('');
  const navigate = useNavigate();

  const baseURL = import.meta.env.NODE_ENV === 'development' ||'development'  ? 'http://localhost:5000' : 'https://busquick.onrender.com';

  const getBuses = async (date = '') => {
    try {
      setLoading(true);
      dispatch(showLoading());
      const config = {
        method: 'post',
        url: `${baseURL}/api/buses/get-all-buses`,
        data: { ...(searchParams || {}) },
        headers: { 'Content-Type': 'application/json' },
      };
      const token = localStorage.getItem('token');
      if (token) config.headers['Authorization'] = `Bearer ${token}`;

      const response = await axios(config);
      dispatch(hideLoading());
      if (response.data.success) {
        const busesData = response.data.data;
        
        // If we're in search mode, keep the full bus data
        if (isSearchActive) {
          // Don't update buses state, keep the original search results
          // Only update filtered buses for display
          if (date) {
            const filtered = buses.filter(bus => {
              const busDate = new Date(bus.journeydate);
              const checkDate = new Date(date);
              return busDate.getFullYear() === checkDate.getFullYear() &&
                     busDate.getMonth() === checkDate.getMonth() &&
                     busDate.getDate() === checkDate.getDate();
            });
            setFilteredBuses(filtered);
          }
        } else {
          // Initial load - set both buses and filteredBuses
          setBuses(busesData);
          setFilteredBuses(busesData);
        }
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      message.error(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchResults = (searchResults, params) => {
    setBuses(searchResults); // Store all search results in buses state
    setFilteredBuses(searchResults);
    setSearchParams(params);
    setIsSearchActive(true);
    generateDateRange(params.departureDate);
    setSelectedDate(params.departureDate);
    setSortBy('');
    if (searchResults.length === 0) {
      message.info('No buses found matching your search criteria');
    }
  };

  const generateDateRange = (centerDate) => {
    const dates = [];
    const base = new Date(centerDate);
    for (let i = -3; i <= 3; i++) {
      const date = new Date(base);
      date.setDate(base.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    setDateRange(dates);
  };

  const handleDateSelect = async (date) => {
    setSelectedDate(date);
    generateDateRange(date);
    
    if (isSearchActive && searchParams) {
      const updatedParams = { ...searchParams, departureDate: date };
      setSearchParams(updatedParams);
      await getBuses(date);
    }
  };

  const sortBuses = (buses, sortType) => {
    if (!sortType) return buses;

    const sorted = [...buses].sort((a, b) => {
      switch (sortType) {
        case 'time-earliest':
          return a.departure.localeCompare(b.departure);
        case 'time-latest':
          return b.departure.localeCompare(a.departure);
        case 'price-cheapest':
          return a.price - b.price;
        case 'duration-fastest':
          const getDuration = (dep, arr) => {
            const [depHour, depMin] = dep.split(':').map(Number);
            const [arrHour, arrMin] = arr.split(':').map(Number);
            const depMinutes = depHour * 60 + depMin;
            let arrMinutes = arrHour * 60 + arrMin;
            if (arrMinutes < depMinutes) arrMinutes += 24 * 60;
            return arrMinutes - depMinutes;
          };
          return getDuration(a.departure, a.arrival) - getDuration(b.departure, b.arrival);
        default:
          return 0;
      }
    });
    return sorted;
  };

  const handleSortChange = (sortType) => {
    setSortBy(sortType);
    const sortedBuses = sortBuses(filteredBuses, sortType);
    setFilteredBuses(sortedBuses);
  };

  const handleShowAllBuses = () => {
    setFilteredBuses(buses);
    setIsSearchActive(false);
    setSearchParams(null);
    setDateRange([]);
    setSelectedDate('');
    setSortBy('');
    message.info('Showing all available buses');
  };

  const handleLoginClick = () => setLoginModalVisible(true);
  const handleRegisterClick = () => setRegisterModalVisible(true);
  const handleLoginSuccess = () => {
    setLoginModalVisible(false);
    message.success('Login successful!');
    window.location.reload();
  };
  const handleRegisterSuccess = () => {
    setRegisterModalVisible(false);
    message.success('Registration successful!');
  };

  useEffect(() => {
    getBuses();
  }, []);

  const displayedBuses = isSearchActive ? filteredBuses : buses;
  
  const minPricePerDate = isSearchActive && dateRange.length > 0 ? 
    dateRange.reduce((acc, date) => {
      const dateBuses = buses.filter(bus => {
        const busDate = new Date(bus.journeydate);
        const checkDate = new Date(date);
        // Compare dates properly
        return busDate.getFullYear() === checkDate.getFullYear() &&
               busDate.getMonth() === checkDate.getMonth() &&
               busDate.getDate() === checkDate.getDate();
      });
      
      if (dateBuses.length === 0) {
        acc[date] = null;
      } else {
        acc[date] = Math.min(...dateBuses.map(bus => bus.price));
      }
      return acc;
    }, {}) : {};

  return (
    <div>
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-logo-container">
            <img src="/images/logo.jpg" alt="BusQuick Logo" className="hero-logo" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <h1 className="hero-title">
            Find <span className="highlight">cheap</span><br /> 
            bus tickets for<br /> 
            your <span className="highlight">next trip</span>
          </h1>
          <h6 className="hero-subtitle">
            - Smart Travel Starts With BusQuick!!
            {!user && <span className="guest-indicator"> - Browse as guest, login to book</span>}
          </h6>
          <BusSearch onSearchResults={handleSearchResults} />
          <br /><br /><br />
          {!user && (
            <div className="guest-actions">
              <p className="guest-actions-text">
                <i className="ri-information-line"></i>
                New to BusQuick? 
                <button className="register-link-btn" onClick={handleRegisterClick}>Create an account</button> 
                or 
                <button className="login-link-btn" onClick={handleLoginClick}>login</button> 
                to book tickets
              </p>
            </div>
          )}
        </div>
        <div className="hero-visual">
          <div className="clouds">
            <div className="cloud cloud1"></div>
            <div className="cloud cloud2"></div>
          </div>
          <div className="bus-container">
            <svg className="bus-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10M6.5 17a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3M5 11V6h14v5H5Z"/>
              <rect x="6" y="7" width="3" height="2" fill="white" fillOpacity="0.8"/>
              <rect x="10" y="7" width="3" height="2" fill="white" fillOpacity="0.8"/>
              <rect x="14" y="7" width="3" height="2" fill="white" fillOpacity="0.8"/>
            </svg>
            <div className="speed-lines">
              <div className="speed-line"></div>
              <div className="speed-line"></div>
              <div className="speed-line"></div>
            </div>
            <div className="road"></div>
          </div>
        </div> 
      </div>

      <div className="main-content">
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner">Loading buses...</div>
          </div>
        )}
        <div className="bus-list">
          {!loading && isSearchActive && dateRange.length > 0 && (
            <div className="enhanced-date-filter-container">
              <div className="enhanced-date-selector">
                {dateRange.map(date => {
                  const price = minPricePerDate[date];
                  const hasNoBuses = price === null;
                  const isToday = new Date(date).toDateString() === new Date().toDateString();
                  
                  return (
                    <button
                      key={date}
                      className={`enhanced-date-button ${selectedDate === date ? 'active' : ''} ${hasNoBuses ? 'no-buses' : ''}`}
                      onClick={() => handleDateSelect(date)}
                    >
                      {isToday && <span className="enhanced-today-badge">Today</span>}
                      <div className="enhanced-date-weekday">
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="enhanced-date-day">
                        {new Date(date).getDate()}
                      </div>
                      <div className="enhanced-date-month">
                        {new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="enhanced-date-price">
                        {hasNoBuses ? '-' : `K${price}`}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="enhanced-quick-filters">
                <div className="enhanced-filter-label">Sort by:</div>
                <div className="enhanced-filter-buttons">
                  <button 
                    className={`enhanced-filter-btn ${sortBy === 'time-earliest' ? 'active' : ''}`}
                    onClick={() => handleSortChange('time-earliest')}
                  >
                    <i className="ri-time-line"></i>
                    Earliest
                  </button>
                  <button 
                    className={`enhanced-filter-btn ${sortBy === 'time-latest' ? 'active' : ''}`}
                    onClick={() => handleSortChange('time-latest')}
                  >
                    <i className="ri-time-line"></i>
                    Latest
                  </button>
                  <button 
                    className={`enhanced-filter-btn ${sortBy === 'duration-fastest' ? 'active' : ''}`}
                    onClick={() => handleSortChange('duration-fastest')}
                  >
                    <i className="ri-flashlight-line"></i>
                    Fastest
                  </button>
                  <button 
                    className={`enhanced-filter-btn ${sortBy === 'price-cheapest' ? 'active' : ''}`}
                    onClick={() => handleSortChange('price-cheapest')}
                  >
                    <i className="ri-money-dollar-circle-line"></i>
                    Cheapest
                  </button>
                  {sortBy && (
                    <button 
                      className="enhanced-filter-btn enhanced-clear-btn"
                      onClick={() => handleSortChange('')}
                    >
                      <i className="ri-close-line"></i>
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {!loading && displayedBuses.length > 0 ? (
            displayedBuses.map((bus) => (
              <Bus
                key={bus._id}
                id={bus._id}
                busName={bus.name}
                number={bus.number}
                from={bus.from}
                to={bus.to}
                departure={bus.departure}
                arrival={bus.arrival}
                price={bus.price}
                availableSeats={bus.availableSeats}
                isFullyBooked={bus.isFullyBooked}
                journeyDate={bus.journeydate}
                status={bus.status}
                pickup={bus.pickup}
                dropoff={bus.dropoff}
                amenities={bus.amenities}
                capacity={bus.capacity}
                drivername={bus.drivername}
              />
            ))
          ) : !loading && (
            <div className="no-buses-container">
              {isSearchActive ? (
                <div className="no-search-results">
                  <h3>No buses found</h3>
                  <p>
                    No buses match your search criteria for {searchParams?.from} → {searchParams?.to}
                    {searchParams?.departureDate && <span> on {new Date(searchParams.departureDate).toLocaleDateString()}</span>}
                  </p>
                  <button className="show-all-button" onClick={handleShowAllBuses} type="button">View All Available Buses</button>
                </div>
              ) : (
                <div className="no-buses">
                  <h3>No buses available</h3>
                  <p>There are currently no buses in the system.</p>
                  {!user && (
                    <div className="guest-encouragement">
                      <p>
                        <i className="ri-information-line"></i>
                        Want to add buses to the system? 
                        <button className="register-encourage-btn" onClick={handleRegisterClick}>Register</button> 
                        as a vendor or admin.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {!user && displayedBuses.length > 0 && (
          <div className="guest-cta">
            <div className="cta-content">
              <h3>Ready to book your journey?</h3>
              <p>Join thousands of satisfied travelers who trust BusQuick for their bus bookings</p>
              <div className="cta-buttons">
                <button className="cta-button primary" onClick={handleRegisterClick}><i className="ri-user-add-line"></i>Sign Up Now</button>
                <button className="cta-button secondary" onClick={handleLoginClick}><i className="ri-login-circle-line"></i>Login</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <br/><br />
      <Reviews />
      <br />
      <TopTraveled />
      <LoginModal visible={loginModalVisible} onCancel={() => setLoginModalVisible(false)} onSuccess={handleLoginSuccess} />
      <RegisterModal visible={registerModalVisible} onCancel={() => setRegisterModalVisible(false)} onSuccess={handleRegisterSuccess} />
    </div>
  );
}

export default Home;

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../resources/BusSearch.css';

function BusSearch({ onSearchResults }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [showOriginList, setShowOriginList] = useState(false);
  const [showDestinationList, setShowDestinationList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  const originRef = useRef(null);
  const destRef = useRef(null);
  const abortControllerRef = useRef(null);

  const cities = [
    'Lusaka', 'Ndola', 'Kitwe', 'Kabwe', 'Livingstone', 'Chipata', 'Chingola', 'Mufulira',
    'Kasama', 'Choma', 'Luanshya', 'Mansa', 'Solwezi', 'Mazabuka', 'Mkushi', 'Kasumbalesa',
    'Nakonde', 'Mpulungu', 'Kawambwa', 'Chavuma'
  ];

  // Check if mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const today = new Date();
    const iso = today.toISOString().split('T')[0];
    setDepartureDate(iso); 
  }, []);
 
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (originRef.current && !originRef.current.contains(event.target)) {
        setShowOriginList(false);
      }
      if (destRef.current && !destRef.current.contains(event.target)) {
        setShowDestinationList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const filterCities = (input) => { 
    if (!input) return cities;
    return cities.filter((c) => c.toLowerCase().startsWith(input.toLowerCase()));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setError('');
    setIsLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const token = localStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:5000/api/buses/get-all-buses', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ 
          from: origin,
          to: destination,
          departureDate 
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch buses');
      }

      const result = await response.json();
      if (result.success) {
        const uniqueBuses = result.data.filter((bus, index, self) => 
          index === self.findIndex((b) => b._id === bus._id)
        );
        
        if (onSearchResults) {
          onSearchResults(uniqueBuses, { 
            from: origin, 
            to: destination, 
            departureDate 
          });
        }
      } else {
        throw new Error(result.message || 'No buses found');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      
      console.error('Search error:', error);
      setError(error.message);
      if (onSearchResults) {
        onSearchResults([], { 
          from: origin, 
          to: destination, 
          departureDate 
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSwapLocations = () => {
    const tempOrigin = origin;
    setOrigin(destination);
    setDestination(tempOrigin);
    
    // Close any open suggestion lists
    setShowOriginList(false);
    setShowDestinationList(false);
  };

  const handleOriginSelect = (city) => {
    setOrigin(city);
    setShowOriginList(false);
    // On mobile, close any other open dropdowns
    if (isMobile) {
      setShowDestinationList(false);
    }
  };

  const handleDestinationSelect = (city) => {
    setDestination(city);
    setShowDestinationList(false);
    // On mobile, close any other open dropdowns
    if (isMobile) {
      setShowOriginList(false);
    }
  };

  const handleOriginFocus = () => {
    setShowOriginList(true);
    // On mobile, close destination list when opening origin
    if (isMobile) {
      setShowDestinationList(false);
    }
  };

  const handleDestinationFocus = () => {
    setShowDestinationList(true);
    // On mobile, close origin list when opening destination
    if (isMobile) {
      setShowOriginList(false);
    }
  };

  return (
    <div className="bus-search-container">
      <form className={`search-form ${isLoading ? 'loading' : ''}`} onSubmit={handleSubmit}>
        {/* FROM input */}
        <div className="form-group" ref={originRef}>
          <input
            type="text"
            className="bus-search-input"
            placeholder="Enter departure city"
            value={origin}
            onChange={(e) => {
              setOrigin(e.target.value);
              setShowOriginList(true);
              setError('');
              // On mobile, close destination dropdown
              if (isMobile) {
                setShowDestinationList(false);
              }
            }}
            onFocus={handleOriginFocus}
            required
            disabled={isLoading}
          />
          {showOriginList && !isLoading && (
            <div className="bus-search-suggestions">
              {filterCities(origin).length > 0 ? (
                filterCities(origin).map((city) => (
                  <div
                    key={city}
                    className="bus-search-suggestion-item"
                    onClick={() => handleOriginSelect(city)}
                  >
                    {city}
                  </div>
                ))
              ) : (
                <div className="bus-search-suggestion-item no-results">
                  No cities found
                </div>
              )}
            </div>
          )}
        </div>

        {/* SWAP button */}
        <button
          type="button"
          className="swap-button"
          onClick={handleSwapLocations}
          disabled={isLoading}
          title="Swap locations"
        >
          {isMobile ? '⇅' : '⇄'}
        </button>

        {/* TO input */}
        <div className="form-group" ref={destRef}>
          <input
            type="text"
            className="bus-search-input"
            placeholder="Enter destination city"
            value={destination}
            onChange={(e) => {
              setDestination(e.target.value);
              setShowDestinationList(true);
              setError('');
              // On mobile, close origin dropdown
              if (isMobile) {
                setShowOriginList(false);
              }
            }}
            onFocus={handleDestinationFocus}
            required
            disabled={isLoading}
          />
          {showDestinationList && !isLoading && (
            <div className="bus-search-suggestions">
              {filterCities(destination).length > 0 ? (
                filterCities(destination).map((city) => (
                  <div
                    key={city}
                    className="bus-search-suggestion-item"
                    onClick={() => handleDestinationSelect(city)}
                  >
                    {city}
                  </div>
                ))
              ) : (
                <div className="bus-search-suggestion-item no-results">
                  No cities found
                </div>
              )}
            </div>
          )}
        </div>

        {/* DATE input */}
        <div className="form-group">
          <input
            type="date"
            className="bus-search-input"
            value={departureDate}
            onChange={(e) => {
              setDepartureDate(e.target.value);
              setError('');
              // Close any open dropdowns when selecting date
              setShowOriginList(false);
              setShowDestinationList(false);
            }}
            min={new Date().toISOString().split('T')[0]}
            required
            disabled={isLoading}
            onFocus={() => {
              // Close dropdowns when focusing on date
              setShowOriginList(false);
              setShowDestinationList(false);
            }}
          />
        </div>

        {/* SEARCH button */}
        <button type="submit" className="search-button" disabled={isLoading}>
          <i className="ri-search-line"></i> 
          {isLoading ? 'Searching...' : 'Search Buses'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
}

export default BusSearch;
import React, { useState } from 'react';
import '../resources/Filter.css';

const Filter = ({ buses, onFilterApplied }) => {
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [depTimeRanges, setDepTimeRanges] = useState([]);
  const [arrTimeRanges, setArrTimeRanges] = useState([]);
  const [selectedOperators, setSelectedOperators] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Helper functions (duplicated from Bus.jsx for independence)
  const getBusName = (busData) => {
    const actualBusName = busData.name || busData.busName || 'Bus Company';
    if (!actualBusName || actualBusName === '') return 'Bus Company';
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
        .filter(([_, value]) => {
          if (typeof value === 'boolean') return value;
          if (typeof value === 'string') return value.toLowerCase() === 'true';
          if (typeof value === 'number') return value === 1;
          if (typeof value === 'object' && value !== null) {
            if (value.$numberInt) return parseInt(value.$numberInt) === 1;
            if (value.$numberDouble) return parseFloat(value.$numberDouble) === 1;
          }
          return false;
        })
        .map(([key]) => key.toLowerCase());
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
          .map(([key]) => key.toLowerCase());
      } catch (e) {
        console.error('Error parsing amenities JSON:', e);
        return [];
      }
    }
    return [];
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

  const parseTimeToMinutes = (timeStr) => {
    const formatted = formatTime(timeStr);
    if (!formatted) return 0;
    const [hours, minutes] = formatted.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };

  // Unique operators and amenity options
  const uniqueOperators = [...new Set(buses.map(getBusName))];
  const timeRanges = [
    { label: 'Before 6 AM', value: 'before6' },
    { label: '6 AM - 12 PM', value: 'morning' },
    { label: '12 PM - 6 PM', value: 'afternoon' },
    { label: 'After 6 PM', value: 'evening' }
  ];
  const amenityOptions = ['ac', 'wifi', 'tv', 'charger', 'bathroom', 'luggage'];

  // Apply filters
  const applyFilters = () => {
    let filtered = [...buses];

    if (selectedOperators.length > 0) {
      filtered = filtered.filter(bus => selectedOperators.includes(getBusName(bus)));
    }

    if (selectedAmenities.length > 0) {
      filtered = filtered.filter(bus => {
        const busAmenities = getAvailableAmenities(bus.amenities);
        return selectedAmenities.every(am => busAmenities.includes(am.toLowerCase()));
      });
    }

    const min = parseFloat(minPrice) || 0;
    const max = parseFloat(maxPrice) || Infinity;
    filtered = filtered.filter(bus => {
      const price = formatPrice(bus.price);
      return price >= min && price <= max;
    });

    if (depTimeRanges.length > 0) {
      filtered = filtered.filter(bus => {
        const depMinutes = parseTimeToMinutes(bus.departure);
        return depTimeRanges.some(range => {
          if (range === 'before6') return depMinutes < 360;
          if (range === 'morning') return depMinutes >= 360 && depMinutes < 720;
          if (range === 'afternoon') return depMinutes >= 720 && depMinutes < 1080;
          if (range === 'evening') return depMinutes >= 1080 || depMinutes < 360;
          return false;
        });
      });
    }

    if (arrTimeRanges.length > 0) {
      filtered = filtered.filter(bus => {
        const arrMinutes = parseTimeToMinutes(bus.arrival);
        return arrTimeRanges.some(range => {
          if (range === 'before6') return arrMinutes < 360;
          if (range === 'morning') return arrMinutes >= 360 && arrMinutes < 720;
          if (range === 'afternoon') return arrMinutes >= 720 && arrMinutes < 1080;
          if (range === 'evening') return arrMinutes >= 1080 || arrMinutes < 360;
          return false;
        });
      });
    }

    onFilterApplied(filtered);
    setShowFilters(false);
  };

  // Reset filters
  const resetFilters = () => {
    setDepTimeRanges([]);
    setArrTimeRanges([]);
    setSelectedOperators([]);
    setSelectedAmenities([]);
    setMinPrice('');
    setMaxPrice('');
    onFilterApplied(buses);
    setShowFilters(false);
  };

  return (
    <div className="filter-container">
      <button 
        className="floating-filter-button" 
        onClick={() => setShowFilters(!showFilters)}
      >
        {showFilters ? 'Close Filters' : 'Filters'}
      </button>

      {showFilters && (
        <div className="filter-panel">
          <h2>Apply Filters</h2>

          <section className="filter-section">
            <h3>Bus Operator</h3>
            <div className="filter-options">
              {uniqueOperators.map((operator) => (
                <label key={operator} className="filter-label">
                  <input 
                    type="checkbox" 
                    checked={selectedOperators.includes(operator)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOperators([...selectedOperators, operator]);
                      } else {
                        setSelectedOperators(selectedOperators.filter((op) => op !== operator));
                      }
                    }}
                  />
                  {operator}
                </label>
              ))}
            </div>
          </section>

          <section className="filter-section">
            <h3>Departure Time</h3>
            <div className="filter-options">
              {timeRanges.map((range) => (
                <label key={range.value} className="filter-label">
                  <input 
                    type="checkbox" 
                    checked={depTimeRanges.includes(range.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setDepTimeRanges([...depTimeRanges, range.value]);
                      } else {
                        setDepTimeRanges(depTimeRanges.filter((r) => r !== range.value));
                      }
                    }}
                  />
                  {range.label}
                </label>
              ))}
            </div>
          </section>

          <section className="filter-section">
            <h3>Arrival Time</h3>
            <div className="filter-options">
              {timeRanges.map((range) => (
                <label key={range.value} className="filter-label">
                  <input 
                    type="checkbox" 
                    checked={arrTimeRanges.includes(range.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setArrTimeRanges([...arrTimeRanges, range.value]);
                      } else {
                        setArrTimeRanges(arrTimeRanges.filter((r) => r !== range.value));
                      }
                    }}
                  />
                  {range.label}
                </label>
              ))}
            </div>
          </section>

          <section className="filter-section">
            <h3>Amenities</h3>
            <div className="filter-options">
              {amenityOptions.map((amenity) => (
                <label key={amenity} className="filter-label">
                  <input 
                    type="checkbox" 
                    checked={selectedAmenities.includes(amenity)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAmenities([...selectedAmenities, amenity]);
                      } else {
                        setSelectedAmenities(selectedAmenities.filter((am) => am !== amenity));
                      }
                    }}
                  />
                  {getAmenityLabel(amenity)} {getAmenityIcon(amenity)}
                </label>
              ))}
            </div>
          </section>

          <section className="filter-section">
            <h3>Price Range (K)</h3>
            <div className="price-range">
              <input 
                type="number" 
                placeholder="Min Price" 
                value={minPrice} 
                onChange={(e) => setMinPrice(e.target.value)} 
                className="price-input"
              />
              <input 
                type="number" 
                placeholder="Max Price" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(e.target.value)} 
                className="price-input"
              />
            </div>
          </section>

          <div className="filter-actions">
            <button onClick={applyFilters} className="apply-button">Apply</button>
            <button onClick={resetFilters} className="reset-button">Reset</button>
          </div>
        </div>
      )}
    </div>
  ); 
};

export default Filter; 
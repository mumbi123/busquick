import React, { useState, useEffect } from 'react';
import PageTitle from '../../components/PageTitle';
import BusForm from '../../components/BusForm';
import axiosInstance from '../../helpers/axiosinstance';
import { message, Modal, Select } from 'antd';
import { useDispatch } from 'react-redux';
import { showLoading, hideLoading } from '../../redux/alertsSlice';
import '../../resources/busStyles.css';

const { Option } = Select;

function AdminBuses() {
  const [showBusForm, setShowBusForm] = useState(false);
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const formatJourneyDate = (date) => {
    if (!date) return 'Not Set';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Invalid Date';
      const opts = { day: 'numeric', month: 'short', year: 'numeric' };
      return d.toLocaleDateString('en-GB', opts).replace(',', '');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTime = (date) => {
    if (!date) return '07:40 AM';
    try {
      // Handle both ISO date strings and time strings
      let timeToFormat = date;
      
      // If it's a full ISO date, extract just the time part
      if (typeof date === 'string' && date.includes('T')) {
        timeToFormat = date.split('T')[1]?.split('.')[0]; // Get HH:mm:ss part
      }
      
      // If it's just a time string like "07:40" or "07:40:00"
      if (typeof timeToFormat === 'string' && timeToFormat.includes(':')) {
        const [hours, minutes] = timeToFormat.split(':');
        const hour24 = parseInt(hours, 10);
        const minute = parseInt(minutes, 10);
        
        if (isNaN(hour24) || isNaN(minute)) return '07:40 AM';
        
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        
        return `${hour12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;
      }
      
      // Fallback to Date parsing
      const d = new Date(date);
      if (isNaN(d.getTime())) return '07:40 AM';
      
      return d.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      return '07:40 AM';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Yet To Start': return 'yet-to-start';
      case 'Running': return 'running';
      case 'Completed': return 'completed';
      case 'Cancelled': return 'cancelled';
      default: return 'yet-to-start';
    }
  };

  const getSeatColorClass = (availableSeats, capacity) => {
    const percentage = (availableSeats / capacity) * 100;
    if (percentage === 0) return 'full';
    if (percentage <= 20) return 'low';
    return '';
  };

  const getBuses = async () => {
    try {
      setLoading(true);
      dispatch(showLoading());
      const response = await axiosInstance.post('/api/buses/get-all-buses', {});
      dispatch(hideLoading());
      setLoading(false);
      if (response.data.success) {
        setBuses(response.data.data);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      setLoading(false);
      message.error(error.response?.data?.message || error.message || 'An error occurred');
    }
  };

  const getBusById = async (id) => {
    try {
      dispatch(showLoading());
      const response = await axiosInstance.get(`/api/buses/get-bus/${id}`);
      dispatch(hideLoading());
      if (response.data.success) {
        return response.data.data;
      } else {
        message.error(response.data.message);
        return null; 
      }
    } catch (error) {
      dispatch(hideLoading());
      message.error(error.response?.data?.message || error.message || 'An error occurred');
      return null;
    }
  };

  const updateBusStatus = async (id, status) => {
    try {
      dispatch(showLoading());
      const response = await axiosInstance.put(`/api/buses/update-bus-status/${id}`, {
        status: status
      });
      dispatch(hideLoading());
      if (response.data.success) {
        message.success('Bus status updated successfully');
        getBuses();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      message.error(error.response?.data?.message || error.message || 'An error occurred');
    }
  };

  const editBus = async (id, busData) => {
    try {
      dispatch(showLoading());
      const response = await axiosInstance.put(`/api/buses/edit-bus/${id}`, busData);
      dispatch(hideLoading());
      if (response.data.success) {
        message.success('Bus details updated successfully');
        getBuses();
        setShowBusForm(false);
        setSelectedBus(null);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      message.error(error.response?.data?.message || error.message || 'An error occurred');
    }
  };

  const addBus = async (busData) => {
    try {
      dispatch(showLoading());
      const response = await axiosInstance.post('/api/buses/add-bus', busData);
      dispatch(hideLoading());
      if (response.data.success) {
        message.success('Bus added successfully');
        getBuses();
        setShowBusForm(false);
        setSelectedBus(null);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      message.error(error.response?.data?.message || error.message || 'An error occurred');
    }
  };

  const deleteBus = (id) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this bus?',
      okButtonProps: { style: { backgroundColor: '#40a944' } },
      onOk: async () => {
        try {
          dispatch(showLoading());
          const response = await axiosInstance.delete(`/api/buses/delete-bus/${id}`);
          dispatch(hideLoading());
          if (response.data.success) {
            message.success(response.data.message);
            getBuses();
          } else {
            message.error(response.data.message);
          }
        } catch (error) {
          dispatch(hideLoading());
          message.error(error.response?.data?.message || error.message || 'An error occurred');
        }
      },
    });
  };

  useEffect(() => {
    getBuses();
  }, []);

  const renderBusCard = (bus) => (
    <div key={bus._id} className="bus-card">
      {/* Compact Yellow Bus Number Badge */}
      <div className="bus-number-badge">
        {bus.number}
      </div>

      {/* Single Row Main Content */}
      <div className="bus-main-content">
        {/* Bus Info Section - Fixed route text */}
        <div className="bus-info-section">
          <h3 className="bus-title">{bus.name || `Bus ${bus.number}`} ({bus.number})</h3>
          <div className="bus-route">
            <span className="route-text">From: {bus.from}</span>
            <span className="route-separator">•</span>
            <span className="route-text">To: {bus.to}</span>
          </div>
        </div>

        {/* Bus ID */}
        <div className="bus-id-inline">
          ID: {bus._id.slice(-8)}...
        </div>

        {/* All Details in One Row - Fixed Price Field Compatibility */}
        <div className="bus-all-details">
          <div className="detail-item">
            <span className="detail-label">Seats:</span>
            <span className={`detail-value seats-value ${getSeatColorClass(bus.availableSeats, bus.capacity)}`}>
              {bus.availableSeats}/{bus.capacity}
            </span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Price:</span>
            <span className="detail-value price-value">
              {/* Handle both fare and price fields for compatibility */}
              {bus.fare ? `K${bus.fare}` : bus.price ? `K${bus.price}` : 'Not Set'}
            </span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Status:</span>
            <Select
              value={bus.status}
              className="status-select-inline"
              onChange={(newStatus) => updateBusStatus(bus._id, newStatus)}
              style={{ width: 100, marginLeft: 4 }}
              size="small"
            >
              <Option value="Yet To Start">Yet To Start</Option>
              <Option value="Running">Running</Option>
              <Option value="Completed">Completed</Option>
              <Option value="Cancelled">Cancelled</Option>
            </Select> 
          </div>
        </div>

        {/* Inline Actions */}
        <div className="bus-actions-inline">
          <button
            className="action-btn-inline delete"
            onClick={() => deleteBus(bus._id)}
          >
            Delete
          </button>
          
          <button
            className="action-btn-inline edit"
            onClick={() => {
              setSelectedBus(bus);
              setShowBusForm(true);
            }}
          >
            Edit
          </button>
        </div>
      </div>

      {/* Compact Departure Section - Enhanced time and date handling */}
      <div className="bus-departure-compact">
        <div className="departure-label-compact">departure time</div>
        <div className="departure-time-compact">{formatTime(bus.departure)}</div>
        <div className="departure-date-compact">{formatJourneyDate(bus.journeydate)}</div>
      </div>
    </div>
  );

  return (
    <div className="admin-buses-container">
      {/* Header */}
      <div className="admin-header">
        <PageTitle title="Buses" />
        <button
          className="add-bus-btn"
          onClick={() => {
            setSelectedBus(null);
            setShowBusForm(true);
          }}
        >
          <span className="plus-icon">+</span>
          Add Bus
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          Loading buses...
        </div>
      )}

      {/* Bus List */}
      {!loading && (
        <div className="buses-grid">
          {buses.length > 0 ? (
            buses.map(renderBusCard)
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🚌</div>
              <h3>No buses found</h3>
              <p>Get started by adding your first bus to the system.</p>
            </div>
          )}
        </div>
      )}

      {/* Bus Form Modal */}
      {showBusForm && (
        <BusForm
          showBusForm={showBusForm}
          setShowBusForm={setShowBusForm}
          type={selectedBus ? 'edit' : 'add'}
          selectedBus={selectedBus}
          setSelectedBus={setSelectedBus}
          getData={getBuses}
        />
      )}
    </div>
  );
}

export default AdminBuses;
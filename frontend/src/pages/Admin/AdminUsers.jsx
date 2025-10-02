import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, TrendingDown, Calendar, Mail, User, Shield, Clock, Search, X } from 'lucide-react';
import axios from 'axios';
import '../../resources/users.css';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    currentMonthUsers: 0,
    previousMonthUsers: 0,
    growthPercentage: 0
  });

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try { 
        setLoading(true);
        setError(null);
        
        // Get auth token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const response = await axios.get('/api/users/all', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          const fetchedUsers = response.data.data || response.data.users || [];
          setUsers(fetchedUsers);
          setFilteredUsers(fetchedUsers);
          
          // Calculate stats
          calculateStats(fetchedUsers);
        } else {
          setError(response.data.message || 'Failed to fetch users');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err.response?.data?.message || 'Error fetching users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const calculateStats = (usersList) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
     
    const currentMonthUsers = usersList.filter(user => {
      const userDate = new Date(user.createdAt);
      return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear;
    }).length;
    
    const previousMonthUsers = usersList.filter(user => {
      const userDate = new Date(user.createdAt);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return userDate.getMonth() === prevMonth && userDate.getFullYear() === prevYear;
    }).length;
    
    const growth = previousMonthUsers === 0 ? 
      (currentMonthUsers > 0 ? 100 : 0) : 
      ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100;
    
    setStats({
      totalUsers: usersList.length,
      currentMonthUsers,
      previousMonthUsers,
      growthPercentage: growth
    });
  };

  // Search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
    // Reset expanded user when search changes
    setExpandedUser(null);
  }, [searchTerm, users]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const toggleExpand = (userId) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield className="role-icon admin" />;
      case 'vendor': return <User className="role-icon vendor" />;
      default: return <User className="role-icon user" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admin-users-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-users-container">
        <div className="error-container">
          <h2>Error Loading Users</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users-container">
      {/* Header */}
      <div className="page-header">
        <h1>
          <Users className="header-icon" />
          User Management
        </h1>
        <p>Manage and monitor all system users</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total-users">
          <div className="stat-icon">
            <Users />
          </div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="stat-card current-month">
          <div className="stat-icon">
            <Calendar />
          </div>
          <div className="stat-content">
            <h3>This Month new users</h3>
            <p className="stat-number">{stats.currentMonthUsers}</p>
          </div>
        </div>

        <div className="stat-card previous-month">
          <div className="stat-icon">
            <Clock />
          </div>
          <div className="stat-content">
            <h3>Last Month new users</h3>
            <p className="stat-number">{stats.previousMonthUsers}</p>
          </div>
        </div>

        <div className={`stat-card growth ${stats.growthPercentage >= 0 ? 'positive' : 'negative'}`}>
          <div className="stat-icon">
            {stats.growthPercentage >= 0 ? <TrendingUp /> : <TrendingDown />}
          </div>
          <div className="stat-content">
            <h3>Growth</h3>
            <p className="stat-number">
              {stats.growthPercentage > 0 ? '+' : ''}
              {stats.growthPercentage.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="users-section">
        <div className="section-header">
          <div className="section-header-content">
            
            <div className="search-container">
              <div className="search-input-wrapper">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    onClick={clearSearch}
                    className="clear-search-btn"
                    aria-label="Clear search"
                  >
                    <X />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="users-list">
          {filteredUsers.length === 0 ? (
            <div className="no-users-found">
              <Users className="no-users-icon" />
              <p>
                {searchTerm 
                  ? `No users found matching "${searchTerm}"` 
                  : 'No users found'
                }
              </p>
              {searchTerm && (
                <button onClick={clearSearch} className="clear-search-link">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filteredUsers.map((user) => (
            <div 
              key={user._id} 
              className={`user-card ${expandedUser === user._id ? 'expanded' : ''}`}
              onClick={() => toggleExpand(user._id)}
            >
              <div className="user-card-header">
                <div className="user-basic-info">
                  <div className="user-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-details">
                    <h3 className="user-name">{user.name}</h3>
                    <div className="user-role">
                      {getRoleIcon(user.role)}
                      <span className={`role-text ${user.role}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="expand-indicator">
                  <span className={`arrow ${expandedUser === user._id ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>

              {expandedUser === user._id && (
                <div className="user-card-expanded">
                  <div className="expanded-content">
                    <div className="info-row">
                      <Mail className="info-icon" />
                      <div className="info-content">
                        <label>Email</label>
                        <span>{user.email}</span>
                      </div>
                    </div>
                    <div className="info-row">
                      <Calendar className="info-icon" />
                      <div className="info-content">
                        <label>Date Created</label>
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                    </div>
                    <div className="info-row">
                      <Calendar className="info-icon" />
                      <div className="info-content">
                        <label>Last Updated</label>
                        <span>{formatDate(user.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;
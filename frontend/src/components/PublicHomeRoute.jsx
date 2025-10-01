// src/components/PublicHomeRoute.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axiosInstance from '../helpers/axiosinstance';
import { setUser } from '../redux/usersSlice';
import { showLoading, hideLoading } from '../redux/alertsSlice';
import DefaultLayout from './DefaultLayout';

function PublicHomeRoute({ children }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.users);
  const [checking, setChecking] = useState(true);

  const checkUserSession = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        // No token - user is a guest
        setChecking(false);
        return;
      }

      // Token exists - verify it's valid
      dispatch(showLoading());
      const { data } = await axiosInstance.get('/api/users/me');
      dispatch(hideLoading());

      if (data.success) {
        dispatch(setUser(data.data));
      } else {
        // Invalid token - remove it and continue as guest
        localStorage.removeItem('token');
      }
    } catch (err) {
      // Token validation failed - remove it and continue as guest
      dispatch(hideLoading());
      localStorage.removeItem('token');
      console.log('Session check failed, continuing as guest');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Only check session if we don't already have user data
    if (!user) {
      checkUserSession();
    } else {
      setChecking(false);
    }
  }, []);

  // Show loading only briefly during initial check
  if (checking) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return <DefaultLayout>{children}</DefaultLayout>;
}

export default PublicHomeRoute;
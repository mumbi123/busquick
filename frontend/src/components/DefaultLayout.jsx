import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Form, Input, message } from 'antd';
import axios from 'axios';
import { showLoading, hideLoading } from '../redux/alertsSlice';
import { setUser } from '../redux/usersSlice';
import '../resources/layout.css';
import '../resources/loginregister.css';
import Footer from './footer';

const BASE_URL = 'https://busquick.onrender.com';
const ADMIN_ROLE = 'admin';
const USER_ROLE = 'user';
const VENDOR_ROLE = 'vendor';

function DefaultLayout({ children }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.users);

  // Dropdown states
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [activeAuthItem, setActiveAuthItem] = useState(null);
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const dropdownRef = useRef(null);

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAuthDropdown(false);
        setActiveAuthItem(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Guest menu
  const guestMenu = [
    { path: '/', icon: 'ri-home-4-line', name: 'Home' },
    { path: '/login', icon: 'ri-login-circle-line', name: 'Login', isAuth: true },
    { path: '/register', icon: 'ri-user-add-line', name: 'Register', isAuth: true },
  ];

  const adminMenu = [
    { path: '/admin', icon: 'ri-home-4-line', name: 'Home' },
    { path: '/bookings', icon: 'ri-file-list-line', name: 'Bookings' },
    { path: '/admin/buses', icon: 'ri-bus-line', name: 'Buses' },
    { path: '/admin/prices', icon: 'ri-money-dollar-circle-line', name: 'Prices' },
    { path: '/admin/users', icon: 'ri-user-line', name: 'Users' },
    { path: '/logout', icon: 'ri-logout-circle-line', name: 'Logout' },
  ];

  const vendorMenu = [
    { path: '/admin', icon: 'ri-home-4-line', name: 'Home' },
    { path: '/bookings', icon: 'ri-file-list-line', name: 'Bookings' },
    { path: '/admin/buses', icon: 'ri-bus-line', name: 'Buses' },
    { path: '/logout', icon: 'ri-logout-circle-line', name: 'Logout' },
  ];

  const userMenu = [
    { path: '/', icon: 'ri-home-4-line', name: 'Home' },
    { path: '/bookings', icon: 'ri-file-list-line', name: 'Bookings' },
    { path: '/logout', icon: 'ri-logout-circle-line', name: 'Logout' },
  ];

  const getMenu = () => {
    if (!user) return guestMenu;

    switch (user.role) {
      case ADMIN_ROLE:
        return adminMenu;
      case VENDOR_ROLE:
        return vendorMenu;
      case USER_ROLE:
        return userMenu;
      default:
        return userMenu;
    }
  };

  const menu = getMenu();
  const active = window.location.pathname;

  // ✅ Fixed login API call
  const handleLogin = async (values) => {
    try {
      dispatch(showLoading());
      const { data } = await axios.post(`${BASE_URL}/api/users/login`, values);
      dispatch(hideLoading());

      if (!data.success) return message.error(data.message);

      const { token, user } = data.data;
      localStorage.setItem('token', token);
      dispatch(setUser(user));

      message.success('Login successful');
      setShowAuthDropdown(false);
      setActiveAuthItem(null);
      loginForm.resetFields();
      navigate('/', { replace: true });
    } catch {
      dispatch(hideLoading());
      message.error('Invalid credentials');
    }
  };

  // ✅ Fixed register API call
  const handleRegister = async (values) => {
    try {
      dispatch(showLoading());
      const response = await axios.post(`${BASE_URL}/api/users/register`, values);
      dispatch(hideLoading());

      if (response.data.success) {
        message.success(response.data.message);
        setAuthMode('login');
        registerForm.resetFields();
        message.info('Please login with your new account');
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      message.error(
        error.response?.data?.message || 'Registration failed. Please try again.'
      );
    }
  };

  const handleMenuClick = (item) => {
    if (item.isAuth && !user) {
      const newAuthMode = item.path === '/register' ? 'register' : 'login';
      setAuthMode(newAuthMode);
      setActiveAuthItem(item.path);
      setShowAuthDropdown(true);
    } else if (item.path === '/logout') {
      localStorage.removeItem('token');
      navigate('/');
      message.success('Logged out successfully');
      window.location.reload();
    } else if (item.path === '/bookings' && !user) {
      message.warning('Please login to view your bookings');
      setAuthMode('login');
      setActiveAuthItem('/login');
      setShowAuthDropdown(true);
    } else {
      navigate(item.path);
    }
  };

  const switchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
    loginForm.resetFields();
    registerForm.resetFields();
  };

  const closeAuthDropdown = () => {
    setShowAuthDropdown(false);
    setActiveAuthItem(null);
  };

  return (
    <>
      <div className="layout-parent">
        <div className="header">
          <div className="logo-section">
            <h1 className="logo">BusQuick</h1>
            <h6 className="role">
              {user
                ? `${user.role === 'vendor' ? 'Operator' : user.role}: ${user.name}`
                : 'Welcome, Guest'}
            </h6>
          </div>

          <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
            <i className="ri-menu-line"></i>
          </button>

          <div className="menu">
            {menu.map((item) => (
              <div
                key={item.path}
                className={`menu-item ${active === item.path ? 'active-menu-item' : ''}`}
                onClick={() => handleMenuClick(item)}
                style={{ position: 'relative' }}
              >
                <i className={item.icon}></i>
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Overlay */}
        <div
          className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Sidebar */}
        <div className={`sidebar ${isSidebarOpen ? 'active' : ''}`}>
          {menu.map((item) => (
            <div
              key={item.path}
              className={`menu-item ${active === item.path ? 'active-menu-item' : ''}`}
              onClick={() => {
                handleMenuClick(item);
                setIsSidebarOpen(false);
              }}
            >
              <i className={item.icon}></i>
              <span>{item.name}</span>
            </div>
          ))}
        </div>

        {/* Auth Dropdown */}
        {showAuthDropdown && (
          <>
            <div
              className={`auth-overlay ${showAuthDropdown ? 'show' : ''}`}
              onClick={closeAuthDropdown}
            />
            <div
              ref={dropdownRef}
              className={`auth-dropdown ${showAuthDropdown ? 'show' : ''}`}
              style={{
                position: 'fixed',
                top: '80px',
                right: '20px',
                zIndex: 1000,
              }}
            >
              <div className="auth-dropdown-card">
                <button className="auth-close" onClick={closeAuthDropdown}>
                  ×
                </button>

                <h3>{authMode === 'login' ? 'Welcome Back' : 'Join BusQuick'}</h3>

                {authMode === 'login' ? (
                  <Form form={loginForm} onFinish={handleLogin} layout="vertical">
                    <div className="auth-form-group">
                      <Form.Item
                        name="email"
                        rules={[{ required: true, type: 'email', message: 'Please enter a valid email!' }]}
                      >
                        <input className="auth-input" placeholder="Enter your email" type="email" />
                      </Form.Item>
                    </div>

                    <div className="auth-form-group">
                      <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please enter your password!' }]}
                      >
                        <input className="auth-input" placeholder="Enter your password" type="password" />
                      </Form.Item>
                    </div>

                    <button type="submit" className="auth-btn">
                      Sign In
                    </button>

                    <div className="auth-switch">
                      Don't have an account?
                      <button type="button" onClick={switchAuthMode}>
                        Sign up
                      </button>
                    </div>
                  </Form>
                ) : (
                  <Form form={registerForm} onFinish={handleRegister} layout="vertical">
                    <div className="auth-form-group">
                      <Form.Item
                        name="name"
                        rules={[{ required: true, message: 'Please enter your name!' }]}
                      >
                        <input className="auth-input" placeholder="Enter your full name" type="text" />
                      </Form.Item>
                    </div>

                    <div className="auth-form-group">
                      <Form.Item
                        name="email"
                        rules={[{ required: true, type: 'email', message: 'Please enter a valid email!' }]}
                      >
                        <input className="auth-input" placeholder="Enter your email" type="email" />
                      </Form.Item>
                    </div>

                    <div className="auth-form-group">
                      <Form.Item
                        name="password"
                        rules={[
                          { required: true, message: 'Please enter your password!' },
                          { min: 6, message: 'Password must be at least 6 characters' },
                        ]}
                      >
                        <input
                          className="auth-input"
                          placeholder="Create a password (min 6 chars)"
                          type="password"
                        />
                      </Form.Item>
                    </div>

                    <button type="submit" className="auth-btn">
                      Create Account
                    </button>

                    <div className="auth-switch">
                      Already have an account?
                      <button type="button" onClick={switchAuthMode}>
                        Sign in
                      </button>
                    </div>
                  </Form>
                )}
              </div>
            </div>
          </>
        )}

        <div className="body">
          <div className="content">{children}</div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default DefaultLayout;

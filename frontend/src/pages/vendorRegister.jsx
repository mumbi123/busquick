import React from 'react';
import { Form, Input, message, Button } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { showLoading, hideLoading } from '../redux/alertsSlice';
import '../resources/global.css';
import '../resources/loginregister.css';

const baseURL = import.meta.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';

function VendorRegister() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onFinish = async (values) => { 
    try {
      dispatch(showLoading());
      // Add userType: 'vendor' to the payload
      const payload = { ...values, userType: 'vendor' };
      const response = await axios.post(`${baseURL}/api/users/vendor-register`, payload);
      dispatch(hideLoading());

      if (response.data.success) {
        message.success(response.data.message);
        navigate('/login');
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      message.error(error.response?.data?.message || 'Vendor registration failed. Please try again.');
      console.error('Vendor registration error:', error);
    }
  };

  return (
    <div className="auth-container">
      <h3>Vendor Registration</h3>
      <Form layout="vertical" onFinish={onFinish}>
        <div className="auth-form-group">
          <Form.Item
            label={<label>Business Name</label>}
            name="name"
            rules={[{ required: true, message: 'Please input your business name!' }]}
          >
            <Input className="auth-input" placeholder="Enter your business name" />
          </Form.Item>
        </div>
        <div className="auth-form-group">
          <Form.Item
            label={<label>Business Email</label>}
            name="email"
            rules={[{ required: true, type: 'email', message: 'Please input a valid business email!' }]}
          >
            <Input className="auth-input" placeholder="Enter your business email" />
          </Form.Item>
        </div>
        <div className="auth-form-group">
          <Form.Item
            label={<label>Contact Phone</label>}
            name="phone"
            rules={[{ required: true, message: 'Please input your contact phone!' }]}
          >
            <Input className="auth-input" placeholder="Enter your contact phone" />
          </Form.Item>
        </div>
        <div className="auth-form-group">
          <Form.Item
            label={<label>Business Address</label>}
            name="address"
            rules={[{ required: true, message: 'Please input your business address!' }]}
          >
            <Input.TextArea 
              className="auth-input" 
              placeholder="Enter your business address"
              rows={3}
            />
          </Form.Item>
        </div>
        <div className="auth-form-group">
          <Form.Item
            label={<label>Password</label>}
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password className="auth-input" placeholder="Create a password" />
          </Form.Item>
        </div>
        <Button type="primary" htmlType="submit" className="auth-btn">
          Register as Vendor
        </Button>
        <div className="auth-switch">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')}>Login here</button>
        </div>
      </Form>
    </div>
  );
}

export default VendorRegister;
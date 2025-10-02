import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { showLoading, hideLoading } from '../redux/alertsSlice';
import { setUser } from '../redux/usersSlice';
import '../resources/global.css';
import '../resources/loginregister.css';

const baseURL = import.meta.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';

function Login({ onSuccess }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onFinish = async (values) => {
    try {
      dispatch(showLoading());
      const response = await axios.post(`${baseURL}/api/users/login`, values);
      const { data } = response;
      dispatch(hideLoading());

      if (!data.success) {
        message.error(data.message);
        return;
      }

      const { token, user } = data.data;
      localStorage.setItem('token', token);
      dispatch(setUser(user));
      message.success('Login successful');

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/', { replace: true });
      }
    } catch {
      dispatch(hideLoading());
      message.error('Invalid credentials');
    }
  };

  return (
    <div className="auth-container">
      <h3>Login</h3>
      <Form layout="vertical" onFinish={onFinish}>
        <div className="auth-form-group">
          <Form.Item
            label={<label>Email</label>}
            name="email"
            rules={[{ required: true, type: 'email', message: 'Please input a valid email!' }]}
          >
            <Input className="auth-input" placeholder="Enter your email" />
          </Form.Item>
        </div>
        <div className="auth-form-group">
          <Form.Item
            label={<label>Password</label>}
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password className="auth-input" placeholder="Enter your password" />
          </Form.Item>
        </div>
        <Button type="primary" htmlType="submit" className="auth-btn">
          Login
        </Button>
        <div className="auth-switch">
          Don't have an account?{' '}
          <button onClick={() => navigate('/register')}>Register here</button>
        </div>
      </Form>
    </div>
  );
}

export default Login;
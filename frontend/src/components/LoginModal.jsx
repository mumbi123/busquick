import React from 'react';
import { Modal } from 'antd';
import Login from '../pages/Login';
import '../resources/registerloginmodal.css';

function LoginModal({ visible, onCancel, onSuccess }) {
  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      className="auth-modal"
      wrapClassName="auth-modal-wrapper"
      centered
      width={500}
      maskClosable={true}
    >
      <div className="auth-dropdown-card">
        <button className="auth-close" onClick={onCancel}>
          &times;
        </button>
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your account to continue</p>
        </div>
        <Login onSuccess={onSuccess} />
      </div>
    </Modal>
  );
}

export default LoginModal;
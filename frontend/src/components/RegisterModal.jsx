import React from 'react';
import { Modal } from 'antd';
import Register from '../pages/register';
import '../resources/registerloginmodal.css';

function RegisterModal({ visible, onCancel, onSuccess }) {
  return (
    <Modal
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
          <h2>Join BusQuick</h2>
          <p>Create your account and start booking</p>
        </div>
        <Register onSuccess={onSuccess} />
      </div>
    </Modal>
  );
}

export default RegisterModal;

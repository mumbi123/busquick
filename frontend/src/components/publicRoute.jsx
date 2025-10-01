import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PublicRoute({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('token')) navigate('/', { replace: true });
  }, [navigate]);

  return <>{children}</>;
}

export default PublicRoute;

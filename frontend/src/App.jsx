import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';

import Home from './pages/Home';
import AdminPrice from './pages/Admin/AdminPrice';
import AdminHome from './pages/Admin/AdminHome';
import AdminBuses from './pages/Admin/AdminBuses';
import AdminUsers from './pages/Admin/AdminUsers';
import ProtectedRoute from './components/protectedRoute';
import PublicHomeRoute from './components/PublicHomeRoute'; // Component for Home page
import Loader from './components/Loader';
import BookNow from './pages/BookNow';
import Bookings from './pages/bookings';
import Payment from './components/payment';
import TermsAndConditions from './components/terms';

function App() {
  const { loading } = useSelector((state) => state.alerts);

  return (
    <div className="app-container">
      {loading && <Loader />}
      <div className="main-content"> 
        <BrowserRouter>
          <Routes>
            {/* Home page - accessible to both guests and authenticated users */}
            <Route path="/" element={<PublicHomeRoute><Home /></PublicHomeRoute>} />
            
            {/* Admin routes - require authentication */}
            <Route path="/admin/buses" element={<ProtectedRoute><AdminBuses /></ProtectedRoute>} />
            <Route path="/admin/prices" element={<ProtectedRoute><AdminPrice /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminHome /></ProtectedRoute>} />
            
            {/* Protected user routes */}
            <Route path="/book-now/:id" element={<ProtectedRoute><BookNow /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
            <Route path="/payment"     element={<ProtectedRoute><Payment/></ProtectedRoute>} />

            {/* Terms and Conditions */}
            <Route path="/terms" element={<PublicHomeRoute><TermsAndConditions /></PublicHomeRoute>} />
            
            {/* Catch all route - redirect to home for any unmatched routes */}
            <Route path="*" element={<PublicHomeRoute><Home /></PublicHomeRoute>} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
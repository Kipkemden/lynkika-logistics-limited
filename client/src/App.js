import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import theme from './theme';

// Public Pages
import HomePage from './pages/HomePage';
import QuotePage from './pages/QuotePage';
import BookingPage from './pages/BookingPage';
import TrackingPage from './pages/TrackingPage';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import RouteManagement from './pages/admin/RouteManagement';
import BookingManagement from './pages/admin/BookingManagement';
import CourierEntry from './pages/admin/CourierEntry';

// Context
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/quote" element={<QuotePage />} />
              <Route path="/book/:service" element={<BookingPage />} />
              <Route path="/track" element={<TrackingPage />} />
              
              {/* Admin Routes */}
              <Route path="/ops-control-center" element={<AdminLogin />} />
              <Route path="/ops-control-center/dashboard" element={<AdminDashboard />} />
              <Route path="/ops-control-center/routes" element={<RouteManagement />} />
              <Route path="/ops-control-center/bookings" element={<BookingManagement />} />
              <Route path="/ops-control-center/courier" element={<CourierEntry />} />
            </Routes>
          </Router>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
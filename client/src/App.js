import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import theme from './theme';

// Lazy load components for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const QuotePage = lazy(() => import('./pages/QuotePage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const TrackingPage = lazy(() => import('./pages/TrackingPage'));

// Admin Pages - separate chunk
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const RouteManagement = lazy(() => import('./pages/admin/RouteManagement'));
const BookingManagement = lazy(() => import('./pages/admin/BookingManagement'));
const CourierEntry = lazy(() => import('./pages/admin/CourierEntry'));

// Context
import { AuthProvider } from './context/AuthContext';

// Loading component
const PageLoader = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="50vh"
  >
    <CircularProgress />
  </Box>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AuthProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
          </Router>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
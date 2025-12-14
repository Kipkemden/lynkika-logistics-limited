import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, Paper, Alert } from '@mui/material';
import { Security, Block } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { hasPermission, getRoleDisplayName } from '../../utils/permissions';
import AdminLayout from './AdminLayout';

const ProtectedRoute = ({ 
  children, 
  requiredPermission, 
  requiredRole = null,
  fallbackMessage = "You don't have permission to access this resource."
}) => {
  const { user, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Typography variant="h6">Loading...</Typography>
        </Box>
      </AdminLayout>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/ops-control-center" replace />;
  }

  // Check role-based access
  if (requiredRole && user.role !== requiredRole) {
    return (
      <AdminLayout>
        <Box sx={{ p: 4 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Block sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom color="error">
              Access Denied
            </Typography>
            <Typography variant="h6" gutterBottom>
              Insufficient Privileges
            </Typography>
            <Alert severity="error" sx={{ mt: 3, maxWidth: 600, mx: 'auto' }}>
              <Typography variant="body1">
                This resource requires <strong>{requiredRole.replace('_', ' ').toUpperCase()}</strong> privileges.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Your current role: <strong>{getRoleDisplayName(user.role)}</strong>
              </Typography>
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Contact your system administrator if you believe this is an error.
            </Typography>
          </Paper>
        </Box>
      </AdminLayout>
    );
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
    return (
      <AdminLayout>
        <Box sx={{ p: 4 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Security sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom color="warning.main">
              Permission Required
            </Typography>
            <Typography variant="h6" gutterBottom>
              Restricted Access
            </Typography>
            <Alert severity="warning" sx={{ mt: 3, maxWidth: 600, mx: 'auto' }}>
              <Typography variant="body1">
                {fallbackMessage}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Required permission: <strong>{requiredPermission.replace('_', ' ').toUpperCase()}</strong>
              </Typography>
              <Typography variant="body2">
                Your role: <strong>{getRoleDisplayName(user.role)}</strong>
              </Typography>
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              This action has been logged for security purposes.
            </Typography>
          </Paper>
        </Box>
      </AdminLayout>
    );
  }

  // User has proper access
  return children;
};

export default ProtectedRoute;
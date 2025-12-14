import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Grid,
  Tabs,
  Tab
} from '@mui/material';
import {
  Edit,
  Visibility,
  Assignment
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';

const BookingManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    location: '',
    notes: ''
  });
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/ops-control-center');
      return;
    }
    fetchBookings();
  }, [user, navigate, page, statusFilter, serviceFilter]);

  const fetchBookings = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (statusFilter) params.append('status', statusFilter);
      if (serviceFilter) params.append('serviceType', serviceFilter);
      
      const response = await axios.get(`/api/admin/bookings?${params}`);
      setBookings(response.data.bookings);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setDialogOpen(true);
  };

  const handleStatusUpdate = (booking) => {
    setSelectedBooking(booking);
    setStatusUpdate({
      status: booking.status,
      location: '',
      notes: ''
    });
    setStatusUpdateDialog(true);
  };

  const submitStatusUpdate = async () => {
    try {
      await axios.put(`/api/admin/bookings/${selectedBooking._id}/status`, statusUpdate);
      fetchBookings();
      setStatusUpdateDialog(false);
    } catch (error) {
      console.error('Failed to update status:', error);
      
      // Show error message to user
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert('Failed to update status. Please try again.');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'picked': return 'secondary';
      case 'in_transit': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getServiceTypeColor = (serviceType) => {
    switch (serviceType) {
      case 'movers': return 'primary';
      case 'freight': return 'secondary';
      case 'scheduled_route': return 'success';
      case 'courier': return 'warning';
      default: return 'default';
    }
  };

  // Status options based on user role and current status
  const getAvailableStatusOptions = (currentStatus) => {
    const allStatuses = [
      { value: 'pending', label: 'Pending', level: 0 },
      { value: 'confirmed', label: 'Confirmed', level: 1 },
      { value: 'picked', label: 'Picked (In Store)', level: 2, restrictedRoles: ['super_admin', 'operations_manager'] },
      { value: 'in_transit', label: 'In Transit', level: 3 },
      { value: 'delivered', label: 'Delivered', level: 4 },
      { value: 'cancelled', label: 'Cancelled', level: -1 }
    ];

    const currentLevel = allStatuses.find(s => s.value === currentStatus)?.level || 0;
    
    return allStatuses.filter(status => {
      // Always allow cancellation
      if (status.value === 'cancelled') return true;
      
      // Check role restrictions
      if (status.restrictedRoles && !status.restrictedRoles.includes(user?.role)) {
        return false;
      }
      
      // Prevent backward progression (except picked to in_transit)
      if (status.level < currentLevel && !(currentStatus === 'picked' && status.value === 'in_transit')) {
        return false;
      }
      
      // Don't show current status
      if (status.value === currentStatus) return false;
      
      // Validate specific transitions
      const validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['picked', 'in_transit', 'cancelled'],
        'picked': ['in_transit', 'cancelled'],
        'in_transit': ['delivered', 'cancelled'],
        'delivered': [], // Final status
        'cancelled': []  // Final status
      };
      
      return validTransitions[currentStatus]?.includes(status.value) || false;
    });
  };

  // Status options for filtering (all statuses)
  const statusFilterOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'picked', label: 'Picked (In Store)' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const serviceTypes = [
    { value: 'movers', label: 'Moving Services' },
    { value: 'freight', label: 'Freight & Full Load' },
    { value: 'scheduled_route', label: 'Scheduled Routes' },
    { value: 'courier', label: 'Courier Services' }
  ];

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Booking Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor and manage all shipment bookings
            </Typography>
          </Box>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Filter by Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Filter by Status"
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    {statusFilterOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Filter by Service</InputLabel>
                  <Select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    label="Filter by Service"
                  >
                    <MenuItem value="">All Services</MenuItem>
                    {serviceTypes.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setStatusFilter('');
                    setServiceFilter('');
                    setPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardContent>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Reference</TableCell>
                    <TableCell>Service Type</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Route</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {booking.bookingReference}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={booking.serviceType.replace('_', ' ').toUpperCase()}
                          color={getServiceTypeColor(booking.serviceType)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {booking.customer.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {booking.customer.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {booking.pickup.city} → {booking.delivery.city}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={booking.status.replace('_', ' ').toUpperCase()}
                          color={getStatusColor(booking.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(booking.pickup.date).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleViewBooking(booking)}
                          title="View Details"
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleStatusUpdate(booking)}
                          title="Update Status"
                        >
                          <Edit />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {bookings.length === 0 && !loading && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No bookings found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Bookings will appear here as customers make reservations
                </Typography>
              </Box>
            )}

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Booking Details Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Booking Details - {selectedBooking?.bookingReference}
          </DialogTitle>
          <DialogContent>
            {selectedBooking && (
              <Box sx={{ mt: 2 }}>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                  <Tab label="General Info" />
                  <Tab label="Items" />
                  <Tab label="Tracking" />
                </Tabs>

                {tabValue === 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>Customer Information</Typography>
                        <Typography variant="body2">Name: {selectedBooking.customer.name}</Typography>
                        <Typography variant="body2">Email: {selectedBooking.customer.email}</Typography>
                        <Typography variant="body2">Phone: {selectedBooking.customer.phone}</Typography>
                        {selectedBooking.customer.company && (
                          <Typography variant="body2">Company: {selectedBooking.customer.company}</Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>Service Details</Typography>
                        <Typography variant="body2">
                          Service: {selectedBooking.serviceType.replace('_', ' ').toUpperCase()}
                        </Typography>
                        <Typography variant="body2">
                          Status: {selectedBooking.status.replace('_', ' ').toUpperCase()}
                        </Typography>
                        <Typography variant="body2">
                          Total Amount: ${selectedBooking.pricing?.totalAmount || 'TBD'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>Pickup Details</Typography>
                        <Typography variant="body2">City: {selectedBooking.pickup.city}</Typography>
                        <Typography variant="body2">Address: {selectedBooking.pickup.address}</Typography>
                        <Typography variant="body2">
                          Date: {new Date(selectedBooking.pickup.date).toLocaleDateString()}
                        </Typography>
                        {selectedBooking.pickup.timeSlot && (
                          <Typography variant="body2">Time: {selectedBooking.pickup.timeSlot}</Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>Delivery Details</Typography>
                        <Typography variant="body2">City: {selectedBooking.delivery.city}</Typography>
                        <Typography variant="body2">Address: {selectedBooking.delivery.address}</Typography>
                        {selectedBooking.delivery.date && (
                          <Typography variant="body2">
                            Date: {new Date(selectedBooking.delivery.date).toLocaleDateString()}
                          </Typography>
                        )}
                        {selectedBooking.delivery.timeSlot && (
                          <Typography variant="body2">Time: {selectedBooking.delivery.timeSlot}</Typography>
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {tabValue === 1 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>Items</Typography>
                    {selectedBooking.items.map((item, index) => (
                      <Paper key={index} sx={{ p: 2, mb: 2 }}>
                        <Typography variant="body1" fontWeight={600}>
                          {item.description}
                        </Typography>
                        <Typography variant="body2">Quantity: {item.quantity}</Typography>
                        {item.weight && <Typography variant="body2">Weight: {item.weight}kg</Typography>}
                        {item.dimensions && (
                          <Typography variant="body2">
                            Dimensions: {item.dimensions.length} × {item.dimensions.width} × {item.dimensions.height} cm
                          </Typography>
                        )}
                        {item.value && <Typography variant="body2">Value: ${item.value}</Typography>}
                        {item.fragile && (
                          <Chip label="Fragile" color="warning" size="small" sx={{ mt: 1 }} />
                        )}
                      </Paper>
                    ))}
                  </Box>
                )}

                {tabValue === 2 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>Tracking History</Typography>
                    {selectedBooking.tracking.map((entry, index) => (
                      <Paper key={index} sx={{ p: 2, mb: 2 }}>
                        <Typography variant="body1" fontWeight={600}>
                          {entry.status}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {entry.location} • {new Date(entry.timestamp).toLocaleString()}
                        </Typography>
                        {entry.notes && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {entry.notes}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog open={statusUpdateDialog} onClose={() => setStatusUpdateDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Update Status - {selectedBooking?.bookingReference}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusUpdate.status}
                    onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
                    label="Status"
                  >
                    {getAvailableStatusOptions(selectedBooking?.status).map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                        {option.restrictedRoles && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            (Store Only)
                          </Typography>
                        )}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  value={statusUpdate.location}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Current location or facility"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={statusUpdate.notes}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this status update"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusUpdateDialog(false)}>Cancel</Button>
            <Button onClick={submitStatusUpdate} variant="contained">
              Update Status
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </AdminLayout>
  );
};

export default BookingManagement;
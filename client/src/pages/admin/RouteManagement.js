import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  Edit,
  Route as RouteIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';

const RouteManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [formData, setFormData] = useState({
    routeCode: '',
    name: '',
    origin: {
      city: '',
      address: '',
      coordinates: { lat: '', lng: '' }
    },
    destination: {
      city: '',
      address: '',
      coordinates: { lat: '', lng: '' }
    },
    schedule: {
      frequency: 'weekly',
      departureTime: '',
      estimatedDuration: ''
    },
    capacity: {
      maxWeight: '',
      maxVolume: '',
      maxParcels: ''
    },
    pricing: {
      baseRate: '',
      perKgRate: '',
      perCubicMeterRate: ''
    },
    isActive: true,
    cutoffHours: 24
  });

  useEffect(() => {
    if (!user || !['super_admin', 'operations_manager'].includes(user.role)) {
      navigate('/ops-control-center');
      return;
    }
    fetchRoutes();
  }, [user, navigate]);

  const fetchRoutes = async () => {
    try {
      const response = await axios.get('/api/admin/routes');
      setRoutes(response.data);
    } catch (error) {
      console.error('Failed to fetch routes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (route = null) => {
    if (route) {
      setEditingRoute(route);
      setFormData(route);
    } else {
      setEditingRoute(null);
      setFormData({
        routeCode: '',
        name: '',
        origin: {
          city: '',
          address: '',
          coordinates: { lat: '', lng: '' }
        },
        destination: {
          city: '',
          address: '',
          coordinates: { lat: '', lng: '' }
        },
        schedule: {
          frequency: 'weekly',
          departureTime: '',
          estimatedDuration: ''
        },
        capacity: {
          maxWeight: '',
          maxVolume: '',
          maxParcels: ''
        },
        pricing: {
          baseRate: '',
          perKgRate: '',
          perCubicMeterRate: ''
        },
        isActive: true,
        cutoffHours: 24
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRoute(null);
  };

  const handleInputChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingRoute) {
        await axios.put(`/api/admin/routes/${editingRoute._id}`, formData);
      } else {
        await axios.post('/api/admin/routes', formData);
      }
      fetchRoutes();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save route');
    }
  };

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
              Route Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage scheduled routes and capacity settings
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add New Route
          </Button>
        </Box>

        <Card>
          <CardContent>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Route Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Origin → Destination</TableCell>
                    <TableCell>Schedule</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Base Rate</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {routes.map((route) => (
                    <TableRow key={route._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {route.routeCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {route.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {route.origin.city} → {route.destination.city}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {route.schedule.estimatedDuration}h journey
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {route.schedule.frequency}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Departs: {route.schedule.departureTime}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="caption" display="block">
                            {route.capacity.maxWeight}kg
                          </Typography>
                          <Typography variant="caption" display="block">
                            {route.capacity.maxVolume}m³
                          </Typography>
                          <Typography variant="caption" display="block">
                            {route.capacity.maxParcels} parcels
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          ${route.pricing.baseRate}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={route.isActive ? 'Active' : 'Inactive'}
                          color={route.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(route)}
                        >
                          <Edit />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {routes.length === 0 && !loading && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <RouteIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No routes configured
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create your first route to start managing scheduled shipments
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Route Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingRoute ? 'Edit Route' : 'Add New Route'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Basic Info */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Route Code"
                  value={formData.routeCode}
                  onChange={(e) => handleInputChange(null, 'routeCode', e.target.value.toUpperCase())}
                  placeholder="e.g., NYC-LA-001"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Route Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange(null, 'name', e.target.value)}
                  placeholder="e.g., New York to Los Angeles Express"
                />
              </Grid>

              {/* Origin */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Origin
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Origin City"
                  value={formData.origin.city}
                  onChange={(e) => handleInputChange('origin', 'city', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Origin Address"
                  value={formData.origin.address}
                  onChange={(e) => handleInputChange('origin', 'address', e.target.value)}
                />
              </Grid>

              {/* Destination */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Destination
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Destination City"
                  value={formData.destination.city}
                  onChange={(e) => handleInputChange('destination', 'city', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Destination Address"
                  value={formData.destination.address}
                  onChange={(e) => handleInputChange('destination', 'address', e.target.value)}
                />
              </Grid>

              {/* Schedule */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Schedule
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={formData.schedule.frequency}
                    onChange={(e) => handleInputChange('schedule', 'frequency', e.target.value)}
                    label="Frequency"
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="bi-weekly">Bi-weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Departure Time"
                  value={formData.schedule.departureTime}
                  onChange={(e) => handleInputChange('schedule', 'departureTime', e.target.value)}
                  placeholder="e.g., 08:00 AM"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Duration (hours)"
                  type="number"
                  value={formData.schedule.estimatedDuration}
                  onChange={(e) => handleInputChange('schedule', 'estimatedDuration', parseFloat(e.target.value))}
                />
              </Grid>

              {/* Capacity */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Capacity Limits
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Max Weight (kg)"
                  type="number"
                  value={formData.capacity.maxWeight}
                  onChange={(e) => handleInputChange('capacity', 'maxWeight', parseFloat(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Max Volume (m³)"
                  type="number"
                  value={formData.capacity.maxVolume}
                  onChange={(e) => handleInputChange('capacity', 'maxVolume', parseFloat(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Max Parcels"
                  type="number"
                  value={formData.capacity.maxParcels}
                  onChange={(e) => handleInputChange('capacity', 'maxParcels', parseInt(e.target.value))}
                />
              </Grid>

              {/* Pricing */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Pricing
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Base Rate ($)"
                  type="number"
                  value={formData.pricing.baseRate}
                  onChange={(e) => handleInputChange('pricing', 'baseRate', parseFloat(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Per Kg Rate ($)"
                  type="number"
                  step="0.01"
                  value={formData.pricing.perKgRate}
                  onChange={(e) => handleInputChange('pricing', 'perKgRate', parseFloat(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Per m³ Rate ($)"
                  type="number"
                  step="0.01"
                  value={formData.pricing.perCubicMeterRate}
                  onChange={(e) => handleInputChange('pricing', 'perCubicMeterRate', parseFloat(e.target.value))}
                />
              </Grid>

              {/* Settings */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Booking Cutoff (hours)"
                  type="number"
                  value={formData.cutoffHours}
                  onChange={(e) => handleInputChange(null, 'cutoffHours', parseInt(e.target.value))}
                  helperText="Hours before departure to stop accepting bookings"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange(null, 'isActive', e.target.checked)}
                    />
                  }
                  label="Route Active"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingRoute ? 'Update Route' : 'Create Route'}
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </AdminLayout>
  );
};

export default RouteManagement;
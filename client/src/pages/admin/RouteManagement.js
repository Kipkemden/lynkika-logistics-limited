import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Add, Edit, Visibility } from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import AdminLayout from '../../components/admin/AdminLayout';

const RouteManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [formData, setFormData] = useState({
    routeCode: '',
    name: '',
    origin: { city: '', address: '' },
    destination: { city: '', address: '' },
    schedule: { frequency: 'weekly', departureTime: '', estimatedDuration: '' },
    capacity: { maxWeight: '', maxVolume: '', maxParcels: '' },
    pricing: { baseRate: '', perKgRate: '', perCubicMeterRate: '' },
    cutoffHours: 24,
    isActive: true
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await axios.get('/api/admin/routes');
      setRoutes(response.data);
    } catch (error) {
      console.error('Failed to fetch routes');
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
      handleClose();
    } catch (error) {
      console.error('Failed to save route');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingRoute(null);
    setFormData({
      routeCode: '',
      name: '',
      origin: { city: '', address: '' },
      destination: { city: '', address: '' },
      schedule: { frequency: 'weekly', departureTime: '', estimatedDuration: '' },
      capacity: { maxWeight: '', maxVolume: '', maxParcels: '' },
      pricing: { baseRate: '', perKgRate: '', perCubicMeterRate: '' },
      cutoffHours: 24,
      isActive: true
    });
  };

  const handleEdit = (route) => {
    setEditingRoute(route);
    setFormData(route);
    setOpen(true);
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
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <AdminLayout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typography variant="h4" gutterBottom fontWeight={700}>
              Route Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage scheduled routes and capacity settings
            </Typography>
          </motion.div>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            size="large"
          >
            Add New Route
          </Button>
        </Box>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
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
                        <TableCell>{route.name}</TableCell>
                        <TableCell>
                          {route.origin.city} → {route.destination.city}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {route.schedule.frequency} at {route.schedule.departureTime}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {route.capacity.maxWeight}kg / {route.capacity.maxVolume}m³
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
                          <IconButton onClick={() => handleEdit(route)} size="small">
                            <Edit />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Route Form Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingRoute ? 'Edit Route' : 'Add New Route'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Route Code"
                  value={formData.routeCode}
                  onChange={(e) => handleInputChange(null, 'routeCode', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Route Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange(null, 'name', e.target.value)}
                />
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
                  label="Destination City"
                  value={formData.destination.city}
                  onChange={(e) => handleInputChange('destination', 'city', e.target.value)}
                />
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
                  type="time"
                  value={formData.schedule.departureTime}
                  onChange={(e) => handleInputChange('schedule', 'departureTime', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Duration (hours)"
                  type="number"
                  value={formData.schedule.estimatedDuration}
                  onChange={(e) => handleInputChange('schedule', 'estimatedDuration', parseInt(e.target.value))}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Max Weight (kg)"
                  type="number"
                  value={formData.capacity.maxWeight}
                  onChange={(e) => handleInputChange('capacity', 'maxWeight', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Max Volume (m³)"
                  type="number"
                  value={formData.capacity.maxVolume}
                  onChange={(e) => handleInputChange('capacity', 'maxVolume', parseInt(e.target.value))}
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
                  value={formData.pricing.perCubicMeterRate}
                  onChange={(e) => handleInputChange('pricing', 'perCubicMeterRate', parseFloat(e.target.value))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingRoute ? 'Update' : 'Create'} Route
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default RouteManagement;
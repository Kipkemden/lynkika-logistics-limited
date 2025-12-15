import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  Alert,
  Chip,
  LinearProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';

const BookingPage = () => {
  const { service } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [capacityData, setCapacityData] = useState(null);
  const [formData, setFormData] = useState({
    serviceType: service,
    customer: {
      name: '',
      email: '',
      phone: '',
      company: ''
    },
    pickup: {
      address: '',
      city: '',
      date: null,
      timeSlot: '',
      contactPerson: '',
      contactPhone: '',
      instructions: ''
    },
    delivery: {
      address: '',
      city: '',
      date: null,
      timeSlot: '',
      contactPerson: '',
      contactPhone: '',
      instructions: ''
    },
    items: [{
      description: '',
      quantity: 1,
      weight: '',
      dimensions: {
        length: '',
        width: '',
        height: ''
      },
      value: '',
      fragile: false
    }],
    route: '',
    specialInstructions: ''
  });
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = ['Service Details', 'Contact Info', 'Pickup & Delivery', 'Items', 'Review & Book'];

  const serviceLabels = {
    movers: 'Moving Services',
    freight: 'Freight & Full Load',
    scheduled: 'Scheduled Routes'
  };

  const timeSlots = [
    '8:00 AM - 12:00 PM',
    '12:00 PM - 4:00 PM',
    '4:00 PM - 8:00 PM',
    'Flexible'
  ];

  useEffect(() => {
    if (service === 'scheduled') {
      fetchRoutes();
    }
  }, [service]);

  useEffect(() => {
    if (selectedRoute && formData.pickup.date) {
      fetchCapacityData();
    }
  }, [selectedRoute, formData.pickup.date, fetchCapacityData]);

  const fetchRoutes = async () => {
    try {
      const response = await axios.get('/api/routes');
      setRoutes(response.data);
    } catch (error) {
      console.error('Failed to fetch routes');
    }
  };

  const calculateNextDeparture = (route) => {
    if (!route) return null;
    
    const now = dayjs();
    const [time, period] = route.schedule.departureTime.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    // Convert to 24-hour format
    let departureHour = hours;
    if (period === 'PM' && hours !== 12) {
      departureHour += 12;
    } else if (period === 'AM' && hours === 12) {
      departureHour = 0;
    }
    
    let nextDeparture = now.hour(departureHour).minute(minutes).second(0);
    
    // If the time has passed today, move to next departure based on frequency
    if (nextDeparture.isBefore(now)) {
      switch (route.schedule.frequency) {
        case 'daily':
          nextDeparture = nextDeparture.add(1, 'day');
          break;
        case 'weekly':
          nextDeparture = nextDeparture.add(1, 'week');
          break;
        case 'bi-weekly':
          nextDeparture = nextDeparture.add(2, 'weeks');
          break;
        case 'monthly':
          nextDeparture = nextDeparture.add(1, 'month');
          break;
        default:
          nextDeparture = nextDeparture.add(1, 'day');
      }
    }
    
    return nextDeparture;
  };

  const fetchCapacityData = useCallback(async () => {
    try {
      const response = await axios.get(
        `/api/routes/${selectedRoute}/capacity/${formData.pickup.date.format('YYYY-MM-DD')}`
      );
      setCapacityData(response.data);
    } catch (error) {
      console.error('Failed to fetch capacity data');
    }
  }, [selectedRoute, formData.pickup.date]);

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newItems[index][parent][child] = value;
    } else {
      newItems[index][field] = value;
    }
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        description: '',
        quantity: 1,
        weight: '',
        dimensions: { length: '', width: '', height: '' },
        value: '',
        fragile: false
      }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculatePricing = () => {
    if (service === 'scheduled' && selectedRoute) {
      const route = routes.find(r => r._id === selectedRoute);
      if (route) {
        let totalWeight = 0;
        let totalVolume = 0;
        
        formData.items.forEach(item => {
          totalWeight += parseFloat(item.weight) || 0;
          if (item.dimensions.length && item.dimensions.width && item.dimensions.height) {
            const volume = (item.dimensions.length * item.dimensions.width * item.dimensions.height) / 1000000;
            totalVolume += volume * item.quantity;
          }
        });
        
        const baseAmount = route.pricing.baseRate;
        const weightCharge = totalWeight * route.pricing.perKgRate;
        const volumeCharge = totalVolume * route.pricing.perCubicMeterRate;
        
        return {
          baseAmount,
          weightCharge,
          volumeCharge,
          totalAmount: baseAmount + weightCharge + volumeCharge
        };
      }
    }
    return null;
  };

  const submitBooking = async () => {
    setLoading(true);
    setError('');
    
    try {
      const bookingData = {
        ...formData,
        route: selectedRoute || undefined,
        pricing: calculatePricing() || { totalAmount: 0 }
      };
      
      const response = await axios.post('/api/bookings', bookingData);
      setBooking(response.data);
      handleNext();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const renderCapacityIndicator = () => {
    if (!capacityData) return null;

    return (
      <Paper sx={{ p: 2, mt: 2, backgroundColor: '#f5f5f5' }}>
        <Typography variant="subtitle2" gutterBottom>
          Route Capacity Status
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography variant="body2">Weight</Typography>
            <LinearProgress
              variant="determinate"
              value={capacityData.utilizationPercentage.weight}
              color={capacityData.utilizationPercentage.weight > 80 ? 'error' : 'primary'}
            />
            <Typography variant="caption">
              {capacityData.used.weight}kg / {capacityData.capacity.maxWeight}kg
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2">Volume</Typography>
            <LinearProgress
              variant="determinate"
              value={capacityData.utilizationPercentage.volume}
              color={capacityData.utilizationPercentage.volume > 80 ? 'error' : 'primary'}
            />
            <Typography variant="caption">
              {capacityData.used.volume.toFixed(1)}m³ / {capacityData.capacity.maxVolume}m³
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2">Parcels</Typography>
            <LinearProgress
              variant="determinate"
              value={capacityData.utilizationPercentage.parcels}
              color={capacityData.utilizationPercentage.parcels > 80 ? 'error' : 'primary'}
            />
            <Typography variant="caption">
              {capacityData.used.parcels} / {capacityData.capacity.maxParcels}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {serviceLabels[service]} Booking
              </Typography>
              {service === 'scheduled' && (
                <>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Select Route</InputLabel>
                    <Select
                      value={selectedRoute || ''}
                      onChange={(e) => setSelectedRoute(e.target.value)}
                      label="Select Route"
                    >
                      {routes.map(route => (
                        <MenuItem key={route._id} value={route._id}>
                          {route.name} - {route.origin.city} to {route.destination.city}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {selectedRoute && (
                    <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
                      {(() => {
                        const route = routes.find(r => r._id === selectedRoute);
                        const nextDeparture = calculateNextDeparture(route);
                        return route && (
                          <>
                            <Typography variant="subtitle1" gutterBottom>Route Details</Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Departure Time:
                                </Typography>
                                <Typography variant="body1" fontWeight={600}>
                                  {route.schedule.departureTime}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Frequency:
                                </Typography>
                                <Typography variant="body1" fontWeight={600}>
                                  {route.schedule.frequency}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Base Rate:
                                </Typography>
                                <Typography variant="body1" fontWeight={600} color="primary">
                                  KSh {route.pricing.baseRate.toLocaleString()}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Journey Time:
                                </Typography>
                                <Typography variant="body1" fontWeight={600}>
                                  {route.schedule.estimatedDuration} hours
                                </Typography>
                              </Grid>
                              {nextDeparture && (
                                <Grid item xs={12}>
                                  <Box sx={{ 
                                    mt: 2, 
                                    p: 2, 
                                    backgroundColor: 'primary.main', 
                                    color: 'white', 
                                    borderRadius: 1 
                                  }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                      Next Departure:
                                    </Typography>
                                    <Typography variant="h6" fontWeight={700}>
                                      {nextDeparture.format('dddd, MMMM DD, YYYY')}
                                    </Typography>
                                    <Typography variant="body1">
                                      at {nextDeparture.format('h:mm A')}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                                      Booking cutoff: {nextDeparture.subtract(route.cutoffHours || 24, 'hours').format('MMM DD, h:mm A')}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                            </Grid>
                          </>
                        );
                      })()}
                    </Paper>
                  )}
                </>
              )}
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.customer.name}
                onChange={(e) => handleInputChange('customer', 'name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.customer.email}
                onChange={(e) => handleInputChange('customer', 'email', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.customer.phone}
                onChange={(e) => handleInputChange('customer', 'phone', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company (Optional)"
                value={formData.customer.company}
                onChange={(e) => handleInputChange('customer', 'company', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Pickup & Delivery Details
              </Typography>
            </Grid>
            
            {/* Pickup Details */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Pickup Information
              </Typography>
              <TextField
                fullWidth
                label="City"
                value={formData.pickup.city}
                onChange={(e) => handleInputChange('pickup', 'city', e.target.value)}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={formData.pickup.address}
                onChange={(e) => handleInputChange('pickup', 'address', e.target.value)}
                sx={{ mb: 2 }}
                required
              />
              <DatePicker
                label="Pickup Date"
                value={formData.pickup.date}
                onChange={(date) => handleInputChange('pickup', 'date', date)}
                minDate={dayjs()}
                slotProps={{ textField: { fullWidth: true, sx: { mb: 2 } } }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Time Slot</InputLabel>
                <Select
                  value={formData.pickup.timeSlot}
                  onChange={(e) => handleInputChange('pickup', 'timeSlot', e.target.value)}
                  label="Time Slot"
                >
                  {timeSlots.map(slot => (
                    <MenuItem key={slot} value={slot}>{slot}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Contact Person"
                value={formData.pickup.contactPerson}
                onChange={(e) => handleInputChange('pickup', 'contactPerson', e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Contact Phone"
                value={formData.pickup.contactPhone}
                onChange={(e) => handleInputChange('pickup', 'contactPhone', e.target.value)}
                sx={{ mb: 2 }}
              />
            </Grid>

            {/* Delivery Details */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Delivery Information
              </Typography>
              <TextField
                fullWidth
                label="City"
                value={formData.delivery.city}
                onChange={(e) => handleInputChange('delivery', 'city', e.target.value)}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={formData.delivery.address}
                onChange={(e) => handleInputChange('delivery', 'address', e.target.value)}
                sx={{ mb: 2 }}
                required
              />
              {service !== 'scheduled' && (
                <>
                  <DatePicker
                    label="Delivery Date"
                    value={formData.delivery.date}
                    onChange={(date) => handleInputChange('delivery', 'date', date)}
                    minDate={formData.pickup.date || dayjs()}
                    slotProps={{ textField: { fullWidth: true, sx: { mb: 2 } } }}
                  />
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Time Slot</InputLabel>
                    <Select
                      value={formData.delivery.timeSlot}
                      onChange={(e) => handleInputChange('delivery', 'timeSlot', e.target.value)}
                      label="Time Slot"
                    >
                      {timeSlots.map(slot => (
                        <MenuItem key={slot} value={slot}>{slot}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}
              <TextField
                fullWidth
                label="Contact Person"
                value={formData.delivery.contactPerson}
                onChange={(e) => handleInputChange('delivery', 'contactPerson', e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Contact Phone"
                value={formData.delivery.contactPhone}
                onChange={(e) => handleInputChange('delivery', 'contactPhone', e.target.value)}
                sx={{ mb: 2 }}
              />
            </Grid>

            {service === 'scheduled' && renderCapacityIndicator()}
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Items to Ship
              </Typography>
              {formData.items.map((item, index) => (
                <Paper key={index} sx={{ p: 3, mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Item Description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label="Quantity"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                        required
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label="Weight (kg)"
                        type="number"
                        value={item.weight}
                        onChange={(e) => handleItemChange(index, 'weight', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Length (cm)"
                        type="number"
                        value={item.dimensions.length}
                        onChange={(e) => handleItemChange(index, 'dimensions.length', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Width (cm)"
                        type="number"
                        value={item.dimensions.width}
                        onChange={(e) => handleItemChange(index, 'dimensions.width', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Height (cm)"
                        type="number"
                        value={item.dimensions.height}
                        onChange={(e) => handleItemChange(index, 'dimensions.height', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Declared Value (KSh)"
                        type="number"
                        value={item.value}
                        onChange={(e) => handleItemChange(index, 'value', e.target.value)}
                      />
                    </Grid>
                    {formData.items.length > 1 && (
                      <Grid item xs={12}>
                        <Button
                          color="error"
                          onClick={() => removeItem(index)}
                        >
                          Remove Item
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              ))}
              <Button onClick={addItem} variant="outlined" sx={{ mb: 3 }}>
                Add Another Item
              </Button>

              <TextField
                fullWidth
                label="Special Instructions"
                multiline
                rows={3}
                value={formData.specialInstructions}
                onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                placeholder="Any special handling requirements or additional notes..."
              />
            </Grid>
          </Grid>
        );

      case 4:
        const pricing = calculatePricing();
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review Your Booking
              </Typography>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Service: {serviceLabels[service]}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  From: {formData.pickup.city} → To: {formData.delivery.city}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Date: {formData.pickup.date?.format('MMMM DD, YYYY')}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Contact: {formData.customer.name} ({formData.customer.email})
                </Typography>
                <Typography variant="body2">
                  Items: {formData.items.length} item(s)
                </Typography>
              </Paper>

              {pricing && (
                <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="h6" gutterBottom>
                    Pricing Breakdown
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Base Rate:</Typography>
                    <Typography>KSh {pricing.baseAmount.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Weight Charge:</Typography>
                    <Typography>KSh {pricing.weightCharge.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography>Volume Charge:</Typography>
                    <Typography>KSh {pricing.volumeCharge.toFixed(2)}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6">KSh {pricing.totalAmount.toFixed(2)}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Payment will be invoiced after delivery
                  </Typography>
                </Paper>
              )}
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  if (booking) {
    return (
      <Box>
        <Header />
        <Container maxWidth="md" sx={{ py: 8 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Card>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h4" gutterBottom color="success.main">
                  Booking Confirmed!
                </Typography>
                <Typography variant="h6" gutterBottom>
                  Reference: {booking.bookingReference}
                </Typography>
                <Chip 
                  label="Pay Later - Invoice will be sent"
                  color="info"
                  sx={{ mb: 3 }}
                />
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Your booking has been confirmed. You can track your shipment using the reference number above.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={() => navigate(`/track`)}
                  >
                    Track Shipment
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/')}
                  >
                    Return to Home
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box>
      <Header />
      
      <Container maxWidth="md" sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Typography variant="h2" textAlign="center" gutterBottom>
            Book {serviceLabels[service]}
          </Typography>
          <Typography variant="h6" textAlign="center" sx={{ mb: 6, opacity: 0.8 }}>
            Complete your booking in a few simple steps
          </Typography>
        </motion.div>

        <Card>
          <CardContent sx={{ p: 4 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {renderStepContent(activeStep)}

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={submitBooking}
                  disabled={loading}
                >
                  {loading ? 'Creating Booking...' : 'Confirm Booking'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={
                    (activeStep === 0 && service === 'scheduled' && !selectedRoute) ||
                    (activeStep === 1 && (!formData.customer.name || !formData.customer.email || !formData.customer.phone))
                  }
                >
                  Next
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>

      <Footer />
    </Box>
  );
};

export default BookingPage;
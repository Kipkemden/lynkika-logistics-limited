import React, { useState } from 'react';
import {
  Box,
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
  FormControlLabel,
  Switch,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Alert,
  Paper
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalShipping } from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';

const CourierEntry = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    customer: {
      name: '',
      email: '',
      phone: '',
      company: ''
    },
    pickup: {
      address: '',
      city: '',
      date: dayjs(),
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
    pricing: {
      baseAmount: 15,
      additionalCharges: [],
      totalAmount: 15
    },
    specialInstructions: '',
    assignedVehicle: {
      plateNumber: '',
      driverName: '',
      driverPhone: ''
    }
  });
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = ['Customer Info', 'Pickup & Delivery', 'Items & Pricing', 'Vehicle Assignment', 'Review & Create'];

  const timeSlots = [
    '8:00 AM - 12:00 PM',
    '12:00 PM - 4:00 PM',
    '4:00 PM - 8:00 PM',
    'Same Day',
    'Next Day'
  ];

  React.useEffect(() => {
    if (!user) {
      navigate('/ops-control-center');
      return;
    }
  }, [user, navigate]);

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
    let baseAmount = 15; // Base courier rate
    let additionalCharges = [];
    
    // Calculate based on items
    const totalWeight = formData.items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
    const totalValue = formData.items.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
    
    if (totalWeight > 5) {
      const weightCharge = (totalWeight - 5) * 2; // $2 per kg over 5kg
      additionalCharges.push({ description: 'Extra weight charge', amount: weightCharge });
      baseAmount += weightCharge;
    }
    
    if (totalValue > 500) {
      const insuranceCharge = totalValue * 0.01; // 1% insurance for high value items
      additionalCharges.push({ description: 'Insurance charge', amount: insuranceCharge });
      baseAmount += insuranceCharge;
    }
    
    // Same day delivery premium
    if (formData.delivery.timeSlot === 'Same Day') {
      additionalCharges.push({ description: 'Same day delivery', amount: 10 });
      baseAmount += 10;
    }
    
    setFormData(prev => ({
      ...prev,
      pricing: {
        baseAmount: 15,
        additionalCharges,
        totalAmount: baseAmount
      }
    }));
  };

  React.useEffect(() => {
    calculatePricing();
  }, [formData.items, formData.delivery.timeSlot, calculatePricing]);

  const submitCourierShipment = async () => {
    setLoading(true);
    setError('');
    
    try {
      const shipmentData = {
        ...formData,
        serviceType: 'courier'
      };
      
      const response = await axios.post('/api/admin/courier-shipments', shipmentData);
      setBooking(response.data);
      handleNext();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create courier shipment');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Customer Information
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

      case 1:
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
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Delivery Time</InputLabel>
                <Select
                  value={formData.delivery.timeSlot}
                  onChange={(e) => handleInputChange('delivery', 'timeSlot', e.target.value)}
                  label="Delivery Time"
                >
                  {timeSlots.map(slot => (
                    <MenuItem key={slot} value={slot}>{slot}</MenuItem>
                  ))}
                </Select>
              </FormControl>
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
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Items & Pricing
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
                        label="Declared Value ($)"
                        type="number"
                        value={item.value}
                        onChange={(e) => handleItemChange(index, 'value', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={item.fragile}
                            onChange={(e) => handleItemChange(index, 'fragile', e.target.checked)}
                          />
                        }
                        label="Fragile Item"
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

              {/* Pricing Summary */}
              <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
                <Typography variant="h6" gutterBottom>
                  Pricing Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Base Rate:</Typography>
                  <Typography>${formData.pricing.baseAmount}</Typography>
                </Box>
                {formData.pricing.additionalCharges.map((charge, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>{charge.description}:</Typography>
                    <Typography>${charge.amount.toFixed(2)}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6">${formData.pricing.totalAmount.toFixed(2)}</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Vehicle Assignment
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Vehicle Plate Number"
                value={formData.assignedVehicle.plateNumber}
                onChange={(e) => handleInputChange('assignedVehicle', 'plateNumber', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Driver Name"
                value={formData.assignedVehicle.driverName}
                onChange={(e) => handleInputChange('assignedVehicle', 'driverName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Driver Phone"
                value={formData.assignedVehicle.driverPhone}
                onChange={(e) => handleInputChange('assignedVehicle', 'driverPhone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Special Instructions"
                multiline
                rows={3}
                value={formData.specialInstructions}
                onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                placeholder="Any special handling requirements or delivery instructions..."
              />
            </Grid>
          </Grid>
        );

      case 4:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review Courier Shipment
              </Typography>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Customer: {formData.customer.name} ({formData.customer.email})
                </Typography>
                <Typography variant="body2" gutterBottom>
                  From: {formData.pickup.city} → To: {formData.delivery.city}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Pickup: {formData.pickup.date?.format('MMMM DD, YYYY')}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Delivery: {formData.delivery.timeSlot}
                </Typography>
                <Typography variant="body2">
                  Items: {formData.items.length} item(s)
                </Typography>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Total Amount: ${formData.pricing.totalAmount.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  if (booking) {
    return (
      <AdminLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <Card>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <LocalShipping sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom color="success.main">
                Courier Shipment Created!
              </Typography>
              <Typography variant="h6" gutterBottom>
                Reference: {booking.bookingReference}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                The courier shipment has been successfully created and is ready for pickup.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/ops-control-center/bookings')}
                >
                  View All Bookings
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.location.reload()}
                >
                  Create Another
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Courier Shipment Entry
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create a new courier shipment for walk-in customers
          </Typography>
        </Box>

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
                  onClick={submitCourierShipment}
                  disabled={loading}
                >
                  {loading ? 'Creating Shipment...' : 'Create Courier Shipment'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={
                    (activeStep === 0 && (!formData.customer.name || !formData.customer.email || !formData.customer.phone)) ||
                    (activeStep === 1 && (!formData.pickup.city || !formData.delivery.city))
                  }
                >
                  Next
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </AdminLayout>
  );
};

export default CourierEntry;
import React, { useState } from 'react';
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
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { motion } from 'framer-motion';
import axios from 'axios';
import dayjs from 'dayjs';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';

const QuotePage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    serviceType: '',
    customer: {
      name: '',
      email: '',
      phone: '',
      company: ''
    },
    origin: {
      address: '',
      city: ''
    },
    destination: {
      address: '',
      city: ''
    },
    items: [{
      description: '',
      quantity: 1,
      weight: '',
      dimensions: {
        length: '',
        width: '',
        height: ''
      }
    }],
    preferredDate: null
  });
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = ['Service Type', 'Contact Info', 'Shipment Details', 'Review & Submit'];

  const serviceTypes = [
    { value: 'movers', label: 'Moving Services' },
    { value: 'freight', label: 'Freight & Full Load' },
    { value: 'scheduled_route', label: 'Scheduled Routes' }
  ];

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
        dimensions: { length: '', width: '', height: '' }
      }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const submitQuote = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/quotes', formData);
      setQuote(response.data);
      handleNext();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit quote request');
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
                Select Service Type
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Service Type</InputLabel>
                <Select
                  value={formData.serviceType}
                  onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                  label="Service Type"
                >
                  {serviceTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                Shipment Details
              </Typography>
            </Grid>
            
            {/* Origin */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Pickup Location
              </Typography>
              <TextField
                fullWidth
                label="City"
                value={formData.origin.city}
                onChange={(e) => handleInputChange('origin', 'city', e.target.value)}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={formData.origin.address}
                onChange={(e) => handleInputChange('origin', 'address', e.target.value)}
                required
              />
            </Grid>

            {/* Destination */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Delivery Location
              </Typography>
              <TextField
                fullWidth
                label="City"
                value={formData.destination.city}
                onChange={(e) => handleInputChange('destination', 'city', e.target.value)}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={formData.destination.address}
                onChange={(e) => handleInputChange('destination', 'address', e.target.value)}
                required
              />
            </Grid>

            {/* Preferred Date */}
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Preferred Date"
                value={formData.preferredDate}
                onChange={(date) => setFormData(prev => ({ ...prev, preferredDate: date }))}
                minDate={dayjs()}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>

            {/* Items */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
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
                        onChange={(e) => handleItemChange(index, 'weight', parseFloat(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Length (cm)"
                        type="number"
                        value={item.dimensions.length}
                        onChange={(e) => handleItemChange(index, 'dimensions.length', parseFloat(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Width (cm)"
                        type="number"
                        value={item.dimensions.width}
                        onChange={(e) => handleItemChange(index, 'dimensions.width', parseFloat(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Height (cm)"
                        type="number"
                        value={item.dimensions.height}
                        onChange={(e) => handleItemChange(index, 'dimensions.height', parseFloat(e.target.value))}
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
              <Button onClick={addItem} variant="outlined">
                Add Another Item
              </Button>
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review Your Quote Request
              </Typography>
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Service: {serviceTypes.find(s => s.value === formData.serviceType)?.label}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  From: {formData.origin.city} → To: {formData.destination.city}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Contact: {formData.customer.name} ({formData.customer.email})
                </Typography>
                <Typography variant="body2">
                  Items: {formData.items.length} item(s)
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  if (quote) {
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
                  Quote Request Submitted!
                </Typography>
                <Typography variant="h6" gutterBottom>
                  Reference: {quote.quoteReference}
                </Typography>
                {quote.estimatedPrice && (
                  <Paper sx={{ p: 3, mt: 3, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="h5" gutterBottom>
                      Estimated Price: ${quote.estimatedPrice.totalAmount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This is a preliminary estimate. Final pricing will be confirmed by our team.
                    </Typography>
                  </Paper>
                )}
                <Typography variant="body1" sx={{ mt: 3 }}>
                  Our team will review your request and contact you within 24 hours with a detailed quote.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => window.location.href = '/'}
                  sx={{ mt: 3 }}
                >
                  Return to Home
                </Button>
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
            Get a Quote
          </Typography>
          <Typography variant="h6" textAlign="center" sx={{ mb: 6, opacity: 0.8 }}>
            Tell us about your shipping needs and we'll provide a detailed quote
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
                  onClick={submitQuote}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Quote Request'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={
                    (activeStep === 0 && !formData.serviceType) ||
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

export default QuotePage;
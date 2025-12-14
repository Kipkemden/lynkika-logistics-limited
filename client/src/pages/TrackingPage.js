import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Paper,
  Chip,
  Grid,
  Alert
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  Search,
  LocalShipping,
  CheckCircle,
  Schedule,
  LocationOn
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';

const TrackingPage = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async () => {
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`/api/tracking/${trackingNumber}`);
      setTrackingData(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Shipment not found');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'success';
      case 'in_transit': return 'primary';
      case 'confirmed': return 'info';
      default: return 'default';
    }
  };

  const getTimelineIcon = (status, index, total) => {
    if (index === total - 1) {
      return <CheckCircle color="success" />;
    }
    return <LocalShipping color="primary" />;
  };

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
            Track Your Shipment
          </Typography>
          <Typography variant="h6" textAlign="center" sx={{ mb: 6, opacity: 0.8 }}>
            Enter your tracking number to get real-time updates
          </Typography>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Paper sx={{ p: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                fullWidth
                label="Tracking Number"
                placeholder="Enter your tracking number (e.g., M123456ABC)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                error={!!error}
                helperText={error}
              />
              <Button
                variant="contained"
                size="large"
                onClick={handleTrack}
                disabled={loading}
                startIcon={<Search />}
                sx={{ minWidth: 120, height: 56 }}
              >
                {loading ? 'Tracking...' : 'Track'}
              </Button>
            </Box>
          </Paper>
        </motion.div>

        {trackingData && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card sx={{ mb: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h5" gutterBottom>
                      Shipment Details
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Tracking Number
                      </Typography>
                      <Typography variant="h6">
                        {trackingData.reference}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Service Type
                      </Typography>
                      <Chip 
                        label={trackingData.serviceType.replace('_', ' ').toUpperCase()}
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Current Status
                      </Typography>
                      <Chip 
                        label={trackingData.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(trackingData.status)}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Route Information
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          From
                        </Typography>
                        <Typography variant="body1">
                          {trackingData.pickup.city}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          To
                        </Typography>
                        <Typography variant="body1">
                          {trackingData.delivery.city}
                        </Typography>
                      </Box>
                    </Box>
                    {trackingData.delivery.estimatedDate && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Estimated Delivery
                          </Typography>
                          <Typography variant="body1">
                            {new Date(trackingData.delivery.estimatedDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Tracking Timeline
                </Typography>
                
                <Timeline>
                  {trackingData.timeline.map((event, index) => (
                    <TimelineItem key={index}>
                      <TimelineSeparator>
                        <TimelineDot color={index === trackingData.timeline.length - 1 ? 'success' : 'primary'}>
                          {getTimelineIcon(event.status, index, trackingData.timeline.length)}
                        </TimelineDot>
                        {index < trackingData.timeline.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Paper sx={{ p: 2, mb: 2 }}>
                          <Typography variant="h6" gutterBottom>
                            {event.status}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {event.location} • {new Date(event.timestamp).toLocaleString()}
                          </Typography>
                          {event.notes && (
                            <Typography variant="body2">
                              {event.notes}
                            </Typography>
                          )}
                        </Paper>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!trackingData && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Alert severity="info" sx={{ mt: 4 }}>
              <Typography variant="body1">
                Enter your tracking number above to view shipment details and real-time updates.
              </Typography>
            </Alert>
          </motion.div>
        )}
      </Container>

      <Footer />
    </Box>
  );
};

export default TrackingPage;
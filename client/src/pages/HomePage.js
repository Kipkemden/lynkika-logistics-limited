import React, { useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  LocalShipping,
  Schedule,
  TrackChanges,
  Business,
  Speed,
  Security,
  CheckCircle,
  LocationOn,
  Phone,
  AccessTime
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';

const HomePage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Handle hash navigation (e.g., /#services)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  const services = useMemo(() => [
    {
      title: 'Moving Services',
      description: 'Complete residential and commercial moving solutions with professional packing and handling.',
      icon: <LocalShipping sx={{ fontSize: { xs: 32, md: 40 } }} />,
      features: [
        'Professional packing services',
        'Furniture disassembly/assembly',
        'Loading and unloading',
        'Insurance coverage',
        'Real-time tracking'
      ],
      pricing: 'Starting from KSh 15,000/day',
      bookingType: 'online',
      action: () => navigate('/book/movers'),
      buttonText: 'Book Moving Service'
    },
    {
      title: 'Freight & Full Load',
      description: 'Dedicated vehicle transportation for large shipments and commercial cargo.',
      icon: <Business sx={{ fontSize: { xs: 32, md: 40 } }} />,
      features: [
        'Dedicated vehicle assignment',
        'Direct point-to-point delivery',
        'Flexible scheduling',
        'Large capacity handling',
        'Commercial invoicing'
      ],
      pricing: 'Custom pricing based on distance and load',
      bookingType: 'online',
      action: () => navigate('/book/freight'),
      buttonText: 'Book Freight Service'
    },
    {
      title: 'Scheduled Routes',
      description: 'Cost-effective shared transportation on regular routes with fixed schedules.',
      icon: <Schedule sx={{ fontSize: { xs: 32, md: 40 } }} />,
      features: [
        'Regular departure schedules',
        'Shared cost benefits',
        'Reliable timing',
        'Capacity-based booking',
        'Route optimization'
      ],
      pricing: 'From KSh 2,500 base rate + weight/volume charges',
      bookingType: 'online',
      action: () => navigate('/book/scheduled'),
      buttonText: 'View Routes'
    },
    {
      title: 'Courier Services',
      description: 'Fast delivery for documents and small packages. Walk-in service only.',
      icon: <Speed sx={{ fontSize: { xs: 32, md: 40 } }} />,
      features: [
        'Same-day delivery available',
        'Document handling',
        'Small package delivery',
        'Proof of delivery',
        'Express options'
      ],
      pricing: 'Starting from KSh 1,500 for local delivery',
      bookingType: 'walk-in',
      action: null,
      buttonText: 'Visit Our Locations'
    }
  ], [navigate]);

  const courierLocations = useMemo(() => [
    {
      name: 'Nairobi CBD Branch',
      address: 'Kimathi Street, Nairobi CBD, Kenya',
      phone: '+254 714 883 717',
      hours: 'Mon-Fri: 8AM-6PM, Sat: 9AM-4PM'
    },
    {
      name: 'Westlands Office',
      address: 'Westlands Square, Nairobi, Kenya',
      phone: '+254 714 883 717',
      hours: 'Mon-Fri: 9AM-5PM, Sat: 10AM-3PM'
    },
    {
      name: 'Industrial Area',
      address: 'Enterprise Road, Industrial Area, Nairobi',
      phone: '+254 714 883 717',
      hours: 'Mon-Fri: 7AM-7PM, Sat: 8AM-5PM'
    }
  ], []);

  const features = useMemo(() => [
    {
      title: 'Real-time Tracking',
      description: 'Monitor your shipments every step of the way',
      icon: <TrackChanges sx={{ fontSize: 32, color: '#1E88E5' }} />
    },
    {
      title: 'Secure Transport',
      description: 'Your items are protected with comprehensive insurance',
      icon: <Security sx={{ fontSize: 32, color: '#1E88E5' }} />
    },
    {
      title: 'On-time Delivery',
      description: 'Reliable scheduling with 99% on-time performance',
      icon: <Schedule sx={{ fontSize: 32, color: '#1E88E5' }} />
    }
  ], []);

  return (
    <Box>
      <Header />
      
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0A2463 0%, #1E88E5 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Typography 
                  variant={isMobile ? "h3" : "h1"} 
                  gutterBottom 
                  textAlign="center"
                  sx={{ fontWeight: 700 }}
                >
                  Professional Logistics Solutions
                </Typography>
                <Typography 
                  variant={isMobile ? "h6" : "h5"} 
                  sx={{ mb: 4, opacity: 0.9 }}
                  textAlign="center"
                  maxWidth="800px"
                  mx="auto"
                >
                  Kenya's trusted logistics partner providing reliable transportation services 
                  across East Africa. From Nairobi to Mombasa and beyond.
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'center'
                }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/quote')}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
                      minWidth: { xs: '200px', sm: 'auto' }
                    }}
                  >
                    Get a Quote
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/track')}
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      },
                      minWidth: { xs: '200px', sm: 'auto' }
                    }}
                  >
                    Track Shipment
                  </Button>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Services Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }} id="services">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Typography 
            variant={isMobile ? "h3" : "h2"} 
            textAlign="center" 
            gutterBottom
          >
            Our Services
          </Typography>
          <Typography 
            variant="h6" 
            textAlign="center" 
            sx={{ mb: 6, opacity: 0.8 }}
          >
            Professional logistics solutions tailored to your needs
          </Typography>
        </motion.div>

        <Grid container spacing={4}>
          {services.map((service, index) => (
            <Grid item xs={12} md={6} key={service.title}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ color: '#1E88E5', mr: 2 }}>
                        {service.icon}
                      </Box>
                      <Box>
                        <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
                          {service.title}
                        </Typography>
                        <Chip
                          label={service.bookingType === 'online' ? 'Online Booking' : 'Walk-in Only'}
                          color={service.bookingType === 'online' ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                    </Box>
                    
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      {service.description}
                    </Typography>

                    <Typography variant="h6" gutterBottom>
                      Features:
                    </Typography>
                    <List dense>
                      {service.features.map((feature, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5, px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircle color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={feature} 
                            primaryTypographyProps={{ 
                              variant: 'body2',
                              fontSize: { xs: '0.8rem', md: '0.875rem' }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>

                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="h6" color="primary">
                      {service.pricing}
                    </Typography>
                  </CardContent>
                  
                  <CardActions sx={{ p: { xs: 2, md: 3 }, pt: 0 }}>
                    {service.action ? (
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={service.action}
                      >
                        {service.buttonText}
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => {
                          document.getElementById('courier-locations')?.scrollIntoView({ 
                            behavior: 'smooth' 
                          });
                        }}
                      >
                        {service.buttonText}
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Courier Locations Section */}
      <Box sx={{ backgroundColor: '#F5F5F5', py: { xs: 6, md: 8 } }} id="courier-locations">
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography 
              variant={isMobile ? "h4" : "h3"} 
              textAlign="center" 
              gutterBottom
            >
              Courier Service Locations
            </Typography>
            <Typography 
              variant="h6" 
              textAlign="center" 
              sx={{ mb: 6, opacity: 0.8 }}
            >
              Visit any of our locations for courier services and package drop-off
            </Typography>
          </motion.div>

          <Grid container spacing={4}>
            {courierLocations.map((location, index) => (
              <Grid item xs={12} md={4} key={location.name}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                >
                  <Paper
                    sx={{
                      p: { xs: 3, md: 4 },
                      height: '100%',
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <Typography variant="h5" gutterBottom color="primary">
                      {location.name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <LocationOn sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        {location.address}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        {location.phone}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <AccessTime sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        {location.hours}
                      </Typography>
                    </Box>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Typography 
            variant={isMobile ? "h4" : "h3"} 
            textAlign="center" 
            gutterBottom
          >
            Why Choose Lynkika?
          </Typography>
        </motion.div>

        <Grid container spacing={4} sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={feature.title}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
              >
                <Paper
                  sx={{
                    p: { xs: 3, md: 4 },
                    textAlign: 'center',
                    height: '100%',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ backgroundColor: '#F5F5F5', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Paper
              sx={{
                p: { xs: 4, md: 6 },
                textAlign: 'center',
                background: 'linear-gradient(135deg, #0A2463 0%, #1E88E5 100%)',
                color: 'white'
              }}
            >
              <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
                Need a Custom Solution?
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ mb: 4, opacity: 0.9 }}
              >
                Contact us for specialized logistics requirements and enterprise solutions
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'center', 
                flexWrap: 'wrap',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center'
              }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/quote')}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
                    minWidth: { xs: '200px', sm: 'auto' }
                  }}
                >
                  Get Custom Quote
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    },
                    minWidth: { xs: '200px', sm: 'auto' }
                  }}
                >
                  Contact Sales
                </Button>
              </Box>
            </Paper>
          </motion.div>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default HomePage;
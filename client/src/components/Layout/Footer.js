import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Link,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Phone,
  Email,
  LocationOn,
  Facebook,
  Twitter,
  LinkedIn
} from '@mui/icons-material';

const Footer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleServicesClick = () => {
    // Navigate to homepage and scroll to services
    window.location.href = '/#services';
  };

  return (
    <Box
      component="footer"
      sx={{
        background: 'linear-gradient(135deg, #0A2463 0%, #1E88E5 100%)',
        color: 'white',
        py: { xs: 4, md: 6 },
        mt: { xs: 6, md: 8 }
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 3, md: 4 }}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom fontWeight={700}>
              Lynkika Logistics
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 2, 
                opacity: 0.9,
                fontSize: { xs: '0.8rem', md: '0.875rem' }
              }}
            >
              Kenya's leading logistics and transportation company serving East Africa 
              with reliability, efficiency, and customer satisfaction since 2020.
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              justifyContent: { xs: 'center', md: 'flex-start' }
            }}>
              <Facebook sx={{ 
                cursor: 'pointer', 
                '&:hover': { opacity: 0.7 },
                fontSize: { xs: 20, md: 24 }
              }} />
              <Twitter sx={{ 
                cursor: 'pointer', 
                '&:hover': { opacity: 0.7 },
                fontSize: { xs: 20, md: 24 }
              }} />
              <LinkedIn sx={{ 
                cursor: 'pointer', 
                '&:hover': { opacity: 0.7 },
                fontSize: { xs: 20, md: 24 }
              }} />
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography 
              variant="h6" 
              gutterBottom 
              fontWeight={600}
              textAlign={{ xs: 'center', md: 'left' }}
            >
              Services
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1,
              alignItems: { xs: 'center', md: 'flex-start' }
            }}>
              <Link 
                onClick={handleServicesClick}
                color="inherit" 
                underline="hover"
                sx={{ 
                  cursor: 'pointer',
                  fontSize: { xs: '0.8rem', md: '0.875rem' }
                }}
              >
                Moving Services
              </Link>
              <Link 
                onClick={handleServicesClick}
                color="inherit" 
                underline="hover"
                sx={{ 
                  cursor: 'pointer',
                  fontSize: { xs: '0.8rem', md: '0.875rem' }
                }}
              >
                Freight & Full Load
              </Link>
              <Link 
                onClick={handleServicesClick}
                color="inherit" 
                underline="hover"
                sx={{ 
                  cursor: 'pointer',
                  fontSize: { xs: '0.8rem', md: '0.875rem' }
                }}
              >
                Scheduled Routes
              </Link>
              <Link 
                onClick={handleServicesClick}
                color="inherit" 
                underline="hover"
                sx={{ 
                  cursor: 'pointer',
                  fontSize: { xs: '0.8rem', md: '0.875rem' }
                }}
              >
                Courier Services
              </Link>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography 
              variant="h6" 
              gutterBottom 
              fontWeight={600}
              textAlign={{ xs: 'center', md: 'left' }}
            >
              Contact Info
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1.5,
              alignItems: { xs: 'center', md: 'flex-start' }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                flexDirection: { xs: 'column', sm: 'row' },
                textAlign: { xs: 'center', sm: 'left' }
              }}>
                <Phone fontSize="small" />
                <Typography 
                  variant="body2"
                  sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}
                >
                  +254 714 883 717
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                flexDirection: { xs: 'column', sm: 'row' },
                textAlign: { xs: 'center', sm: 'left' }
              }}>
                <Email fontSize="small" />
                <Typography 
                  variant="body2"
                  sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}
                >
                  info@lynkika.co.ke
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: { xs: 'center', sm: 'flex-start' }, 
                gap: 1,
                flexDirection: { xs: 'column', sm: 'row' },
                textAlign: { xs: 'center', sm: 'left' }
              }}>
                <LocationOn fontSize="small" sx={{ mt: { sm: 0.5 } }} />
                <Typography 
                  variant="body2"
                  sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}
                >
                  Kimathi Street, Nairobi CBD, Kenya
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ 
          my: { xs: 3, md: 4 }, 
          backgroundColor: 'rgba(255, 255, 255, 0.2)' 
        }} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              opacity: 0.8,
              fontSize: { xs: '0.75rem', md: '0.875rem' },
              lineHeight: 1.6
            }}
          >
            © 2024 Lynkika Logistics. All rights reserved.
            {!isMobile && (
              <>
                {' | '}
                <Link href="#" color="inherit" sx={{ ml: 1 }}>Privacy Policy</Link>
                {' | '}
                <Link href="#" color="inherit" sx={{ ml: 1 }}>Terms of Service</Link>
              </>
            )}
          </Typography>
          {isMobile && (
            <Box sx={{ mt: 1 }}>
              <Link href="#" color="inherit" sx={{ mr: 2, fontSize: '0.75rem' }}>
                Privacy Policy
              </Link>
              <Link href="#" color="inherit" sx={{ fontSize: '0.75rem' }}>
                Terms of Service
              </Link>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Assignment,
  LocalShipping,
  Route,
  TrendingUp,
  AttachMoney,
  Analytics,
  TrendingDown
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { trackEvent } from '../../utils/analytics';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayBookings: 0,
    pendingQuotes: 0,
    activeBookings: 0,
    totalRoutes: 0,
    income: {
      todayRevenue: 0,
      weeklyRevenue: 0,
      monthlyRevenue: 0,
      totalRevenue: 0,
      revenueByService: [],
      monthlyTrend: []
    }
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/ops-control-center');
      return;
    }
    
    // Track dashboard view
    trackEvent('admin_dashboard_view', {
      userId: user.email,
      role: user.role,
      timestamp: new Date().toISOString()
    });
    
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, bookingsResponse] = await Promise.all([
        axios.get('/api/admin/dashboard'),
        axios.get('/api/admin/bookings?limit=5')
      ]);
      
      // Ensure income object exists with default values
      const responseData = statsResponse.data;
      const incomeData = responseData.income || {
        todayRevenue: 0,
        weeklyRevenue: 0,
        monthlyRevenue: 0,
        totalRevenue: 0,
        revenueByService: [],
        monthlyTrend: []
      };
      
      setStats({
        ...responseData,
        income: incomeData
      });
      setRecentBookings(bookingsResponse.data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set default values on error
      setStats(prevStats => ({
        ...prevStats,
        income: {
          todayRevenue: 0,
          weeklyRevenue: 0,
          monthlyRevenue: 0,
          totalRevenue: 0,
          revenueByService: [],
          monthlyTrend: []
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const statCards = [
    {
      title: 'Today\'s Bookings',
      value: stats.todayBookings,
      icon: <Assignment sx={{ fontSize: 40, color: '#1E88E5' }} />,
      color: '#1E88E5'
    },
    {
      title: 'Pending Quotes',
      value: stats.pendingQuotes,
      icon: <TrendingUp sx={{ fontSize: 40, color: '#FF9800' }} />,
      color: '#FF9800'
    },
    {
      title: 'Active Shipments',
      value: stats.activeBookings,
      icon: <LocalShipping sx={{ fontSize: 40, color: '#4CAF50' }} />,
      color: '#4CAF50'
    },
    {
      title: 'Active Routes',
      value: stats.totalRoutes,
      icon: <Route sx={{ fontSize: 40, color: '#9C27B0' }} />,
      color: '#9C27B0'
    }
  ];

  // Income cards for super admin and operations manager
  const incomeCards = (user?.role === 'super_admin' || user?.role === 'operations_manager') && stats.income ? [
    {
      title: 'Today\'s Revenue',
      value: formatCurrency(stats.income.todayRevenue || 0),
      icon: <AttachMoney sx={{ fontSize: 40, color: '#2E7D32' }} />,
      color: '#2E7D32'
    },
    {
      title: 'Weekly Revenue',
      value: formatCurrency(stats.income.weeklyRevenue || 0),
      icon: <TrendingUp sx={{ fontSize: 40, color: '#1976D2' }} />,
      color: '#1976D2'
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats.income.monthlyRevenue || 0),
      icon: <Analytics sx={{ fontSize: 40, color: '#7B1FA2' }} />,
      color: '#7B1FA2'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.income.totalRevenue || 0),
      icon: <TrendingDown sx={{ fontSize: 40, color: '#D32F2F' }} />,
      color: '#D32F2F'
    }
  ] : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'info';
      case 'in_transit': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress />
        </Box>
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
        <Typography variant="h4" gutterBottom>
          Operations Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Welcome back, {user?.name}. Here's your operations overview.
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={card.title}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    background: `linear-gradient(135deg, ${card.color}15 0%, ${card.color}05 100%)`,
                    border: `1px solid ${card.color}30`,
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: card.color }}>
                          {card.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {card.title}
                        </Typography>
                      </Box>
                      {card.icon}
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Income Analytics Cards - Only for Super Admin and Operations Manager */}
        {incomeCards.length > 0 && (
          <>
            <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
              Revenue Analytics
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {incomeCards.map((card, index) => (
                <Grid item xs={12} sm={6} md={3} key={card.title}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: (statCards.length + index) * 0.1 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        background: `linear-gradient(135deg, ${card.color}15 0%, ${card.color}05 100%)`,
                        border: `1px solid ${card.color}30`,
                        transition: 'transform 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: card.color }}>
                              {card.value}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {card.title}
                            </Typography>
                          </Box>
                          {card.icon}
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {/* Revenue Analytics Charts */}
            {stats.income && stats.income.revenueByService && stats.income.revenueByService.length > 0 && (
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Monthly Revenue Trend Chart */}
                <Grid item xs={12} lg={8}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Monthly Revenue Trend
                      </Typography>
                      <Box sx={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                          <LineChart data={stats.income.monthlyTrend || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="month" 
                              tick={{ fontSize: 12 }}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                            />
                            <Tooltip 
                              formatter={(value) => [formatCurrency(value), 'Revenue']}
                              labelStyle={{ color: '#333' }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="revenue" 
                              stroke="#1976D2" 
                              strokeWidth={3}
                              dot={{ fill: '#1976D2', strokeWidth: 2, r: 6 }}
                              activeDot={{ r: 8, stroke: '#1976D2', strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Revenue by Service Type Pie Chart */}
                <Grid item xs={12} lg={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Revenue by Service Type
                      </Typography>
                      <Box sx={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={stats.income.revenueByService || []}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ service, percentage }) => `${service}: ${percentage}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="revenue"
                            >
                              {(stats.income.revenueByService || []).map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={['#1976D2', '#FF9800', '#4CAF50', '#9C27B0', '#F44336'][index % 5]} 
                                />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </>
        )}

        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Recent Bookings
              </Typography>
              
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Reference</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Route</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentBookings.map((booking) => (
                      <TableRow key={booking._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {booking.bookingReference}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={booking.serviceType.replace('_', ' ').toUpperCase()}
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
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {recentBookings.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No recent bookings found
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminDashboard;
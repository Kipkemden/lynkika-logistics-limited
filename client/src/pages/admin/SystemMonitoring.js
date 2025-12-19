import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Button,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Dashboard,
  Speed,
  Security,
  Error,
  Refresh,
  Download,
  Visibility,
  Warning,
  CheckCircle,
  TrendingUp,
  Storage,
  NetworkCheck
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import AdminLayout from '../../components/admin/AdminLayout';
import axios from 'axios';

const SystemMonitoring = () => {
  const [tabValue, setTabValue] = useState(0);
  const [systemHealth, setSystemHealth] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [cacheStats, setCacheStats] = useState(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [loading, setLoading] = useState(true);

  // Fetch system health
  const fetchSystemHealth = async () => {
    try {
      const response = await axios.get('/health');
      setSystemHealth(response.data);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    }
  };

  // Fetch performance metrics
  const fetchPerformanceMetrics = async () => {
    try {
      const response = await axios.get('/api/admin/monitoring/performance');
      setPerformanceMetrics(response.data);
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
    }
  };

  // Fetch error logs
  const fetchErrorLogs = async () => {
    try {
      const response = await axios.get('/api/admin/monitoring/errors');
      setErrorLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch error logs:', error);
    }
  };

  // Fetch security events
  const fetchSecurityEvents = async () => {
    try {
      const response = await axios.get('/api/admin/monitoring/security');
      setSecurityEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch security events:', error);
    }
  };

  // Fetch cache statistics
  const fetchCacheStats = async () => {
    try {
      const response = await axios.get('/api/admin/monitoring/cache');
      setCacheStats(response.data);
    } catch (error) {
      console.error('Failed to fetch cache stats:', error);
    }
  };

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSystemHealth(),
      fetchPerformanceMetrics(),
      fetchErrorLogs(),
      fetchSecurityEvents(),
      fetchCacheStats()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Auto-refresh data
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(() => {
      fetchAllData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [realTimeUpdates]);

  // Clear cache
  const clearCache = async () => {
    try {
      await axios.post('/api/admin/monitoring/cache/clear');
      fetchCacheStats();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  // Download logs
  const downloadLogs = async (logType) => {
    try {
      const response = await axios.get(`/api/admin/monitoring/logs/${logType}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${logType}-logs-${new Date().toISOString().split('T')[0]}.log`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download logs:', error);
    }
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Dashboard color="primary" />
            System Monitoring
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={realTimeUpdates}
                  onChange={(e) => setRealTimeUpdates(e.target.checked)}
                />
              }
              label="Real-time Updates"
            />
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchAllData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* System Health Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h6">System Status</Typography>
                    <Chip 
                      label={systemHealth?.message || 'Loading...'} 
                      color={getHealthColor('healthy')}
                      size="small"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUp color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h6">Uptime</Typography>
                    <Typography variant="h5" color="primary">
                      {systemHealth ? formatUptime(systemHealth.uptime) : 'Loading...'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Speed color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h6">Response Time</Typography>
                    <Typography variant="h5" color="primary">
                      {performanceMetrics.length > 0 
                        ? `${Math.round(performanceMetrics[performanceMetrics.length - 1]?.avgResponseTime || 0)}ms`
                        : 'Loading...'
                      }
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Error color="error" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h6">Errors (24h)</Typography>
                    <Typography variant="h5" color="error">
                      {errorLogs.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs for different monitoring sections */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Performance" icon={<Speed />} />
            <Tab label="Error Logs" icon={<Error />} />
            <Tab label="Security Events" icon={<Security />} />
            <Tab label="Cache Statistics" icon={<Storage />} />
          </Tabs>
        </Paper>

        {/* Performance Tab */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Card>
                <CardHeader title="Response Time Trends" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="avgResponseTime" stroke="#8884d8" />
                      <Line type="monotone" dataKey="errorRate" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Card>
                <CardHeader title="Performance Metrics" />
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">Average Load Time</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={75} 
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="caption">2.3s (Good)</Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">Core Web Vitals</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={85} 
                      color="success"
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="caption">85/100 (Good)</Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2">API Response Time</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={90} 
                      color="success"
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="caption">450ms (Excellent)</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Error Logs Tab */}
        {tabValue === 1 && (
          <Card>
            <CardHeader 
              title="Recent Error Logs" 
              action={
                <Button
                  startIcon={<Download />}
                  onClick={() => downloadLogs('error')}
                  size="small"
                >
                  Download
                </Button>
              }
            />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {errorLogs.slice(0, 10).map((log, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={log.level} 
                            color={log.level === 'error' ? 'error' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{log.message}</TableCell>
                        <TableCell>{log.source || 'Backend'}</TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Security Events Tab */}
        {tabValue === 2 && (
          <Card>
            <CardHeader 
              title="Security Events" 
              action={
                <Button
                  startIcon={<Download />}
                  onClick={() => downloadLogs('security')}
                  size="small"
                >
                  Download
                </Button>
              }
            />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Event Type</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {securityEvents.slice(0, 10).map((event, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(event.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>{event.eventType}</TableCell>
                        <TableCell>{event.ipAddress}</TableCell>
                        <TableCell>{event.userId || 'Anonymous'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={event.severity} 
                            color={event.severity === 'HIGH' ? 'error' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{event.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Cache Statistics Tab */}
        {tabValue === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader 
                  title="Cache Performance" 
                  action={
                    <Button
                      startIcon={<Refresh />}
                      onClick={clearCache}
                      color="warning"
                      size="small"
                    >
                      Clear Cache
                    </Button>
                  }
                />
                <CardContent>
                  {cacheStats && (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Hits', value: cacheStats.hits || 0 },
                            { name: 'Misses', value: cacheStats.misses || 0 }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label
                        >
                          {[
                            { name: 'Hits', value: cacheStats.hits || 0 },
                            { name: 'Misses', value: cacheStats.misses || 0 }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Cache Statistics" />
                <CardContent>
                  {cacheStats ? (
                    <Box>
                      <Typography variant="h6" gutterBottom>Hit Rate</Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={(cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100 || 0}
                        color="success"
                        sx={{ mb: 3 }}
                      />
                      
                      <Typography variant="body2">Total Requests: {(cacheStats.hits + cacheStats.misses) || 0}</Typography>
                      <Typography variant="body2">Cache Hits: {cacheStats.hits || 0}</Typography>
                      <Typography variant="body2">Cache Misses: {cacheStats.misses || 0}</Typography>
                      <Typography variant="body2">Keys Stored: {cacheStats.keys || 0}</Typography>
                    </Box>
                  ) : (
                    <Typography>Loading cache statistics...</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>
    </AdminLayout>
  );
};

export default SystemMonitoring;
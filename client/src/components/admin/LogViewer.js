import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Clear,
  Download,
  Search,
  FilterList
} from '@mui/icons-material';

const LogViewer = ({ logType = 'combined' }) => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef(null);

  // Mock log streaming - in production, you'd use WebSockets or Server-Sent Events
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const newLog = {
        timestamp: new Date().toISOString(),
        level: ['info', 'warn', 'error'][Math.floor(Math.random() * 3)],
        message: `Sample log message ${Date.now()}`,
        service: 'lynkika-logistics',
        ip: '192.168.1.' + Math.floor(Math.random() * 255),
        userId: Math.random() > 0.5 ? 'user_' + Math.floor(Math.random() * 1000) : null
      };

      setLogs(prev => [...prev.slice(-99), newLog]); // Keep last 100 logs
    }, 2000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // Filter logs
  useEffect(() => {
    let filtered = logs;

    if (filter) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(filter.toLowerCase()) ||
        log.service.toLowerCase().includes(filter.toLowerCase()) ||
        (log.userId && log.userId.toLowerCase().includes(filter.toLowerCase()))
      );
    }

    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    setFilteredLogs(filtered);
  }, [logs, filter, levelFilter]);

  // Auto scroll to bottom
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return 'error';
      case 'warn': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const downloadLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message} (${log.service})`
    ).join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${logType}-logs-${new Date().toISOString().split('T')[0]}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Paper sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column' }}>
      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button
          variant={isStreaming ? "contained" : "outlined"}
          startIcon={isStreaming ? <Pause /> : <PlayArrow />}
          onClick={() => setIsStreaming(!isStreaming)}
          color={isStreaming ? "error" : "success"}
        >
          {isStreaming ? 'Stop' : 'Start'} Stream
        </Button>

        <TextField
          size="small"
          placeholder="Filter logs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          sx={{ minWidth: 200 }}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Level</InputLabel>
          <Select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            label="Level"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="info">Info</MenuItem>
            <MenuItem value="warn">Warning</MenuItem>
            <MenuItem value="error">Error</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
          }
          label="Auto Scroll"
        />

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title="Clear Logs">
          <IconButton onClick={clearLogs}>
            <Clear />
          </IconButton>
        </Tooltip>

        <Tooltip title="Download Logs">
          <IconButton onClick={downloadLogs}>
            <Download />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Log Display */}
      <Box
        ref={logContainerRef}
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          backgroundColor: '#1e1e1e',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          p: 2,
          borderRadius: 1
        }}
      >
        {filteredLogs.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
            {isStreaming ? 'Waiting for logs...' : 'No logs to display. Click "Start Stream" to begin monitoring.'}
          </Typography>
        ) : (
          filteredLogs.map((log, index) => (
            <Box key={index} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Typography
                component="span"
                sx={{ 
                  color: '#888',
                  fontSize: '0.75rem',
                  minWidth: '180px',
                  fontFamily: 'monospace'
                }}
              >
                {new Date(log.timestamp).toLocaleString()}
              </Typography>
              
              <Chip
                label={log.level.toUpperCase()}
                color={getLevelColor(log.level)}
                size="small"
                sx={{ minWidth: '60px', fontSize: '0.7rem' }}
              />
              
              <Typography
                component="span"
                sx={{ 
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  wordBreak: 'break-word',
                  flexGrow: 1
                }}
              >
                {log.message}
              </Typography>
              
              {log.userId && (
                <Chip
                  label={log.userId}
                  variant="outlined"
                  size="small"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>
          ))
        )}
      </Box>

      {/* Status Bar */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mt: 1,
        pt: 1,
        borderTop: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="caption" color="text.secondary">
          Showing {filteredLogs.length} of {logs.length} logs
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isStreaming ? 'success.main' : 'error.main'
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {isStreaming ? 'Live' : 'Stopped'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default LogViewer;
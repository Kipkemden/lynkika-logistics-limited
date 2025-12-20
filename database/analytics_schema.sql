-- Analytics and Monitoring Database Schema
-- Run this in your Supabase SQL editor

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    value NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    url TEXT,
    user_agent TEXT,
    client_ip INET,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Error Logs Table
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(100),
    details TEXT,
    status_code INTEGER,
    path TEXT,
    method VARCHAR(10),
    client_ip INET,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security Events Table
CREATE TABLE IF NOT EXISTS security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    ip_address INET,
    user_id VARCHAR(255),
    severity VARCHAR(20) NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Response Times Table (for performance tracking)
CREATE TABLE IF NOT EXISTS response_times (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    response_time INTEGER NOT NULL,
    path TEXT NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    client_ip INET,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cache Statistics Table
CREATE TABLE IF NOT EXISTS cache_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hits INTEGER DEFAULT 0,
    misses INTEGER DEFAULT 0,
    keys_count INTEGER DEFAULT 0,
    operation VARCHAR(50),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Request Counts Table (hourly aggregation)
CREATE TABLE IF NOT EXISTS request_counts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hour_key VARCHAR(50) NOT NULL UNIQUE,
    count INTEGER DEFAULT 1,
    date DATE NOT NULL,
    hour INTEGER NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Events Table
CREATE TABLE IF NOT EXISTS business_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    properties JSONB,
    client_ip INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(name);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_response_times_timestamp ON response_times(timestamp);
CREATE INDEX IF NOT EXISTS idx_response_times_path ON response_times(path);
CREATE INDEX IF NOT EXISTS idx_cache_stats_timestamp ON cache_stats(timestamp);
CREATE INDEX IF NOT EXISTS idx_request_counts_date ON request_counts(date);
CREATE INDEX IF NOT EXISTS idx_business_events_timestamp ON business_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_business_events_name ON business_events(event_name);

-- Enable Row Level Security (RLS)
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_events ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admin can view performance metrics" ON performance_metrics FOR SELECT USING (true);
CREATE POLICY "System can insert performance metrics" ON performance_metrics FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view error logs" ON error_logs FOR SELECT USING (true);
CREATE POLICY "System can insert error logs" ON error_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view security events" ON security_events FOR SELECT USING (true);
CREATE POLICY "System can insert security events" ON security_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view response times" ON response_times FOR SELECT USING (true);
CREATE POLICY "System can insert response times" ON response_times FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view cache stats" ON cache_stats FOR SELECT USING (true);
CREATE POLICY "System can insert cache stats" ON cache_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update cache stats" ON cache_stats FOR UPDATE USING (true);

CREATE POLICY "Admin can view request counts" ON request_counts FOR SELECT USING (true);
CREATE POLICY "System can insert request counts" ON request_counts FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update request counts" ON request_counts FOR UPDATE USING (true);

CREATE POLICY "Admin can view business events" ON business_events FOR SELECT USING (true);
CREATE POLICY "System can insert business events" ON business_events FOR INSERT WITH CHECK (true);

-- Create a function to clean old data (optional - for data retention)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data()
RETURNS void AS $$
BEGIN
    -- Keep only last 30 days of performance metrics
    DELETE FROM performance_metrics WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Keep only last 90 days of error logs
    DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Keep only last 180 days of security events
    DELETE FROM security_events WHERE created_at < NOW() - INTERVAL '180 days';
    
    -- Keep only last 7 days of response times (high volume)
    DELETE FROM response_times WHERE created_at < NOW() - INTERVAL '7 days';
    
    -- Keep only last 30 days of cache stats
    DELETE FROM cache_stats WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Keep only last 365 days of request counts
    DELETE FROM request_counts WHERE created_at < NOW() - INTERVAL '365 days';
    
    -- Keep only last 90 days of business events
    DELETE FROM business_events WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create a view for hourly performance aggregation
CREATE OR REPLACE VIEW hourly_performance_stats AS
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    AVG(response_time) as avg_response_time,
    COUNT(*) as request_count,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
    ROUND((COUNT(CASE WHEN status_code >= 400 THEN 1 END)::numeric / COUNT(*) * 100), 2) as error_rate
FROM response_times 
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour;

-- Create a view for daily cache statistics
CREATE OR REPLACE VIEW daily_cache_stats AS
SELECT 
    DATE(timestamp) as date,
    SUM(hits) as total_hits,
    SUM(misses) as total_misses,
    ROUND((SUM(hits)::numeric / NULLIF(SUM(hits) + SUM(misses), 0) * 100), 2) as hit_rate
FROM cache_stats 
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date;
-- Additional SQL functions for analytics

-- Function to increment request count
CREATE OR REPLACE FUNCTION increment_request_count(key TEXT)
RETURNS void AS $$
BEGIN
    UPDATE request_counts 
    SET count = count + 1, updated_at = NOW()
    WHERE hour_key = key;
    
    IF NOT FOUND THEN
        INSERT INTO request_counts (hour_key, count, date, hour)
        VALUES (
            key, 
            1, 
            CURRENT_DATE, 
            EXTRACT(HOUR FROM NOW())::INTEGER
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get cache hit rate
CREATE OR REPLACE FUNCTION get_current_cache_stats()
RETURNS TABLE(
    total_hits BIGINT,
    total_misses BIGINT,
    hit_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(hits), 0) as total_hits,
        COALESCE(SUM(misses), 0) as total_misses,
        CASE 
            WHEN COALESCE(SUM(hits), 0) + COALESCE(SUM(misses), 0) = 0 THEN 0
            ELSE ROUND((COALESCE(SUM(hits), 0)::numeric / (COALESCE(SUM(hits), 0) + COALESCE(SUM(misses), 0)) * 100), 2)
        END as hit_rate
    FROM cache_stats 
    WHERE timestamp >= NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old analytics data (can be called by a cron job)
CREATE OR REPLACE FUNCTION cleanup_analytics_data()
RETURNS TEXT AS $$
DECLARE
    deleted_count INTEGER := 0;
    total_deleted INTEGER := 0;
BEGIN
    -- Clean performance metrics older than 30 days
    DELETE FROM performance_metrics WHERE created_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    
    -- Clean response times older than 7 days (high volume)
    DELETE FROM response_times WHERE created_at < NOW() - INTERVAL '7 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    
    -- Clean error logs older than 90 days
    DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    
    -- Clean security events older than 180 days
    DELETE FROM security_events WHERE created_at < NOW() - INTERVAL '180 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    
    -- Clean cache stats older than 30 days
    DELETE FROM cache_stats WHERE created_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    
    -- Clean business events older than 90 days
    DELETE FROM business_events WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    
    -- Clean request counts older than 365 days
    DELETE FROM request_counts WHERE created_at < NOW() - INTERVAL '365 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    
    RETURN 'Cleanup completed. Total records deleted: ' || total_deleted;
END;
$$ LANGUAGE plpgsql;
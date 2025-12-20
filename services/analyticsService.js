const supabase = require('../config/supabase');

class AnalyticsService {
  // Performance Metrics
  async savePerformanceMetric(data) {
    try {
      const { error } = await supabase
        .from('performance_metrics')
        .insert({
          name: data.name,
          value: data.value,
          timestamp: data.timestamp || new Date().toISOString(),
          url: data.url,
          user_agent: data.userAgent,
          client_ip: data.clientIP,
          metadata: data.metadata || {}
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error saving performance metric:', error);
      return { success: false, error: error.message };
    }
  }

  async getPerformanceMetrics(hours = 24) {
    try {
      const { data, error } = await supabase
        .from('hourly_performance_stats')
        .select('*')
        .order('hour', { ascending: true });

      if (error) throw error;
      
      return data.map(row => ({
        timestamp: row.hour,
        avgResponseTime: Math.round(row.avg_response_time || 0),
        errorRate: parseFloat(row.error_rate || 0),
        requestCount: row.request_count || 0
      }));
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return [];
    }
  }

  // Error Logs
  async saveErrorLog(data) {
    try {
      const { error } = await supabase
        .from('error_logs')
        .insert({
          level: data.level,
          message: data.message,
          source: data.source,
          details: data.details,
          status_code: data.statusCode,
          path: data.path,
          method: data.method,
          client_ip: data.ip,
          timestamp: data.timestamp || new Date().toISOString()
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error saving error log:', error);
      return { success: false, error: error.message };
    }
  }

  async getErrorLogs(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching error logs:', error);
      return [];
    }
  }

  // Security Events
  async saveSecurityEvent(data) {
    try {
      const { error } = await supabase
        .from('security_events')
        .insert({
          event_type: data.eventType,
          ip_address: data.ipAddress,
          user_id: data.userId,
          severity: data.severity,
          details: data.details,
          timestamp: data.timestamp || new Date().toISOString()
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error saving security event:', error);
      return { success: false, error: error.message };
    }
  }

  async getSecurityEvents(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching security events:', error);
      return [];
    }
  }

  // Response Times
  async saveResponseTime(data) {
    try {
      const { error } = await supabase
        .from('response_times')
        .insert({
          response_time: data.responseTime,
          path: data.path,
          method: data.method,
          status_code: data.statusCode,
          client_ip: data.ip,
          timestamp: data.timestamp || new Date().toISOString()
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error saving response time:', error);
      return { success: false, error: error.message };
    }
  }

  // Cache Statistics
  async updateCacheStats(operation, data = {}) {
    try {
      if (operation === 'hit' || operation === 'miss') {
        const { error } = await supabase
          .from('cache_stats')
          .insert({
            hits: operation === 'hit' ? 1 : 0,
            misses: operation === 'miss' ? 1 : 0,
            keys_count: data.keysCount || 0,
            operation: operation
          });

        if (error) throw error;
      } else if (operation === 'clear') {
        const { error } = await supabase
          .from('cache_stats')
          .insert({
            hits: 0,
            misses: 0,
            keys_count: 0,
            operation: 'clear'
          });

        if (error) throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating cache stats:', error);
      return { success: false, error: error.message };
    }
  }

  async getCacheStats() {
    try {
      const { data, error } = await supabase
        .from('daily_cache_stats')
        .select('*')
        .order('date', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const stats = data[0];
        return {
          hits: stats.total_hits || 0,
          misses: stats.total_misses || 0,
          hitRate: parseFloat(stats.hit_rate || 0),
          totalRequests: (stats.total_hits || 0) + (stats.total_misses || 0),
          keys: 0 // This would need to be tracked separately
        };
      }

      return { hits: 0, misses: 0, hitRate: 0, totalRequests: 0, keys: 0 };
    } catch (error) {
      console.error('Error fetching cache stats:', error);
      return { hits: 0, misses: 0, hitRate: 0, totalRequests: 0, keys: 0 };
    }
  }

  // Request Counts
  async updateRequestCount(hourKey, date, hour) {
    try {
      const { data, error } = await supabase
        .from('request_counts')
        .upsert({
          hour_key: hourKey,
          count: 1,
          date: date,
          hour: hour
        }, {
          onConflict: 'hour_key',
          ignoreDuplicates: false
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      // If upsert fails, try to increment existing record
      try {
        const { error: updateError } = await supabase.rpc('increment_request_count', {
          key: hourKey
        });

        if (updateError) {
          // If increment fails, insert new record
          const { error: insertError } = await supabase
            .from('request_counts')
            .insert({
              hour_key: hourKey,
              count: 1,
              date: date,
              hour: hour
            });

          if (insertError) throw insertError;
        }

        return { success: true };
      } catch (fallbackError) {
        console.error('Error updating request count:', fallbackError);
        return { success: false, error: fallbackError.message };
      }
    }
  }

  // Business Events
  async saveBusinessEvent(data) {
    try {
      const { error } = await supabase
        .from('business_events')
        .insert({
          event_name: data.event,
          properties: data.properties || {},
          client_ip: data.clientIP,
          user_agent: data.userAgent,
          timestamp: data.timestamp || new Date().toISOString()
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error saving business event:', error);
      return { success: false, error: error.message };
    }
  }

  // System Health
  async getSystemHealth() {
    try {
      // Get recent response times for average calculation
      const { data: responseTimes, error: rtError } = await supabase
        .from('response_times')
        .select('response_time')
        .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .limit(100);

      if (rtError) throw rtError;

      // Get error count for last 24 hours
      const { data: errors, error: errError } = await supabase
        .from('error_logs')
        .select('id')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (errError) throw errError;

      const avgResponseTime = responseTimes && responseTimes.length > 0
        ? Math.round(responseTimes.reduce((sum, rt) => sum + rt.response_time, 0) / responseTimes.length)
        : 0;

      return {
        avgResponseTime,
        totalRequests: responseTimes ? responseTimes.length : 0,
        errorCount: errors ? errors.length : 0
      };
    } catch (error) {
      console.error('Error fetching system health:', error);
      return { avgResponseTime: 0, totalRequests: 0, errorCount: 0 };
    }
  }

  // Log Downloads
  async getLogsForDownload(logType) {
    try {
      let data = [];
      
      if (logType === 'error') {
        const { data: logs, error } = await supabase
          .from('error_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(1000);

        if (error) throw error;
        data = logs;
      } else if (logType === 'security') {
        const { data: logs, error } = await supabase
          .from('security_events')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(1000);

        if (error) throw error;
        data = logs;
      }

      return data;
    } catch (error) {
      console.error('Error fetching logs for download:', error);
      return [];
    }
  }
}

module.exports = new AnalyticsService();
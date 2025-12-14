const supabase = require('../config/supabase');

class SecurityService {
  // Log security events for audit trail
  async logSecurityEvent(eventType, userId, details, ipAddress, userAgent) {
    try {
      const { error } = await supabase
        .from('security_audit_log')
        .insert([{
          event_type: eventType,
          user_id: userId,
          details: JSON.stringify(details),
          ip_address: ipAddress,
          user_agent: userAgent,
          created_at: new Date().toISOString()
        }]);
      
      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Security logging error:', error);
    }
  }

  // Check for suspicious activity patterns
  async detectSuspiciousActivity(ipAddress, timeWindow = 15) {
    try {
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .eq('ip_address', ipAddress)
        .gte('created_at', new Date(Date.now() - timeWindow * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const failedLogins = data.filter(log => 
        log.event_type === 'LOGIN_FAILED' || log.event_type === 'AUTH_TOKEN_INVALID'
      ).length;

      const suspiciousEvents = data.filter(log => 
        log.event_type.includes('SECURITY') || log.event_type.includes('DENIED')
      ).length;

      return {
        isSuspicious: failedLogins > 3 || suspiciousEvents > 5,
        failedLogins,
        suspiciousEvents,
        totalEvents: data.length
      };
    } catch (error) {
      console.error('Suspicious activity detection error:', error);
      return { isSuspicious: false, failedLogins: 0, suspiciousEvents: 0, totalEvents: 0 };
    }
  }

  // Validate user permissions for specific actions
  validatePermissions(userRole, requiredPermissions) {
    const ROLE_PERMISSIONS = {
      'super_admin': [
        'view_dashboard', 'view_analytics', 'view_routes', 'create_routes', 'edit_routes', 
        'delete_routes', 'activate_deactivate_routes', 'view_all_bookings', 'create_bookings', 
        'edit_bookings', 'update_booking_status', 'cancel_bookings', 'assign_vehicles',
        'view_all_quotes', 'process_quotes', 'approve_quotes', 'view_users', 'create_users',
        'edit_users', 'delete_users', 'create_courier_shipments', 'view_pricing', 'edit_pricing',
        'view_financial_reports', 'view_system_logs', 'manage_system_settings'
      ],
      'operations_manager': [
        'view_dashboard', 'view_analytics', 'view_routes', 'create_routes', 'edit_routes',
        'activate_deactivate_routes', 'view_all_bookings', 'create_bookings', 'edit_bookings',
        'update_booking_status', 'cancel_bookings', 'assign_vehicles', 'view_all_quotes',
        'process_quotes', 'approve_quotes', 'create_courier_shipments', 'view_pricing',
        'edit_pricing', 'view_financial_reports'
      ],
      'dispatcher': [
        'view_dashboard', 'view_routes', 'view_all_bookings', 'create_bookings',
        'update_booking_status', 'assign_vehicles', 'create_courier_shipments', 'view_pricing'
      ]
    };

    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }

  // Generate security report
  async generateSecurityReport(days = 7) {
    try {
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const eventCounts = {};
      const ipCounts = {};
      const userCounts = {};

      data.forEach(log => {
        eventCounts[log.event_type] = (eventCounts[log.event_type] || 0) + 1;
        ipCounts[log.ip_address] = (ipCounts[log.ip_address] || 0) + 1;
        if (log.user_id) {
          userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
        }
      });

      return {
        totalEvents: data.length,
        eventTypes: eventCounts,
        topIPs: Object.entries(ipCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10),
        userActivity: userCounts,
        timeRange: `${days} days`,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Security report generation error:', error);
      return null;
    }
  }
}

module.exports = new SecurityService();
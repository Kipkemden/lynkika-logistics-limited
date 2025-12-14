const express = require('express');
const { authMiddleware, requireRole, sanitizeResponse } = require('../middleware/auth');
const securityService = require('../services/securityService');
const supabase = require('../config/supabase');

const router = express.Router();

// All security routes require authentication
router.use(authMiddleware);

// Security dashboard - super admin only
router.get('/dashboard', 
  requireRole(['super_admin']),
  sanitizeResponse(['totalEvents', 'eventTypes', 'topIPs', 'userActivity', 'timeRange', 'generatedAt']),
  async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 7;
      const report = await securityService.generateSecurityReport(days);
      
      if (!report) {
        return res.status(500).json({ message: 'Failed to generate security report' });
      }
      
      res.json(report);
    } catch (error) {
      console.error('Security dashboard error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Security audit log - super admin only
router.get('/audit-log', 
  requireRole(['super_admin']),
  async (req, res) => {
    try {
      const { page = 1, limit = 50, eventType, userId, days = 7 } = req.query;
      const offset = (page - 1) * limit;
      
      let query = supabase
        .from('security_audit_log')
        .select(`
          id,
          event_type,
          user_id,
          details,
          ip_address,
          created_at,
          users(name, email, role)
        `)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (eventType) {
        query = query.eq('event_type', eventType);
      }
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      res.json({
        logs: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Audit log error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Active user sessions - super admin only
router.get('/sessions', 
  requireRole(['super_admin']),
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          id,
          user_id,
          ip_address,
          user_agent,
          is_active,
          expires_at,
          created_at,
          last_activity,
          users(name, email, role)
        `)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });
      
      if (error) throw error;
      
      res.json({ sessions: data });
    } catch (error) {
      console.error('Sessions error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Revoke user session - super admin only
router.delete('/sessions/:sessionId', 
  requireRole(['super_admin']),
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);
      
      if (error) throw error;
      
      await securityService.logSecurityEvent(
        'SESSION_REVOKED',
        req.user.userId,
        { revokedSessionId: sessionId },
        req.ip,
        req.get('User-Agent')
      );
      
      res.json({ message: 'Session revoked successfully' });
    } catch (error) {
      console.error('Session revocation error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Failed login attempts - super admin only
router.get('/failed-logins', 
  requireRole(['super_admin']),
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('failed_login_attempts')
        .select('*')
        .order('last_attempt', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      res.json({ failedLogins: data });
    } catch (error) {
      console.error('Failed logins error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Security metrics - super admin only
router.get('/metrics', 
  requireRole(['super_admin']),
  async (req, res) => {
    try {
      const [auditCount, sessionCount, failedLoginCount] = await Promise.all([
        supabase.from('security_audit_log').select('id', { count: 'exact', head: true }),
        supabase.from('user_sessions').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('failed_login_attempts').select('id', { count: 'exact', head: true })
      ]);
      
      res.json({
        totalAuditEvents: auditCount.count || 0,
        activeSessions: sessionCount.count || 0,
        failedLoginAttempts: failedLoginCount.count || 0,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Security metrics error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
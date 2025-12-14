-- Lynkika Logistics Production Database Schema
-- PostgreSQL Database for Supabase
-- Version: 2.0 - Enterprise Grade with Security Features
-- Created: December 2024

-- =====================================================
-- CLEAN SLATE - DROP ALL EXISTING TABLES
-- =====================================================
DROP TABLE IF EXISTS failed_login_attempts CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS security_audit_log CASCADE;
DROP TABLE IF EXISTS tracking CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_audit_logs() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS set_booking_reference() CASCADE;
DROP FUNCTION IF EXISTS set_quote_reference() CASCADE;
DROP FUNCTION IF EXISTS generate_booking_reference(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS generate_quote_reference() CASCADE;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- USERS TABLE - Authentication and Role Management
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'operations_manager', 'dispatcher')),
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROUTES TABLE - Scheduled Transportation Routes
-- =====================================================
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    origin_city VARCHAR(255) NOT NULL,
    origin_address TEXT NOT NULL,
    origin_lat DECIMAL(10, 8),
    origin_lng DECIMAL(11, 8),
    destination_city VARCHAR(255) NOT NULL,
    destination_address TEXT NOT NULL,
    destination_lat DECIMAL(10, 8),
    destination_lng DECIMAL(11, 8),
    frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'bi-weekly', 'monthly')),
    departure_time VARCHAR(20) NOT NULL,
    estimated_duration INTEGER NOT NULL, -- in hours
    max_weight INTEGER NOT NULL, -- in kg
    max_volume DECIMAL(10, 2) NOT NULL, -- in cubic meters
    max_parcels INTEGER NOT NULL,
    base_rate DECIMAL(10, 2) NOT NULL,
    per_kg_rate DECIMAL(10, 2) NOT NULL,
    per_cubic_meter_rate DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    cutoff_hours INTEGER DEFAULT 24,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- QUOTES TABLE - Customer Quote Requests
-- =====================================================
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_reference VARCHAR(50) UNIQUE NOT NULL,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('movers', 'freight', 'scheduled_route')),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_company VARCHAR(255),
    origin_city VARCHAR(255) NOT NULL,
    origin_address TEXT NOT NULL,
    destination_city VARCHAR(255) NOT NULL,
    destination_address TEXT NOT NULL,
    items JSONB NOT NULL,
    preferred_date DATE,
    estimated_price JSONB,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'accepted', 'expired', 'cancelled')),
    valid_until DATE DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
    notes TEXT,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- BOOKINGS TABLE - All Shipment Bookings
-- =====================================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('movers', 'freight', 'scheduled_route', 'courier')),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_company VARCHAR(255),
    pickup_address TEXT NOT NULL,
    pickup_city VARCHAR(255) NOT NULL,
    pickup_date DATE NOT NULL,
    pickup_time_slot VARCHAR(50),
    pickup_contact_person VARCHAR(255),
    pickup_contact_phone VARCHAR(50),
    pickup_instructions TEXT,
    delivery_address TEXT NOT NULL,
    delivery_city VARCHAR(255) NOT NULL,
    delivery_date DATE,
    delivery_time_slot VARCHAR(50),
    delivery_contact_person VARCHAR(255),
    delivery_contact_phone VARCHAR(50),
    delivery_instructions TEXT,
    items JSONB NOT NULL,
    route_id UUID REFERENCES routes(id),
    pricing JSONB,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'picked', 'in_transit', 'delivered', 'cancelled')),
    assigned_vehicle_plate VARCHAR(50),
    assigned_driver_name VARCHAR(255),
    assigned_driver_phone VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
    special_instructions TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TRACKING TABLE - Shipment Status Updates
-- =====================================================
CREATE TABLE tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    status VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    notes TEXT,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECURITY AUDIT LOG - Enterprise Security Monitoring
-- =====================================================
CREATE TABLE security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- USER SESSIONS - Enhanced Session Management
-- =====================================================
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FAILED LOGIN ATTEMPTS - Security Monitoring
-- =====================================================
CREATE TABLE failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255),
    ip_address INET NOT NULL,
    attempt_count INTEGER DEFAULT 1,
    last_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    locked_until TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Primary business indexes
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_service_type ON bookings(service_type);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_pickup_date ON bookings(pickup_date);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);
CREATE INDEX idx_bookings_customer_email ON bookings(customer_email);

CREATE INDEX idx_quotes_reference ON quotes(quote_reference);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_customer_email ON quotes(customer_email);
CREATE INDEX idx_quotes_created_at ON quotes(created_at);

CREATE INDEX idx_routes_code ON routes(route_code);
CREATE INDEX idx_routes_active ON routes(is_active);
CREATE INDEX idx_routes_origin_city ON routes(origin_city);
CREATE INDEX idx_routes_destination_city ON routes(destination_city);

CREATE INDEX idx_tracking_booking ON tracking(booking_id);
CREATE INDEX idx_tracking_created_at ON tracking(created_at);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Security and audit indexes
CREATE INDEX idx_security_audit_event_type ON security_audit_log(event_type);
CREATE INDEX idx_security_audit_user_id ON security_audit_log(user_id);
CREATE INDEX idx_security_audit_ip_address ON security_audit_log(ip_address);
CREATE INDEX idx_security_audit_created_at ON security_audit_log(created_at);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX idx_failed_login_ip ON failed_login_attempts(ip_address);
CREATE INDEX idx_failed_login_email ON failed_login_attempts(email);
CREATE INDEX idx_failed_login_attempt_time ON failed_login_attempts(last_attempt);

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference(service_type VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    prefix VARCHAR(1);
    timestamp_part VARCHAR(6);
    random_part VARCHAR(3);
BEGIN
    -- Get prefix based on service type
    prefix := CASE 
        WHEN service_type = 'movers' THEN 'M'
        WHEN service_type = 'freight' THEN 'F'
        WHEN service_type = 'scheduled_route' THEN 'S'
        WHEN service_type = 'courier' THEN 'C'
        ELSE 'B'
    END;
    
    -- Get timestamp part (last 6 digits of epoch)
    timestamp_part := RIGHT(EXTRACT(EPOCH FROM NOW())::TEXT, 6);
    
    -- Generate random 3-character string
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 3));
    
    RETURN prefix || timestamp_part || random_part;
END;
$$ LANGUAGE plpgsql;

-- Function to generate quote reference
CREATE OR REPLACE FUNCTION generate_quote_reference()
RETURNS VARCHAR AS $$
DECLARE
    timestamp_part VARCHAR(6);
    random_part VARCHAR(3);
BEGIN
    timestamp_part := RIGHT(EXTRACT(EPOCH FROM NOW())::TEXT, 6);
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 3));
    RETURN 'Q' || timestamp_part || random_part;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- AUTOMATED TRIGGERS
-- =====================================================

-- Trigger to auto-generate booking reference
CREATE OR REPLACE FUNCTION set_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_reference IS NULL OR NEW.booking_reference = '' THEN
        NEW.booking_reference := generate_booking_reference(NEW.service_type);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_booking_reference
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION set_booking_reference();

-- Trigger to auto-generate quote reference
CREATE OR REPLACE FUNCTION set_quote_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quote_reference IS NULL OR NEW.quote_reference = '' THEN
        NEW.quote_reference := generate_quote_reference();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_quote_reference
    BEFORE INSERT ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION set_quote_reference();

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SECURITY FUNCTIONS
-- =====================================================

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR (is_active = false AND created_at < NOW() - INTERVAL '7 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old audit logs (keep 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM security_audit_log 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data (except admins)
CREATE POLICY users_own_data ON users
    FOR ALL USING (
        id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('super_admin', 'operations_manager')
        )
    );

-- Only admins can see audit logs
CREATE POLICY admin_audit_access ON security_audit_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'super_admin'
        )
    );

-- Users can only see their own sessions
CREATE POLICY users_own_sessions ON user_sessions
    FOR ALL USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'super_admin'
        )
    );

-- =====================================================
-- INITIAL SYSTEM DATA
-- =====================================================

-- Insert system initialization log
INSERT INTO security_audit_log (event_type, details, created_at)
VALUES ('SYSTEM_INITIALIZED', '{"message": "Lynkika Logistics database initialized", "version": "2.0", "features": ["RBAC", "Security Audit", "Session Management"]}', NOW());

-- =====================================================
-- DATABASE COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE users IS 'System users with role-based access control';
COMMENT ON TABLE routes IS 'Scheduled transportation routes between cities';
COMMENT ON TABLE quotes IS 'Customer quote requests for various services';
COMMENT ON TABLE bookings IS 'Confirmed shipment bookings with tracking';
COMMENT ON TABLE tracking IS 'Status updates and location tracking for shipments';
COMMENT ON TABLE security_audit_log IS 'Security events and audit trail';
COMMENT ON TABLE user_sessions IS 'Active user sessions for security monitoring';
COMMENT ON TABLE failed_login_attempts IS 'Failed login attempts for security analysis';

COMMENT ON COLUMN bookings.status IS 'Booking status: pending -> confirmed -> picked -> in_transit -> delivered';
COMMENT ON COLUMN users.role IS 'User role: super_admin, operations_manager, or dispatcher';
COMMENT ON COLUMN routes.frequency IS 'Route frequency: daily, weekly, bi-weekly, or monthly';

-- =====================================================
-- PERFORMANCE OPTIMIZATION
-- =====================================================

-- Analyze tables for query optimization
ANALYZE users;
ANALYZE routes;
ANALYZE quotes;
ANALYZE bookings;
ANALYZE tracking;
ANALYZE security_audit_log;
ANALYZE user_sessions;
ANALYZE failed_login_attempts;
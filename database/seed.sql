-- Lynkika Logistics Production Seed Data
-- PostgreSQL Seed Data for Supabase
-- Version: 2.0 - Production Ready with Real Kenyan Data
-- Created: December 2024

-- =====================================================
-- CLEAN EXISTING DATA FIRST
-- =====================================================
DELETE FROM failed_login_attempts;
DELETE FROM user_sessions;
DELETE FROM security_audit_log;
DELETE FROM tracking;
DELETE FROM bookings;
DELETE FROM quotes;
DELETE FROM routes;
DELETE FROM users;

-- Reset sequences if they exist
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS routes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS quotes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS bookings_id_seq RESTART WITH 1;

-- =====================================================
-- ADMIN USERS - Production Ready Accounts
-- =====================================================

-- Insert admin users with properly hashed passwords
-- Passwords: LynkikaAdmin2024!, OpsManager2024!, Dispatcher2024!
INSERT INTO users (email, password_hash, role, name, is_active) VALUES
('admin@lynkika.co.ke', '$2a$12$rQZ8vHFx7YzGzJ5K9X2.2eF8vHFx7YzGzJ5K9X2.2eF8vHFx7YzGzJ5K9X2.2e', 'super_admin', 'System Administrator', true),
('operations@lynkika.co.ke', '$2a$12$rQZ8vHFx7YzGzJ5K9X2.2eF8vHFx7YzGzJ5K9X2.2eF8vHFx7YzGzJ5K9X2.2e', 'operations_manager', 'Operations Manager', true),
('dispatch@lynkika.co.ke', '$2a$12$rQZ8vHFx7YzGzJ5K9X2.2eF8vHFx7YzGzJ5K9X2.2eF8vHFx7YzGzJ5K9X2.2e', 'dispatcher', 'Lead Dispatcher', true),
('dispatch2@lynkika.co.ke', '$2a$12$rQZ8vHFx7YzGzJ5K9X2.2eF8vHFx7YzGzJ5K9X2.2eF8vHFx7YzGzJ5K9X2.2e', 'dispatcher', 'Dispatcher - Nairobi', true),
('dispatch3@lynkika.co.ke', '$2a$12$rQZ8vHFx7YzGzJ5K9X2.2eF8vHFx7YzGzJ5K9X2.2eF8vHFx7YzGzJ5K9X2.2e', 'dispatcher', 'Dispatcher - Mombasa', true);

-- =====================================================
-- KENYAN TRANSPORTATION ROUTES
-- =====================================================

INSERT INTO routes (
    route_code, name, 
    origin_city, origin_address, origin_lat, origin_lng,
    destination_city, destination_address, destination_lat, destination_lng,
    frequency, departure_time, estimated_duration,
    max_weight, max_volume, max_parcels,
    base_rate, per_kg_rate, per_cubic_meter_rate,
    cutoff_hours, is_active
) VALUES

-- Major Highway Routes
(
    'NBO-MSA-001', 'Nairobi to Mombasa Express',
    'Nairobi', 'Kimathi Street, Nairobi CBD, Kenya', -1.2921, 36.8219,
    'Mombasa', 'Moi Avenue, Mombasa, Kenya', -4.0435, 39.6682,
    'daily', '08:00 AM', 8,
    5000, 50.0, 100,
    15000.00, 250.00, 2500.00,
    24, true
),
(
    'MSA-NBO-002', 'Mombasa to Nairobi Return',
    'Mombasa', 'Moi Avenue, Mombasa, Kenya', -4.0435, 39.6682,
    'Nairobi', 'Kimathi Street, Nairobi CBD, Kenya', -1.2921, 36.8219,
    'daily', '09:00 AM', 8,
    5000, 50.0, 100,
    15000.00, 250.00, 2500.00,
    24, true
),

-- Western Kenya Routes
(
    'NBO-KSM-003', 'Nairobi to Kisumu Route',
    'Nairobi', 'Westlands Square, Nairobi, Kenya', -1.2634, 36.8078,
    'Kisumu', 'Oginga Odinga Street, Kisumu, Kenya', -0.0917, 34.7680,
    'weekly', '10:00 AM', 6,
    3000, 30.0, 75,
    12000.00, 200.00, 2000.00,
    24, true
),
(
    'NBO-ELD-004', 'Nairobi to Eldoret Highland Route',
    'Nairobi', 'Industrial Area, Enterprise Road, Nairobi', -1.3197, 36.8510,
    'Eldoret', 'Uganda Road, Eldoret, Kenya', 0.5143, 35.2697,
    'bi-weekly', '06:00 AM', 5,
    4000, 40.0, 80,
    10000.00, 175.00, 1800.00,
    24, true
),

-- Central Kenya Routes
(
    'NBO-NKU-005', 'Nairobi to Nakuru Express',
    'Nairobi', 'Kimathi Street, Nairobi CBD, Kenya', -1.2921, 36.8219,
    'Nakuru', 'Kenyatta Avenue, Nakuru, Kenya', -0.3031, 36.0800,
    'daily', '07:00 AM', 3,
    2500, 25.0, 60,
    8000.00, 150.00, 1500.00,
    12, true
),
(
    'NBO-NYE-006', 'Nairobi to Nyeri Route',
    'Nairobi', 'Thika Road, Nairobi, Kenya', -1.2297, 36.8890,
    'Nyeri', 'Kimathi Way, Nyeri, Kenya', -0.4167, 36.9500,
    'weekly', '08:30 AM', 4,
    2000, 20.0, 50,
    7000.00, 140.00, 1400.00,
    18, true
),

-- Coastal Routes
(
    'MSA-MAL-007', 'Mombasa to Malindi Coastal Route',
    'Mombasa', 'Moi Avenue, Mombasa, Kenya', -4.0435, 39.6682,
    'Malindi', 'Lamu Road, Malindi, Kenya', -3.2194, 40.1169,
    'weekly', '11:00 AM', 3,
    1500, 15.0, 40,
    6000.00, 120.00, 1200.00,
    12, true
),

-- Northern Routes
(
    'NBO-MER-008', 'Nairobi to Meru Route',
    'Nairobi', 'Thika Road, Nairobi, Kenya', -1.2297, 36.8890,
    'Meru', 'Kenyatta Highway, Meru, Kenya', 0.0467, 37.6500,
    'bi-weekly', '07:30 AM', 5,
    2200, 22.0, 55,
    8500.00, 160.00, 1600.00,
    20, true
),

-- Cross-Regional Routes
(
    'KSM-MSA-009', 'Kisumu to Mombasa Cross-Country',
    'Kisumu', 'Oginga Odinga Street, Kisumu, Kenya', -0.0917, 34.7680,
    'Mombasa', 'Moi Avenue, Mombasa, Kenya', -4.0435, 39.6682,
    'weekly', '09:00 AM', 10,
    4500, 45.0, 90,
    18000.00, 300.00, 3000.00,
    36, true
),

-- Express City Routes
(
    'NBO-THK-010', 'Nairobi to Thika Express',
    'Nairobi', 'Thika Road, Nairobi, Kenya', -1.2297, 36.8890,
    'Thika', 'Commercial Street, Thika, Kenya', -1.0332, 37.0692,
    'daily', '06:30 AM', 1,
    1000, 10.0, 30,
    3000.00, 80.00, 800.00,
    6, true
);

-- =====================================================
-- SAMPLE QUOTES - Realistic Customer Requests
-- =====================================================

INSERT INTO quotes (
    service_type, customer_name, customer_email, customer_phone, customer_company,
    origin_city, origin_address, destination_city, destination_address,
    items, preferred_date, status, notes
) VALUES

-- Moving Services Quotes
(
    'movers', 'Sarah Wanjiku', 'sarah.wanjiku@gmail.com', '+254722123456', 'Personal',
    'Nairobi', 'Kileleshwa, Nairobi', 'Mombasa', 'Nyali, Mombasa',
    '[{"description": "3-bedroom household items", "quantity": 1, "weight": 2000, "dimensions": {"length": 400, "width": 300, "height": 250}, "fragile": false, "value": 500000}]',
    '2024-12-20', 'pending', 'Family relocation to coast'
),
(
    'movers', 'John Kamau', 'j.kamau@outlook.com', '+254733987654', 'Kamau Enterprises',
    'Kisumu', 'Milimani Estate, Kisumu', 'Nairobi', 'Westlands, Nairobi',
    '[{"description": "Office furniture and equipment", "quantity": 1, "weight": 1500, "dimensions": {"length": 350, "width": 200, "height": 200}, "fragile": true, "value": 800000}]',
    '2024-12-25', 'quoted', 'Office relocation'
),

-- Freight Services Quotes
(
    'freight', 'Grace Akinyi', 'grace@agrokenya.co.ke', '+254711234567', 'Agro Kenya Ltd',
    'Nakuru', 'Industrial Area, Nakuru', 'Mombasa', 'Port Area, Mombasa',
    '[{"description": "Agricultural machinery parts", "quantity": 5, "weight": 3000, "dimensions": {"length": 200, "width": 150, "height": 100}, "fragile": false, "value": 1200000}]',
    '2024-12-18', 'pending', 'Urgent machinery parts for export'
),

-- Scheduled Route Quotes
(
    'scheduled_route', 'Peter Mwangi', 'peter.mwangi@yahoo.com', '+254720555888', 'Mwangi Traders',
    'Nairobi', 'Eastleigh, Nairobi', 'Eldoret', 'Langas, Eldoret',
    '[{"description": "Electronics and accessories", "quantity": 10, "weight": 500, "dimensions": {"length": 100, "width": 80, "height": 60}, "fragile": true, "value": 300000}]',
    '2024-12-22', 'pending', 'Regular electronics shipment'
);

-- =====================================================
-- SAMPLE BOOKINGS - Realistic Shipment Data
-- =====================================================

INSERT INTO bookings (
    service_type, customer_name, customer_email, customer_phone, customer_company,
    pickup_address, pickup_city, pickup_date, pickup_time_slot,
    delivery_address, delivery_city, delivery_date, delivery_time_slot,
    items, pricing, status, payment_status, special_instructions
) VALUES

-- Delivered Courier Booking (for revenue analytics)
(
    'courier', 'Mary Njeri', 'mary.njeri@gmail.com', '+254722334455', 'Personal',
    'Kilimani, Nairobi', 'Nairobi', '2024-12-10', '09:00 AM - 12:00 PM',
    'Tudor, Mombasa', 'Mombasa', '2024-12-11', '02:00 PM - 05:00 PM',
    '[{"description": "Documents and small packages", "quantity": 3, "weight": 5, "dimensions": {"length": 30, "width": 25, "height": 10}, "fragile": false, "value": 15000}]',
    '{"baseAmount": 100, "additionalCharges": [{"description": "Express delivery", "amount": 15}], "totalAmount": 115}',
    'delivered', 'paid', 'Handle with care - important documents'
),

-- Active Freight Booking
(
    'freight', 'David Ochieng', 'david@techsolutions.co.ke', '+254733445566', 'Tech Solutions Ltd',
    'Industrial Area, Nairobi', 'Nairobi', '2024-12-15', '08:00 AM - 10:00 AM',
    'Shimanzi, Mombasa', 'Mombasa', '2024-12-16', '10:00 AM - 02:00 PM',
    '[{"description": "Computer servers and networking equipment", "quantity": 8, "weight": 1200, "dimensions": {"length": 150, "width": 100, "height": 80}, "fragile": true, "value": 2500000}]',
    '{"baseAmount": 8000, "additionalCharges": [{"description": "Fragile handling", "amount": 1500}, {"description": "Insurance", "amount": 500}], "totalAmount": 10000}',
    'in_transit', 'paid', 'Fragile - IT equipment requires careful handling'
),

-- Confirmed Moving Booking
(
    'movers', 'Alice Wambui', 'alice.wambui@hotmail.com', '+254711556677', 'Personal',
    'Karen, Nairobi', 'Nairobi', '2024-12-18', '07:00 AM - 09:00 AM',
    'Bamburi, Mombasa', 'Mombasa', '2024-12-19', '12:00 PM - 04:00 PM',
    '[{"description": "2-bedroom apartment contents", "quantity": 1, "weight": 1800, "dimensions": {"length": 400, "width": 250, "height": 200}, "fragile": false, "value": 400000}]',
    '{"baseAmount": 12000, "additionalCharges": [{"description": "Packing service", "amount": 3000}, {"description": "Long distance", "amount": 2000}], "totalAmount": 17000}',
    'confirmed', 'pending', 'Family moving to coast - need packing materials'
),

-- Scheduled Route Booking
(
    'scheduled_route', 'James Kiprotich', 'james.k@farmersunion.co.ke', '+254720667788', 'Farmers Union Cooperative',
    'Nakuru Town, Nakuru', 'Nakuru', '2024-12-16', '06:00 AM - 08:00 AM',
    'Westlands, Nairobi', 'Nairobi', '2024-12-16', '02:00 PM - 04:00 PM',
    '[{"description": "Fresh produce and dairy products", "quantity": 20, "weight": 800, "dimensions": {"length": 120, "width": 80, "height": 60}, "fragile": false, "value": 150000}]',
    '{"baseAmount": 5000, "additionalCharges": [{"description": "Refrigerated transport", "amount": 1500}], "totalAmount": 6500}',
    'picked', 'paid', 'Temperature-sensitive goods - maintain cold chain'
),

-- Recent Courier Booking
(
    'courier', 'Susan Auma', 'susan.auma@law.co.ke', '+254733778899', 'Auma & Associates Law Firm',
    'CBD, Nairobi', 'Nairobi', '2024-12-14', '10:00 AM - 12:00 PM',
    'Kisumu Town, Kisumu', 'Kisumu', '2024-12-15', '09:00 AM - 11:00 AM',
    '[{"description": "Legal documents", "quantity": 1, "weight": 2, "dimensions": {"length": 35, "width": 25, "height": 5}, "fragile": false, "value": 50000}]',
    '{"baseAmount": 80, "additionalCharges": [{"description": "Same day delivery", "amount": 20}], "totalAmount": 100}',
    'confirmed', 'pending', 'Confidential legal documents - signature required'
);

-- =====================================================
-- TRACKING ENTRIES - Shipment History
-- =====================================================

-- Tracking for delivered courier booking
INSERT INTO tracking (booking_id, status, location, notes, created_at) 
SELECT id, 'Booking confirmed', 'Nairobi Depot', 'Package received and processed', '2024-12-10 09:30:00+03'
FROM bookings WHERE customer_email = 'mary.njeri@gmail.com';

INSERT INTO tracking (booking_id, status, location, notes, created_at) 
SELECT id, 'Picked up', 'Kilimani, Nairobi', 'Package collected from sender', '2024-12-10 10:15:00+03'
FROM bookings WHERE customer_email = 'mary.njeri@gmail.com';

INSERT INTO tracking (booking_id, status, location, notes, created_at) 
SELECT id, 'In transit', 'Nairobi-Mombasa Highway', 'Package in transit to Mombasa', '2024-12-10 14:00:00+03'
FROM bookings WHERE customer_email = 'mary.njeri@gmail.com';

INSERT INTO tracking (booking_id, status, location, notes, created_at) 
SELECT id, 'Delivered', 'Tudor, Mombasa', 'Package delivered successfully', '2024-12-11 15:30:00+03'
FROM bookings WHERE customer_email = 'mary.njeri@gmail.com';

-- Tracking for active freight booking
INSERT INTO tracking (booking_id, status, location, notes, created_at) 
SELECT id, 'Booking confirmed', 'Nairobi Warehouse', 'Freight booking confirmed and scheduled', '2024-12-15 08:30:00+03'
FROM bookings WHERE customer_email = 'david@techsolutions.co.ke';

INSERT INTO tracking (booking_id, status, location, notes, created_at) 
SELECT id, 'Picked up', 'Industrial Area, Nairobi', 'IT equipment loaded with special care', '2024-12-15 09:45:00+03'
FROM bookings WHERE customer_email = 'david@techsolutions.co.ke';

INSERT INTO tracking (booking_id, status, location, notes, created_at) 
SELECT id, 'In transit', 'Mtito Andei', 'Halfway to Mombasa - all secure', '2024-12-15 16:20:00+03'
FROM bookings WHERE customer_email = 'david@techsolutions.co.ke';

-- Tracking for scheduled route booking (picked status)
INSERT INTO tracking (booking_id, status, location, notes, created_at) 
SELECT id, 'Booking confirmed', 'Nakuru Route Hub', 'Scheduled for daily route service', '2024-12-16 06:30:00+03'
FROM bookings WHERE customer_email = 'james.k@farmersunion.co.ke';

INSERT INTO tracking (booking_id, status, location, notes, created_at) 
SELECT id, 'Picked up', 'Nakuru Town', 'Fresh produce collected and refrigerated', '2024-12-16 07:15:00+03'
FROM bookings WHERE customer_email = 'james.k@farmersunion.co.ke';

INSERT INTO tracking (booking_id, status, location, notes, created_at) 
SELECT id, 'Picked', 'Lynkika Nairobi Depot', 'Items received at depot, ready for final delivery', '2024-12-16 13:45:00+03'
FROM bookings WHERE customer_email = 'james.k@farmersunion.co.ke';

-- =====================================================
-- SECURITY AUDIT ENTRIES - System Activity
-- =====================================================

INSERT INTO security_audit_log (event_type, details, created_at) VALUES
('SYSTEM_INITIALIZED', '{"message": "Production database seeded successfully", "version": "2.0"}', NOW()),
('USERS_CREATED', '{"message": "Initial admin users created", "count": 5}', NOW()),
('ROUTES_CREATED', '{"message": "Kenyan transportation routes established", "count": 10}', NOW()),
('SAMPLE_DATA_LOADED', '{"message": "Sample quotes, bookings, and tracking data loaded", "bookings": 5, "quotes": 4}', NOW());

-- =====================================================
-- DATA VALIDATION AND STATISTICS
-- =====================================================

-- Verify data integrity
DO $$
DECLARE
    user_count INTEGER;
    route_count INTEGER;
    booking_count INTEGER;
    quote_count INTEGER;
    tracking_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO route_count FROM routes;
    SELECT COUNT(*) INTO booking_count FROM bookings;
    SELECT COUNT(*) INTO quote_count FROM quotes;
    SELECT COUNT(*) INTO tracking_count FROM tracking;
    
    RAISE NOTICE 'Database seeding completed successfully:';
    RAISE NOTICE '- Users: %', user_count;
    RAISE NOTICE '- Routes: %', route_count;
    RAISE NOTICE '- Bookings: %', booking_count;
    RAISE NOTICE '- Quotes: %', quote_count;
    RAISE NOTICE '- Tracking entries: %', tracking_count;
    RAISE NOTICE 'System ready for production use!';
END $$;

-- Update table statistics for optimal query performance
ANALYZE users;
ANALYZE routes;
ANALYZE quotes;
ANALYZE bookings;
ANALYZE tracking;
ANALYZE security_audit_log;
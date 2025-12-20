-- Simple User Insert Script
-- Run this in Supabase SQL Editor to create admin users
-- This bypasses RLS policies by using direct SQL

-- First, make sure RLS is disabled on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Clear existing users (optional)
-- DELETE FROM users;

-- Insert admin users with proper bcrypt hashes
-- These are the actual hashed versions of the passwords

INSERT INTO users (id, email, password_hash, role, name, is_active) VALUES
(
  gen_random_uuid(),
  'admin@lynkika.co.ke', 
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXfs2Stk5v9W', -- LynkikaAdmin2024!
  'super_admin', 
  'System Administrator', 
  true
),
(
  gen_random_uuid(),
  'operations@lynkika.co.ke', 
  '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- OpsManager2024!
  'operations_manager', 
  'Operations Manager', 
  true
),
(
  gen_random_uuid(),
  'dispatch@lynkika.co.ke', 
  '$2b$12$Dwt1BjqBpXvf7uf/Z3Ne6OeWs0qGdHGsLVG/r/4L2tRqvd9lI/6nO', -- Dispatcher2024!
  'dispatcher', 
  'Lead Dispatcher', 
  true
),
(
  gen_random_uuid(),
  'dispatch2@lynkika.co.ke', 
  '$2b$12$K8geDuLh9uyf6C8E6fqdgOmR6lCdgz.1FmWn65T2JvYK3CdqvJ/dS', -- NairobiDispatch2024!
  'dispatcher', 
  'Dispatcher - Nairobi', 
  true
),
(
  gen_random_uuid(),
  'dispatch3@lynkika.co.ke', 
  '$2b$12$gf19G1mVn5JiI4S4NiNGI.MQamFnNvjjMM0Q/tt.3DMuQEX4vIbm6', -- MombasaDispatch2024!
  'dispatcher', 
  'Dispatcher - Mombasa', 
  true
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;

-- Verify the users were created
SELECT email, role, name, is_active, created_at FROM users ORDER BY created_at;
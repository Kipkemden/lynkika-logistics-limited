const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

class UserService {
  async createUser(userData) {
    try {
      const { name, email, password, role } = userData;
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);
      
      const { data, error } = await supabase
        .from('users')
        .insert([{
          name,
          email,
          password_hash: passwordHash,
          role
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Create user error:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('UserService createUser error:', error);
      throw error;
    }
  }

  async findByEmail(email) {
    try {
      console.log('UserService: Looking up user by email:', email);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();
      
      if (error) {
        console.error('UserService findByEmail error:', error);
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        if (error.code === '42P17') {
          // RLS policy error - return null for now
          console.error('RLS policy error detected, returning null');
          return null;
        }
        throw error;
      }
      
      console.log('UserService: User found:', data ? 'Yes' : 'No');
      return data;
    } catch (error) {
      console.error('UserService findByEmail catch error:', error);
      return null; // Return null instead of throwing to prevent crashes
    }
  }

  async findById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, is_active, last_login, created_at')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('UserService findById error:', error);
        if (error.code === '42P17') {
          // RLS policy error
          return null;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('UserService findById catch error:', error);
      return null;
    }
  }

  async updateLastLogin(id) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', id);
      
      if (error) {
        console.error('UserService updateLastLogin error:', error);
        // Don't throw error for last login update - it's not critical
      }
    } catch (error) {
      console.error('UserService updateLastLogin catch error:', error);
      // Silently fail - last login update is not critical
    }
  }

  async comparePassword(candidatePassword, hashedPassword) {
    try {
      return await bcrypt.compare(candidatePassword, hashedPassword);
    } catch (error) {
      console.error('UserService comparePassword error:', error);
      return false;
    }
  }
}

module.exports = new UserService();
const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

class UserService {
  async createUser(userData) {
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
    
    if (error) throw error;
    return data;
  }

  async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, is_active, last_login, created_at')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateLastLogin(id) {
    const { error } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  }

  async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
}

module.exports = new UserService();
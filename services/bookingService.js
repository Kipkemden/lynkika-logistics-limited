const supabase = require('../config/supabase');

class BookingService {
  async createBooking(bookingData) {
    // Format dates properly
    const formatDate = (dateValue) => {
      if (!dateValue) return null;
      
      // If it's already a string in ISO format, return as is
      if (typeof dateValue === 'string' && dateValue.includes('T')) {
        return dateValue;
      }
      
      // If it's a dayjs object or has a format method
      if (dateValue && typeof dateValue.format === 'function') {
        return dateValue.format('YYYY-MM-DD');
      }
      
      // If it's a Date object
      if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0];
      }
      
      // If it's a string, try to parse it
      if (typeof dateValue === 'string') {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      
      return null;
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        service_type: bookingData.serviceType,
        customer_name: bookingData.customer.name,
        customer_email: bookingData.customer.email,
        customer_phone: bookingData.customer.phone,
        customer_company: bookingData.customer.company || null,
        pickup_address: bookingData.pickup.address,
        pickup_city: bookingData.pickup.city,
        pickup_date: formatDate(bookingData.pickup.date),
        pickup_time_slot: bookingData.pickup.timeSlot || null,
        pickup_contact_person: bookingData.pickup.contactPerson || null,
        pickup_contact_phone: bookingData.pickup.contactPhone || null,
        pickup_instructions: bookingData.pickup.instructions || null,
        delivery_address: bookingData.delivery.address,
        delivery_city: bookingData.delivery.city,
        delivery_date: formatDate(bookingData.delivery.date),
        delivery_time_slot: bookingData.delivery.timeSlot || null,
        delivery_contact_person: bookingData.delivery.contactPerson || null,
        delivery_contact_phone: bookingData.delivery.contactPhone || null,
        delivery_instructions: bookingData.delivery.instructions || null,
        items: JSON.stringify(bookingData.items),
        route_id: bookingData.route || null,
        pricing: JSON.stringify(bookingData.pricing),
        assigned_vehicle_plate: bookingData.assignedVehicle?.plateNumber || null,
        assigned_driver_name: bookingData.assignedVehicle?.driverName || null,
        assigned_driver_phone: bookingData.assignedVehicle?.driverPhone || null,
        special_instructions: bookingData.specialInstructions || null,
        status: 'confirmed'
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Add initial tracking entry
    await this.addTrackingEntry(data.id, {
      status: 'Booking confirmed',
      location: bookingData.pickup.city,
      notes: 'Booking created and confirmed'
    });
    
    return data;
  }

  async getBookingByReference(reference) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        routes (*)
      `)
      .eq('booking_reference', reference)
      .single();
    
    if (error) throw error;
    
    // Parse JSON fields
    if (data.items) data.items = JSON.parse(data.items);
    if (data.pricing) data.pricing = JSON.parse(data.pricing);
    
    return data;
  }

  async getBookings(filters = {}, page = 1, limit = 20) {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        routes (*)
      `, { count: 'exact' });
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.serviceType) {
      query = query.eq('service_type', filters.serviceType);
    }
    
    const offset = (page - 1) * limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    // Parse JSON fields
    const bookings = data.map(booking => ({
      ...booking,
      items: booking.items ? JSON.parse(booking.items) : [],
      pricing: booking.pricing ? JSON.parse(booking.pricing) : null
    }));
    
    return {
      bookings,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    };
  }

  async updateBookingStatus(id, statusData, updatedBy) {
    // Update booking status
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ status: statusData.status })
      .eq('id', id);
    
    if (bookingError) throw bookingError;
    
    // Add tracking entry
    await this.addTrackingEntry(id, {
      status: statusData.status,
      location: statusData.location,
      notes: statusData.notes,
      updated_by: updatedBy
    });
    
    return await this.getBookingById(id);
  }

  async getBookingById(id) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        routes (*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    // Parse JSON fields
    if (data.items) data.items = JSON.parse(data.items);
    if (data.pricing) data.pricing = JSON.parse(data.pricing);
    
    return data;
  }

  async addTrackingEntry(bookingId, trackingData) {
    const { error } = await supabase
      .from('tracking')
      .insert([{
        booking_id: bookingId,
        status: trackingData.status,
        location: trackingData.location,
        notes: trackingData.notes,
        updated_by: trackingData.updated_by
      }]);
    
    if (error) throw error;
  }

  async getTrackingHistory(bookingId) {
    const { data, error } = await supabase
      .from('tracking')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  async getBookingsForRoute(routeId, date) {
    try {
      // Format date properly for PostgreSQL
      const targetDate = new Date(date);
      const dateStr = targetDate.toISOString().split('T')[0]; // Get YYYY-MM-DD format
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('route_id', routeId)
        .eq('pickup_date', dateStr)
        .in('status', ['confirmed', 'in_transit']);
      
      if (error) throw error;
      
      return data.map(booking => ({
        ...booking,
        items: booking.items ? JSON.parse(booking.items) : []
      }));
    } catch (error) {
      console.error('Error in getBookingsForRoute:', error);
      return []; // Return empty array on error to prevent crashes
    }
  }

  async getDashboardStats() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
    
    // Today's bookings
    const { count: todayBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);
    
    // Active bookings
    const { count: activeBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['confirmed', 'in_transit', 'picked']);
    
    return {
      todayBookings: todayBookings || 0,
      activeBookings: activeBookings || 0
    };
  }

  async getIncomeAnalytics(userRole) {
    // Only super admin and operations manager can see detailed income
    if (!['super_admin', 'operations_manager'].includes(userRole)) {
      return {
        todayRevenue: 0,
        weeklyRevenue: 0,
        monthlyRevenue: 0,
        totalRevenue: 0,
        revenueByService: [],
        monthlyTrend: []
      };
    }

    try {
      // Get current date boundaries
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get all delivered bookings with pricing - use created_at for revenue recognition
      const { data: deliveredBookings, error } = await supabase
        .from('bookings')
        .select('pricing, service_type, created_at, updated_at')
        .eq('status', 'delivered')
        .not('pricing', 'is', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      let todayRevenue = 0;
      let weeklyRevenue = 0;
      let monthlyRevenue = 0;
      let totalRevenue = 0;
      const revenueByService = {};
      const monthlyTrend = {};

      deliveredBookings.forEach(booking => {
        try {
          const pricing = typeof booking.pricing === 'string' ? JSON.parse(booking.pricing) : booking.pricing;
          const amount = parseFloat(pricing?.totalAmount || 0);
          
          if (amount <= 0) return; // Skip bookings with no revenue
          
          const bookingDate = new Date(booking.created_at);
          
          totalRevenue += amount;
          
          // Today's revenue (bookings created today)
          if (bookingDate >= today) {
            todayRevenue += amount;
          }
          
          // Weekly revenue (bookings created this week)
          if (bookingDate >= startOfWeek) {
            weeklyRevenue += amount;
          }
          
          // Monthly revenue (bookings created this month)
          if (bookingDate >= startOfMonth) {
            monthlyRevenue += amount;
          }
          
          // Revenue by service type
          const serviceType = booking.service_type || 'unknown';
          revenueByService[serviceType] = (revenueByService[serviceType] || 0) + amount;
          
          // Monthly trend (last 12 months for better analysis)
          const monthKey = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;
          monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + amount;
        } catch (parseError) {
          console.warn('Error parsing booking pricing:', parseError, booking);
        }
      });

      // Convert revenue by service to array with proper formatting
      const revenueByServiceArray = Object.entries(revenueByService)
        .map(([service, revenue]) => ({
          service: service.replace('_', ' ').toUpperCase(),
          revenue: Math.round(revenue * 100) / 100, // Round to 2 decimal places
          percentage: totalRevenue > 0 ? ((revenue / totalRevenue) * 100).toFixed(1) : '0.0'
        }))
        .sort((a, b) => b.revenue - a.revenue); // Sort by revenue descending

      // Convert monthly trend to array (last 12 months)
      const monthlyTrendArray = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyTrendArray.push({
          month: monthName,
          revenue: Math.round((monthlyTrend[monthKey] || 0) * 100) / 100 // Round to 2 decimal places
        });
      }

      return {
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        weeklyRevenue: Math.round(weeklyRevenue * 100) / 100,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        revenueByService: revenueByServiceArray,
        monthlyTrend: monthlyTrendArray
      };
    } catch (error) {
      console.error('Error getting income analytics:', error);
      return {
        todayRevenue: 0,
        weeklyRevenue: 0,
        monthlyRevenue: 0,
        totalRevenue: 0,
        revenueByService: [],
        monthlyTrend: []
      };
    }
  }

  // Status progression validation - prevents backward status changes
  validateStatusProgression(currentStatus, newStatus, userRole) {
    const statusHierarchy = {
      'pending': 0,
      'confirmed': 1,
      'picked': 2,      // Only super_admin and operations_manager can set this
      'in_transit': 3,
      'delivered': 4,
      'cancelled': -1   // Can be set from any status
    };

    // Allow cancellation from any status
    if (newStatus === 'cancelled') {
      return { valid: true };
    }

    // Check if user has permission to set 'picked' status
    if (newStatus === 'picked' && !['super_admin', 'operations_manager'].includes(userRole)) {
      return { 
        valid: false, 
        message: 'Only Super Admin and Operations Manager can mark items as picked from store' 
      };
    }

    const currentLevel = statusHierarchy[currentStatus];
    const newLevel = statusHierarchy[newStatus];

    // Prevent backward progression (except from picked to in_transit)
    if (newLevel < currentLevel && !(currentStatus === 'picked' && newStatus === 'in_transit')) {
      return { 
        valid: false, 
        message: `Cannot change status backward from ${currentStatus.replace('_', ' ')} to ${newStatus.replace('_', ' ')}` 
      };
    }

    // Validate specific transitions
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['picked', 'in_transit', 'cancelled'],
      'picked': ['in_transit', 'cancelled'],
      'in_transit': ['delivered', 'cancelled'],
      'delivered': [], // Final status - no transitions allowed
      'cancelled': []  // Final status - no transitions allowed
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return { 
        valid: false, 
        message: `Invalid status transition from ${currentStatus.replace('_', ' ')} to ${newStatus.replace('_', ' ')}` 
      };
    }

    return { valid: true };
  }
}

module.exports = new BookingService();
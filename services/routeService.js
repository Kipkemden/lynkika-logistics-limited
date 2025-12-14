const supabase = require('../config/supabase');

class RouteService {
  async getAllRoutes(activeOnly = false) {
    let query = supabase.from('routes').select('*');
    
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async getRouteById(id) {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createRoute(routeData) {
    const { data, error } = await supabase
      .from('routes')
      .insert([{
        route_code: routeData.routeCode,
        name: routeData.name,
        origin_city: routeData.origin.city,
        origin_address: routeData.origin.address,
        origin_lat: routeData.origin.coordinates?.lat,
        origin_lng: routeData.origin.coordinates?.lng,
        destination_city: routeData.destination.city,
        destination_address: routeData.destination.address,
        destination_lat: routeData.destination.coordinates?.lat,
        destination_lng: routeData.destination.coordinates?.lng,
        frequency: routeData.schedule.frequency,
        departure_time: routeData.schedule.departureTime,
        estimated_duration: routeData.schedule.estimatedDuration,
        max_weight: routeData.capacity.maxWeight,
        max_volume: routeData.capacity.maxVolume,
        max_parcels: routeData.capacity.maxParcels,
        base_rate: routeData.pricing.baseRate,
        per_kg_rate: routeData.pricing.perKgRate,
        per_cubic_meter_rate: routeData.pricing.perCubicMeterRate,
        is_active: routeData.isActive,
        cutoff_hours: routeData.cutoffHours
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateRoute(id, routeData) {
    const { data, error } = await supabase
      .from('routes')
      .update({
        route_code: routeData.routeCode,
        name: routeData.name,
        origin_city: routeData.origin.city,
        origin_address: routeData.origin.address,
        origin_lat: routeData.origin.coordinates?.lat,
        origin_lng: routeData.origin.coordinates?.lng,
        destination_city: routeData.destination.city,
        destination_address: routeData.destination.address,
        destination_lat: routeData.destination.coordinates?.lat,
        destination_lng: routeData.destination.coordinates?.lng,
        frequency: routeData.schedule.frequency,
        departure_time: routeData.schedule.departureTime,
        estimated_duration: routeData.schedule.estimatedDuration,
        max_weight: routeData.capacity.maxWeight,
        max_volume: routeData.capacity.maxVolume,
        max_parcels: routeData.capacity.maxParcels,
        base_rate: routeData.pricing.baseRate,
        per_kg_rate: routeData.pricing.perKgRate,
        per_cubic_meter_rate: routeData.pricing.perCubicMeterRate,
        is_active: routeData.isActive,
        cutoff_hours: routeData.cutoffHours
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async findRouteByOriginDestination(originCity, destinationCity) {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('origin_city', originCity)
      .eq('destination_city', destinationCity)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}

module.exports = new RouteService();
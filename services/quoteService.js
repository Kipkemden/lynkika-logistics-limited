const supabase = require('../config/supabase');

class QuoteService {
  async createQuote(quoteData) {
    const { data, error } = await supabase
      .from('quotes')
      .insert([{
        service_type: quoteData.serviceType,
        customer_name: quoteData.customer.name,
        customer_email: quoteData.customer.email,
        customer_phone: quoteData.customer.phone,
        customer_company: quoteData.customer.company,
        origin_city: quoteData.origin.city,
        origin_address: quoteData.origin.address,
        destination_city: quoteData.destination.city,
        destination_address: quoteData.destination.address,
        items: JSON.stringify(quoteData.items),
        preferred_date: quoteData.preferredDate,
        estimated_price: quoteData.estimatedPrice ? JSON.stringify(quoteData.estimatedPrice) : null,
        status: quoteData.estimatedPrice ? 'quoted' : 'pending'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getQuoteByReference(reference) {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('quote_reference', reference)
      .single();
    
    if (error) throw error;
    
    // Parse JSON fields
    if (data.items) data.items = JSON.parse(data.items);
    if (data.estimated_price) data.estimated_price = JSON.parse(data.estimated_price);
    
    return data;
  }

  async getAllQuotes() {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        users!quotes_processed_by_fkey (name, email)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(quote => ({
      ...quote,
      items: quote.items ? JSON.parse(quote.items) : [],
      estimated_price: quote.estimated_price ? JSON.parse(quote.estimated_price) : null
    }));
  }

  async updateQuote(id, updateData, processedBy) {
    const { data, error } = await supabase
      .from('quotes')
      .update({
        ...updateData,
        processed_by: processedBy,
        estimated_price: updateData.estimatedPrice ? JSON.stringify(updateData.estimatedPrice) : null
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getDashboardStats() {
    const { count: pendingQuotes } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    return {
      pendingQuotes: pendingQuotes || 0
    };
  }
}

module.exports = new QuoteService();
const express = require('express');
const quoteService = require('../services/quoteService');
const routeService = require('../services/routeService');
const { publicApiLimiter, sanitizeResponse } = require('../middleware/auth');

const router = express.Router();

// Apply rate limiting to all quote routes
router.use(publicApiLimiter);

// Submit quote request - public but rate limited
router.post('/', 
  sanitizeResponse(['message', 'quoteReference', 'estimatedPrice']),
  async (req, res) => {
  try {
    const quoteData = req.body;
    
    // Calculate estimated price based on service type
    if (quoteData.serviceType === 'scheduled_route') {
      const route = await routeService.findRouteByOriginDestination(
        quoteData.origin.city,
        quoteData.destination.city
      );
      
      if (route) {
        let totalWeight = 0;
        let totalVolume = 0;
        
        quoteData.items.forEach(item => {
          totalWeight += item.weight || 0;
          if (item.dimensions) {
            const volume = (item.dimensions.length * item.dimensions.width * item.dimensions.height) / 1000000; // convert to cubic meters
            totalVolume += volume * item.quantity;
          }
        });
        
        const baseAmount = route.base_rate;
        const weightCharge = totalWeight * route.per_kg_rate;
        const volumeCharge = totalVolume * route.per_cubic_meter_rate;
        
        quoteData.estimatedPrice = {
          baseAmount,
          additionalCharges: [
            { description: 'Weight charge', amount: weightCharge },
            { description: 'Volume charge', amount: volumeCharge }
          ],
          totalAmount: baseAmount + weightCharge + volumeCharge
        };
      }
    }
    
    const quote = await quoteService.createQuote(quoteData);
    
    res.status(201).json({
      message: 'Quote request submitted successfully',
      quoteReference: quote.quote_reference,
      estimatedPrice: quote.estimated_price ? JSON.parse(quote.estimated_price) : null
    });
  } catch (error) {
    console.error('Quote creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get quote by reference - public but rate limited and sanitized
router.get('/:reference', 
  sanitizeResponse(['quote_reference', 'service_type', 'status', 'estimated_price', 'valid_until', 'created_at']),
  async (req, res) => {
  try {
    const quote = await quoteService.getQuoteByReference(req.params.reference);
    
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }
    
    res.json(quote);
  } catch (error) {
    console.error('Get quote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
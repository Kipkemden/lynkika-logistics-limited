// Performance monitoring and analytics utilities

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.initialized = false;
    this.init();
  }

  init() {
    if (this.initialized) return;
    
    // Monitor Core Web Vitals
    this.observeWebVitals();
    
    // Monitor resource loading
    this.observeResourceTiming();
    
    // Monitor navigation timing
    this.observeNavigationTiming();
    
    this.initialized = true;
  }

  observeWebVitals() {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('LCP', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        this.recordMetric('FID', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.recordMetric('CLS', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  observeResourceTiming() {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
          this.recordMetric('API_Response_Time', entry.duration, {
            url: entry.name,
            method: 'API_CALL'
          });
        }
      });
    }).observe({ entryTypes: ['resource'] });
  }

  observeNavigationTiming() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        this.recordMetric('Page_Load_Time', navigation.loadEventEnd - navigation.fetchStart);
        this.recordMetric('DOM_Content_Loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
        this.recordMetric('Time_To_Interactive', navigation.domInteractive - navigation.fetchStart);
      }
    });
  }

  recordMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.pathname,
      userAgent: navigator.userAgent,
      ...metadata
    };

    this.metrics.set(`${name}_${Date.now()}`, metric);
    
    // Send to analytics endpoint
    this.sendMetric(metric);
  }

  async sendMetric(metric) {
    try {
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric)
      });
    } catch (error) {
      console.warn('Failed to send performance metric:', error);
    }
  }

  // Business event tracking
  trackEvent(eventName, properties = {}) {
    const event = {
      event: eventName,
      properties: {
        ...properties,
        timestamp: Date.now(),
        url: window.location.pathname,
        userAgent: navigator.userAgent,
        sessionId: this.getSessionId()
      }
    };

    this.sendEvent(event);
  }

  async sendEvent(event) {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.warn('Failed to send analytics event:', error);
    }
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  // Get performance summary
  getPerformanceSummary() {
    const summary = {};
    this.metrics.forEach((metric, key) => {
      if (!summary[metric.name]) {
        summary[metric.name] = [];
      }
      summary[metric.name].push(metric.value);
    });

    // Calculate averages
    Object.keys(summary).forEach(key => {
      const values = summary[key];
      summary[key] = {
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    });

    return summary;
  }
}

// Create global instance
const performanceMonitor = new PerformanceMonitor();

// Export utilities
export const trackEvent = (eventName, properties) => {
  performanceMonitor.trackEvent(eventName, properties);
};

export const recordMetric = (name, value, metadata) => {
  performanceMonitor.recordMetric(name, value, metadata);
};

export const getPerformanceSummary = () => {
  return performanceMonitor.getPerformanceSummary();
};

export default performanceMonitor;
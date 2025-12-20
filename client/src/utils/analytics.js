// Performance monitoring and analytics utilities

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.initialized = false;
    this.init();
  }

  init() {
    if (this.initialized) return;
    
    // Only initialize in production and if analytics are enabled
    if (process.env.NODE_ENV === 'production') {
      this.observeWebVitals();
      this.observeNavigationTiming();
    }
    
    this.initialized = true;
    console.log('📊 Analytics initialized for', process.env.NODE_ENV);
  }

  observeWebVitals() {
    // Largest Contentful Paint (LCP)
    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('LCP', lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('LCP observer not supported');
    }

    // First Input Delay (FID)
    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          this.recordMetric('FID', entry.processingStart - entry.startTime);
        });
      }).observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('FID observer not supported');
    }

    // Cumulative Layout Shift (CLS)
    try {
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
    } catch (error) {
      console.warn('CLS observer not supported');
    }
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
    
    // Send to analytics endpoint with retry logic
    this.sendMetricWithRetry(metric);
  }

  async sendMetricWithRetry(metric, retries = 2) {
    try {
      const response = await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric)
      });

      if (!response.ok && retries > 0) {
        // Retry after a delay
        setTimeout(() => this.sendMetricWithRetry(metric, retries - 1), 1000);
      }
    } catch (error) {
      // Silently fail - don't spam console or retry on network errors
      if (retries > 0) {
        setTimeout(() => this.sendMetricWithRetry(metric, retries - 1), 2000);
      }
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

    this.sendEventWithRetry(event);
  }

  async sendEventWithRetry(event, retries = 2) {
    try {
      const response = await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });

      if (!response.ok && retries > 0) {
        setTimeout(() => this.sendEventWithRetry(event, retries - 1), 1000);
      }
    } catch (error) {
      if (retries > 0) {
        setTimeout(() => this.sendEventWithRetry(event, retries - 1), 2000);
      }
    }
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  // Get performance summary
  getPerformanceSummary() {
    const summary = {};
    this.metrics.forEach((metric) => {
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